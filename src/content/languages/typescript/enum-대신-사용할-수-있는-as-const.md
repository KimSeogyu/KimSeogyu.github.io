---
public: true
title: Enum 대신 사용할 수 있는 `as const`
date: '2025-12-27'
category: Research
tags: [TypeScript]
excerpt: >-
  Enum 대신 사용할 수 있는 `as const`


  > 자세한 내용은 우아한형제들 기술 블로그 참고 부탁드립니다.
  [링크](https://techblog.woowahan.com/9804/toc-1)


  ```typescript

  /
    const NodeEnv...
---

# Enum 대신 사용할 수 있는 `as const`

> 자세한 내용은 우아한형제들 기술 블로그 참고 부탁드립니다. [링크](https://techblog.woowahan.com/9804/#toc-1)

```typescript
/**
 * const NodeEnvMap: {  
 *   readonly Local: "local";  
 *   readonly Dev: "dev";  
 *   readonly Prod: "prod";  
 *   readonly Test: "test";  
 * }
 */
export const NodeEnvMap = {
	Local: 'local',
	Dev: 'dev',
	Prod: 'prod',
	Test: 'test',
} as const;
  
// type NodeEnvMapType = "local" | "dev" | "prod" | "test"
export type NodeEnvMapType = typeof NodeEnvMap[keyof typeof NodeEnvMap];
```

`as const`를 안해주면 아래와 같이 `string`!

```typescript
/**
* const NodeEnvMap: {
*   Local: string;
*   Dev: string;
*   Prod: string;
*   Test: string;
* }
*/
export const NodeEnvMap = {
	Local: 'local',
	Dev: 'dev',
	Prod: 'prod',
	Test: 'test',
} 
```
