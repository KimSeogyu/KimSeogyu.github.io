# MyPage - AI Coding Agent Context & Rules

> **⚠️ CRITICAL**: 이 문서는 AI Coding Agent의 행동 규칙을 정의합니다. 모든 코드 생성/수정 시 아래 규칙을 **반드시** 준수하세요.

---

## 🚫 FORBIDDEN (절대 금지)

| Rule | Description |
|------|-------------|
| **No npm/yarn** | `pnpm`만 사용. `npm install`, `yarn add` 등 금지 |
| **No `any` type** | 모든 코드에 명시적 타입 적용 필수 |
| **No external routing libs** | `react-router-dom` 등 금지. TanStack Router 전용 |
| **No Tailwind v3 syntax** | `tailwind.config.js` 없음. CSS-first v4 사용 |

---

## ✅ REQUIRED (필수 규칙)

### 1. Package Manager

```bash
# ✅ Correct
pnpm add <package>
pnpm dev
pnpm build

# ❌ Wrong
npm install <package>
yarn add <package>
```

### 2. TanStack Ecosystem First

라우팅, 상태 관리, 폼 처리 시 **반드시** TanStack 에코시스템 내에서 해결:

- **Routing**: `@tanstack/react-router` (File-based, Type-safe)
- **State**: `@tanstack/react-query`, `@tanstack/react-store`
- **Form**: `@tanstack/react-form` + `@tanstack/zod-form-adapter`
- **Table**: `@tanstack/react-table`

### 3. Route Creation Pattern

```tsx
// src/routes/<route-name>.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/<route-name>')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>...</div>
}
```

### 4. Server Function Pattern

```tsx
import { createServerFn } from '@tanstack/react-start/server'

export const getData = createServerFn({ method: 'GET' }).handler(async () => {
  // Server-side logic
  return { data: '...' }
})
```

---

## 📁 Project Structure

```
mypage/
├── src/
│   ├── routes/              # TanStack Router (File-based)
│   │   ├── __root.tsx       # Root layout
│   │   ├── index.tsx        # Home page (/)
│   │   ├── resume.tsx       # Resume page (/resume)  
│   │   └── blog/            # Blog routes (/blog/*)
│   ├── components/
│   │   ├── ui/              # Shadcn UI components
│   │   └── shared/          # Custom shared components
│   ├── content/             # Markdown blog posts (by category)
│   │   ├── backend/         # Backend articles
│   │   ├── data-engineering/# Data Engineering articles
│   │   ├── ai-ml/           # AI/ML articles
│   │   └── ...
│   ├── data/                # Generated static data
│   │   └── posts.json       # Auto-generated from content/
│   ├── lib/                 # Utility functions
│   ├── types/               # TypeScript type definitions
│   └── styles.css           # Tailwind v4 CSS-first config
├── scripts/
│   ├── generate-posts-data.ts  # Markdown → JSON
│   └── generate-sitemap.ts     # Sitemap generator
└── docs/                    # Build output (GitHub Pages)
```

---

## 🛠️ Key Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | 개발 서버 실행 (port 3000) |
| `pnpm build` | 프로덕션 빌드 (GitHub Pages용) |
| `pnpm run prebuild` | Markdown → JSON 변환 |

---

## 🎨 Styling Guide (Tailwind v4)

### CSS Variable System

- 모든 색상은 `src/styles.css`의 CSS variables 사용
- `:root` (라이트 모드) / `.dark` (다크 모드) 분리

### Key Design Tokens

```css
/* Primary Gradient */
--gradient-purple: #8b5cf6;
--gradient-cyan: #06b6d4;

/* Semantic Colors (oklch) */
--background, --foreground, --card, --muted, --accent, --border
```

### Component Styling

- Shadcn UI + `class-variance-authority` (`cva`)
- 커스텀 클래스: `.glass-card`, `.gradient-text`, `.article-prose`

---

## 📝 Blog Content Workflow

### Adding New Post

1. 파일 생성: `src/content/<category>/<slug>.md`
2. Frontmatter 필수:

```yaml
---
title: "제목"
date: "YYYY-MM-DD"
description: "설명"
tags: ["tag1", "tag2"]
private: false  # true면 빌드에서 제외
---
```

1. 빌드: `pnpm build` → `src/data/posts.json` 자동 갱신

### Content Categories

- `backend/` - Go, Python, API Design, Kubernetes
- `data-engineering/` - Kafka, Spark, Airflow  
- `ai-ml/` - LLM, RAG, ML Ops
- `distributed-systems/` - System Design
- `database/` - PostgreSQL, Redis

### ✍️ Writing Principles (블로그 작성 원칙)

> 42dot 프로젝트 경험을 블로그로 작성할 때 적용하는 원칙

#### 1. 내부 플랫폼명 노출 금지

| 내부 이름 | 일반화된 표현 |
|-----------|---------------|
| Stellar | 엔터프라이즈 블록체인, Move 기반 체인 |
| AstraKey | PKI (Certificate & Key Management) |
| Aptos Fork | Move 기반 체인, 엔터프라이즈 블록체인 |

#### 2. SDK 구조체/Trait 이름 추상화

| 구체적 SDK 이름 | 블로그에서 쓸 일반화된 표현 |
|-----------------|---------------------------|
| `ProcessorFramework` | 파이프라인 오케스트레이터 |
| `TransactionHandler` | 비즈니스 로직 핸들러 Trait |
| `ProcessableWrapper` | 어댑터 패턴 |
| `Step-Channel` | Producer-Consumer / mpsc 채널 패턴 |

#### 3. 표현 주의사항

- ❌ "Aptos Fork에서 개발한..." → ✅ "Move 기반 체인에서 개발한..."
- ❌ "Stellar 인덱서 SDK" → ✅ "엔터프라이즈 인덱서 SDK"
- ❌ "AstraKey 관리 시스템" → ✅ "PKI/인증서 관리 시스템"

---

## 🚀 Deployment (GitHub Pages)

- 빌드 출력: `docs/` 디렉토리
- `pnpm build` 실행 시:
  1. Markdown → JSON 변환
  2. Sitemap 생성
  3. Vite SSG 빌드
  4. `docs/` 정리 및 `.nojekyll` 생성

---

## ⚡ Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 95+ |
| First Contentful Paint | < 1.5s |
| Bundle Size (gzip) | < 200KB |

---

## 🔗 Key Dependencies

| Category | Package | Version |
|----------|---------|---------|
| Framework | `@tanstack/react-start` | ^1.132.0 |
| Router | `@tanstack/react-router` | ^1.132.0 |
| Styling | `tailwindcss` | ^4.0.6 |
| UI | `@radix-ui/*`, `lucide-react` | latest |
| Markdown | `react-markdown`, `remark-gfm` | latest |
| Animation | `framer-motion` | ^12.x |

---

**Last Updated**: 2026-01-04  
**Context Version**: 2.0.0 (Agent-Optimized)
