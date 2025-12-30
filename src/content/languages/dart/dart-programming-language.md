---
public: true
title: Dart Programming Language
date: '2025-12-27'
category: Research
tags: []
excerpt: |-
  Dart Programming Language

   Hello world

  ```dart
  void main() {
    print('hello world');
  }

  dart run main.dart
  ```

   Variables

   The Var keywor...
---
# Dart Programming Language

## Hello world

```dart
void main() {
  print('hello world');
}

dart run main.dart
```

## Variables

### The Var keyword

```dart
void main() {
  // Compiler automatically infers type of value
  var name = 'seogyugim';

  // Declare obviously type of value
  String strname = 'seogyugim';
}
```

### Dynamic Type

```dart
void main() {
  dynamic name;
  if (name is String) {
    // Compiler already knows type of name
    name.isEmpty;
  }

  // And dart support optional chaining
  name?.isEmpty;
}
```

### Null Safety

```dart
bool isEmpty(String s) => s.length == 0;

void main() {
  // It'll throw NoSuchMethodError
  isEmpty(null);

  // It's not okay
  String name1 = 'seogyugim';
  // Because name2 must be not null
  if (name1 != null) {
    nico.isNotEmpty;
  }

  // It's not okay
  String? name2 = 'seogyugim';
  name = null;
  // Because name could be a null
  name.isNotEmpty
  if (name2 != null) {
    nico.isNotEmpty;
  }

  // It's okay
  String? name = 'seogyugim';
  name = null;
  name?.isNotEmpty;
}
```

### Final

```dart
void main() {
  // As same as val of kotlin, const of javascript
  final name = 'seogyugim';
}
```

### Late Variables

```dart
void main() {
  // We can create variable without data with late keyword
  late final String name;
  late var name2;

  // It will throw Error because it is not definitely assigned
  print(name);
}
```

### Constant Variables

```dart
void main() {
  // compile-time constant
  const name = 'seogyugim';
  // Error
  name = ''

  // OK
  const API_KEY = '123123';
  // Error, because compiler don't know when compile-time.
  const apiRes = fetchApi();
  // OK
  final apiRes = fetchApi();
}
```

## Data Types

### Basics

```dart
void main() {
  String name = 'seogyugim';
  bool isExist = true;
  int age = 30;
  double money = 0.01;

 // father class of int and double
 // abstract class int extends num { ...
  num x = 12;
}
```

### Lists

```dart
void main() {
 // Type:  List<int>
 var numbers = [1, 2, 3, 4];

 // abstract class List<E> implements ...
 List<int> nums = [1, 2, 3, 4];
 numbs.first;
 numbs.last;
 numbs.add(3);
 numbs.contains(9);

 var giveMeFive = true;
 var nums = [
  1,
  2,
  3,
  // Collection If
  if (giveMeFive) 5,
 ];
}
```

### String Interpolation

```dart
void main() {
 var age = 10;
 var hello = "Hello everyone! my name is $name, and I\'m ${age + 1} Nice to meet you!";
 print(hello);
}
```

### Collection For

```dart
void main() {
 var oldFriends = ["nico", "lynn"];
 var newFriends = [
  "seogyugim",
  "kyoungseo",
  for (var f in oldFriends) "Hi $f",
 ];
}
```

### Maps

```dart
void main() {
 // Object in Dart is as same as 'any' type in Typescript
 var p = {
  "name": 'seogyugim',
  "xp": 100,
  "po": 100,
 };
 Map<int, bool> existanceTable = {
  1: true,
  2: false,
  3: true,
 };
}
```

### Sets

```dart
void main() {
 var numbers = {1, 2, 3, 4};
 Set<int> nums = {1, 2, 3, 4};
}
```

## Functions

### How to define

```dart
void sayHello(String name) {
 print("Hello $name, nice to meet you!");
}

void retHello(String name) => "Hello $name, nice to meet you!";

void main() {
 sayHello('seogyugim');
 print(rethello('seogyugim'));
}
```

### Named Parameters

```dart
String hello(
 String name,
 int age,
 String country,
) {
 return "$name, $age, $country";
}

String namedDefaultHello({
 String name = 'anonymous',
 int age = 50,
 String country = 'Korea',
}) {
 return "$name, $age, $country";
}

String namedRequiredHello({
 required String name,
 required int age,
 required String country,
}) {
 return "$name, $age, $country";
}

void main() {
 print(hello(
  'seogyugim',
  30,
  'Korea',
 ));

 print(namedDefaultHello());

 print(namedRequiredHello(
  name: 'seogyugim',
  age: 30,
  country: 'Korea',
 ));
}
```

### Optional Positional Parameters

```dart
String sayHello(String name, int age, [String? country = "Hello"]) {
 return "$name, $age, $country";
}

void main(List<String> args) {
 print(sayHello("Hello",31,));
}
```

### Question Question Operator

```dart
String getName([String? name]) => name?.toUpperCase() ?? "Kim Seogyu";

void main(List<String> args) {
 String name = getName();
 String? name2;
 name2 ??= "Example";
 print(name);
 print(name2);
}
```

### Typedef

```dart
typedef ListOfInts = List<int>;

ListOfInts reverseListOfNumbers(ListOfInts list) {
 var reversed = list.reversed;
 return reversed.toList();
}

void main() {
 reverseListOfNumbers([1,2,3]);
}
```

## Classes

### Constructors

### Named Constructor Parameters

### Named Constructors

### Cascade Notations

### Enums

### Abstract Classes

### Inheritance

### Mixins
