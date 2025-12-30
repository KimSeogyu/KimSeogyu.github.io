---
public: true
title: Rust에서 OS CPU 갯수 찾기
date: '2025-12-27'
category: Research
tags: []
excerpt: |-
  > 참고

   Rust에서 OS CPU 갯수 찾기

   태초의 방식 (deprecated)

  ```ini
  [dependencies]
  num_cpus = "1.0"
  ```

  ```rs
  extern crate num_cpus;
  let num = num_cpus::get(...
---
> 참고

# Rust에서 OS CPU 갯수 찾기

## 태초의 방식 (deprecated)

```ini
[dependencies]
num_cpus = "1.0"
```

```rs
extern crate num_cpus;
let num = num_cpus::get();
```

## 그 다음 방식 (deprecated)

```rs
fn main() {
    println!("{}", std::os::num_cpus());
}
```

## 현재 방식

```rs
// rustc 1.67.0 (fc594f156 2023-01-24)
std::thread::available_parallelism().unwrap().get()
```
