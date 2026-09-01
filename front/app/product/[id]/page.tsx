'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productApi, API_URL } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Package, ShoppingCart, ShieldCheck, Truck, Plus, Minus, MessageCircle } from 'lucide-react';

interface ProductData {
    id: string | number;
    name: string;
    description?: string;
    price: number;
    category?: string;
    stock_status: string;
    image_url?: string;
    images?: { id: number; is_primary: boolean }[];
    company?: { id: number; name: string };
}

interface ImageData {
    id: string | number;
}

export default function ProductPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;
    const [product, setProduct] = useState<ProductData | null>(null);
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState<ImageData[]>([]);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (!id) return;
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await productApi.getById(id as string);
                setProduct(res.data);
                setActiveImage(res.data.image_url ? `${API_URL}${res.data.image_url}` : null);

                setImages(res.data.images || []);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleQuantityChange = (type: 'increase' | 'decrease') => {
        if (type === 'increase') {
            setQuantity(prev => prev + 1);
        } else {
            if (quantity > 1) {
                setQuantity(prev => prev - 1);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0EA5E9] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4">
                <h2 className="text-2xl font-bold text-[#1F2937]">المنتج غير موجود</h2>
                <button onClick={() => router.back()} className="px-6 py-2 bg-[#0EA5E9] text-white rounded font-medium hover:bg-[#0284C7] transition-colors">
                    العودة
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-[#1F2937] font-sans pb-24" dir="rtl">
            {/* Header */}
            <nav className="bg-white border-b border-gray-200 h-20 px-6 flex items-center">
                <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-[#0EA5E9] font-medium transition-colors">
                        <ArrowRight className="w-5 h-5" />
                        <span>العودة للرئيسية</span>
                    </Link>
                    <div className="font-bold text-xl text-[#0EA5E9]">صالة الحافظ</div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-[1400px] mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Details Section (Right on Desktop due to RTL with order-1) */}
                <div className="lg:col-span-7 order-2 lg:order-1 space-y-8">
                    <div className="space-y-4 border-b border-gray-200 pb-6">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-white border border-[#0EA5E9] text-[#0EA5E9] font-semibold rounded text-[13px]">
                                {product.company?.name || product.category || "عام"}
                            </span>
                            <span className={`px-3 py-1 font-semibold rounded border text-[13px] ${product.stock_status === 'متوفر' ? 'bg-[#F0F9FF] border-gray-200 text-[#0EA5E9]' : product.stock_status === 'تحت الطلب' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                {product.stock_status}
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-[#1F2937] leading-tight max-w-3xl">
                            {product.name}
                        </h1>
                        <p className="text-3xl font-bold text-[#0EA5E9]">
                            ${product.price}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[#1F2937] border-b border-gray-200 pb-2">التفاصيل الكاملة</h3>
                        <div className="bg-[#F0F9FF] border border-gray-200 p-6 rounded shadow-sm h-auto overflow-hidden">
                            <p className="text-[#1F2937] leading-relaxed text-[15px] whitespace-pre-wrap break-words">
                                {product.description || "لا يوجد وصف إضافي متوفر لهذا المنتج حالياً. هذه القطعة مطابقة للمعايير الهندسية ومناسبة للتمديدات الاحترافية."}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#F0F9FF] border border-gray-200 rounded shadow-sm flex items-start gap-4">
                            <div className="bg-white p-2 rounded border border-gray-200 flex-shrink-0">
                                <ShieldCheck className="text-[#0EA5E9] w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-[#1F2937] text-[15px]">ضمان الجودة</p>
                                <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">جميع منتجاتنا تتمتع بتغطية تأمينية وضمان شامل من الشركات المصنعة.</p>
                            </div>
                        </div>
                        <div className="p-4 bg-[#F0F9FF] border border-gray-200 rounded shadow-sm flex items-start gap-4">
                            <div className="bg-white p-2 rounded border border-gray-200 flex-shrink-0">
                                <Truck className="text-[#0EA5E9] w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-[#1F2937] text-[15px]">توصيل وتركيب احترافي</p>
                                <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">لا تقلق بشأن النقل والتشغيل، فريقنا المختص يوصل أجهزتك لباب منزلك ويركبها لضمان عملها بأعلى كفاءة.</p>
                            </div>
                        </div>
                    </div>

                    {product.stock_status === 'متوفر' && (
                        <div className="pt-8 border-t border-gray-200">
                            <div className="flex flex-wrap items-center gap-6">
                                <a 
                                    href={`https://wa.me/963995949888?text=${encodeURIComponent(`مرحباً صالة الحافظ، أود الاستفسار عن منتج: ${product.name}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-[#0EA5E9] text-white py-4 px-8 rounded font-bold text-lg shadow-lg hover:bg-[#0284C7] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    اطلب الآن عبر واتساب
                                </a>
                            </div>
                        </div>
                    )}

                </div>

                {/* Image Gallery Section (Left on Desktop due to RTL with order-2) */}
                <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
                    <div className="aspect-square bg-[#F0F9FF] border border-gray-200 rounded shadow-sm flex items-center justify-center p-8 overflow-hidden relative">
                        {activeImage ? (
                            <img src={activeImage.startsWith('http') ? activeImage : `${activeImage}`} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                        ) : (
                            <div className="text-gray-400 flex flex-col items-center gap-2">
                                <Package className="w-20 h-20" />
                                <span className="text-[14px]">لا توجد صورة</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        {product.image_url && (
                            <button
                                onClick={() => setActiveImage(`${API_URL}${product.image_url}`)}
                                className={`w-24 h-24 rounded border shadow-sm flex items-center justify-center bg-[#F0F9FF] p-2 shrink-0 transition-colors ${activeImage === `${API_URL}${product.image_url}` ? 'border-[#0EA5E9]' : 'border-gray-200 hover:border-[#0EA5E9]'}`}
                            >
                                <img src={`${API_URL}${product.image_url}`} alt={product.name as string} className="w-full h-full object-contain mix-blend-multiply" />
                            </button>
                        )}
                        {images.map((img) => (
                            <button
                                key={img.id}
                                onClick={() => setActiveImage(`${API_URL}/api/products/images/${img.id}`)}
                                className={`w-24 h-24 rounded border shadow-sm flex items-center justify-center bg-[#F0F9FF] p-2 shrink-0 transition-colors ${activeImage === `${API_URL}/api/products/images/${img.id}` ? 'border-[#0EA5E9]' : 'border-gray-200 hover:border-[#0EA5E9]'}`}
                            >
                                <img src={`${API_URL}/api/products/images/${img.id}`} alt="صورة للمنتج" className="w-full h-full object-contain mix-blend-multiply" />
                            </button>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}
