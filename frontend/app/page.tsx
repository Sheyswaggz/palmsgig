import {
  Header,
  Hero,
  Stats,
  Features,
  HowItWorks,
  Categories,
  Testimonials,
  CTA,
  Footer,
} from '@/components/landing';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Categories />
        <Testimonials />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
