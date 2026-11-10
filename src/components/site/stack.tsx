import { Bot, Layers } from 'lucide-react';
import { STACK } from '@/lib/content';
import { RevealGroup, RevealItem } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';
import { Glow, Heading, Section, ToolTile } from './primitives';

export function Stack() {
  const wide = STACK.filter((g) => g.wide);
  const rest = STACK.filter((g) => !g.wide);
  return (
    <Section id="skills" label="Skills">
      <Glow spots={[['10%', '30%', 520], ['85%', '70%', 520]]} />
      <Heading title="The stack I ship with" lead="Everything I build with, grouped the way a product is wired together." />

      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <div className="glass relative flex size-28 items-center justify-center rounded-[28px]">
          <Layers className="size-14" strokeWidth={1.5} aria-hidden="true" />
          <span className="glass-tint absolute -right-2.5 -bottom-2.5 flex size-11 items-center justify-center rounded-full">
            <Bot className="size-5" aria-hidden="true" />
          </span>
        </div>
        <p className="font-display text-lg font-bold">Fullstack Developer</p>
        <p className="-mt-2 text-[13px] text-muted">(AI-Integrated Apps)</p>
      </div>

      <RevealGroup className="mt-10 grid gap-5 lg:grid-cols-2">
        {wide.map((g) => (
          <RevealItem key={g.title}>
            <Group title={g.title} tint={g.tint} tools={g.tools} cols="grid-cols-4 sm:grid-cols-6 lg:grid-cols-5" />
          </RevealItem>
        ))}
      </RevealGroup>
      <RevealGroup className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {rest.map((g) => (
          <RevealItem key={g.title}>
            <Group title={g.title} tools={g.tools} cols="grid-cols-3" />
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}

function Group({ title, tools, tint, cols }: { title: string; tools: { key: string; label: string }[]; tint?: boolean; cols: string }) {
  return (
    <section className={cn('relative h-full rounded-[20px] px-4 pt-8 pb-5', tint ? 'glass-tint' : 'glass')}>
      <h3
        className={cn(
          'absolute -top-3 left-4 rounded-full px-3 py-1 text-xs font-semibold',
          tint ? 'bg-accent/20 text-accent-soft shadow-[inset_0_0_0_1px_rgba(255,106,26,0.5)]' : 'bg-bg text-fg shadow-[inset_0_0_0_1px_#262626]',
        )}
      >
        {title}
      </h3>
      <ul className={cn('grid gap-x-2 gap-y-4', cols)}>
        {tools.map((t) => (
          <li key={t.key}>
            <ToolTile icon={t.key} label={t.label} size={44} />
          </li>
        ))}
      </ul>
    </section>
  );
}
