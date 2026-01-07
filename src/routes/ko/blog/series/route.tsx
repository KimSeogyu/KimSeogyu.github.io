import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/ko/blog/series')({
  component: SeriesLayout,
})

function SeriesLayout() {
  return <Outlet />
}
