import { personalInfo } from '~/data/config'

export function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-zinc-900">
      <div className="container max-w-4xl px-4 mx-auto">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          Contact
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* 소셜 링크 */}
          <div>
            <h3 className="text-2xl font-semibold text-white mb-6">
              Get in Touch
            </h3>
            <div className="space-y-4 text-zinc-300">
              <a
                href={`mailto:${personalInfo.social.email}`}
                className="flex items-center gap-3 hover:text-white transition-colors"
              >
                <span className="text-2xl">📧</span>
                <span>{personalInfo.social.email}</span>
              </a>
              <a
                href={personalInfo.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-white transition-colors"
              >
                <span className="text-2xl">💼</span>
                <span>LinkedIn</span>
              </a>
              <a
                href={personalInfo.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-white transition-colors"
              >
                <span className="text-2xl">🐙</span>
                <span>GitHub</span>
              </a>
            </div>
          </div>

          {/* 문의 폼 (임시 비활성화) */}
          <div>
            <p className="text-zinc-400 mb-4">
              문의 폼은 곧 활성화될 예정입니다.
            </p>
            <p className="text-zinc-500 text-sm">
              현재는 이메일을 통해 직접 연락 부탁드립니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
