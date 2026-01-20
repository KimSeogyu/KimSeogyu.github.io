// src/routes/index.tsx
import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { getAllPosts, getCategories, getContentTree } from '~/lib/posts'
import { PostCard } from '~/features/blog/components'
import { SidebarLayout } from '~/components/layout/SidebarLayout'
import { Tag, BookOpen, Info } from 'lucide-react'

export const Route = createFileRoute('/ko/')(  {
  loader: async () => {
    const allPosts = getAllPosts()
    const categories = getCategories()
    const tree = getContentTree()
    
    return { recent: allPosts, categories, tree }
  },
  head: () => ({
    meta: [
      {
        title: 'Kim Seogyu | Engineering Notes',
      },
      {
        name: 'description',
        content:
          'Deep dive into Distributed Systems, Blockchain, Backend, and AI Engineering.',
      },
    ],
  }),
  component: BlogIndex,
})

function BlogIndex() {
  const { recent, categories, tree } = Route.useLoaderData()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const filteredPosts = selectedCategory 
    ? recent.filter(post => post.category === selectedCategory)
    : recent
  
  return (
    <SidebarLayout tree={tree} showRightSidebar={true}>
      <div className="container mx-auto max-w-6xl">
        {/* 블로그 안내 배너 */}
        <div className="mb-8 gradient-border rounded-xl overflow-hidden">
          <div className="flex items-start gap-4 p-5 bg-linear-to-r from-(--gradient-purple)/5 via-transparent to-(--gradient-cyan)/5">
            <div className="shrink-0 mt-0.5">
              <div className="p-2 rounded-lg bg-linear-to-br from-(--gradient-purple) to-(--gradient-cyan)">
                <Info className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground leading-relaxed">
              <p>
                이 블로그는 제가 알고 있는 것들을 잊지 않기 위해 기록하는 공간입니다.
              </p>
              <p>
                직접 작성한 글도 있고, AI의 도움을 받아 정리한 글도 있습니다.
                <br />
                정확하지 않은 내용이 있을 수 있으니 참고용으로 봐주세요.
              </p>
            </div>
          </div>
        </div>

        {/* 카테고리 필터 (콤팩트) */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${
              selectedCategory === null 
                ? 'bg-foreground text-background border-foreground' 
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/50'
            }`}
          >
            All · {recent.length}
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.category} 
              onClick={() => setSelectedCategory(cat.category)}
              className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${
                selectedCategory === cat.category 
                  ? 'bg-foreground text-background border-foreground' 
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/50'
              }`}
            >
              {cat.category} · {cat.count}
            </button>
          ))}
          
          {/* Tags & Series 링크 */}
          <div className="flex gap-2 ml-auto">
            <Link
              to="/ko/blog/tags"
              className="px-4 py-2 text-sm font-medium rounded-full border border-border text-muted-foreground hover:text-(--gradient-cyan) hover:border-(--gradient-cyan)/50 transition-all flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5" />
              Tags
            </Link>
            <Link
              to="/ko/blog/series"
              className="px-4 py-2 text-sm font-medium rounded-full border border-border text-muted-foreground hover:text-(--gradient-purple) hover:border-(--gradient-purple)/50 transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Series
            </Link>
          </div>
        </div>
        
        {/* 글 목록 - 3열 그리드 (사이드바 공간 확보) */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">해당 카테고리에 글이 없습니다.</p>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
