import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/blog/tags')({
  component: TagsLayout,
})

function TagsLayout() {
  return <Outlet />
}
