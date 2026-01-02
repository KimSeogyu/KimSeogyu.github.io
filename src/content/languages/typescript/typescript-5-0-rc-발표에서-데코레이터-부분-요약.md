---
public: true
title: Typescript 5.0 RC 발표에서 데코레이터 부분 요약
date: '2025-12-27'
category: Research
tags: [TypeScript]
excerpt: |-
  Typescript 5.0 RC 발표에서 데코레이터 부분 요약

   설치 방법

  ```shell
  npm install typescript@rc
  ```

   Decorators

  데코레이터는 ECMAScript에 곧 추가되는 기능으로, 클래스와 멤버를 재사용 가능...
---
# Typescript 5.0 RC 발표에서 데코레이터 부분 요약

## 설치 방법

```shell
npm install typescript@rc
```

## Decorators

데코레이터는 ECMAScript에 곧 추가되는 기능으로, 클래스와 멤버를 재사용 가능한 방식으로 사용자화 할 수 있도록 해줍니다.

다음 코드를 고려해봅시다.

```typescript
class Person {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    greet() {
        console.log(`Hello, my name is ${this.name}`);
    }
}

const p = new Person("Ray");
p.greet();
```

`greet`은 매우 간단하게 작성되었으나, 좀 더 복잡한 경우를 상상해봅시다. 비동기 논리 흐름이나 재귀호출, 또는 예기치 못한 부작용 등 여러가지가 있을 수 있습니다. 어떤 것을 상상하든 간에, 우리는 한번
디버깅 로그를 찍어봅시다.

```typescript
class Person {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    greet() {
        console.log("LOG: Entering method.");
        console.log(`Hello, my name is ${this.name}`);
        console.log("LOG: Exiting method.");
    }
}
```

이러한 패턴은 꽤나 일반적입니다. 사실 모든 메소드에 적용해도 좋을만 하죠!
여기서 데코레이터가 등장합니다. 우리는 `loggedMethod`라는 함수를 다음과 같이 작성해봅니다.

```typescript
function loggedMethod(originalMethod: any, _context: any) {
    function replacementMethod(this: any, ...args: any[]) {
        console.log("LOG: Entering method.");
        const result = originalMethod.call(this, args);
        console.log("LOG: Exiting method.");
        return result;
    }

    return replacementMethod;
}
```

"대체 왜 `any`로 떡칠한거야, `any`script야?"

인내심을 가져보세요. 당장은 우리가 이 함수의 동작을 보는 것에 집중하기 위해 다른 것을 단순화 했습니다.
`loggedMethod`가 원본 메소드를 매개변수로 받고, 원본 메소드의 동작 앞 뒤로 로그를 찍은 뒤, 원본 메소드의 결과값을 반환하는 것을 눈치 채셨나요?

이제 우리는 `loggedmethod`로 `greet`메소드를 `decorate`할 수 있습니다.

```typescript
class Person {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    @loggedMethod
    greet() {
        console.log(`Hello, my name is ${this.name}.`);
    }
}

const p = new Person("Ray");
p.greet();

// Output:
//
//   LOG: Entering method.
//   Hello, my name is Ray.
//   LOG: Exiting method.
```

우리는 `loggedMethod`를 단순히 `greet`위에 `@`를 붙여서 올려놓았습니다. 이렇게 하니 매개변수로는 *target*과 *context* 개체가 넘어옵니다.
`loggedMethod`가 새로운 함수를 반환하기에 원래 정의된 `greet`는 반환되는 새로운 함수로 대체됩니다.

언급하지는 않았지만 `loggedMethod`에는 "context object"라는 두번째 매개변수가 있습니다. 이것은 decorated된 메소드가 어떻게 선언되었는지에 대한 유용한 정보를 가지고 있습니다. 정보에는
그것이 `#private`이나 `static` 멤버인지, 또는 메소드의 이름은 무엇인지 등이 있죠. 이를 활용해 `decorated`된 메소드 이름을 출력해 보겠습니다.

```typescript
function loggedMethod(originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = String(context.name);

    function replacementMethod(this: any, ...args: any[]) {
        console.log(`LOG: Entering method '${methodName}'.`)
        const result = originalMethod.call(this, ...args);
        console.log(`LOG: Exiting method '${methodName}'.`)
        return result;
    }

    return replacementMethod;
}
```

드디어 `loggedMethod`에서 `any`를 하나 지웠습니다. 타입스크립트는 `ClassMethodDecoratorContext`라는 타입을 제공하는데, 이것은 데코레이터가 붙은 메소드의 context
object를 유형화합니다.

메타데이터와 별개로, 메소드를 위한 context object는 `addInitializer`라는 유용한 함수를 제공합니다. 이는 생성자가 호출되거나 스태틱 메소드 호출시 클래스가 초기화 될 때 연결하는
방법입니다.)

예를 들어, 자바스크립트에서는 다음과 같은 방식이 일반적입니다.

```typescript
class Person {
    name: string;

    constructor(name: string) {
        this.name = name;
        this.greet = this.greet.bind(this);
    }

    greet() {
        console.log(`Hello, my name is ${this.name}`);
    }
}
```

또는 `greet`를 화살표 함수로 선언이고 속성으로 선언했을 수도 있습니다.

```typescript
class Person {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    greet = () => {
        console.log(`Hello, my name is ${this.name}.`);
    }
}
```

이 코드는 `greet`이 독립 실행형 함수로 호출되거나 콜백으로 전달되는 경우 *this*가 다시 바인딩 되지 않도록 작성되었습니다.

```typescript
const greet = new Person("Ray").greet;
// We don't want this to fail!
greet();
```

우리는 `addInitializer`로 생성자에 `bind`하도록 하는 데코레이터를 작성할 수 있습니다.

```typescript
function bound(originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name;
    if (context.private) {
        throw new Error(`'bound' cannot decorate private properties like ${methodName as string}.`);
    }
    context.addInitializer(function () {
        this[methodName] = this[methodName].bind(this);
    });
}
```

`bound`는 아무것도 반환하지 않고 오버라이딩 하지도 않으므로 이 로직은 초기화시에만 실행될 겁니다.

```typescript
class Person {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    @bound
    @loggedMethod
    greet() {
        console.log(`Hello, my name is ${this.name}.`);
    }
}

const p = new Person("Ray");
const greet = p.greet;

// Works!
greet();
```

데코레이터가 두개 이상일 땐 역순으로 실행됩니다. 그러모르 위 경우에선 `loggedMethod`가 `greet`을 감싸고 새 함수를 반환하며, 그 새 함수를 bound가 감싸게 되겠네요. 지금 경우에선 문제가
안되지만 특정 순서가 중요한 구조에서는 문제가 되므로 주의해야 합니다.

여기에 약간의 기술을 더하면 데코레이터를 반환하는 함수를 만들 수도 있습니다.

```typescript
function loggedMethod(headMessage = "LOG:") {
    return function actualDecorator(originalMethod: any, context: ClassMethodDecoratorContext) {
        const methodName = String(context.name);

        function replacementMethod(this: any, ...args: any[]) {
            console.log(`${headMessage} Entering method '${methodName}'.`)
            const result = originalMethod.call(this, ...args);
            console.log(`${headMessage} Exiting method '${methodName}'.`)
            return result;
        }

        return replacementMethod;
    }
}
```

이때 우리는 반드시 `loggedMethod`를 메소드 전에 호출해야 하고, 필요시 파라미터도 넘겨줘야 합니다.

```typescript
class Person {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    @loggedMethod("")
    greet() {
        console.log(`Hello, my name is ${this.name}.`);
    }
}

const p = new Person("Ray");
p.greet();

// Output:
//
//    Entering method 'greet'.
//   Hello, my name is Ray.
//    Exiting method 'greet'.
```

데코레이터는 메소드 뿐만 아니라 프로퍼티, 필드, 게터, 세터, 자동접근자(`auto-accessor`)까지도 사용할 수 있습니다. 심지어는 클래스 스스로도 서브클래싱이나 등록으로 데코레이팅 될 수 있습니다.
데코레이터를 더 깊게 공부하고 싶다면 [Axel Rauschmayer’s extensive summary.](https://2ality.com/2022/10/javascript-decorators.html)을 읽어
보세요.
포함된 변경사항에 대해 더 많은 정보를 알고 싶다면 [원본 풀리퀘스트](https://github.com/microsoft/TypeScript/pull/50820)를 확인해 보세요.

