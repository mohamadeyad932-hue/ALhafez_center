'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { companyApi } from '@/lib/api';
import {
    Plus,
    Search,
    Building2,
    Trash2,
    Edit,
    X,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import axios from 'axios';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<any>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const response = await companyApi.getAll();
            setCompanies(response.data || []);
        } catch (err: unknown) {
            console.error(err);
            setMessage({ type: 'error', text: 'فشل في تحميل الشركات' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleDelete = async (id: number) => {
        if (confirm('هل أنت متأكد من حذف هذه الشركة؟ سيتم فك ارتباط جميع المنتجات التابعة لها.')) {
            try {
                await companyApi.delete(id);
                setMessage({ type: 'success', text: 'تم حذف الشركة بنجاح' });
                fetchCompanies();
            } catch (err: unknown) {
                setMessage({ type: 'error', text: 'فشل في حذف الشركة' });
            }
        }
    };

    const filteredCompanies = companies.filter((comp: any) =>
        comp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6" dir="rtl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">إدارة الشركات</h1>
                        <p className="text-gray-500 text-sm">إدارة العلامات التجارية للقطع الكهربائية</p>
                    </div>
                    <button
                        onClick={() => { setEditingCompany(null); setShowModal(true); }}
                        className="bg-[#8B4513] hover:bg-[#703810] text-white font-medium px-5 py-2.5 rounded flex items-center justify-center gap-2 transition-colors inline-flex"
                    >
                        <Plus className="w-5 h-5" />
                        <span>إضافة شركة جديدة</span>
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
                            placeholder="ابحث عن شركة..."
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
                ) : filteredCompanies.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded p-12 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 bg-[#F0F9FF] rounded flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-[#0EA5E9]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1F2937]">لا توجد شركات</h3>
                        <p className="text-gray-500 text-[14px]">أضف العلامات التجارية للقطع التي تعرضها</p>
                        <button
                            onClick={() => { setEditingCompany(null); setShowModal(true); }}
                            className="text-[#0EA5E9] text-[14px] font-medium border border-[#0EA5E9] hover:bg-[#F0F9FF] px-4 py-2 rounded transition-colors mt-2"
                        >
                            إضافة شركة
                        </button>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-[#F0F9FF] border-b border-gray-200">
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">الاسم</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">الوصف</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937] text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCompanies.map((comp: any) => (
                                        <tr key={comp.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-[14px] font-medium text-[#1F2937]">
                                                {comp.name}
                                            </td>
                                            <td className="p-4 text-[14px] text-gray-500">
                                                {comp.description ? (
                                                    <span className="line-clamp-1">{comp.description}</span>
                                                ) : '---'}
                                            </td>
                                            <td className="p-4 flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => { setEditingCompany(comp); setShowModal(true); }}
                                                    className="w-8 h-8 flex items-center justify-center text-[#1F2937] hover:text-[#0EA5E9] hover:bg-[#F0F9FF] rounded transition-colors"
                                                    title="تعديل"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(comp.id)}
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

            {/* Company Modal */}
            {showModal && (
                <CompanyModal
                    company={editingCompany}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchCompanies(); setMessage({ type: 'success', text: `تم ${editingCompany ? 'تحديث' : 'إضافة'} الشركة بنجاح` }); }}
                    onError={(msg: string) => setMessage({ type: 'error', text: msg })}
                />
            )}
        </DashboardLayout>
    );
}

function CompanyModal({ company, onClose, onSuccess, onError }: any) {
    const [formData, setFormData] = useState({
        name: company?.name || '',
        description: company?.description || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            onError('يرجى إدخال اسم الشركة');
            return;
        }

        setLoading(true);
        try {
            if (company) {
                await companyApi.update(company.id, formData);
            } else {
                await companyApi.create(formData);
            }

            onSuccess();
        } catch (err: unknown) {
            let errorMsg = 'فشل حفظ البيانات';
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
            <div className="bg-white w-full max-w-md rounded shadow-lg overflow-hidden" dir="rtl">
                <div className="bg-[#F0F9FF] px-6 py-4 flex justify-between items-center border-b border-gray-200">
                    <h2 className="text-lg font-bold text-[#1F2937]">{company ? 'تعديل شركة' : 'إضافة شركة'}</h2>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[13px] font-bold text-[#1F2937]">اسم الشركة</label>
                        <input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[13px] font-bold text-[#1F2937]">الوصف (اختياري)</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9] resize-none"
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
                            {company ? 'تحديث' : 'حفظ الشركة'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}