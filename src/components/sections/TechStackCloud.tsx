import { useState } from 'react'
import { Badge } from '~/components/ui/badge'

interface Skill {
  id: number
  name: string
  icon: string | null
  category: string
  proficiency: number
  displayOrder: number
  createdAt: Date | null
  explanation?: string
}

interface Props {
  skills: Skill[]
}

export function TechStackCloud({ skills }: Props) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const categories = ['AI/ML', 'Backend', 'Frontend', 'Database', 'Cloud', 'Domain', 'Tools']

  return (
    <section id="skills" className="py-20 bg-zinc-900">
      <div className="container max-w-6xl px-4 mx-auto">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          Tech Stack
        </h2>

        <div className="space-y-12">
          {categories.map((category) => {
            const categorySkills = skills.filter((s) => s.category === category)
            if (categorySkills.length === 0) return null

            return (
              <div key={category}>
                <h3 className="text-2xl font-semibold text-zinc-300 mb-6">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorySkills.map((skill) => (
                    <div
                      key={skill.id}
                      onClick={() => setSelectedSkill(skill)}
                      className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-750 transition-colors cursor-pointer hover:scale-105 transform duration-200"
                      title="클릭하여 상세 설명 보기"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{skill.name}</span>
                        <Badge variant="secondary">{skill.proficiency}%</Badge>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-linear-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${skill.proficiency}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSkill(null)}
        >
          <div
            className="bg-zinc-800 rounded-lg p-6 max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {selectedSkill.name}
                </h3>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {selectedSkill.proficiency}%
                  </Badge>
                  <span className="text-zinc-400">{selectedSkill.category}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="text-zinc-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="w-full bg-zinc-700 rounded-full h-3 mb-6">
              <div
                className="bg-linear-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${selectedSkill.proficiency}%` }}
              />
            </div>

            {selectedSkill.explanation && (
              <div className="text-zinc-300 leading-relaxed">
                {selectedSkill.explanation}
              </div>
            )}

            <button
              onClick={() => setSelectedSkill(null)}
              className="mt-6 w-full bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
