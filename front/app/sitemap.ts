import { MetadataRoute } from 'next'
import axios from 'axios'

// ملاحظة: قم بتغيير هذا الرابط إلى رابط موقعك الحقيقي بعد حجز النطاق (Domain)
const BASE_URL = 'https://alhafez-center.com' 
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: any[] = []

  try {
    // جلب المنتجات مباشرة من السيرفر للأرشفة
    const response = await axios.get(`${API_URL}/api/products?per_page=1000`)
    products = response.data.products || []
  } catch (error) {
    console.error('Sitemap: تعذر جلب المنتجات للأرشفة', error)
  }

  // تجهيز روابط المنتجات
  const productEntries: MetadataRoute.Sitemap = products.map((idOrProduct: any) => {
    const id = typeof idOrProduct === 'object' ? idOrProduct.id : idOrProduct
    return {
      url: `${BASE_URL}/product/${id}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }
  })

  // الروابط الرئيسية للموقع
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
        url: `${BASE_URL}/login`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
    },
    ...productEntries,
  ]
}
