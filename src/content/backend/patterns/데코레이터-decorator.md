---
public: true
title: 데코레이터 (Decorator)
date: '2025-12-27'
category: Research
tags: []
excerpt: >-
  데코레이터 (Decorator)

   정의

  데코레이터는 클래스 선언, 메서드, 접근자, 프로퍼티, 또는 매개변수에 첨부할 수 있는 특수한 종류의 선언입니다.  사용 형식은
  `@expression`과 같으며, 여기서 `@expression`은 데코레이팅 된 선언...
---

# 데코레이터 (Decorator)

## 정의

데코레이터는 클래스 선언, 메서드, 접근자, 프로퍼티, 또는 매개변수에 첨부할 수 있는 특수한 종류의 선언입니다.  사용 형식은 `@expression`과 같으며, 여기서 `@expression`은 데코레이팅 된 선언에 대한 정보와 함께 런타임에 호출되는 함수여야 합니다. 데코레이터는 클래스와 클래스 멤버에 어노테이션과 메타-프로그래밍 구문을 추가할 수 있는 방법을 제공합니다.

## 데코레이터 팩토리 (Decorator Factories)

```typescript
function color(value: string) { // 데코레이터 팩토리
	return function (target) { // 데코레이터
		// 'target'과 'value' 변수를 가지고 무언가를 수행합니다
		...
	}
}

# Reference
- https://www.typescriptlang.org/docs/handbook/decorators.html#handbook-content
```

## 데코레이터 합성 (Decorator Composition)

TypeScript에서 단일 선언에서 여러 데코레이터를 사용할 때 다음 단계가 수행됩니다.

1.  각 데코레이터의 표현은 위에서 아래로 평가됩니다.
2.  그런 다음 결과는 아래에서 위로 함수로 호출됩니다.

여러 데코레이터가 단일 선언에 적용되는 경우 예시를 보여드리겠습니다.

```typescript
function first() {  
  console.log('first(): factory evaluated');  
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {  
    console.log('first(): called');  
  };  
}  
  
function second() {  
  console.log('second(): factory evaluated');  
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {  
    console.log('second(): called');  
  };  
}  
  
class ExampleClass {  
  @first()  
  @second()  
  method() {}  
}

# Reference
- https://www.typescriptlang.org/docs/handbook/decorators.html#handbook-content
```
위 `ExampleClass`의  `method` 를 호출하면 아래 결과를 출력하게 됩니다
```
first(): factory evaluated
second(): factory evaluated
second(): called
first(): called
```

## 데코레이터 평가 (Decorator Evaluation)

클래스에서 다양한 선언에 데코레이터를 적용하는 방법은 다음과 같이 잘 정의되어 있습니다.
1. _Parameter Decorators_, followed by _Method_, _Accessor_, or _Property Decorators_ are applied for each instance member.
2.  _Parameter Decorators_, followed by _Method_, _Accessor_, or _Property Decorators_ are applied for each static member.
3.  _Parameter Decorators_ are applied for the constructor.
4.  _Class Decorators_ are applied for the class.

## 클래스 데코레이터 (Class Decorators)

클래스 데코레이터는 클래스 선언 직전에 선언되며, 해당 클래스의 생성자에 적용됩니다.
```typescript
@sealed
class BugReport {
  type = "report";
  title: string;
  
  constructor(t: string) {
    this.title = t;
  }
}

function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}
```

```typescript
function reportableClassDecorator<T extends { new (...args: any[]): {} }>(  
  constructor: T,  
) {  
  return class extends constructor {  
    reportingURL = 'http://www...';  
  };  
}  
  
@reportableClassDecorator  
class BugReport {  
  type = 'report';  
  title: string;  
  
  constructor(t: string) {  
    this.title = t;  
  }  
}  
  
const bug = new BugReport('Needs dark mode');  
console.log(bug.title); // Prints "Needs dark mode"  
console.log(bug.type); // Prints "report"  
  
// Note that the decorator *does not* change the TypeScript type  
// and so the new property `reportingURL` is not known  
// to the type system:  
bug.reportingURL;

Property 'reportingURL' does not exist on type 'BugReport'.
```

## 메소드 데코레이터 (Method Decorators)

메서드 데코레이터는 메서드 선언 직전에 선언됩니다. 데코레이터는 메서드의 프로퍼티 설명자(Property Descriptor) 에 적용되며 메서드 정의를 관찰, 수정 또는 대체하는 데 사용할 수 있습니다. 메서드 데코레이터는 선언 파일, 오버로드 또는 기타 주변 컨텍스트(예: `선언` 클래스)에서 사용할 수 없습니다.

메서드 데코레이터의 표현식은 런타임에 다음 세 개의 인수와 함께 함수로 호출됩니다:

1.  정적 멤버에 대한 클래스의 생성자 함수 또는 인스턴스 멤버에 대한 클래스의 프로토타입입니다.
2.  멤버의 이름
3.  멤버의 _프로퍼티 설명자_

> 참고  스크립트 대상이 ‘ES5’보다 낮은 경우 _프로퍼티 설명자_ 는 ‘undefined’이 됩니다.

메서드 데코레이터가 값을 반환하면, 메서드의 _프로퍼티 설명자_ 로 사용됩니다.

> 참고  스크립트 대상이 ‘ES5’보다 낮은 경우 반환 값은 무시됩니다.

```typescript
function printClassName(enabled: boolean) {  
  return function (  
    target: any,  
    propertyKey: string,  
    descriptor: PropertyDescriptor,  
  ) {  
    if (enabled) {  
      console.log(target.constructor.name);  
    }  
  };  
}  
  
class Person {  
  msg: string;  
  constructor(msg: string) {  
    this.msg = msg;  
  }  
  @printClassName(true)  
  sayMessage() {  
    return this.msg;  
  }  
}
```

## 접근자 데코레이터 (Accessor Decorators)

접근자 데코레이터는 접근자 선언 바로 전에 선언됩니다. 접근자 데코레이터는 접근자의 _프로퍼티 설명자_에 적용되며 접근자의 정의를 관찰, 수정 또는 교체하는 데 사용할 수 있습니다. 접근자 데코레이터는 선언 파일이나 다른 주변 컨텍스트(예: `선언` 클래스)에서 사용할 수 없습니다.

> 참고  TypeScript는 단일 멤버에 대해 `get` 및 `set` 접근자를 데코레이팅 할 수 없습니다. 대신 멤버의 모든 데코레이터를 문서 순서대로 지정된 첫 번째 접근자에 적용해야 합니다. 왜냐하면, 데코레이터는 각각의 선언이 아닌 `get`과 `set` 접근자를 결합한 프로퍼티 설명자에 적용되기 때문입니다.

접근자 데코레이터의 표현 식은 런타임에 다음 세 가지 인수와 함께 함수로 호출됩니다:

1.  정적 멤버에 대한 클래스의 생성자 함수 또는 인스턴스 멤버에 대한 클래스의 프로토타입
2.  멤버의 이름
3.  멤버의 _프로퍼티 설명자_

> 참고  스크립트 대상이 ‘ES5’보다 낮은 경우 프로퍼티 설명자는 `undefined`가 됩니다.

접근자 데코레이터가 값을 반환하면 멤버의 프로퍼티 설명자로 사용됩니다.

> 참고  스크립트 대상이 ‘ES5’보다 낮은 경우 반환 값은 무시됩니다.

## 프로퍼티 데코레이터 (Property Decorators)

프로퍼티 데코레이터는 프로퍼티 선언 바로 전에 선언됩니다. 프로퍼티 데코레이터는 선언 파일이나 다른 주변 컨텍스트(예: `선언` 클래스)에서 사용할 수 없습니다.

프로퍼티 데코레이터의 표현 식은 런타임에 다음 두 개의 인수와 함께 함수로 호출됩니다:

1.  정적 멤버에 대한 클래스의 생성자 함수 또는 인스턴스 멤버에 대한 클래스의 프로토타입
2.  멤버의 이름

> 참고  TypeScript에서 `프로퍼티 데코레이터`가 초기화되는 방식으로 인해 프로퍼티 설명자가 프로퍼티 데코레이터에 대한 인수로 제공되지 않습니다. 현재 프로토타입의 멤버를 정의할 때 인스턴스 프로퍼티를 설명하는 메커니즘이 없고 프로퍼티의 이니셜라이저를 관찰하거나 수정할 수 있는 방법이 없기 때문입니다. 반환 값도 무시됩니다. 따라서 프로퍼티 데코레이터는 특정 이름의 프로퍼티가 클래스에 선언되었음을 관찰하는 데만 사용할 수 있습니다.

이 정보를 사용하여 다음 예와 같이 프로퍼티에 대한 메타데이터를 기록할 수 있습니다:

```typescript
class Greeter {  
  @format("Hello, %s")  
  greeting: string;  
  
  constructor(message: string) {  
    this.greeting = message;  
  }  
  
  greet() {  
    let formatString = getFormat(this, "greeting");  
    return formatString.replace("%s", this.greeting);  
  }  
}
```

다음 함수 선언을 사용하여 `@format` 데코레이터와 `getFormat` 함수를 정의 할 수 있습니다:

```typescript
import "reflect-metadata";  

const formatMetadataKey = Symbol("format");  

function format(formatString: string) {  
  return Reflect.metadata(formatMetadataKey, formatString);  
}  

function getFormat(target: any, propertyKey: string) {  
  return Reflect.getMetadata(formatMetadataKey, target, propertyKey);  
}
```

`@format("Hello, %s")` 데코레이터는 [데코레이터 팩토리](https://www.typescriptlang.org/ko/docs/handbook/decorators.html#%EB%8D%B0%EC%BD%94%EB%A0%88%EC%9D%B4%ED%84%B0-%ED%8C%A9%ED%86%A0%EB%A6%AC-Decorator-Factories)입니다. `@format("Hello, %s")`가 호출되면 `reflect-metadata` 라이브러리의 `Reflect.metadata` 함수를 사용하여 프로퍼티에 대한 메타데이터 항목을 추가합니다. `getFormat`이 호출되면 형식의 메타데이터 값을 읽습니다.

> 참고  이 예제에는 `reflect-metadata` 라이브러리가 필요합니다. `reflect-metadata` 라이브러리에 대한 자세한 내용은 [메타데이터](https://www.typescriptlang.org/ko/docs/handbook/decorators.html#%EB%A9%94%ED%83%80%EB%8D%B0%EC%9D%B4%ED%84%B0-metadata)를 참조하십시오.


## 메타데이터 (Metadata)

일부 예제는 [실험적 메타데이터 API](https://github.com/rbuckton/ReflectDecorators)에 대한 폴리필(polyfill)을 추가하는 `reflect-metadata` 라이브러리를 사용합니다. 이 라이브러리는 아직 ECMAScript (JavaScript) 표준의 일부가 아닙니다. 그러나 데코레이터가 공식적으로 ECMAScript 표준의 일부로 채택되면 이러한 확장을 채택하게 될 것입니다.

npm을 통해 설치할 수 있습니다.

`   npm i reflect-metadata --save   `

TypeScript에는 데코레이터가 있는 선언에 대해 특정 타입의 메타 데이터를 내보내는 실험적인 지원을 포함합니다. 이 실험적인 지원을 가능하게 하려면, 명령행 또는`tsconfig.json`에서 `emitDecoratorMetadata` 컴파일러 옵션을 설정해야 합니다.

**명령줄**:

`tsc --target ES5 --experimentalDecorators --emitDecoratorMetadata`

**tsconfig.json**:

```typescript
{  
  "compilerOptions": {  
    "target": "ES5",  
    "experimentalDecorators": true,  
    "emitDecoratorMetadata": true  
  }  
}
```

활성화되면 `reflect-metadata`라이브러리를 가져오기만 하면 추가 디자인-타임 타입 정보가 런타임에 사용 가능합니다.

다음 예제에서 이를 확인할 수 있습니다.

```typescript
import 'reflect-metadata';  
  
class Point {  
  constructor(public x: number, public y: number) {}  
}  
  
class Line {  
  private _start: Point;  
  private _end: Point;  
  
  @validate  
  set start(value: Point) {  
    this._start = value;  
  }  
  
  get start() {  
    return this._start;  
  }  
  
  @validate  
  set end(value: Point) {  
    this._end = value;  
  }  
  
  get end() {  
    return this._end;  
  }  
}  
  
function validate<T>(  
  target: any,  
  propertyKey: string,  
  descriptor: TypedPropertyDescriptor<T>,  
) {  
  let set = descriptor.set!;  
  
  descriptor.set = function (value: T) {  
    let type = Reflect.getMetadata('design:type', target, propertyKey);  
  
    if (!(value instanceof type)) {  
      throw new TypeError(  
        `Invalid type, got ${typeof value} not ${type.name}.`,  
      );  
    }  
  
    set.call(this, value);  
  };  
}  
  
const line = new Line();  
line.start = new Point(0, 0);  
  
// @ts-ignore  
// line.end = {}  
  
// Fails at runtime with:  
// > Invalid type, got object not Point
```

TypeScript 컴파일러는 `@Reflect.metadata` 데코레이터를 사용하여 디자인-타임 타입 정보를 주입합니다. 다음 TypeScript와 동일하다고 생각할 수 있습니다.

```typescript
class Line {  
  private _start: Point;  
  private _end: Point;  
  @validate  
  @Reflect.metadata('design:type', Point)  
  set start(value: Point) {  
    this._start = value;  
  }  
  get start() {  
    return this._start;  
  }  
  @validate  
  @Reflect.metadata('design:type', Point)  
  set end(value: Point) {  
    this._end = value;  
  }  
  get end() {  
    return this._end;  
  }  
}
```
