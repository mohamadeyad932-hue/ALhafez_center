'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { botApi } from '@/lib/api';
import {
    Upload,
    Trash2,
    RefreshCcw,
    FileText,
    Bot,
    AlertCircle,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import axios from 'axios';

export default function BotManagementPage() {
    const [files, setFiles] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const fetchFiles = async () => {
        try {
            const response = await botApi.getFiles();
            setFiles(response.data.files);
        } catch (err: unknown) {
            console.error('Failed to fetch files', err);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setMessage(null);

        try {
            const response = await botApi.uploadKnowledge(formData);
            setMessage({ text: response.data.message || 'Upload succeeded.', type: 'success' });
            fetchFiles();
        } catch (err: unknown) {
            let errorMsg = 'فشل رفع الملف. تأكد أن صيغة الملف مدعومة.';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.detail || errorMsg;
            }
            setMessage({
                text: errorMsg,
                type: 'error'
            });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteFile = async (filename: string) => {
        if (!confirm(`هل أنت متأكد من حذف الملف "${filename}"؟`)) return;

        try {
            await botApi.deleteFile(filename);
            setMessage({ text: 'تم حذف الملف بنجاح', type: 'success' });
            fetchFiles();
        } catch (err: unknown) {
            setMessage({ text: 'فشل حذف الملف', type: 'error' });
        }
    };

    const handleRefreshDb = async () => {
        setRefreshing(true);
        setMessage(null);
        try {
            const response = await botApi.refreshDb();
            setMessage({ text: response.data.message || 'Bot data refreshed successfully!', type: 'success' });
        } catch (err: unknown) {
            setMessage({ text: 'فشل تحديث البيانات', type: 'error' });
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6" dir="rtl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1F2937] mb-1 flex items-center gap-2">
                            <Bot className="w-6 h-6 text-[#0EA5E9]" />
                            إدارة البوت الذكي
                        </h1>
                        <p className="text-gray-500 text-sm">التحكم في المعرفة والبيانات التي يستخدمها المساعد الذكي</p>
                    </div>
                </div>

                {/* Notifications */}
                {message && (
                    <div className={`flex items-center gap-3 p-4 rounded border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="font-medium text-[14px]">{message.text}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Knowledge Files Card */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded flex flex-col overflow-hidden">
                        <div className="bg-[#F0F9FF] px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-[15px] font-bold text-[#1F2937]">ملفات المعرفة</h2>
                                <p className="text-gray-500 text-[12px] mt-0.5">الملفات المدعومة (.docx فقط)</p>
                            </div>
                            <label className="bg-[#8B4513] hover:bg-[#703810] text-white font-medium px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors cursor-pointer text-[13px]">
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <span>رفع ملف جديد</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".docx"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div className="p-0 overflow-x-auto flex-1">
                            {files.length === 0 ? (
                                <div className="text-center py-16 flex flex-col items-center">
                                    <div className="w-12 h-12 bg-[#F0F9FF] rounded flex items-center justify-center mb-3">
                                        <FileText className="w-6 h-6 text-[#0EA5E9]" />
                                    </div>
                                    <p className="text-[#1F2937] font-bold">لا توجد ملفات معرفة</p>
                                    <p className="text-gray-500 text-[13px] mt-1">ارفع مستندات نصية لتعزيز قدرات البوت</p>
                                </div>
                            ) : (
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-white border-b border-gray-200">
                                            <th className="p-4 text-[13px] font-semibold text-[#1F2937] w-12">النوع</th>
                                            <th className="p-4 text-[13px] font-semibold text-[#1F2937]">اسم الملف</th>
                                            <th className="p-4 text-[13px] font-semibold text-[#1F2937]">الصيغة</th>
                                            <th className="p-4 text-[13px] font-semibold text-[#1F2937] text-center w-24">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {files.map((file) => (
                                            <tr key={file} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="w-8 h-8 bg-[#F0F9FF] rounded border border-gray-200 flex items-center justify-center">
                                                        <FileText className="w-4 h-4 text-[#0EA5E9]" />
                                                    </div>
                                                </td>
                                                <td className="p-4 text-[14px] font-medium text-[#1F2937]">{file}</td>
                                                <td className="p-4">
                                                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider">
                                                        {file.split('.').pop()}
                                                    </span>
                                                </td>
                                                <td className="p-4 flex items-center justify-center">
                                                    <button
                                                        onClick={() => handleDeleteFile(file)}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-red-500 rounded transition-colors"
                                                        title="حذف الملف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {files.length > 0 && (
                            <div className="bg-[#F0F9FF] border-t border-gray-200 px-6 py-3">
                                <span className="text-xs text-gray-600 font-medium">إجمالي عدد الملفات المرفوعة: {files.length}</span>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Controls */}
                    <div className="space-y-6">
                        {/* Quick Actions Card */}
                        <div className="bg-white border border-gray-200 rounded flex flex-col">
                            <div className="bg-[#F0F9FF] px-6 py-4 border-b border-gray-200">
                                <h2 className="text-[15px] font-bold text-[#1F2937]">تحديث منتجات المتجر</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600 text-[13px] mb-6 leading-relaxed">
                                    يقرأ البوت المنتجات مباشرة، لكن لاستخراج سياق جديد وتدريبه على أحدث الأسعار والتغيرات، يجب تحديث قاعدة بيانات الربط.
                                </p>
                                <button
                                    onClick={handleRefreshDb}
                                    disabled={refreshing}
                                    className="w-full bg-white border border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#F0F9FF] py-2.5 rounded text-[14px] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                    تحديث بيانات البوت الآن
                                </button>
                            </div>
                        </div>

                        {/* Info/Guide Card */}
                        <div className="bg-[#F0F9FF] border border-[#0EA5E9] rounded p-6">
                            <h3 className="text-[14px] font-bold text-[#1F2937] mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-[#0EA5E9]" />
                                دليل الاستخدام
                            </h3>
                            <ul className="text-gray-700 text-[13px] space-y-3">
                                <li className="flex gap-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 bg-[#0EA5E9] rounded-full shrink-0" />
                                    <span>يعتمد البوت على الملفات المرفوعة للرد على الأسئلة العامة حول شروط الخدمة.</span>
                                </li>
                                <li className="flex gap-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 bg-[#8B4513] rounded-full shrink-0" />
                                    <span>يتم جلب تفاصيل المنتجات والأسعار تلقائياً من قواعد بيانات التطبيق.</span>
                                </li>
                                <li className="flex gap-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 bg-[#0EA5E9] rounded-full shrink-0" />
                                    <span>تأكد من تنظيف النصوص والتأكد من صحتها قبل رفعها لضمان إجابات دقيقة.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
