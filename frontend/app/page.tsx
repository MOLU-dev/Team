import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import ChainSupport from '@/components/ChainSupport'
import Articles from '@/components/Articles'
import Footer from '@/components/Footer'
import FinalCTA from '@/components/FinalCTA'
import Background from '@/components/shared/Background'

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <Background type="landing" />
      <div className="relative z-10">
        <Header />
        <Hero />
        <Features />
        <ChainSupport />
        <Articles />
        <FinalCTA />
        <Footer />
      </div>
    </main>
  )
}
