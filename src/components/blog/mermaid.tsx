import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import mermaid from 'mermaid'

export const Mermaid = ({ chart, className, style, ...props }: { chart: string } & React.HTMLAttributes<HTMLDivElement>) => {
  const localRef = useRef<HTMLDivElement>(null)
  const [isDark, setIsDark] = useState(false)

  // 다크모드 감지

  /* 
     Removed manual ref merging useEffect
  */

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
    if (localRef.current) {
      // 다크모드에 따라 테마 변경 + handDrawn 스타일
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
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
          primaryColor: '#c7d2fe', // Indigo 200 (Light node background for Dark Text)
          primaryTextColor: '#f8fafc', // 밝은 텍스트 색상 (Slate 50)
          primaryBorderColor: '#818cf8',
          lineColor: '#cbd5e1',
          secondaryColor: '#334155',
          tertiaryColor: '#cbd5e1',
          background: '#0f172a',
          mainBkg: '#1e293b',
          nodeBorder: '#818cf8',
          clusterBkg: '#1e293b',
          clusterBorder: '#475569',
          titleColor: '#f8fafc',
          edgeLabelBackground: '#334155',
          fontSize: '16px',
          // 다크 모드에서 텍스트 가시성을 위한 추가 속성
          textColor: '#f8fafc',
          labelColor: '#f8fafc',
          nodeTextColor: '#f8fafc',
          actorTextColor: '#f8fafc',
          signalTextColor: '#f8fafc',
          labelTextColor: '#f8fafc',
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
        if (localRef.current) {
          localRef.current.innerHTML = svg
          
          // 다크 모드에서 SVG 텍스트 색상 강제 보정
          if (isDark) {
            const textElements = localRef.current.querySelectorAll('text, .nodeLabel, .edgeLabel, .label, span')
            textElements.forEach((el) => {
              const htmlEl = el as HTMLElement
              const currentColor = window.getComputedStyle(htmlEl).color
              // 어두운 색상인 경우 밝은 색상으로 변경
              if (currentColor === 'rgb(0, 0, 0)' || 
                  currentColor === 'rgb(15, 23, 42)' ||
                  currentColor.includes('rgb(0,') ||
                  currentColor.includes('rgb(1')) {
                htmlEl.style.fill = '#f8fafc'
                htmlEl.style.color = '#f8fafc'
              }
            })
          }
        }
      })
    }
  }, [chart, isDark])

  return (
    <div 
      ref={localRef} 
      className={`mermaid-container p-8 rounded-2xl overflow-x-auto transition-all shadow-sm cursor-zoom-in ${
        isDark 
          ? 'bg-slate-800/60 border-2 border-slate-600/50 shadow-indigo-500/10' 
          : 'bg-amber-50/80 border-2 border-amber-300/60 shadow-amber-500/10'
      } ${className || ''}`}
      style={{
        backgroundImage: isDark 
          ? 'none'
          : 'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(217, 119, 6, 0.05) 24px, rgba(217, 119, 6, 0.05) 25px)',
        ...style
      }}
      {...props}
    />
  )
}
