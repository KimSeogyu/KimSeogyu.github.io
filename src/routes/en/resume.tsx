import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Github, Linkedin, Mail, Phone, ExternalLink, Globe } from "lucide-react";

export const Route = createFileRoute("/en/resume")({
  head: () => ({
    meta: [
      { title: "SeogyuKim_Resume_Backend" },
      { name: "description", content: "Senior Software Engineer specializing in Distributed Systems and Financial Transaction Reliability" },
    ],
  }),
  component: ResumePageEN,
});

function ResumePageEN() {
  return (
    <div className="min-h-screen bg-background py-16 px-4 md:px-8 print:py-8 print:px-8">
      <div className="max-w-4xl mx-auto space-y-16 print:space-y-8 print:max-w-none print:w-full">
        {/* Header Section */}
        <header className="space-y-4 text-center md:text-left print:text-left print:space-y-2">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 print:text-5xl print:mb-0">
                <span className="gradient-text">Kim Seogyu</span>
              </h1>
              <p className="text-xl text-muted-foreground font-light print:text-lg">
                Senior Software Engineer
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Financial Systems & Data Integrity Specialist
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
                <Link
                  to="/ko/resume"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 mb-2"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  한국어
                </Link>
              </div>

              <a
                href="mailto:asap0208@gmail.com"
                className="flex items-center gap-2 hover:text-primary transition-colors no-underline"
              >
                <Mail className="w-4 h-4" /> asap0208@gmail.com
              </a>
              <a
                href="tel:+82-10-2400-4572"
                className="flex items-center gap-2 hover:text-primary transition-colors no-underline"
              >
                <Phone className="w-4 h-4" /> +82-10-2400-4572
              </a>
              <div className="flex gap-4 mt-1 print:hidden">
                <a
                  href="https://linkedin.com/in/seogyu-kim-7b5a88195"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#0077b5] transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://github.com/KimSeogyu"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
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
              <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-blue-500 to-purple-500 rounded-l-md opacity-70 print:w-[2px]" />
              <p className="text-lg leading-relaxed text-muted-foreground italic pl-2 mb-6 print:text-base print:mb-3">
                "Senior Software Engineer specializing in Distributed Systems and Financial Transaction Reliability. 
                Proven track record of designing high-throughput storage (1,500 TPS) and ensuring 99.999% data integrity. 
                Experienced in bridging Blockchain technology with Enterprise Finance."
              </p>
              <div className="space-y-3 print:space-y-2">
                <SummaryItem
                  label="Core Engineering"
                  text="Designed high-performance distributed storage achieving 1,500 TPS per instance with 99.999% data integrity."
                />
                <SummaryItem
                  label="LLM & RAG"
                  text="Built Hybrid RAG pipeline with 95% risk detection reliability (Kiwi + BM25 + FAISS)."
                />
                <SummaryItem
                  label="Transaction Reliability"
                  text="Reduced financial transaction failure rate from 10% to <0.1% through idempotency design and ledger reconciliation."
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Technical Skills */}
        <section className="space-y-6 print:space-y-4 print:break-inside-avoid">
          <h2 className="text-2xl font-bold text-primary print:text-xl print:mb-2">
            Technical Skills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
            <SkillCard
              title="Languages"
              skills={["Go", "Rust", "Python", "TypeScript (NestJS)", "SQL"]}
            />
            <SkillCard
              title="Backend & Infrastructure"
              skills={[
                "Kubernetes (EKS)",
                "gRPC",
                "Kafka",
                "Redis Streams",
                "MongoDB",
                "PostgreSQL",
                "Terraform",
                "Helm",
              ]}
            />
            <SkillCard
              title="Blockchain & Core"
              skills={[
                "Ethereum (EVM)",
                "Solidity",
                "Merkle Trie",
                "Celestia (DA)",
                "Smart Contracts",
              ]}
            />
            <SkillCard
              title="AI & Data"
              skills={[
                "RAG Pipeline",
                "LangChain",
                "FAISS (VectorDB)",
                "LLM Integration",
              ]}
            />
          </div>
        </section>

        {/* Work Experience */}
        <section className="space-y-10 print:space-y-6">
          <h2 className="text-2xl font-bold text-primary print:text-xl print:mb-4">
            Work Experience
          </h2>
          <div className="relative border-l-2 border-muted ml-3 space-y-16 pb-4 print:space-y-8 print:ml-2">
            {/* KB Securities */}
            <ExperienceItem
              company="KB Securities"
              role="Manager | AI Tech Team"
              period="Sep 2025 – Present"
              location="Seoul, South Korea"
              projects={[
                {
                  title: "AI Risk Review Agent",
                  description:
                    "Automated risk detection system for unstructured financial documents",
                  techStack: [
                    "Python",
                    "LangChain",
                    "FAISS",
                    "Kiwi",
                    "PostgreSQL",
                  ],
                  details: [
                    {
                      label: "Engineered Hybrid RAG pipeline",
                      content:
                        "combining keyword search (Kiwi/BM25) and semantic search (FAISS) with RRF reranking.",
                    },
                    {
                      label: "Built Paragraph Tree structure",
                      content:
                        "using rule-based parser to restore PDF/DOCX hierarchy, enhancing context retention.",
                    },
                    {
                      label: "Optimized system latency",
                      content:
                        "by implementing async scheduling and DB caching, resolving LLM timeouts.",
                    },
                  ],
                  outcome:
                    "Achieved 95% risk detection reliability in production, verified against actual audit reports.",
                },
              ]}
            />

            {/* 42dot */}
            <ExperienceItem
              company="42dot (Hyundai Motor Group)"
              role="Backend Engineer | Blockchain Platform Team"
              period="May 2023 – Sep 2025"
              location="Seoul, South Korea"
              projects={[
                {
                  title: "Off-chain Distributed Storage (offchain-db-v3)",
                  description:
                    "Large-scale off-chain storage solution overcoming blockchain cost/performance limitations",
                  techStack: [
                    "Go",
                    "MongoDB",
                    "Redis Streams",
                    "gRPC",
                    "Kubernetes",
                  ],
                  details: [
                    {
                      label: "Designed high-performance storage architecture",
                      content:
                        "using Reed-Solomon Erasure Coding (based on Celestia/Ceph research).",
                    },
                    {
                      label: "Implemented custom in-memory Merkle Patricia Trie",
                      content:
                        "(based on Go-Ethereum) to verify batch audit log integrity with single root hash.",
                    },
                    {
                      label: "Built robust event pipeline",
                      content:
                        "using Redis Streams with At-least-once Delivery and Dead Letter Queues.",
                    },
                  ],
                  outcome:
                    "Achieved 1,500 TPS per instance and 99.999% data integrity with high availability.",
                },
                {
                  title: "Enterprise Blockchain Indexer SDK",
                  description:
                    "Rust SDK for high-speed blockchain indexing via ETL pipeline",
                  techStack: ["Rust", "gRPC", "PostgreSQL", "Diesel", "Tokio"],
                  details: [
                    {
                      label: "Architected generic ETL engine",
                      content:
                        "in Rust (gRPC streaming extraction, BCS decoding, chunk-based loading).",
                    },
                    {
                      label: "Implemented History/Snapshot dual-table strategy",
                      content:
                        "supporting both O(1) real-time state lookups and historical auditing.",
                    },
                    {
                      label: "Abstracted complex chain logic",
                      content:
                        "into Rust Traits, reducing boilerplate code by 90% for internal developers.",
                    },
                  ],
                },
              ]}
            />

            {/* Coinone */}
            <ExperienceItem
              company="Coinone"
              role="Software Engineer | Wallet Team"
              period="Feb 2022 – May 2023"
              location="Seoul, South Korea"
              projects={[
                {
                  title: "Financial Transaction Reliability",
                  techStack: [
                    "Node.js",
                    "TypeScript (NestJS)",
                    "PostgreSQL",
                    "Redis",
                  ],
                  details: [
                    {
                      label: "Designed Idempotency keys",
                      content:
                        "and stabilized retry logic to prevent duplicate transactions.",
                    },
                    {
                      label: "Automated Ledger Reconciliation pipelines",
                      content:
                        "to verify data consistency between on-chain and internal databases.",
                    },
                    {
                      label: "Managed node infrastructure",
                      content:
                        "for 10+ blockchains (Bitcoin, Ethereum, etc.) and developed wallet services.",
                    },
                  ],
                  outcome:
                    "Reduced deposit/withdrawal failure rate from 10% to <0.1% and cut manual operations by 90%.",
                },
                {
                  title: "Staking Service 'Plus 2.0' Architecture Review",
                  techStack: ["Node.js", "TypeScript (NestJS)", "PostgreSQL"],
                  details: [
                    {
                      label: "Conducted emergency architectural review",
                      content:
                        "pre-launch, redesigning core modules to resolve critical bottlenecks.",
                    },
                  ],
                  outcome:
                    "Achieved zero downtime and zero critical incidents during launch period.",
                },
              ]}
            />

            {/* Axiasoft / Future Company */}
            <ExperienceItem
              company="Axiasoft → The Future Company"
              role="Backend Developer | Metaverse Platform"
              period="Mar 2021 – Feb 2022"
              location="Seoul, South Korea"
              projects={[
                {
                  title: "Metaverse Virtual Land Trading System",
                  description:
                    "Led MVP development from architecture to deployment for global virtual real estate platform",
                  techStack: [
                    "Node.js (NestJS)",
                    "PostgreSQL (PostGIS)",
                    "Turf.js",
                    "Redis",
                  ],
                  details: [
                    {
                      label: "Optimized spatial data processing",
                      content:
                        "using PostGIS and Turf.js for R-tree indexing and polygon operations.",
                    },
                    {
                      label: "Implemented secure payment systems",
                      content:
                        "integrating PayPal/Coocon and OAuth 2.0 based authentication.",
                    },
                  ],
                  outcome:
                    "Successfully launched MVP, contributing to spinoff and new corporate entity establishment.",
                },
              ]}
            />

            {/* Hongik Univ */}
            <ExperienceItem
              company="Hongik University (Visual Communication Design)"
              role="Backend Developer (Freelance)"
              period="Aug 2020 – Mar 2021"
              location="Seoul, South Korea"
              projects={[
                {
                  title: "Official Department Website (sidi.hongik.ac.kr)",
                  techStack: ["Python", "Django", "AWS"],
                  details: [
                    {
                      label: "Developed CMS",
                      content:
                        "using Python (Django) and AWS (EC2, S3) for archiving portfolios and managing exhibitions.",
                    },
                  ],
                  link: "https://sidi.hongik.ac.kr",
                },
              ]}
            />
          </div>
        </section>

        {/* Education */}
        <section className="space-y-6 print:space-y-4 print:break-inside-avoid">
          <h2 className="text-2xl font-bold text-primary print:text-xl print:mb-2">
            Education
          </h2>
          <div className="space-y-2">
            <Card className="print:shadow-none">
              <CardContent className="py-4 print:py-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold">42 Seoul</h3>
                    <p className="text-muted-foreground text-sm">
                      Software Engineering (Peer-to-Peer Learning Program)
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground bg-muted/60 px-2 py-0.5 rounded whitespace-nowrap print:bg-transparent print:p-0">
                    Jan 2020 – Jan 2021
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="print:shadow-none">
              <CardContent className="py-4 print:py-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold">Kyonggi University</h3>
                    <p className="text-muted-foreground text-sm">
                      B.A. in Korean Language & Literature / Business Administration (Double Major)
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground bg-muted/60 px-2 py-0.5 rounded whitespace-nowrap print:bg-transparent print:p-0">
                    Mar 2013 – Feb 2020
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

// --- Components ---

function SummaryItem({
  label,
  text,
}: {
  label: string;
  text: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 items-start print:gap-2">
      <div className="min-w-32 font-bold text-foreground text-sm mt-0.5 print:min-w-28">
        {label}
      </div>
      <div className="text-muted-foreground text-sm md:text-base print:text-sm">
        {text}
      </div>
    </div>
  );
}

function SkillCard({ title, skills }: { title: string; skills: string[] }) {
  return (
    <Card className="hover:border-primary/50 transition-colors print:shadow-none print:break-inside-avoid">
      <CardHeader className="pb-3 print:pb-1">
        <CardTitle className="text-lg print:text-base print:font-bold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="print:pt-0">
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="font-normal">
              {skill}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProjectDetail {
  label: string;
  content: string;
}

interface Project {
  title: string;
  link?: string;
  description?: string;
  techStack: string[];
  details: ProjectDetail[];
  outcome?: string;
}

interface ExperienceItemProps {
  company: string;
  role: string;
  period: string;
  location: string;
  projects: Project[];
}

function ExperienceItem({
  company,
  role,
  period,
  location,
  projects,
}: ExperienceItemProps) {
  return (
    <div className="relative pl-8 md:pl-10 print:pl-6 print:break-inside-avoid">
      {/* Dot on Timeline */}
      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary print:w-3 print:h-3 print:-left-[6.5px]" />

      <div className="space-y-6 mb-16 print:mb-8 print:space-y-4">
        {/* Company Header */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 print:flex-row print:justify-between">
            <h3 className="text-2xl font-bold text-foreground print:text-lg">
              {company}
            </h3>
            <span className="text-sm font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded print:bg-transparent print:p-0">
              {period}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground mt-1 print:mt-0">
            <span className="font-semibold text-foreground/90 print:font-bold">
              {role}
            </span>
            <span className="hidden sm:inline print:inline">•</span>
            <span>{location}</span>
          </div>
        </div>

        {/* Projects */}
        <div className="space-y-8 print:space-y-4">
          {projects.map((project, idx) => (
            <div
              key={idx}
              className="bg-muted/10 p-5 rounded-lg border border-border/50 hover:border-border transition-colors print:bg-transparent print:border-none print:p-0 print:rounded-none"
            >
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-bold flex items-center gap-2 print:text-base print:mb-1">
                  {project.title}
                </h4>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={`Visit ${project.title} project`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground mb-4 print:mb-2 print:text-xs">
                  {project.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-4 print:mb-2">
                {project.techStack.map((stack) => (
                  <Badge
                    key={stack}
                    variant="outline"
                    className="text-xs h-5 bg-background print:bg-transparent"
                  >
                    {stack}
                  </Badge>
                ))}
              </div>

              <ul className="space-y-3 mb-4 print:space-y-1 print:mb-2">
                {project.details.map((detail, dIdx) => (
                  <li key={dIdx} className="text-sm print:text-xs">
                    <span className="font-semibold text-foreground block md:inline md:mr-2 print:inline print:mr-1">
                      • {detail.label}
                    </span>
                    <span className="text-muted-foreground">
                      {detail.content}
                    </span>
                  </li>
                ))}
              </ul>

              {project.outcome && (
                <div className="mt-4 pt-3 border-t border-border/40 text-sm print:mt-2 print:pt-2 print:text-xs">
                  <span className="font-bold text-primary mr-2">
                    Impact:
                  </span>
                  <span className="text-foreground/90 font-medium">
                    {project.outcome}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
