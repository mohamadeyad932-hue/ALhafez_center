'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import axios from 'axios';

export default function LoginPage() {
    const [user_name, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validations requested
        if (user_name.length < 4) {
            setError('يجب ان يكون الاسم 4 احرف على الأقل');
            return;
        }
        
        if (password.length < 8) {
            setError('يجب أن تكون كلمة المرور 8 أحرف لـ الأقل');
            return;
        }
        
        if (!/\d/.test(password)) {
            setError('يجب ان يستعمل ارقام داخل الكلمة');
            return;
        }
        
        if (!/[a-zA-Zء-ي]/.test(password)) {
            setError('يجب أن تحوي كلمة المرور على أحرف أيضاً');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await authApi.login({ user_name, password });
            localStorage.setItem('token', response.data.access_token);
            try {
                const me = await authApi.getMe();
                window.location.href = me.data.role === 'admin' ? '/admin/dashboard' : '/';
            } catch {
                window.location.href = '/';
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail || 'اسم المستخدم أو كلمة المرور غير صحيحة');
            } else {
                setError('حدث خطأ غير متوقع');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex" dir="rtl" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>

            {/* Left visual panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-sky-light items-center justify-center p-16 relative">
                <div className="max-w-md text-center space-y-8">
                    <img
                        src="https://alhafez.com/wp-content/uploads/2020/02/%D8%A7%D9%84%D8%AD%D8%A7%D9%81%D8%B8-%D9%85%D8%B9-%D8%A7%D9%84%D8%AE%D8%AF%D9%85%D8%A9.png"
                        alt="الحافظ" className="h-20 w-auto mx-auto object-contain opacity-80"
                    />
                    <h2 className="text-2xl font-bold text-foreground">
                        مرحباً بعودتك
                    </h2>


                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
                <div className="max-w-[400px] w-full mx-auto">

                    <Link href="/" className="inline-flex items-center gap-2 text-[15px] text-warm-500 hover:text-foreground mb-10 transition-colors">
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                        العودة للرئيسية
                    </Link>

                    <div className="lg:hidden flex justify-center mb-8">
                        <img
                            src="https://alhafez.com/wp-content/uploads/2020/02/%D8%A7%D9%84%D8%AD%D8%A7%D9%81%D8%B8-%D9%85%D8%B9-%D8%A7%D9%84%D8%AE%D8%AF%D9%85%D8%A9.png"
                            alt="الحافظ" className="h-12 w-auto object-contain"
                        />
                    </div>

                    <h1 className="text-2xl font-bold text-foreground mb-2">تسجيل الدخول</h1>
                    <p className="text-[15px] text-warm-400 mb-8">
                        ليس لديك حساب؟{' '}
                        <Link href="/register" className="text-sky hover:text-sky-dark font-medium">إنشاء حساب جديد</Link>
                    </p>

                    <form className="space-y-5" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-rose-light border border-rose/30 text-rose-dark p-3 text-[15px] font-medium">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-[14px] font-semibold text-warm-600 mb-2 tracking-wider uppercase">
                                اسم المستخدم
                            </label>
                            <div className="relative">
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                                <input
                                    type="text" required value={user_name}
                                    onChange={e => setUserName(e.target.value)}
                                    className="w-full bg-transparent border border-warm-300 py-3 pr-10 pl-4 text-[16px] text-foreground focus:outline-none focus:border-sky placeholder:text-warm-300"
                                    placeholder="ادخل اسم المستخدم"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[14px] font-semibold text-warm-600 mb-2 tracking-wider uppercase">
                                كلمة المرور
                            </label>
                            <div className="relative">
                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                                <input
                                    type={showPassword ? "text" : "password"} required value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-transparent border border-warm-300 py-3 pr-10 pl-11 text-[16px] text-foreground focus:outline-none focus:border-sky placeholder:text-warm-300"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-sky transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-3.5 h-3.5 accent-sky cursor-pointer" />
                                <span className="text-[14px] text-warm-500">تذكرني</span>
                            </label>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full btn-primary justify-center mt-2 disabled:opacity-50">
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                            ) : 'الدخول'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
