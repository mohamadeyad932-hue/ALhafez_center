'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api';
import axios from 'axios';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        user_name: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.user_name.length < 4) {
            setError('يجب ان يكون اسم المستخدم 4 احرف على الأقل');
            return;
        }

        if (formData.password.length < 8) {
            setError('يجب أن تكون كلمة المرور 8 أحرف لـ الأقل');
            return;
        }

        if (!/\d/.test(formData.password)) {
            setError('يجب ان يستعمل ارقام داخل الكلمة');
            return;
        }

        if (!/[a-zA-Zء-ي]/.test(formData.password)) {
            setError('يجب أن تحوي كلمة المرور على أحرف أيضاً');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await authApi.register({
                user_name: formData.user_name,
                password: formData.password
            });
            setSuccess('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (err: unknown) {
            let errorMsg = 'فشل في إنشاء الحساب، يرجى المحاولة مرة أخرى.';
            if (axios.isAxiosError(err)) {
                const detail = err.response?.data?.detail;
                if (detail) {
                    if (typeof detail === 'string') {
                        errorMsg = detail;
                    } else if (Array.isArray(detail)) {
                        errorMsg = detail.map((d: any) => d.msg).join(' | ');
                    } else if (typeof detail === 'object') {
                        errorMsg = JSON.stringify(detail);
                    }
                }
            } else if (err instanceof Error) {
                errorMsg = err.message;
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-4 sm:p-6" dir="rtl">
            
            <Link href="/" className="fixed top-8 right-8 inline-flex items-center gap-2 text-[14px] text-gray-500 hover:text-[#0EA5E9] font-medium transition-colors">
                <ArrowRight className="w-4 h-4" />
                العودة للرئيسية
            </Link>

            <div className="w-full max-w-[480px]">
                <div className="flex justify-center mb-8">
                    <img
                        src="https://alhafez.com/wp-content/uploads/2020/02/%D8%A7%D9%84%D8%AD%D8%A7%D9%81%D8%B8-%D9%85%D8%B9-%D8%A7%D9%84%D8%AE%D8%AF%D9%85%D8%A9.png"
                        alt="الحافظ" 
                        className="h-16 w-auto object-contain"
                    />
                </div>

                {/* Centered Form Card Container */}
                <div className="bg-[#F0F9FF] border border-gray-200 rounded p-8 sm:p-10 w-full relative">
                    
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-[#1F2937] mb-2">إنشاء حساب جديد</h1>
                        <p className="text-[14px] text-gray-600">
                            قم بإنشاء حسابك بسرعة لتتمكن من استخدام كافة ميزات الموقع.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="font-medium text-[13px]">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <p className="font-medium text-[13px]">{success}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        
                        <div>
                            <label className="block text-[13px] font-bold text-[#1F2937] mb-2">
                                اسم المستخدم
                            </label>
                            <div className="relative">
                                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="text" 
                                    required 
                                    value={formData.user_name}
                                    onChange={e => setFormData({ ...formData, user_name: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded py-3 pr-11 pl-4 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9] transition-colors"
                                    placeholder="أدخل اسم المستخدم"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-[#1F2937] mb-2">
                                كلمة المرور
                            </label>
                            <div className="relative">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded py-3 pr-11 pl-12 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9] transition-colors"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0EA5E9] transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-[#8B4513] hover:bg-[#703810] text-white font-medium py-3 rounded flex items-center justify-center transition-colors disabled:opacity-50 text-[14px]"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'إنشاء الحساب'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center border-t border-gray-200 pt-6">
                        <p className="text-[14px] text-[#1F2937]">
                            لديك حساب بالفعل؟{' '}
                            <Link href="/login" className="text-[#0EA5E9] hover:underline font-bold">
                                تسجيل الدخول
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
