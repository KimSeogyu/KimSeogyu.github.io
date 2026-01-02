---
public: true
title: Python asyncio 비동기 프로그래밍 완벽 가이드
date: '2026-01-02'
category: Languages
tags: [Python, asyncio, Async, Concurrency, Coroutine]
excerpt: "Python asyncio를 활용한 비동기 프로그래밍의 핵심 개념과 실전 동시성 패턴을 알아봅니다."
---
# Python asyncio 비동기 프로그래밍 완벽 가이드

## 개요

**asyncio**는 Python의 비동기 I/O 프레임워크로, 코루틴(coroutine)을 기반으로 동시성을 구현합니다. I/O 바운드 작업(네트워크, 파일)에서 스레드보다 효율적인 동시 처리가 가능합니다.

## 핵심 개념

### 코루틴 (Coroutine)

```python
import asyncio

# async def로 정의된 함수 = 코루틴 함수
async def fetch_data(url: str) -> dict:
    print(f"Fetching {url}")
    await asyncio.sleep(1)  # 비동기 대기
    return {"url": url, "data": "..."}

# 코루틴 실행
async def main():
    result = await fetch_data("https://api.example.com")
    print(result)

asyncio.run(main())  # 진입점
```

### 이벤트 루프 (Event Loop)

```python
# asyncio.run()이 내부적으로 수행하는 작업
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)
try:
    loop.run_until_complete(main())
finally:
    loop.close()
```

> [!NOTE]
> Python 3.10+에서는 `asyncio.run()`만 사용하면 됩니다. 직접 이벤트 루프를 관리할 필요가 거의 없습니다.

## 동시 실행 패턴

### asyncio.gather - 병렬 실행

```python
async def main():
    # 동시에 3개 요청 실행
    results = await asyncio.gather(
        fetch_data("https://api1.example.com"),
        fetch_data("https://api2.example.com"),
        fetch_data("https://api3.example.com"),
    )
    print(results)  # [result1, result2, result3]
```

**에러 처리**:

```python
async def main():
    results = await asyncio.gather(
        fetch_data("url1"),
        fetch_data("url2"),
        return_exceptions=True,  # 예외를 결과로 반환
    )
    for result in results:
        if isinstance(result, Exception):
            print(f"Error: {result}")
        else:
            print(f"Success: {result}")
```

### asyncio.TaskGroup - 구조적 동시성 (3.11+)

```python
async def main():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(fetch_data("url1"))
        task2 = tg.create_task(fetch_data("url2"))
        task3 = tg.create_task(fetch_data("url3"))
    
    # 모든 태스크 완료 후 결과 접근
    print(task1.result(), task2.result(), task3.result())
```

> [!IMPORTANT]
> `TaskGroup`은 하나의 태스크가 실패하면 나머지를 자동 취소합니다. 에러 전파가 명확합니다.

### asyncio.create_task - 백그라운드 실행

```python
async def background_job():
    while True:
        print("Background running...")
        await asyncio.sleep(5)

async def main():
    # 백그라운드 태스크 시작
    task = asyncio.create_task(background_job())
    
    # 메인 로직 실행
    await do_main_work()
    
    # 태스크 취소
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("Background job cancelled")
```

### as_completed - 완료 순서대로 처리

```python
async def main():
    tasks = [
        asyncio.create_task(fetch_data(f"url{i}"))
        for i in range(5)
    ]
    
    # 완료되는 순서대로 결과 처리
    for coro in asyncio.as_completed(tasks):
        result = await coro
        print(f"Got: {result}")
```

## 동기화 프리미티브

### Semaphore - 동시 실행 제한

```python
async def fetch_with_limit(sem: asyncio.Semaphore, url: str):
    async with sem:  # 세마포어 획득
        return await fetch_data(url)

async def main():
    sem = asyncio.Semaphore(5)  # 최대 5개 동시 실행
    urls = [f"url{i}" for i in range(100)]
    
    tasks = [fetch_with_limit(sem, url) for url in urls]
    results = await asyncio.gather(*tasks)
```

### Lock - 상호 배제

```python
class Counter:
    def __init__(self):
        self.value = 0
        self._lock = asyncio.Lock()
    
    async def increment(self):
        async with self._lock:
            current = self.value
            await asyncio.sleep(0.01)  # 시뮬레이션
            self.value = current + 1
```

### Event - 이벤트 알림

```python
async def waiter(event: asyncio.Event):
    print("Waiting for event...")
    await event.wait()
    print("Event received!")

async def setter(event: asyncio.Event):
    await asyncio.sleep(2)
    event.set()
    print("Event set!")

async def main():
    event = asyncio.Event()
    await asyncio.gather(waiter(event), setter(event))
```

### Queue - 생산자-소비자 패턴

```python
async def producer(queue: asyncio.Queue):
    for i in range(10):
        await queue.put(f"item-{i}")
        print(f"Produced: item-{i}")
        await asyncio.sleep(0.1)

async def consumer(queue: asyncio.Queue, name: str):
    while True:
        item = await queue.get()
        print(f"{name} consumed: {item}")
        queue.task_done()

async def main():
    queue = asyncio.Queue(maxsize=5)
    
    producers = [asyncio.create_task(producer(queue))]
    consumers = [
        asyncio.create_task(consumer(queue, f"consumer-{i}"))
        for i in range(3)
    ]
    
    await asyncio.gather(*producers)
    await queue.join()  # 모든 아이템 처리 대기
    
    for c in consumers:
        c.cancel()
```

## 타임아웃 처리

### asyncio.timeout (3.11+)

```python
async def main():
    try:
        async with asyncio.timeout(5.0):  # 5초 제한
            await long_running_task()
    except TimeoutError:
        print("Task timed out!")
```

### asyncio.wait_for (레거시)

```python
async def main():
    try:
        result = await asyncio.wait_for(
            long_running_task(),
            timeout=5.0
        )
    except asyncio.TimeoutError:
        print("Task timed out!")
```

## 동기 코드와 통합

### run_in_executor - 블로킹 함수 실행

```python
import concurrent.futures

def blocking_io():
    """동기 블로킹 함수"""
    import time
    time.sleep(2)
    return "IO completed"

async def main():
    loop = asyncio.get_event_loop()
    
    # ThreadPoolExecutor (I/O 바운드)
    with concurrent.futures.ThreadPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, blocking_io)
        print(result)
    
    # ProcessPoolExecutor (CPU 바운드)
    with concurrent.futures.ProcessPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, cpu_intensive_task)
```

### asyncio.to_thread (3.9+)

```python
async def main():
    # 간편한 방법
    result = await asyncio.to_thread(blocking_io)
    print(result)
```

## 실전 패턴

### Retry with Exponential Backoff

```python
async def fetch_with_retry(
    url: str,
    max_retries: int = 3,
    base_delay: float = 1.0
) -> dict:
    for attempt in range(max_retries):
        try:
            return await fetch_data(url)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt)
            print(f"Retry {attempt + 1} after {delay}s: {e}")
            await asyncio.sleep(delay)
```

### Rate Limiter

```python
class RateLimiter:
    def __init__(self, rate: int, per: float):
        self.rate = rate
        self.per = per
        self.tokens = rate
        self.updated_at = asyncio.get_event_loop().time()
        self._lock = asyncio.Lock()
    
    async def acquire(self):
        async with self._lock:
            now = asyncio.get_event_loop().time()
            elapsed = now - self.updated_at
            self.tokens = min(self.rate, self.tokens + elapsed * (self.rate / self.per))
            self.updated_at = now
            
            if self.tokens < 1:
                wait_time = (1 - self.tokens) * (self.per / self.rate)
                await asyncio.sleep(wait_time)
                self.tokens = 0
            else:
                self.tokens -= 1
```

### Graceful Shutdown

```python
import signal

async def shutdown(loop, signal=None):
    if signal:
        print(f"Received signal {signal.name}")
    
    tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    [task.cancel() for task in tasks]
    
    await asyncio.gather(*tasks, return_exceptions=True)
    loop.stop()

def main():
    loop = asyncio.new_event_loop()
    
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(
            sig,
            lambda s=sig: asyncio.create_task(shutdown(loop, s))
        )
    
    try:
        loop.run_until_complete(run_server())
    finally:
        loop.close()
```

## 디버깅 팁

### 디버그 모드 활성화

```python
# 환경변수
# PYTHONASYNCIODEBUG=1

# 또는 코드에서
asyncio.run(main(), debug=True)
```

### 느린 콜백 감지

```python
loop = asyncio.get_event_loop()
loop.slow_callback_duration = 0.1  # 100ms 이상 경고
```

## 주의사항

1. ⚠️ **async 함수 내에서 `time.sleep()` 금지** - `await asyncio.sleep()` 사용
2. ⚠️ **CPU 바운드 작업은 ProcessPoolExecutor** - 이벤트 루프 블로킹 방지
3. ⚠️ **코루틴 호출 후 await 필수** - `await` 없이 호출하면 실행되지 않음
4. ⚠️ **태스크 취소 시 CancelledError 처리** - 리소스 정리 필요

## 참고 자료

- [asyncio 공식 문서](https://docs.python.org/3/library/asyncio.html)
- [Real Python: Async IO in Python](https://realpython.com/async-io-python/)
- [PEP 492 – Coroutines](https://peps.python.org/pep-0492/)
