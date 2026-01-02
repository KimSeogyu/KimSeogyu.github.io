import os
import re
import yaml
from pathlib import Path

# 설정: 태그 통합 규칙
TAG_MAPPINGS = {
    # 통합
    "architecture": "Architecture",
    "Architecture": "Architecture",
    "devops": "DevOps",
    "DevOps": "DevOps",
    "Partition": "Partitioning",
    "Partitioning": "Partitioning",
    "gRPC": "gRPC",
    "gRPC-Gateway": "gRPC",
    "Protobuf": "gRPC",
    "Streaming": "Streaming",
    "Streams": "Streaming",
    "Real-time": "Streaming",
    "Data Lake": "Data Architecture",
    "Lakehouse": "Data Architecture",
    "Data Warehouse": "Data Architecture",
    "Lambda Architecture": "Data Architecture",
    "Kappa Architecture": "Data Architecture",
    "Goroutine": "Concurrency",
    "Channel": "Concurrency",
    "Context": "Concurrency",
    "errgroup": "Concurrency",
    "Async": "Concurrency",
    "asyncio": "Concurrency",
    "Coroutine": "Concurrency",
    "pprof": "Performance",
    "Profiling": "Performance",
    "Memory": "Performance",
    "GC": "Performance",
    "Optimization": "Performance",
    "Query Optimization": "Performance",
    "Performance": "Performance",
    "BDD": "Testing",
    "Ginkgo": "Testing",
    "gomock": "Testing",
    "Testcontainers": "Testing",
    "E2E": "Testing",
    "Testing": "Testing",
    "Load Testing": "Testing",
    "Locust": "Testing",
    "spike-traffic": "Testing",
    "DAG": "Orchestration",
    "TaskFlow": "Orchestration",
    "Orchestration": "Orchestration",
    "Workflow": "Orchestration",
    "ETL": "Data Pipeline",
    "ELT": "Data Pipeline",
    "Data Pipeline": "Data Pipeline",
    "Tracing": "Observability",
    "Logging": "Observability",
    "Metrics": "Observability",
    "Observability": "Observability",
    "Monitoring": "Observability",
    "Grafana": "Observability",
    "GIS": "Geospatial",
    "Spatial": "Geospatial",
    "PostGIS": "Geospatial",
    "GeoJSON": "Geospatial",
    "Maps": "Geospatial",
    "Mapbox": "Geospatial",
    "Turf.js": "Geospatial",
    "BIP-32": "Blockchain",
    "BIP-39": "Blockchain",
    "BIP-44": "Blockchain",
    "Wallet": "Blockchain",
    "Cryptography": "Blockchain",
    "Blockchain": "Blockchain",
    "Ethereum": "Blockchain",
    "search": "Search",
    "ranking": "Search",
    "information-retrieval": "Search",
    "hybrid-search": "Search",
    "bm25": "Search",
    "rrf": "Search",
    "elasticsearch": "Search",
    "opensearch": "Search",
    "vector-search": "Vector Search",
    "embedding": "Vector Search",
    "faiss": "Vector Search",
    "similarity-search": "Vector Search",
    "HTTP": "HTTP",
    "HTTP Client": "HTTP",
    "REST": "HTTP",
    "API": "HTTP",
    "Cobra": "Tooling",
    "Makefile": "Tooling",
    "Developer Experience": "Tooling",
    "Circuit Breaker": "Resilience",
    "Rate Limiting": "Resilience",
    "Retry": "Resilience",
    "Graceful Shutdown": "Resilience",
    "ACID": "Transaction",
    "Transaction": "Transaction",
    "DataIntegrity": "Transaction",
    "Wire": "DI",
    "DI": "DI",
    "Index": "Database",
    "EXPLAIN": "Database",
    "Database": "Database",
    "Storage Engine": "Database",
    "Sharding": "Scaling",
    "scaling": "Scaling",
    "write-heavy": "Scaling",
    "ulimit": "Infrastructure",
    "Linux": "Infrastructure",
    "infrastructure": "Infrastructure",
    "SCD": "Data Modeling",
    "Data Modeling": "Data Modeling",
    "Fact Table": "Data Modeling",
    "Dimension": "Data Modeling",
    "Star Schema": "Data Modeling",
    "Kimball": "Data Modeling",
    "Spark": "Spark",
    "PySpark": "Spark",
    "RDD": "Spark",
    "DataFrame": "Spark",
    "Spark UI": "Spark",
    "Shuffle": "Spark",
    "Kafka": "Kafka",
    "Consumer Group": "Kafka",
    "Exactly-Once": "Kafka",
    "Event": "Kafka",
    "Event-Driven": "Kafka",
    "Airflow": "Airflow",
    "Watermark": "Airflow",
    "Docker": "Docker",
    "Container": "Docker",
    "BuildKit": "Docker",
    "Kubernetes": "Kubernetes",
    "Helm": "Kubernetes",
    "ArgoCD": "Kubernetes",
    "GitOps": "Kubernetes",
    "LLM": "AI/ML",
    "RAG": "AI/ML",
    "Agent": "AI/ML",
    "LangChain": "AI/ML",
    "LangGraph": "AI/ML",
    "Distributed Systems": "Distributed Systems",
    "Distributed Computing": "Distributed Systems",
    "Microservices": "Architecture",
    "Gateway": "Architecture",
    "Middleware": "Architecture",
    "Monorepo": "Architecture",
    "Project Layout": "Architecture",
    "Clean Code": "Architecture",
    "Redis": "Redis",
    "MongoDB": "MongoDB",
    "PostgreSQL": "PostgreSQL",
    "MySQL": "MySQL",
    "Go": "Go",
    "Python": "Python",
    "JavaScript": "JavaScript",
    "TypeScript": "TypeScript",
    "React": "Frontend",
    "Enterprise": "Enterprise",
}

# 설정: 삭제할 태그
TAGS_TO_REMOVE = {
    "Best Practices",
    "Production",
    "Automation",
    "Configuration",
    "Versioning",
    "Big Data",
    "Modern Data Stack",
}

# 설정: 디렉토리 기반 태그 매핑
DIR_TAG_MAPPINGS = [
    # (경로 패턴, [추가할 태그들])
    ("src/content/backend/go", ["Backend", "Go"]),
    ("src/content/backend/devops", ["Backend", "DevOps"]),
    ("src/content/backend/nestjs", ["Backend", "NestJS"]),
    ("src/content/backend/http", ["Backend", "HTTP"]),
    ("src/content/data-engineering", ["Data Engineering"]),
    ("src/content/ai-ml", ["AI/ML"]),
    ("src/content/distributed-systems", ["Distributed Systems"]),
    ("src/content/database", ["Database"]),
    ("src/content/blockchain", ["Blockchain"]),
    ("src/content/languages/python", ["Python"]),
    ("src/content/languages/typescript", ["TypeScript"]),
    ("src/content/languages/rust", ["Rust"]),
]


def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Frontmatter 파싱
    match = re.search(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        print(f"Skipping {filepath}: No frontmatter found")
        return

    frontmatter_raw = match.group(1)

    try:
        frontmatter = yaml.safe_load(frontmatter_raw)
    except yaml.YAMLError as e:
        print(f"Error parsing YAML in {filepath}: {e}")
        return

    if "tags" not in frontmatter:
        frontmatter["tags"] = []

    current_tags = frontmatter["tags"]
    if isinstance(current_tags, str):
        current_tags = [current_tags]
    if current_tags is None:
        current_tags = []

    # 1. 태그 정규화 및 삭제
    new_tags = set()
    for tag in current_tags:
        if tag in TAGS_TO_REMOVE:
            continue

        # 매핑 확인
        mapped_tag = TAG_MAPPINGS.get(tag, tag)
        new_tags.add(mapped_tag)

    # 2. 디렉토리 기반 태그 추가
    file_path_str = str(filepath)
    for dir_pattern, tags_to_add in DIR_TAG_MAPPINGS:
        if dir_pattern in file_path_str:
            for tag in tags_to_add:
                new_tags.add(tag)

    # 3. 중복 제거 및 정렬 (모든 태그를 문자열로 변환)
    sorted_tags = sorted([str(t) for t in new_tags])

    # Frontmatter 업데이트
    # YAML 라이브러리를 사용하면 포맷이 바뀔 수 있으므로, 텍스트 치환 방식을 사용하거나
    # yaml.dump를 조심스럽게 사용해야 함. 여기서는 기존 frontmatter 텍스트를 교체하는 방식 사용

    # tags 라인을 찾아서 교체
    lines = content.split("\n")
    new_lines = []
    in_frontmatter = False
    tags_written = False

    for i, line in enumerate(lines):
        if line.strip() == "---":
            if i == 0:
                in_frontmatter = True
            elif in_frontmatter:
                in_frontmatter = False

        if in_frontmatter and line.strip().startswith("tags:"):
            # tags: [...] 형태로 작성
            tags_str = ", ".join(sorted_tags)
            new_lines.append(f"tags: [{tags_str}]")
            tags_written = True
        else:
            new_lines.append(line)

    # 파일 쓰기
    new_content = "\n".join(new_lines)
    if content != new_content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filepath}: {sorted_tags}")
    else:
        print(f"No changes for {filepath}")


def main():
    root_dir = Path("src/content")
    for filepath in root_dir.rglob("*.md"):
        process_file(filepath)


if __name__ == "__main__":
    main()
