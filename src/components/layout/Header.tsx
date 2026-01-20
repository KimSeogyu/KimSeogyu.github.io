import { Link } from '@tanstack/react-router'
import { ModeToggle } from '~/components/mode-toggle'
import { useState, useEffect, useRef } from 'react'
import { ChevronDown, FileText } from 'lucide-react'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isResumeOpen, setIsResumeOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsResumeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 print:hidden ${
          isScrolled
            ? 'py-3 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="text-xl font-bold tracking-tight transition-colors hover:opacity-80"
            >
              <span className="gradient-text">Kim Seogyu</span>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                {/* Resume Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsResumeOpen(!isResumeOpen)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Resume
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isResumeOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isResumeOpen && (
                    <div className="absolute top-full right-0 mt-2 py-2 w-44 bg-card border border-border rounded-lg shadow-lg">
                      <a
                        href="/SeogyuKim_Resume_ko.pdf"
                        download
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        onClick={() => setIsResumeOpen(false)}
                      >
                        <FileText className="w-4 h-4" />
                        한국어 (KO)
                      </a>
                      <a
                        href="/SeogyuKim_Resume_en.pdf"
                        download
                        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        onClick={() => setIsResumeOpen(false)}
                      >
                        <FileText className="w-4 h-4" />
                        English (EN)
                      </a>
                    </div>
                  )}
                </div>
                
                <Link 
                  to="/ko" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  activeProps={{ className: "text-foreground font-semibold" }}
                >
                  Blog
                </Link>
              </nav>
              <div className="h-4 w-px bg-border hidden md:block" />
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20" />
    </>
  )
}
