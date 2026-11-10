import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-condensed text-[120px] leading-none text-accent">404</p>
      <h1 className="font-display text-3xl font-bold">This page does not exist</h1>
      <p className="max-w-[40ch] text-muted">The link may be old or mistyped.</p>
      <Link href="/" className="btn-grad inline-flex min-h-12 items-center rounded-full px-6 font-semibold text-white">
        Back to the portfolio
      </Link>
    </main>
  );
}
