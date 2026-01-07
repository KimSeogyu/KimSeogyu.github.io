import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/resume')({
  beforeLoad: () => {
    throw redirect({ to: '/ko/resume' })
  },
  component: () => null,
})
