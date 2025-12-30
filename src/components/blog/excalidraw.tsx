import { useEffect, useRef, useState, forwardRef } from 'react'

export const Excalidraw = forwardRef<HTMLDivElement, { data: string } & React.HTMLAttributes<HTMLDivElement>>(({ data, className, style, ...props }, ref) => {
  const localRef = useRef<HTMLDivElement>(null)
  const [isDark, setIsDark] = useState(false)

  // Merge refs
  useEffect(() => {
    if (!ref) return
    if (typeof ref === 'function') {
      ref(localRef.current)
    } else {
      ref.current = localRef.current
    }
  }, [ref])

  // 다크모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    
    checkDarkMode()
    
    // MutationObserver로 테마 변경 감지
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })
    
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (localRef.current && data) {
      // 클라이언트 사이드에서만 동적 임포트
      const renderExcalidraw = async () => {
        try {
          const { exportToSvg } = await import('@excalidraw/excalidraw')
          const sceneData = JSON.parse(data)
          
          const svg = await exportToSvg({
            elements: sceneData.elements,
            appState: {
              ...sceneData.appState,
              exportWithDarkMode: isDark,
              viewBackgroundColor: isDark ? '#1e293b' : '#ffffff',
            },
            files: sceneData.files,
          })

          if (localRef.current) {
            localRef.current.innerHTML = ''
            svg.style.width = '100%'
            svg.style.height = 'auto'
            svg.style.maxWidth = '100%'
            localRef.current.appendChild(svg)
          }
        } catch (e) {
          console.error('Failed to render Excalidraw:', e)
          if (localRef.current) {
            localRef.current.innerHTML = '<p class="text-red-500">Failed to render Excalidraw diagram</p>'
          }
        }
      }

      renderExcalidraw()
    }
  }, [data, isDark])

  return (
    <div 
      ref={localRef} 
      className={`excalidraw-container my-8 p-6 rounded-2xl overflow-x-auto transition-all shadow-sm flex justify-center items-center min-h-[200px] cursor-zoom-in ${
        isDark 
          ? 'bg-slate-900/40 border border-slate-800' 
          : 'bg-slate-50 border border-slate-200'
      } ${className || ''}`}
      style={style}
      {...props}
    />
  )
})

Excalidraw.displayName = 'Excalidraw'
