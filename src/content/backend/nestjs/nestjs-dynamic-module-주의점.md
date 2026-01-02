---
public: true
title: NestJS Dynamic Module 주의점
date: '2025-12-27'
category: Backend_DevOps
tags: [Backend, NestJS]
excerpt: "NestJS Dynamic Module 주의점\n\n```typescript\nexport const databaseProviders = [\n\t{\n\t\tprovide: MysqlDatasourceKey,\n\t\tinject: [ConfigService, MysqlConfigS..."
---
# NestJS Dynamic Module 주의점

```typescript
export const databaseProviders = [
	{
		provide: MysqlDatasourceKey,
		inject: [ConfigService, MysqlConfigService],
		useFactory: async (
			configService: ConfigService,
			databaseConfigService: MysqlConfigService,
		) => {
			const dataSource = new DataSource(
				databaseConfigService.getTypeormConfig(),
			)
			return dataSource.initialize()
		},
	},
]
```

> 위와 같은 상황에서 useFactory에 인자에는 무조건 **`inject`배열의 순서**대로 인스턴스가 들어온다

- 참고
  - `MySqlConfigService` 는 `ConfigService`에 의존성이 있다.
