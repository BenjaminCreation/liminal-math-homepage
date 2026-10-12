import { Responsive } from '@/components/Responsive'
import { Root as HomeDesktop } from '@/dc/generated/HomeDesktop'
import { Root as HomeMobile } from '@/dc/generated/HomeMobile'

export const metadata = { title: 'Liminal Math — Home' }

export default function Page() {
  return <Responsive desktop={<HomeDesktop/>} mobile={<HomeMobile/>} />
}
