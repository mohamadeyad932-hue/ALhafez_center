'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { invoiceApi } from '@/lib/api';
import { FileText, Printer, Calendar, DollarSign, ListOrdered } from 'lucide-react';

export default function ReportsPage() {
    const [allInvoices, setAllInvoices] = useState<any[]>([]);
    const [loadingReport, setLoadingReport] = useState(true);
    const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month' | 'all'>('week');

    useEffect(() => {
        const fetchInvoicesForReport = async () => {
            setLoadingReport(true);
            try {
                const res = await invoiceApi.getAll();
                setAllInvoices(res.data);
            } catch (err) {
                console.error("Failed to load invoices", err);
            } finally {
                setLoadingReport(false);
            }
        };
        fetchInvoicesForReport();
    }, []);

    const getFilteredInvoices = () => {
        if (reportPeriod === 'all') return allInvoices;
        const now = new Date();
        const cutoff = new Date();
        if (reportPeriod === 'day') cutoff.setDate(now.getDate() - 1);
        else if (reportPeriod === 'week') cutoff.setDate(now.getDate() - 7);
        else cutoff.setMonth(now.getMonth() - 1);
        return allInvoices.filter((inv: any) => new Date(inv.invoice_date) >= cutoff);
    };

    const periodLabel = reportPeriod === 'day' ? 'آخر يوم' : reportPeriod === 'week' ? 'آخر أسبوع' : reportPeriod === 'month' ? 'آخر شهر' : 'كل الفترات';
    const filtered = getFilteredInvoices();
    const total = filtered.reduce((sum: number, inv: any) => sum + (inv.amount_received || 0), 0);

    const handlePrintReport = () => {
        const win = window.open('', '_blank');
        if (!win) {
            alert('يرجى السماح بفتح النوافذ المنبثقة للطباعة (Pop-ups allowed)');
            return;
        }
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
                @page { margin: 0; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2cm; color: #1F2937; margin:0; }
                .header { border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                .logo { font-size: 24px; font-weight: bold; color: #0EA5E9; }
                .meta { text-align: left; font-size: 18px; color: #1F2937; line-height: 2.0; }
                .summary { display: flex; gap: 20px; margin-bottom: 30px; }
                .summary-card { flex: 1; border: 1px solid #E5E7EB; background: #F0F9FF; padding: 16px; text-align: center; border-radius: 8px; }
                .summary-card .number { font-size: 24px; font-weight: bold; color: #0EA5E9; }
                .summary-card .label { font-size: 13px; color: #1F2937; margin-top: 4px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: #F0F9FF; color: #1F2937; font-weight: bold; font-size: 16px; padding: 12px 14px; text-align: right; border: 1px solid #E5E7EB; }
                td { padding: 12px 14px; border: 1px solid #E5E7EB; font-size: 18px; }
                .total-row { background: #F9FAFB; font-weight: bold; }
                .footer { text-align: center; color: #6B7280; font-size: 16px; border-top: 1px solid #E5E7EB; padding-top: 20px; }
            </style></head><body>
            <div class="header">
                <div class="logo">صالة الحافظ </div>
                <div class="meta">
                    <strong>الفرع:</strong> فرع التل جانب البانوراما<br>
                    <strong>نوع التقرير:</strong> ${periodLabel}<br>
                    <strong>تاريخ الطباعة:</strong> ${new Date().toLocaleDateString('en-US')}
                </div>
            </div>
            <div class="summary">
                <div class="summary-card"><div class="number">${filtered.length}</div><div class="label">إجمالي الفواتير</div></div>
                <div class="summary-card"><div class="number">${total.toFixed(2)} $</div><div class="label">إجمالي الإيرادات</div></div>
            </div>
            ${filtered.length === 0 ? '<p style="text-align:center;color:#6B7280;padding:40px;">لا توجد فواتير لتصديرها في هذه الفترة</p>' : `
            <table><thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>المنتج</th><th>التاريخ</th><th>المبلغ</th></tr></thead>
            <tbody>${rows}<tr><td colspan="4" class="total-row" style="text-align:right;">الإجمالي الكلي</td><td class="total-row">${total.toFixed(2)} $</td></tr></tbody></table>`}
            <div class="footer">شكراً لتعاملكم مع صالة الحافظ</div>
            <script>window.onload=function(){window.print(); window.setTimeout(function(){window.close();}, 500);}</script></body></html>`);
        win.document.close();
    };

    return (
        <DashboardLayout>
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">إعداد وتصدير التقارير</h1>
                        <p className="text-gray-500 text-sm">قم بتحديد الفترة الزمنية واطبع تقرير مبيعاتك.</p>
                    </div>
                    <button onClick={handlePrintReport} disabled={loadingReport || filtered.length === 0}
                        className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-medium px-6 py-2.5 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                        <Printer className="w-5 h-5" />
                        <span>طباعة التقرير</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Controls Sidebar */}
                    <div className="col-span-1 space-y-6">
                        <div className="bg-white border border-gray-200 p-6 rounded">
                            <h3 className="font-bold text-[#1F2937] mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#0EA5E9]" /> تحديد الفترة
                            </h3>
                            <div className="flex flex-col gap-2">
                                {[
                                    { value: 'day', label: 'مبيعات اليوم (آخر 24 ساعة)' },
                                    { value: 'week', label: 'مبيعات الأسبوع (آخر 7 أيام)' },
                                    { value: 'month', label: 'مبيعات الشهر (آخر 30 يوم)' }
                                ].map(opt => (
                                    <button key={opt.value} onClick={() => setReportPeriod(opt.value as any)}
                                        className={`p-3 border rounded text-right transition-colors text-[14px] font-medium ${reportPeriod === opt.value
                                            ? 'border-[#0EA5E9] bg-[#F0F9FF] text-[#0EA5E9]'
                                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 p-6 rounded border-t-4 border-t-[#0EA5E9]">
                            <h3 className="font-bold text-[#1F2937] mb-4">ملخص سريع</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#F0F9FF] rounded-full flex items-center justify-center text-[#0EA5E9]">
                                        <ListOrdered className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">عدد الفواتير</p>
                                        <p className="font-bold text-[#1F2937] text-lg">{filtered.length}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">إجمالي الإيرادات</p>
                                        <p className="font-bold text-[#1F2937] text-lg">${total.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="bg-white border border-gray-200 rounded h-full flex flex-col">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-bold text-[#1F2937] flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-500" /> معاينة التقرير ({periodLabel})
                                </h3>
                            </div>
                            <div className="p-6 flex-1 bg-white overflow-x-auto">
                                {loadingReport ? (
                                    <div className="flex flex-col items-center justify-center p-10 h-full">
                                        <div className="animate-spin w-8 h-8 border-2 border-gray-200 border-t-[#0EA5E9] rounded-full" />
                                        <p className="text-gray-500 mt-4 text-sm">جاري جلب الفواتير...</p>
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-10 h-full text-center">
                                        <FileText className="w-12 h-12 text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium">لا توجد فواتير لهذه الفترة الزمنية.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-right border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="p-3 text-[13px] font-semibold text-[#1F2937]">رقم الفاتورة</th>
                                                <th className="p-3 text-[13px] font-semibold text-[#1F2937]">التاريخ</th>
                                                <th className="p-3 text-[13px] font-semibold text-[#1F2937]">العميل</th>
                                                <th className="p-3 text-[13px] font-semibold text-[#1F2937]">المنتج</th>
                                                <th className="p-3 text-[13px] font-semibold text-[#1F2937]">المبلغ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((inv: any) => (
                                                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="p-3 text-[13px] font-medium">{inv.invoice_number || '-'}</td>
                                                    <td className="p-3 text-[13px] text-gray-500">{new Date(inv.invoice_date).toLocaleDateString('en-US')}</td>
                                                    <td className="p-3 text-[13px] text-gray-600">{inv.person_name}</td>
                                                    <td className="p-3 text-[13px] text-gray-600">{inv.product_name}</td>
                                                    <td className="p-3 text-[13px] font-bold text-[#1F2937]">${inv.amount_received}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-[#F0F9FF]">
                                                <td colSpan={4} className="p-3 text-left font-bold text-[#1F2937]">الإجمالي الكلي</td>
                                                <td className="p-3 font-bold text-[#0EA5E9]">${total.toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
