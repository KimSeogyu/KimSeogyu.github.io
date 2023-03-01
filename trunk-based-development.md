# Trunk-Based Development

트렁크 기반 개발은 개발자들이 `trunk`라고 부르는 단일 브랜치에서 공동 작업을 수행하는 소스 제어 브랜칭 모델이며, 수명이 긴 다른 개발 브랜치를 생성하지 않기 위한 방법입니다. 그러므로 이 방법을 사용하면 병합지옥을 피하고 빌드를 깨지 않을 수 있습니다.

## 트렁크 기반 개발의 Good or Bad Practice

### Shared branches off mainline/main/trunk are bad at any release cadence

![trunk-1a](https://trunkbaseddevelopment.com/trunk1a.png)

### Trunk-Based Development For Smaller Teams

![trunk-1b](https://trunkbaseddevelopment.com/trunk1b.png)

### Scaled Trunk-Based Development

![trunk-1c](https://trunkbaseddevelopment.com/trunk1c.png)

## NodeJS에서 플래그 처리를 어떻게 하는게 좋을까?

package.json의 버전을 적극적으로 사용하는게 어떨까 싶다. semver를 사용하고 있다면, release 버전을 부버전까지는 고정시켜 놓고 수버전을 올리면서 패치를 하게 될텐데, 한 릴리즈에서의 모든 기능을 보장한다면 플래그 처리를 부버전까지를 검사하는 것으로 할 수 있다.

아래는 v2.5.x 릴리즈를 하는 경우의 예시이다

```ts
const version = process.env.npm_package_version || ''

if (version.startsWith('v2.5')) {
    someCode();
}
...

```

## NodeJS에서 버전을 가져오는 방법

1. package.json의 version을 가져오는 것
   다만 참조한 스택오버플로우 답변에도 적혀있듯이, 브라우저에서 사용할 시엔 package.json의 내용을 클라이언트에서 참조할 수 있으므로 NodeJS를 활용한 서버에서만 활용하는게 좋을 듯 하다.

   ```ts
   // You need to set resolveJsonModule true in tsconfig.json
   import { version } from './package.json'
   console.log(`version = ${version}`)
   console.log(`Is flag enabled? ${version.startsWith('2.5')}`)
   // version = 1.0.0
   // Is flag enabled? false
   ```

2. process 환경변수에서 가져오는 것
   만약 NodeJS 애플리케이션이 npm 등의 패키지 매니저로 시작되었다면 아래와 같이 가져올 수 있다.

   ```ts
   // run npm start
   const version = process.env.npm_package_version
   console.log(`version = ${version}`)
   console.log(
   	`Is flag enabled? ${version?.startsWith('2.5') ?? 'version is undefined'}`,
   )
   // version = 1.0.0
   // Is flag enabled? false
   ```

물론 버전을 통한 플래그 처리를 하기 위해서는 철저한 package.json 관리가 필요하다.

## Ref

- [트렁크기반개발](https://trunkbaseddevelopment.com/)
- [semver](https://semver.org/lang/ko/)
- [is-there-a-way-to-get-version-from-package-json-in-nodejs-code](https://stackoverflow.com/questions/9153571/is-there-a-way-to-get-version-from-package-json-in-nodejs-code)
