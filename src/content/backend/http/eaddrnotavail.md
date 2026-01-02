---
public: true
title: EADDRNOTAVAIL
date: '2025-12-27'
category: Backend_DevOps
tags: [Backend, HTTP]
excerpt: |-
  EADDRNOTAVAIL

   문제 상황

  1. node.js 서버 애플리케이션을 리눅스 환경에서 사용중이다.
  2. 아래와 같은 에러가 발생했다

  ```json
  {
    "message": "request to aa failed, reason: connect EAD...
---
# EADDRNOTAVAIL

## 문제 상황

1. node.js 서버 애플리케이션을 리눅스 환경에서 사용중이다.
2. 아래와 같은 에러가 발생했다

```json
{
  "message": "request to aa failed, reason: connect EADDRNOTAVAIL aa:30000 - Local (aa:0)",
  "type": "system",
  "errno": "EADDRNOTAVAIL",
  "code": "EADDRNOTAVAIL",
  "isFetchError": true,
  "url": "aa"
}
```

## 해결 방법 조사

`etc/sysctl.conf`의 `net.ipv4.tcp_tw_recycle`를 활성화 하는 것은 좋은 생각이 아니다.

위 옵션 변경으로 튜닝 하라는 가이드 문서가 많이 보이지만, tcp(7) 매뉴얼 페이지에 의하면 NAT를 가지고 동작할 때 문제가 발생할 수 있어서 권장하지 않는다고 한다.

TIME_WAIT 상태의 접속은 접속 테이블에서 1분동안 유지된다. 즉 같은 네 쌍둥이(소스주소, 소스포트, 목적지주소, 목적지포트)에 다른 연결은 존재할 수 없다는 것을 뜻한다.
웹 서버로 예를 들면 목적지 주소와 목적지 포트는 상수일 것이다. 웹 서버가 L7 로드밸런서 뒤에 있다면 소스 주소 도한 상수일 수 있다. 리눅스에서 클라이언트 포트는 기본적으로 30,000개의 포트 범위에서 할당
된다(`net.ipv4.ip_local_port_range`를 튜닝하여 변경가능). 즉, 웹서버와 로드밸런서 사이에 연결이 매 분당 총 30,000개이며 매초 평균 500개의 연결이 맺어질 수 있다는 것을
의미하겠다.
이것을 초과하면 EADDRNOTAVAIL을 리턴한다. 해결방법은 네 쌍둥이를 더 많이 가질 수 있게 하는 것 밖에 없다.
난이도가 어려운 순서대로 나열하면 다음과 같다.

- `net.ipv4.ip_local_port_range`를 좀 더 넓게 세팅해서 더 많은 클라이언트 포트를 사용한다
- 리스닝하는 웹서버에 추가적인 포트(81,82,83,...)를 할당함으로써 좀 더 많은 서버 포트를 사용한다
- 로드 밸런서에 아이피를 추가하거나 라운드 로빈 기능을 적용해서 좀 더 많은 클라이언트 아이피를 사용한다.
- 웹 서버에 아이피를 추가하여 좀 더 많은 아이피를 사용한다.

NodeJS에서의 우회적인 방법으로는 다음과 같은 방법이 있다.

```js
var http = require( "http"),
    agent = new http.Agent( {maxSockets: 1} );


function httpRequest( callback ) {
    var options = {
            host: 'localhost',
            port: 80,
            path: '',

            agent: agent
        },
...
```

```js
var http = require("http");

function httpRequest(callback) {
    var options = {
        ...,
        agent: false
    };
...
```

또한 아래를 `/etc/sysctl.conf`에 추가해주었다.

`net.ipv4.ip_local_port_range = 1024 65535`

## 참고 문서

- [리눅스 man-pages](https://man7.org/linux/man-pages/index.html)
- [[번역] 바쁜 리눅스 서버에서 TCP TIME-WAIT 상태 대처하기](https://linux.systemv.pe.kr/%EB%B2%88%EC%97%AD-%EB%B0%94%EC%81%9C-%EB%A6%AC%EB%88%85%EC%8A%A4-%EC%84%9C%EB%B2%84%EC%97%90%EC%84%9C-tcp-time-wait-%EC%83%81%ED%83%9C-%EB%8C%80%EC%B2%98%ED%95%98%EA%B8%B0/)
- [2014년도 구글 그룹에서의 한 문답..](https://groups.google.com/g/nodejs/c/68SYd6_ksns?pli=1)
- [[Linux] 커널 파라미터 수정 - TCP 성능향상](https://bangu4.tistory.com/135)
