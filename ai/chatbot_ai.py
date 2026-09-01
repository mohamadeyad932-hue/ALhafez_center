"""AI Chatbot module for ALhafez Store."""
import asyncio
import json
import logging
import os
import re
import shutil
import sys
import traceback
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))

from backend.app.auth import get_current_admin
from backend.app.config import get_settings
from backend.app.database import SessionLocal, get_db
from backend.app.models import Conversation, Message, Product, SenderType, User, Company
from backend.app.schemas import ChatRequest, ChatResponse, ProductResponse

try:
    from langchain_classic.agents import AgentExecutor
except ImportError:
    from langchain.agents.agent import AgentExecutor

try:
    from langchain_classic.agents import create_tool_calling_agent as _agent_factory
except ImportError:
    try:
        from langchain.agents import create_tool_calling_agent as _agent_factory
    except ImportError:
        from langchain.agents import create_openai_tools_agent as _agent_factory

try:
    from langchain_core.tools import create_retriever_tool
except ImportError:
    from langchain.tools.retriever import create_retriever_tool

from langchain_chroma import Chroma
from langchain_community.document_loaders import (
    Docx2txtLoader,
    PyPDFLoader,
    TextLoader,
    UnstructuredExcelLoader,
)
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

settings = get_settings()
router = APIRouter()

AI_BASE_DIR = Path(__file__).resolve().parent
CHROMA_DIR = AI_BASE_DIR / "chroma_db_v2"
KNOWLEDGE_DIR = AI_BASE_DIR / "knowledge_base"

CHROMA_DIR.mkdir(exist_ok=True)
KNOWLEDGE_DIR.mkdir(exist_ok=True)

MAX_UPLOAD_SIZE = 10 * 1024 * 1024
TEXT_SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=150,
    separators=["\n\n", "\n", ".", "،", " ", ""],
)

llm = None
embeddings = None
vectorstore = None
retriever_tool = None
executor = None
OPENROUTER_PRIMARY_MODEL = "openai/gpt-4o-mini"
OPENROUTER_FALLBACK_MODEL = "google/gemini-pro-1.5"
openrouter_model_in_use = OPENROUTER_PRIMARY_MODEL


class SimpleHashEmbeddings:
    """Simple hash-based embeddings for fallback when no API key is available."""

    def __init__(self, size: int = 768):
        self.size = size

    def _embed(self, text: str):
        import hashlib
        vector = [0.0] * self.size
        tokens = (text or "").lower().split()
        for i, token in enumerate(tokens):
            h1 = int(hashlib.md5(token.encode()).hexdigest(), 16)
            h2 = int(hashlib.sha256(token.encode()).hexdigest(), 16)
            idx1 = h1 % self.size
            idx2 = h2 % self.size
            vector[idx1] += 1.0
            vector[idx2] += 0.5
            if i > 0:
                bigram = tokens[i - 1] + "_" + token
                h3 = int(hashlib.md5(bigram.encode()).hexdigest(), 16)
                vector[h3 % self.size] += 0.3
        norm = sum(v * v for v in vector) ** 0.5 or 1.0
        return [v / norm for v in vector]

    def embed_documents(self, texts):
        return [self._embed(text) for text in texts]

    def embed_query(self, text):
        return self._embed(text)


def _build_openrouter_llm(model_name: str):
    """Build an OpenRouter LLM instance."""
    def _ascii_header_value(value: str, fallback: str) -> str:
        try:
            value.encode("ascii")
            return value
        except Exception:
            return fallback

    openrouter_referer = os.getenv("OPENROUTER_HTTP_REFERER") or os.getenv(
        "NEXT_PUBLIC_SITE_URL", "http://localhost:3000"
    )
    openrouter_title_raw = os.getenv("OPENROUTER_X_TITLE") or os.getenv(
        "OPENROUTER_APP_NAME", "WEB_HAFAZE"
    )
    openrouter_title = _ascii_header_value(openrouter_title_raw, "WEB_HAFAZE")

    return ChatOpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        model=model_name,
        base_url="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": openrouter_referer,
            "X-Title": openrouter_title,
        },
        temperature=0.7,
        max_retries=2,
    )


def _switch_openrouter_to_fallback():
    """Switch to fallback OpenRouter model on 404."""
    global llm, executor, openrouter_model_in_use

    if not settings.OPENROUTER_API_KEY:
        return None
    if openrouter_model_in_use == OPENROUTER_FALLBACK_MODEL:
        return llm

    logger.warning("OpenRouter 404 detected. Switching to fallback model: %s", OPENROUTER_FALLBACK_MODEL)
    openrouter_model_in_use = OPENROUTER_FALLBACK_MODEL
    llm = _build_openrouter_llm(OPENROUTER_FALLBACK_MODEL)
    executor = None
    return llm


def _build_llm():
    """Build the LLM based on available API keys."""
    global openrouter_model_in_use

    if settings.OPENROUTER_API_KEY:
        openrouter_model_in_use = OPENROUTER_PRIMARY_MODEL
        logger.info("Using OpenRouter model: %s", openrouter_model_in_use)
        return _build_openrouter_llm(openrouter_model_in_use)

    if settings.GOOGLE_API_KEY:
        from langchain_google_genai import ChatGoogleGenerativeAI
        logger.info("Using Google Generative AI directly")
        return ChatGoogleGenerativeAI(
            google_api_key=settings.GOOGLE_API_KEY,
            model="gemini-1.5-flash-latest",
            temperature=0.1,
            max_retries=2,
            timeout=30,
        )

    logger.warning("AI service not configured: no OPENROUTER_API_KEY or GOOGLE_API_KEY.")
    return None


def _build_embeddings():
    """Build embeddings model."""
    if settings.GOOGLE_API_KEY:
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            return GoogleGenerativeAIEmbeddings(
                google_api_key=settings.GOOGLE_API_KEY,
       model=getattr(settings, "GOOGLE_EMBEDDING_MODEL", "models/text-embedding-004"),

            )
        except Exception as e:
            logger.error("Failed to load Google Embeddings: %s", e)
            
    return SimpleHashEmbeddings(size=768)


def _ensure_vectorstore():
    """Ensure vectorstore is initialized."""
    global embeddings, vectorstore

    if vectorstore is not None:
        return vectorstore

    if embeddings is None:
        embeddings = _build_embeddings()

    if embeddings is None:
        return None

    try:
        vectorstore = Chroma(
            collection_name="bot_knowledge",
            embedding_function=embeddings,
            persist_directory=str(CHROMA_DIR),
        )
    except Exception as exc:
        logger.error("Vectorstore init failed: %s", exc)
        vectorstore = None

    return vectorstore


def _safe_knowledge_path(filename: str) -> Path:
    """Validate and return safe knowledge file path."""
    safe_name = os.path.basename(filename or "")
    if not safe_name or safe_name != filename:
        raise HTTPException(400, detail="اسم الملف غير صالح.")
    path = KNOWLEDGE_DIR / safe_name
    if path.suffix.lower() != ".docx":
        raise HTTPException(400, detail="عذراً، يُسمح فقط برفع ملفات Word بصيغة (.docx) فقط.")
    return path


def _list_knowledge_files():
    """List all knowledge files."""
    files = []
    for path in KNOWLEDGE_DIR.iterdir():
        if path.is_file() and path.suffix.lower() in _LOADER_MAP:
            files.append(path.name)
    return sorted(files)


def _split_file_into_docs(path: Path):
    """Load and split a file into documents with proper metadata."""
    loader = _LOADER_MAP[path.suffix.lower()](str(path))
    raw_docs = loader.load()

    # Ensure every document has proper source metadata
    for doc in raw_docs:
        doc.metadata["source"] = str(path)
        doc.metadata["filename"] = path.name

    return TEXT_SPLITTER.split_documents(raw_docs)


def _reset_index_state():
    """Reset all index state and rebuild from scratch."""
    global vectorstore, executor, retriever_tool
    vectorstore = None
    executor = None
    retriever_tool = None
    shutil.rmtree(CHROMA_DIR, ignore_errors=True)
    CHROMA_DIR.mkdir(exist_ok=True)


def _switch_to_local_embeddings():
    """Fallback to local embeddings if API-based ones fail."""
    global embeddings
    embeddings = SimpleHashEmbeddings(size=256)
    _reset_index_state()
    return _ensure_vectorstore()


def _reindex_all_files_sync(current_vectorstore):
    """Synchronously reindex all knowledge files into a fresh vectorstore."""
    indexed_files = 0
    chunk_count = 0
    for filename in _list_knowledge_files():
        file_path = KNOWLEDGE_DIR / filename
        try:
            docs = _split_file_into_docs(file_path)
            if docs:
                current_vectorstore.add_documents(docs)
                indexed_files += 1
                chunk_count += len(docs)
        except Exception as exc:
            logger.error("Failed to sync-index file %s: %s", filename, exc)
    return {"indexed_files": indexed_files, "chunks": chunk_count}


def _ensure_retrieval_ready():
    """Ensure embedding queries are operational; fallback locally when needed."""
    active_vectorstore = _ensure_vectorstore()
    if active_vectorstore is None:
        return None

    current_embeddings = embeddings
    if current_embeddings is None:
        return active_vectorstore

    try:
        current_embeddings.embed_query("healthcheck")
        return active_vectorstore
    except Exception as exc:
        logger.warning("Embedding probe failed, switching to local fallback: %s", exc)
        fallback_vectorstore = _switch_to_local_embeddings()
        if fallback_vectorstore is None:
            return active_vectorstore
        stats = _reindex_all_files_sync(fallback_vectorstore)
        logger.info(
            "Fallback local reindex done: %d files, %d chunks",
            stats["indexed_files"],
            stats["chunks"],
        )
        return fallback_vectorstore


async def _refresh_knowledge_index():
    """Rebuild the entire knowledge index from all files."""
    _reset_index_state()
    active_vectorstore = _ensure_vectorstore()
    if active_vectorstore is None:
        return {
            "ok": False,
            "message": "تم حفظ الملفات، لكن الفهرسة غير متاحة حالياً.",
            "indexed_files": 0,
            "chunks": 0,
        }

    loop = asyncio.get_event_loop()
    files = _list_knowledge_files()
    indexed_files = 0
    chunk_count = 0

    async def _index_all(current_vectorstore):
        nonlocal indexed_files, chunk_count
        indexed_files = 0
        chunk_count = 0
        for filename in files:
            file_path = KNOWLEDGE_DIR / filename
            try:
                docs = await loop.run_in_executor(None, lambda p=file_path: _split_file_into_docs(p))
                if docs:
                    chunk_count += len(docs)
                    indexed_files += 1
                    await loop.run_in_executor(
                        None, lambda d=docs: current_vectorstore.add_documents(d)
                    )
                    logger.info("Indexed file: %s (%d chunks)", filename, len(docs))
            except Exception as exc:
                logger.error("Failed to index file %s: %s", filename, exc)

    try:
        await _index_all(active_vectorstore)
    except Exception as exc:
        logger.error("Primary embedding failed during refresh: %s", exc)
        fallback_vectorstore = _switch_to_local_embeddings()
        if fallback_vectorstore is None:
            return {
                "ok": False,
                "message": "تم حفظ الملفات، لكن فشلت الفهرسة.",
                "indexed_files": 0,
                "chunks": 0,
            }
        await _index_all(fallback_vectorstore)

    ensure_agent()
    return {
        "ok": True,
        "message": f"تم تحديث قاعدة المعرفة بنجاح. ({indexed_files} ملفات, {chunk_count} جزء)",
        "indexed_files": indexed_files,
        "chunks": chunk_count,
    }


async def _index_single_file(path: Path):
    """Index a single file into the vectorstore."""
    active_vectorstore = _ensure_vectorstore()
    if active_vectorstore is None:
        return {"ok": False, "message": "الفهرسة غير متاحة حالياً.", "chunks": 0}

    loop = asyncio.get_event_loop()
    try:
        docs = await loop.run_in_executor(None, lambda p=path: _split_file_into_docs(p))
    except Exception as exc:
        return {"ok": False, "message": f"فشل تحليل الملف: {exc}", "chunks": 0}

    try:
        if docs:
            await loop.run_in_executor(None, lambda d=docs: active_vectorstore.add_documents(d))
            logger.info("Indexed single file: %s (%d chunks)", path.name, len(docs))
    except Exception as exc:
        logger.error("Primary embedding failed during upload: %s", exc)
        fallback_vectorstore = _switch_to_local_embeddings()
        if fallback_vectorstore is None:
            return {"ok": False, "message": "فشلت الفهرسة.", "chunks": 0}
        if docs:
            await loop.run_in_executor(None, lambda d=docs: fallback_vectorstore.add_documents(d))

    global executor
    executor = None
    ensure_agent()
    return {
        "ok": True,
        "message": f"تم فهرسة الملف بنجاح ({len(docs)} جزء).",
        "chunks": len(docs),
    }


@tool
def search_inventory(query: str) -> str:
    """استخدم هذه الأداة للبحث عن المنتجات (اسم، وصف، فئة). تبحث بذكاء عن المفرد والجمع."""
    db = SessionLocal()
    try:
        # 1. تنظيف الكلمات وحذف الزوائد والهمزات للبحث بمرونة
        def normalize_arabic(text):
            text = text.strip().lower()
            # استبدال الهمزات بالألف العادية
            text = re.sub("[إأآ]", "ا", text)
            # حذف الـ التعريف
            if text.startswith("ال") and len(text) > 3:
                text = text[2:]
            # التعامل مع الجمع والمفرد (تبسيط)
            if text.endswith("ات") and len(text) > 4: # غسالات -> غسالة
                text = text[:-2]
            if text.startswith("ا") and text.endswith("ان") and len(text) > 4: # افران -> فرن
                text = text[1:-2]
            return text

        raw_terms = query.strip().split()
        search_terms = []
        for term in raw_terms:
            if len(term) >= 2:
                # الكلمة الأصلية والكلمة المنظمة
                search_terms.append(term)
                normalized = normalize_arabic(term)
                if normalized != term:
                    search_terms.append(normalized)

        if not search_terms:
            return "يرجى تحديد اسم المنتج للبحث عن توفره."

        # 2. بناء الاستعلام باستخدام OR لضمان العثور على نتائج حتى لو كانت هناك كلمات زائدة
        # قمنا بإضافة انضمام (Join) مع جدول الشركات للبحث في اسم الماركة أيضاً
        q = db.query(Product).outerjoin(Company).options(
            joinedload(Product.images), 
            joinedload(Product.company)
        )
        
        conditions = []
        unique_terms = list(set(search_terms))
        for t in unique_terms:
            pattern = f"%{t}%"
            conditions.append(Product.name.ilike(pattern))
            conditions.append(Product.description.ilike(pattern))
            conditions.append(Product.category.ilike(pattern))
            conditions.append(Company.name.ilike(pattern)) # <--- البحث في اسم الشركة (مثل رامكو)

        # استخدام or_ لربط جميع الشروط
        q = q.filter(or_(*conditions))
        
        products = q.limit(6).all()

        if not products:
            return "لم يتم العثور على منتجات مطابقة في المخزون حالياً. جرب كلمات أبسط."

        # 3. تنسيق النتائج
        results = []
        found_ids = []
        for product in products:
            company_name = product.company.name if product.company else "غير محدد"

            results.append(
                f"- {product.name} | الشركة: {company_name} | السعر: {product.price}$ | الحالة: {product.stock_status}"
            )
            found_ids.append(product.id)

        return (
            "نتائج البحث في المتجر:\n"
            + "\n".join(results)
            + f"\n\n[SYSTEM_PRODUCT_IDS:{json.dumps(found_ids)}]"
        )
    except Exception as e:
        logger.error("Search failed: %s", e)
        return "عذراً، حدث خطأ أثناء محاولة البحث عن المخزون."
    finally:
        db.close()

def _collect_found_product_ids(intermediate_steps):
    """Extract product IDs from agent intermediate steps."""
    found_ids = set()
    for step in intermediate_steps or []:
        observation = str(step[1])
        match = re.search(r"SYSTEM_PRODUCT_IDS:(\[.*?\])", observation)
        if match:
            try:
                found_ids.update(json.loads(match.group(1)))
            except json.JSONDecodeError:
                pass
    return found_ids


def ensure_agent():
    """Build or reuse the AI agent executor."""
    global executor, llm, retriever_tool

    if executor is not None:
        return executor

    if llm is None:
        llm = _build_llm()

    if llm is None:
        return None

    current_tools = [search_inventory]
    active_vectorstore = _ensure_retrieval_ready()

    if active_vectorstore:
        retriever = active_vectorstore.as_retriever(search_kwargs={"k": 8})
        retriever_tool = create_retriever_tool(
            retriever,
            name="search_knowledge_base",
            description=(
                "أداة إلزامية للبحث في قاعدة المعرفة والملفات المرفوعة. "
                "استخدم هذه الأداة للإجابة على أي سؤال لا يتعلق بأسعار المنتجات والمخزون المباشر. "
                "سواء كان المستخدم يسأل عن معلومات عامة، دراسات، مشاريع، سياسات، أو أي تفاصيل موجودة في المستندات، ابحث هنا أولاً."
            ),
        )
        current_tools.append(retriever_tool)
        logger.info("Knowledge base tool successfully added to agent.")

    # Prompt شامل وذكي يجعله يتكيف مع أي ملف
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "أنت 'مساعد الحافظ'، مساعد افتراضي ذكي وودود جداً لـ'صالة الحافظ للقطع الكهربائية'.\n\n"
                    "## أوامر استخدام الأدوات (إجبارية وصارمة):\n"
                    "1. أجب على التحيات والمجاملات بشكل طبيعي وترحاب.\n"
                    "2. للأسئلة عن (المنتجات، الأسعار، التوفر، المخزون): يجب استخدام أداة 'search_inventory' فوراً.\n"
                    "3. لأي سؤال آخر مهما كان نوعه (مشاريع، طلاب، خطط، سياسات، معلومات عامة، دراسات): **إياك أن تعتذر أو تقول 'لا أعرف' قبل أن تستخدم أداة 'search_knowledge_base' للبحث في الملفات المرفوعة.** اعتبر هذه الأداة هي خيارك الأول والوحيد لأي سؤال لا يخص المنتجات.\n"
                    "4. إياك أن تؤلف أي معلومة من خارج الأدوات. اعتمد فقط على ما تجده في البحث.\n"
                    "5. فقط في حالة واحدة: إذا استخدمت الأداة وبحثت بالفعل ولم تجد أي نتيجة مفيدة، عندها فقط يحق لك الاعتذار بالقول: 'عذراً، هذه المعلومة غير متوفرة لدي حالياً، يرجى التواصل معنا عبر واتساب 0995949888'.\n\n"
                    "## معلومات المتجر الثابتة:\n"
                    "- الاسم: صالة الحافظ للقطع الكهربائية\n"
                    "- الموقع: التل - بجانب البانوراما\n"
                    "- الدوام: السبت إلى الخميس، 8 صباحاً حتى 6 مساءً\n"
                    "- واتساب: 0995949888\n\n"
                    "## ملاحظات هامة:\n"
                    "- لا تقم بكتابة أي روابط صور أو مسارات مثل '/api/products/images/...' في ردك نهائياً، حيث سيقوم النظام بعرض صور المنتجات بشكل تلقائي في واجهة الدردشة.\n"
                ),
            ),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )

    agent_obj = _agent_factory(llm, current_tools, prompt)
    executor = AgentExecutor(
        agent=agent_obj,
        tools=current_tools,
        verbose=settings.DEBUG,
        handle_parsing_errors=True,
        max_iterations=4,
        return_intermediate_steps=True,
    )
    return executor


@router.post("/api/chat", response_model=ChatResponse)
async def chat_with_bot(request: ChatRequest, db: Session = Depends(get_db)):
    """Handle chat messages from users."""
    try:
        session_id = request.session_id or str(uuid.uuid4())
        conversation = (
            db.query(Conversation).filter(Conversation.session_id == session_id).first()
        )
        if not conversation:
            conversation = Conversation(
                session_id=session_id,
                customer_name=request.customer_name,
                customer_phone=request.customer_phone,
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        db.add(
            Message(
                conversation_id=conversation.id,
                sender=SenderType.user,
                message_content=request.message,
            )
        )
        db.commit()

        # Get recent messages for context
        recent_messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.sent_at.desc())
            .limit(8)
            .all()[::-1]
        )

        chat_history = []
        for message in recent_messages[:-1]:
            content_str = str(message.message_content)
            if message.sender == SenderType.user:
                chat_history.append(HumanMessage(content=content_str))
            else:
                chat_history.append(AIMessage(content=content_str))

        reply_text = "الخدمة مشغولة حالياً، حاول مرة أخرى بعد قليل."
        response_products = []
        found_ids = set()

        try:
            active_executor = ensure_agent()
            if active_executor is None:
                reply_text = (
                    "خدمة الذكاء الاصطناعي غير مهيأة حالياً. "
                    "يرجى ضبط OPENROUTER_API_KEY أو GOOGLE_API_KEY."
                )
            else:
                result = await active_executor.ainvoke(
                    {"input": request.message, "chat_history": chat_history}
                )
                raw_output = result.get("output", "")
                # Clean up any system markers and accidental image URLs from the output
                reply_text = re.sub(r"\[SYSTEM_PRODUCT_IDS:\[.*?\]\]", "", raw_output).strip()
                # Strip markdown image tags referring to our product image API
                reply_text = re.sub(r"!\[.*?\]\s*\(.*?/api/products/images/.*?\)", "", reply_text).strip()
                if not reply_text:
                    reply_text = "لا أستطيع الإجابة حالياً."
                found_ids.update(_collect_found_product_ids(result.get("intermediate_steps")))
        except Exception as exc:
            err_str = str(exc).lower()
            if "429" in err_str or "quota" in err_str:
                reply_text = "تم تجاوز الحصة الحالية، حاول مرة أخرى لاحقاً."
            elif (
                settings.OPENROUTER_API_KEY
                and openrouter_model_in_use == OPENROUTER_PRIMARY_MODEL
                and "404" in err_str
            ):
                fallback_llm = _switch_openrouter_to_fallback()
                if fallback_llm is not None:
                    try:
                        retry_executor = ensure_agent()
                        if retry_executor is not None:
                            retry_result = await retry_executor.ainvoke(
                                {"input": request.message, "chat_history": chat_history}
                            )
                            raw_output = retry_result.get("output", "")
                            reply_text = re.sub(r"\[SYSTEM_PRODUCT_IDS:\[.*?\]\]", "", raw_output).strip()
                            # Strip markdown image tags referring to our product image API
                            reply_text = re.sub(r"!\[.*?\]\s*\(.*?/api/products/images/.*?\)", "", reply_text).strip()
                            if not reply_text:
                                reply_text = "لا أستطيع الإجابة حالياً."
                            found_ids.update(
                                _collect_found_product_ids(retry_result.get("intermediate_steps"))
                            )
                    except Exception as fallback_exc:
                        fallback_err = str(fallback_exc).lower()
                        if "429" in fallback_err or "quota" in fallback_err:
                            reply_text = "تم تجاوز الحصة الحالية، حاول مرة أخرى لاحقاً."
                        elif "connection error" in fallback_err or "connecterror" in fallback_err:
                            reply_text = "تعذر الوصول إلى مزود الذكاء الاصطناعي حالياً."
                        else:
                            logger.error("Fallback LLM error: %s", fallback_exc)
            elif "connection error" in err_str or "connecterror" in err_str:
                reply_text = "تعذر الوصول إلى مزود الذكاء الاصطناعي حالياً."
            else:
                logger.error("Chat error: %s", exc)
                traceback.print_exc()

        # Save bot response
        db.add(
            Message(
                conversation_id=conversation.id,
                sender=SenderType.bot,
                message_content=reply_text,
            )
        )
        db.commit()

        # Build product response with images
        if found_ids:
            try:
                products_list = (
                    db.query(Product)
                    .options(joinedload(Product.images), joinedload(Product.company))
                    .filter(Product.id.in_(list(found_ids)))
                    .all()
                )
                for product in products_list:
                    primary_image = next(
                        (image for image in product.images if image.is_primary),
                        None,
                    ) or (product.images[0] if product.images else None)

                    image_url = (
                        f"/api/products/images/{primary_image.id}" if primary_image else None
                    )
                    response_product = ProductResponse.model_validate(product)
                    response_product.image_url = image_url
                    response_products.append(response_product)
            except Exception as exc:
                logger.error("Product retrieval error: %s", exc)

        return ChatResponse(
            reply=reply_text,
            session_id=session_id,
            products_found=response_products,
        )
    except SQLAlchemyError:
        traceback.print_exc()
        return ChatResponse(
            reply="عذراً، نواجه مشكلة تقنية حالياً. يرجى المحاولة بعد قليل.",
            session_id=request.session_id or "error",
            products_found=[],
        )
    except Exception:
        traceback.print_exc()
        return ChatResponse(
            reply="حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
            session_id=request.session_id or "error",
            products_found=[],
        )


_LOADER_MAP = {
    ".docx": Docx2txtLoader,
}


@router.get("/api/admin/bot/files")
async def list_knowledge_files(admin: User = Depends(get_current_admin)):
    """List all uploaded knowledge files."""
    del admin
    return {"files": _list_knowledge_files()}


async def _delete_file_vectors_from_index(path: Path):
    """Delete vectors associated with a specific file from the vectorstore."""
    active_vectorstore = _ensure_vectorstore()
    if not active_vectorstore:
        return {"ok": False, "message": "الفهرسة غير متاحة حالياً."}

    source_path = str(path)
    alt_source_path = source_path.replace("\\", "/")
    filename = path.name

    try:
        collection = active_vectorstore._collection

        all_ids = []
        # Search by multiple metadata patterns
        for where_clause in [
            {"source": source_path},
            {"source": alt_source_path},
            {"filename": filename},
        ]:
            try:
                res = collection.get(where=where_clause)
                if res and res.get("ids"):
                    all_ids.extend(res["ids"])
            except Exception:
                pass

        all_ids = list(set(all_ids))

        if all_ids:
            collection.delete(ids=all_ids)
            logger.info("Deleted %d vectors for file: %s", len(all_ids), filename)
            return {"ok": True, "message": f"تم حذف {len(all_ids)} vector بنجاح."}

        return {"ok": True, "message": "لم يتم العثور على vectors لهذا الملف."}
    except Exception as exc:
        logger.error("Error deleting vectors for %s: %s", filename, exc)
        return {"ok": False, "message": f"حدث خطأ أثناء الحذف: {exc}"}


@router.delete("/api/admin/bot/files/{filename}")
async def delete_knowledge_file(
    filename: str,
    admin: User = Depends(get_current_admin),
):
    """Delete a knowledge file and its associated vectors."""
    del admin
    file_path = _safe_knowledge_path(filename)
    if not file_path.exists():
        raise HTTPException(404, detail="الملف غير موجود.")

    # Delete vectors first, then the file
    vector_delete_result = await _delete_file_vectors_from_index(file_path)

    file_path.unlink()

    # Reset executor to rebuild agent with updated knowledge
    global executor
    executor = None

    return {
        "message": "تم حذف الملف بنجاح.",
        "vector_status": vector_delete_result,
    }


@router.post("/api/admin/bot/refresh-db")
async def refresh_knowledge_db(admin: User = Depends(get_current_admin)):
    """Refresh the knowledge database by re-indexing all files."""
    del admin
    result = await _refresh_knowledge_index()
    return {"message": result["message"], "details": result}


@router.post("/api/admin/bot/upload")
async def upload_knowledge_file(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin),
):
    """Upload a knowledge file for the chatbot."""
    del admin

    try:
        destination = _safe_knowledge_path(file.filename or "")
        async with aiofiles.open(destination, "wb") as target:
            content = await file.read()
            if len(content) > MAX_UPLOAD_SIZE:
                raise HTTPException(400, detail="حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت.")
            await target.write(content)

        index_result = await _index_single_file(destination)
        if index_result["ok"]:
            return {"message": f"تم رفع الملف وفهرسته بنجاح ({index_result['chunks']} جزء)."}
        return {
            "message": (
                "تم رفع الملف بنجاح، لكن الفهرسة غير متاحة حالياً. "
                "تحقق من مفاتيح AI أو إعدادات embeddings."
            )
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Upload pipeline error: %s", exc)
        traceback.print_exc()
        raise HTTPException(500, detail=str(exc))