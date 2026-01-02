import { createFileRoute, Link } from '@tanstack/react-router'
import { getPostsBySeries } from '~/lib/posts'
import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight } from 'lucide-react'

export const Route = createFileRoute('/blog/series/$')({
  loader: ({ params }) => {
    const seriesSlug = decodeURIComponent(params._splat || '')
    const posts = getPostsBySeries(seriesSlug)
    return { seriesSlug, posts }
  },
  head: ({ loaderData }) => {
    const title = loaderData?.seriesSlug
      ?.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    return {
      meta: [
        { title: `${title} Series | Kim Seogyu` },
        { name: 'description', content: `Complete ${title} article series` },
      ],
    }
  },
  component: SeriesDetailPage,
})

// 시리즈 슬러그를 보기 좋은 제목으로 변환
function formatSeriesTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function SeriesDetailPage() {
  const { seriesSlug, posts } = Route.useLoaderData()
  const seriesTitle = formatSeriesTitle(seriesSlug)
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            to="/blog/series"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-(--gradient-purple) transition-colors text-sm font-medium group mb-4"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            All Series
          </Link>
          
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-(--gradient-purple)" />
            {seriesTitle}
          </h1>
          <p className="text-muted-foreground">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'} in this series
          </p>
        </div>
        
        {/* 진행 바 */}
        <div className="mb-8 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Series Progress</span>
            <span>{posts.length} / {posts.length} articles</span>
          </div>
          <div className="flex gap-1">
            {posts.map((_, idx) => (
              <div
                key={idx}
                className="h-2 flex-1 rounded-full bg-linear-to-r from-(--gradient-purple) to-(--gradient-cyan)"
              />
            ))}
          </div>
        </div>
        
        {/* 게시글 목록 (순서대로) */}
        <div className="space-y-3">
          {posts.map((post, idx) => (
            <Link
              key={post.id}
              to="/blog/$"
              params={{ _splat: post.fullPath }}
              className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-(--gradient-purple)/50 hover:bg-muted/30 transition-all duration-200 group"
            >
              {/* 순서 번호 */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-linear-to-br from-(--gradient-purple) to-(--gradient-cyan) flex items-center justify-center text-sm font-bold text-white">
                {idx + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg group-hover:text-(--gradient-purple) transition-colors line-clamp-1">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{post.date}</span>
                  <span>{post.readingTime} min read</span>
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-(--gradient-purple) group-hover:translate-x-1 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>
        
        {posts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No articles found in this series.
          </div>
        )}
      </div>
    </div>
  )
}
