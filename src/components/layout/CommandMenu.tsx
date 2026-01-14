import * as React from "react"
import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { FileText, Moon, Sun, PanelLeft, PanelRight } from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useLayout } from "~/contexts/LayoutContext"
import { getAllPosts } from "~/lib/posts"

export function CommandMenu() {
  const navigate = useNavigate()
  const { isSearchOpen, setSearchOpen, toggleLeftSidebar, toggleRightSidebar, modKey, altKey } = useLayout()
  const [posts] = useState(getAllPosts)

  const runCommand = React.useCallback((command: () => void) => {
    setSearchOpen(false)
    // 동기 실행 - Context 중복 문제 해결 후 setTimeout 불필요
    command()
  }, [setSearchOpen])

  return (
    <Dialog open={isSearchOpen} onOpenChange={setSearchOpen}>
      <DialogContent 
        className="overflow-hidden p-0 shadow-lg" 
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => runCommand(toggleLeftSidebar)}>
                <PanelLeft className="mr-2 h-4 w-4" />
                <span>Toggle Left Sidebar</span>
                <span className="ml-auto text-xs text-muted-foreground">{modKey}B</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(toggleRightSidebar)}>
                <PanelRight className="mr-2 h-4 w-4" />
                <span>Toggle Right Sidebar</span>
                <span className="ml-auto text-xs text-muted-foreground">{modKey}{altKey}B</span>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator />

            <CommandGroup heading="Posts">
              {posts.map((post) => (
                <CommandItem
                  key={post.id}
                  value={`${post.title} ${post.category}`}
                  onSelect={() => {
                    runCommand(() => navigate({ to: `/ko/blog/${post.fullPath}` }))
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{post.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{post.category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Theme">
              <CommandItem onSelect={() => runCommand(() => document.documentElement.classList.add("dark"))}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => document.documentElement.classList.remove("dark"))}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
