import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

type LoginPayload = { user_name: string; password: string };
type RegisterPayload = {
  user_name: string;
  password: string;
  email?: string;
  phone?: string;
  role?: string;
};
type UpdateCredentialsPayload = {
  new_user_name?: string;
  current_password: string;
  new_password?: string;
};
type ProductListParams = {
  page?: number;
  per_page?: number;
  category?: string;
  company_id?: number;
  search?: string;
};
type ProductCreatePayload = Record<string, unknown>;
type ProductUpdatePayload = Record<string, unknown>;
type InvoicePayload = Record<string, unknown>;
type CompanyPayload = {
  name: string;
  description: string;
  logo_url?: string;
};

const resolveApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8001';
    }
    return `${protocol}//${hostname}:8001`;
  }

  return 'http://localhost:8001';
};

const API_BASE_URL = resolveApiBaseUrl();
const ALT_LOCAL_API_URL =
  API_BASE_URL === 'http://localhost:8001'
    ? 'http://127.0.0.1:8001'
    : API_BASE_URL === 'http://127.0.0.1:8001'
      ? 'http://localhost:8001'
      : null;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة التوكن لكل طلب إذا كان موجوداً
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

type RetryableConfig = InternalAxiosRequestConfig & {
  _localRetryDone?: boolean;
};

api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      console.log(`[API Success] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      if (typeof window !== 'undefined') {
        console.error('[API Error] Unknown error', error);
      }
      return Promise.reject(error);
    }

    if (typeof window !== 'undefined') {
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      const url = error.config?.url || 'URL_UNKNOWN';
      console.warn(`[API Warning] ${method} ${url}`, error.response?.data || error.message || error);
    }

    const cfg = error.config as RetryableConfig | undefined;
    const shouldRetryLocalAlt =
      !!cfg &&
      !cfg._localRetryDone &&
      !!ALT_LOCAL_API_URL &&
      !error.response &&
      (error.code === 'ERR_NETWORK' || error.message.toLowerCase().includes('network'));

    if (!shouldRetryLocalAlt) {
      return Promise.reject(error);
    }

    cfg._localRetryDone = true;
    cfg.baseURL = ALT_LOCAL_API_URL;
    return api.request(cfg);
  }
);

export interface User {
  id: number;
  user_name: string;
  role: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface StatsResponse {
  total_products: number;
  total_users: number;
  total_conversations: number;
  out_of_stock_count: number;
  total_companies: number;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    category: string;
    stock_status: string;
    image_url?: string;
    images?: { id: number; is_primary: boolean }[];
}

export interface Category {
  id: number;
  name: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  description: string;
  logo_url?: string;
}

export const authApi = {
  login: (data: LoginPayload) => api.post<AuthResponse>('/api/auth/login', data),
  register: (data: RegisterPayload) => api.post<AuthResponse>('/api/auth/register', data),
  getMe: () => api.get<User>('/api/auth/me'),
  getStats: () => api.get<StatsResponse>('/api/admin/stats'),
  updateCredentials: (data: UpdateCredentialsPayload) => api.put<{ message: string }>('/api/auth/update', data),
};

export const productApi = {
  getAll: (params: ProductListParams = {}) =>
    api.get<{ products: Product[]; total: number; page: number; per_page: number }>('/api/products', { params }),
  getById: (id: string) => api.get<Product>(`/api/products/${id}`),
  getOne: (id: number) => api.get<Product>(`/api/products/${id}`),
  create: (data: ProductCreatePayload) => api.post<Product>('/api/products', data),
  update: (id: number, data: ProductUpdatePayload) => api.put<Product>(`/api/products/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/api/products/${id}`),
  getCategories: () => api.get<{ categories: string[] }>('/api/products/categories'),
  uploadImage: (id: number, formData: FormData) => api.post<{ message: string }>(`/api/products/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteImage: (imageId: number) => api.delete<{ message: string }>(`/api/products/image-delete/${imageId}`),
};

export const chatApi = {
  sendMessage: (data: { 
    message: string, 
    session_id?: string | null,
    customer_name?: string | null,
    customer_phone?: string | null 
  }) => api.post<{ reply: string, session_id: string, products_found: Product[] }>('/api/chat', data),
};

export const invoiceApi = {
  getAll: () => api.get<Invoice[]>('/api/invoices'),
  create: (data: InvoicePayload) => api.post<Invoice>('/api/invoices', data),
  delete: (id: number) => api.delete<{ message: string }>(`/api/invoices/${id}`),
};

export interface BotFilesResponse {
  files: string[];
}

export const botApi = {
  uploadKnowledge: (formData: FormData) => api.post<{ message: string }>('/api/admin/bot/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getFiles: () => api.get<BotFilesResponse>('/api/admin/bot/files'),
  deleteFile: (filename: string) => api.delete<{ message: string }>(`/api/admin/bot/files/${filename}`),
  refreshDb: () => api.post<{ message: string }>('/api/admin/bot/refresh-db'),
};

export const companyApi = {
  getAll: () => api.get<Company[]>('/api/companies'),
  create: (data: CompanyPayload) => api.post<Company>('/api/companies', data),
  update: (id: number, data: CompanyPayload) => api.put<Company>(`/api/companies/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/api/companies/${id}`),
  uploadImage: (id: number, formData: FormData) => api.post<{ message: string }>(`/api/companies/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteImage: (id: number) => api.delete<{ message: string }>(`/api/companies/${id}/image`),
};

export default api;
export { API_BASE_URL as API_URL };
