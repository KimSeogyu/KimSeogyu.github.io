/**
 * Post 관련 타입 정의
 */

export interface Post {
  id: string
  slug: string
  path: string
  fullPath: string
  title: string
  excerpt: string
  content: string
  docType: 'guide' | 'summary' | 'original'
  category: string
  tags: string[]
  readingTime: number
  wordCount: number
  isFeatured: boolean
  date?: string
  image?: string
}

export interface ContentNode {
  name: string
  type: 'folder' | 'post'
  path: string
  slug?: string
  title?: string
  children?: ContentNode[]
}
