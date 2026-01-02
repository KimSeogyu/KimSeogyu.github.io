import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/blog/series')({
  component: SeriesLayout,
})

function SeriesLayout() {
  return <Outlet />
}
