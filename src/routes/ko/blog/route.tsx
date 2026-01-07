import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PageTransition } from '~/components/shared/page-transition'
import { getContentTree } from '~/lib/posts'
import { SidebarLayout } from '~/components/layout/SidebarLayout'

export const Route = createFileRoute('/ko/blog')({
  component: BlogLayout,
  loader: () => {
    return {
      tree: getContentTree()
    }
  }
})

function BlogLayout() {
  const { tree } = Route.useLoaderData()
  
  return (
    <SidebarLayout tree={tree} showRightSidebar={true}>
      <PageTransition>
        <Outlet />
      </PageTransition>
    </SidebarLayout>
  )
}
