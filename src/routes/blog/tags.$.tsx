import { createFileRoute, Link } from '@tanstack/react-router'
import { getPostsByTag } from '~/lib/posts'
import { ArrowLeft, Tag } from 'lucide-react'
import { PostCard } from '~/features/blog/components'

export const Route = createFileRoute('/blog/tags/$')({
  loader: ({ params }) => {
    const tag = decodeURIComponent(params._splat || '')
    const posts = getPostsByTag(tag)
    return { tag, posts }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `#${loaderData?.tag} | Kim Seogyu` },
      { name: 'description', content: `Articles tagged with ${loaderData?.tag}` },
    ],
  }),
  component: TagDetailPage,
})

function TagDetailPage() {
  const { tag, posts } = Route.useLoaderData()
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            to="/blog/tags"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-(--gradient-purple) transition-colors text-sm font-medium group mb-4"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            All Tags
          </Link>
          
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Tag className="w-8 h-8 text-(--gradient-purple)" />
            <span className="text-(--gradient-cyan)">#{tag}</span>
          </h1>
          <p className="text-muted-foreground">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'} with this tag
          </p>
        </div>
        
        {/* 게시글 목록 */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No articles found with this tag.
          </div>
        )}
      </div>
    </div>
  )
}
