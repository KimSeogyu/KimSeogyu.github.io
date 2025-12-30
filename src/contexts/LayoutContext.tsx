import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

/**
 * 최근 방문한 포스트 정보를 저장하기 위한 타입
 */
export interface RecentPost {
  id: string;
  title: string;
  category: string;
  fullPath: string;
  date?: string;
}

interface LayoutContextType {
  isMobile: boolean;
  isLeftSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
  toggleLeftSidebar: () => void;
  isRightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
  toggleRightSidebar: () => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  recentPosts: RecentPost[];
  addRecentPost: (post: RecentPost) => void;
  rightSidebarTitle: string;
  setRightSidebarTitle: (title: string) => void;
  rightSidebarContent: ReactNode;
  setRightSidebarContent: (content: ReactNode) => void;
  // OS 정보
  isMac: boolean;
  modKey: string; // Mac: ⌘, Windows/Linux: Ctrl+
  altKey: string; // Mac: ⌥, Windows/Linux: Alt+
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  // OS Detection (SSR-safe: default to Mac, update on client)
  const [isMac, setIsMac] = useState(true);
  const modKey = isMac ? '⌘' : 'Ctrl+';
  const altKey = isMac ? '⌥' : 'Alt+';

  useEffect(() => {
    setIsMac(navigator.platform.toLowerCase().includes('mac'));
  }, []);

  // Mobile Detection
  const [isMobile, setIsMobile] = useState(false);
  
  // Use a reliable hook or simple resize listener for mobile state
  useEffect(() => {
    // Media query to match standard mobile breakdown (often md: 768px in Tailwind)
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    // Initial check
    setIsMobile(mediaQuery.matches);
    
    // Listener
    const handleResize = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  // Sidebar States
  // Desktop: Default Open
  // Mobile: Default Closed
  const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Initialize/Reset Sidebars based on Device Type
  useEffect(() => {
    if (isMobile) {
      // Mobile: Always start closed
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    } else {
      // Desktop: Restore from session or default to true
      const savedLeft = sessionStorage.getItem('sidebar-left-state');
      // If no saved state, default to open on desktop
      setLeftSidebarOpen(savedLeft !== 'false');

      const savedRight = sessionStorage.getItem('sidebar-right-state');
      setRightSidebarOpen(savedRight !== 'false');
    }
  }, [isMobile]);
  
  // Search State (Default: Closed)
  const [isSearchOpen, setSearchOpen] = useState(false);

  // Persist Sidebar States (Only for Desktop)
  useEffect(() => {
    if (!isMobile) {
      sessionStorage.setItem('sidebar-left-state', String(isLeftSidebarOpen));
    }
  }, [isLeftSidebarOpen, isMobile]);

  useEffect(() => {
    if (!isMobile) {
      sessionStorage.setItem('sidebar-right-state', String(isRightSidebarOpen));
    }
  }, [isRightSidebarOpen, isMobile]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if event already handled
      if (e.defaultPrevented) return;
      
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (!isCmdOrCtrl) return;

      // Use e.code for physical key detection (independent of layout/modifiers)
      const code = e.code;

      // Cmd+K or Cmd+P: Toggle Search
      if (code === 'KeyK' || code === 'KeyP') {
        e.preventDefault();
        e.stopPropagation();
        setSearchOpen(prev => !prev);
        return;
      }

      // Cmd+B: Toggle Left Sidebar
      // Cmd+Option+B: Toggle Right Sidebar
      if (code === 'KeyB') {
        e.preventDefault();
        e.stopPropagation();
        if (e.altKey) {
          setRightSidebarOpen(prev => !prev);
        } else {
          setLeftSidebarOpen(prev => !prev);
        }
        return;
      }
    };

    // Capture phase for priority handling
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Toggle Functions
  const toggleLeftSidebar = () => setLeftSidebarOpen(prev => !prev);
  const toggleRightSidebar = () => setRightSidebarOpen(prev => !prev);
  const toggleSearch = () => setSearchOpen(prev => !prev);

  // Recently Viewed Posts
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('recent-posts');
        return saved ? (JSON.parse(saved) as RecentPost[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const addRecentPost = (post: RecentPost) => {
    setRecentPosts(prev => {
      const filtered = prev.filter(p => p.id !== post.id);
      const newRecent = [post, ...filtered].slice(0, 10);
      localStorage.setItem('recent-posts', JSON.stringify(newRecent));
      return newRecent;
    });
  };

  // Right Sidebar Dynamic Content (Slot Pattern)
  const [rightSidebarTitle, setRightSidebarTitle] = useState('');
  const [rightSidebarContent, setRightSidebarContent] = useState<ReactNode>(null);

  return (
    <LayoutContext.Provider
      value={{
        isMobile,
        isLeftSidebarOpen,
        setLeftSidebarOpen,
        toggleLeftSidebar,
        isRightSidebarOpen,
        setRightSidebarOpen,
        toggleRightSidebar,
        isSearchOpen,
        setSearchOpen,
        toggleSearch,
        recentPosts,
        addRecentPost,
        rightSidebarTitle,
        setRightSidebarTitle,
        rightSidebarContent,
        setRightSidebarContent,
        isMac,
        modKey,
        altKey,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
