# MyPage - AI Agent Project Context & Guideline

> **AI 가이드**: 이 문서는 프로젝트의 전체 맥락을 제공합니다. 작업을 시작하기 전 반드시 이 가이드를 숙지하고, 모든 코드 생성 및 수정 시 아래의 컨벤션을 준수하세요.

---

## 🤖 AI 작업 원칙 (Critical Rules)

1. **Pnpm Only**: 모든 패키지 관리는 `pnpm`을 사용합니다. `npm`, `yarn` 사용을 금지합니다.
2. **TanStack Ecosystem First**: 라우팅, 상태 관리, 폼 처리 시 외부 라이브러리 도입 전 반드시 TanStack 에코시스템(`Router`, `Query`, `Form`, `Table`) 내에서 해결합니다.
3. **Type Safety**: 모든 기능 구현 시 `any` 사용을 금함며, Drizzle 스키마와 연동된 타입을 최우선으로 활용합니다.
4. **Demo vs Production**: `src/routes/demo/` 아래의 코드는 참고용입니다. 실제 기능 구현은 `src/routes/`의 루트 경로에 새롭게 작성하며, 데모 코드를 직접 수정하기보다 구조를 복사하여 적용하세요.

---

## 🎯 프로젝트 목적 & 비전

- **목표**: 개인의 전문성을 증명하는 **고성능 퍼스널 브랜딩 풀스택 웹사이트**.
- **핵심 가치**:
  - **Speed**: 초고속 로딩 (Lighthouse 95+).
  - **Trust**: 정갈한 UI와 타입 안정성.
  - **Impact**: 방문자가 5초 내에 전문성을 파악할 수 있는 레이아웃.

---

## 🏗️ 기술 스택 (Modern Stack v4)

### Core

- **Framework**: `TanStack Start` (React 19 + Vite 7)
- **Styling**: `Tailwind CSS v4.0.6` (CSS-first configuration 적용)
- **Data**: Static JSON (Generated from Markdown)

### Implementation Detail

- **Routing**: TanStack Router (File-based, Type-safe)
- **Server Functions**: `createServerFn`을 사용하여 `src/data/posts.json` 로드
- **UI Components**: Shadcn UI (New York Style, Zinc Palette)

---

## 📁 주요 디렉토리 가이드

- `src/routes/`: 파일 기반 라우팅.
  - `(marketing)/`: 논리적 그룹화.
  - `blog/`: 블로그 관련 라우트 ($slug 등).
- `src/components/shared/`: 공통 컴포넌트.
- `src/components/ui/`: Shadcn UI 컴포넌트.
- `src/data/`: 빌드 시 생성된 정적 데이터(posts.json).

---

## 🛠️ 개발 워크플로우 & 패턴

### 1. 라우트 생성 패턴

```tsx
// src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

```

### 2. 스타일링 원칙 (Tailwind v4)

- `@theme` 변수를 활용하여 커스텀 컬러 및 폰트 정의 (`src/styles.css`).
- 인라인 클래스보다 Shadcn의 `cva`를 활용한 컴포넌트 변형 선호.

### 3. 블로그 데이터 업데이트

1. `mydata/summaries/*.md` 파일 추가/수정.
2. `pnpm run build` (또는 `tsx scripts/generate-posts-data.ts` 실행) -> `src/data/posts.json` 갱신.

---

## 📝 프로젝트 로드맵 (PM 관점)

### Phase 1: MVP ("정체성 확립")

- [ ] **Hero Section**: 강력한 One-liner와 CTA.
- [ ] **Tech Stack Cloud**: 현재 보유 스킬셋 시각화.
- [ ] **Minimal Portfolio**: 대표 프로젝트 3종 카드 UI.
- [ ] **Contact**: LinkedIn/Email 연동 및 심플 폼.

### Phase 2: Enhancement ("신뢰 구축")

- [x] **Blog (Markdown)**: Markdown 파일 기반 정적 블로그.
- [x] **Dark/Light Mode**: TanStack Start 호환 테마 스위처.
- [x] **Animation**: Framer Motion 전환 효과.

---

## 🔍 배포 및 검증 체크리스트

- [ ] `pnpm build` 시 타입 에러가 없는가?
- [ ] `wrangler` 설정이 Cloudflare Workers 환경에 최적화되었는가?
- [ ] 모든 이미지에 `alt` 태그와 `width/height`가 지정되었는가?
- [ ] 모바일 환경에서 인터랙션(터치 타겟 크기 등)이 원활한가?

---

**Last Updated**: 2025-12-27

**Context Version**: 1.2.0 (Static MVP Finalized)
