---
public: true
title: LangChain & LangGraph 실전 가이드 (2025)
date: '2026-01-02'
category: AI/ML
tags: [LangChain, LangGraph, LLM, Agent, RAG, Python]
excerpt: "LangChain과 LangGraph의 최신 API를 활용한 LLM 애플리케이션 및 에이전트 개발 실전 가이드입니다."
---
# LangChain & LangGraph 실전 가이드 (2025)

## 개요

**LangChain**은 LLM 애플리케이션 개발을 위한 프레임워크이고, **LangGraph**는 상태 기반 에이전트 워크플로우를 구축하는 런타임입니다. 2025년 LangGraph 1.0 릴리스와 함께 두 프레임워크의 역할이 명확해졌습니다.

| 프레임워크 | 역할 | 주요 사용처 |
|-----------|-----|-----------|
| **LangChain** | LLM 인터페이스, 프롬프트, 체인 | RAG, 단순 체인, 도구 호출 |
| **LangGraph** | 상태 관리, 그래프 기반 워크플로우 | 복잡한 에이전트, 멀티 에이전트 |

## 설치

```bash
# LangChain 핵심 + OpenAI 통합
pip install langchain langchain-openai

# LangGraph (에이전트 워크플로우)
pip install langgraph

# 전체 스택
pip install langchain langchain-openai langgraph langchain-community
```

---

## Part 1: LangChain 기초

### ChatOpenAI 설정

```python
from langchain_openai import ChatOpenAI

# 기본 설정
llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
    # openai_api_key="..."  # 또는 OPENAI_API_KEY 환경변수
)

# 스트리밍 활성화
llm_streaming = ChatOpenAI(model="gpt-4o", streaming=True)
```

### LCEL (LangChain Expression Language)

LCEL은 체인을 선언적으로 구성하는 방식입니다.

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([
    ("system", "당신은 {role} 전문가입니다."),
    ("human", "{question}")
])

# 파이프(|)로 체인 연결
chain = prompt | llm | StrOutputParser()

# 실행
result = chain.invoke({
    "role": "Python",
    "question": "asyncio의 장점은?"
})
print(result)
```

### 도구 바인딩 (Tool Calling)

```python
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """도시의 현재 날씨를 조회합니다."""
    # 실제 API 호출 로직
    return f"{city}의 날씨: 맑음, 22°C"

@tool
def calculate(expression: str) -> str:
    """수학 표현식을 계산합니다."""
    return str(eval(expression))

# LLM에 도구 바인딩
llm_with_tools = llm.bind_tools([get_weather, calculate])

# 실행
response = llm_with_tools.invoke("서울 날씨 어때?")
print(response.tool_calls)
# [{'name': 'get_weather', 'args': {'city': '서울'}, 'id': '...'}]
```

### RAG 체인

```python
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.runnables import RunnablePassthrough

# 벡터 스토어 설정 (예시)
embeddings = OpenAIEmbeddings()
vectorstore = FAISS.from_texts(
    ["LangChain은 LLM 프레임워크입니다.", "LangGraph는 에이전트 런타임입니다."],
    embeddings
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# RAG 프롬프트
rag_prompt = ChatPromptTemplate.from_template("""
다음 컨텍스트를 기반으로 질문에 답하세요.

컨텍스트:
{context}

질문: {question}
""")

# RAG 체인
rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | rag_prompt
    | llm
    | StrOutputParser()
)

result = rag_chain.invoke("LangGraph가 뭐야?")
```

---

## Part 2: LangGraph 에이전트

### StateGraph 기본 구조

LangGraph의 핵심은 **상태(State)**와 **노드(Node)**입니다.

```python
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

# 1. 상태 스키마 정의
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]  # 메시지 리듀서
    user_info: str

# 2. 그래프 빌더 생성
graph_builder = StateGraph(AgentState)
```

> [!NOTE]
> `Annotated[list, add_messages]`는 리듀서 함수로, 새 메시지가 기존 리스트에 추가됩니다.

### 노드 정의 단위: 함수 vs 에이전트

노드를 어떤 단위로 정의할지는 프로젝트의 성격에 따라 달라집니다.

#### 함수 단위 (Fine-grained) - 파이프라인 스타일

[LangGraph 공식 README](https://github.com/langchain-ai/langgraph)의 기본 예시:

```python
from langgraph.graph import START, StateGraph
from typing_extensions import TypedDict

class State(TypedDict):
    text: str

def node_a(state: State) -> dict:
    return {"text": state["text"] + "a"}

def node_b(state: State) -> dict:
    return {"text": state["text"] + "b"}

graph = StateGraph(State)
graph.add_node("node_a", node_a)
graph.add_node("node_b", node_b)
graph.add_edge(START, "node_a")
graph.add_edge("node_a", "node_b")

print(graph.compile().invoke({"text": ""}))
# {'text': 'ab'}
```

**적합한 상황**: ETL 파이프라인, 데이터 처리 워크플로우, DAG 스타일 작업

#### 에이전트 단위 (Coarse-grained) - 역할 기반 스타일

```python
def researcher(state): ...  # 리서치 담당
def writer(state): ...      # 글쓰기 담당
def reviewer(state): ...    # 검토 담당
```

**적합한 상황**: 멀티 에이전트 협업, 역할 분리가 명확한 경우

#### 선택 가이드

| 접근법 | 노드 단위 | 장점 | 체크포인트 |
|-------|---------|-----|----------|
| **함수 단위** | fetch, transform, validate 등 | 재사용성 ↑, 테스트 용이 | 세밀한 복구 가능 |
| **에이전트 단위** | researcher, writer 등 | 직관적, 역할 분리 | 큰 단위로 복구 |

> [!IMPORTANT]
> 체크포인트는 **노드 단위**로 저장됩니다. 실패 시 해당 노드부터 재실행되므로, 노드 크기를 "상태 변경의 원자성"으로 결정하세요.

### 노드와 엣지 정의

```python
from langchain_core.messages import HumanMessage, AIMessage

# 노드 함수들
def fetch_user_info(state: AgentState) -> dict:
    """사용자 정보를 가져오는 노드"""
    return {"user_info": "VIP 고객, 가입일: 2023-01-15"}

def chatbot(state: AgentState) -> dict:
    """LLM 응답을 생성하는 노드"""
    system_prompt = f"사용자 정보: {state['user_info']}"
    response = llm.invoke([
        {"role": "system", "content": system_prompt},
        *state["messages"]
    ])
    return {"messages": [response]}

# 노드 추가
graph_builder.add_node("fetch_user", fetch_user_info)
graph_builder.add_node("chatbot", chatbot)

# 엣지 연결 (흐름 정의)
graph_builder.add_edge(START, "fetch_user")
graph_builder.add_edge("fetch_user", "chatbot")
graph_builder.add_edge("chatbot", END)

# 컴파일
graph = graph_builder.compile()
```

### 조건부 라우팅

```python
from langgraph.graph import END

def should_continue(state: AgentState) -> str:
    """다음 노드를 결정하는 조건 함수"""
    last_message = state["messages"][-1]
    
    # 도구 호출이 있으면 도구 실행
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    # 없으면 종료
    return END

# 조건부 엣지 추가
graph_builder.add_conditional_edges(
    "chatbot",
    should_continue,
    {
        "tools": "tool_executor",
        END: END
    }
)
```

### 체크포인트 (메모리 영속성)

```python
from langgraph.checkpoint.memory import InMemorySaver

# 체크포인터 설정
checkpointer = InMemorySaver()
graph = graph_builder.compile(checkpointer=checkpointer)

# thread_id로 대화 세션 관리
config = {"configurable": {"thread_id": "user-123"}}

# 첫 번째 메시지
result1 = graph.invoke(
    {"messages": [HumanMessage(content="안녕하세요")]},
    config=config
)

# 같은 thread_id로 이어서 대화
result2 = graph.invoke(
    {"messages": [HumanMessage(content="이전에 뭐라고 했죠?")]},
    config=config
)
# → 이전 대화 컨텍스트 유지됨!
```

### ReAct 에이전트 (Pre-built)

LangGraph는 일반적인 에이전트 패턴을 위한 프리빌트 함수를 제공합니다.

```python
from langgraph.prebuilt import create_react_agent

# 도구 정의
tools = [get_weather, calculate]

# ReAct 에이전트 생성
agent = create_react_agent(llm, tools=tools)

# 실행
result = agent.invoke({
    "messages": [HumanMessage(content="서울 날씨 알려주고, 15+27 계산해줘")]
})

for msg in result["messages"]:
    print(f"{msg.type}: {msg.content}")
```

### 스트리밍

```python
# 노드별 스트리밍
for event in graph.stream(
    {"messages": [HumanMessage(content="안녕")]},
    config=config
):
    for node_name, output in event.items():
        print(f"[{node_name}] {output}")

# 토큰별 스트리밍 (LLM 출력)
async for event in graph.astream_events(
    {"messages": [HumanMessage(content="긴 이야기 해줘")]},
    config=config,
    version="v2"
):
    if event["event"] == "on_chat_model_stream":
        print(event["data"]["chunk"].content, end="", flush=True)
```

---

## Part 3: 실전 패턴

### 패턴 1: Human-in-the-Loop

```python
from langgraph.types import interrupt

def review_step(state: AgentState) -> dict:
    """사람 승인이 필요한 노드"""
    # interrupt()로 실행 중단, 사용자 입력 대기
    user_approval = interrupt("이 작업을 진행할까요? (yes/no)")
    
    if user_approval != "yes":
        return {"messages": [AIMessage(content="작업이 취소되었습니다.")]}
    
    return {"messages": [AIMessage(content="작업을 진행합니다.")]}
```

### 패턴 2: 멀티 에이전트

```python
from langgraph.graph import StateGraph

class MultiAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    current_agent: str

def researcher(state: MultiAgentState) -> dict:
    """리서치 담당 에이전트"""
    # 리서치 로직...
    return {"messages": [...], "current_agent": "writer"}

def writer(state: MultiAgentState) -> dict:
    """글쓰기 담당 에이전트"""
    # 글쓰기 로직...
    return {"messages": [...], "current_agent": "reviewer"}

def router(state: MultiAgentState) -> str:
    return state["current_agent"]

# 그래프 구성
workflow = StateGraph(MultiAgentState)
workflow.add_node("researcher", researcher)
workflow.add_node("writer", writer)
workflow.add_node("reviewer", reviewer)

workflow.add_edge(START, "researcher")
workflow.add_conditional_edges("researcher", router)
workflow.add_conditional_edges("writer", router)
```

### 패턴 3: 에러 핸들링

```python
from langgraph.errors import NodeInterrupt

def safe_tool_executor(state: AgentState) -> dict:
    try:
        # 도구 실행
        result = execute_tools(state["messages"][-1].tool_calls)
        return {"messages": result}
    except Exception as e:
        # 에러 메시지를 상태에 추가
        error_msg = AIMessage(content=f"도구 실행 실패: {str(e)}")
        return {"messages": [error_msg]}
```

---

## LangChain vs LangGraph 선택 가이드

| 요구사항 | 선택 |
|---------|-----|
| 단순 프롬프트 → LLM → 출력 | LangChain LCEL |
| RAG 파이프라인 | LangChain LCEL |
| 단일 도구 호출 | LangChain `bind_tools` |
| 복잡한 에이전트 루프 | **LangGraph** |
| 멀티 에이전트 협업 | **LangGraph** |
| 대화 상태 영속성 필요 | **LangGraph** checkpointer |
| Human-in-the-loop | **LangGraph** interrupt |

## 참고 자료

- [LangChain Docs](https://python.langchain.com/docs/)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [LangGraph 1.0 Release](https://blog.langchain.dev/langgraph-v1/)
- [LCEL Conceptual Guide](https://python.langchain.com/docs/concepts/lcel/)
