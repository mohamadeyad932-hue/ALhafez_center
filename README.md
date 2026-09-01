# صالة الحافظ للقطع الكهربائية (ALhafez Center) 🔌⚡

منصة وتطبيق متكامل لإدارة وعرض المنتجات الكهربائية مع نظام ذكاء اصطناعي (AI Chatbot) ذكي للإجابة عن استفسارات العملاء والبحث الدلالي في المنتجات وقاعدة المعرفة.

---

## 🌟 مميزات النظام (Features)

- **🖥️ واجهة المستخدم (Frontend):** مبنية بأحدث تقنيات **Next.js / React** بتصميم عصري ومتجاوب وسريع.
- **⚙️ الواجهة الخلفية (Backend API):** نظام قوي وسريع مبني باستخدام **FastAPI (Python)**.
- **🤖 المساعد الذكي (AI Chatbot & RAG):**
  - شات بوت ذكي مدمج باستخدام **LangChain**.
  - دعم نماذج **OpenRouter (GPT-4o-mini / Gemini Pro)** مع نظام تحويل تلقائي (Fallback).
  - بحث دلالي فائق السرعة عبر قاعدة بيانات شعاعية **ChromaDB** واسترجاع المستندات (`knowledge_base`).
- **🗄️ قاعدة البيانات (Database):** **PostgreSQL** عالية الأداء، مع دعم الترحيلات وهيكل بيانات متكامل.
- **🐳 تشغيل الحاويات (Docker & Compose):** بيئة تشغيل متكاملة وسلسة تشمل جميع الخدمات مع **Nginx Reverse Proxy**.

---

## 🏗️ هيكلية المشروع (Project Architecture)

```text
ALhafez_center/
├── front/                 # واجهة المستخدم (Next.js)
├── backend/               # الواجهة الخلفية ونقاط النهاية (FastAPI)
│   ├── app/               # نماذج البيانات، التوثيق، الإعدادات والمصادقة
│   ├── database/          # ملفات تهيئة قاعدة البيانات
│   └── uploads/           # ملفات الوسائط والصور المرفوعة
├── ai/                    # نظام الذكاء الاصطناعي والمساعد الآلي
│   ├── chatbot_ai.py      # محرك الذكاء الاصطناعي و LangChain Agent
│   ├── chroma_db_v2/      # قاعدة البيانات الشعاعية للمستندات
│   └── knowledge_base/    # مستندات المعرفة وفهارس المنتجات
├── nginx/                 # إعدادات خادم Nginx العكسي
├── docker-compose.yml     # ملف إدارة وتشغيل كافة الخدمات بالحاويات
└── .gitignore             # الملفات المستثناة من المزامنة
```

---

## 🚀 التشغيل السريع باستخدام Docker (موصى به)

### 1. المتطلبات:
- تثبيت [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### 2. التشغيل:
قم بتشغيل كافة الخدمات بضغطة زر واحدة:

```bash
docker compose up -d --build
```

### 3. الروابط الافتراضية:
- **الموقع الرئيسي (Frontend):** [http://localhost](http://localhost) أو [http://localhost:3000](http://localhost:3000)
- **واجهة التوثيق للـ API (Swagger UI):** [http://localhost:8001/docs](http://localhost:8001/docs)
- **قاعدة بيانات PostgreSQL:** المنفذ `5432`

---

## 💻 التشغيل المحلي اليدوي (Development)

### تشغيل الـ Backend:
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### تشغيل الـ Frontend:
```bash
cd front
npm install
npm run dev
```

---

## 🔑 المتغيرات البيئية (Environment Variables)

يمكن تخصيص الإعدادات عبر إنشاء ملف `.env` في المجلد الرئيسي أو مجلد `backend`:

```env
# قاعدة البيانات
DATABASE_URL=postgresql://hafaz_user:hafaz_secure_password_2024@localhost:5432/alhafaz_center

# الأمان والمصادقة
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# الذكاء الاصطناعي
OPENROUTER_API_KEY=your_openrouter_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_EMBEDDING_MODEL=models/text-embedding-004
```

---

## 📜 الترخيص (License)

تم تطوير هذا المشروع لصالح **صالة الحافظ للقطع الكهربائية**. جميع الحقوق محفوظة.
