'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X, Package, Sparkles } from 'lucide-react';
import { chatApi, API_URL } from '@/lib/api';
import axios from 'axios';
import { logger } from '@/lib/logger';

type Product = {
    id: number;
    name: string;
    description: string;
    price: number;
    category: string;
    stock_status: string;
    image_url?: string;
};

type Msg = {
    sender: 'user' | 'bot';
    message_content: string;
    products?: Product[];
};

const ModernRobotIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M7 10C7 8.89543 7.89543 8 9 8H15C16.1046 8 17 8.89543 17 10V14C17 16.2091 15.2091 18 13 18H11C8.79086 18 7 16.2091 7 14V10Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8V4M12 4L14 6M12 4L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="10.5" cy="12.5" r="1.5" fill="currentColor"/>
    <circle cx="13.5" cy="12.5" r="1.5" fill="currentColor"/>
    <path d="M4 14V11M20 14V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.5 12.5H7M17 12.5H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([
        { sender: 'bot', message_content: 'أهلاً بك! 👋 أنا مساعدك الذكي من صالة الحافظ. كيف يمكنني مساعدتك في العثور على ما تبحث عنه اليوم؟' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, loading]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = async (e?: React.FormEvent, textInput?: string) => {
        if (e) e.preventDefault();
        const textToSubmit = textInput || input;

        if (!textToSubmit.trim() || loading) return;

        setInput('');
        setMessages(prev => [...prev, { sender: 'user', message_content: textToSubmit }]);
        setLoading(true);

        try {
            const res = await chatApi.sendMessage({
                message: textToSubmit,
                session_id: sessionId,
                customer_name: null, // Ready for future expansion
                customer_phone: null, // Ready for future expansion
            });
            console.log('[ChatBot] Received products:', res.data.products_found);
            setMessages(prev => [...prev, {
                sender: 'bot',
                message_content: res.data.reply,
                products: res.data.products_found,
            }]);
            if (!sessionId) setSessionId(res.data.session_id);
        } catch (err: any) {
            // Enhanced error logging to prevent empty {} in console
            const isAxiosError = axios.isAxiosError(err);
            const errorMessage = isAxiosError ? err.message : (err instanceof Error ? err.message : 'Unknown error');
            const errorStatus = isAxiosError ? err.response?.status : 'NETWORK_ERROR';
            const errorData = isAxiosError ? err.response?.data : null;

            if (typeof window !== 'undefined') {
                logger.error('ChatBot sendMessage failed:', errorMessage, {
                    apiUrl: API_URL,
                    status: errorStatus,
                    data: errorData,
                    error: err // Passing the whole error as last arg
                });
            }
            setMessages(prev => [...prev, {
                sender: 'bot',
                message_content:
                    errorStatus === 429
                        ? 'نعتذر منك، الخدمة حالياً عليها ضغط/تجاوزت الحصة. حاول بعد دقيقة.'
                        : errorStatus
                            ? `تعذر إرسال الرسالة (خطأ ${errorStatus}). تأكد أن السيرفر يعمل على ${API_URL}.`
                            : `تعذر الاتصال بالسيرفر. تأكد أن السيرفر يعمل على ${API_URL}.`,
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-start lg:items-end" dir="rtl">

            {/* ─── Chat Window ─── */}
            <div
                className={`mb-4 w-[calc(100vw-48px)] sm:w-[400px] flex flex-col overflow-hidden transition-all duration-300 origin-bottom-left lg:origin-bottom-right
                    ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none absolute bottom-16'}
                `}
                style={{
                    height: 'min(650px, 80vh)',
                    borderRadius: '24px',
                    background: '#ffffff',
                    boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1), 0 0 20px 0 rgba(14, 165, 233, 0.05)',
                }}
            >
                {/* Header (Glassmorphic) */}
                <div className="relative p-5 flex flex-col flex-shrink-0 bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full blur-xl transform translate-y-1/2 -translate-x-1/4" />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-inner">
                                <ModernRobotIcon className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-[16px] flex items-center gap-2">
                                    انا مساعدك الذكي في صالة الحافظ
                                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <p className="text-white/90 text-[12px] font-medium">متصل وجاهز للمساعدة</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:rotate-90"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 bg-[#F8FAFC] custom-scrollbar">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'} animate-fade-in-up`}>
                            {msg.sender === 'bot' && (
                                <div className="flex gap-2 max-w-[85%] items-end">
                                    <div className="w-8 h-8 bg-gradient-to-br from-[#0EA5E9] to-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0 mb-1 shadow-md">
                                        <ModernRobotIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-white text-[#1E293B] p-3.5 rounded-2xl rounded-br-sm shadow-sm text-[14px] leading-relaxed border border-[#E2E8F0]">
                                        {msg.message_content}
                                    </div>
                                </div>
                            )}

                            {msg.sender === 'user' && (
                                <div className="bg-gradient-to-l from-[#0EA5E9] to-[#2563EB] text-white p-3.5 rounded-2xl rounded-bl-sm shadow-md text-[14px] leading-relaxed max-w-[85%]">
                                    {msg.message_content}
                                </div>
                            )}

                            {/* Product Cards for Recommendations */}
                            {msg.products && msg.products.length > 0 && (
                                <div className="mt-3 pr-10 w-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Package className="w-4 h-4 text-[#0EA5E9]" />
                                        <p className="text-[13px] font-bold text-[#475569]">منتجات مقترحة لك:</p>
                                    </div>
                                    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar">
                                        {msg.products.map((p: any) => (
                                            <a
                                                key={p.id}
                                                href={`/product/${p.id}`}
                                                className="min-w-[150px] bg-white border border-[#E2E8F0] rounded-xl hover:border-[#0EA5E9] hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col snap-center group overflow-hidden"
                                            >
                                                <div className="h-28 bg-[#F1F5F9] flex items-center justify-center p-3 relative group-hover:bg-[#E0F2FE] transition-colors">
                                                    {p.image_url ? (
                                                        <img 
                                                            src={`${API_URL}${p.image_url}`} 
                                                            alt={p.name} 
                                                            className="max-w-[85%] max-h-[85%] object-contain mix-blend-multiply drop-shadow-sm transition-transform duration-300 group-hover:scale-105" 
                                                        />
                                                    ) : (
                                                        <Package className="w-8 h-8 text-[#94A3B8]" />
                                                    )}
                                                </div>
                                                <div className="p-3">
                                                    <p className="text-[12px] font-bold text-[#1E293B] line-clamp-2 leading-snug h-8 mb-1 transition-colors group-hover:text-[#0EA5E9]">{p.name}</p>
                                                    <p className="text-[14px] font-extrabold text-[#0EA5E9]">${p.price}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="flex flex-col items-end animate-fade-in-up">
                            <div className="flex gap-2 max-w-[85%] items-end">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#0EA5E9] to-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0 mb-1 shadow-md">
                                    <ModernRobotIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white border border-[#E2E8F0] py-4 px-5 rounded-2xl rounded-br-sm shadow-sm flex items-center gap-1.5 min-w-[70px]">
                                    <div className="w-2 h-2 bg-[#0EA5E9] rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-[#0EA5E9] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-[#0EA5E9] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={endRef} className="h-2" />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#E2E8F0] flex items-center gap-3 flex-shrink-0 z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.02)]">
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={loading}
                            placeholder="اكتب سؤالك أو استفسارك هنا..."
                            className="w-full bg-[#F1F5F9] border focus:border-[#0EA5E9] focus:bg-white border-transparent rounded-full pl-12 pr-5 py-3.5 text-[14px] text-[#1E293B] focus:outline-none transition-all shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute left-1.5 top-1.5 bottom-1.5 bg-gradient-to-l from-[#0EA5E9] to-[#2563EB] hover:from-[#0284C7] hover:to-[#1D4ED8] text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md rotate-180 transform hover:scale-105 active:scale-95"
                        >
                            <Send className="w-4 h-4 mr-0.5" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Toggle Button Container */}
            <div className="relative flex flex-col items-center">
                {/* Greeting tooltip */}
                {!isOpen && (
                    <div className="absolute -top-12 bg-white text-[#1E293B] px-4 py-1.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.1)] text-[13px] font-bold border border-[#E2E8F0] whitespace-nowrap animate-bounce-slow flex items-center gap-2 pointer-events-none mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                        نحن هنا
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-[#E2E8F0] transform rotate-45" />
                    </div>
                )}

                {/* Main Toggle Button */}
                <button
                    onClick={() => setIsOpen(o => !o)}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 transform hover:scale-105 active:scale-95 relative z-[101]
                        ${isOpen
                            ? 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 hover:text-red-500 rotate-90'
                            : 'bg-gradient-to-tr from-[#0EA5E9] to-[#3B82F6] text-white hover:shadow-[#0EA5E9]/40 hover:shadow-xl rotate-0'
                        }
                    `}
                    title="مساعد الحافظ"
                >
                    {!isOpen && (
                        <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" style={{ animationDuration: '3s' }} />
                    )}

                    {isOpen ? <X className="w-7 h-7" /> : <ModernRobotIcon className="w-7 h-7 relative z-10" />}

                    {!isOpen && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-20" />
                    )}
                </button>
            </div>

            {/* Global Styles for Animations & Scrollbar */}
            <style jsx global>{`
                .animate-fade-in-up {
                    animation: fadeInUp 0.4s ease-out forwards;
                    opacity: 0;
                    transform: translateY(10px);
                }
                
                @keyframes fadeInUp {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-bounce-slow {
                    animation: bounceSlow 3s infinite;
                }

                @keyframes bounceSlow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #CBD5E1;
                    border-radius: 20px;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>
        </div>
    );
}
