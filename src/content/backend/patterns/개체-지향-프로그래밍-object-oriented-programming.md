---
public: true
title: 개체 지향 프로그래밍 (Object Oriented Programming)
date: '2025-12-27'
category: Backend_DevOps
tags: []
excerpt: |-
  개체 지향 프로그래밍 (Object Oriented Programming)

   개체 지향 프로그래밍 언어의 네가지 기본 원칙

  1. 추상화 - 관련 특성 및 엔터티의 상호 작용을 클래스로 모델링하여 시스템의 추상적 표현을 정의합니다.
  2. 캡슐화 - 개체의 내부...
---
# 개체 지향 프로그래밍 (Object Oriented Programming)

## 개체 지향 프로그래밍 언어의 네가지 기본 원칙

1. 추상화 - 관련 특성 및 엔터티의 상호 작용을 클래스로 모델링하여 시스템의 추상적 표현을 정의합니다.
2. 캡슐화 - 개체의 내부 상태와 기능을 숨기고 public 함수 세트를 통해서만 개체에 엑세스할 수 있습니다.
3. 상속 - 기존 추상화를 기반으로 새 추상화를 만들 수 있습니다.
4. 다형성 - 여러 추상화 에서 다양한 방법으로 상속된 속성 또는 메서드를 구현할 수 있습니다.

## C#의 클래스, 구조체 및 레코드 개요

### 캡슐화

캡슐화는 경우에 따라 개체 지향 프로그래밍의 첫 번째 원래로 인식됩니다. 클래스 또는 구조체는 그것의 외부의 코드에 각 멤버가 엑세스하는 방법을 지정할 수 있습니다. 클래스 또는 어셈블리 외부에서 사용하지 않으려는 메서드 및 변수를 숨겨 코딩 오류 또는 악의적인 악용 가능성을 제한할 수 있습니다.

### 멤버

멤버는 모든 메서드, 필드, 상수, 속성, 이벤트를 포함합니다. 다른 언어에는 있지만 C#에는 전역 변수 또는 메서드가 없습니다. 프로그램의 진입점인 `Main`메서드까지도 클래스나 구조체 내에 선언되어야 합니다.

## 은행 계좌 예제를 통한 개체지향 프로그래밍 살펴보기

### 은행 계좌의 기능

1. 은행계좌를 고유하게 식별하는 10자리 숫자가 있습니다.
2. 소유자의 이름을 저장하는 문자열이 있습니다.
3. 잔액을 검사할 수 있습니다.
4. 예금을 허용합니다.
5. 인출을 허용합니다.
6. 초기 잔액은 양수여야 합니다.
7. 인출은 마이너스 잔액을 초래할 수 없습니다.

### 은행 계좌 형식 정리

```cs
namespace Classes;

public class BankAccount {
  public string Number { get; }
  public string Owner { get; set; }
  public decimal Balance { get; }

  public void MakeDeposit(decimal amount, DateTime date, string note)
  {
  }

  public vode MakeWithdraw(decimal amount, DateTime date, string note)
  {
  }
}
```

`BankAccount` 클래스는 다섯 개의 멤버를 가집니다. 앞의 세가지는 속성인데, 속성은 데이터 요소이며 유효성 검사 또는 기타 규칙을 적용하는 코드가 있을 수 있습니다. 나머지 두 가지는 메서드입니다. 메서드는 단일 함수를 수행하는 코드 블록입니다. 클래스의 각 멤버는 그것의 이름을 읽으면 타인이 해당 클래스가 수행하는 작업을 이해하기에 충분한 정보를 제공해야 합니다.

### 새 계좌 개설 (생성자)

`BankAccount` 형식의 새 개체를 만드는 것은 해당 값을 할당하는 생성자를 정의함을 의미합니다. C#에서 생성자는 클래스와 이름이 같은 멤버입니다.

```cs
namespace Classes;

public class BankAccount {
  private static int accountNumberSeed = 1234567890;
  public string Number { get; }
  public string Owner { get; set; }
  public decimal Balance { get; }

  public BankAccount(string, name, decimal initialBalance)
  {
    // C#는 this 한정자가 선택사항이며 일반적으로 생략할 수 있습니다.
    // this.Owner = name;
    // this.Balance = initialBalance;
    Owner = name;
    Balance = initialBalance;
    // 계좌 번호
    Number = accountNumberSeed.ToString();
    accountNumberSeed++;
  }

  public void MakeDeposit(decimal amount, DateTime date, string note)
  {
  }

  public vode MakeWithdraw(decimal amount, DateTime date, string note)
  {
  }
}
```

생성자는 new를 사용하여 개체를 만들 때 호출됩니다.

```cs
using Classes;

var account = new BankAccount("<name>", 1000);
Console.WriteLine($"Account {account.Number} was created for {account.Owner} with {account.Balance} initial balance.");
```

### 예금 및 인출 만들기

은행 계좌 클래스의 예금과 인출을 구현해보도록 하겠습니다. 먼저 트랜잭션을 나타내는 새 클래스를 생성합니다.
그리고 Transaction 개체의 `List<T>`를 `BankAccount`클래스에 추가하고 Balance 속성을 업데이트 합니다.
다음으로 `MakeDeposit`, `MakeWithdrawal`메서드를 구현합니다.
그 뒤에는 생성자에서 최초 입금 건을 추가해줄 수 있도록 `MakeDeposit`을 호출하게 해보겠습니다.

```cs
namespace Classses

public class Transaction
{
  public decimal Amount { get; }
  public DateTime Date { get; }
  public string Notes { get; }

  public Transaction(decimal amount, DateTime date, string note)
  {
    Amount = amount;
    Date = date;
    Notes = note;
  }
}

public class BankAccount {
  private static int accountNumberSeed = 1234567890;
  private List<Transaction> allTransactions = new List<Transaction>();

  public string Number { get; }
  public string Owner { get; set; }
  public decimal Balance
  {
     get
     {
        decimal balance = 0;
        foreach (var item in allTransactions)
        {
          balanace += item.Amount;
        }
        return balance;
     }
  }

  public BankAccount(string, name, decimal initialBalance)
  {
    // C#는 this 한정자가 선택사항이며 일반적으로 생략할 수 있습니다.
    // this.Owner = name;
    // this.Balance = initialBalance;
    Owner = name;
    MakeDeposit(initialBalance, DateTime.Now, "Initial balance");
    // 계좌 번호
    Number = accountNumberSeed.ToString();
    accountNumberSeed++;
  }

  public void MakeDeposit(decimal amount, DateTime date, string note)
  {
    if (amount <= 0)
    {
      throw new ArgumentOutOfRangeException(nameof(amount), "Amount of deposit must be positive");
    }
    var deposit = new Transaction(amount, date, note);
    allTransactions.add(deposit);
  }

  public vode MakeWithdraw(decimal amount, DateTime date, string note)
  {
    if (amount <= 0)
    {
      throw new ArgumentOutOfRangeException(nameof(amount), "Amount of withdrawal must be positive");
    }
    if (Balance - amount < 0)
    {
      throw new InvalidOperationException("Not sufficient funds for this withdrawal");
    }
    var deposit = new Transaction(-amount, date, note);
    allTransactions.add(deposit);
  }
}
```

## Ref

- [클래스 및 개체를 사용한 개체 지향 프로그래밍 살펴보기](https://learn.microsoft.com/ko-kr/dotnet/csharp/fundamentals/tutorials/classes)
- [개체 지향 프로그래밍(C#)](https://learn.microsoft.com/ko-kr/dotnet/csharp/fundamentals/tutorials/oop)
- [C#의 클래스, 구조체 및 레코드 개요](https://learn.microsoft.com/ko-kr/dotnet/csharp/fundamentals/object-oriented/)
