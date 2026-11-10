// Static portfolio copy, written from the CV and Resume.

export const PROFILE = {
  name: 'Alfiz Ilham',
  role: 'Fullstack Developer',
  tagline: 'AI-Integrated Applications',
  email: 'alfizilham@gmail.com',
  phone: '+62 852-1389-6460',
  phoneHref: 'tel:+6285213896460',
  whatsappHref: 'https://wa.me/6285213896460',
  location: 'Aceh Besar, Aceh, Indonesia',
  github: 'https://github.com/alfzilham',
  githubLabel: 'github.com/alfzilham',
  linkedin: 'https://www.linkedin.com/in/alfiz-ilham093a2',
  site: 'https://alfizilham.my.id',
  cv: '/files/Alfiz_Ilham_CV.pdf',
  resume: '/files/Alfiz_Ilham_Resume.pdf',
};

export const NAV = [
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Services', href: '#services' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

export const HERO_STATS = [
  { value: '10+', label: 'Live apps shipped' },
  { value: '500+', label: 'Calligraphy commissions' },
  { value: '20+', label: 'Tour designs delivered' },
];

export const BIG_STATS = [
  { value: 10, label: 'Live web and mobile apps shipped' },
  { value: 500, label: 'Calligraphy commissions completed' },
  { value: 20, label: 'Tour package designs delivered' },
  { value: 10, label: 'Calligraphy competitions won' },
];

export const ACTIVITIES = [
  {
    icon: 'users',
    title: 'OSMID, Events and Design Division',
    body: 'Member, 2025 to 2026. Planned school-wide events and designed posters, banners and hand-lettered Arabic vocabulary boards.',
  },
  { icon: 'tent', title: 'KPMN 2024', body: 'Aceh Provincial Representative at the national scout camp in Cibubur, Jakarta.' },
  { icon: 'heart', title: 'Pidie Jaya flood relief', body: 'Community volunteer assisting flood victims, 2026.' },
] as const;

export const EDUCATION = [
  { n: '01', year: 'Graduated 2023', title: 'MTsS Darul Ihsan', place: 'Aceh Besar, Aceh', desc: 'Junior High School Diploma.' },
  { n: '02', year: '2023 - 2024', title: 'SMK Darul Ihsan', place: 'Aceh Besar, Aceh', desc: 'Computer and Network Engineering, 1 year, then transferred.' },
  { n: '03', year: 'Jul 2024 - May 2026', title: 'MAS Jeumala Amal', place: 'Pidie Jaya, Aceh', desc: 'High School Diploma, Science (IPA).' },
  {
    n: '04',
    year: '2026 - Present',
    title: 'Universitas Syiah Kuala',
    place: 'Aceh, Indonesia',
    desc: 'Bachelor of Engineering, Computer Engineering (Teknik Komputer).',
    current: true,
  },
];

export type Tool = { key: string; label: string };
const t = (key: string, label: string): Tool => ({ key, label });

export const STACK: { title: string; tint?: boolean; wide?: boolean; tools: Tool[] }[] = [
  {
    title: 'Web Application Stack',
    wide: true,
    tools: [
      t('html5', 'HTML5'), t('css3', 'CSS3'), t('javascript', 'JavaScript'), t('typescript', 'TypeScript'), t('react', 'React'), t('nextjs', 'Next.js'),
      t('tailwindcss', 'Tailwind CSS'), t('bootstrap', 'Bootstrap'), t('sass', 'Sass'), t('redux', 'Redux'), t('vite', 'Vite'), t('jquery', 'jQuery'),
    ],
  },
  {
    title: 'AI and Automation',
    tint: true,
    wide: true,
    tools: [
      t('claude', 'Claude Code'), t('openrouter', 'OpenRouter'), t('mcp', 'MCP'), t('n8n', 'n8n'), t('codex', 'Codex'),
      t('opencode', 'OpenCode'), t('trae', 'Trae'), t('antigravity', 'Antigravity'), t('google-ai-studio', 'Google AI Studio'), t('fastapi', 'FastAPI'),
    ],
  },
  { title: 'Database', tools: [t('postgresql', 'PostgreSQL'), t('neon', 'Neon'), t('mysql', 'MySQL'), t('mongodb', 'MongoDB'), t('sql', 'SQL'), t('supabase', 'Supabase')] },
  { title: 'Backend', tools: [t('nodejs', 'Node.js'), t('express', 'Express.js'), t('php', 'PHP'), t('python', 'Python'), t('rest-api', 'REST API'), t('prisma', 'Prisma')] },
  { title: 'Deploy and DevOps', tools: [t('git', 'Git'), t('github', 'GitHub'), t('docker', 'Docker'), t('vercel', 'Vercel'), t('railway', 'Railway'), t('ubuntu', 'Ubuntu WSL')] },
  { title: 'Design', tools: [t('photoshop', 'Photoshop'), t('lightroom', 'Lightroom'), t('coreldraw', 'CorelDRAW'), t('canva', 'Canva'), t('framer', 'Framer'), t('callipro', 'CalliPro')] },
  { title: 'Data and ML', tools: [t('numpy', 'NumPy'), t('pandas', 'pandas'), t('tensorflow', 'TensorFlow'), t('nvidia', 'NVIDIA NIM Build')] },
  { title: 'Mobile Application Stack', tools: [t('flutter', 'Flutter'), t('dart', 'Dart'), t('android-studio', 'Android Studio')] },
  { title: 'Workflow', tools: [t('obsidian', 'Obsidian'), t('google-colab', 'Google Colab'), t('scratch', 'Scratch')] },
];

export const SERVICES = [
  {
    name: 'Fullstack web apps',
    body: 'Products built end to end, from database schema to deploy on Vercel, with admin workflows and receipt or file handling where needed.',
    tools: [
      t('typescript', 'TypeScript'), t('react', 'React'), t('nextjs', 'Next.js'), t('tailwindcss', 'Tailwind CSS'), t('nodejs', 'Node.js'), t('express', 'Express.js'),
      t('php', 'PHP'), t('prisma', 'Prisma'), t('postgresql', 'PostgreSQL'), t('neon', 'Neon'), t('supabase', 'Supabase'), t('vercel', 'Vercel'),
    ],
    shippedLabel: 'Shipped',
    shipped: 'PusakaPosters, PusakaEvents, GradIn',
  },
  {
    name: 'Mobile apps',
    body: 'Android apps with offline storage, realtime sync and Google sign-in, published to Google Play.',
    tools: [t('flutter', 'Flutter'), t('dart', 'Dart'), t('android-studio', 'Android Studio'), t('nextjs', 'Next.js'), t('supabase', 'Supabase'), t('postgresql', 'PostgreSQL'), t('git', 'Git')],
    shippedLabel: 'Shipped',
    shipped: 'DoMark Mobile, Mencucy',
  },
  {
    name: 'AI integration and automation',
    body: 'Language and vision models wired into your product or messaging, plus n8n flows that filter, route and summarize.',
    tools: [
      t('claude', 'Claude API'), t('openrouter', 'OpenRouter'), t('n8n', 'n8n'), t('mcp', 'MCP'), t('google-ai-studio', 'Google AI Studio'),
      t('python', 'Python'), t('fastapi', 'FastAPI'), t('tensorflow', 'TensorFlow'), t('pandas', 'pandas'), t('numpy', 'NumPy'),
    ],
    shippedLabel: 'Shipped',
    shipped: 'AI WhatsApp Automation, BacteriaCV',
  },
  {
    name: 'Graphic design',
    body: 'Posters and promotional designs, with 20+ delivered for Umrah and international tour packages.',
    tools: [t('photoshop', 'Photoshop'), t('lightroom', 'Lightroom'), t('coreldraw', 'CorelDRAW'), t('canva', 'Canva'), t('framer', 'Framer')],
    shippedLabel: 'Delivered',
    shipped: '20+ posters for tour packages',
  },
  {
    name: 'Arabic calligraphy',
    body: 'Custom commissions in Naskh script and Mushaf illumination, with 500+ completed.',
    tools: [t('callipro', 'CalliPro')],
    shippedLabel: 'Completed',
    shipped: '500+ commissions',
  },
];

export const SERVICE_OPTIONS = [...SERVICES.map((s) => s.name), 'Other'];

export const FAQ_TABS = ['All questions', 'Services', 'Process', 'Pricing', 'Working together'];

export const FAQS: { tab: number; q: string; a: string }[] = [
  { tab: 1, q: 'What kinds of projects do you take on?', a: 'Fullstack web apps, Flutter mobile apps, AI integrations and automations, plus graphic design and Arabic calligraphy commissions.' },
  { tab: 1, q: 'Do you build the backend as well as the interface?', a: 'Yes. I handle the database schema, the API, admin workflows and deployment on Vercel, along with the interface itself.' },
  { tab: 1, q: 'Can you add AI to a product I already have?', a: 'Yes. I connect models through the OpenRouter and Claude APIs and automate flows with n8n, such as routing text and images to a model and filtering the results.' },
  { tab: 1, q: 'Do you design as well as code?', a: 'Yes. I design posters and promotional material, with 20+ delivered for tour packages, and I take Naskh calligraphy and Mushaf illumination commissions.' },
  { tab: 2, q: 'How do we get started?', a: 'Send a message with what you want to build and any deadline. I reply with questions, then we agree on the scope before any work begins.' },
  { tab: 2, q: 'How will I follow progress while you build?', a: 'I share working versions as they become ready, so you can react early instead of waiting for the end.' },
  { tab: 2, q: 'What should I prepare before we start?', a: 'Your goal, who will use the product, a few examples you like, and any existing brand assets or content.' },
  { tab: 2, q: 'Do you handle deployment and handover?', a: 'Yes. I deploy to Vercel or your own host and hand over the code with notes on how to run and maintain it.' },
  { tab: 3, q: 'How do you price a project?', a: 'By scope. After a short conversation I give a quote, so you know the cost before work begins.' },
  { tab: 3, q: 'Is the price fixed or hourly?', a: 'A fixed price per agreed scope is the default. Anything outside that scope is discussed with you before I start on it.' },
  { tab: 3, q: 'How does payment work?', a: 'The payment terms are written into the quote and tied to the deliverables, so each payment matches work you have already seen.' },
  { tab: 4, q: 'Do you work with clients outside Indonesia?', a: 'Yes. I work remotely as an independent freelancer, with clients inside and outside Indonesia.' },
  { tab: 4, q: 'Which languages can we communicate in?', a: 'Indonesian (native), English (intermediate) and Arabic (intermediate).' },
  { tab: 4, q: 'Do you take small or one-off jobs?', a: 'Yes. A single poster, a landing page or one calligraphy piece is fine.' },
  { tab: 4, q: 'How can I reach you?', a: 'Email alfizilham@gmail.com or call +62 852-1389-6460. The contact form and my LinkedIn and GitHub links are in the contact section.' },
];
