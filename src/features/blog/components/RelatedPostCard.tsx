// src/features/blog/components/RelatedPostCard.tsx
import { Link } from '@tanstack/react-router'
import type { Post } from '~/types'

interface RelatedPostCardProps {
  post: Post
}

export function RelatedPostCard({ post }: RelatedPostCardProps) {
  return (
    <Link
      to="/ko/blog/$"
      params={{ _splat: post.fullPath }}
      className="group block p-4 rounded-xl border border-border hover:border-(--gradient-purple)/30 hover:bg-muted/30 transition-all"
    >
      <span className="text-xs text-(--gradient-purple) font-medium">{post.category}</span>
      <h3 className="font-semibold mt-2 line-clamp-2 group-hover:text-(--gradient-purple) transition-colors">
        {post.title}
      </h3>
      <span className="text-xs text-muted-foreground mt-2 block">{post.date}</span>
    </Link>
  )
}
