---
title: "금융 리스크 검출을 위한 Hybrid RAG 아키텍처 구현기"
description: "Kiwi 형태소 분석기와 BM25, FAISS Vector Search를 결합하여 정확도를 95%까지 끌어올린 RAG 파이프라인 구축 경험을 공유합니다."
date: "2024-12-30"
category: "AI Engineering"
tags: [AI/ML, Faiss, Python]
---

금융 도메인에서 비정형 문서를 분석하여 리스크 요인을 자동 검출하는 에이전트를 개발하며 겪었던 **정확도 문제**와 이를 해결하기 위해 도입한 **Hybrid RAG (Retrieval-Augmented Generation) 아키텍처**에 대해 공유하고자 합니다.

## 1. 문제: Vector Search의 한계

초기 RAG 파이프라인은 `OpenAI Embeddings`와 `FAISS`를 사용한 단순한 Dense Vector Search 방식이었습니다. 하지만 금융 문서(투자설명서, 신탁계약서 등)의 특성상 다음과 같은 치명적인 문제들이 발생했습니다.

1. **전문 용어 매칭 실패**: "기한이익상실(EOD)"이나 "LTV" 같은 특정 키워드는 의미적 유사성보다는 정확한 단어 매칭이 중요했는데, Vector Search는 이를 놓치는 경우가 많았습니다.
2. **맥락 혼동**: "수익률 5% 보장"과 "수익률 5% 목표"는 금융 리스크 관점에서 천지차이입니다. 단순 임베딩 유사도로는 이 미묘한 차이를 구분하기 어려웠습니다.

결과적으로 초기 모델의 리스크 검출 정확도는 60%대에 머물렀고, 이는 실무에서 사용하기 어려운 수준이었습니다.

## 2. 해결책: Hybrid Search (Lexical + Semantic)

우리는 키워드 매칭에 강한 **Lexical Search (BM25)**와 의미 파악에 강한 **Semantic Search (Dense Vector)**를 결합하기로 결정했습니다.

### 2.1 Kiwi 형태소 분석기를 활용한 BM25 최적화

한국어 금융 문서의 핵심은 '조사'가 아닌 **'명사(Entity)'**에 있습니다. 일반적인 토크나이저 대신 `Kiwi` 형태소 분석기를 도입하여 명사 위주로 토큰화한 후 BM25 인덱싱을 수행했습니다.

```python
from kiwipiepy import Kiwi
from rank_bm25 import BM25Okapi

kiwi = Kiwi()

def tokenize(text):
    return [token.form for token in kiwi.tokenize(text) if token.tag.startswith('N')]

# 명사 중심 토큰화로 BM25 인덱스 생성
bm25 = BM25Okapi(corpus, tokenizer=tokenize)
```

이 접근 방식은 "담보 대출"과 같은 핵심 키워드 검색 성능을 비약적으로 향상시켰습니다.

### 2.2 Ensemble Retriever & RRF

LangChain의 `EnsembleRetriever`를 사용하여 BM25 검색 결과와 FAISS 벡터 검색 결과를 결합했습니다. 이때 순위 재조정(Re-ranking)을 위해 **RRF (Reciprocal Rank Fusion)** 알고리즘을 적용했습니다.

$$
RRFscore(d) = \sum_{r \in R} \frac{1}{k + r(d)}
$$

이를 통해 키워드가 정확히 일치하거나, 혹은 의미적으로 매우 밀접한 문서 청크들이 상위권에 노출되도록 보정했습니다.

## 3. LLM Reasoning Loop

검색된 문서를 그대로 LLM에게 던져주고 답을 얻는 것만으로는 충분하지 않았습니다. 리스크 검출은 '판단'의 영역이기 때문입니다.

우리는 **'검색(Retrieve) -> 판단(Reason) -> 피드백(Feedback) -> 재검색(Rewrite)'** 루프를 구현했습니다.

1. **Initial Retrieval**: 사용자 질문(쿼리)으로 문서를 검색합니다.
2. **Analysis**: LLM이 검색된 문서가 질문에 답변하기 충분한지 판단합니다.
3. **Missing Info Check**: 만약 정보가 부족하다면, LLM이 스스로 검색 쿼리를 수정(Query Rewrite)하여 다시 검색을 요청합니다.
4. **Final Answer**: 충분한 근거가 확보되었을 때 최종 리스크 리포트를 생성합니다.

이 과정에서 5개의 Multi-Query를 병렬로 수행하여 다양한 관점의 문서를 수집함으로써 정보의 사각지대(Blind Spot)를 최소화했습니다.

## 4. 성과 및 결론

이러한 개선 과정을 거쳐 최종적으로 다음과 같은 성과를 얻을 수 있었습니다.

- **정확도 향상**: 리스크 검출 신뢰도가 60%대에서 **95%**(평가 데이터셋 기준)로 상승했습니다.
- **속도 최적화**: LLM 호출이 늘어난 만큼 비동기 처리(AsyncIO)와 DB 캐싱을 적극 도입하여 전체 응답 시간을 실시간 수준으로 유지했습니다.

RAG는 단순히 벡터 DB를 붙이는 것이 끝이 아닙니다. 도메인의 언어적 특성을 고려한 **Tokenizer 선정**, **Retrieval 전략의 앙상블**, 그리고 **LLM의 추론 루프 설계**가 어우러져야 비로소 현업에서 쓸모 있는 에이전트가 탄생합니다.
