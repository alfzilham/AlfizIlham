import type { Metadata } from 'next';
import Image from 'next/image';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <main className="relative isolate grid min-h-dvh lg:grid-cols-[1.15fr_1fr]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="absolute top-[30%] left-[14%] h-[380px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(255,106,26,0.3),transparent)] blur-2xl" />
        <span className="absolute top-[70%] left-[60%] h-[400px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(255,106,26,0.24),transparent)] blur-2xl" />
      </div>

      <section className="hidden flex-col justify-between p-14 lg:flex">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo-mark.webp" alt="" width={44} height={44} className="size-11 object-contain" />
          <span className="font-display text-xl font-bold">Alfiz Ilham</span>
        </div>
        <div className="flex max-w-[30ch] flex-col gap-4">
          <h1 className="font-display text-5xl leading-[1.05] font-bold tracking-[-0.02em]">Your portfolio, one place to run it.</h1>
          <p className="text-muted">Publish projects and certificates, approve feedback and answer messages.</p>
        </div>
        <p className="text-sm text-muted">alfizilham.my.id</p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="glass w-full max-w-[440px] rounded-[28px] p-7 sm:p-9">
          <div className="mb-8 flex flex-col gap-2">
            <Image src="/brand/logo-mark.webp" alt="" width={40} height={40} className="mb-2 size-10 object-contain lg:hidden" />
            <h2 className="font-display text-3xl font-bold">Sign in</h2>
            <p className="text-sm text-muted">Dashboard access for the site owner.</p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
