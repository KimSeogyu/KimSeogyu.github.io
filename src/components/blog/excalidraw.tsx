
import { useEffect, useRef, useState } from 'react'

export function Excalidraw({ data }: { data: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDark, setIsDark] = useState(false)

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
    if (ref.current && data) {
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

          if (ref.current) {
            ref.current.innerHTML = ''
            svg.style.width = '100%'
            svg.style.height = 'auto'
            svg.style.maxWidth = '100%'
            ref.current.appendChild(svg)
          }
        } catch (e) {
          console.error('Failed to render Excalidraw:', e)
          if (ref.current) {
            ref.current.innerHTML = '<p class="text-red-500">Failed to render Excalidraw diagram</p>'
          }
        }
      }

      renderExcalidraw()
    }
  }, [data, isDark])

  return (
    <div 
      ref={ref} 
      className={`excalidraw-container my-8 p-6 rounded-2xl overflow-x-auto transition-all shadow-sm flex justify-center items-center min-h-[200px] ${
        isDark 
          ? 'bg-slate-900/40 border border-slate-800' 
          : 'bg-slate-50 border border-slate-200'
      }`}
    />
  )
}
