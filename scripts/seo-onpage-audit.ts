/**
 * On-page SEO audit for sitemap URLs.
 * Fetches every URL in public/sitemap.xml against the live site,
 * checks robots/canonical/title/description/og:url + internal-link orphans,
 * writes /mnt/documents/seo-onpage-audit.{md,json}.
 *
 * Run: bunx tsx scripts/seo-onpage-audit.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

const SITEMAP = resolve("public/sitemap.xml");
const OUT_DIR = "/mnt/documents";
const UA = "ExosSeoAudit/1.0 (+https://www.exosproc.com)";

type Check = { level: "ok" | "warn" | "fail"; msg: string };
type PageResult = {
  url: string;
  finalUrl: string;
  status: number;
  redirectChain: string[];
  title?: string;
  description?: string;
  robots?: string;
  canonicals: string[];
  ogUrl?: string;
  outboundInternal: string[];
  inboundCount: number;
  checks: Check[];
};

function extractUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function fetchFollow(url: string, max = 5): Promise<{ status: number; finalUrl: string; chain: string[]; body: string }> {
  const chain: string[] = [];
  let current = url;
  for (let i = 0; i <= max; i++) {
    const r = await fetch(current, { redirect: "manual", headers: { "user-agent": UA, accept: "text/html" } });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
      chain.push(`${r.status} → ${r.headers.get("location")}`);
      current = new URL(r.headers.get("location")!, current).toString();
      continue;
    }
    const body = await r.text();
    return { status: r.status, finalUrl: current, chain, body };
  }
  return { status: 0, finalUrl: current, chain, body: "" };
}

function pickHead(html: string): string {
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return m ? m[1] : html;
}
function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m ? (m[2] ?? m[3]) : undefined;
}
function parseHead(head: string) {
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const getMeta = (key: "name" | "property", value: string) =>
    metas.find((t) => attr(t, key)?.toLowerCase() === value)?.match(/content\s*=\s*("([^"]*)"|'([^']*)')/i)?.[2];
  const description = getMeta("name", "description");
  const robots = getMeta("name", "robots");
  const ogUrl = getMeta("property", "og:url");
  const canonicals = [...head.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((t) => attr(t, "rel")?.toLowerCase() === "canonical")
    .map((t) => attr(t, "href") || "")
    .filter(Boolean);
  return { title, description, robots, ogUrl, canonicals };
}
function extractInternalLinks(html: string, origin: string): string[] {
  const hrefs = [...html.matchAll(/<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')/gi)].map((m) => m[2] ?? m[3]);
  const out = new Set<string>();
  for (const h of hrefs) {
    if (!h || h.startsWith("#") || h.startsWith("mailto:") || h.startsWith("tel:")) continue;
    try {
      const u = new URL(h, origin);
      if (u.origin === origin) out.add(u.pathname.replace(/\/$/, "") || "/");
    } catch {}
  }
  return [...out];
}

async function audit() {
  const urls = extractUrls(readFileSync(SITEMAP, "utf8"));
  console.log(`Auditing ${urls.length} URLs…`);
  const results: PageResult[] = [];

  for (const url of urls) {
    process.stdout.write(`  ${url} … `);
    try {
      const { status, finalUrl, chain, body } = await fetchFollow(url);
      const head = pickHead(body);
      const parsed = parseHead(head);
      const origin = new URL(url).origin;
      const outbound = extractInternalLinks(body, origin);
      const checks: Check[] = [];

      if (status !== 200) checks.push({ level: "fail", msg: `HTTP ${status}` });
      const sitemapPath = new URL(url).pathname.replace(/\/$/, "") || "/";
      const finalPath = new URL(finalUrl).pathname.replace(/\/$/, "") || "/";
      if (sitemapPath !== finalPath) checks.push({ level: "fail", msg: `redirected to ${finalUrl}` });

      if (parsed.robots && /noindex/i.test(parsed.robots))
        checks.push({ level: "fail", msg: `robots meta = "${parsed.robots}" (noindex blocks indexing)` });

      if (parsed.canonicals.length === 0) checks.push({ level: "warn", msg: "no canonical tag" });
      else if (parsed.canonicals.length > 1)
        checks.push({ level: "fail", msg: `${parsed.canonicals.length} canonical tags: ${parsed.canonicals.join(" , ")}` });
      else {
        const canonPath = (() => { try { return new URL(parsed.canonicals[0]).pathname.replace(/\/$/, "") || "/"; } catch { return parsed.canonicals[0]; } })();
        if (canonPath !== sitemapPath) checks.push({ level: "fail", msg: `canonical → ${parsed.canonicals[0]} (sitemap says ${url})` });
      }

      if (!parsed.title) checks.push({ level: "fail", msg: "missing <title>" });
      else if (parsed.title.length < 10) checks.push({ level: "warn", msg: `title only ${parsed.title.length} chars` });
      else if (parsed.title.length > 60) checks.push({ level: "warn", msg: `title ${parsed.title.length} chars (>60, may be truncated)` });

      if (!parsed.description) checks.push({ level: "warn", msg: "missing meta description" });
      else if (parsed.description.length < 50) checks.push({ level: "warn", msg: `description only ${parsed.description.length} chars` });
      else if (parsed.description.length > 160) checks.push({ level: "warn", msg: `description ${parsed.description.length} chars (>160, will be truncated)` });

      if (parsed.ogUrl) {
        try {
          const ogPath = new URL(parsed.ogUrl).pathname.replace(/\/$/, "") || "/";
          if (ogPath !== sitemapPath) checks.push({ level: "warn", msg: `og:url → ${parsed.ogUrl}` });
        } catch {}
      }

      results.push({
        url, finalUrl, status, redirectChain: chain,
        title: parsed.title, description: parsed.description, robots: parsed.robots,
        canonicals: parsed.canonicals, ogUrl: parsed.ogUrl,
        outboundInternal: outbound, inboundCount: 0, checks,
      });
      console.log(`${status} · ${checks.filter(c=>c.level!=="ok").length} note(s)`);
    } catch (e) {
      console.log(`ERR ${(e as Error).message}`);
      results.push({ url, finalUrl: url, status: 0, redirectChain: [], canonicals: [], outboundInternal: [], inboundCount: 0,
        checks: [{ level: "fail", msg: `fetch error: ${(e as Error).message}` }] });
    }
  }

  // duplicate title/description detection
  const byTitle = new Map<string, string[]>();
  const byDesc = new Map<string, string[]>();
  for (const r of results) {
    if (r.title) byTitle.set(r.title, [...(byTitle.get(r.title) || []), r.url]);
    if (r.description) byDesc.set(r.description, [...(byDesc.get(r.description) || []), r.url]);
  }
  for (const r of results) {
    if (r.title && (byTitle.get(r.title)?.length || 0) > 1)
      r.checks.push({ level: "warn", msg: `duplicate title shared with ${byTitle.get(r.title)!.filter(u => u !== r.url).join(", ")}` });
    if (r.description && (byDesc.get(r.description)?.length || 0) > 1)
      r.checks.push({ level: "warn", msg: `duplicate description shared with ${byDesc.get(r.description)!.filter(u => u !== r.url).join(", ")}` });
  }

  // orphan detection via reverse link index
  const pathToUrl = new Map(results.map((r) => [new URL(r.url).pathname.replace(/\/$/, "") || "/", r.url]));
  for (const r of results) {
    const self = new URL(r.url).pathname.replace(/\/$/, "") || "/";
    for (const p of r.outboundInternal) {
      const target = results.find((x) => (new URL(x.url).pathname.replace(/\/$/, "") || "/") === p);
      if (target && target.url !== r.url) target.inboundCount++;
    }
  }
  for (const r of results) {
    if (r.inboundCount === 0 && (new URL(r.url).pathname !== "/"))
      r.checks.push({ level: "warn", msg: "orphan — no other sitemap page links to it" });
  }

  // write outputs
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(`${OUT_DIR}/seo-onpage-audit.json`, JSON.stringify(results, null, 2));

  const fails = results.filter((r) => r.checks.some((c) => c.level === "fail"));
  const warns = results.filter((r) => r.checks.some((c) => c.level === "warn") && !fails.includes(r));
  const clean = results.filter((r) => !fails.includes(r) && !warns.includes(r));

  const lines: string[] = [];
  lines.push(`# SEO on-page audit · ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push(`**${results.length} URLs** · ${fails.length} blocked · ${warns.length} warnings · ${clean.length} clean`);
  lines.push("");
  lines.push("## Blockers (fix before resubmit)");
  if (fails.length === 0) lines.push("_None._");
  else for (const r of fails) {
    lines.push(`### ${r.url}`);
    for (const c of r.checks) lines.push(`- **${c.level.toUpperCase()}** — ${c.msg}`);
    lines.push("");
  }
  lines.push("## Warnings");
  if (warns.length === 0) lines.push("_None._");
  else for (const r of warns) {
    lines.push(`### ${r.url}`);
    for (const c of r.checks) if (c.level === "warn") lines.push(`- ${c.msg}`);
    lines.push("");
  }
  lines.push("## Clean");
  for (const r of clean) lines.push(`- ${r.url}`);
  lines.push("");
  lines.push("## Per-URL detail");
  for (const r of results) {
    lines.push(`### ${r.url}`);
    lines.push(`- status: ${r.status}${r.redirectChain.length ? ` · chain: ${r.redirectChain.join(" → ")}` : ""}`);
    lines.push(`- title (${r.title?.length ?? 0}): ${r.title ?? "—"}`);
    lines.push(`- description (${r.description?.length ?? 0}): ${r.description ?? "—"}`);
    lines.push(`- robots: ${r.robots ?? "(none — defaults to index,follow)"}`);
    lines.push(`- canonical: ${r.canonicals.join(" , ") || "(none)"}`);
    lines.push(`- og:url: ${r.ogUrl ?? "—"}`);
    lines.push(`- inbound internal links: ${r.inboundCount}`);
    lines.push("");
  }
  writeFileSync(`${OUT_DIR}/seo-onpage-audit.md`, lines.join("\n"));

  console.log("");
  console.log(`Summary: ${results.length} URLs · ${fails.length} blocked · ${warns.length} warn · ${clean.length} clean`);
  if (fails.length) console.log("Blockers:\n  " + fails.map((r) => r.url).join("\n  "));
  console.log(`\nReport: ${OUT_DIR}/seo-onpage-audit.md`);
}

audit().catch((e) => { console.error(e); process.exit(1); });
