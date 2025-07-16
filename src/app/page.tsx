import { Hero } from '@/components/sections/hero'
import { WeddingInfo } from '@/components/sections/wedding-info'
import { RSVP } from '@/components/sections/rsvp'
import { PhotoGallery } from '@/components/sections/photo-gallery'
import { Contact } from '@/components/sections/contact'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <WeddingInfo />
      <RSVP />
      <PhotoGallery />
      <Contact />
    </main>
  )
}
