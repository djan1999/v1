/**
 * Milka Wine Sync — Vercel Cron Function
 * Runs nightly at 02:00 UTC (configured in vercel.json)
 *
 * Scrapes vinska-karta.hotelmilka.si by country, parses the wine tables,
 * and upserts into the Supabase `wines` table.
 *
 * Also callable manually:
 *   GET /api/sync-wines?secret=YOUR_CRON_SECRET   → runs sync
 *   GET /api/sync-wines?secret=...&dry=true        → parse only, no DB write
 */

import { createClient } from "@supabase/supabase-js";

const BASE = "https://vinska-karta.hotelmilka.si";

// Countries to scrape (add more if the site expands)
const COUNTRIES = [
  { param: "Slovenija", label: "SI" },
  { param: "Avstrija",  label: "AT" },
  { param: "Italija",   label: "IT" },
  { param: "Francija",  label: "FR" },
  { param: "Hrva%C5%A1ka", label: "HR" },
];

// ─── HTML parser ──────────────────────────────────────────────────────────────
// No external deps — parses the wine tables out of raw HTML using regex.
// Each row: [producer, name, vintage, region, size, price]
// "By glass" entries have a number prefix like "01." on the producer cell.

function parseWinesFromHtml(html, countryLabel) {
  const wines = [];

  // Find all <table> blocks
  const tableRe = /<table[\s\S]*?<\/table>/gi;
  const tableMatches = html.match(tableRe) || [];

  for (const table of tableMatches) {
    // Find all <tr> rows
    const rowRe = /<tr[\s\S]*?<\/tr>/gi;
    const rows = table.match(rowRe) || [];

    for (const row of rows) {
      // Extract <td> cell content, strip all tags
      const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [];
      let m;
      while ((m = tdRe.exec(row)) !== null) {
        // Strip HTML tags and decode basic entities
        const text = m[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&nbsp;/g, " ")
          .replace(/&#039;/g, "'")
          .replace(/&quot;/g, '"')
          .trim();
        cells.push(text);
      }

      // Expect at least 5 cells: producer, name, vintage(?), region, size, price
      if (cells.length < 5) continue;

      let [rawProducer, rawName, vintage, region] = cells;

      // Skip header-like rows
      if (!rawProducer || rawProducer.length > 80) continue;
      if (rawProducer.toLowerCase().includes("producer")) continue;

      // Detect by-glass: numbered prefix like "01." "17."
      const byGlassMatch = rawProducer.match(/^(\d{2})\.\s*/);
      const byGlass = !!byGlassMatch;
      const producer = rawProducer.replace(/^\d{2}\.\s*/, "").trim();

      // Clean eco/natural tags from name
      const name = rawName
        .replace(/natural/gi, "")
        .replace(/eco/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      if (!producer || !name) continue;

      // Vintage: keep "NV" as-is, blank if empty
      const vintageClean = (vintage || "").trim() || "NV";

      // Build a stable unique key (used for upsert dedup)
      const key = `${producer}|${name}|${vintageClean}|${countryLabel}`
        .toLowerCase()
        .replace(/\s/g, "_");

      wines.push({
        key,
        producer,
        name: `${producer} – ${name}`,
        wine_name: name,
        vintage: vintageClean,
        region: `${(region || "").trim()}, ${countryLabel}`,
        country: countryLabel,
        by_glass: byGlass,
      });
    }
  }

  return wines;
}

// ─── Fetch one country page ───────────────────────────────────────────────────
async function fetchCountry({ param, label }) {
  const url = `${BASE}/category/vino/?drzava=${param}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MilkaSyncBot/1.0)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    console.warn(`[sync-wines] ${label} → HTTP ${res.status}, skipping`);
    return [];
  }

  const html = await res.text();
  const wines = parseWinesFromHtml(html, label);
  console.log(`[sync-wines] ${label} → ${wines.length} wines parsed`);
  return wines;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Security: require secret header or query param
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers["x-cron-secret"] ||
    new URL(req.url, "http://localhost").searchParams.get("secret");

  if (secret && provided !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const dry =
    new URL(req.url, "http://localhost").searchParams.get("dry") === "true";

  try {
    // ── Scrape all countries in parallel ──────────────────────────────────────
    const results = await Promise.allSettled(COUNTRIES.map(fetchCountry));

    const allWines = results.flatMap((r) =>
      r.status === "fulfilled" ? r.value : []
    );

    if (allWines.length === 0) {
      return res.status(200).json({
        ok: false,
        message: "No wines scraped — site may be down or HTML changed",
      });
    }

    const byGlassCount = allWines.filter((w) => w.by_glass).length;
    console.log(
      `[sync-wines] Total: ${allWines.length} wines, ${byGlassCount} by-glass`
    );

    if (dry) {
      return res.status(200).json({
        ok: true,
        dry: true,
        count: allWines.length,
        byGlass: byGlassCount,
        sample: allWines.slice(0, 5),
      });
    }

    // ── Upsert to Supabase ────────────────────────────────────────────────────
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY // service key for write access
    );

    // Deduplicate by key (same wine can appear in multiple scrape passes)
    const seen = new Set();
    const uniqueWines = allWines.filter(w => {
      if (seen.has(w.key)) return false;
      seen.add(w.key);
      return true;
    });
    console.log(`[sync-wines] After dedup: ${uniqueWines.length} unique wines`);

    // Upsert in batches of 200 to avoid request size limits
    const BATCH = 200;
    let upserted = 0;

    for (let i = 0; i < uniqueWines.length; i += BATCH) {
      const batch = uniqueWines.slice(i, i + BATCH);
      const { error } = await supabase
        .from("wines")
        .upsert(batch, { onConflict: "key" });

      if (error) throw error;
      upserted += batch.length;
    }

    // Remove wines that no longer exist on the site
    // Strategy: delete any key NOT in the freshly scraped set
    const freshKeys = uniqueWines.map((w) => w.key);
    const { error: deleteError } = await supabase
      .from("wines")
      .delete()
      .not("key", "in", `(${freshKeys.map((k) => `"${k}"`).join(",")})`);

    if (deleteError) {
      console.warn("[sync-wines] Cleanup delete failed:", deleteError.message);
    }

    console.log(`[sync-wines] Upserted ${upserted} wines`);

    return res.status(200).json({
      ok: true,
      count: upserted,
      byGlass: byGlassCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[sync-wines] Error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
