/**
 * 사이트 메타데이터 설정
 * 
 * SEO, 소셜 미디어 공유 등에 사용되는 사이트 정보를 중앙 관리합니다.
 */

export const siteConfig = {
  name: 'Kim Seogyu',
  title: 'Kim Seogyu | Software Engineer',
  description: 'Software Engineer leveraging deep backend expertise to build scalable systems and tackle complex challenges in AI.',
  url: 'https://sayu.day',
  author: {
    name: 'Kim Seogyu',
    email: 'asap0208@gmail.com',
    github: 'https://github.com/KimSeogyu',
    linkedin: 'https://www.linkedin.com/in/seogyu-kim-7b5a88195/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Kim Seogyu Portfolio',
    locale: 'ko_KR',
  },
  ogImage: 'https://github.com/KimSeogyu.png',
  twitter: {
    card: 'summary_large_image',
  },
} as const

export type SiteConfig = typeof siteConfig
