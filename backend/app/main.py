"""Main FastAPI application."""
import logging
import sys
import time
import traceback
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.auth import hash_password
from app.config import get_settings
from app.database import SessionLocal, create_tables
from app.models import User, Conversation, Message
from app.routers import admin, auth, companies, invoices, products

# Add project root to path for AI module imports
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))

# Import AI chatbot if available
try:
    from ai.chatbot_ai import router as chatbot_router
    CHATBOT_ENABLED = True
except ImportError:
    CHATBOT_ENABLED = False
    logging.warning("Chatbot module not found - chat features will be disabled")

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


from starlette.concurrency import run_in_threadpool

def _sync_cleanup():
    from datetime import datetime, timedelta, timezone
    try:
        db = SessionLocal()
        try:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=1)
            deleted_messages = db.query(Message).filter(Message.sent_at < cutoff_date).delete(synchronize_session=False)
            deleted_conversations = db.query(Conversation).filter(Conversation.started_at < cutoff_date).delete(synchronize_session=False)
            db.commit()
            if deleted_messages > 0 or deleted_conversations > 0:
                logger.info("Cleaned up %s old messages and %s old conversations.", deleted_messages, deleted_conversations)
        except Exception as exc:
            logger.error("Error during background cleanup: %s", exc)
            db.rollback()
        finally:
            db.close()
    except Exception as e:
        logger.error("Failed to start DB session for cleanup: %s", e)

async def cleanup_old_data_task():
    """Background task to delete conversations and messages older than 1 day."""
    import asyncio
    while True:
        await run_in_threadpool(_sync_cleanup)
        # Run every 12 hours
        await asyncio.sleep(12 * 3600)

def _sync_startup():
    create_tables()
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.user_name == settings.DEFAULT_ADMIN_USER).first()
        if not admin_user:
            logger.info("Creating default admin user: %s", settings.DEFAULT_ADMIN_USER)
            db.add(
                User(
                    user_name=settings.DEFAULT_ADMIN_USER,
                    password_hash=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                    role="admin",
                )
            )
            db.commit()
            logger.info("Default admin created successfully.")
    except Exception as exc:
        logger.error("Error seeding default admin: %s", exc)
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(application: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # --- Startup ---
    await run_in_threadpool(_sync_startup)

    logger.info("Application started successfully. Chatbot: %s", "enabled" if CHATBOT_ENABLED else "disabled")

    import asyncio
    cleanup_task = asyncio.create_task(cleanup_old_data_task())

    yield  # Application is running

    # --- Shutdown ---
    cleanup_task.cancel()
    logger.info("Application shutting down.")


app = FastAPI(
    title=f"{settings.APP_NAME} - API",
    description="صالة الحافظ للقطع الكهربائية - Backend API",
    version="2.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests with timing information."""
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000

    # Log slow requests (> 1 second)
    if process_time > 1000:
        logger.warning(
            "Slow request: %s %s - Status: %s - Time: %.2fms",
            request.method, request.url.path, response.status_code, process_time,
        )

    # Add performance header
    response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
    return response


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "حدث خطأ داخلي في الخادم. يرجى المحاولة لاحقاً.", "success": False},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler for request validation errors."""
    return JSONResponse(
        status_code=422,
        content={"detail": "خطأ في البيانات المرسلة", "errors": exc.errors(), "success": False},
    )


@app.get("/")
async def root():
    """Root endpoint with basic API information."""
    return {
        "message": "مرحباً بك في صالة الحافظ للقطع الكهربائية",
        "status": "online",
        "version": "2.0.0",
        "chatbot_enabled": CHATBOT_ENABLED,
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


# Include API routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(invoices.router)
app.include_router(companies.router)
app.include_router(admin.router)

# Include chatbot router if available
if CHATBOT_ENABLED:
    app.include_router(chatbot_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG,
        log_level="info",
    )
