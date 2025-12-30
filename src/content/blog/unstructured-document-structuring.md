---
title: "비정형 금융 문서의 구조화 전략: 단순 텍스트 추출을 넘어서"
description: "RAG 성능을 결정짓는 핵심 전처리 기술, Paragraph Tree 구축과 Rule-based Parsing을 통한 문서 구조 복원 전략을 소개합니다."
date: "2024-12-30"
category: "Data Engineering"
tags: ["Python", "Data Structure", "PDF Parsing", "RAG"]
---

RAG(Retrieval-Augmented Generation) 시스템을 구축할 때 가장 간과하기 쉽지만, 사실 성능에 가장 큰 영향을 미치는 단계는 바로 **데이터 전처리(Preprocessing)**입니다. 특히 금융 투자설명서나 법률 계약서처럼 형식이 복잡하고 긴 문서를 다룰 때는 단순한 `CharacterSplitter`로는 한계에 부딪힐 수밖에 없습니다.

이 글에서는 KB증권 AI 에이전트 프로젝트에서 사용한 문단 구조화(Date Structuring) 전략, 특히 **Paragraph Tree** 개념을 소개합니다.

## 1. 맹목적인 Chunking의 문제점

일반적인 RAG 파이프라인은 PDF에서 텍스트를 긁어온 뒤 500자나 1000자 단위로 자릅니다.

> "제 5 조 (기한이익상실) ... (중략) ... 다음 각 호의 사유가 발생하면..."

만약 Chunk가 "다음 각 호의 사유가 발생하면..."에서 끊기고, 다음 Chunk에 구체적인 사유들이 들어간다면 어떻게 될까요? 검색 엔진은 두 Chunk 사이의 연관성을 잃어버리고, LLM은 "사유가 무엇인가요?"라는 질문에 답할 수 없게 됩니다.

## 2. 해결책: 문서의 계층적 구조화 (Paragraph Tree)

우리는 문서를 평면적인 문자열의 나열이 아닌, **계층적 트리(Hierarchical Tree)**로 모델링했습니다.

아래는 그 일부 예시입니다.
- **Level 1**: 대제목 (예: 제1장 총칙)
- **Level 2**: 중제목 (예: 제3조 용어의 정의)
- **Level 3**: 본문 / 항 / 호 (Paragraphs)

### 2.1 Rule-based Layout Analysis

PDF 파서(PyMuPDF, pymupdf4llm, pdfplumber)를 통해 글자의 **폰트 크기, 굵기, 좌표(Bounding Box)** 정보를 추출합니다. 이를 바탕으로 규칙 기반의 파서를 구현했습니다.

- **Header Detection**: 본문보다 폰트가 크거나 굵으면 제목으로 인식.
- **Indentation Analysis**: 들여쓰기 깊이를 분석하여 상위 항목과 하위 항목의 관계(Parent-Child)를 맺어줍니다.

### 2.2 Context Propagation (맥락 상속)

Paragraph Tree의 핵심은 하위 노드가 상위 노드의 정보를 **상속**받는다는 점입니다.

```json
{
  "content": "가. 채무자가 파산선고를 받은 때",
  "metadata": {
    "chapter": "제2장 계약의 해지",
    "article": "제15조 기한이익상실",
    "section": "1항"
  }
}
```

RAG 검색 시 위 Chunk가 검색되면, 단순히 "가. 채무자가 파산선고를 받은 때"만 LLM에 전달하는 것이 아니라, 메타데이터를 포함하여 **"제2장 제15조 1항 가목에 따르면, 채무자가 파산선고를 받은 때 기한이익이 상실된다"**라고 명확한 문맥을 만들어 줄 수 있습니다.

## 3. 표(Table) 구조 복원

금융 문서에서 가장 중요한 정보는 표에 들어있는 경우가 많습니다. 일반 텍스트 추출 시 표는 다단 편집 등으로 인해 순서가 뒤섞이기 쉽습니다.

우리는 표 영역을 별도로 감지하여 Markdown Table 형식으로 변환하거나, 복잡한 표의 경우 HTML 태그(`<table>`)를 그대로 유지하여 구조가 깨지지 않도록 처리했습니다. 이를 통해 LLM이 행과 열의 관계를 정확히 이해할 수 있게 되었습니다.

## 4. 결론: Garbage In, Garbage Out

아무리 뛰어난 LLM을 사용하더라도, 입력되는 데이터의 구조가 깨져 있다면 올바른 추론을 할 수 없습니다. **'비정형 데이터의 정형화(Structuring)'**는 고성능 RAG 시스템 구축을 위한 가장 확실한 투자입니다. 텍스트를 넘어 구조(Structure)를 보는 시각이 필요합니다.
