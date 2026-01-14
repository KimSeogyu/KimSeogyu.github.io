import { useState, useEffect } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight, ChevronDown, Folder, FileText, FolderOpen } from 'lucide-react'
import type { ContentNode } from '~/lib/posts'
import { cn } from '~/lib/utils'

interface SidebarProps {
  tree: ContentNode[]
}

export function Sidebar({ tree }: SidebarProps) {
  return (
    <aside className="w-full h-full p-4 overflow-y-auto">
      <div className="space-y-1">
        {tree.map((node) => (
          <TreeNode key={node.path} node={node} level={0} />
        ))}
      </div>
    </aside>
  )
}

interface TreeNodeProps {
  node: ContentNode
  level: number
}

function TreeNode({ node, level }: TreeNodeProps) {
  const location = useLocation()
  // Initialize open state from session storage or active path
  // Initialize open state (Server-Safe: Only depend on location)
  const isInitiallyOpen = node.type === 'folder' && location.pathname.startsWith(`/ko/blog/${node.path}`)
  const [isOpen, setIsOpen] = useState(isInitiallyOpen)

  // Restore from session storage on mount (Client Only)
  useEffect(() => {
    const saved = sessionStorage.getItem(`sidebar-open-${node.path}`)
    if (saved !== null) {
      setIsOpen(saved === 'true')
    }
  }, [node.path])

  // Persist state to session storage
  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    sessionStorage.setItem(`sidebar-open-${node.path}`, String(newState))
  }

  // Auto-expand if active path (sync with URL changes)
  useEffect(() => {
    if (node.type === 'folder' && location.pathname.startsWith(`/ko/blog/${node.path}`)) {
       setIsOpen(true)
       // We don't necessarily enforce persistence here if the user deliberately closed it? 
       // Actually, for "Flicker" fix on navigation, we WANT to enforce it open.
       sessionStorage.setItem(`sidebar-open-${node.path}`, 'true')
    }
  }, [location.pathname, node.path, node.type])

  const isActive = node.type === 'post' && location.pathname === `/ko/blog/${node.path}`

  const paddingLeft = `${level * 12 + 12}px`

  if (node.type === 'folder') {
    return (
      <div className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm font-medium transition-colors",
            "text-muted-foreground hover:text-foreground"
          )}
          style={{ paddingLeft }}
          onClick={handleToggle}
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="flex items-center gap-2 truncate">
             {isOpen ? <FolderOpen className="w-4 h-4 text-[var(--gradient-cyan)]" /> : <Folder className="w-4 h-4 text-[var(--gradient-cyan)]" />}
             {node.name}
          </span>
        </div>
        {isOpen && node.children && (
          <div className="mt-0.5">
            {node.children.map((child) => (
              <TreeNode key={child.path} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      to="/ko/blog/$"
      params={{ _splat: node.path }}
      className={cn(
        "flex items-start gap-2 py-1.5 px-2 rounded-md text-sm transition-colors",
        "hover:bg-muted hover:text-foreground",
        isActive 
          ? "bg-(--gradient-purple)/10 text-(--gradient-purple) font-medium" 
          : "text-muted-foreground"
      )}
      style={{ paddingLeft }}
    >
      <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span className="wrap-break-word">{node.title || node.name}</span>
    </Link>
  )
}
