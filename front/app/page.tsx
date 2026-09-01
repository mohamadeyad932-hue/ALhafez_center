'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productApi, authApi, companyApi, API_URL, type Product, type Company, type User } from '@/lib/api';
import ChatBot from '@/components/ChatBot';
import {
  Package, Search, ShieldCheck, Truck, Award,
  Facebook, Clock, MapPin, Menu, X as CloseIcon,
  ChevronDown, ShoppingCart, MessageCircle, Phone
} from 'lucide-react';

type ProductWithCompany = Product & { company?: { id: number; name: string } };

export default function HomePage() {
  const [products, setProducts] = useState<ProductWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(['الكل']);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('الكل');
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      authApi.getMe().then(res => setUser(res.data)).catch(() => { });
    }
    productApi.getCategories()
      .then(res => {
        if (res.data?.categories) setDynamicCategories(['الكل', ...res.data.categories]);
      }).catch(() => { });
    companyApi.getAll()
      .then(res => setCompanies(res.data || []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const companyId = selectedCompany === 'الكل' ? undefined : Number(selectedCompany) || undefined;
        const res = await productApi.getAll({
          per_page: 60,
          category: activeCategory === 'الكل' ? undefined : activeCategory,
          company_id: companyId,
          search: searchQuery || undefined,
        });
        if (!cancelled) {
          setProducts(res.data.products || []);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeCategory, searchQuery, selectedCompany]);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">

      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 w-full z-50 bg-background border-b border-border h-20 flex items-center">
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button className="lg:hidden p-2 -mr-2 text-muted hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center gap-3">
              <img
                src="https://alhafez.com/wp-content/uploads/2020/02/%D8%A7%D9%84%D8%AD%D8%A7%D9%81%D8%B8-%D9%85%D8%B9-%D8%A7%D9%84%D8%AE%D8%AF%D9%85%D8%A9.png"
                alt="الحافظ" className="h-8 w-auto object-contain"
              />
              <span className="text-[16px] font-bold tracking-tight hidden sm:block">
                صالة الحافظ
              </span>
            </Link>
            <div className="hidden lg:flex items-center gap-8 mr-12 text-[15px] font-medium text-muted">
              {['الرئيسية', 'المنتجات', 'الخدمات', 'اتصل بنا'].map((item, i) => (
                <a key={i} href={item === 'الرئيسية' ? '#' : item === 'المنتجات' ? '#products' : item === 'الخدمات' ? '#features' : '#contact'}
                  className="hover:text-primary transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                {(user.role === 'admin' || user.role === 'owner') && (
                  <Link href="/admin/dashboard" className="text-[14px] font-semibold text-accent hover:text-accent-hover transition-colors">
                    لوحة التحكم
                  </Link>
                )}
                <span className="text-[14px] text-muted hidden sm:block border border-border px-3 py-1 bg-surface rounded">{user.user_name}</span>
                <button onClick={() => { localStorage.removeItem('token'); setUser(null); }}
                  className="text-[14px] text-muted hover:text-foreground font-medium transition-colors">خروج</button>
              </div>
            ) : (
              <Link href="/login" className="text-[15px] font-medium text-foreground hover:text-primary transition-colors hidden sm:block">
                تسجيل الدخول
              </Link>
            )}
            <a href="#products" className="btn-primary text-[14px] py-2 px-6 hidden sm:flex">
              تسوق الآن
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Mobile overlay ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col">
          <div className="h-20 border-b border-border flex items-center justify-between px-6">
            <span className="font-bold text-lg">القائمة</span>
            <button className="p-2 -ml-2 text-muted hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col gap-6 p-8 text-lg font-medium text-foreground">
            <a href="#" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors">الرئيسية</a>
            <a href="#products" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors">المنتجات</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors">الخدمات</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors">اتصل بنا</a>
            <div className="h-px w-full bg-border my-4" />
            {!user ? (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-foreground hover:text-primary transition-colors">تسجيل الدخول</Link>
            ) : null}
            <a href="#products" onClick={() => setMobileMenuOpen(false)} className="btn-primary justify-center mt-4">
              تسوق الآن
            </a>
          </div>
        </div>
      )}

      {/* ─── Hero ─── */}
      <section className="relative pt-48 pb-32 lg:pt-72 lg:pb-60 bg-background border-b border-border overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/hero-bg.jpg" alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/10"></div>
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col items-center text-center">
          <div className="max-w-4xl space-y-8">
            <h1 className="text-4xl lg:text-7xl font-bold leading-[1.15] tracking-tight text-foreground">
            </h1>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 bg-surface border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-12 gap-12">
          <div className="col-span-12 lg:col-span-12 mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">لماذا نحن</h2>
            <p className="text-[16px] text-muted max-w-3xl leading-relaxed">
              نوفر لك تشكيلة واسعة من أحدث الأجهزة الكهربائية ذات الجودة العالية والتقنيات الموفرة للطاقة
            </p>
          </div>
          {[
            { icon: ShieldCheck, title: 'ضمان الوكيل المعتمد', desc: 'جميع منتاجتنا أصلية 100% ومرفقة بضمان شامل وموثوق من الشركات المصنعة لضمان حقك وراحة بالك.' },
            { icon: Truck, title: 'توصيل وتركيب احترافي', desc: 'خدمة توصيل سريعة وآمنة لباب منزلك، مع كادر فني مختص لتركيب الأجهزة وتشغيلها بشكل صحيح.' },
            { icon: Award, title: 'خدمة ما بعد البيع متميزة', desc: 'علاقتنا بك لا تنتهي عند البيع نوفر لك دعمًا فنيًا وخدمات صيانة معتمدة لضمان عمل أجهزتك بكفاءة.' },
          ].map((f, i) => (
            <div key={i} className="col-span-12 md:col-span-4 bg-background border border-border p-10 rounded-sm hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 hover:border-primary/30 group cursor-pointer">
              <div className="w-12 h-12 bg-surface border border-border flex items-center justify-center rounded mb-8 group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                <f.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-500" />
              </div>
              <h3 className="text-[18px] font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-500">{f.title}</h3>
              <p className="text-[15px] text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Products ─── */}
      <section id="products" className="py-24 bg-background">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Header + filters */}
          <div className="grid grid-cols-12 gap-8 mb-12 items-end">
            <div className="col-span-12 lg:col-span-4">
              <h2 className="text-3xl font-bold text-foreground mb-3">المنتجات</h2>
              <p className="text-[16px] text-muted">تصفح القطع واللوحات الكهربائية المتوفرة بالمخزون</p>
            </div>
            <div className="col-span-12 lg:col-span-8 flex flex-wrap justify-end items-center gap-4">
              <div className="relative w-full sm:w-auto">
                <input
                  type="text" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="اسم القطعة"
                  className="form-input w-full sm:w-72 px-4 py-3 text-[14px] bg-surface"
                />
              </div>
              <div className="w-px h-8 bg-border hidden lg:block mx-1" />
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                {dynamicCategories.map(cat => {
                  if (cat === 'الكل') {
                    return (
                      <div key={cat} className="relative shrink-0">
                        <select
                          value={selectedCompany}
                          onChange={e => {
                            setSelectedCompany(e.target.value);
                            setActiveCategory('الكل');
                          }}
                          className={`appearance-none text-[14px] font-medium border border-border py-[11px] pr-4 pl-10 rounded focus:outline-none transition-colors 
                            ${activeCategory === 'الكل' ? 'bg-primary text-white border-primary' : 'bg-surface text-foreground hover:bg-border/30'}`}
                        >
                          <option value="الكل" className="text-foreground bg-background">فلترة حسب الشركة</option>
                          {companies.map(c => (
                            <option key={c.id} value={c.id} className="text-foreground bg-background">
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${activeCategory === 'الكل' ? 'text-white' : 'text-muted'}`} />
                      </div>
                    );
                  }
                  return (
                    <button key={cat} onClick={() => { setActiveCategory(cat); setSelectedCompany('الكل'); }}
                      className={`px-6 py-[11px] rounded text-[14px] font-medium whitespace-nowrap border border-border transition-colors shrink-0 
                        ${activeCategory === cat ? 'bg-primary text-white border-primary' : 'bg-surface text-foreground hover:bg-border/30'}`}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Products grid */}
          {loading ? (
            <div className="grid grid-cols-12 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-3 bg-surface border border-border rounded animate-pulse">
                  <div className="aspect-square bg-border/30 border-b border-border p-4" />
                  <div className="p-6">
                    <div className="h-4 bg-border/50 rounded w-1/3 mb-4"></div>
                    <div className="h-6 bg-border/50 rounded w-3/4 mb-5"></div>
                    <div className="h-4 bg-border/50 rounded w-full mb-3"></div>
                    <div className="h-4 bg-border/50 rounded w-2/3 mb-8"></div>
                    <div className="h-11 bg-border/50 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-32 bg-surface rounded border border-border">
              <Package className="w-12 h-12 text-muted mx-auto mb-6" />
              <p className="text-[18px] font-medium text-foreground mb-2">لا توجد منتجات مطابقة للبحث</p>
              <button onClick={() => { setSearchQuery(''); setActiveCategory('الكل'); setSelectedCompany('الكل'); }}
                className="mt-6 text-[15px] font-medium text-primary hover:underline">
                إعادة ضبط المعايير
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-8">
              {products.map((p: ProductWithCompany) => (
                <Link href={`/product/${p.id}`} key={p.id}
                  className="col-span-12 sm:col-span-6 lg:col-span-3 group bg-surface border border-border rounded flex flex-col h-full overflow-hidden hover:border-border transition-all hover:bg-background">
                  <div className="h-72 sm:h-80 bg-background px-8 py-6 border-b border-border flex items-center justify-center relative overflow-hidden">
                    {p.company?.name && (
                      <span className="absolute top-4 right-4 text-[11px] font-bold text-muted uppercase tracking-wider border border-border bg-surface px-2 py-1 rounded">
                        {p.company.name}
                      </span>
                    )}
                    {p.image_url && p.image_url !== '' ? (
                      <img src={`${API_URL}${p.image_url}`} alt={p.name}
                        className="max-w-full max-h-full object-contain object-center mix-blend-multiply" />
                    ) : (
                      <Package className="w-12 h-12 text-border" />
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3 min-h-6">
                      <h3 className="text-[16px] font-bold text-foreground line-clamp-1 leading-6">
                        {p.name}
                      </h3>
                    </div>
                    <p className="text-[14px] text-muted leading-6 line-clamp-2 h-12 mb-6 pr-1 border-r-2 border-border">
                      {p.description || 'قطعة مطابقة للمعايير الهندسية، مناسبة للتمديدات الاحترافية.'}
                    </p>
                    <div className="flex items-center justify-between mb-6 mt-auto">
                      <p className="text-[20px] font-bold text-[#1F2937]">
                        ${p.price}
                      </p>
                      <span className={`text-[12px] font-medium px-3 py-1 rounded border ${p.stock_status === 'متوفر' ? 'border-border text-primary bg-background' : p.stock_status === 'تحت الطلب' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-red-200 text-red-700 bg-red-50'}`}>
                        {p.stock_status}
                      </span>
                    </div>
                    <button className="btn-accent w-full group-hover:bg-accent-hover text-[14px] py-3">
                      <ShoppingCart className="w-4 h-4 ml-2" />
                      تعرف على المنتج
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer id="contact" className="bg-surface border-t border-border pt-20 pb-8">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-12 gap-12 lg:gap-8 mb-16">
          <div className="col-span-12 lg:col-span-5 pr-0 lg:pr-4">
            <span className="text-[18px] font-bold tracking-tight text-foreground block mb-6">
              صالة الحافظ
            </span>
            <p className="text-[15px] leading-relaxed max-w-md text-muted mb-8">
              وجهتك الأولى لأحدث الأجهزة المنزلية والكهربائية. نجهّز منزلك بأفضل الماركات العالمية بأسعار تنافسية وضمان الوكيل المعتمد.
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/Alhafez2001" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-border rounded flex items-center justify-center text-muted hover:text-foreground hover:bg-border/50 transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="https://wa.me/963995949888" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-border rounded flex items-center justify-center text-muted hover:text-foreground hover:bg-border/50 transition-colors"><MessageCircle className="w-5 h-5" /></a>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <h4 className="font-bold text-[14px] text-foreground mb-6 uppercase tracking-widest">الروابط</h4>
            <ul className="space-y-4 text-[15px] text-muted">
              <li><a href="https://www.google.com/search?q=%D8%B4%D8%B1%D9%83%D8%A9+%D8%A7%D9%84%D8%AD%D8%A7%D9%81%D8%B8" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors block">عن الشركة</a></li>
              <li><a href="#products" className="hover:text-primary transition-colors block">المنتجات</a></li>
              <li><a href="https://www.google.com/search?q=%D8%B4%D8%B1%D9%83%D8%A9+%D8%A7%D9%84%D8%AD%D8%A7%D9%81%D8%B8+%D8%B4%D9%87%D8%A7%D8%AF%D8%A9+%D8%A7%D9%84%D8%A7%D9%8A%D8%B2%D9%88" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors block">شهادات الجودة</a></li>
            </ul>
          </div>
          <div className="col-span-12 md:col-span-8 lg:col-span-4">
            <h4 className="font-bold text-[14px] text-foreground mb-6 uppercase tracking-widest">الاتصال</h4>
            <ul className="space-y-5 text-[15px] text-muted">
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 shrink-0 text-border" />
                <div>
                  <p className="font-medium text-foreground mb-1">الدوام الرسمي</p>
                  <p>السبت – الخميس | 8ص – 6م</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 shrink-0 text-border" />
                <div>
                  <p className="font-medium text-foreground mb-1">موقع الصالة</p>
                  <p> التل _ بجانب البانوراما</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 shrink-0 text-border" />
                <div>
                  <p className="font-medium text-foreground mb-1">الهاتف</p>
                  <p dir="ltr" className="text-right"> 0995 949 888</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] text-muted">
          <p>© {new Date().getFullYear()} صالة الحافظ. جميع الحقوق محفوظة.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-foreground transition-colors">الشروط والأحكام</a>
            <a href="#" className="hover:text-foreground transition-colors">سياسة الخصوصية</a>
          </div>
        </div>
      </footer>

      <ChatBot />
    </div>
  );
}
