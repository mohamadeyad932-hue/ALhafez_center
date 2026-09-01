'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { invoiceApi } from '@/lib/api';
import {
    Plus,
    Search,
    FileText,
    Trash2,
    Calendar,
    User,
    Hash,
    DollarSign,
    X,
    AlertCircle,
    CheckCircle2,
    Printer,
    Package
} from 'lucide-react';
import axios from 'axios';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await invoiceApi.getAll();
            setInvoices(response.data || []);
        } catch (err: unknown) {
            console.error(err);
            setMessage({ type: 'error', text: 'فشل في تحميل الفواتير' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleDelete = async (id: number) => {
        if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
            try {
                await invoiceApi.delete(id);
                setMessage({ type: 'success', text: 'تم حذف الفاتورة بنجاح' });
                fetchInvoices();
            } catch (err: unknown) {
                setMessage({ type: 'error', text: 'فشل في حذف الفاتورة' });
            }
        }
    };

    const filteredInvoices = invoices.filter((inv: any) =>
        inv.person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePrint = (inv: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const date = new Date(inv.invoice_date).toLocaleDateString('en-US');
        printWindow.document.write(`
            <html dir="rtl">
                <head>
                    <title>فاتورة رقم ${inv.invoice_number}</title>
                    <style>
                        @page { margin: 0; }
                        body { font-family: 'Arial', sans-serif; padding: 2cm; color: #1F2937; font-size: 22px; }
                        .header { text-align: center; border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 40px; }
                        .logo { font-size: 32px; font-weight: bold; color: #0EA5E9; }
                        .invoice-info { display: flex; justify-content: space-between; margin-bottom: 40px; }
                        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                        .details-table th, .details-table td { border: 1px solid #E5E7EB; padding: 15px; text-align: right; font-size: 26px; }
                        .details-table th { background: #F0F9FF; font-weight: bold; }
                        .total { text-align: left; font-size: 28px; font-weight: bold; color: #8B4513; }
                        .footer { margin-top: 60px; text-align: center; font-size: 20px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">صالة الحافظ  - فرع التل جانب البانوراما</div>
                        <h1>فاتورة مبيعات</h1>
                    </div>
                    <div class="invoice-info">
                        <div>
                            <strong>العميل:</strong> ${inv.person_name}<br>
                            <strong>التاريخ:</strong> ${date}
                        </div>
                        <div>
                            <strong>رقم الفاتورة:</strong> ${inv.invoice_number}
                        </div>
                    </div>
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th>السعر</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${inv.product_name}</td>
                                <td>${inv.amount_received} $</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="total">
                        الإجمالي: ${inv.amount_received} $
                    </div>
                    <div class="footer">
                        شكراً لتعاملكم مع صالة الحافظ
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <DashboardLayout>
            <div className="space-y-6" dir="rtl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">إدارة الفواتير</h1>
                        <p className="text-gray-500 text-sm">تتبع المبيعات والتحصيلات المالية</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-[#8B4513] hover:bg-[#703810] text-white font-medium px-5 py-2.5 rounded flex items-center justify-center gap-2 transition-colors inline-flex"
                    >
                        <Plus className="w-5 h-5" />
                        <span>إضافة فاتورة جديدة</span>
                    </button>
                </div>

                {/* Notifications */}
                {message && (
                    <div className={`flex items-center gap-3 p-4 rounded border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="font-medium text-[14px]">{message.text}</p>
                    </div>
                )}

                {/* Search */}
                <div className="flex items-center gap-4 bg-[#F0F9FF] p-4 rounded border border-gray-200">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="ابحث برقم الفاتورة، اسم العميل أو المنتج..."
                            className="w-full bg-white border border-gray-200 text-[#1F2937] rounded pr-10 pl-4 py-2 text-[14px] focus:outline-none focus:border-[#0EA5E9] transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0EA5E9] rounded-full animate-spin" />
                        <p className="text-gray-500 text-[14px] mt-4">جاري تحميل البيانات...</p>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded p-12 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 bg-[#F0F9FF] rounded flex items-center justify-center">
                            <FileText className="w-8 h-8 text-[#0EA5E9]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1F2937]">لا توجد فواتير</h3>
                        <p className="text-gray-500 text-[14px]">لم يتم العثور على أي فواتير مسجلة في النظام.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="text-[#0EA5E9] text-[14px] font-medium border border-[#0EA5E9] hover:bg-[#F0F9FF] px-4 py-2 rounded transition-colors mt-2"
                        >
                            إضافة فاتورة
                        </button>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-[#F0F9FF] border-b border-gray-200">
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">رقم الفاتورة</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">العميل</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">المنتج</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">التاريخ</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">الحالة</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">الإجمالي</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937] text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map((inv: any) => (
                                        <tr key={inv.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-[14px] font-medium text-[#1F2937]">
                                                {inv.invoice_number}
                                            </td>
                                            <td className="p-4 text-[14px] text-gray-700">
                                                {inv.person_name}
                                            </td>
                                            <td className="p-4 text-[14px] text-gray-700">
                                                {inv.product_name}
                                            </td>
                                            <td className="p-4 text-[14px] text-gray-500">
                                                {new Date(inv.invoice_date).toLocaleDateString('en-US')}
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded bg-[#0EA5E9] text-white text-xs font-semibold">
                                                    موثقة
                                                </span>
                                            </td>
                                            <td className="p-4 text-[15px] font-bold text-[#1F2937]">
                                                ${inv.amount_received}
                                            </td>
                                            <td className="p-4 flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handlePrint(inv)}
                                                    className="w-8 h-8 flex items-center justify-center text-[#1F2937] hover:text-[#0EA5E9] hover:bg-[#F0F9FF] rounded transition-colors"
                                                    title="طباعة"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(inv.id)}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-red-500 rounded transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Invoice Modal */}
            {showAddModal && (
                <InvoiceModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => { setShowAddModal(false); fetchInvoices(); setMessage({ type: 'success', text: 'تم تسجيل الفاتورة بنجاح' }); }}
                    onError={(msg: string) => setMessage({ type: 'error', text: msg })}
                />
            )}
        </DashboardLayout>
    );
}

function InvoiceModal({ onClose, onSuccess, onError }: any) {
    const [formData, setFormData] = useState({
        person_name: '',
        invoice_number: '',
        product_name: '',
        amount_received: '',
        invoice_date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { person_name, product_name, amount_received } = formData;
        if (!person_name || !product_name || !amount_received) {
            onError('عذراً، يجب إكمال بيانات الفاتورة.');
            return;
        }

        setLoading(true);
        const processedData = {
            ...formData,
            amount_received: Number(formData.amount_received)
        };

        try {
            await invoiceApi.create(processedData);
            onSuccess();
        } catch (err: unknown) {
            console.error(err);
            let errorMsg = 'فشل حفظ الفاتورة.';
            if (axios.isAxiosError(err)) {
                errorMsg = err.response?.data?.detail || errorMsg;
            }
            onError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded shadow-lg overflow-hidden" dir="rtl">
                <div className="bg-[#F0F9FF] px-6 py-4 flex justify-between items-center border-b border-gray-200">
                    <h2 className="text-lg font-bold text-[#1F2937]">فاتورة جديدة</h2>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[13px] font-bold text-[#1F2937]">اسم العميل</label>
                        <input
                            required
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9]"
                            value={formData.person_name}
                            onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[13px] font-bold text-[#1F2937]">رقم الفاتورة</label>
                            <input
                                placeholder="تلقائي"
                                className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-[14px] text-gray-500 cursor-not-allowed"
                                value={formData.invoice_number}
                                readOnly
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[13px] font-bold text-[#1F2937]">المبلغ ($)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9]"
                                value={formData.amount_received}
                                onChange={(e) => setFormData({ ...formData, amount_received: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[13px] font-bold text-[#1F2937]">التاريخ</label>
                        <input
                            required
                            type="date"
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9]"
                            value={formData.invoice_date}
                            onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[13px] font-bold text-[#1F2937]">المنتج</label>
                        <input
                            required
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9]"
                            value={formData.product_name}
                            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 text-[14px] font-medium transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#8B4513] hover:bg-[#703810] text-white px-6 py-2 rounded text-[14px] font-medium transition-colors flex items-center gap-2"
                        >
                            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            حفظ الفاتورة
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
