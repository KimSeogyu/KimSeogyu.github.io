import { createFileRoute, Link } from '@tanstack/react-router'
import { getAllTags } from '~/lib/posts'
import { ArrowLeft, Tag } from 'lucide-react'

export const Route = createFileRoute('/blog/tags')({
  loader: () => {
    const tags = getAllTags()
    return { tags }
  },
  head: () => ({
    meta: [
      { title: 'Tags | Kim Seogyu' },
      { name: 'description', content: 'Browse articles by tags' },
    ],
  }),
  component: TagsPage,
})

function TagsPage() {
  const { tags } = Route.useLoaderData()
  
  // 태그 크기를 count에 따라 동적으로 계산
  const maxCount = Math.max(...tags.map(t => t.count))
  const getSize = (count: number) => {
    const ratio = count / maxCount
    if (ratio > 0.7) return 'text-2xl font-bold'
    if (ratio > 0.4) return 'text-xl font-semibold'
    if (ratio > 0.2) return 'text-lg font-medium'
    return 'text-base'
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-(--gradient-purple) transition-colors text-sm font-medium group mb-4"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Articles
          </Link>
          
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Tag className="w-8 h-8 text-(--gradient-purple)" />
            Tags
          </h1>
          <p className="text-muted-foreground">
            Browse {tags.length} tags across all articles
          </p>
        </div>
        
        {/* 태그 클라우드 */}
        <div className="flex flex-wrap gap-3 p-6 rounded-xl border border-border bg-card">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              to="/blog/tags/$"
              params={{ _splat: tag }}
              className={`
                px-4 py-2 rounded-full border border-border
                hover:border-(--gradient-purple) hover:bg-(--gradient-purple)/10
                hover:text-(--gradient-purple) transition-all duration-200
                ${getSize(count)}
              `}
            >
              #{tag}
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({count})
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
