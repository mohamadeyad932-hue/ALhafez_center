# 🐳 دليل تشغيل المشروع عبر Docker

## دليل شامل لتشغيل **صالة الحافظ للقطع الكهربائية** في بيئة Docker

---

## 📋 المتطلبات الأساسية

| البرنامج | الحد الأدنى | التحميل |
|----------|------------|---------|
| Docker Desktop | v4.25+ | [docker.com/download](https://www.docker.com/products/docker-desktop/) |
| Docker Compose | v2.20+ | (مدمج مع Docker Desktop) |

> **ملاحظة**: تأكد من تشغيل Docker Desktop قبل البدء.

---

## 🚀 التشغيل السريع (خطوة واحدة)

### الطريقة 1: عبر السكربت التفاعلي (ويندوز)
```bat
docker-start.bat
```
اختر الخيار `[1]` للتشغيل الإنتاجي أو `[2]` لبيئة التطوير.

### الطريقة 2: عبر سطر الأوامر

#### تحضير ملف البيئة (أول مرة فقط)
```bash
copy .env.docker .env
```
ثم عدّل ملف `.env` وأضف مفاتيح الـ API الخاصة بك.

#### تشغيل بيئة الإنتاج
```bash
docker compose up -d --build
```

#### تشغيل بيئة التطوير (مع Hot-Reload)
```bash
docker compose -f docker-compose.dev.yml up -d --build
```

---

## 🌐 الوصول للمشروع بعد التشغيل

### بيئة الإنتاج (عبر Nginx)
| الخدمة | الرابط |
|--------|--------|
| الموقع الرئيسي | http://localhost |
| الـ API | http://localhost/api |
| توثيق الـ API (Swagger) | http://localhost:8001/docs |
| الواجهة المباشرة | http://localhost:3000 |

### بيئة التطوير
| الخدمة | الرابط |
|--------|--------|
| الواجهة الأمامية | http://localhost:3000 |
| الخادم الخلفي | http://localhost:8001 |
| توثيق الـ API (Swagger) | http://localhost:8001/docs |

---

## ⚙️ إعداد المتغيرات البيئية

عدّل ملف `.env` في جذر المشروع:

```env
# ===== مفاتيح الذكاء الاصطناعي (اختياري) =====
OPENROUTER_API_KEY=sk-or-v1-xxxx
GOOGLE_API_KEY=AIzaXXXX

# ===== قاعدة البيانات =====
POSTGRES_USER=hafaz_user
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=alhafaz_center

# ===== الأمان (غيّرها في الإنتاج!) =====
SECRET_KEY=your-super-secret-key-here
DEFAULT_ADMIN_USER=admin
DEFAULT_ADMIN_PASSWORD=your_admin_password
```

> ⚠️ **تحذير**: لا تستخدم كلمات المرور الافتراضية في بيئة الإنتاج!

---

## 📦 بنية الحاويات

```
┌──────────────────────────────────────────────┐
│                 Nginx (:80)                  │
│          (Reverse Proxy + Cache)             │
├──────────────┬───────────────────────────────┤
│              │                               │
│   Frontend   │         Backend               │
│  Next.js     │   FastAPI + AI Module         │
│   (:3000)    │        (:8001)                │
│              │                               │
│              │    ┌─────────────────────┐     │
│              │    │   ChromaDB (Vector) │     │
│              │    │   Knowledge Base    │     │
│              │    └─────────────────────┘     │
│              │                               │
│              │    ┌─────────────────────┐     │
│              │    │   PostgreSQL (:5432)│     │
│              │    │   (Database)        │     │
│              │    └─────────────────────┘     │
└──────────────┴───────────────────────────────┘
```

---

## 🔧 أوامر الإدارة الشائعة

### عرض حالة الحاويات
```bash
docker compose ps
```

### عرض السجلات (Logs)
```bash
# جميع الخدمات
docker compose logs -f

# خدمة محددة
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### إعادة بناء خدمة محددة
```bash
docker compose up -d --build backend
docker compose up -d --build frontend
```

### إيقاف جميع الحاويات
```bash
docker compose down
```

### الدخول إلى حاوية (للتشخيص)
```bash
# الخادم الخلفي
docker compose exec backend bash

# قاعدة البيانات
docker compose exec db psql -U hafaz_user -d alhafaz_center
```

---

## 💾 النسخ الاحتياطي واستعادة قاعدة البيانات

### أخذ نسخة احتياطية
```bash
docker compose exec db pg_dump -U hafaz_user alhafaz_center > backup.sql
```

### استعادة من نسخة احتياطية
```bash
docker compose exec -T db psql -U hafaz_user -d alhafaz_center < backup.sql
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: الحاويات لا تعمل
```bash
# تحقق من الحالة
docker compose ps

# اعرض سجلات الأخطاء
docker compose logs --tail=50 backend
```

### المشكلة: خطأ في الاتصال بقاعدة البيانات
- تأكد أن حاوية `db` تعمل: `docker compose ps db`
- تأكد من صحة `DATABASE_URL` في ملف `.env`
- انتظر حتى تكتمل عملية التهيئة (30 ثانية تقريباً)

### المشكلة: البناء يفشل بسبب الذاكرة
```bash
# زد ذاكرة Docker Desktop من الإعدادات
# Settings > Resources > Memory > 4GB+
```

### المشكلة: المنافذ مستخدمة
```bash
# تحقق من المنافذ المستخدمة
netstat -ano | findstr :80
netstat -ano | findstr :3000
netstat -ano | findstr :8001
netstat -ano | findstr :5432
```

### التنظيف الشامل (إعادة البدء من الصفر)
```bash
docker compose down -v --rmi all
docker system prune -af
```

> ⚠️ **تحذير**: هذا الأمر يحذف جميع البيانات والصور!

---

## 📁 هيكل ملفات Docker

```
ALhafez_center/
├── .dockerignore           # ملفات مستبعدة من البناء
├── .env.docker             # قالب المتغيرات البيئية
├── .env                    # المتغيرات الفعلية (أنشئه من .env.docker)
├── docker-compose.yml      # تكوين الإنتاج
├── docker-compose.dev.yml  # تكوين التطوير
├── docker-start.bat        # سكربت التشغيل التفاعلي
├── DOCKER_GUIDE.md         # هذا الدليل
├── backend/
│   └── Dockerfile          # بناء الخادم الخلفي
├── front/
│   └── Dockerfile          # بناء الواجهة الأمامية
└── nginx/
    └── nginx.conf          # إعدادات الوسيط العكسي
```

---

## 🔄 تحديث المشروع

```bash
# اسحب آخر التعديلات
git pull

# أعد بناء الحاويات
docker compose up -d --build

# إذا تغيرت الاعتماديات (requirements.txt أو package.json)
docker compose build --no-cache
docker compose up -d
```
