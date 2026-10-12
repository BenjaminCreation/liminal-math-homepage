import { ClientOnly } from '@/components/ClientOnly'
import { Root as Community } from '@/dc/generated/Community'

export const metadata = { title: 'Community — Liminal Math' }

export default function Page() {
  return (
    <ClientOnly>
      <Community />
    </ClientOnly>
  )
}
