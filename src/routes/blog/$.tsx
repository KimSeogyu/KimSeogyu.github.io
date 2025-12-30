import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getPostByFullPath, getAllPosts } from '~/lib/posts'
import { siteConfig } from '~/config/site'
import { Badge } from '~/components/ui/badge'
import { ReadingProgressBar } from '~/components/ui/ReadingProgressBar'
import { TableOfContents } from '~/components/ui/TableOfContents'
import { BlogComments } from '~/components/ui/Giscus'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import { ArrowLeft, Calendar, Clock, Tag, Share2, Twitter, Linkedin, Link as LinkIcon, MessageCircle } from 'lucide-react'
import { Mermaid } from '~/components/blog/mermaid'
import { Excalidraw } from '~/components/blog/excalidraw'
import { RelatedPostCard } from '~/features/blog/components'
import { useLayout } from '~/contexts/LayoutContext'

export const Route = createFileRoute('/blog/$')({
  loader: async ({ params }) => {
    // params._splat contains the catch-all path
    const splat = params._splat
    if (!splat) {
        throw new Response('Not Found', { status: 404 })
    }

    const post = getPostByFullPath(splat)
    if (!post) {
      throw new Response('Not Found', { status: 404 })
    }
    
    // 관련 글 가져오기 (같은 카테고리, 현재 글 제외)
    // TODO: Improve related posts logic to use folder structure if desired
    const allPosts = getAllPosts()
    const relatedPosts = allPosts
      .filter(p => p.category === post.category && p.id !== post.id)
      .slice(0, 3)
    
    return { post, relatedPosts }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.post) {
      return { meta: [{ title: 'Not Found | Kim Seogyu' }] }
    }
    return {
      meta: [
        { title: `${loaderData.post.title} | Kim Seogyu` },
        { name: 'description', content: loaderData.post.excerpt || `Technical article about ${loaderData.post.category}` },
        { property: 'og:title', content: loaderData.post.title },
        { property: 'og:description', content: loaderData.post.excerpt },
        { property: 'og:type', content: 'article' },
        { property: 'og:image', content: loaderData.post.image || siteConfig.ogImage },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: loaderData.post.image || siteConfig.ogImage },
      ],
    }
  },
  component: PostDetail,
})

function PostDetail() {
  const { post, relatedPosts } = Route.useLoaderData()
  const { addRecentPost, setRightSidebarTitle, setRightSidebarContent } = useLayout()
  const [isDark, setIsDark] = useState(false)

  // 다크모드 감지 (Zoom 리마운트 및 스타일링용)
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    
    checkDarkMode()
    
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })
    
    return () => observer.disconnect()
  }, [])
  
  // Slot Pattern: Right Sidebar TOC 컨텐츠 설정
  useEffect(() => {
    setRightSidebarContent(
      <TableOfContents content={post.content} />
    );
    return () => {
      setRightSidebarContent(null);
      setRightSidebarTitle('');
    };
  }, [post.content, setRightSidebarContent, setRightSidebarTitle]);
  
  // Record visit
  useEffect(() => {
    addRecentPost({
      id: post.id,
      title: post.title,
      // Store minimal data to save space
      category: post.category,
      fullPath: post.fullPath,
      date: post.date
    })
  }, [post.id])
  
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
  }
  
  return (
    <>
      <ReadingProgressBar />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-[1600px]">
          <div className="flex gap-8 relative opacity-100 dark:opacity-100">
            {/* 메타데이터(Head)나 ReadingProgressBar 등이 위쪽에 있으므로 이곳은 본문영역 */}

            {/* 메인 컨텐츠 */}
            <article className="flex-1 min-w-0 max-w-4xl mx-auto overflow-hidden">
              
              {/* Top Toolbar (Back button + Open TOC button) */}
              <div className="flex justify-between items-center mb-8">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-(--gradient-purple) transition-colors text-sm font-medium group"
                >
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Articles
                </Link>

              </div>
              
              {/* 아티클 헤더 */}
              <header className="mb-12">
                <div className="flex gap-2 mb-6">
                  <Badge 
                    variant="secondary" 
                    className="rounded-full px-4 py-1.5 font-medium bg-(--gradient-purple)/10 text-(--gradient-purple) border-none"
                  >
                    {post.category}
                  </Badge>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                  {post.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-6 text-muted-foreground text-sm font-medium pb-8 border-b border-border">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </span>
                  {post.readingTime && (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {post.readingTime} min read
                    </span>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <div className="flex gap-2">
                        {post.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-(--gradient-cyan)">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </header>
              
              {/* 마크다운 본문 - Medium 스타일 */}
              <div className="article-prose max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                  components={{
                    // 헤딩에 id 추가
                    h1: ({ children, ...props }) => {
                      const id = String(children)
                        .toLowerCase()
                        .replace(/[^a-z0-9가-힣\s]/g, '')
                        .replace(/\s+/g, '-')
                        .substring(0, 50)
                      return <h1 id={id} {...props}>{children}</h1>
                    },
                    h2: ({ children, ...props }) => {
                      const id = String(children)
                        .toLowerCase()
                        .replace(/[^a-z0-9가-힣\s]/g, '')
                        .replace(/\s+/g, '-')
                        .substring(0, 50)
                      return <h2 id={id} {...props}>{children}</h2>
                    },
                    h3: ({ children, ...props }) => {
                      const id = String(children)
                        .toLowerCase()
                        .replace(/[^a-z0-9가-힣\s]/g, '')
                        .replace(/\s+/g, '-')
                        .substring(0, 50)
                      return <h3 id={id} {...props}>{children}</h3>
                    },
                    // pre 태그에서 mermaid, excalidraw 처리
                    pre({ children, ...props }: any) {
                      // children이 code 요소인지 확인
                      const codeElement = children?.props
                      if (codeElement) {
                        const className = codeElement.className || ''
                        const match = /language-([\w-]+)/.exec(className)
                        if (match && match[1] === 'mermaid') {
                          const codeContent = codeElement.children
                          return (
                            <div className="my-8">
                              <Zoom key={isDark ? 'mermaid-dark' : 'mermaid-light'}>
                                <div style={{ width: '100%' }}>
                                  <Mermaid chart={String(codeContent).replace(/\n$/, '')} />
                                </div>
                              </Zoom>
                            </div>
                          )
                        }
                        if (match && match[1] === 'excalidraw-json') {
                          const codeContent = codeElement.children
                          return (
                            <div className="my-8">
                              <Zoom key={isDark ? 'excalidraw-dark' : 'excalidraw-light'}>
                                <div style={{ width: '100%' }}>
                                  <Excalidraw data={String(codeContent).replace(/\n$/, '')} />
                                </div>
                              </Zoom>
                            </div>
                          )
                        }
                      }
                      return <pre {...props}>{children}</pre>
                    },
                    code({ node, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '')
                      const isInline = !props.hasOwnProperty('node') || 
                                       (node?.position?.start?.line === node?.position?.end?.line && 
                                        String(children).indexOf('\n') === -1)
  
                      // 인라인이 아니고 mermaid인 경우는 pre에서 처리하므로 그냥 통과
                      if (!isInline && match && match[1] !== 'mermaid') {
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
  
                      return isInline ? (
                        <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                    img: (props) => (
                      <Zoom>
                        <img
                          {...props}
                          className="rounded-lg border shadow-xs my-8 cursor-zoom-in"
                          loading="lazy"
                          decoding="async"
                        />
                      </Zoom>
                    ),
                    a: ({ node, ...props }) => {
                      // 외부 링크인지 확인
                      const isExternal = props.href?.startsWith('http')
                      if (isExternal) {
                        return (
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                          />
                        )
                      }
                      return (
                         <a
                            {...props}
                            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                          />
                      )
                    }
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
              
              {/* 공유 버튼 */}
              <div className="mt-12 pt-8 border-t border-border">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </span>
                  <div className="flex gap-2">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-muted hover:bg-(--gradient-purple)/10 hover:text-(--gradient-purple) transition-colors"
                      title="Share on Twitter"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-muted hover:bg-(--gradient-purple)/10 hover:text-(--gradient-purple) transition-colors"
                      title="Share on LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                    <button
                      onClick={copyLink}
                      className="p-2 rounded-lg bg-muted hover:bg-(--gradient-purple)/10 hover:text-(--gradient-purple) transition-colors"
                      title="Copy link"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 관련 글 */}
              {relatedPosts.length > 0 && (
                <section className="mt-16">
                  <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full bg-linear-to-b from-(--gradient-purple) to-(--gradient-cyan)" />
                    Related Articles
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {relatedPosts.map((related) => (
                      <RelatedPostCard key={related.id} post={related} />
                    ))}
                  </div>
                </section>
              )}
              
              {/* 댓글 섹션 */}
              <section className="mt-16">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-(--gradient-purple)" />
                  Comments
                </h2>
                <BlogComments />
              </section>
            </article>
          </div>
        </div>
      </div>
    </>
  )
}
