---
public: true
title: C# Overview
date: '2025-12-27'
category: Research
tags: []
excerpt: |-
  C Overview

  Summary of the data types in C with example code snippets

   Value types

  - bool: represents a Boolean value (true or false)

  ```cs
  b...
---
# C# Overview

Summary of the data types in C# with example code snippets

## Value types

- bool: represents a Boolean value (true or false)

```cs
bool isCorrect = true;
```

- char: represents a single Unicode character

```cs
char letter = 'a';
```

- byte: represents an 8-bit unsigned integer

```cs
byte b = 255;
```

- short: represents a 16-bit signed integer

```cs
short s = -32768;
```

- int: represents a 32-bit signed integer

```cs
int i = 42;
```

- long: represents a 64-bit signed integer

```cs
long l = 1000000000L;
```

- float: represents a single-precision floating-point number

```cs
float f = 3.1415927f;
```

- double: represents a double-precision floating-point number

```cs
double d = 3.141592653589793;
```

- decimal: represents a decimal number with up to 28 significant digits

```cs
decimal price = 9.99M;
```

## Reference types

- string: represents a sequence of Unicode characters

```cs
string greeting = "Hello, world!";
```

- object: represents an instance of any type

```cs
object obj = new object();
```

dynamic: represents a type that is determined at runtime

```cs
dynamic dynamicVar = "hello";
Console.WriteLine(dynamicVar.GetType()); // System.String
dynamicVar = 42;
Console.WriteLine(dynamicVar.GetType()); // System.Int32
```

- array: represents a collection of elements of the same type

```cs
int[] numbers = { 1, 2, 3, 4, 5 };
```

class: represents a blueprint for creating objects

```cs
public class Person
{
public string Name { get; set; }
public int Age { get; set; }
}

Person person = new Person { Name = "Alice", Age = 30 };
```

- interface: represents a contract for implementing functionality

```csharp
public interface IShape
{
double GetArea();
}

public class Rectangle : IShape
{
public double Width { get; set; }
public double Height { get; set; }

    public double GetArea()
    {
        return Width * Height;
    }

}

IShape shape = new Rectangle { Width = 10, Height = 20 };
double area = shape.GetArea();
```
