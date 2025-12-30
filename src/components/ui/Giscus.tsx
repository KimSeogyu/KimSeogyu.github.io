import { useEffect, useState } from 'react'
import Giscus from '@giscus/react'
import { useTheme } from '~/components/theme-provider'

interface GiscusCommentsProps {
  repo?: `${string}/${string}`
  repoId?: string
  category?: string
  categoryId?: string
}

export function BlogComments({
  repo = (import.meta.env.VITE_GISCUS_REPO as `${string}/${string}`) || 'KimSeogyu/KimSeogyu.github.io',
  repoId = import.meta.env.VITE_GISCUS_REPO_ID || '',
  category = import.meta.env.VITE_GISCUS_CATEGORY || 'Announcements',
  categoryId = import.meta.env.VITE_GISCUS_CATEGORY_ID || '',
}: GiscusCommentsProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  const resolvedTheme = theme === 'system' 
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="giscus-wrapper mt-8">
        <div className="animate-pulse bg-muted rounded-lg h-32" />
      </div>
    )
  }

  // 환경 변수가 없으면 렌더링하지 않음
  if (!repoId || !categoryId) {
    return (
      <div className="giscus-wrapper mt-8 text-muted-foreground text-sm">
        Comments are not configured. Please set VITE_GISCUS_* environment variables.
      </div>
    )
  }

  const giscusTheme = resolvedTheme === 'dark' ? 'noborder_dark' : 'noborder_light'

  return (
    <div className="giscus-wrapper mt-8">
      <Giscus
        key={giscusTheme}
        id="comments"
        repo={repo}
        repoId={repoId}
        category={category}
        categoryId={categoryId}
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={giscusTheme}
        lang="ko"
        loading="lazy"
      />
    </div>
  )
}
