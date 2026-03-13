// api/sync-menu.js — Vercel serverless function
// Fetches FOOD N PAIRINGS sheet from Google Sheets CSV, parses it, upserts into menu_courses

const { createClient } = require("@supabase/supabase-js");

const SHEET_ID  = "1AsEtIuuUZKA_i84VYvEYKdbKA2e9wr4q1P2rVN84xdQ";
const SHEET_TAB = "FOOD N PAIRINGS JAN26";
const CSV_URL   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;

const SECRET = process.env.SYNC_SECRET || "milka2025";

// ── Simple CSV parser (handles quoted fields with commas/newlines) ──────────
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuote = false;
      else field += ch;
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ',') { row.push(field); field = ""; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (ch === '\r') { /* skip */ }
      else field += ch;
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ── Parse "DISH NAME\nsub description" into {name, sub} ───────────────────
function parseCell(val) {
  if (!val || !val.trim()) return null;
  const parts = val.trim().split("\n");
  const name  = parts[0].trim();
  const sub   = parts.slice(1).join(" ").trim().replace(/\s+/g, " ");
  if (!name) return null;
  return { name, sub };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // Auth check
  const secret = req.query.secret || req.headers["x-sync-secret"];
  if (secret !== SECRET) return res.status(401).json({ error: "Unauthorized" });

  try {
    // 1. Fetch CSV from Google Sheets
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`Google Sheets fetch failed: ${response.status}`);
    const csvText = await response.text();

    // 2. Parse CSV
    const rows = parseCSV(csvText);
    if (rows.length < 2) throw new Error("Sheet appears empty");

    // Expected columns (0-indexed):
    // 0: MENU, 1: MENU SLO, 2: VEGETARIAN, 3: HAZARDS,
    // 4: NA, 5: NA SLO, 6: WP, 7: OS, 8: OS SLO, 9: Premium Pairing, 10: APERITIVO

    const dataRows = rows.slice(1); // skip header row
    const courses  = [];

    dataRows.forEach((cols, idx) => {
      const menuRaw = cols[0];
      if (!menuRaw || !menuRaw.trim()) return; // skip empty rows

      const menu    = parseCell(menuRaw);
      if (!menu) return;

      const veg     = parseCell(cols[2]);
      const hazards = (cols[3] || "").trim() || null;
      const na      = parseCell(cols[4]);
      const wp      = parseCell(cols[6]);
      const os      = parseCell(cols[7]);
      const premium = parseCell(cols[9]);
      const position = idx + 1; // 1-based
      const is_snack = position <= 5; // SOUR SOUP → CRAYFISH are snacks

      courses.push({ position, menu, veg, hazards, na, wp, os, premium, is_snack });
    });

    if (courses.length === 0) throw new Error("No courses parsed from sheet");

    // 3. Upsert into Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    );

    const { error } = await supabase
      .from("menu_courses")
      .upsert(courses, { onConflict: "position" });

    if (error) throw new Error("Supabase upsert failed: " + error.message);

    // 4. Delete any positions that no longer exist in the sheet
    const positions = courses.map(c => c.position);
    await supabase
      .from("menu_courses")
      .delete()
      .not("position", "in", `(${positions.join(",")})`);

    return res.status(200).json({
      ok: true,
      synced: courses.length,
      courses: courses.map(c => c.menu.name),
    });

  } catch (err) {
    console.error("sync-menu error:", err);
    return res.status(500).json({ error: err.message });
  }
};
