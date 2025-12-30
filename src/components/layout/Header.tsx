import { Link } from '@tanstack/react-router'
import { ModeToggle } from '~/components/mode-toggle'
import { useState, useEffect } from 'react'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
                <Link 
                  to="/resume" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  activeProps={{ className: "text-foreground font-semibold" }}
                >
                  Resume
                </Link>
                <Link 
                  to="/blog" 
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
