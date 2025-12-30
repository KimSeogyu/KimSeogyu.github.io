import { AnimatePresence, motion } from "framer-motion"
import { useLocation } from "@tanstack/react-router"
import { forwardRef } from "react"

interface PageTransitionProps {
  children: React.ReactNode
}

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children }, ref) => {
    const location = useLocation()

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          ref={ref}
          className="flex-1 w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    )
  }
)

PageTransition.displayName = "PageTransition"
