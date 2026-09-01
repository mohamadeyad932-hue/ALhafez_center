'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { productApi, companyApi, API_URL } from '@/lib/api';
import {
    Plus,
    Search,
    Filter,
    Trash2,
    Edit,
    ChevronLeft,
    ChevronRight,
    Package,
    Building2,
    X,
    Image as ImageIcon,
    AlertCircle,
    CheckCircle2,
    ChevronDown
} from 'lucide-react';
import axios from 'axios';

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Filters
    const [companies, setCompanies] = useState<any[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [filterCompany, setFilterCompany] = useState('الكل');
    const [filterCategory, setFilterCategory] = useState('الكل');
    const [filterStock, setFilterStock] = useState('الكل');
    const [showFilters, setShowFilters] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await productApi.getAll();
            setProducts(response.data.products || []);
        } catch (err: unknown) {
            console.error(err);
            setMessage({ type: 'error', text: 'فشل في تحميل المنتجات' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        companyApi.getAll()
            .then(res => setCompanies(res.data || []))
            .catch(() => { });
        productApi.getCategories()
            .then(res => {
                if (res.data?.categories) setCategories(res.data.categories);
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleDelete = async (id: number) => {
        if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            try {
                await productApi.delete(id);
                setMessage({ type: 'success', text: 'تم حذف المنتج بنجاح' });
                fetchProducts();
            } catch (err: unknown) {
                setMessage({ type: 'error', text: 'فشل في حذف المنتج' });
            }
        }
    };

    const filteredProducts = products.filter((p: any) => {
        // Text search
        const matchesSearch = searchTerm === '' || (
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.company?.name && p.company.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        // Company filter
        const matchesCompany = filterCompany === 'الكل' ||
            (p.company?.id && String(p.company.id) === filterCompany);

        // Category filter
        const matchesCategory = filterCategory === 'الكل' ||
            p.category === filterCategory;

        // Stock status filter
        const matchesStock = filterStock === 'الكل' ||
            p.stock_status === filterStock;

        return matchesSearch && matchesCompany && matchesCategory && matchesStock;
    });

    const activeFilterCount = [filterCompany, filterCategory, filterStock].filter(f => f !== 'الكل').length;

    const resetFilters = () => {
        setFilterCompany('الكل');
        setFilterCategory('الكل');
        setFilterStock('الكل');
        setSearchTerm('');
    };

    return (
        <DashboardLayout>
            <div className="space-y-6" dir="rtl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1F2937] mb-1">إدارة المنتجات</h1>
                        <p className="text-gray-500 text-sm">تحكم بمنتجات متجرك بكل سهولة ويسر.</p>
                    </div>
                    <button
                        onClick={() => { setEditingProduct(null); setShowAddModal(true); }}
                        className="bg-[#8B4513] hover:bg-[#703810] text-white font-medium px-5 py-2.5 rounded flex items-center justify-center gap-2 transition-colors inline-flex"
                    >
                        <Plus className="w-5 h-5" />
                        <span>إضافة منتج</span>
                    </button>
                </div>

                {/* Notifications */}
                {message && (
                    <div className={`flex items-center gap-3 p-4 rounded border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="font-medium text-[14px]">{message.text}</p>
                    </div>
                )}

                {/* Search & Filters (Styled like Home Page) */}
                <div className="flex flex-col lg:flex-row gap-4 items-center bg-[#F0F9FF] p-4 rounded border border-gray-200">
                    <div className="relative w-full lg:flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="ابحث عن منتج بالاسم، الوصف أو الشركة..."
                            className="w-full bg-white border border-gray-200 text-[#1F2937] rounded pr-10 pl-4 py-[11px] text-[14px] focus:outline-none focus:border-[#0EA5E9] transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="w-px h-8 bg-gray-200 hidden lg:block mx-1" />
                    
                    <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0 items-center">
                        {/* Company Filter Dropdown */}
                        <div className="relative shrink-0">
                            <select
                                value={filterCompany}
                                onChange={(e) => setFilterCompany(e.target.value)}
                                className="appearance-none text-[14px] font-medium border border-gray-200 py-[11px] pr-4 pl-10 rounded focus:outline-none transition-colors bg-white text-[#1F2937]"
                            >
                                <option value="الكل">جميع الشركات</option>
                                {companies.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Stock Status Dropdown */}
                        <div className="relative shrink-0">
                            <select
                                value={filterStock}
                                onChange={(e) => setFilterStock(e.target.value)}
                                className="appearance-none text-[14px] font-medium border border-gray-200 py-[11px] pr-4 pl-10 rounded focus:outline-none transition-colors bg-white text-[#1F2937]"
                            >
                                <option value="الكل">كل الحالات</option>
                                <option value="متوفر">متوفر</option>
                                <option value="نفذ">نفذ</option>
                                <option value="تحت الطلب">تحت الطلب</option>
                            </select>
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Category Buttons */}
                        <div className="flex gap-2 shrink-0">
                            {['الكل', ...categories].map(cat => (
                                <button key={cat} onClick={() => setFilterCategory(cat)}
                                    className={`px-5 py-[11px] rounded text-[14px] font-medium whitespace-nowrap border transition-colors shrink-0 
                                        ${filterCategory === cat ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]' : 'bg-white text-[#1F2937] border-gray-200 hover:bg-gray-50'}`}>
                                    {cat === 'الكل' ? 'كل الفئات' : cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0EA5E9] rounded-full animate-spin" />
                        <p className="text-gray-500 text-[14px] mt-4">جاري تحميل البيانات...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded p-12 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 bg-[#F0F9FF] rounded flex items-center justify-center">
                            <Package className="w-8 h-8 text-[#0EA5E9]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1F2937]">لا توجد منتجات</h3>
                        <p className="text-gray-500 text-[14px]">
                            {activeFilterCount > 0 || searchTerm ? 'لا توجد منتجات مطابقة لمعايير البحث والتصفية الحالية.' : 'لم يتم العثور على أي منتجات مسجلة في النظام.'}
                        </p>
                        {(activeFilterCount > 0 || searchTerm) ? (
                            <button
                                onClick={resetFilters}
                                className="text-[#0EA5E9] text-[14px] font-medium border border-[#0EA5E9] hover:bg-[#F0F9FF] px-4 py-2 rounded transition-colors mt-2"
                            >
                                إعادة ضبط المعايير
                            </button>
                        ) : (
                            <button
                                onClick={() => { setEditingProduct(null); setShowAddModal(true); }}
                                className="text-[#0EA5E9] text-[14px] font-medium border border-[#0EA5E9] hover:bg-[#F0F9FF] px-4 py-2 rounded transition-colors mt-2"
                            >
                                إضافة منتج
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-[#F0F9FF] border-b border-gray-200">
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">صورة المنتج</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">الاسم</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">الشركة</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">الفئة</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">حالة التوفر</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937]">السعر</th>
                                        <th className="p-4 text-[13px] font-semibold text-[#1F2937] text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product: any) => (
                                        <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                                                    {product.image_url ? (
                                                        <img src={`${API_URL}${product.image_url}`} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="text-gray-400 w-5 h-5" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-[14px] font-medium text-[#1F2937]">
                                                {product.name}
                                            </td>
                                            <td className="p-4 text-[14px] text-gray-700">
                                                {product.company?.name || '---'}
                                            </td>
                                            <td className="p-4 text-[14px] text-gray-500">
                                                {product.category || '---'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${product.stock_status === 'متوفر' ? 'bg-[#0EA5E9] text-white' : product.stock_status === 'تحت الطلب' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-700'}`}>
                                                    {product.stock_status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[15px] font-bold text-[#1F2937]">
                                                ${product.price}
                                            </td>
                                            <td className="p-4 flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => { setEditingProduct(product); setShowAddModal(true); }}
                                                    className="w-8 h-8 flex items-center justify-center text-[#1F2937] hover:text-[#0EA5E9] hover:bg-[#F0F9FF] rounded transition-colors"
                                                    title="تعديل المنتج"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
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
                        <div className="bg-[#F0F9FF] border-t border-gray-200 px-6 py-3 flex items-center justify-between">
                            <span className="text-xs text-gray-600 font-medium">
                                عرض {filteredProducts.length} من {products.length} منتج
                                {activeFilterCount > 0 && ` (${activeFilterCount} فلتر نشط)`}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Modal */}
            {showAddModal && (
                <ProductModal
                    product={editingProduct}
                    onClose={() => { setShowAddModal(false); setEditingProduct(null); }}
                    onSuccess={() => { setShowAddModal(false); setEditingProduct(null); fetchProducts(); setMessage({ type: 'success', text: editingProduct ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح' }); }}
                    onError={(msg: string) => setMessage({ type: 'error', text: msg })}
                />
            )}
        </DashboardLayout>
    );
}

function ProductModal({ product, onClose, onSuccess, onError }: any) {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        company_id: product?.company_id || '',
        price: product?.price || '',
        description: product?.description || '',
        stock_status: product?.stock_status || 'متوفر'
    });
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<any[]>(
        product?.images?.map((img: any) => ({ id: img.id, url: `${API_URL}/api/products/images/${img.id}` })) || []
    );
    const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await companyApi.getAll();
                setCompanies(response.data || []);
            } catch (err) {}
        };
        fetchCompanies();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.company_id || !formData.price || !formData.description) {
            onError('عذراً، يجب إدخال جميع بيانات المنتج.');
            return;
        }

        if (!product && imageFiles.length === 0) {
            onError('يرجى إضافة صورة واحدة على الأقل.');
            return;
        }

        setLoading(true);

        const processedData = {
            ...formData,
            company_id: formData.company_id === '' ? null : Number(formData.company_id),
            price: formData.price === '' ? null : Number(formData.price)
        };

        try {
            let res;
            if (product) {
                res = await productApi.update(product.id, processedData);
                // Delete removed existing images
                for (const id of deletedImageIds) {
                    await productApi.deleteImage(id).catch(e => console.error(`Failed to delete image ${id}`, e));
                }
            } else {
                res = await productApi.create(processedData);
            }

            if (imageFiles.length > 0) {
                const prodId = product ? product.id : res.data.id;
                for (let i = 0; i < imageFiles.length; i++) {
                    const imgFormData = new FormData();
                    imgFormData.append('file', imageFiles[i]);
                    // Set as primary only if it's a new product or we explicitly want to change it (here we keep it simple for now)
                    if (i === 0 && !product) {
                        imgFormData.append('is_primary', 'true');
                    }
                    await productApi.uploadImage(prodId, imgFormData);
                }
            }

            onSuccess();
        } catch (err: unknown) {
            console.error(err);
            let errorMsg = 'فشل حفظ المنتج.';
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
            <div className="bg-white w-full max-w-2xl rounded shadow-lg overflow-hidden" dir="rtl">
                <div className="bg-[#F0F9FF] px-6 py-4 flex justify-between items-center border-b border-gray-200">
                    <h2 className="text-lg font-bold text-[#1F2937]">{product ? 'تعديل منتج' : 'منتج جديد'}</h2>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[13px] font-bold text-[#1F2937]">اسم المنتج</label>
                            <input
                                required
                                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9]"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[13px] font-bold text-[#1F2937]">الشركة المصنعة</label>
                            <select
                                required
                                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9]"
                                value={formData.company_id}
                                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                            >
                                <option value="">اختر الشركة...</option>
                                {companies.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[13px] font-bold text-[#1F2937]">السعر ($)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9]"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[13px] font-bold text-[#1F2937]">حالة التوفر</label>
                            <select
                                required
                                className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9]"
                                value={formData.stock_status}
                                onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                            >
                                <option value="متوفر">متوفر</option>
                                <option value="نفذ">نفذ</option>
                                <option value="تحت الطلب">تحت الطلب</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#1F2937]">صور المنتج</label>
                        <div className="grid grid-cols-4 gap-4">
                            {imagePreviews.map((img, idx) => (
                                <div key={idx} className="aspect-square bg-gray-50 rounded border border-gray-200 overflow-hidden relative group">
                                    <img src={img.url} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (img.id) {
                                                setDeletedImageIds(prev => [...prev, img.id]);
                                            } else {
                                                // If it's a new file, we need to remove it from imageFiles
                                                // New files are at the end of the imagePreviews array if we are editing
                                                const existingCount = imagePreviews.filter(p => p.id).length;
                                                const newFileIdx = idx - existingCount;
                                                setImageFiles(prev => prev.filter((_, i) => i !== newFileIdx));
                                            }
                                            setImagePreviews(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="absolute top-1 left-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <div className="aspect-square bg-white rounded border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-[#0EA5E9] transition-all cursor-pointer relative">
                                <Plus className="w-6 h-6 mb-1" />
                                <span className="text-[11px] font-bold">صورة</span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (imagePreviews.length + files.length > 5) {
                                            onError('عذراً، لا يمكن رفع أكثر من 5 صور لكل منتج.');
                                            return;
                                        }
                                        if (files.length > 0) {
                                            setImageFiles(prev => [...prev, ...files]);
                                            const newPreviews = files.map(f => ({ url: URL.createObjectURL(f) }));
                                            setImagePreviews(prev => [...prev, ...newPreviews]);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[13px] font-bold text-[#1F2937]">وصف المنتج</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0EA5E9] resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                            {product ? 'تحديث' : 'حفظ المنتج'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
