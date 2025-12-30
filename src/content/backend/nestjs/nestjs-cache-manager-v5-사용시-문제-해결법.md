---
public: true
title: 'NestJS, Cache-Manager v5 사용시 문제 해결법'
date: '2025-12-27'
category: Backend_DevOps
tags: []
excerpt: |-
  NestJS, Cache-Manager v5 사용시 문제 해결법

   문제

  공식문서에 나온대로 하면 `this.cacheManager.get is not a function` 발생

   원인

  `cache-manager` 가 `v5`로 올라가면서 사용법이 아예...
---
# NestJS, Cache-Manager v5 사용시 문제 해결법

## 문제

공식문서에 나온대로 하면 `this.cacheManager.get is not a function` 발생

## 원인

`cache-manager` 가 `v5`로 올라가면서 사용법이 아예 바뀜..

## 해결

```typescript
import { registerAs } from '@nestjs/config'
import { CACHE_CONFIG_KEY } from '../constants/index.js'
import { redisStore } from 'cache-manager-redis-store'
import { CacheConfigSchema } from './config.zod.js'

export const cacheConfig = registerAs(CACHE_CONFIG_KEY, async () =>
	CacheConfigSchema.parseAsync({
		host: process.env.CACHE_HOST,
		port: Number(process.env.CACHE_PORT),
		ttl: Number(process.env.CACHE_TTL),
		store: redisStore,
	}),
)

@Module({
  providers: [
    {
      provide: CACHE_MANAGER,
      inject: [cacheConfig.KEY],
      useFactory: ({ store, ...config }: ConfigType<typeof cacheConfig>) =>
        caching(store, config),
    },
  ],
})
export class AppCacheModule
```
