import { createFileRoute, Link } from '@tanstack/react-router'
import { getAllSeries } from '~/lib/posts'
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react'

export const Route = createFileRoute('/blog/series/')({
  loader: () => {
    const series = getAllSeries()
    return { series }
  },
  head: () => ({
    meta: [
      { title: 'Series | Kim Seogyu' },
      { name: 'description', content: 'Browse article series' },
    ],
  }),
  component: SeriesPage,
})

// 시리즈 슬러그를 보기 좋은 제목으로 변환
function formatSeriesTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function SeriesPage() {
  const { series } = Route.useLoaderData()
  
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
            <BookOpen className="w-8 h-8 text-(--gradient-purple)" />
            Series
          </h1>
          <p className="text-muted-foreground">
            {series.length} series with in-depth technical content
          </p>
        </div>
        
        {/* 시리즈 목록 */}
        <div className="space-y-4">
          {series.map(({ series: seriesSlug, count, posts }) => (
            <Link
              key={seriesSlug}
              to="/blog/series/$"
              params={{ _splat: seriesSlug }}
              className="block p-6 rounded-xl border border-border bg-card hover:border-(--gradient-purple)/50 hover:bg-muted/30 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-(--gradient-purple) transition-colors">
                    {formatSeriesTitle(seriesSlug)}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-3">
                    {count} {count === 1 ? 'article' : 'articles'} in this series
                  </p>
                  
                  {/* 첫 번째 글 미리보기 */}
                  {posts[0] && (
                    <p className="text-sm text-muted-foreground/80 line-clamp-2">
                      {posts[0].excerpt}
                    </p>
                  )}
                </div>
                
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-(--gradient-purple) group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
              </div>
              
              {/* 진행 바 */}
              <div className="mt-4 flex gap-1">
                {posts.map((_, idx) => (
                  <div
                    key={idx}
                    className="h-1 flex-1 rounded-full bg-(--gradient-purple)/30"
                  />
                ))}
              </div>
            </Link>
          ))}
        </div>
        
        {series.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No series found.
          </div>
        )}
      </div>
    </div>
  )
}
