---
public: true
title: HTTP Transfer 크기를 줄이는 법
date: '2025-12-27'
category: Backend_DevOps
tags: []
excerpt: |-
  HTTP Transfer 크기를 줄이는 법

  1. 종단 간 압축
     ![종단 간 압축](https://developer.mozilla.org/en-US/docs/Web/HTTP/Compression/httpcompression1.png)
      1. Accept-...
---
# HTTP Transfer 크기를 줄이는 법

1. 종단 간 압축
   ![종단 간 압축](https://developer.mozilla.org/en-US/docs/Web/HTTP/Compression/httpcompression1.png)
    1. Accept-Encoding, Content-Encoding 클라이언트와 서버에서 헤더를 통해 정보를 주고 받는다
    2. 이미지, 오디오나 비디오 등의 미디어 파일은 이미 압축되어 있을 확률이 높다.
    3. CPU가 상대적으로 많이 든다.
    4. gzip이 가장 보편적이며, 구글에서 개발한 br이 후발주자로 떠오른다.
2. Hop-By-Hop 압축
   ![Hop-By-Hop 압축](https://developer.mozilla.org/en-US/docs/Web/HTTP/Compression/httpcomp2.png)
    1. 클라이언트와 서버 사이의 경로에 있는 노드들에서 압축이 발생한다.
    2. Transfer-Encoding 헤더를 통해서 압축 방법을 주고 받는다.
    3. 보통 프록시 계층에서 적용된다
    4. `Transfer-Encoding: chunked`
       헤더가 사용될 때는 요청이 완전히 처리되기 전까지 응답의 전체 크기를 알 수 없다. 데이터베이스 쿼리의 결과가 될 큰 HTML 테이블을 생성하는 경우나, 큰 이미지를 전송하는 경우가 예시가 된다.

## 참고 문서

- [Web HTTP Compression](https://developer.mozilla.org/ko/docs/Web/HTTP/Compression)
- [HTTP Headers Transfer-Encoding](https://developer.mozilla.org/ko/docs/Web/HTTP/Headers/Transfer-Encoding)
- [ExpressJS Compression Middleware Library](https://github.com/expressjs/compression)
