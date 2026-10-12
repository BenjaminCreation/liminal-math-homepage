import { ClientOnly } from '@/components/ClientOnly'
import { Root as Careers } from '@/dc/generated/Careers'

export const metadata = { title: 'Careers in mathematics — Liminal Math' }

export default function Page() {
  return (
    <ClientOnly>
      <Careers />
    </ClientOnly>
  )
}
