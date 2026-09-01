
-- 1. إنشاء الأنواع (Enums)
DO $$ BEGIN
    -- نوع حالة المنتج
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
        CREATE TYPE product_status AS ENUM ('متوفر', 'نفذ', 'تحت الطلب');
    END IF;
    -- نوع المرسل في المحادثات
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sender_type') THEN
        CREATE TYPE sender_type AS ENUM ('user', 'bot');
    END IF;
    -- (جديد) نوع المستخدم: هل هو مدير أم عميل؟
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'customer');
    END IF;
END $$;
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_data BYTEA,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. جدول المستخدمين (الموحد)
-- يحتوي على العملاء والمدراء، ويتم التمييز بينهم عبر user_role
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(255)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
   
    role user_role DEFAULT 'customer', -- الافتراضي عميل، ويمكنك تغييره لـ admin يدوياً
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول المنتجات
-- تم تغيير product_owner ليربط بجدول users بدلاً من owners المحذوف
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_status product_status DEFAULT 'متوفر',
    description TEXT,
    
    -- الآن نربط المنتج بالمستخدم (الذي يجب أن يكون Admin)
    added_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- ربط المنتج بالشركة المصنعة
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول صور المنتجات (Binary Image Data)
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    
    image_data BYTEA NOT NULL,          -- الصورة كبيانات
    mime_type VARCHAR(50) NOT NULL,     -- نوع الصورة
    is_primary BOOLEAN DEFAULT FALSE,   -- الصورة الرئيسية
    
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_product_images
        FOREIGN KEY(product_id) 
        REFERENCES products(id) 
        ON DELETE CASCADE
);

-- 5. جدول المحادثات
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255), -- للزوار غير المسجلين
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    started_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول الرسائل
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    sender sender_type,
    message_content TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_conversation 
        FOREIGN KEY(conversation_id) 
        REFERENCES conversations(id) 
        ON DELETE CASCADE
);

-- 7. جدول الفواتير
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- ربط اختياري
    person_name VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    amount_received DECIMAL(10, 2) NOT NULL,
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. الفهارس (Indexes)
CREATE INDEX idx_users_username ON users(user_name);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_product_images_pid ON product_images(product_id);
CREATE INDEX idx_conversations_session ON conversations(session_id);