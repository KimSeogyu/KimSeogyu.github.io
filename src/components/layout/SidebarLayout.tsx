// src/components/layout/SidebarLayout.tsx
// 홈화면과 블로그에서 공용으로 사용하는 사이드바 레이아웃

import { ScrollArea } from '~/components/ui/scroll-area'
import { PanelLeft, PanelRight } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { useLayout } from '~/contexts/LayoutContext'
import { Sidebar } from './Sidebar'
import type { ContentNode } from '~/types'
import type { ReactNode } from 'react'

interface SidebarLayoutProps {
  children: ReactNode
  tree: ContentNode[]
  /** 오른쪽 사이드바 표시 여부 (기본: true) */
  showRightSidebar?: boolean
}

export function SidebarLayout({ children, tree, showRightSidebar = true }: SidebarLayoutProps) {
  const { 
    isLeftSidebarOpen, setLeftSidebarOpen, toggleLeftSidebar, 
    isRightSidebarOpen, setRightSidebarOpen, toggleRightSidebar,
    rightSidebarTitle, rightSidebarContent,
    recentPosts
  } = useLayout()
  
  return (
    <div className="flex min-h-screen pt-20 relative">
      {/* Mobile Overlay Backdrop */}
      {isLeftSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setLeftSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <aside 
        className={cn(
          "fixed top-20 bottom-0 left-0 z-40 w-72 border-r bg-background/95 backdrop-blur-xl transition-transform duration-300 ease-in-out",
          isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ScrollArea className="h-full w-full">
          <div className="flex justify-between items-center px-4 h-14 border-b">
            <span className="font-semibold text-sm">Contents</span>
            <Button variant="ghost" size="icon-sm" onClick={() => setLeftSidebarOpen(false)}>
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-2 pb-20">
            <Sidebar tree={tree} />
          </div>
        </ScrollArea>
      </aside>

      {/* Left Sidebar Toggle - 닫혀도 항상 표시 */}
      {!isLeftSidebarOpen && (
        <Button 
          variant="ghost" 
          size="icon-sm" 
          onClick={toggleLeftSidebar} 
          className="fixed top-24 left-4 z-50 text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur border shadow-sm"
          title="Open Contents"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 w-full min-w-0 transition-all duration-300 ease-in-out px-4 md:px-8 pb-10",
          isLeftSidebarOpen ? "md:ml-72" : "md:ml-0",
          showRightSidebar && isRightSidebarOpen ? "xl:mr-72" : "xl:mr-0"
        )}
      >
        {children}
      </main>

      {/* Right Sidebar - xl+ only (when enabled) */}
      {showRightSidebar && (
        <>
          <aside 
            className={cn(
              "fixed top-20 bottom-0 right-0 z-40 w-72 border-l bg-background/95 backdrop-blur-xl transition-transform duration-300 ease-in-out",
              "hidden xl:block",
              isRightSidebarOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            <ScrollArea className="h-full w-full">
              <div className="flex justify-between items-center px-4 h-14 border-b">
                <span className="font-semibold text-sm">{rightSidebarTitle}</span>
                <Button variant="ghost" size="icon-sm" onClick={() => setRightSidebarOpen(false)}>
                  <PanelRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 pb-32">
                {rightSidebarContent || (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">최근 본 글</p>
                    {recentPosts.length > 0 ? (
                      <ul className="space-y-2">
                        {recentPosts.slice(0, 5).map(post => (
                          <li key={post.id}>
                            <a 
                              href={`/blog/${post.fullPath}`}
                              className="text-sm hover:text-primary transition-colors line-clamp-2"
                            >
                              {post.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">아직 방문한 글이 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Right Sidebar Toggle - 닫혀도 항상 표시 */}
          {!isRightSidebarOpen && (
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={toggleRightSidebar} 
              className="fixed top-24 right-4 z-50 hidden xl:flex text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur border shadow-sm"
              title="Open Table of Contents"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}
