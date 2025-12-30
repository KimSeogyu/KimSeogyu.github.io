import { z } from 'zod'

// 연락처 폼 검증 스키마
export const contactFormSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  message: z.string().min(10, '메시지는 최소 10자 이상이어야 합니다'),
})

export type ContactFormData = z.infer<typeof contactFormSchema>
