'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Package, MessageSquare, AlertCircle, Box, Building2, FileText, Printer, X, KeyRound, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { authApi, invoiceApi, productApi, API_URL } from '@/lib/api';
import axios from 'axios';
import Link from 'next/link';

export default function AdminDashboard() {
    const [realStats, setRealStats] = useState<any>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showPassModal, setShowPassModal] = useState(false);
    const [passForm, setPassForm] = useState({ current_password: '', new_user_name: '', new_password: '' });
    const [passLoading, setPassLoading] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [passMsg, setPassMsg] = useState({ text: '', type: '' });
    const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month'>('week');
    const [allInvoices, setAllInvoices] = useState<any[]>([]);
    const [recentProducts, setRecentProducts] = useState<any[]>([]);
    const [loadingReport, setLoadingReport] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        authApi.getStats().then(r => setRealStats(r.data)).catch(() => { });
        setLoadingProducts(true);
        productApi.getAll({ page: 1, per_page: 5 })
            .then(r => setRecentProducts(r.data.products || []))
            .catch(() => { })
            .finally(() => setLoadingProducts(false));
    }, []);

    const fetchInvoicesForReport = () => {
        setLoadingReport(true);
        invoiceApi.getAll()
            .then(r => setAllInvoices(r.data || []))
            .catch(() => { })
            .finally(() => setLoadingReport(false));
    };

    const getFilteredInvoices = () => {
        const now = new Date();
        const cutoff = new Date();
        if (reportPeriod === 'day') cutoff.setDate(now.getDate() - 1);
        else if (reportPeriod === 'week') cutoff.setDate(now.getDate() - 7);
        else cutoff.setMonth(now.getMonth() - 1);
        return allInvoices.filter((inv: any) => new Date(inv.invoice_date) >= cutoff);
    };

    const periodLabel = reportPeriod === 'day' ? 'آخر يوم' : reportPeriod === 'week' ? 'آخر أسبوع' : 'آخر شهر';

    const handlePrintReport = () => {
        const filtered = getFilteredInvoices();
        const total = filtered.reduce((sum: number, inv: any) => sum + (inv.amount_received || 0), 0);
        const win = window.open('', '_blank');
        if (!win) return;
        const rows = filtered.map((inv: any) => `
            <tr>
                <td>${inv.invoice_number || '-'}</td>
                <td>${inv.person_name}</td>
                <td>${inv.product_name}</td>
                <td>${new Date(inv.invoice_date).toLocaleDateString('en-US')}</td>
                <td style="font-weight:bold; color:#1F2937;">${inv.amount_received} $</td>
            </tr>`).join('');

        win.document.write(`<html dir="rtl"><head><title>تقرير المبيعات</title>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 40px; color: #1F2937; margin:0; }
                .header { border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                .logo { font-size: 20px; font-weight: bold; color: #0EA5E9; }
                .meta { text-align: left; font-size: 13px; color: #6B7280; }
                .summary { display: flex; gap: 20px; margin-bottom: 30px; }
                .summary-card { flex: 1; border: 1px solid #E5E7EB; background: #F0F9FF; padding: 16px; text-align: center; }
                .summary-card .number { font-size: 24px; font-weight: bold; color: #0EA5E9; }
                .summary-card .label { font-size: 13px; color: #1F2937; margin-top: 4px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: #F0F9FF; color: #1F2937; font-weight: bold; font-size: 13px; padding: 12px 14px; text-align: right; border: 1px solid #E5E7EB; }
                td { padding: 12px 14px; border: 1px solid #E5E7EB; font-size: 14px; }
                .total-row { background: #F9FAFB; font-weight: bold; }
                .footer { text-align: center; color: #6B7280; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 20px; }
            </style></head><body>
            <div class="header"><div class="logo">صالة الحافظ للقطع الكهربائية - فرع التل جانب البانوراما</div>
            <div class="meta">تقرير: ${periodLabel}<br>تاريخ الطباعة: ${new Date().toLocaleDateString('en-US')}</div></div>
            <div class="summary">
                <div class="summary-card"><div class="number">${filtered.length}</div><div class="label">إجمالي الفواتير</div></div>
                <div class="summary-card"><div class="number">${total.toFixed(2)} $</div><div class="label">إجمالي الإيرادات</div></div>
            </div>
            ${filtered.length === 0 ? '<p style="text-align:center;color:#6B7280;padding:40px;">لا توجد فواتير</p>' : `
            <table><thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>المنتج</th><th>التاريخ</th><th>المبلغ</th></tr></thead>
            <tbody>${rows}<tr><td colspan="4" class="total-row" style="text-align:right;">الإجمالي الكلي</td><td class="total-row">${total.toFixed(2)} $</td></tr></tbody></table>`}
            <div class="footer">شكراً لتعاملكم مع صالة الحافظ</div>
            <script>window.onload=function(){window.print();}</script></body></html>`);
        win.document.close();
    };

    const stats = [
        { name: 'إجمالي المنتجات', value: realStats?.total_products || '—', icon: Package },
        { name: 'الشركات المسجلة', value: realStats?.total_companies || '—', icon: Building2 },
        { name: 'نفذ من المخزون', value: realStats?.out_of_stock_count || '—', icon: AlertCircle },
        { name: 'إجمالي المحادثات', value: realStats?.total_conversations || '—', icon: MessageSquare },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">لوحة الإحصائيات</h1>
                        <p className="text-gray-500 text-sm">نظرة عامة على نشاط النظام</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => { setShowPassModal(true); setPassMsg({ text: '', type: '' }); setPassForm({ current_password: '', new_user_name: '', new_password: '' }); }}
                            className="bg-white border border-gray-200 hover:bg-gray-50 text-[#1F2937] font-medium px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors inline-flex text-[14px]">
                            <KeyRound className="w-4 h-4 text-gray-500" /> تغيير كلمة المرور
                        </button>

                        <button onClick={() => window.location.reload()}
                            className="bg-[#8B4513] hover:bg-[#703810] text-white font-medium px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors inline-flex text-[14px]">
                            <RefreshCw className="w-4 h-4" /> تحديث البيانات
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((s, i) => (
                        <div key={s.name} className="bg-[#F0F9FF] border border-gray-200 rounded p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[13px] font-bold text-[#1F2937]">{s.name}</p>
                                <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                    <s.icon className="w-4 h-4 text-[#0EA5E9]" />
                                </div>
                            </div>
                            <p className="text-[28px] font-bold text-[#0EA5E9]">{s.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Products Data Table */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#F0F9FF]">
                            <h2 className="text-[15px] font-bold text-[#1F2937] flex items-center gap-2">
                                <Box className="w-5 h-5 text-[#0EA5E9]" />
                                المضافة حديثاً
                            </h2>
                            <a href="/admin/dashboard/products" className="text-[13px] text-[#0EA5E9] hover:underline font-bold">
                                إدارة المنتجات
                            </a>
                        </div>
                        <div className="p-0 overflow-x-auto flex-1">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200">
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">صورة</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">اسم المنتج</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">الشركة</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">الحالة</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">السعر</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingProducts ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                                        </tr>
                                    ) : recentProducts.length > 0 ? (
                                        recentProducts.map((p: any) => (
                                            <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="p-3">
                                                    <div className="w-8 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                                                        {p.image_url ?
                                                            <img src={`${API_URL}${p.image_url}`} className="w-full h-full object-cover" /> :
                                                            <Package className="w-4 h-4 text-gray-400" />
                                                        }
                                                    </div>
                                                </td>
                                                <td className="p-3 text-[14px] font-medium text-[#1F2937]">{p.name}</td>
                                                <td className="p-3 text-[13px] text-gray-600">{p.company?.name || '---'}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${p.stock_status === 'متوفر' ? 'bg-[#0EA5E9] text-white' : 'bg-gray-200 text-gray-700'}`}>
                                                        {p.stock_status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-[14px] font-bold text-[#1F2937]">${p.price}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">لا توجد منتجات حديثة</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Summary Sidebar */}
                    <div className="bg-white border border-gray-200 rounded flex flex-col">
                        <div className="bg-[#F0F9FF] px-6 py-4 border-b border-gray-200">
                            <h2 className="text-[15px] font-bold text-[#1F2937]">ملخص التقرير</h2>
                        </div>
                        <div className="p-6 space-y-4 flex-1 text-[14px]">
                            <div className="flex justify-between pb-3 border-b border-gray-200">
                                <span className="text-gray-600">المنتجات المتوفرة</span>
                                <span className="font-bold text-[#1F2937]">{realStats?.total_products || '0'}</span>
                            </div>
                            <div className="flex justify-between pb-3 border-b border-gray-200">
                                <span className="text-gray-600">نفذ من المخزون</span>
                                <span className="font-bold text-red-600">{realStats?.out_of_stock_count || '0'}</span>
                            </div>
                            <div className="flex justify-between pb-3 border-b border-gray-200">
                                <span className="text-gray-600">الشركات المسجلة</span>
                                <span className="font-bold text-[#1F2937]">{realStats?.total_companies || '0'}</span>
                            </div>
                            <div className="flex justify-between pb-3">
                                <span className="text-gray-600">المحادثات المنجزة</span>
                                <span className="font-bold text-[#1F2937]">{realStats?.total_conversations || '0'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded shadow-lg overflow-hidden" dir="rtl">
                        <div className="bg-[#F0F9FF] px-6 py-4 flex justify-between items-center border-b border-gray-200">
                            <h2 className="text-[15px] font-bold text-[#1F2937] flex items-center gap-2">
                                <FileText className="w-4 h-4" /> تقرير المبيعات
                            </h2>
                            <button onClick={() => setShowReportModal(false)} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'day', label: 'يوم' },
                                    { value: 'week', label: 'أسبوع' },
                                    { value: 'month', label: 'شهر' },
                                ].map(opt => (
                                    <button key={opt.value} onClick={() => setReportPeriod(opt.value as any)}
                                        className={`p-3 border rounded text-center transition-colors text-[13px] font-bold ${reportPeriod === opt.value
                                                ? 'border-[#0EA5E9] bg-[#0EA5E9] text-white'
                                                : 'border-gray-200 text-[#1F2937] hover:bg-gray-50'
                                            }`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {!loadingReport && (
                                <div className="bg-[#F0F9FF] p-4 border border-gray-200 rounded grid grid-cols-2 gap-2 text-center">
                                    <div className="border-r border-gray-200">
                                        <div className="text-lg font-bold text-[#1F2937]">{getFilteredInvoices().length}</div>
                                        <div className="text-[12px] text-gray-500">فاتورة</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-[#8B4513]">
                                            {getFilteredInvoices().reduce((s: number, i: any) => s + (i.amount_received || 0), 0).toFixed(2)} $
                                        </div>
                                        <div className="text-[12px] text-gray-500">إيرادات</div>
                                    </div>
                                </div>
                            )}

                            <button onClick={handlePrintReport} disabled={loadingReport}
                                className="w-full bg-[#8B4513] hover:bg-[#703810] text-white font-medium py-2 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-[14px]">
                                {loadingReport ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Printer className="w-4 h-4" />}
                                طباعة التقرير
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {showPassModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded shadow-lg overflow-hidden" dir="rtl">
                        <div className="bg-[#F0F9FF] px-6 py-4 flex justify-between items-center border-b border-gray-200">
                            <h2 className="text-[15px] font-bold text-[#1F2937] flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-red-500" /> تغيير الحماية
                            </h2>
                            <button onClick={() => setShowPassModal(false)} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[13px] font-bold text-[#1F2937]">اسم المستخدم (اختياري)</label>
                                <input type="text" value={passForm.new_user_name}
                                    onChange={e => setPassForm({ ...passForm, new_user_name: e.target.value })}
                                    className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#0EA5E9]" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[13px] font-bold text-[#1F2937]">كلمة مرور جديدة (اختياري)</label>
                                <div className="relative">
                                    <input type={showNewPass ? "text" : "password"} value={passForm.new_password}
                                        onChange={e => setPassForm({ ...passForm, new_password: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded px-3 py-2 pr-4 pl-10 text-[14px] focus:outline-none focus:border-[#0EA5E9]" />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPass(!showNewPass)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0EA5E9] transition-colors focus:outline-none"
                                    >
                                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1 border-t border-gray-200 pt-4 mt-2">
                                <label className="text-[13px] font-bold text-red-600">كلمة المرور الحالية (مطلوب)</label>
                                <div className="relative">
                                    <input type={showCurrentPass ? "text" : "password"} value={passForm.current_password}
                                        onChange={e => setPassForm({ ...passForm, current_password: e.target.value })}
                                        className="w-full bg-red-50 border border-red-200 rounded px-3 py-2 pr-4 pl-10 text-[14px] focus:outline-none focus:border-red-400" />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 text-red-300 hover:text-red-600 transition-colors focus:outline-none"
                                    >
                                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {passMsg.text && (
                                <div className={`p-2 rounded text-[13px] font-medium text-center border ${passMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>{passMsg.text}</div>
                            )}

                            <button
                                onClick={async () => {
                                    if (!passForm.current_password) {
                                        setPassMsg({ text: 'أدخل كلمة المرور الحالية', type: 'error' }); return;
                                    }

                                    if (passForm.new_password) {
                                        if (passForm.new_password.length < 8) {
                                            setPassMsg({ text: 'يجب أن تكون كلمة المرور 8 أحرف لـ الأقل', type: 'error' });
                                            return;
                                        }
                                        if (!/\d/.test(passForm.new_password)) {
                                            setPassMsg({ text: 'يجب ان يستعمل ارقام داخل الكلمة', type: 'error' });
                                            return;
                                        }
                                        if (!/[a-zA-Zء-ي]/.test(passForm.new_password)) {
                                            setPassMsg({ text: 'يجب أن تحوي كلمة المرور على أحرف أيضاً', type: 'error' });
                                            return;
                                        }
                                    }

                                    if (passForm.new_user_name && passForm.new_user_name.length < 4) {
                                        setPassMsg({ text: 'يجب ان يكون اسم المستخدم 4 احرف على الأقل', type: 'error' });
                                        return;
                                    }

                                    setPassLoading(true);
                                    try {
                                        await authApi.updateCredentials(passForm);
                                        setPassMsg({ text: 'تم التحديث بنجاح', type: 'success' });
                                        setTimeout(() => setShowPassModal(false), 1500);
                                    } catch (err: unknown) {
                                        let errorMsg = 'فشل التحديث';
                                        if (axios.isAxiosError(err)) {
                                            errorMsg = err.response?.data?.detail || errorMsg;
                                        }
                                        setPassMsg({ text: errorMsg, type: 'error' });
                                    } finally { setPassLoading(false); }
                                }}
                                disabled={passLoading}
                                className="w-full bg-[#8B4513] hover:bg-[#703810] text-white font-medium py-2 rounded flex items-center justify-center transition-colors disabled:opacity-50 text-[14px]">
                                {passLoading ? 'جاري التحقق...' : 'تأكيد التحديث'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
