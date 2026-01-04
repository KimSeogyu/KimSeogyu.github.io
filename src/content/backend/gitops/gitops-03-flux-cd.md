---
public: true
title: "GitOps 심화 시리즈 #3: Flux CD - GitOps Toolkit과 컨트롤러 아키텍처"
date: '2026-01-05'
category: Backend
series: gitops
tags: [Backend, DevOps, GitOps, Kubernetes, Flux, CNCF]
excerpt: "Flux의 GitOps Toolkit 아키텍처, Source/Kustomize/Helm Controller의 동작 원리, 그리고 ArgoCD와의 상세 비교를 다룹니다."
---

# GitOps 심화 시리즈 #3: Flux CD - GitOps Toolkit과 컨트롤러 아키텍처

## 시리즈 개요

| # | 주제 | 핵심 내용 |
|---|------|----------|
| 1 | GitOps 개요 | 철학과 원칙, Push vs Pull 배포, Reconciliation |
| 2 | ArgoCD Deep Dive | 아키텍처, Application CRD, Sync 전략 |
| **3** | **Flux CD & GitOps Toolkit** | 컨트롤러 아키텍처, GitRepository, Kustomization |
| 4 | 환경별 설정 관리 | Kustomize vs Helm, 전략 선택 기준 |
| 5 | Secrets Management | Sealed Secrets, External Secrets, SOPS |
| 6 | CI/CD 파이프라인 통합 | Image Updater, Progressive Delivery |

---

## Flux란?

**Flux**는 Kubernetes를 위한 GitOps 도구 집합입니다. 2019년 Weaveworks에서 시작하여 2022년 CNCF Graduated 프로젝트가 되었습니다.

ArgoCD가 단일 애플리케이션이라면, Flux는 **GitOps Toolkit**이라는 독립적인 컨트롤러들의 집합입니다.

### 핵심 특징

- **CNCF Graduated 프로젝트**: 프로덕션 검증 완료
- **모듈러 아키텍처**: 필요한 컨트롤러만 선택적으로 설치 가능
- **Kubernetes Native**: 모든 설정이 CRD로 관리됨
- **Image Automation 내장**: 컨테이너 이미지 자동 업데이트 지원
- **Multi-tenancy 지원**: 네임스페이스 기반의 팀 격리

> [!NOTE]
> Weaveworks가 2024년 폐업했지만, Flux는 CNCF Graduated 프로젝트로서 커뮤니티와 CNCF의 지원 하에 활발히 개발되고 있습니다.

---

## Flux vs ArgoCD: 철학의 차이

본격적으로 들어가기 전에, 두 도구의 근본적인 설계 철학 차이를 이해해야 합니다.

```mermaid
flowchart TB
    subgraph ArgoCD [ArgoCD - 모놀리식]
        A_ALL[단일 애플리케이션\nAPI Server + Repo Server + Controller]
        A_UI[강력한 Web UI]
        A_APP[Application CRD]
    end
    
    subgraph Flux [Flux - 마이크로서비스]
        F_SOURCE[Source Controller]
        F_KUSTOMIZE[Kustomize Controller]
        F_HELM[Helm Controller]
        F_NOTIFY[Notification Controller]
        F_IMAGE[Image Automation]
    end
    
    A_ALL --> A_UI
    A_ALL --> A_APP
    
    F_SOURCE --> F_KUSTOMIZE
    F_SOURCE --> F_HELM
    F_KUSTOMIZE --> F_NOTIFY
    F_HELM --> F_NOTIFY
```

| 관점 | ArgoCD | Flux |
|-----|--------|------|
| **아키텍처** | 모놀리식 (단일 바이너리) | 마이크로서비스 (독립 컨트롤러) |
| **UI** | 내장 Web UI | CLI 중심, UI는 별도 (Weave GitOps) |
| **설치** | 한 번에 전체 설치 | 필요한 컨트롤러만 선택 설치 |
| **멀티 클러스터** | 중앙 집중 (Hub-Spoke) | 분산 (각 클러스터에 Flux 설치) |
| **학습 곡선** | 낮음 (UI 친화적) | 중간 (CRD 이해 필요) |
| **리소스 사용** | 높음 | 낮음 |

> [!NOTE]
> **선택 기준**: 화려한 UI와 중앙 집중 관리가 필요하면 ArgoCD, 경량화와 유연성이 중요하면 Flux가 적합합니다.

---

## GitOps Toolkit 아키텍처

Flux v2는 **GitOps Toolkit**이라는 컨트롤러 집합으로 구성됩니다.

```mermaid
flowchart TB
    subgraph Sources [Source Controllers]
        Git[GitRepository]
        Helm[HelmRepository]
        OCI[OCIRepository]
        Bucket[Bucket]
    end
    
    subgraph Reconcilers [Reconciler Controllers]
        Kustomize[Kustomization]
        HelmRelease[HelmRelease]
    end
    
    subgraph Automation [Automation Controllers]
        ImageRepo[ImageRepository]
        ImagePolicy[ImagePolicy]
        ImageUpdate[ImageUpdateAutomation]
    end
    
    subgraph Notifications [Notification Controller]
        Alert[Alert]
        Provider[Provider]
        Receiver[Receiver]
    end
    
    Git --> Kustomize
    Git --> HelmRelease
    Helm --> HelmRelease
    OCI --> Kustomize
    OCI --> HelmRelease
    
    ImageRepo --> ImagePolicy
    ImagePolicy --> ImageUpdate
    ImageUpdate --> Git
    
    Kustomize --> Alert
    HelmRelease --> Alert
    Alert --> Provider
```

### 컨트롤러 역할

| 컨트롤러 | 역할 | CRD |
|---------|-----|-----|
| **Source Controller** | Git, Helm, OCI에서 아티팩트 가져오기 | GitRepository, HelmRepository, OCIRepository, Bucket |
| **Kustomize Controller** | Kustomize 매니페스트 적용 | Kustomization |
| **Helm Controller** | Helm 릴리스 관리 | HelmRelease |
| **Notification Controller** | 이벤트 알림 | Alert, Provider, Receiver |
| **Image Automation** | 컨테이너 이미지 업데이트 자동화 | ImageRepository, ImagePolicy, ImageUpdateAutomation |

---

## Source Controller

**Source Controller**는 외부 소스에서 아티팩트를 가져와 클러스터 내에서 사용 가능하게 만듭니다.

### GitRepository

가장 기본적인 소스. Git 저장소에서 매니페스트를 가져옵니다:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  # 동기화 주기
  interval: 1m
  
  # Git 저장소 URL
  url: https://github.com/myorg/my-app.git
  
  # 브랜치/태그/커밋
  ref:
    branch: main
    # 또는
    # tag: v1.0.0
    # commit: abc123
  
  # 인증 (필요시)
  secretRef:
    name: git-credentials
  
  # 특정 경로만 가져오기
  ignore: |
    # 전체 제외
    /*
    # 특정 디렉토리만 포함
    !/deploy/
```

**인증 설정**:

```yaml
# HTTPS 인증
apiVersion: v1
kind: Secret
metadata:
  name: git-credentials
  namespace: flux-system
type: Opaque
stringData:
  username: git
  password: ghp_xxxxxxxxxxxx  # GitHub PAT

---
# SSH 인증
apiVersion: v1
kind: Secret
metadata:
  name: git-ssh-key
  namespace: flux-system
type: Opaque
stringData:
  identity: |
    -----BEGIN OPENSSH PRIVATE KEY-----
    ...
    -----END OPENSSH PRIVATE KEY-----
  known_hosts: |
    github.com ssh-rsa AAAA...
```

### HelmRepository

Helm Chart Repository에서 차트를 가져옵니다:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: bitnami
  namespace: flux-system
spec:
  interval: 1h
  url: https://charts.bitnami.com/bitnami
  
  # OCI Registry도 지원
  # type: oci
  # url: oci://ghcr.io/myorg/charts
```

### OCIRepository

OCI Registry에서 아티팩트를 가져옵니다 (Helm 차트 뿐 아니라 Kustomize 매니페스트도 가능):

```yaml
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: OCIRepository
metadata:
  name: podinfo
  namespace: flux-system
spec:
  interval: 5m
  url: oci://ghcr.io/stefanprodan/manifests/podinfo
  ref:
    tag: latest
```

> [!TIP]
> **OCI 아티팩트**는 컨테이너 레지스트리에 Kubernetes 매니페스트를 저장하는 방식입니다. Git 없이도 GitOps가 가능해집니다.

---

## Kustomize Controller

**Kustomize Controller**는 GitRepository에서 가져온 Kustomize 매니페스트를 클러스터에 적용합니다.

### Kustomization CRD

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  # 동기화 주기
  interval: 10m
  
  # 재시도 주기 (실패 시)
  retryInterval: 2m
  
  # 소스 참조
  sourceRef:
    kind: GitRepository
    name: my-app
  
  # 매니페스트 경로
  path: ./deploy/production
  
  # 타겟 네임스페이스 (모든 리소스에 적용)
  targetNamespace: production
  
  # Git에서 삭제된 리소스 정리
  prune: true
  
  # 타임아웃
  timeout: 5m
  
  # Health Check 대기
  wait: true
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: my-app
      namespace: production
```

### Kustomization 간 의존성

Flux의 강력한 기능 중 하나는 **의존성 관리**입니다:

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: infrastructure
  namespace: flux-system
spec:
  interval: 10m
  sourceRef:
    kind: GitRepository
    name: infra
  path: ./infrastructure
  prune: true

---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
  namespace: flux-system
spec:
  interval: 10m
  # infrastructure가 Ready 상태가 된 후에만 적용
  dependsOn:
    - name: infrastructure
  sourceRef:
    kind: GitRepository
    name: apps
  path: ./apps
  prune: true
```

```mermaid
flowchart LR
    subgraph Dependencies [의존성 체인]
        CRDs[CRDs] --> Controllers[Controllers]
        Controllers --> Infrastructure[Infrastructure]
        Infrastructure --> Apps[Applications]
    end
    
    CRDs --> |"dependsOn"| Controllers
    Controllers --> |"dependsOn"| Infrastructure
    Infrastructure --> |"dependsOn"| Apps
```

### 변수 치환 (Post-build Substitution)

Kustomize 적용 후 변수를 치환할 수 있습니다:

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  # ...
  postBuild:
    substitute:
      ENVIRONMENT: production
      REPLICAS: "3"
    substituteFrom:
      - kind: ConfigMap
        name: cluster-config
      - kind: Secret
        name: cluster-secrets
```

```yaml
# deployment.yaml (치환 대상)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: ${REPLICAS}
  template:
    spec:
      containers:
      - name: app
        env:
        - name: ENVIRONMENT
          value: ${ENVIRONMENT}
```

---

## Helm Controller

**Helm Controller**는 Helm 릴리스를 선언적으로 관리합니다.

### HelmRelease CRD

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: nginx
  namespace: default
spec:
  # 동기화 주기
  interval: 10m
  
  # Helm Chart 소스
  chart:
    spec:
      chart: nginx
      version: "15.x"  # SemVer 범위 지원
      sourceRef:
        kind: HelmRepository
        name: bitnami
        namespace: flux-system
  
  # Values 설정
  values:
    replicaCount: 3
    service:
      type: ClusterIP
  
  # Values 파일 참조
  valuesFrom:
    - kind: ConfigMap
      name: nginx-values
      valuesKey: values.yaml
    - kind: Secret
      name: nginx-secrets
      valuesKey: credentials
  
  # Upgrade 설정
  upgrade:
    remediation:
      retries: 3
      remediateLastFailure: true
  
  # Rollback 설정
  rollback:
    recreate: true
    cleanupOnFail: true
```

### Git에서 Helm Chart 사용

HelmRepository 대신 GitRepository에서 직접 차트를 가져올 수도 있습니다:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-charts
  namespace: flux-system
spec:
  interval: 5m
  url: https://github.com/myorg/helm-charts.git
  ref:
    branch: main

---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: my-app
  namespace: default
spec:
  interval: 10m
  chart:
    spec:
      chart: ./charts/my-app  # Git 내 경로
      sourceRef:
        kind: GitRepository
        name: my-charts
        namespace: flux-system
```

---

## Image Automation

Flux의 차별화된 기능: **컨테이너 이미지 버전 자동 업데이트**

```mermaid
sequenceDiagram
    participant Registry as Container Registry
    participant Image as ImageRepository
    participant Policy as ImagePolicy
    participant Update as ImageUpdateAutomation
    participant Git as Git Repository
    participant Flux as Flux Controllers
    participant K8s as Kubernetes
    
    Image->>Registry: 새 이미지 태그 스캔
    Registry-->>Image: v1.2.3 발견
    Image->>Policy: 정책과 매칭
    Policy->>Policy: SemVer 필터링
    Policy->>Update: 업데이트 트리거
    Update->>Git: manifest 수정 & commit
    Git->>Flux: 변경 감지
    Flux->>K8s: 배포
```

### ImageRepository

컨테이너 레지스트리에서 이미지 태그를 스캔합니다:

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  # 스캔할 이미지
  image: ghcr.io/myorg/my-app
  
  # 스캔 주기
  interval: 5m
  
  # 인증 (필요시)
  secretRef:
    name: ghcr-auth
```

### ImagePolicy

어떤 태그를 선택할지 정책을 정의합니다:

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: my-app
  namespace: flux-system
spec:
  imageRepositoryRef:
    name: my-app
  
  # 정책: SemVer 범위
  policy:
    semver:
      range: ">=1.0.0"
  
  # 또는: 알파벳순 최신
  # policy:
  #   alphabetical:
  #     order: asc
  
  # 또는: 숫자순 최신
  # policy:
  #   numerical:
  #     order: asc
```

### ImageUpdateAutomation

Git 저장소의 매니페스트를 자동 업데이트합니다:

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageUpdateAutomation
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 5m
  
  # 업데이트할 Git 저장소
  sourceRef:
    kind: GitRepository
    name: my-app
  
  # Git 설정
  git:
    checkout:
      ref:
        branch: main
    commit:
      author:
        name: Flux
        email: flux@myorg.com
      messageTemplate: |
        Update images
        
        {{range .Changed.Changes -}}
        - {{.OldValue}} -> {{.NewValue}}
        {{end}}
    push:
      branch: main
  
  # 업데이트 대상 파일
  update:
    path: ./deploy
    strategy: Setters  # 마커 기반 업데이트
```

**마커 기반 업데이트**:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: ghcr.io/myorg/my-app:v1.0.0  # {"$imagepolicy": "flux-system:my-app"}
```

> [!IMPORTANT]
> ArgoCD는 Image Updater가 별도 프로젝트인 반면, Flux는 **Image Automation이 핵심 기능**으로 내장되어 있습니다.

---

## Notification Controller

배포 이벤트를 외부 시스템으로 알립니다.

### Alert

어떤 이벤트를 알릴지 정의:

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Alert
metadata:
  name: on-call-alerts
  namespace: flux-system
spec:
  # 심각도 필터
  eventSeverity: error
  
  # 모니터링 대상
  eventSources:
    - kind: Kustomization
      name: '*'
    - kind: HelmRelease
      name: '*'
  
  # 알림 대상
  providerRef:
    name: slack
```

### Provider

알림을 보낼 채널:

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: slack
  namespace: flux-system
spec:
  type: slack
  channel: devops-alerts
  secretRef:
    name: slack-webhook

---
apiVersion: v1
kind: Secret
metadata:
  name: slack-webhook
  namespace: flux-system
stringData:
  address: https://hooks.slack.com/services/T00/B00/XXX
```

**지원 Provider**: Slack, Discord, Microsoft Teams, GitHub, GitLab, PagerDuty, Datadog, Sentry 등

### Receiver

외부에서 Flux로 Webhook 수신:

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1
kind: Receiver
metadata:
  name: github-webhook
  namespace: flux-system
spec:
  type: github
  events:
    - push
  secretRef:
    name: github-webhook-secret
  resources:
    - kind: GitRepository
      name: my-app
```

---

## Flux Bootstrap

Flux 설치의 권장 방법은 **Bootstrap**입니다. Flux 자체를 GitOps로 관리합니다:

```bash
# GitHub 저장소로 Bootstrap
flux bootstrap github \
  --owner=myorg \
  --repository=fleet-infra \
  --branch=main \
  --path=clusters/production \
  --personal

# 생성되는 구조
fleet-infra/
└── clusters/
    └── production/
        └── flux-system/
            ├── gotk-components.yaml  # Flux 컴포넌트
            ├── gotk-sync.yaml        # 자기 자신을 관리하는 Kustomization
            └── kustomization.yaml
```

```mermaid
flowchart TB
    subgraph GitRepo [fleet-infra Repository]
        FluxSys[flux-system/]
        Infra[infrastructure/]
        Apps[apps/]
    end
    
    subgraph Cluster [Kubernetes Cluster]
        Flux[Flux Controllers]
        InfraRes[Infrastructure Resources]
        AppRes[Applications]
    end
    
    Flux -->|Sync| FluxSys
    FluxSys -->|Update| Flux
    Flux -->|Sync| Infra
    Infra --> InfraRes
    Flux -->|Sync| Apps
    Apps --> AppRes
    
    Note[Flux가 자기 자신을 관리!]
```

---

## Multi-tenancy 패턴

Flux는 네임스페이스 기반 격리를 지원합니다:

```yaml
# 팀 A 전용 소스와 Kustomization
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: team-a-apps
  namespace: team-a  # 팀 네임스페이스
spec:
  url: https://github.com/myorg/team-a-apps.git
  # ...

---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: team-a-apps
  namespace: team-a
spec:
  # 해당 팀 네임스페이스로 제한
  targetNamespace: team-a
  serviceAccountName: team-a-reconciler  # 제한된 권한의 SA
  # ...
```

```mermaid
flowchart TB
    subgraph FluxSystem [flux-system namespace]
        FluxCtrl[Flux Controllers]
    end
    
    subgraph TeamA [team-a namespace]
        GitA[GitRepository]
        KustomA[Kustomization]
        SAa[ServiceAccount]
        Apps_A[Team A Apps]
    end
    
    subgraph TeamB [team-b namespace]
        GitB[GitRepository]
        KustomB[Kustomization]
        SAb[ServiceAccount]
        Apps_B[Team B Apps]
    end
    
    FluxCtrl --> GitA & GitB
    GitA --> KustomA --> Apps_A
    GitB --> KustomB --> Apps_B
    
    KustomA -.->|사용| SAa
    KustomB -.->|사용| SAb
```

---

## ArgoCD vs Flux 상세 비교

| 기능 | ArgoCD | Flux |
|-----|--------|------|
| **설치 복잡도** | helm install 한 줄 | flux bootstrap |
| **리소스 사용** | ~400MB 메모리 | ~100MB 메모리 |
| **Web UI** | 강력한 내장 UI | Weave GitOps (별도) |
| **멀티 클러스터** | 중앙 ArgoCD가 관리 | 각 클러스터에 Flux |
| **이미지 자동화** | Image Updater (별도) | 내장 |
| **Helm 지원** | Application에서 처리 | HelmRelease CRD |
| **OCI 지원** | 지원 | 네이티브 지원 |
| **Health Check** | 내장 (강력) | wait/healthChecks |
| **Webhook** | GitHub, GitLab 등 | Receiver로 다양한 소스 |
| **SOPS 지원** | 제한적 | 네이티브 |

### 언제 ArgoCD를 선택할까?

- **UI가 중요**할 때 (운영팀에서 시각적 모니터링 선호)
- **중앙 집중 관리**가 필요할 때 (한 곳에서 모든 클러스터 관리)
- **복잡한 Sync 전략**이 필요할 때 (Sync Waves, Hooks)
- **학습 곡선을 줄이고 싶을 때**

### 언제 Flux를 선택할까?

- **경량화**가 중요할 때 (Edge, 리소스 제한 환경)
- **이미지 자동 업데이트**가 핵심 요구사항일 때
- **SOPS로 Secrets 관리**할 때
- **각 클러스터의 독립성**이 중요할 때
- **Kubernetes Native 접근**을 선호할 때

---

## 정리

| 컴포넌트 | 역할 |
|---------|------|
| **Source Controller** | Git, Helm, OCI에서 아티팩트 가져오기 |
| **Kustomize Controller** | Kustomize 매니페스트 적용, 의존성 관리 |
| **Helm Controller** | Helm 릴리스 생명주기 관리 |
| **Image Automation** | 컨테이너 이미지 자동 업데이트 |
| **Notification Controller** | 이벤트 알림 송수신 |

---

## 다음 편 예고

**4편: 환경별 설정 관리**에서는 다음을 다룹니다:

- Kustomize Base/Overlays 패턴 심화
- Helm values 관리 전략
- Kustomize vs Helm 선택 기준
- 하이브리드 접근: Helm + Kustomize post-rendering

---

## 참고 자료

- [Flux Official Documentation](https://fluxcd.io/flux/)
- [Flux Components](https://fluxcd.io/flux/components/)
- [GitOps Toolkit](https://fluxcd.io/flux/components/)
- [Flux Image Automation](https://fluxcd.io/flux/guides/image-update/)
- [Multi-tenancy with Flux](https://fluxcd.io/flux/components/kustomize/kustomizations/#multi-tenancy)
