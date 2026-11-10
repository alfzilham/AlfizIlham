import { Bot, Layers } from 'lucide-react';
import { STACK } from '@/lib/content';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';
import { Glow, Heading, Section, ToolTile } from './primitives';

type Tool = { key: string; label: string };
const group = (title: string) => STACK.find((g) => g.title === title)!;
const FILL = 'grid-cols-[repeat(auto-fill,minmax(84px,1fr))]';

/** Fullstack Developer node. Wide: sits in the diagram with connector lines. Compact: stands alone above the groups. */
function Hub({ wide }: { wide?: boolean }) {
  return (
    <div className={cn('relative flex flex-col items-center text-center', wide ? 'col-span-2' : 'gap-3')}>
      {wide && <span aria-hidden="true" className="-mt-10 min-h-0 w-px flex-1 bg-fg/35" />}
      <div className="glass relative flex size-32 items-center justify-center rounded-[32px]">
        <Layers className="size-[72px]" strokeWidth={1.5} aria-hidden="true" />
        <span className="glass-tint absolute -right-2.5 -bottom-2.5 flex size-11 items-center justify-center rounded-full">
          <Bot className="size-[22px]" aria-hidden="true" />
        </span>
      </div>
      <div className={cn('flex flex-col gap-2', wide && 'py-3')}>
        <p className="font-display text-xl leading-tight font-bold">Fullstack Developer</p>
        <p className="text-sm text-muted">(AI-Integrated Apps)</p>
      </div>
      {wide && <span aria-hidden="true" className="-mb-10 min-h-0 w-px flex-1 bg-fg/35" />}
    </div>
  );
}

function Box({
  title,
  tint,
  span,
  cols = 'grid-cols-2',
  down,
  right,
}: {
  title: string;
  tint?: boolean;
  span?: string;
  cols?: string;
  /** vertical connector toward the row below */
  down?: boolean;
  /** horizontal connector toward the box on the right */
  right?: boolean;
}) {
  const tools: Tool[] = group(title).tools;
  return (
    <section className={cn('relative rounded-2xl px-[18px] pt-[34px] pb-[22px]', tint ? 'glass-tint' : 'glass', span)}>
      <h3
        className={cn(
          'absolute -top-[15px] left-4 rounded-full border px-3.5 py-[5px] text-[13px] leading-tight font-semibold whitespace-nowrap',
          tint ? 'border-accent/35 bg-bg text-accent' : 'border-fg/35 bg-bg text-fg',
        )}
      >
        {title}
      </h3>
      <ul className={cn('grid gap-x-2 gap-y-[18px]', cols)}>
        {tools.map((t) => (
          <li key={t.key}>
            <ToolTile icon={t.key} label={t.label} size={44} />
          </li>
        ))}
      </ul>
      {down && <span aria-hidden="true" className="absolute top-full left-[70%] h-10 w-px bg-fg/35" />}
      {right && <span aria-hidden="true" className="absolute top-1/2 left-full h-px w-5 bg-fg/35" />}
    </section>
  );
}

const COMPACT_ORDER = [
  'Web Application Stack',
  'Mobile Application Stack',
  'AI and Automation',
  'Data and ML',
  'Backend',
  'Database',
  'Deploy and DevOps',
  'Design',
  'Workflow',
];

const FILL_TITLES = ['Web Application Stack', 'Mobile Application Stack', 'Data and ML'];

export function Stack() {
  return (
    <Section id="skills" label="Skills">
      <Glow spots={[['10%', '30%', 520], ['50%', '55%', 520], ['90%', '28%', 520], ['28%', '88%', 480], ['82%', '84%', 480]]} />
      <Heading title="The stack I ship with" lead="Everything I build with, grouped the way a product is wired together." />

      <Reveal className="mt-12">
        {/* Wide: connected diagram, 10 columns */}
        <div className="hidden grid-cols-10 gap-x-5 gap-y-10 pt-2 min-[1100px]:grid">
          <Box title="Database" span="col-span-2" down />
          <Box title="Backend" span="col-span-2" down />
          <Box title="Deploy and DevOps" span="col-span-2" />
          <Box title="Design" span="col-span-2" down />
          <Box title="Workflow" span="col-span-2" down />

          <Box title="AI and Automation" tint span="col-span-4" cols="grid-cols-5" down />
          <Hub wide />
          <Box title="Data and ML" span="col-span-4" cols={FILL} down />

          <Box title="Web Application Stack" span="col-span-6" cols={FILL} right />
          <Box title="Mobile Application Stack" span="col-span-4" cols={FILL} />
        </div>

        {/* Compact: hub on top, then groups in an auto-fit grid */}
        <div className="flex flex-col gap-9 pt-2 min-[1100px]:hidden">
          <Hub />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-x-5 gap-y-9">
            {COMPACT_ORDER.map((title) => {
              const cols = title === 'AI and Automation' ? 'grid-cols-5' : FILL_TITLES.includes(title) ? FILL : 'grid-cols-2';
              return <Box key={title} title={title} tint={group(title).tint} cols={cols} />;
            })}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
