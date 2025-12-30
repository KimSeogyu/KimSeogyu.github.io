import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Github, Linkedin, Mail, Phone, ExternalLink } from 'lucide-react'

export const Route = createFileRoute('/resume')({
  component: ResumePage,
})

function ResumePage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4 md:px-8 print:py-8 print:px-8">
      <div className="max-w-4xl mx-auto space-y-16 print:space-y-8 print:max-w-none print:w-full">
        
        {/* Header Section */}
        <header className="space-y-4 text-center md:text-left print:text-left print:space-y-2">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 print:text-5xl print:mb-0">
                <span className="gradient-text">Seogyu Kim</span>
              </h1>
              <p className="text-xl text-muted-foreground font-light print:text-lg">
                Senior Software Engineer
              </p>
            </div>
            
            {/* Contact Info & Actions */}
            <div className="flex flex-col gap-2 text-sm text-muted-foreground items-center md:items-end w-full md:w-auto print:items-end print:text-sm">
              <div className="flex gap-2 print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 mb-2"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Save as PDF
                </button>
              </div>

              <a href="mailto:asap0208@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors no-underline">
                <Mail className="w-4 h-4" /> asap0208@gmail.com
              </a>
              <a href="tel:010-2400-4572" className="flex items-center gap-2 hover:text-primary transition-colors no-underline">
                <Phone className="w-4 h-4" /> 010-2400-4572
              </a>
              <div className="flex gap-4 mt-1 print:hidden">
                <a href="https://linkedin.com/in/seogyu-kim-7b5a88195" target="_blank" rel="noreferrer" className="hover:text-[#0077b5] transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="https://github.com/KimSeogyu" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              </div>
              {/* Print-only links text */}
              <div className="hidden print:block text-xs text-muted-foreground mt-1">
                linkedin.com/in/seogyu-kim | github.com/KimSeogyu
              </div>
            </div>
          </div>
        </header>

        <Separator className="print:hidden" />

        {/* Professional Summary */}
        <section className="space-y-6 print:space-y-4 print:break-inside-avoid">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-primary print:text-xl print:mb-2">
            Professional Summary
          </h2>
          <Card className="bg-muted/30 border-none shadow-sm print:shadow-none print:break-inside-avoid">
            <CardContent className="pt-6 relative print:pt-4 print:pb-4">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-md opacity-70 print:w-[2px]" />
              <p className="text-lg leading-relaxed text-muted-foreground italic pl-2 mb-6 print:text-base print:mb-3">
                "새로운 도전을 즐기고 의미 있는 일을 열망하는 개발자 입니다."
              </p>
              <div className="space-y-3 print:space-y-2">
                <SummaryItem 
                  label="Core Engineering" 
                  text="단일 인스턴스 1,500 TPS, 데이터 무결성 99.999%를 보장하는 고성능 분산 스토리지 설계 및 구현." 
                />
                <SummaryItem 
                  label="LLM & RAG" 
                  text="Hybrid RAG 아키텍처로 리스크 검출 신뢰도 95% 달성 (Kiwi + BM25 + FAISS)." 
                />
                <SummaryItem 
                  label="SRE & Stability" 
                  text="금융 입출금 실패율 10% → 0.1% 미만으로 개선하여 운영 효율성 극대화." 
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Technical Skills */}
        <section className="space-y-6 print:space-y-4 print:break-inside-avoid">
          <h2 className="text-2xl font-bold text-primary print:text-xl print:mb-2">Technical Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
            <SkillCard title="Backend & Architecture" skills={["Go", "Python", "TypeScript (NestJS)", "Rust", "gRPC", "Redis Streams", "MongoDB", "Kafka"]} />
            <SkillCard title="Blockchain & Core" skills={["Move", "Merkle Trie", "Stellar", "Ethereum/EVM", "Celestia (DA)", "Bitcoin", "Smart Contracts"]} />
            <SkillCard title="AI & Data Engineering" skills={["RAG Pipeline", "LangChain", "FAISS/VectorDB", "Kiwi (Morphological Analysis)", "LLM Integration", "Data Processing"]} />
            <SkillCard title="Methodology & Infra" skills={["Kubernetes (EKS)", "Ceph/MinIO", "Helm", "Terraform", "Istio", "DDD", "TDD/BDD", "CI/CD"]} />
          </div>
        </section>

        {/* Work Experience */}
        <section className="space-y-10 print:space-y-6">
          <h2 className="text-2xl font-bold text-primary print:text-xl print:mb-4">Work Experience</h2>
          <div className="relative border-l-2 border-muted ml-3 space-y-16 pb-4 print:space-y-8 print:ml-2">
            
            {/* KB Securities */}
            <ExperienceItem 
              company="KB증권 (KB Securities)"
              role="과장 (Manager) | AI 디지털본부 AI Tech팀"
              period="2025.09 - Present"
              location="Seoul, South Korea"
              projects={[
                {
                  title: "AI 위험검토 에이전트 개발",
                  description: "비정형 금융 문서에서 리스크 항목을 자동 검출하는 AI 에이전트 시스템",
                  techStack: ["Python", "LangChain", "FAISS", "Kiwi", "PostgreSQL"],
                  details: [
                    {
                      label: "Paragraph Tree 문서 구조화",
                      content: "Rule-based Parser로 PDF/DOCX 표 구조 복원 및 계층적 메타데이터화. 검색 시 문서 위치 컨텍스트 유지로 정확도 향상."
                    },
                    {
                      label: "Hybrid RAG 파이프라인",
                      content: "Kiwi 기반 BM25 + FAISS EnsembleRetriever. Multi-Query(5개) + RRF 재순위화 + LLM Reasoning Loop 구현."
                    },
                    {
                      label: "시스템 최적화",
                      content: "비동기 스케줄링 및 DB 캐싱으로 LLM 호출 지연 해결 및 실시간 응답 환경 구축."
                    }
                  ],
                  outcome: "리스크 검출 신뢰도 95% 달성 (평가 데이터셋 기준)"
                },
                {
                  title: "AI 평가 에이전트 및 통계 모니터링",
                  techStack: [],
                  details: [
                     { label: "구현", content: "z-score, IQR, CV 기반 모델 성능 지표 산출 및 근거 SQL 쿼리 노출 기능 개발." }
                  ]
                }
              ]}
            />

            {/* 42dot */}
            <ExperienceItem 
              company="42dot (Hyundai Motor Group)"
              role="Backend Engineer | Blockchain Platform Team"
              period="2023.05 - 2025.09"
              location="Seoul, South Korea"
              projects={[
                {
                  title: "오프체인 분산 데이터 시스템 (offchain-db-v3)",
                  description: "블록체인 저장소의 비용/성능 한계를 극복하는 대규모 오프체인 스토리지 솔루션",
                  techStack: ["Go 1.24", "MongoDB 8.0", "Redis Streams", "gRPC", "Kubernetes", "Celestia", "Ceph"],
                  details: [
                    {
                      label: "고성능 스토리지 아키텍처",
                      content: "Celestia/Ceph 연구 기반 Reed-Solomon Erasure Coding 적용으로 데이터 복구 및 저장 효율 최적화."
                    },
                    {
                      label: "Custom Merkle Patricia Trie",
                      content: "go-ethereum 기반 In-memory Trie 구현. 배치 감사 로그의 무결성을 단일 해시로 증명."
                    },
                    {
                      label: "Redis Streams 파이프라인",
                      content: "At-least-once Delivery 및 Dead Letter Queue로 안정적인 비동기 처리 구현."
                    },
                    {
                      label: "API & Testing",
                      content: "gRPC-Gateway 듀얼 프로토콜 지원. Ginkgo + Locust 기반 E2E 및 부하 테스트 자동화."
                    }
                  ],
                  outcome: "단일 인스턴스 1,500 TPS, 데이터 무결성 99.999% 달성. 장애 시 고가용성 확보."
                }
              ]}
            />

            {/* Coinone */}
            <ExperienceItem 
              company="Coinone"
              role="Software Engineer | Wallet Team"
              period="2022.02 - 2023.05"
              location="Seoul, South Korea"
              projects={[
                {
                  title: "금융 입출금 플랫폼 안정화",
                  techStack: ["Node.js", "TypeScript (NestJS)", "PostgreSQL", "Redis"],
                  details: [
                    {
                      label: "다단계 장애 감지",
                      content: "자동 재처리 로직 개선 및 이벤트 기반 상태 추적으로 운영 효율화."
                    },
                    {
                      label: "레거시 현대화",
                      content: "Pure JS → TypeScript (NestJS) 점진적 마이그레이션. AOP/Interceptor 도입으로 로깅 표준화 (커버리지 50% 확보)."
                    },
                    {
                      label: "블록체인 노드 연동",
                      content: "Bitcoin, Ethereum 등 주요 체인 지갑 서비스 개발 및 운영."
                    }
                  ],
                  outcome: "입출금 실패율 10% → 0.1% 미만 개선, 수동 운영 공수 90% 절감."
                }
              ]}
            />

            {/* Axiasoft / Future Company */}
            <ExperienceItem 
              company="Axiasoft → The Future Company"
              role="Backend Developer | Metaverse Platform"
              period="2021.03 - 2022.02"
              location="Seoul, South Korea"
              projects={[
                {
                  title: "글로벌 메타버스 가상 토지 거래 시스템",
                  description: "초기 설계부터 배포까지 MVP 개발 총괄 (스핀오프 창업 참여)",
                  techStack: ["Node.js (NestJS)", "PostgreSQL (PostGIS)", "Turf.js", "Redis"],
                  details: [
                    {
                      label: "공간 데이터 처리",
                      content: "PostGIS + Turf.js 기반 가상 토지 폴리곤 연산 및 R-tree 인덱싱 최적화."
                    },
                    {
                      label: "NestJS 마이크로서비스",
                      content: "모듈러 아키텍처 설계 및 블록체인 연동 독립 서비스 구축."
                    },
                    {
                      label: "결제 & 보안",
                      content: "PayPal/Coocon 연동, JWT + OAuth 2.0 기반 인증 시스템."
                    }
                  ],
                  outcome: "MVP 성공적 출시 및 신규 법인 창업 기여."
                }
              ]}
            />

             {/* Hongik Univ */}
             <ExperienceItem 
              company="Hongik University (Visual Communication Design)"
              role="Backend Developer (Freelance)"
              period="2020.08 - 2021.03"
              location="Seoul, South Korea"
              projects={[
                {
                  title: "학과 공식 웹사이트 (sidi.hongik.ac.kr)",
                  techStack: ["Python", "Django", "AWS"],
                  details: [
                    { label: "기능 구현", content: "작품 아카이브, 전시 안내, 뉴스레터 및 비개발자용 관리자 페이지 개발." },
                    { label: "인프라", content: "AWS EC2, S3, Route53 기반 서버 및 스토리지 구성." }
                  ],
                  outcome: "현재까지 학과 공식 커뮤니케이션 허브로 안정적 운영 중."
                }
              ]}
            />

          </div>
        </section>

        {/* Technical Deep Dive */}
        <section className="space-y-6 print:space-y-4 print:break-inside-avoid">
          <h2 className="text-2xl font-bold text-primary print:text-xl print:mb-2">Technical Deep Dive</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
             <Card className="print:shadow-none">
                <CardHeader className="print:pb-2">
                  <CardTitle className="print:text-lg">고부하 분산 설계</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground print:text-xs">
                  <p>• <strong>Concurrency Control:</strong> Go, Rust 기반 동시성 제어 및 최적화.</p>
                  <p>• <strong>Distributed Lock:</strong> Redis Redlock을 활용한 분산 락 적용.</p>
                  <p>• <strong>Integrity:</strong> 금융/블록체인 시스템 수준의 데이터 정합성 보장 전략 수립.</p>
                </CardContent>
             </Card>
             <Card className="print:shadow-none">
                <CardHeader className="print:pb-2">
                  <CardTitle className="print:text-lg">Cloud-Native Engineering</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground print:text-xs">
                  <p>• <strong>Kubernetes (EKS):</strong> MSA 아키텍처 구축 및 운영 경험.</p>
                  <p>• <strong>IaC & Helm:</strong> Terraform 및 Helm Charts를 통한 인프라/배포 관리.</p>
                  <p>• <strong>Observability:</strong> Istio Service Mesh, Prometheus, Grafana 활용.</p>
                </CardContent>
             </Card>
          </div>
        </section>

      </div>
    </div>
  )
}

// --- Components ---

function SummaryItem({ label, text }: { label: string, text: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start print:gap-2">
      <div className="min-w-32 font-bold text-foreground text-sm mt-0.5 print:min-w-28">{label}</div>
      <div className="text-muted-foreground text-sm md:text-base print:text-sm">{text}</div>
    </div>
  )
}

function SkillCard({ title, skills }: { title: string, skills: string[] }) {
  return (
    <Card className="hover:border-primary/50 transition-colors print:shadow-none print:break-inside-avoid">
      <CardHeader className="pb-3 print:pb-1">
        <CardTitle className="text-lg print:text-base print:font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="print:pt-0">
        <div className="flex flex-wrap gap-2">
          {skills.map(skill => (
            <Badge key={skill} variant="secondary" className="font-normal">
              {skill}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface ProjectDetail {
  label: string
  content: string
}

interface Project {
  title: string
  description?: string
  techStack: string[]
  details: ProjectDetail[]
  outcome?: string
}

interface ExperienceItemProps {
  company: string
  role: string
  period: string
  location: string
  projects: Project[]
}

function ExperienceItem({ company, role, period, location, projects }: ExperienceItemProps) {
  return (
    <div className="relative pl-8 md:pl-10 print:pl-6 print:break-inside-avoid">
      {/* Dot on Timeline */}
      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary print:w-3 print:h-3 print:-left-[6.5px]" />
      
      <div className="space-y-6 mb-16 print:mb-8 print:space-y-4">
        {/* Company Header */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 print:flex-row print:justify-between">
            <h3 className="text-2xl font-bold text-foreground print:text-lg">{company}</h3>
            <span className="text-sm font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded print:bg-transparent print:p-0">
              {period}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground mt-1 print:mt-0">
            <span className="font-semibold text-foreground/90 print:font-bold">{role}</span>
            <span className="hidden sm:inline print:inline">•</span>
            <span>{location}</span>
          </div>
        </div>

        {/* Projects */}
        <div className="space-y-8 print:space-y-4">
          {projects.map((project, idx) => (
            <div key={idx} className="bg-muted/10 p-5 rounded-lg border border-border/50 hover:border-border transition-colors print:bg-transparent print:border-none print:p-0 print:rounded-none">
              <h4 className="text-lg font-bold mb-2 flex items-center gap-2 print:text-base print:mb-1">
                {project.title}
              </h4>
              {project.description && (
                <p className="text-sm text-muted-foreground mb-4 print:mb-2 print:text-xs">{project.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4 print:mb-2">
                {project.techStack.map(stack => (
                  <Badge key={stack} variant="outline" className="text-xs h-5 bg-background print:bg-transparent">
                    {stack}
                  </Badge>
                ))}
              </div>

              <ul className="space-y-3 mb-4 print:space-y-1 print:mb-2">
                {project.details.map((detail, dIdx) => (
                  <li key={dIdx} className="text-sm print:text-xs">
                    <span className="font-semibold text-foreground block md:inline md:mr-2 print:inline print:mr-1">
                      • {detail.label}:
                    </span>
                    <span className="text-muted-foreground">{detail.content}</span>
                  </li>
                ))}
              </ul>

              {project.outcome && (
                <div className="mt-4 pt-3 border-t border-border/40 text-sm print:mt-2 print:pt-2 print:text-xs">
                  <span className="font-bold text-primary mr-2">Core Achievement:</span>
                  <span className="text-foreground/90 font-medium">{project.outcome}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
