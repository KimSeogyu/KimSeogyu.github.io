import { useEffect, useState, useMemo } from 'react'
import { List } from 'lucide-react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(true)

  // 마크다운에서 헤딩 추출 (코드 블록 제외)
  const headings = useMemo(() => {
    const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '')
    
    const regex = /^(#{1,3})\s+(.+)$/gm
    const items: TocItem[] = []
    let match

    while ((match = regex.exec(contentWithoutCodeBlocks)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
      
      items.push({ id, text, level })
    }

    return items
  }, [content])

  // 현재 활성 섹션 추적
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    )

    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [headings])

  // 클릭 시 스크롤
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const top = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  if (headings.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4 w-full"
      >
        <List className="w-4 h-4 text-[var(--gradient-purple)]" />
        <span>Table of Contents</span>
      </button>

      {isOpen && (
        <nav className="space-y-1">
          {headings.map(({ id, text, level }) => (
            <button
              key={id}
              onClick={() => scrollToHeading(id)}
              className={`block w-full text-left text-sm py-1.5 border-l-2 transition-all ${
                level === 1
                  ? 'pl-3'
                  : level === 2
                  ? 'pl-5'
                  : 'pl-7'
              } ${
                activeId === id
                  ? 'text-[var(--gradient-purple)] border-[var(--gradient-purple)] font-medium'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
              }`}
            >
              <span className="break-words leading-snug">{text}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
