import type { Metadata } from 'next';
import Image from 'next/image';
import { AsciiGradient } from '@/components/ui/ascii-gradient';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  return (
    <main className="relative isolate grid min-h-dvh gap-4 p-3 sm:p-4 lg:grid-cols-[1.15fr_1fr]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="absolute top-[8%] right-[6%] h-[420px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(255,106,26,0.26),transparent)] blur-2xl" />
        <span className="absolute top-[62%] right-[20%] h-[460px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(255,106,26,0.22),transparent)] blur-2xl" />
        <span className="absolute top-[30%] left-[10%] h-[380px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(255,106,26,0.14),transparent)] blur-2xl" />
      </div>

      <section
        className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden rounded-[28px] p-10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] lg:flex xl:p-12"
        style={{ background: 'radial-gradient(90% 70% at 85% 90%, rgba(120,40,10,0.55) 0%, rgba(10,10,10,0) 70%), #0c0c0c' }}
      >
        <AsciiGradient className="absolute inset-0 size-full" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="relative flex items-center gap-3">
          <Image src="/brand/logo-mark.webp" alt="" width={44} height={44} className="size-11 object-contain" />
          <span className="font-display text-xl font-bold">Alfiz Ilham</span>
        </div>
        <div className="relative flex flex-col gap-4">
          <h1 className="max-w-[16ch] font-display text-5xl leading-[1.05] font-bold tracking-[-0.02em]">Your portfolio, one place to run it.</h1>
          <p className="max-w-[34ch] text-sm text-white/70">Publish projects and certificates, approve feedback and answer messages.</p>
          <p className="mt-4 text-sm text-white/60">alfizilham.my.id</p>
        </div>
      </section>

      <section className="glass flex items-center justify-center rounded-[28px] px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex flex-col gap-2">
            <Image src="/brand/logo-mark.webp" alt="" width={40} height={40} className="mb-2 size-10 object-contain lg:hidden" />
            <h2 className="font-display text-3xl font-bold">Sign in</h2>
            <p className="text-sm text-muted">Dashboard access for the site owner.</p>
          </div>
          {expired === '1' && (
            <p role="status" className="mb-6 rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">
              Your session ended. Sign in again to continue.
            </p>
          )}
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
