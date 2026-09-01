'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { LogIn, ShieldAlert, Zap, Lock, User, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

export default function LoginPage() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authApi.login({ user_name: name, password });
            localStorage.setItem('token', response.data.access_token); // Changed from owner_token to token to match api.ts
            router.push('/admin/dashboard');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
            } else {
                setError('حدث خطأ غير متوقع');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6" dir="rtl">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-100/40 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-50/40 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-10 duration-700">
                {/* Logo/Icon */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 primary-gradient rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-200 mb-6 group transition-transform hover:scale-110">
                        <Zap className="text-white w-10 h-10 group-hover:animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">متجر حافظ</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">نظام إدارة المحتوى</p>
                </div>

                {/* Login Card */}
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50/50 rounded-full -mr-16 -mt-16 blur-2xl" />

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-4">
                            <div className="relative group">
                                <label className="block text-xs font-black text-slate-400 mb-2 mr-1 uppercase tracking-widest">
                                    اسم المسؤول
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-300 group-focus-within:text-cyan-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl pr-12 pl-4 py-4 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium placeholder:text-slate-300"
                                        placeholder="Username"
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <label className="block text-xs font-black text-slate-400 mb-2 mr-1 uppercase tracking-widest">
                                    كلمة المرور
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-cyan-500 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl pr-12 pl-12 py-4 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all font-medium placeholder:text-slate-300"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300 hover:text-cyan-500 transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-500 px-5 py-3.5 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                                <ShieldAlert className="w-5 h-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "w-full bg-slate-900 hover:bg-cyan-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 active:scale-95 group",
                                loading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>الدخول للمنصة</span>
                                    <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-12 text-center text-slate-400 font-bold text-[12px] uppercase tracking-[0.2em] space-y-2">
                    <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} متجر حافظ للكهرباء</p>
                    <p className="opacity-50 font-black">Secure Login Portal</p>
                </div>
            </div>
        </div>
    );
}
