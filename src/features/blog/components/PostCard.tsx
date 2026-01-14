// src/features/blog/components/PostCard.tsx
import { Link } from '@tanstack/react-router'
import type { Post } from '~/types'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link 
      to="/ko/blog/$"
      params={{ _splat: post.fullPath }}
      className="group block"
    >
      <article className="h-full p-5 rounded-xl border border-border bg-card hover:border-foreground/20 hover:bg-muted/30 transition-all duration-200">
        {/* 카테고리 & 날짜 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className="font-medium text-foreground/70">{post.category}</span>
          <span>·</span>
          <span>{post.date}</span>
        </div>
        
        {/* 제목 */}
        <h3 className="text-base font-semibold mb-2 leading-snug group-hover:text-foreground transition-colors line-clamp-2">
          {post.title}
        </h3>
        
        {/* 발췌 */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {post.excerpt}
        </p>
      </article>
    </Link>
  )
}
