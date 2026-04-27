import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const DIST = 'dist';
const BASE_URL = 'https://exosproc.com';
const OG_IMAGE = `${BASE_URL}/og-image.png`;

const routes = [
  {
    path: '/welcome',
    title: 'EXOS — Agentic AI Procurement Platform | No Implementation',
    description: 'Agentic AI procurement platform — negotiation preparation, supplier risk monitoring, TCO analysis, and inflation tracking. 20+ expert scenarios. No implementation needed.',
    h1: 'Agentic AI Procurement Analysis. No Implementation. No Wait.',
  },
  {
    path: '/features',
    title: '20+ AI Procurement Scenarios — Risk, TCO & Negotiation | EXOS',
    description: 'Explore how EXOS delivers AI-powered procurement analysis: cost breakdowns, supplier risk scoring, negotiation preparation, and market intelligence — all GDPR-native.',
    h1: 'How EXOS Works',
  },
  {
    path: '/pricing',
    title: 'Pricing | EXOS – AI Procurement Analysis',
    description: 'Simple, transparent pricing for EU procurement teams. Get ROI from first day, first user. No integrations required, no company-wide approvals needed.',
    h1: 'Simple, Transparent Pricing for EU Procurement Teams',
  },
  {
    path: '/faq',
    title: 'FAQ | EXOS – AI Procurement Analysis',
    description: 'Frequently asked questions about EXOS: data privacy, GDPR compliance, supported scenarios, pricing, and how AI procurement analysis works.',
    h1: 'Frequently Asked Questions',
  },
  {
    path: '/enterprise/risk',
    title: 'Supplier Risk Assessment Platform | EXOS',
    description: 'Continuous monitoring of supplier financial health, geopolitical exposure, and regulatory risk — built for EU procurement teams.',
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
    description: 'Calculate the true lifecycle cost of any procurement decision. EXOS TCO analysis covers acquisition, operation, risk, and exit costs — GDPR-native, built for EU mid-market teams.',
    h1: 'Total Cost of Ownership Analysis',
  },
  {
    path: '/scenarios/supplier-risk-assessment',
    title: 'AI Supplier Risk Assessment Software | EXOS',
    description: 'Comprehensive supplier risk analysis covering financial health, geopolitical exposure, legal, cyber, and operational risk. Real-time market intelligence. GDPR-native for EU teams.',
    h1: 'Supplier Risk Assessment',
  },
  {
    path: '/scenarios/negotiation-preparation',
    title: 'Procurement Negotiation Preparation Software | EXOS',
    description: 'Calculate your BATNA, ZOPA, and buying power before any supplier negotiation. AI-powered negotiation strategy with tactical recommendations. Built for EU procurement teams.',
    h1: 'Negotiation Preparation',
  },
  {
    path: '/scenarios/make-or-buy-analysis',
    title: 'Make vs Buy Analysis Tool | Outsourcing Decision Software | EXOS',
    description: 'Evaluate whether to produce in-house or outsource. EXOS Make vs Buy analysis covers cost, capability, strategic fit, quality, and speed — with a structured recommendation for EU procurement teams.',
    h1: 'Make vs Buy Analysis',
  },
  {
    path: '/scenarios/black-swan-simulation',
    title: 'Black Swan Supply Chain Risk Simulation | EXOS',
    description: 'Simulate catastrophic supply chain disruptions before they happen. EXOS Black Swan Scenario Simulator builds proactive mitigation roadmaps for EU procurement and supply chain teams.',
    h1: 'Black Swan Scenario Simulator',
  },
];

const template = readFileSync(join(DIST, 'index.html'), 'utf-8');

for (const route of routes) {
  const dir = join(DIST, route.path);
  mkdirSync(dir, { recursive: true });

  const ogUrl = `${BASE_URL}${route.path}`;

  let html = template
    // Title
    .replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)
    // Meta description
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${route.description}"`
    )
    // OG tags
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
    // Twitter tags
    .replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${route.title}"`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${route.description}"`
    )
    // Add noscript block before closing </body>
    .replace(
      '</body>',
      `<noscript><div style="padding:2rem;max-width:800px;margin:0 auto"><h1>${route.h1}</h1><p>${route.description}</p><p><a href="${BASE_URL}">Visit EXOS</a></p></div></noscript>\n</body>`
    );

  writeFileSync(join(dir, 'index.html'), html);
  console.log(`✓ ${route.path}`);
}

console.log(`\nGenerated ${routes.length} route-specific HTML files.`);
