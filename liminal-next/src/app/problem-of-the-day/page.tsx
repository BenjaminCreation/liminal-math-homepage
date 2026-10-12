import { ClientOnly } from '@/components/ClientOnly'
import { Root as ProblemOfTheDay } from '@/dc/generated/ProblemOfTheDay'

export const metadata = { title: 'Problem of the Day — Liminal Math' }

export default function Page() {
  return (
    <ClientOnly>
      <ProblemOfTheDay />
    </ClientOnly>
  )
}
