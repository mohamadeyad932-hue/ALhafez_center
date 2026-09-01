import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // ملاحظة: قم بتغيير هذا الرابط إلى رابط موقعك الحقيقي بعد حجز النطاق (Domain)
  const BASE_URL = 'https://alhafez-center.com' 

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/'], // منع جوجل من الدخول لصفحات الإدارة السرية
    },
    sitemap: `${BASE_URL}/sitemap.xml`, // إخبار جوجل بمكان خريطة الموقع
  }
}
