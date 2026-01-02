---
public: true
title: Linux 파일 디스크립터 제한 (ulimit) 완벽 가이드
date: '2025-12-30'
category: Backend
tags: [Backend, DevOps, Infrastructure, Performance]
excerpt: "대용량 트래픽 서버에서 'Too many open files' 오류를 해결하기 위한 ulimit 설정 방법을 알아봅니다."
---
# Linux 파일 디스크립터 제한 (ulimit) 완벽 가이드

## 개요

고트래픽 서버를 운영하다 보면 `Too many open files` 에러를 마주치게 됩니다. 이는 Linux의 **파일 디스크립터(File Descriptor)** 제한 때문입니다. 이 글에서는 ulimit의 개념과 실전 설정 방법을 다룹니다.

## 파일 디스크립터란?

파일 디스크립터는 Linux에서 열린 파일, 소켓, 파이프 등을 나타내는 정수 값입니다. 모든 I/O 작업은 파일 디스크립터를 통해 이루어집니다.

```bash
# 현재 프로세스의 열린 파일 디스크립터 확인
ls -la /proc/self/fd/
```

## 제한 종류

### 시스템 전체 제한

```bash
# 시스템 전체 최대 파일 디스크립터 수
cat /proc/sys/fs/file-max

# 현재 사용 중인 파일 디스크립터 수
cat /proc/sys/fs/file-nr
```

### 프로세스별 제한

```bash
# 현재 쉘의 제한 확인
ulimit -n       # soft limit
ulimit -Hn      # hard limit
```

| 구분 | 설명 |
|-----|------|
| **Soft Limit** | 실제 적용되는 제한, 사용자가 변경 가능 |
| **Hard Limit** | 최대 상한선, root만 증가 가능 |

## 일시적 변경 (현재 세션만)

```bash
# Soft limit 변경 (hard limit 범위 내에서)
ulimit -n 65535

# Hard limit 변경 (root 권한 필요)
sudo ulimit -Hn 100000
```

## 영구적 변경

### 1. limits.conf 설정

`/etc/security/limits.conf` 파일을 수정합니다:

```bash
# /etc/security/limits.conf
# <domain>  <type>  <item>  <value>

*           soft    nofile  65535
*           hard    nofile  100000
root        soft    nofile  65535
root        hard    nofile  100000
```

| 필드 | 설명 | 예시 |
|-----|------|------|
| domain | 적용 대상 | `*` (모든 사용자), `root`, `@group` |
| type | 제한 유형 | `soft`, `hard`, `-` (둘 다) |
| item | 제한 항목 | `nofile` (파일 수), `nproc` (프로세스 수) |
| value | 제한 값 | 숫자 또는 `unlimited` |

### 2. systemd 서비스 설정

systemd로 관리되는 서비스는 별도 설정이 필요합니다:

```ini
# /etc/systemd/system/myapp.service
[Service]
LimitNOFILE=65535
LimitNPROC=65535
```

또는 전역 설정:

```ini
# /etc/systemd/system.conf
DefaultLimitNOFILE=65535
```

설정 후 재시작:

```bash
sudo systemctl daemon-reload
sudo systemctl restart myapp
```

### 3. sysctl로 시스템 전체 제한 변경

```bash
# /etc/sysctl.conf
fs.file-max = 2097152
fs.nr_open = 2097152

# 적용
sudo sysctl -p
```

## 실전 예시: Nginx 설정

```nginx
# /etc/nginx/nginx.conf
worker_rlimit_nofile 65535;

events {
    worker_connections 65535;
}
```

## 문제 해결

### 설정이 적용되지 않을 때

```bash
# PAM 모듈 확인
grep pam_limits /etc/pam.d/common-session
# session required pam_limits.so 가 있어야 함
```

### 현재 프로세스의 제한 확인

```bash
# 특정 프로세스의 제한 확인
cat /proc/<PID>/limits
```

## 권장 설정값

| 서버 용도 | nofile 권장값 |
|---------|--------------|
| 일반 웹 서버 | 65,535 |
| 고트래픽 API 서버 | 100,000+ |
| 데이터베이스 | 65,535 ~ 100,000 |
| 메시지 브로커 | 500,000+ |

## 주의사항

- **과도한 값 설정 금지**: 메모리 오버헤드 발생 가능
- **soft ≤ hard**: soft limit은 hard limit을 초과할 수 없음
- **재부팅 후 확인**: 영구 설정 적용 여부 검증 필수

## 참고 자료

- [Linux man page: limits.conf](https://man7.org/linux/man-pages/man5/limits.conf.5.html)
- [systemd LimitNOFILE](https://www.freedesktop.org/software/systemd/man/systemd.exec.html)
