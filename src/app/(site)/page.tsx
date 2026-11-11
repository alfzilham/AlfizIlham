import { db } from '@/lib/db';
import { Nav } from '@/components/site/nav';
import { Hero } from '@/components/site/hero';
import { About } from '@/components/site/about';
import { Stats } from '@/components/site/stats';
import { Education } from '@/components/site/education';
import { Stack } from '@/components/site/stack';
import { Projects, type PublicProject } from '@/components/site/projects';
import { Marquee } from '@/components/site/marquee';
import { Services } from '@/components/site/services';
import { Certificates, type PublicCertificate } from '@/components/site/certificates';
import { Testimonials, type PublicTestimonial } from '@/components/site/testimonials';
import { Faq } from '@/components/site/faq';
import { Contact } from '@/components/site/contact';
import { Footer } from '@/components/site/footer';

// Rebuilt at most once a minute, and right away when the dashboard publishes something.
export const revalidate = 60;

async function loadContent() {
  try {
    const [projects, certificates, testimonials] = await Promise.all([
      db.project.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: { id: true, title: true, description: true, techStack: true, liveUrl: true, githubUrl: true, imageUrl: true },
      }),
      db.certificate.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, issuer: true, fileUrl: true, fileType: true, category: { select: { name: true } } },
      }),
      db.testimonial.findMany({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 24,
        select: { id: true, name: true, role: true, company: true, message: true, rating: true, avatarUrl: true },
      }),
    ]);
    return {
      projects: projects as PublicProject[],
      certificates: certificates.map((c) => ({ ...c, category: c.category.name })) as PublicCertificate[],
      testimonials: testimonials as PublicTestimonial[],
    };
  } catch (err) {
    console.error('Could not load portfolio content', err);
    return { projects: [], certificates: [], testimonials: [] };
  }
}

export default async function HomePage() {
  const { projects, certificates, testimonials } = await loadContent();
  return (
    <>
      <Nav />
      <main id="main" className="overflow-x-clip">
        <Hero />
        <About />
        <Stats />
        <Education />
        <Stack />
        <Projects projects={projects} />
        <Marquee />
        <Services />
        {certificates.length > 0 && <Certificates certificates={certificates} />}
        {testimonials.length > 0 && <Testimonials testimonials={testimonials} />}
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
