import { personalInfo } from '~/data/config'

export function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 relative overflow-hidden">
      {/* 배경 그라데이션 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />

      <div className="container max-w-4xl px-4 text-center relative z-10">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 animate-fade-in">
          {personalInfo.name}
        </h1>
        <p className="text-2xl md:text-3xl text-zinc-300 mb-6 animate-fade-in-delay-1">
          {personalInfo.title}
        </p>
        <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto animate-fade-in-delay-2">
          {personalInfo.tagline}
        </p>
        <a
          href={personalInfo.cta.link}
          className="inline-block px-8 py-4 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-100 transition-colors animate-fade-in-delay-3 shadow-lg hover:shadow-xl"
        >
          {personalInfo.cta.text}
        </a>
      </div>
    </section>
  )
}
