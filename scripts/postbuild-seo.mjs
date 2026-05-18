import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DIST = 'dist';
const BASE_URL = 'https://www.exosproc.com';
const OG_IMAGE = `${BASE_URL}/og-image-v2.png`;

// All descriptions kept ≤160 chars so Google does not truncate.
const routes = [
  {
    path: '/welcome',
    title: 'EXOS — Agentic AI Procurement Platform | No Implementation',
    description: 'Agentic AI procurement platform: negotiation prep, supplier risk, TCO and inflation monitoring. 20+ expert scenarios. No implementation needed.',
    h1: 'Agentic AI Procurement Analysis. No Implementation. No Wait.',
  },
  {
    path: '/features',
    title: '20+ AI Procurement Scenarios — Risk, TCO & Negotiation | EXOS',
    description: 'AI-powered procurement analysis: TCO breakdowns, supplier risk scoring, negotiation prep and market intelligence — GDPR-native, EU mid-market.',
    h1: 'How EXOS Works',
  },
  {
    path: '/reports',
    title: 'AI Procurement Reports — Sample Outputs & Scenarios | EXOS',
    description: 'See sample reports from EXOS: supplier risk, TCO, negotiation prep, make-or-buy and black-swan analyses. Real outputs from the 20+ scenario library.',
    h1: 'EXOS Sample Reports',
  },
  {
    path: '/pricing',
    title: 'Pricing | EXOS – AI Procurement Analysis',
    description: 'Simple, transparent pricing for EU procurement teams. ROI from first day, first user. No integrations or company-wide approvals needed.',
    h1: 'Simple, Transparent Pricing for EU Procurement Teams',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | EXOS',
    description: 'How EXOS collects, processes and protects your data. GDPR-native by design, hosted in the EU, with full transparency on AI use and retention.',
    h1: 'Privacy Policy',
  },
  {
    path: '/terms',
    title: 'Terms of Service | EXOS',
    description: 'Terms governing use of the EXOS agentic AI procurement platform: subscriptions, acceptable use, intellectual property and liability for EU customers.',
    h1: 'Terms of Service',
  },
  {
    path: '/blog',
    title: 'EXOS Blog — Procurement, AI & Category Strategy',
    description: 'Essays on agentic AI, category management and procurement strategy from the EXOS team. Written for EU procurement leaders, not vendors.',
    h1: 'EXOS Blog',
  },
  {
    path: '/blog/the-efficiency-trap',
    title: "Why Automating Tail Spend Won't Save Your Margin | EXOS Blog",
    description: 'Transactional speed versus cognitive depth: why the next generation of procurement technology must augment strategic thinking, not just automate clicks.',
    h1: "Why Automating Your Tail Spend Won't Save Your Margin",
  },
  {
    path: '/blog/the-noise-problem',
    title: 'The Noise Problem: A Note for Every Procurement Manager | EXOS',
    description: 'You are not short of information. You are short of the right information at the right moment, connected to your specific categories and contracts.',
    h1: 'The Noise Problem: A Note for Every Procurement Manager',
  },
  {
    path: '/blog/your-favorite-chatbot-for-everything',
    title: 'Your Favorite Chatbot for Everything: Rethinking LLMs | EXOS',
    description: 'Why general-purpose chatbots are a dead end for strategic category management — and what domain-specific procurement AI agents do differently.',
    h1: 'Your Favorite Chatbot for Everything: Rethinking LLMs',
  },
  {
    path: '/faq',
    title: 'FAQ | EXOS – AI Procurement Analysis',
    description: 'Frequently asked questions about EXOS: data privacy, GDPR compliance, supported scenarios, pricing and how AI procurement analysis works.',
    h1: 'Frequently Asked Questions',
  },
  {
    path: '/enterprise/risk',
    title: 'Supplier Risk Assessment Platform | EXOS',
    description: 'Continuous monitoring of supplier financial health, geopolitical exposure and regulatory risk — built for EU procurement teams.',
    h1: 'Supplier Risk Assessment Platform',
  },
  {
    path: '/enterprise/inflation',
    title: 'Inflation Monitoring | EXOS',
    description: 'Track inflation drivers across your procurement categories with AI-powered market intelligence and early warning alerts.',
    h1: 'Inflation Monitoring',
  },
  {
    path: '/scenarios/tco-analysis',
    title: 'Total Cost of Ownership Analysis Software | EXOS',
    description: 'Calculate the true lifecycle cost of any procurement decision: acquisition, operation, risk and exit costs. GDPR-native, built for EU teams.',
    h1: 'Total Cost of Ownership Analysis',
  },
  {
    path: '/scenarios/supplier-risk-assessment',
    title: 'AI Supplier Risk Assessment Software | EXOS',
    description: 'Supplier risk analysis covering financial, geopolitical, legal, cyber and operational risk with real-time market intelligence. GDPR-native, EU-built.',
    h1: 'Supplier Risk Assessment',
  },
  {
    path: '/scenarios/negotiation-preparation',
    title: 'Procurement Negotiation Preparation Software | EXOS',
    description: 'Calculate BATNA, ZOPA and buying power before any supplier negotiation. AI-powered strategy with tactical recommendations for EU procurement teams.',
    h1: 'Negotiation Preparation',
  },
  {
    path: '/scenarios/make-or-buy-analysis',
    title: 'Make vs Buy Analysis Tool | Outsourcing Decision Software | EXOS',
    description: 'Decide whether to produce in-house or outsource. EXOS evaluates cost, capability, strategic fit, quality and speed for EU procurement teams.',
    h1: 'Make vs Buy Analysis',
  },
  {
    path: '/scenarios/black-swan-simulation',
    title: 'Black Swan Supply Chain Risk Simulation | EXOS',
    description: 'Simulate catastrophic supply-chain disruptions before they happen. EXOS builds proactive mitigation roadmaps for EU procurement and supply teams.',
    h1: 'Black Swan Scenario Simulator',
  },
];

// Length guard — keeps regressions from sneaking in.
for (const r of routes) {
  if (r.description.length > 160) {
    throw new Error(`Description for ${r.path} is ${r.description.length} chars (>160). Trim it.`);
  }
  if (r.title.length > 65) {
    console.warn(`⚠ Title for ${r.path} is ${r.title.length} chars (>65, may be truncated in SERPs).`);
  }
}

const template = readFileSync(join(DIST, 'index.html'), 'utf-8');

for (const route of routes) {
  const dir = join(DIST, route.path);
  mkdirSync(dir, { recursive: true });

  const ogUrl = `${BASE_URL}${route.path}`;

  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${route.description}"`
    )
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${ogUrl}" />`
    )
    .replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${route.title}"`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${route.description}"`
    )
    .replace(
      /<meta property="og:url" content="[^"]*"/,
      `<meta property="og:url" content="${ogUrl}"`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${route.title}"`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${route.description}"`
    )
    .replace(
      '</body>',
      `<noscript><div style="padding:2rem;max-width:800px;margin:0 auto"><h1>${route.h1}</h1><p>${route.description}</p><p><a href="${BASE_URL}">Visit EXOS</a></p></div></noscript>\n</body>`
    );

  // If the template has no canonical (root index.html shipped without one),
  // inject a self-referencing canonical so every emitted page has exactly one.
  if (!/<link rel="canonical"/.test(html)) {
    html = html.replace(
      /<\/head>/,
      `  <link rel="canonical" href="${ogUrl}" />\n  </head>`
    );
  }

  writeFileSync(join(dir, 'index.html'), html);
  console.log(`✓ ${route.path}`);
}

console.log(`\nGenerated ${routes.length} route-specific HTML files.`);
