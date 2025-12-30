// src/lib/posts.ts
// 정적 사이트를 위해 빌드 타임에 생성된 JSON 데이터를 사용

import postsData from '~/data/posts.json'
import contentTreeData from '~/data/contentTree.json'
import type { Post, ContentNode } from '~/types'

// Type assertion for imported JSON
const posts: Post[] = postsData as Post[]
const contentTree: ContentNode[] = contentTreeData as ContentNode[]

export function getAllPosts(): Post[] {
  return posts
}

export function getPostBySlug(slug: string): Post | null {
  // URL 디코딩 처리 (한글 슬러그 지원)
  const decodedSlug = decodeURIComponent(slug)
  return posts.find(post => post.slug === decodedSlug) || null
}

export function getPostByFullPath(fullPath: string): Post | null {
  const decodedPath = decodeURIComponent(fullPath)
  // fullPath matches exactly (e.g. "folder/subfolder/post-slug")
  return posts.find(post => post.fullPath === decodedPath) || null
}

export function getContentTree(): ContentNode[] {
  return contentTree
}

export function getCategories(): { category: string; count: number }[] {
  const counts = posts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

// Re-export types for backward compatibility
export type { Post, ContentNode } from '~/types'
