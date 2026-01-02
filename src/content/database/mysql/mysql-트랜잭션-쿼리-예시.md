---
public: true
title: 'MySQL 트랜잭션 쿼리 예시 '
date: '2025-12-27'
category: Database
tags: [Database]
excerpt: |-
  MySQL 트랜잭션 쿼리 예시 

  ```mysql
  START TRANSACTION;  
    
  SAVEPOINT A;  
  INSERT INTO user(username, password, salt)  
  VALUES ('testuser', 'testpassword',...
---

# MySQL 트랜잭션 쿼리 예시 

```mysql
START TRANSACTION;  
  
SAVEPOINT A;  
INSERT INTO user(username, password, salt)  
VALUES ('testuser', 'testpassword', 'testsalt');  
  
SAVEPOINT B;  
INSERT INTO user(username, password, salt)  
VALUES ('testuser1', 'testpassword1', 'testsalt1');  
  
# B 쿼리 이전, 즉 A - B 사이의 WRITE만 유효  
ROLLBACK TO SAVEPOINT B;  
  
# 전체 취소  
# ROLLBACK;  
  
# 전체 적용  
# COMMIT;
```
