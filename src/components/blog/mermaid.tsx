
import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

export function Mermaid({ chart }: { chart: string }) {
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
    if (ref.current) {
      // 다크모드에 따라 테마 변경 + handDrawn 스타일
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        look: 'handDrawn', // Excalidraw 스타일
        securityLevel: 'loose',
        fontFamily: '"Comic Sans MS", "Segoe Print", cursive, "Noto Sans KR", sans-serif',
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
          padding: 25, // 더 넓은 패딩으로 텍스트 겹침 방지
          nodeSpacing: 60,
          rankSpacing: 60,
          useMaxWidth: true,
        },
        themeVariables: isDark ? {
          primaryColor: '#6366f1',
          primaryTextColor: '#f1f5f9',
          primaryBorderColor: '#818cf8',
          lineColor: '#94a3b8',
          secondaryColor: '#334155',
          tertiaryColor: '#1e293b',
          background: '#0f172a',
          mainBkg: '#1e293b',
          nodeBorder: '#818cf8',
          clusterBkg: '#1e293b',
          clusterBorder: '#475569',
          titleColor: '#f1f5f9',
          edgeLabelBackground: '#1e293b',
          fontSize: '16px',
        } : {
          primaryColor: '#fef3c7',
          primaryTextColor: '#1e293b',
          primaryBorderColor: '#d97706',
          lineColor: '#78716c',
          secondaryColor: '#fef9c3',
          tertiaryColor: '#fffbeb',
          background: '#fefce8',
          mainBkg: '#fef9c3',
          nodeBorder: '#d97706',
          clusterBkg: '#fffbeb',
          clusterBorder: '#d97706',
          titleColor: '#1e293b',
          edgeLabelBackground: '#fefce8',
          fontSize: '16px',
        },
      })

      mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg
        }
      })
    }
  }, [chart, isDark])

  return (
    <div 
      ref={ref} 
      className={`mermaid-container my-8 p-8 rounded-2xl overflow-x-auto transition-all shadow-sm ${
        isDark 
          ? 'bg-slate-800/60 border-2 border-slate-600/50 shadow-indigo-500/10' 
          : 'bg-amber-50/80 border-2 border-amber-300/60 shadow-amber-500/10'
      }`}
      style={{
        backgroundImage: isDark 
          ? 'none'
          : 'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(217, 119, 6, 0.05) 24px, rgba(217, 119, 6, 0.05) 25px)',
      }}
    />
  )
}
