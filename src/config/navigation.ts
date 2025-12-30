/**
 * 네비게이션 설정
 * 
 * 헤더, 푸터 등에서 사용되는 네비게이션 구조를 중앙 관리합니다.
 */

export interface NavItem {
  title: string
  href: string
  external?: boolean
  icon?: string
}

export const mainNav: NavItem[] = [
  {
    title: 'Resume',
    href: '/resume',
  },
  {
    title: 'Blog',
    href: '/blog',
  },
]

export const socialNav: NavItem[] = [
  {
    title: 'GitHub',
    href: 'https://github.com/KimSeogyu',
    external: true,
    icon: 'github',
  },
  {
    title: 'LinkedIn',
    href: 'https://www.linkedin.com/in/seogyu-kim',
    external: true,
    icon: 'linkedin',
  },
]
