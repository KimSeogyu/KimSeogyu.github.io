import { createFileRoute, redirect } from '@tanstack/react-router'

// /blog 경로는 루트로 리다이렉트
export const Route = createFileRoute('/ko/blog/')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
  component: () => null,
})
