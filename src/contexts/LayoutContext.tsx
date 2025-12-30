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

  // Sidebar States (Default: Open)
  const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setRightSidebarOpen] = useState(true);
  
  // Search State (Default: Closed)
  const [isSearchOpen, setSearchOpen] = useState(false);
  // Restore Sidebar States from SessionStorage (Client Only)
  useEffect(() => {
    const savedLeft = sessionStorage.getItem('sidebar-left-state');
    if (savedLeft === 'false') {
      setLeftSidebarOpen(false);
    }

    const savedRight = sessionStorage.getItem('sidebar-right-state');
    if (savedRight === 'false') {
      setRightSidebarOpen(false);
    }
  }, []);

  // Persist Sidebar States
  useEffect(() => {
    sessionStorage.setItem('sidebar-left-state', String(isLeftSidebarOpen));
  }, [isLeftSidebarOpen]);

  useEffect(() => {
    sessionStorage.setItem('sidebar-right-state', String(isRightSidebarOpen));
  }, [isRightSidebarOpen]);

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
