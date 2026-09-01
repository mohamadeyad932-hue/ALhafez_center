'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authApi, User as UserType } from '@/lib/api';
import {
    LayoutDashboard, Package, LogOut, Menu, X,
    User, FileText, Bot, Building2, ExternalLink
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [owner, setOwner] = useState<UserType | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        authApi.getMe()
            .then(res => { setOwner(res.data); setLoading(false); })
            .catch(() => { localStorage.removeItem('token'); router.push('/login'); });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const navItems = [
        { name: 'الإحصائيات', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'المنتجات', href: '/admin/dashboard/products', icon: Package },
        { name: 'الشركات', href: '/admin/dashboard/companies', icon: Building2 },
        { name: 'الفواتير', href: '/admin/dashboard/invoices', icon: FileText },
        { name: 'إدارة البوت الذكي', href: '/admin/dashboard/bot', icon: Bot },
        { name: 'تصدير التقارير', href: '/admin/dashboard/reports', icon: FileText },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0EA5E9] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-[#FFFFFF] text-[#1F2937] font-sans" dir="rtl">

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 right-0 w-64 bg-[#F0F9FF] border-l border-gray-200 z-50
                transition-transform duration-300 lg:translate-x-0 lg:static
                ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="h-full flex flex-col p-6">

                    {/* Brand */}
                    <div className="flex items-center gap-3 mb-10 pb-6 border-b border-gray-200">
                        <img
                            src="https://alhafez.com/wp-content/uploads/2020/02/%D8%A7%D9%84%D8%AD%D8%A7%D9%81%D8%B8-%D9%85%D8%B9-%D8%A7%D9%84%D8%AE%D8%AF%D9%85%D8%A9.png"
                            alt="الحافظ" className="h-8 w-auto object-contain"
                        />
                        <span className="text-[16px] font-bold text-[#1F2937]">لوحة التحكم</span>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 space-y-2">
                        <p className="text-[12px] font-semibold text-gray-500 tracking-widest uppercase mb-4 pr-3">
                            القائمة
                        </p>
                        {navItems.map(item => {
                            const active = pathname === item.href;
                            return (
                                <Link key={item.name} href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 text-[14px] font-medium rounded transition-colors ${active
                                            ? 'bg-[#0EA5E9] text-white'
                                            : 'text-[#1F2937] hover:bg-white hover:text-[#0EA5E9]'
                                        }`}>
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            );
                        })}

                        <div className="border-t border-gray-200 my-4" />

                        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-[14px] font-medium text-[#1F2937] hover:bg-white hover:text-[#0EA5E9] rounded transition-colors">
                            <ExternalLink className="w-4 h-4" />
                            العودة إلى الموقع
                        </Link>
                    </nav>

                    {/* User section */}
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="w-8 h-8 bg-white border border-gray-200 rounded flex items-center justify-center">
                                <User className="w-4 h-4 text-[#1F2937]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-semibold text-[#1F2937] truncate">{owner?.user_name}</p>
                                <p className="text-[12px] text-gray-500">المدير</p>
                            </div>
                        </div>
                        <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-[14px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
                            <LogOut className="w-4 h-4" />
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#FFFFFF]">
                {/* Top bar */}
                <header className="h-16 bg-[#0EA5E9] text-white flex items-center justify-between px-6 lg:px-8 shrink-0">
                    <button className="lg:hidden p-2 text-white/80 hover:text-white" onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="hidden lg:flex items-center gap-2">
                        <p className="text-[14px] font-medium">
                            أهلاً وسهلاً، {owner?.user_name}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#1F2937]/20 px-3 py-1.5 rounded">
                        <span className="w-2 h-2 bg-green-400 rounded-full" />
                        <span className="text-[12px] font-medium">متصل</span>
                    </div>
                </header>

                {/* Content */}
                <section className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </section>
            </main>
        </div>
    );
}
