import { Responsive } from '@/components/Responsive'
import { Root as ChapterZeroDesktop } from '@/dc/generated/ChapterZeroDesktop'
import { Root as ChapterZeroMobile } from '@/dc/generated/ChapterZeroMobile'

export const metadata = { title: 'Chapter Zero — Liminal Math' }

export default function Page() {
  return <Responsive desktop={<ChapterZeroDesktop/>} mobile={<ChapterZeroMobile/>} />
}
