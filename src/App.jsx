import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const FONT = "'Roboto Mono', monospace";
const MOBILE_SAFE_INPUT_SIZE = 16;

// ── Wine DB ───────────────────────────────────────────────────────────────────
const initWines = [];

// ── Initial extra dishes ──────────────────────────────────────────────────────
const initDishes = [
  { id: 1, name: "Beetroot",  pairings: ["—", "Wine", "Non-Alc"] },
  { id: 2, name: "Cheese",    pairings: ["—", "Wine", "Non-Alc"] },
];

// ── Cocktails & Spirits & Beers ───────────────────────────────────────────────
const initCocktails = [];
const initSpirits   = [];
const initBeers     = [];

// ── Beverages local-storage key (separate from board state) ───────────────────
const BEV_STORAGE_KEY = "milka-beverages-v1";
function readLocalBeverages() {
  try {
    const raw = localStorage.getItem(BEV_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function writeLocalBeverages(bev) {
  try { localStorage.setItem(BEV_STORAGE_KEY, JSON.stringify(bev)); } catch {}
}

// ── Water ─────────────────────────────────────────────────────────────────────
const WATER_OPTS = ["—", "XC", "XW", "OC", "OW"];
const waterStyle = v => {
  if (v === "XC" || v === "XW") return { color: "#1a1a1a", bg: "#f0f0f0" };
  if (v === "OC" || v === "OW") return { color: "#1a1a1a", bg: "#e8e8e8" };
  return { color: "#555", bg: "transparent" };
};

// ── Pairings ──────────────────────────────────────────────────────────────────
const PAIRINGS = ["Wine", "Non-Alc", "Premium", "Our Story"];
const pairingStyle = {
  "Non-Alc":  { color: "#1f5f73", border: "#7fc6db88", bg: "#7fc6db12" },
  "Wine":      { color: "#8a6030", border: "#c8a06088", bg: "#c8a06008" },
  "Premium":   { color: "#5a5a8a", border: "#8888bb88", bg: "#8888bb08" },
  "Our Story": { color: "#3a7a5a", border: "#5aaa7a88", bg: "#5aaa7a08" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fuzzy = (q, wineList, byGlass = null) => {
  if (!q) return [];
  const lq = q.toLowerCase();
  return wineList.filter(w => {
    const hit = w.name.toLowerCase().includes(lq) || w.producer.toLowerCase().includes(lq) || w.vintage.includes(lq);
    return hit && (byGlass === null || w.byGlass === byGlass);
  }).slice(0, 6);
};

const fuzzyDrink = (q, list) => {
  if (!q) return [];
  const lq = q.toLowerCase();
  return list.filter(d =>
    d.name.toLowerCase().includes(lq) || (d.notes || "").toLowerCase().includes(lq)
  ).slice(0, 6);
};

const makeSeats = (n, ex = []) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    water:     ex[i]?.water     ?? "—",
    glasses:   ex[i]?.glasses   ?? [],
    cocktails: ex[i]?.cocktails ?? [],
    spirits:   ex[i]?.spirits   ?? [],
    beers:     ex[i]?.beers     ?? [],
    pairing:   ex[i]?.pairing   ?? "",
    extras:    ex[i]?.extras    ?? {},
  }));

const fmt = d => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;

// ── Blank table factory ───────────────────────────────────────────────────────
const blankTable = id => ({
  id, active: false, guests: 2, resName: "", resTime: "", guestType: "", room: "",
  arrivedAt: null, menuType: "", pace: "", bottleWines: [],
  restrictions: [], birthday: false, notes: "", seats: makeSeats(2),
});

const initTables = Array.from({ length: 10 }, (_, i) => blankTable(i + 1));

// ── sanitizeTable: fill any missing fields so stale Supabase data never breaks UI ──
const sanitizeTable = t => ({
  ...blankTable(t.id ?? 0),
  ...t,
  bottleWines: Array.isArray(t.bottleWines) ? t.bottleWines : (t.bottleWine ? [t.bottleWine] : []),
  seats: makeSeats(
    t.guests ?? 2,
    Array.isArray(t.seats) ? t.seats : []
  ),
  restrictions: Array.isArray(t.restrictions) ? t.restrictions : [],
});

// ── Shared styles ─────────────────────────────────────────────────────────────
const baseInp = {
  fontFamily: FONT, fontSize: MOBILE_SAFE_INPUT_SIZE, // 16px prevents iOS auto-zoom
  padding: "10px 12px", border: "1px solid #e8e8e8",
  borderRadius: 2, outline: "none",
  color: "#1a1a1a", background: "#fff",
  boxSizing: "border-box", width: "100%", minWidth: 0,
  WebkitAppearance: "none", // removes iOS styling
};
const fieldLabel = {
  fontFamily: FONT, fontSize: 9,
  letterSpacing: 3, color: "#444",
  textTransform: "uppercase", marginBottom: 8,
};
const topStatChip = {
  fontFamily: FONT,
  fontSize: 10,
  color: "#1a1a1a",
  letterSpacing: 1,
  padding: "6px 10px",
  border: "1px solid #e8e8e8",
  borderRadius: 999,
  background: "#fff",
  whiteSpace: "nowrap",
};
const statusPill = (isLive, label) => ({
  fontFamily: FONT,
  fontSize: 9,
  letterSpacing: 2,
  padding: "6px 10px",
  border: `1px solid ${isLive ? "#8fc39f" : "#d8d8d8"}`,
  borderRadius: 999,
  background: isLive ? "#eef8f1" : "#f6f6f6",
  color: isLive ? "#2f7a45" : "#555",
  fontWeight: 600,
  whiteSpace: "nowrap",
});

const STORAGE_KEY = "milka-service-board-v7";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = hasSupabaseConfig ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const defaultBoardState = () => ({
  tables: initTables,
  dishes: initDishes,
  wines: initWines,
  cocktails: initCocktails,
  spirits: initSpirits,
  beers: initBeers,
});

const readLocalBoardState = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const writeLocalBoardState = state => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

const circBtnSm = {
  width: 36, height: 36, borderRadius: "50%",
  border: "1px solid #e8e8e8", background: "#fff",
  color: "#444", fontSize: 18, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: FONT, lineHeight: 1, touchAction: "manipulation",
};

function useIsMobile(bp = 700) {
  const getValue = () => (typeof window !== "undefined" ? window.innerWidth < bp : false);
  const [isMobile, setIsMobile] = useState(getValue);

  useEffect(() => {
    const onResize = () => setIsMobile(getValue());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bp]);

  return isMobile;
}

// ── Water Picker ──────────────────────────────────────────────────────────────
function WaterPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, []);
  const ws = waterStyle(value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        fontFamily: FONT, fontSize: 12, fontWeight: 500,
        padding: "6px 10px", border: "1px solid #e8e8e8",
        borderRadius: 2, cursor: "pointer", width: "100%",
        background: ws.bg, color: ws.color, letterSpacing: 1,
      }}>{value}</button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", left: 0,
          background: "#fff", border: "1px solid #e8e8e8", borderRadius: 2,
          zIndex: 200, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", minWidth: 70,
        }}>
          {WATER_OPTS.map(opt => (
            <div key={opt} onMouseDown={() => { onChange(opt); setOpen(false); }} style={{
              padding: "8px 14px", cursor: "pointer",
              fontFamily: FONT, fontSize: 12, letterSpacing: 1,
              color: value === opt ? "#1a1a1a" : "#999",
              background: value === opt ? "#f8f8f8" : "#fff",
              fontWeight: value === opt ? 500 : 400,
              borderBottom: "1px solid #f5f5f5",
            }}>{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Wine Search ───────────────────────────────────────────────────────────────
function WineSearch({ wineObj, wines = [], onChange, placeholder, byGlass = null, compact = false }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, []);
  const fs = compact ? 11 : 12;
  const inputFs = MOBILE_SAFE_INPUT_SIZE;
  const py = compact ? 5 : 7;
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {wineObj ? (
        <div style={{
          display: "flex", alignItems: "center",
          border: "1px solid #d8d8d8", borderRadius: 2,
          padding: `${py}px 28px ${py}px 10px`,
          background: "#fafafa", position: "relative",
          fontSize: fs, fontFamily: FONT, color: "#4a4a4a",
        }}>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {wineObj.name} · {wineObj.producer} · {wineObj.vintage}
          </span>
          <button onClick={e => { e.stopPropagation(); onChange(null); }} style={{
            position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0,
          }}>×</button>
        </div>
      ) : (
        <input value={q} onChange={e => {
          setQ(e.target.value);
          const r = fuzzy(e.target.value, wines, byGlass);
          setResults(r); setOpen(r.length > 0);
          if (!e.target.value) onChange(null);
        }} onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder || "search…"}
          style={{ ...baseInp, fontSize: inputFs, padding: `${py}px 10px`, letterSpacing: 0.3 }} />
      )}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #e8e8e8", borderRadius: 2,
          zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden",
        }}>
          {results.map(w => (
            <div key={w.id} onMouseDown={() => { setQ(""); setOpen(false); onChange(w); }} style={{
              padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f5f5f5",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <span style={{ fontFamily: FONT, fontSize: 12, color: "#1a1a1a" }}>{w.name}</span>
                <span style={{ fontFamily: FONT, fontSize: 11, color: "#444" }}> · {w.producer} · {w.vintage}</span>
              </div>
              {w.byGlass && <span style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 1, color: "#444", border: "1px solid #e8e8e8", borderRadius: 2, padding: "2px 5px" }}>glass</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Drink Search (cocktails / spirits) ────────────────────────────────────────
function DrinkSearch({ drinkObj, list = [], onChange, placeholder, accentColor = "#7a507a" }) {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen]     = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {drinkObj ? (
        <div style={{
          display: "flex", alignItems: "center",
          border: `1px solid ${accentColor}44`, borderRadius: 2,
          padding: "5px 28px 5px 10px", background: `${accentColor}08`,
          position: "relative", fontSize: 11, fontFamily: FONT, color: "#4a4a4a",
        }}>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {drinkObj.name}{drinkObj.notes ? ` · ${drinkObj.notes}` : ""}
          </span>
          <button onClick={e => { e.stopPropagation(); onChange(null); }} style={{
            position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0,
          }}>×</button>
        </div>
      ) : (
        <input value={q} onChange={e => {
          setQ(e.target.value);
          const r = fuzzyDrink(e.target.value, list);
          setResults(r); setOpen(r.length > 0);
          if (!e.target.value) onChange(null);
        }} onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder || "search…"}
          style={{ ...baseInp, fontSize: MOBILE_SAFE_INPUT_SIZE, padding: "5px 10px", letterSpacing: 0.3 }} />
      )}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #e8e8e8", borderRadius: 2,
          zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden",
        }}>
          {results.map(d => (
            <div key={d.id} onMouseDown={() => { setQ(""); setOpen(false); onChange(d); }} style={{
              padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid #f5f5f5",
              fontFamily: FONT, fontSize: 12, color: "#1a1a1a",
            }}>
              {d.name}{d.notes ? <span style={{ color: "#444" }}> · {d.notes}</span> : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Swap Picker ───────────────────────────────────────────────────────────────
function SwapPicker({ seatId, totalSeats, onSwap }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, []);
  const others = Array.from({ length: totalSeats }, (_, i) => i + 1).filter(n => n !== seatId);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Swap position" style={{
        width: 28, height: 28, borderRadius: 2,
        border: "1px solid #e8e8e8", background: open ? "#f5f5f5" : "#fff",
        color: "#555", cursor: "pointer", fontSize: 13,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>⇅</button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", right: 0,
          background: "#fff", border: "1px solid #e8e8e8", borderRadius: 2,
          zIndex: 300, overflow: "hidden", minWidth: 80,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}>
          <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, color: "#555", padding: "7px 12px 4px", textTransform: "uppercase" }}>swap with</div>
          {others.map(n => (
            <div key={n} onMouseDown={() => { onSwap(n); setOpen(false); }} style={{
              padding: "8px 14px", cursor: "pointer",
              fontFamily: FONT, fontSize: 12, color: "#1a1a1a",
              borderTop: "1px solid #f5f5f5",
            }}>P{n}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Beverage type styles (shared) ─────────────────────────────────────────────
const BEV_TYPES = {
  wine:     { label: "Glass",    color: "#7a5020", bg: "#fdf4e8", border: "#c8a060", dot: "#c8a060" },
  cocktail: { label: "Cocktail", color: "#5a3878", bg: "#f5eeff", border: "#b898d8", dot: "#b898d8" },
  spirit:   { label: "Spirit",   color: "#7a5020", bg: "#fff3e0", border: "#d4a870", dot: "#d4a870" },
  beer:     { label: "Beer",     color: "#3a6a2a", bg: "#edf8e8", border: "#88bb70", dot: "#88bb70" },
};

// ── BeverageSearch — unified single-search across all drink types ──────────────
function BeverageSearch({ wines, cocktails, spirits, beers, onAdd }) {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen]     = useState(false);
  const ref = useRef();
  const inputRef = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("touchstart", h); };
  }, []);

  const search = val => {
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    const lq = val.toLowerCase();
    const r = [];
    wines.filter(w => w.byGlass).forEach(w => {
      if (w.name.toLowerCase().includes(lq) || w.producer?.toLowerCase().includes(lq) || w.vintage?.includes(lq))
        r.push({ type: "wine",     item: w, label: w.name, sub: `${w.producer} · ${w.vintage}` });
    });
    cocktails.forEach(c => {
      if (c.name.toLowerCase().includes(lq) || (c.notes||"").toLowerCase().includes(lq))
        r.push({ type: "cocktail", item: c, label: c.name, sub: c.notes || "" });
    });
    spirits.forEach(s => {
      if (s.name.toLowerCase().includes(lq) || (s.notes||"").toLowerCase().includes(lq))
        r.push({ type: "spirit",   item: s, label: s.name, sub: s.notes || "" });
    });
    beers.forEach(b => {
      if (b.name.toLowerCase().includes(lq) || (b.notes||"").toLowerCase().includes(lq))
        r.push({ type: "beer",     item: b, label: b.name, sub: b.notes || "" });
    });
    setResults(r.slice(0, 10));
    setOpen(r.length > 0);
  };

  const handleAdd = entry => {
    onAdd(entry);
    setQ("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        value={q}
        onChange={e => { setQ(e.target.value); search(e.target.value); }}
        onFocus={() => results.length && setOpen(true)}
        placeholder="search beverages…"
        autoComplete="off"
        style={{ ...baseInp, fontSize: MOBILE_SAFE_INPUT_SIZE, padding: "9px 12px", letterSpacing: 0.3 }}
      />
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #e8e8e8", borderRadius: 4,
          zIndex: 300, boxShadow: "0 6px 24px rgba(0,0,0,0.10)", overflow: "hidden",
        }}>
          {results.map((r, i) => {
            const ts = BEV_TYPES[r.type];
            return (
              <div key={i} onMouseDown={() => handleAdd(r)} style={{
                padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f8f8f8",
                display: "flex", alignItems: "center", gap: 10,
                background: "#fff",
              }}>
                <span style={{
                  fontFamily: FONT, fontSize: 8, letterSpacing: 1, fontWeight: 600,
                  padding: "2px 6px", borderRadius: 2,
                  color: ts.color, background: ts.bg, border: `1px solid ${ts.border}`,
                  flexShrink: 0, textTransform: "uppercase",
                }}>{ts.label}</span>
                <span style={{ fontFamily: FONT, fontSize: 12, color: "#1a1a1a", flex: 1 }}>{r.label}</span>
                {r.sub && <span style={{ fontFamily: FONT, fontSize: 11, color: "#999" }}>{r.sub}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Drink List Editor (used inside AdminPanel tabs) ───────────────────────────
function DrinkListEditor({ list, setList, newItem, setNewItem, nextId, label }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 28px", gap: 8, marginBottom: 8 }}>
        {["Name", "Notes / Label", ""].map((h, i) => (
          <div key={i} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, color: "#666", textTransform: "uppercase" }}>{h}</div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #f0f0f0", marginBottom: 12 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 24 }}>
        {list.map(item => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 28px", gap: 8, alignItems: "center" }}>
            <input value={item.name} onChange={e => setList(l => l.map(x => x.id === item.id ? { ...x, name: e.target.value } : x))}
              style={{ ...baseInp, padding: "5px 8px" }} placeholder="Name" />
            <input value={item.notes} onChange={e => setList(l => l.map(x => x.id === item.id ? { ...x, notes: e.target.value } : x))}
              style={{ ...baseInp, padding: "5px 8px" }} placeholder="e.g. classic / on the rocks" />
            <button onClick={() => setList(l => l.filter(x => x.id !== item.id))} style={{
              background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0,
            }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
        <div style={fieldLabel}>Add {label}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <input value={newItem.name} onChange={e => setNewItem(x => ({ ...x, name: e.target.value }))}
            placeholder="Name" style={{ ...baseInp, padding: "5px 8px" }} />
          <input value={newItem.notes} onChange={e => setNewItem(x => ({ ...x, notes: e.target.value }))}
            placeholder="Notes (optional)" style={{ ...baseInp, padding: "5px 8px" }}
            onKeyDown={e => { if (e.key === "Enter" && newItem.name.trim()) { setList(l => [...l, { ...newItem, id: nextId.current++ }]); setNewItem({ name: "", notes: "" }); }}} />
        </div>
        <button onClick={() => { if (!newItem.name.trim()) return; setList(l => [...l, { ...newItem, id: nextId.current++ }]); setNewItem({ name: "", notes: "" }); }} style={{
          fontFamily: FONT, fontSize: 10, letterSpacing: 2, padding: "8px 20px",
          border: "1px solid #1a1a1a", borderRadius: 2, cursor: "pointer", background: "#1a1a1a", color: "#fff",
        }}>+ ADD {label.toUpperCase()}</button>
      </div>
    </>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ dishes, wines, cocktails, spirits, beers, onUpdateDishes, onUpdateWines, onSaveBeverages, onClose }) {
  const [tab, setTab] = useState("wines");
  const isMobile = useIsMobile(700);

  // ── Dishes ──
  const [localDishes, setLocalDishes] = useState(dishes.map(d => ({ ...d, pairings: [...d.pairings] })));
  const [newDishName, setNewDishName] = useState("");
  const nextDishId = useRef(Math.max(...dishes.map(d => d.id), 0) + 1);
  const addDish = () => { if (!newDishName.trim()) return; setLocalDishes(l => [...l, { id: nextDishId.current++, name: newDishName.trim(), pairings: ["—", "Wine", "Non-Alc"] }]); setNewDishName(""); };
  const removeDish    = id         => setLocalDishes(l => l.filter(d => d.id !== id));
  const updDishName   = (id, v)    => setLocalDishes(l => l.map(d => d.id === id ? { ...d, name: v } : d));
  const addPairing    = id         => setLocalDishes(l => l.map(d => d.id === id ? { ...d, pairings: [...d.pairings, ""] } : d));
  const updPairing    = (id, i, v) => setLocalDishes(l => l.map(d => d.id === id ? { ...d, pairings: d.pairings.map((p, idx) => idx === i ? v : p) } : d));
  const removePairing = (id, i)    => setLocalDishes(l => l.map(d => d.id === id ? { ...d, pairings: d.pairings.filter((_, idx) => idx !== i) } : d));

  // ── Wines ──
  const [localWines, setLocalWines] = useState(wines.map(w => ({ ...w })));
  const [newWine, setNewWine] = useState({ name: "", producer: "", vintage: "", byGlass: false });
  const nextWineId = useRef(Math.max(...wines.map(w => w.id), 0) + 1);
  const addWine    = () => { if (!newWine.name.trim()) return; setLocalWines(l => [...l, { ...newWine, id: nextWineId.current++ }]); setNewWine({ name: "", producer: "", vintage: "", byGlass: false }); };
  const removeWine = id       => setLocalWines(l => l.filter(w => w.id !== id));
  const updWine    = (id,f,v) => setLocalWines(l => l.map(w => w.id === id ? { ...w, [f]: v } : w));

  // ── Cocktails ──
  const [localCocktails, setLocalCocktails] = useState(cocktails.map(c => ({ ...c })));
  const [newCocktail, setNewCocktail] = useState({ name: "", notes: "" });
  const nextCocktailId = useRef(Math.max(...cocktails.map(c => c.id), 0) + 1);
  const addCocktail    = () => { if (!newCocktail.name.trim()) return; setLocalCocktails(l => [...l, { ...newCocktail, id: nextCocktailId.current++ }]); setNewCocktail({ name: "", notes: "" }); };
  const removeCocktail = id      => setLocalCocktails(l => l.filter(c => c.id !== id));
  const updCocktail    = (id,f,v) => setLocalCocktails(l => l.map(c => c.id === id ? { ...c, [f]: v } : c));

  // ── Spirits ──
  const [localSpirits, setLocalSpirits] = useState(spirits.map(s => ({ ...s })));
  const [newSpirit, setNewSpirit] = useState({ name: "", notes: "" });
  const nextSpiritId = useRef(Math.max(...spirits.map(s => s.id), 0) + 1);
  const addSpirit    = () => { if (!newSpirit.name.trim()) return; setLocalSpirits(l => [...l, { ...newSpirit, id: nextSpiritId.current++ }]); setNewSpirit({ name: "", notes: "" }); };
  const removeSpirit = id      => setLocalSpirits(l => l.filter(s => s.id !== id));
  const updSpirit    = (id,f,v) => setLocalSpirits(l => l.map(s => s.id === id ? { ...s, [f]: v } : s));

  // ── Beers ──
  const [localBeers, setLocalBeers] = useState(beers.map(b => ({ ...b })));
  const [newBeer, setNewBeer] = useState({ name: "", notes: "" });
  const nextBeerId = useRef(Math.max(...beers.map(b => b.id), 0) + 1);
  const addBeer    = () => { if (!newBeer.name.trim()) return; setLocalBeers(l => [...l, { ...newBeer, id: nextBeerId.current++ }]); setNewBeer({ name: "", notes: "" }); };
  const removeBeer = id      => setLocalBeers(l => l.filter(b => b.id !== id));
  const updBeer    = (id,f,v) => setLocalBeers(l => l.map(b => b.id === id ? { ...b, [f]: v } : b));

  const handleSave = () => {
    onUpdateDishes(localDishes);
    onUpdateWines(localWines);
    onSaveBeverages({ cocktails: localCocktails, spirits: localSpirits, beers: localBeers });
    onClose();
  };

  const TABS = ["wines", "cocktails", "spirits", "beers", "dishes"];
  const tabBtn = t => ({
    fontFamily: FONT, fontSize: 10, letterSpacing: 2, padding: "9px 18px",
    border: "none", cursor: "pointer", textTransform: "uppercase", transition: "all 0.1s",
    background: tab === t ? "#1a1a1a" : "#fff",
    color: tab === t ? "#fff" : "#444",
    borderBottom: tab === t ? "none" : "1px solid #e8e8e8",
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(4px)", zIndex: 500,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderTop: "1px solid #e8e8e8",
        borderRadius: "12px 12px 0 0",
        width: "100%", maxWidth: 580,
        maxHeight: "92vh", overflow: "hidden",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.10)",
        display: "flex", flexDirection: "column",
      }} onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e0e0e0", margin: "12px auto 0" }} />

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #e8e8e8", flexShrink: 0, marginTop: 8, overflowX: "auto" }}>
          {TABS.map(t => <button key={t} style={tabBtn(t)} onClick={() => setTab(t)}>{t}</button>)}
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", padding: isMobile ? "20px 16px" : "24px 28px", flex: 1, overflowX: "hidden" }}>

          {/* ── Wines tab ── */}
          {tab === "wines" && (
            <>
              {/* Wine rows */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 70px 52px 28px", gap: 8, marginBottom: 8 }}>
                {(isMobile ? ["Name", "Producer"] : ["Name", "Producer", "Vintage", "Glass", ""]).map((h, i) => (
                  <div key={i} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, color: "#666", textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #f0f0f0", marginBottom: 10 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
                {localWines.map(w => (
                  <div key={w.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr auto" : "1fr 1fr 70px 52px 28px", gap: 8, alignItems: "center" }}>
                    <input value={w.name} onChange={e => updWine(w.id, "name", e.target.value)} style={{ ...baseInp, padding: "5px 8px" }} placeholder="Name" />
                    <input value={w.producer} onChange={e => updWine(w.id, "producer", e.target.value)} style={{ ...baseInp, padding: "5px 8px" }} placeholder="Producer" />
{!isMobile && <input value={w.vintage} onChange={e => updWine(w.id, "vintage", e.target.value)} style={{ ...baseInp, padding: "5px 8px" }} placeholder="2020" />}
                    <button onClick={() => updWine(w.id, "byGlass", !w.byGlass)} style={{
                      fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "5px 6px", border: "1px solid",
                      borderColor: w.byGlass ? "#aaddaa" : "#e8e8e8", borderRadius: 2, cursor: "pointer",
                      background: w.byGlass ? "#f0faf0" : "#fff", color: w.byGlass ? "#4a8a4a" : "#555",
                    }}>{w.byGlass ? "YES" : "NO"}</button>
                    <button onClick={() => removeWine(w.id)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                <div style={fieldLabel}>Add wine</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 70px 52px", gap: 8, marginBottom: 10 }}>
                  <input value={newWine.name} onChange={e => setNewWine(w => ({ ...w, name: e.target.value }))} placeholder="Name" style={{ ...baseInp, padding: "5px 8px" }} />
                  <input value={newWine.producer} onChange={e => setNewWine(w => ({ ...w, producer: e.target.value }))} placeholder="Producer" style={{ ...baseInp, padding: "5px 8px" }} />
                  {!isMobile && <input value={newWine.vintage} onChange={e => setNewWine(w => ({ ...w, vintage: e.target.value }))} placeholder="2020" style={{ ...baseInp, padding: "5px 8px" }} />}
                  <button onClick={() => setNewWine(w => ({ ...w, byGlass: !w.byGlass }))} style={{
                    fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "5px 6px", border: "1px solid",
                    borderColor: newWine.byGlass ? "#aaddaa" : "#e8e8e8", borderRadius: 2, cursor: "pointer",
                    background: newWine.byGlass ? "#f0faf0" : "#fff", color: newWine.byGlass ? "#4a8a4a" : "#555",
                  }}>{newWine.byGlass ? "YES" : "NO"}</button>
                </div>
                <button onClick={addWine} style={{
                  fontFamily: FONT, fontSize: 10, letterSpacing: 2, padding: "8px 20px",
                  border: "1px solid #1a1a1a", borderRadius: 2, cursor: "pointer", background: "#1a1a1a", color: "#fff",
                }}>+ ADD WINE</button>
              </div>
            </>
          )}

          {tab === "cocktails" && (
            <DrinkListEditor list={localCocktails} setList={setLocalCocktails}
              newItem={newCocktail} setNewItem={setNewCocktail}
              nextId={nextCocktailId} label="cocktail" />
          )}

          {tab === "spirits" && (
            <DrinkListEditor list={localSpirits} setList={setLocalSpirits}
              newItem={newSpirit} setNewItem={setNewSpirit}
              nextId={nextSpiritId} label="spirit" />
          )}

          {tab === "beers" && (
            <DrinkListEditor list={localBeers} setList={setLocalBeers}
              newItem={newBeer} setNewItem={setNewBeer}
              nextId={nextBeerId} label="beer" />
          )}

          {tab === "dishes" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                {localDishes.map(dish => (
                  <div key={dish.id} style={{ border: "1px solid #f0f0f0", borderRadius: 2, padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                      <input value={dish.name} onChange={e => updDishName(dish.id, e.target.value)} style={{ ...baseInp, fontWeight: 500, flex: 1 }} />
                      <button onClick={() => removeDish(dish.id)} style={{ background: "none", border: "1px solid #ffcccc", borderRadius: 2, color: "#e07070", cursor: "pointer", fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "6px 10px" }}>REMOVE</button>
                    </div>
                    <div style={{ ...fieldLabel, marginBottom: 8 }}>Pairing options</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {dish.pairings.map((p, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <input value={p} onChange={e => updPairing(dish.id, idx, e.target.value)}
                            style={{ fontFamily: FONT, fontSize: 11, padding: "4px 8px", border: "1px solid #e8e8e8", borderRadius: 2, width: 80, outline: "none", color: "#1a1a1a", background: "#fafafa" }} />
                          {dish.pairings.length > 1 && (
                            <button onClick={() => removePairing(dish.id, idx)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addPairing(dish.id)} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "4px 9px", border: "1px solid #e0e0e0", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#444" }}>+ option</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 18 }}>
                <div style={fieldLabel}>Add dish</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={newDishName} onChange={e => setNewDishName(e.target.value)} onKeyDown={e => e.key === "Enter" && addDish()} placeholder="Dish name…" style={{ ...baseInp, flex: 1 }} />
                  <button onClick={addDish} style={{ fontFamily: FONT, fontSize: 10, letterSpacing: 2, padding: "8px 16px", border: "1px solid #1a1a1a", borderRadius: 2, cursor: "pointer", background: "#1a1a1a", color: "#fff", whiteSpace: "nowrap" }}>+ ADD</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, padding: "14px 28px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, fontFamily: FONT, fontSize: 10, letterSpacing: 2, padding: "10px", border: "1px solid #e8e8e8", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#444" }}>CANCEL</button>
          <button onClick={handleSave} style={{ flex: 2, fontFamily: FONT, fontSize: 10, letterSpacing: 2, padding: "10px", border: "1px solid #1a1a1a", borderRadius: 2, cursor: "pointer", background: "#1a1a1a", color: "#fff" }}>SAVE</button>
        </div>
      </div>
    </div>
  );
}
// ── Reservation Modal ─────────────────────────────────────────────────────────
function ReservationModal({ table, tables = [], onSave, onClose }) {
  const isMobile = useIsMobile(700);
  const [tableId, setTableId]     = useState(table.id);
  const [name, setName]           = useState(table.resName || "");
  const [time, setTime]           = useState(table.resTime || "");
  const [menuType, setMenuType]   = useState(table.menuType || "");
  const [guests, setGuests]       = useState(table.guests || 2);
  const [guestType, setGuestType] = useState(table.guestType || "");
  const [room, setRoom]           = useState(table.room || "");
  const [birthday, setBirthday]   = useState(table.birthday || false);
  const [restrictions, setRestrictions] = useState(table.restrictions || []);
  const [notes, setNotes]         = useState(table.notes || "");

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(4px)", zIndex: 500,
      display: "flex", alignItems: "flex-end",
      justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderTop: "1px solid #e8e8e8",
        borderRadius: "12px 12px 0 0",
        padding: "24px 20px 32px",
        width: "100%", maxWidth: 520,
        maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.10)",
      }} onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e0e0e0", margin: "0 auto 20px" }} />

        <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#666", marginBottom: 16 }}>
          TABLE · RESERVATION
        </div>

        {/* Table picker */}
        <div style={{ marginBottom: 20 }}>
          <div style={fieldLabel}>Table</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(tid => {
              const tObj    = tables.find(t => t.id === tid);
              const isActive   = tObj?.active;
              const isBooked   = tObj && (tObj.resName || tObj.resTime) && tObj.id !== table.id;
              const isSel   = tableId === tid;
              return (
                <button key={tid}
                  onClick={() => { if (!isActive) setTableId(tid); }}
                  disabled={isActive}
                  title={isActive ? "Table is currently seated" : isBooked ? `Reserved: ${tObj.resName || tObj.resTime}` : ""}
                  style={{
                    fontFamily: FONT, fontSize: 13, fontWeight: 500, letterSpacing: 1,
                    padding: "12px 0", border: "1px solid",
                    borderColor: isSel ? "#1a1a1a" : isActive ? "#f0f0f0" : isBooked ? "#f0c8a8" : "#e8e8e8",
                    borderRadius: 2, cursor: isActive ? "not-allowed" : "pointer",
                    background: isSel ? "#1a1a1a" : isActive ? "#f8f8f8" : isBooked ? "#fff8f2" : "#fff",
                    color: isSel ? "#fff" : isActive ? "#ccc" : isBooked ? "#c07840" : "#444",
                    transition: "all 0.1s",
                  }}>
                  T{String(tid).padStart(2, "0")}
                </button>
              );
            })}
          </div>
          {tables.find(t => t.id === tableId && (t.resName || t.resTime) && t.id !== table.id) && (
            <div style={{ fontFamily: FONT, fontSize: 10, color: "#c07840", marginTop: 6, letterSpacing: 0.5 }}>
              ⚠ This table already has a reservation — saving will overwrite it
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={fieldLabel}>Name</div>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Guest name…" style={baseInp} />
          </div>

          <div>
            <div style={fieldLabel}>Sitting</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {["18:00","18:30","19:00","19:15"].map(t => (
                <button key={t} onClick={() => setTime(t)} style={{
                  fontFamily: FONT, fontSize: 13, letterSpacing: 1,
                  padding: "14px 0", flex: 1, border: "1px solid",
                  borderColor: time === t ? "#1a1a1a" : "#e8e8e8",
                  borderRadius: 2, cursor: "pointer",
                  background: time === t ? "#1a1a1a" : "#fff",
                  color: time === t ? "#fff" : "#888",
                  transition: "all 0.12s",
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={fieldLabel}>Menu</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["Long", "Short"].map(opt => (
                  <button key={opt} onClick={() => setMenuType(m => m === opt ? "" : opt)} style={{
                    fontFamily: FONT, fontSize: 10, letterSpacing: 2,
                    padding: "10px 24px", border: "1px solid",
                    borderColor: menuType === opt ? "#1a1a1a" : "#e8e8e8",
                    borderRadius: 2, cursor: "pointer",
                    background: menuType === opt ? "#1a1a1a" : "#fff",
                    color: menuType === opt ? "#fff" : "#888",
                    textTransform: "uppercase",
                  }}>{opt}</button>
                ))}
              </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "120px 1fr", gap: 16, alignItems: "flex-start" }}>
            <div>
              <div style={fieldLabel}>Guests</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button onClick={() => setGuests(g => Math.max(1, g-1))} style={circBtnSm}>−</button>
                <span style={{ fontFamily: FONT, fontSize: 18, color: "#1a1a1a", minWidth: 20, textAlign: "center" }}>{guests}</span>
                <button onClick={() => setGuests(g => Math.min(14, g+1))} style={circBtnSm}>+</button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={fieldLabel}>Guest Type</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["hotel","outside"].map(type => (
                  <button key={type} onClick={() => { setGuestType(t => t === type ? "" : type); setRoom(""); }} style={{
                    fontFamily: FONT, fontSize: 11, letterSpacing: 1,
                    padding: "12px 0", flex: 1, border: "1px solid",
                    borderColor: guestType === type ? "#1a1a1a" : "#e8e8e8",
                    borderRadius: 2, cursor: "pointer",
                    background: guestType === type ? "#1a1a1a" : "#fff",
                    color: guestType === type ? "#fff" : "#444",
                    transition: "all 0.12s", textTransform: "uppercase",
                  }}>{type}</button>
                ))}
              </div>
              {guestType === "hotel" && (
                <div style={{ marginTop: 12 }}>
                  <div style={fieldLabel}>Room</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["01","11","12","21","22","23"].map(r => (
                      <button key={r} onClick={() => setRoom(x => x === r ? "" : r)} style={{
                        fontFamily: FONT, fontSize: 13, fontWeight: 500, letterSpacing: 1,
                        padding: "12px 16px", border: "1px solid",
                        borderColor: room === r ? "#c8a06e" : "#e8e8e8",
                        borderRadius: 2, cursor: "pointer",
                        background: room === r ? "#fdf6ec" : "#fff",
                        color: room === r ? "#a07040" : "#444",
                        transition: "all 0.12s",
                      }}>{r}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f0f0f0" }} />

          <div>
            <div style={fieldLabel}>🎂 Birthday Cake</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[true,false].map(val => (
                <button key={String(val)} onClick={() => setBirthday(val)} style={{
                  fontFamily: FONT, fontSize: 12, letterSpacing: 1,
                  padding: "14px 0", flex: 1, border: "1px solid",
                  borderColor: birthday === val ? (val ? "#d4b888" : "#e8e8e8") : "#e8e8e8",
                  borderRadius: 2, cursor: "pointer",
                  background: birthday === val ? (val ? "#fdf8f0" : "#fafafa") : "#fff",
                  color: birthday === val ? (val ? "#a07040" : "#1a1a1a") : "#555",
                  transition: "all 0.12s",
                }}>{val ? "YES" : "NO"}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ ...fieldLabel, marginBottom: 0 }}>⚠️ Restrictions</div>
              <button onClick={() => setRestrictions(r => [...r, { pos: null, note: "" }])} style={{
                fontFamily: FONT, fontSize: 11, letterSpacing: 1,
                padding: "8px 14px", border: "1px solid #e0e0e0",
                borderRadius: 2, cursor: "pointer", background: "#fff", color: "#1a1a1a",
              }}>+ add</button>
            </div>
            {restrictions.length === 0 && <div style={{ fontFamily: FONT, fontSize: 12, color: "#ddd" }}>none</div>}
            {restrictions.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <input value={r.note}
                  onChange={e => setRestrictions(rs => rs.map((x, idx) => idx === i ? { ...x, note: e.target.value } : x))}
                  placeholder="e.g. no gluten, vegetarian…"
                  style={{ ...baseInp, flex: 1, borderColor: r.note ? "#f0c0c088" : "#e8e8e8" }} />
                <button onClick={() => setRestrictions(rs => rs.filter((_, idx) => idx !== i))} style={{
                  background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "0 4px",
                }}>×</button>
              </div>
            ))}
          </div>

          <div>
            <div style={fieldLabel}>📝 Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="VIP, pace, special requests…"
              style={{ ...baseInp, minHeight: 72, resize: "vertical", lineHeight: 1.5 }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          <button onClick={onClose} style={{
            flex: 1, fontFamily: FONT, fontSize: 12, letterSpacing: 2,
            padding: "14px", border: "1px solid #e8e8e8", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#444",
          }}>CANCEL</button>
          <button onClick={() => onSave({ tableId, name, time, menuType, guests, guestType, room, birthday, restrictions, notes })} style={{
            flex: 2, fontFamily: FONT, fontSize: 12, letterSpacing: 2,
            padding: "14px", border: "1px solid #1a1a1a", borderRadius: 2, cursor: "pointer", background: "#1a1a1a", color: "#fff",
          }}>SAVE</button>
        </div>
      </div>
    </div>
  );
}


// ── Sitting time rows layout constant ─────────────────────────────────────────
const SITTING_TIMES = ["18:00", "18:30", "19:00"];

// ── Table Card ────────────────────────────────────────────────────────────────
function Card({ table, mode, onClick, onSeat, onUnseat, onClear, onEditRes }) {
  const hasRes = table.resName || table.resTime;
  return (
    <div style={{
      background: "#fff",
      border: "1px solid",
      borderColor: table.active ? "#d0d0d0" : hasRes ? "#e4e4e4" : "#f0f0f0",
      borderRadius: 4,
      padding: "20px 18px 16px",
      cursor: table.active ? "pointer" : "default",
      display: "flex", flexDirection: "column", gap: 10,
      minHeight: 190,
      opacity: !table.active && !hasRes ? 0.35 : 1,
      boxShadow: table.active ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
    }} onClick={onClick}>

      {/* ── Top row: table number + status badges ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{
          fontFamily: FONT, fontSize: 28, fontWeight: 300, letterSpacing: 1,
          color: table.active ? "#1a1a1a" : "#888", lineHeight: 1,
        }}>
          {String(table.id).padStart(2, "0")}
        </span>
        <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "65%" }}>
          {table.birthday && <span style={{ fontSize: 13 }}>🎂</span>}
          {table.restrictions?.length > 0 && <span style={{ fontSize: 13 }}>⚠️</span>}
          {table.guestType === "hotel" && (
            <span style={{ fontFamily: FONT, fontSize: 9, color: "#1a1a1a", letterSpacing: 1, border: "1px solid #e0e0e0", borderRadius: 2, padding: "2px 6px", background: "#fafafa" }}>
              {table.room ? `Hotel #${table.room}` : "Hotel"}
            </span>
          )}
          {table.menuType && (
            <span style={{ fontFamily: FONT, fontSize: 9, color: "#1a1a1a", letterSpacing: 1, border: "1px solid #e0e0e0", borderRadius: 2, padding: "2px 6px", background: "#fafafa" }}>
              {table.menuType} menu
            </span>
          )}
          {table.pace && (() => {
            const pc = { Slow: { color: "#7a5020", bg: "#fdf4e8", border: "#c8a060" }, Fast: { color: "#6a2a2a", bg: "#fdf0f0", border: "#d08888" } }[table.pace] || {};
            return <span style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 1, border: `1px solid ${pc.border}`, borderRadius: 2, padding: "2px 6px", background: pc.bg, color: pc.color }}>{table.pace}</span>;
          })()}
          {table.active && (
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4a9a6a", display: "inline-block" }} />
          )}
        </div>
      </div>

      {/* ── Reservation info ── */}
      {hasRes && (
        <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {table.resName && (
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: "#1a1a1a", letterSpacing: 0.3 }}>
              {table.resName}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {table.resTime && (
              <span style={{ fontFamily: FONT, fontSize: 11, color: "#555" }}>res. {table.resTime}</span>
            )}
            {table.arrivedAt && (
              <span style={{ fontFamily: FONT, fontSize: 11, color: "#4a9a6a", fontWeight: 500 }}>arr. {table.arrivedAt}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Active table info ── */}
      {table.active && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, color: "#777", letterSpacing: 0.5 }}>
            {table.guests} {table.guests === 1 ? "guest" : "guests"}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {table.seats.map(s => (
              <div key={s.id} style={{
                width: 9, height: 9, borderRadius: "50%",
                background: s.pairing ? (pairingStyle[s.pairing]?.color || "#d8d8d8") : "#d8d8d8",
              }} />
            ))}
          </div>
          {table.notes && (
            <div style={{ fontFamily: FONT, fontSize: 10, color: "#888", fontStyle: "italic", lineHeight: 1.4 }}>{table.notes}</div>
          )}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ marginTop: "auto", display: "flex", gap: 6, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
        {!table.active && mode === "admin" && (
          <button onClick={onEditRes} style={{
            fontFamily: FONT, fontSize: 10, letterSpacing: 1, padding: "5px 10px",
            border: "1px solid #e0e0e0", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#555",
          }}>{hasRes ? "edit" : "reserve"}</button>
        )}
        {!table.active && hasRes && (
          <button onClick={onSeat} style={{
            fontFamily: FONT, fontSize: 10, letterSpacing: 1, padding: "5px 10px",
            border: "1px solid #b8ddb8", borderRadius: 2, cursor: "pointer", background: "#f4fbf4", color: "#4a8a4a",
          }}>seat</button>
        )}
        {table.active && mode === "admin" && (
          <button onClick={onUnseat} style={{
            fontFamily: FONT, fontSize: 10, letterSpacing: 1, padding: "5px 10px",
            border: "1px solid #d8d8d8", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#666",
          }}>unseat</button>
        )}
        {table.active && mode === "admin" && (
          <button onClick={onClear} style={{
            fontFamily: FONT, fontSize: 10, letterSpacing: 1, padding: "5px 10px",
            border: "1px solid #f0c0c0", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#c06060",
          }}>clear</button>
        )}
      </div>
    </div>
  );
}

// ── Detail View ───────────────────────────────────────────────────────────────
function Detail({ table, dishes, wines = [], cocktails = [], spirits = [], beers = [], mode, onBack, upd, updSeat, setGuests, swapSeats }) {
  const isMobile = useIsMobile(860);
  const row1 = isMobile ? "34px 68px 1fr 28px" : "38px 75px 1fr 28px";

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "20px 12px 28px" : "24px 16px", overflowX: "hidden" }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: FONT, fontSize: 11, color: "#666", letterSpacing: 1, padding: 0, marginBottom: 28, display: "block",
      }}>← all tables</button>

      {/* Table number + guest count */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#555", marginBottom: 6 }}>TABLE</div>
          <div style={{ fontFamily: FONT, fontSize: 48, fontWeight: 300, color: "#1a1a1a", lineHeight: 1 }}>
            {String(table.id).padStart(2, "0")}
          </div>
        </div>
        {mode === "admin" && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <button onClick={() => setGuests(Math.max(1, table.guests - 1))} style={circBtnSm}>−</button>
            <span style={{ fontFamily: FONT, fontSize: 11, color: "#444", letterSpacing: 1, minWidth: 70, textAlign: "center" }}>
              {table.guests} guests
            </span>
            <button onClick={() => setGuests(Math.min(14, table.guests + 1))} style={circBtnSm}>+</button>
          </div>
        )}
        {mode === "service" && (
          <span style={{ fontFamily: FONT, fontSize: 11, color: "#444", letterSpacing: 1, marginBottom: 6 }}>
            {table.guests} guests
          </span>
        )}
      </div>

      {/* Reservation strip */}
      {(table.resName || table.resTime || table.arrivedAt || table.menuType) && (
        <div style={{
          display: "grid", gap: 14, alignItems: "start",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(160px, max-content))",
          padding: isMobile ? "12px" : "10px 14px", background: "#fafafa", border: "1px solid #f0f0f0",
          borderRadius: 2, marginBottom: 28,
        }}>
          {table.resName && (
            <div>
              <div style={{ ...fieldLabel, marginBottom: 2 }}>Name</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: "#1a1a1a" }}>
                {table.resName}
                {table.guestType && <span style={{ fontFamily: FONT, fontSize: 9, color: "#444", marginLeft: 8, letterSpacing: 1, textTransform: "uppercase" }}>{table.guestType}</span>}
                {table.guestType === "hotel" && table.room && <span style={{ fontFamily: FONT, fontSize: 11, color: "#a07040", marginLeft: 6, letterSpacing: 1 }}>· Hotel #{table.room}</span>}
              </div>
            </div>
          )}
          {table.resTime && (
            <div>
              <div style={{ ...fieldLabel, marginBottom: 2 }}>Reserved</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: "#1a1a1a" }}>{table.resTime}</div>
            </div>
          )}
          {table.menuType && (
            <div>
              <div style={{ ...fieldLabel, marginBottom: 2 }}>Menu</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: "#1a1a1a" }}>{table.menuType}</div>
            </div>
          )}
          {table.arrivedAt && (
            <div>
              <div style={{ ...fieldLabel, marginBottom: 2 }}>Arrived</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: "#4a9a6a" }}>{table.arrivedAt}</div>
            </div>
          )}
        </div>
      )}

      {/* Quick set water for all seats */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "10px 12px", background: "#fafafa", borderRadius: 4, border: "1px solid #f0f0f0" }}>
        <span style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, color: "#888", textTransform: "uppercase", flexShrink: 0 }}>All water</span>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {WATER_OPTS.map(opt => (
            <button key={opt} onClick={() => table.seats.forEach(s => updSeat(s.id, "water", opt))} style={{
              fontFamily: FONT, fontSize: 11, letterSpacing: 0.5,
              padding: "5px 10px", border: "1px solid",
              borderColor: table.seats.every(s => s.water === opt) ? "#1a1a1a" : "#e0e0e0",
              borderRadius: 2, cursor: "pointer",
              background: table.seats.every(s => s.water === opt) ? "#1a1a1a" : "#fff",
              color: table.seats.every(s => s.water === opt) ? "#fff" : "#555",
              transition: "all 0.1s",
            }}>{opt}</button>
          ))}
        </div>
      </div>

      {/* Column header row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: row1, gap: 10, alignItems: "center", marginBottom: 4 }}>
        {["", "Water", "Pairing", ""].map((h, i) => (
          <div key={i} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, color: "#555", textTransform: "uppercase" }}>{h}</div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #f0f0f0", marginBottom: 2 }} />

      {/* Seat rows */}
      {table.seats.map((seat, si) => {
        const glasses   = seat.glasses   || [];
        const cocktailList = seat.cocktails || [];
        const spiritList   = seat.spirits   || [];
        const seatRestrictions = (table.restrictions || []).filter(r => r.pos === seat.id);
        return (
          <div key={seat.id} style={{
            borderBottom: si < table.seats.length - 1 ? "1px solid #f5f5f5" : "none",
            padding: "10px 0",
          }}>
            {/* ── Line 1: P · [restrictions] · Water · Pairing · Swap ── */}
            <div style={{ display: "grid", gridTemplateColumns: row1, gap: 10, alignItems: "start", marginBottom: 8 }}>
              {/* P bubble */}
              <div style={{
                width: 30, height: 30, borderRadius: "50%", border: "1px solid #ebebeb",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT, fontSize: 9, color: "#444", letterSpacing: 0.5, flexShrink: 0,
                marginTop: 2,
              }}>P{seat.id}</div>

              {/* Water */}
              <WaterPicker value={seat.water} onChange={v => updSeat(seat.id, "water", v)} />

              {/* Pairing */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {PAIRINGS.map(p => {
                  const ps = pairingStyle[p];
                  const on = seat.pairing === p;
                  return (
                    <button key={p} onClick={() => updSeat(seat.id, "pairing", p)} style={{
                      fontFamily: FONT, fontSize: 9, letterSpacing: 0.5,
                      padding: "5px 8px", border: "1px solid",
                      borderColor: on ? ps.border : "#ebebeb", borderRadius: 2, cursor: "pointer",
                      background: on ? ps.bg : "#fff", color: on ? ps.color : "#555",
                      transition: "all 0.1s",
                    }}>{p}</button>
                  );
                })}
                {/* Restriction tags inline */}
                {seatRestrictions.map((r, i) => (
                  <span key={i} style={{
                    fontFamily: FONT, fontSize: 9, letterSpacing: 0.5,
                    padding: "4px 8px", borderRadius: 2,
                    background: "#fff5f5", border: "1px solid #f0c0c0",
                    color: "#c07070", whiteSpace: "nowrap",
                  }}>⚠ {r.note}</span>
                ))}
              </div>

              {/* Swap */}
              {table.seats.length > 1
                ? <SwapPicker seatId={seat.id} totalSeats={table.seats.length} onSwap={t => swapSeats(seat.id, t)} />
                : <div />}
            </div>
            {/* ── Beverages + Extras ── */}
            <div style={{ paddingLeft: isMobile ? 0 : 48, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Unified beverage search */}
              <div style={{ background: "#fcfcfc", border: "1px solid #ececec", borderRadius: 8, padding: isMobile ? "10px" : "12px" }}>
                <div style={{ ...fieldLabel, marginBottom: 8, color: "#444" }}>Beverages</div>
                <BeverageSearch
                  wines={wines} cocktails={cocktails} spirits={spirits} beers={beers}
                  onAdd={({ type, item }) => {
                    if (type === "wine")     updSeat(seat.id, "glasses",   [...(seat.glasses   || []), item]);
                    if (type === "cocktail") updSeat(seat.id, "cocktails", [...(seat.cocktails || []), item]);
                    if (type === "spirit")   updSeat(seat.id, "spirits",   [...(seat.spirits   || []), item]);
                    if (type === "beer")     updSeat(seat.id, "beers",     [...(seat.beers     || []), item]);
                  }}
                />
                {/* Added beverages as chips */}
                {(() => {
                  const allBevs = [
                    ...(seat.glasses   || []).map((x, i) => ({ key: `g${i}`,  type: "wine",     label: x?.name, sub: x?.producer, onRemove: () => updSeat(seat.id, "glasses",   (seat.glasses||[]).filter((_,idx)=>idx!==i)) })),
                    ...(seat.cocktails || []).map((x, i) => ({ key: `c${i}`,  type: "cocktail", label: x?.name, sub: x?.notes,    onRemove: () => updSeat(seat.id, "cocktails", (seat.cocktails||[]).filter((_,idx)=>idx!==i)) })),
                    ...(seat.spirits   || []).map((x, i) => ({ key: `s${i}`,  type: "spirit",   label: x?.name, sub: x?.notes,    onRemove: () => updSeat(seat.id, "spirits",   (seat.spirits||[]).filter((_,idx)=>idx!==i)) })),
                    ...(seat.beers     || []).map((x, i) => ({ key: `b${i}`,  type: "beer",     label: x?.name, sub: x?.notes,    onRemove: () => updSeat(seat.id, "beers",     (seat.beers||[]).filter((_,idx)=>idx!==i)) })),
                  ];
                  if (allBevs.length === 0) return null;
                  return (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {allBevs.map(bev => {
                        const ts = BEV_TYPES[bev.type];
                        return (
                          <div key={bev.key} style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "4px 8px 4px 10px", borderRadius: 999,
                            background: ts.bg, border: `1px solid ${ts.border}`,
                          }}>
                            <span style={{ fontFamily: FONT, fontSize: 11, color: ts.color, fontWeight: 500, whiteSpace: "nowrap" }}>
                              {bev.label}{bev.sub ? ` · ${bev.sub}` : ""}
                            </span>
                            <button onClick={bev.onRemove} style={{ background: "none", border: "none", color: ts.color, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 0 0 2px", opacity: 0.7 }}>×</button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Extra dishes */}
              {dishes.length > 0 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {dishes.map(dish => {
                    const extra = seat.extras?.[dish.id] || { ordered: false, pairing: dish.pairings[0] };
                    return (
                      <div key={dish.id} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 88 }}>
                        <div style={{ ...fieldLabel, marginBottom: 4 }}>{dish.name}</div>
                        <button onClick={() => updSeat(seat.id, "extras", {
                          ...seat.extras, [dish.id]: { ...extra, ordered: !extra.ordered }
                        })} style={{
                          fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "5px 8px", border: "1px solid",
                          borderColor: extra.ordered ? "#aaddaa" : "#ebebeb", borderRadius: 2, cursor: "pointer",
                          background: extra.ordered ? "#f0faf0" : "#fff", color: extra.ordered ? "#4a8a4a" : "#555",
                          transition: "all 0.1s",
                        }}>{extra.ordered ? "YES" : "NO"}</button>
                        <select value={extra.pairing || dish.pairings[0]} disabled={!extra.ordered}
                          onChange={e => updSeat(seat.id, "extras", { ...seat.extras, [dish.id]: { ...extra, pairing: e.target.value } })}
                          style={{
                            fontFamily: FONT, fontSize: 10, padding: "4px 5px",
                            border: "1px solid #ebebeb", borderRadius: 2,
                            background: "#fff", color: "#1a1a1a", outline: "none",
                            opacity: extra.ordered ? 1 : 0.3, width: "100%",
                          }}>
                          {dish.pairings.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div style={{ borderTop: "1px solid #ebebeb", margin: "28px 0" }} />

      {/* Table-wide fields */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
        <div>
          <div style={fieldLabel}>🍾 Bottles</div>
          {(table.bottleWines || []).map((w, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <WineSearch
                wineObj={w} wines={wines} byGlass={false} placeholder="search bottle…"
                onChange={val => {
                  const next = (table.bottleWines || []).map((b, idx) => idx === i ? val : b).filter(Boolean);
                  upd("bottleWines", next);
                }}
              />
            </div>
          ))}
          <WineSearch
            wineObj={null} wines={wines} byGlass={false} placeholder="add bottle…"
            onChange={w => { if (w) upd("bottleWines", [...(table.bottleWines || []), w]); }}
          />
        </div>
        <div>
          <div style={fieldLabel}>Menu</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["Long", "Short"].map(opt => (
              <button key={opt} onClick={() => upd("menuType", table.menuType === opt ? "" : opt)} style={{
                fontFamily: FONT, fontSize: 10, letterSpacing: 2,
                padding: "9px 22px", border: "1px solid",
                borderColor: table.menuType === opt ? "#1a1a1a" : "#e8e8e8",
                borderRadius: 2, cursor: "pointer",
                background: table.menuType === opt ? "#1a1a1a" : "#fff",
                color: table.menuType === opt ? "#fff" : "#888",
                textTransform: "uppercase",
              }}>{opt}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={fieldLabel}>⚠️ Restrictions</div>
          {table.restrictions?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {table.restrictions.map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 10px", background: "#fafafa",
                  border: "1px solid #f0c0c066", borderRadius: 2,
                }}>
                  <select value={r.pos ?? ""} onChange={e => upd("restrictions", table.restrictions.map((x, idx) =>
                    idx === i ? { ...x, pos: e.target.value ? Number(e.target.value) : null } : x
                  ))} style={{
                    fontFamily: FONT, fontSize: 11, fontWeight: 500,
                    padding: "4px 6px", border: "1px solid #e0e0e0",
                    borderRadius: 2, background: r.pos ? "#f0f0f0" : "#fff",
                    color: r.pos ? "#1a1a1a" : "#666", outline: "none",
                    flexShrink: 0, width: 58, cursor: "pointer",
                  }}>
                    <option value="">P?</option>
                    {Array.from({ length: table.guests }, (_, idx) => (
                      <option key={idx+1} value={idx+1}>P{idx+1}</option>
                    ))}
                  </select>
                  <span style={{ fontFamily: FONT, fontSize: 12, color: "#1a1a1a", flex: 1 }}>{r.note}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: FONT, fontSize: 11, color: "#ddd" }}>none</div>
          )}
        </div>
        <div>
          <div style={fieldLabel}>🎂 Birthday Cake</div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: table.birthday ? "#a07040" : "#555" }}>
            {table.birthday ? "YES" : "NO"}
          </div>
        </div>
        <div>
          <div style={fieldLabel}>📝 Notes</div>
          <textarea value={table.notes} onChange={e => upd("notes", e.target.value)}
            placeholder="VIP, pace, special requests…"
            style={{ ...baseInp, minHeight: 68, resize: "vertical", lineHeight: 1.5 }} />
        </div>
      </div>

      {/* Sticky bottom back button */}
      <div style={{
        position: "sticky", bottom: 0, left: 0, right: 0,
        padding: "12px 0 20px", marginTop: 28,
        background: "linear-gradient(to bottom, transparent, #fff 30%)",
      }}>
        <button onClick={onBack} style={{
          width: "100%", fontFamily: FONT, fontSize: 11, letterSpacing: 2,
          padding: "14px", border: "1px solid #e0e0e0", borderRadius: 4,
          cursor: "pointer", background: "#fff", color: "#555",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>← all tables</button>
      </div>
    </div>
  );
}


// ── Table Seat Detail (read-only, used in DisplayBoard) ───────────────────────
function TableSeatDetail({ table, dishes, isMobile }) {
  const pairingColors = {
    "Non-Alc":  { color: "#1f5f73", bg: "#e8f7fb",  border: "#7fc6db" },
    "Wine":      { color: "#7a5020", bg: "#f5ead8",  border: "#c8a060" },
    "Premium":   { color: "#3a3a7a", bg: "#eaeaf5",  border: "#8888bb" },
    "Our Story": { color: "#2a6a4a", bg: "#e0f5ea",  border: "#5aaa7a" },
  };

  const chip = (label, color, bg, border, bold = false) => (
    <span style={{
      fontFamily: FONT, fontSize: 11, letterSpacing: 0.5,
      padding: "4px 10px", borderRadius: 2,
      color, background: bg, border: `1px solid ${border}`,
      whiteSpace: "nowrap", fontWeight: bold ? 500 : 400,
    }}>{label}</span>
  );

  return (
    <>
      {table.notes && (
        <div style={{
          fontFamily: FONT, fontSize: 12, color: "#555", fontStyle: "italic",
          padding: "10px 14px", background: "#f8f8f8", border: "1px solid #e8e8e8",
          borderRadius: 2, marginBottom: 20,
        }}>{table.notes}</div>
      )}
      {(table.restrictions || []).filter(r => !r.pos && r.note).length > 0 && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "#fef0f0", border: "1px solid #e09090", borderRadius: 2 }}>
          <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 3, color: "#b04040", marginBottom: 6, textTransform: "uppercase" }}>
            ⚠ Unassigned restrictions
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {table.restrictions.filter(r => !r.pos && r.note).map((r, i) => (
              <span key={i} style={{ fontFamily: FONT, fontSize: 11, color: "#b04040", fontWeight: 500 }}>{r.note}</span>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {table.seats.map(seat => {
          const seatRestrictions = (table.restrictions || []).filter(r => r.pos === seat.id);
          const seatExtras = dishes.filter(d => seat.extras?.[d.id]?.ordered);
          const ws = waterStyle(seat.water);
          const pc = pairingColors[seat.pairing] || pairingColors["Non-Alc"];
          const hasInfo = seatRestrictions.length > 0 || seatExtras.length > 0;
          return (
            <div key={seat.id} style={{ border: "1px solid #ececec", borderRadius: 10, padding: "12px", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    border: `1px solid ${seatRestrictions.length ? "#e08080" : "#d0d0d0"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: FONT, fontSize: 10, fontWeight: 600,
                    color: seatRestrictions.length ? "#b04040" : "#444",
                  }}>P{seat.id}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span style={{
                    fontFamily: FONT, fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
                    padding: "4px 10px", borderRadius: 999,
                    background: seat.water === "—" ? "#f5f5f5" : (ws.bg || "#f0f0f0"),
                    color: seat.water === "—" ? "#666" : "#1a1a1a", border: "1px solid #e0e0e0",
                  }}>{seat.water}</span>
                  {seat.pairing && <span style={{
                    fontFamily: FONT, fontSize: 11, fontWeight: 600, letterSpacing: 0.4,
                    padding: "4px 10px", borderRadius: 999,
                    background: pc.bg, border: `1px solid ${pc.border}`, color: pc.color,
                  }}>{seat.pairing}</span>}
                </div>
              </div>
              {hasInfo ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {seatRestrictions.map((r, i) => (
                    <span key={i} style={{ fontFamily: FONT, fontSize: 11, fontWeight: 500, letterSpacing: 0.3, padding: "4px 9px", borderRadius: 999, background: "#fef0f0", border: "1px solid #e09090", color: "#b04040" }}>⚠ {r.note}</span>
                  ))}
                  {seatExtras.map(d => {
                    const ex = seat.extras[d.id];
                    return <span key={d.id} style={{ fontFamily: FONT, fontSize: 11, letterSpacing: 0.3, padding: "4px 9px", borderRadius: 999, background: "#e8f5e8", border: "1px solid #88cc88", color: "#2a6a2a" }}>{d.name}{ex.pairing && ex.pairing !== "—" ? ` · ${ex.pairing}` : ""}</span>;
                  })}
                </div>
              ) : <div style={{ fontFamily: FONT, fontSize: 11, color: "#777" }}>No extra notes</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Display Board ─────────────────────────────────────────────────────────────
function DisplayBoard({ tables, dishes, upd }) {
  const isMobile = useIsMobile(700);

  const pairingColors = {
    "Wine":      { color: "#7a5020", bg: "#f5ead8", border: "#c8a060" },
    "Non-Alc":   { color: "#1f5f73", bg: "#e8f7fb", border: "#7fc6db" },
    "Premium":   { color: "#3a3a7a", bg: "#eaeaf5", border: "#8888bb" },
    "Our Story": { color: "#2a6a4a", bg: "#e0f5ea", border: "#5aaa7a" },
  };

  // Group by sitting time (19:15 folds into 19:00)
  const visible = tables.filter(t => t.active || t.resTime || t.resName);
  const rowsData = SITTING_TIMES.map(time => ({
    time,
    tables: visible
      .filter(t => t.resTime === time || (time === "19:00" && t.resTime === "19:15"))
      .sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return (a.arrivedAt || a.resTime || "99").localeCompare(b.arrivedAt || b.resTime || "99");
      }),
  }));
  const hasAny = rowsData.some(r => r.tables.length > 0);

  const TableCard = ({ t }) => {
    const isSeated   = t.active;
    const allRestr   = (t.restrictions || []).filter(r => r.note);
    const [assigningIdx, setAssigningIdx] = useState(null); // index in t.restrictions of the one being assigned

    const unassigned = (t.restrictions || [])
      .map((r, i) => ({ ...r, _i: i }))
      .filter(r => !r.pos && r.note);

    const assignTo = (seatId) => {
      if (assigningIdx === null || !upd) return;
      const updated = (t.restrictions || []).map((r, i) =>
        i === assigningIdx ? { ...r, pos: seatId } : r
      );
      upd(t.id, "restrictions", updated);
      setAssigningIdx(null);
    };

    return (
      <div style={{
        background: "#fff",
        border: `1px solid ${isSeated ? "#b8ddc8" : "#dde8f5"}`,
        borderRadius: 6,
        overflow: "hidden",
        boxShadow: isSeated ? "0 2px 8px rgba(74,154,106,0.10)" : "none",
      }}>
        {/* Top colour bar */}
        <div style={{ height: 3, background: isSeated ? "#6ab882" : "#a0bcd8" }} />

        {/* Table header */}
        <div style={{
          padding: "12px 14px 10px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 300, color: "#1a1a1a", letterSpacing: 1, lineHeight: 1 }}>
              {String(t.id).padStart(2, "0")}
            </span>
            {t.resName && (
              <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "#1a1a1a", letterSpacing: 0.2 }}>
                {t.resName}
              </span>
            )}
            {t.arrivedAt
              ? <span style={{ fontFamily: FONT, fontSize: 11, color: "#3a8a5a", fontWeight: 600 }}>arr. {t.arrivedAt}</span>
              : t.resTime
                ? <span style={{ fontFamily: FONT, fontSize: 11, color: "#888" }}>res. {t.resTime}</span>
                : null
            }
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {isSeated
              ? <span style={{ fontFamily: FONT, fontSize: 8, letterSpacing: 1, padding: "3px 7px", borderRadius: 2, background: "#e8f7ee", border: "1px solid #9bd0aa", color: "#2f7a45", fontWeight: 700 }}>SEATED</span>
              : <span style={{ fontFamily: FONT, fontSize: 8, letterSpacing: 1, padding: "3px 7px", borderRadius: 2, background: "#eef5fb", border: "1px solid #c6d7ea", color: "#2f5f8a", fontWeight: 700 }}>RESERVED</span>
            }
            {t.menuType && <span style={{ fontFamily: FONT, fontSize: 9, padding: "3px 7px", borderRadius: 2, border: "1px solid #e8e8e8", color: "#555" }}>{t.menuType}</span>}
            {t.pace && (() => {
              const pc = { Slow: { color: "#7a5020", bg: "#fdf4e8", border: "#c8a060" }, Fast: { color: "#6a2a2a", bg: "#fdf0f0", border: "#d08888" } }[t.pace] || {};
              return <span style={{ fontFamily: FONT, fontSize: 9, padding: "3px 7px", borderRadius: 2, border: `1px solid ${pc.border}`, background: pc.bg, color: pc.color, fontWeight: 600 }}>{t.pace}</span>;
            })()}
            {t.guestType === "hotel" && t.room && <span style={{ fontFamily: FONT, fontSize: 9, padding: "3px 7px", borderRadius: 2, border: "1px solid #d4b888", color: "#a07040", background: "#fffaf2", fontWeight: 600 }}>#{t.room}</span>}
            {t.birthday && <span style={{ fontSize: 13 }}>🎂</span>}
          </div>
        </div>

        {/* Notes row */}
        {t.notes && (
          <div style={{ padding: "8px 14px", borderBottom: "1px solid #f5f5f5", background: "#fafafa" }}>
            <span style={{ fontFamily: FONT, fontSize: 11, color: "#777", fontStyle: "italic" }}>{t.notes}</span>
          </div>
        )}

        {/* Pace selector — visible on all tables, usable directly from display */}
        <div style={{ padding: "8px 14px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: FONT, fontSize: 8, letterSpacing: 2, color: "#bbb", textTransform: "uppercase", flexShrink: 0 }}>Pace</span>
          {["Slow", "Fast"].map(p => {
            const colors = {
              Slow:   { on: "#7a5020", bg: "#fdf4e8", border: "#c8a060" },
              Normal: { on: "#2a5a2a", bg: "#edf8e8", border: "#88bb70" },
              Fast:   { on: "#6a2a2a", bg: "#fdf0f0", border: "#d08888" },
            };
            const sel = t.pace === p;
            const col = colors[p];
            return (
              <button key={p} onClick={() => upd && upd(t.id, "pace", sel ? "" : p)} style={{
                fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "4px 10px",
                border: `1px solid ${sel ? col.border : "#e8e8e8"}`,
                borderRadius: 2, cursor: upd ? "pointer" : "default",
                background: sel ? col.bg : "#fff",
                color: sel ? col.on : "#aaa",
                transition: "all 0.1s",
              }}>{p}</button>
            );
          })}
        </div>

        {/* Unassigned restrictions warning — tap a chip to assign it to a seat */}
        {unassigned.length > 0 && (
          <div style={{ padding: "8px 14px", borderBottom: "1px solid #f5f5f5", background: "#fff8f8", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: FONT, fontSize: 8, letterSpacing: 2, color: "#b04040", textTransform: "uppercase", flexShrink: 0 }}>⚠ Unassigned</span>
            {unassigned.map((r) => (
              <span key={r._i} onClick={() => setAssigningIdx(assigningIdx === r._i ? null : r._i)} style={{
                fontFamily: FONT, fontSize: 10, color: assigningIdx === r._i ? "#fff" : "#b04040",
                background: assigningIdx === r._i ? "#b04040" : "#fef0f0",
                border: "1px solid #e09090", borderRadius: 2, padding: "2px 8px",
                fontWeight: 500, cursor: "pointer", userSelect: "none",
              }}>{r.note} {assigningIdx === r._i ? "→ pick seat" : "→"}</span>
            ))}
          </div>
        )}

        {/* Seat assignment prompt */}
        {assigningIdx !== null && (
          <div style={{ padding: "8px 14px", borderBottom: "1px solid #f5f5f5", background: "#fff3f3", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 1, color: "#b04040", flexShrink: 0 }}>Assign to:</span>
            {(t.seats || []).map(s => (
              <button key={s.id} onClick={() => assignTo(s.id)} style={{
                fontFamily: FONT, fontSize: 10, fontWeight: 700, padding: "4px 10px",
                border: "1px solid #e09090", borderRadius: 2, cursor: "pointer",
                background: "#fff", color: "#b04040",
              }}>P{s.id}</button>
            ))}
            <button onClick={() => setAssigningIdx(null)} style={{
              fontFamily: FONT, fontSize: 9, padding: "4px 8px", marginLeft: 4,
              border: "1px solid #eee", borderRadius: 2, cursor: "pointer",
              background: "#fff", color: "#aaa",
            }}>cancel</button>
          </div>
        )}

        {/* Seats — always visible, one row per seat */}
        {isSeated && t.seats && t.seats.length > 0 ? (
          <div style={{ padding: "8px 0 6px" }}>
            {t.seats.map(s => {
              const ws     = waterStyle(s.water);
              const pc     = pairingColors[s.pairing];
              const restr  = allRestr.filter(r => r.pos === s.id);
              const extras = dishes.filter(d => s.extras?.[d.id]?.ordered);
              const hasContent = (s.water && s.water !== "—") || s.pairing || restr.length > 0 || extras.length > 0;

              return (
                <div key={s.id} style={{
                  display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap",
                  padding: "5px 14px", borderBottom: "1px solid #f8f8f8",
                  background: restr.length ? "#fffaf9" : "transparent",
                }}>
                  <span style={{
                    fontFamily: FONT, fontSize: 10, fontWeight: 700, minWidth: 22,
                    color: restr.length ? "#b04040" : "#999", letterSpacing: 0.5,
                  }}>P{s.id}</span>

                  {!hasContent && <span style={{ fontFamily: FONT, fontSize: 10, color: "#e0e0e0" }}>—</span>}

                  {s.water && s.water !== "—" && (
                    <span style={{
                      fontFamily: FONT, fontSize: 10, padding: "2px 7px", borderRadius: 2,
                      background: ws.bg || "#f0f0f0", color: "#333", border: "1px solid #e0e0e0",
                    }}>{s.water}</span>
                  )}
                  {s.pairing && pc && (
                    <span style={{
                      fontFamily: FONT, fontSize: 10, padding: "2px 7px", borderRadius: 2,
                      background: pc.bg, border: `1px solid ${pc.border}`, color: pc.color, fontWeight: 500,
                    }}>{s.pairing}</span>
                  )}
                  {extras.map(d => {
                    const ex = s.extras[d.id];
                    return (
                      <span key={d.id} style={{
                        fontFamily: FONT, fontSize: 10, padding: "2px 7px", borderRadius: 2,
                        border: "1px solid #88cc88", color: "#2a6a2a", background: "#e8f5e8",
                      }}>{d.name}{ex?.pairing && ex.pairing !== "—" ? ` · ${ex.pairing}` : ""}</span>
                    );
                  })}
                  {restr.map((r, i) => (
                    <span key={i} style={{
                      fontFamily: FONT, fontSize: 10, padding: "2px 7px", borderRadius: 2,
                      border: "1px solid #e09090", color: "#b04040", background: "#fef0f0", fontWeight: 500,
                    }}>⚠ {r.note}</span>
                  ))}
                </div>
              );
            })}
          </div>
        ) : !isSeated ? (
          /* Reserved but not yet seated — show guest count */
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: FONT, fontSize: 11, color: "#aaa" }}>{t.guests} guest{t.guests !== 1 ? "s" : ""}</span>
            {allRestr.length > 0 && allRestr.map((r, i) => (
              <span key={i} style={{ fontFamily: FONT, fontSize: 10, padding: "2px 7px", borderRadius: 2, border: "1px solid #e09090", color: "#b04040", background: "#fef0f0", fontWeight: 500 }}>⚠ {r.note}</span>
            ))}
          </div>
        ) : null}


      </div>
    );
  };

  return (
    <div style={{
      overflowY: "auto", overflowX: "hidden",
      padding: isMobile ? "16px 12px 40px" : "24px 24px 48px",
      background: "#fafafa", minHeight: "calc(100vh - 52px)",
    }}>
      {!hasAny && (
        <div style={{ fontFamily: FONT, fontSize: 10, color: "#aaa", textAlign: "center", marginTop: 80, letterSpacing: 2 }}>
          no reservations
        </div>
      )}
      {rowsData.map(({ time, tables: rowTables }) => {
        if (rowTables.length === 0) return null;
        const seatedCount = rowTables.filter(t => t.active).length;
        return (
          <div key={time} style={{ marginBottom: 32 }}>
            {/* Row label */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontFamily: FONT, fontSize: 11, letterSpacing: 3, color: "#666", textTransform: "uppercase" }}>{time}</span>
              <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
              <span style={{ fontFamily: FONT, fontSize: 10, color: "#aaa" }}>
                {seatedCount}/{rowTables.length} seated · {rowTables.reduce((a,t) => a + (t.guests||0), 0)} guests
              </span>
            </div>
            {/* Cards — 2 columns on desktop, 1 on mobile */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
              gap: isMobile ? 10 : 14,
            }}>
              {rowTables.map(t => <TableCard key={t.id} t={t} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ modeLabel, showSummary, showMenu, showArchive, showAddRes, syncLabel, syncLive, activeCount, reserved, seated, onSummary, onMenu, onArchive, onAddRes, onExit }) {
  const modeColor = modeLabel === "ADMIN" ? "#4b4b88" : modeLabel === "SERVICE" ? "#2f7a45" : "#555";
  return (
    <div style={{
      borderBottom: "1px solid #f0f0f0", padding: "10px 12px",
      display: "flex", flexDirection: "column", gap: 10,
      background: "#fff", position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 4, color: "#1a1a1a" }}>MILKA</span>
          <span style={{ width: 1, height: 14, background: "#e8e8e8" }} />
          <span style={{ fontSize: 10, letterSpacing: 3, color: modeColor, textTransform: "uppercase", fontWeight: 700 }}>{modeLabel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {showAddRes && (
            <button onClick={onAddRes} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 12px", border: "1px solid #1a1a1a", borderRadius: 999, cursor: "pointer", background: "#1a1a1a", color: "#fff", fontWeight: 600 }}>+ RES</button>
          )}
          {showSummary && (
            <button onClick={onSummary} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px", border: "1px solid #e8e8e8", borderRadius: 999, cursor: "pointer", background: "#fff", color: "#1a1a1a" }}>SUMMARY</button>
          )}
          {showMenu && (
            <button onClick={onMenu} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px", border: "1px solid #e8e8e8", borderRadius: 999, cursor: "pointer", background: "#fff", color: "#1a1a1a" }}>MENU</button>
          )}
          {showArchive && (
            <button onClick={onArchive} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px", border: "1px solid #e8d8b8", borderRadius: 999, cursor: "pointer", background: "#fff8f0", color: "#8a6030" }}>ARCHIVE</button>
          )}
          <span style={{
            fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px",
            border: `1px solid ${syncLive ? "#8fc39f" : "#d8d8d8"}`,
            borderRadius: 999,
            background: syncLive ? "#eef8f1" : "#f6f6f6",
            color: syncLive ? "#2f7a45" : "#555",
            fontWeight: 600, whiteSpace: "nowrap",
          }}>{syncLabel}</span>
          <button onClick={onExit} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px", border: "1px solid #e8e8e8", borderRadius: 999, cursor: "pointer", background: "#fff", color: "#1a1a1a", flexShrink: 0 }}>EXIT</button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={topStatChip}>{activeCount} seated</span>
        <span style={topStatChip}>{reserved} reserved</span>
        <span style={topStatChip}>{seated} guests</span>
      </div>
    </div>
  );
}

// ── Summary Modal ─────────────────────────────────────────────────────────────
// ── Shared full-screen modal shell ────────────────────────────────────────────
function FullModal({ title, onClose, actions, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Sticky top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 54, borderBottom: "1px solid #ebebeb",
        background: "#fff", flexShrink: 0,
      }}>
        <span style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#888", textTransform: "uppercase" }}>{title}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {actions}
          <button onClick={onClose} style={{
            fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "8px 16px",
            border: "1px solid #e0e0e0", borderRadius: 2,
            cursor: "pointer", background: "#fff", color: "#555",
          }}>✕ CLOSE</button>
        </div>
      </div>
      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 20px 60px" }}>
        {children}
      </div>
    </div>
  );
}

// ── Summary Modal ─────────────────────────────────────────────────────────────
function SummaryModal({ tables, dishes = [], onClose }) {
  const active = tables.filter(t => t.active || t.arrivedAt);
  const pairingColor = { "Wine": "#8a6030", "Non-Alc": "#1f5f73", "Premium": "#3a3a7a", "Our Story": "#2a6a4a" };
  const pairingBg    = { "Wine": "#fdf4e8", "Non-Alc": "#e8f7fb", "Premium": "#eaeaf5", "Our Story": "#e0f5ea" };

  const copyText = () => {
    const lines = [];
    active.forEach(t => {
      lines.push(`TABLE ${String(t.id).padStart(2,"0")}${t.resName ? " · " + t.resName : ""}${t.arrivedAt ? " [arr. " + t.arrivedAt + "]" : ""}`);
      if (t.menuType) lines.push(`  Menu: ${t.menuType}`);
      t.seats.forEach(s => {
        const parts = [`P${s.id}`];
        if (s.water && s.water !== "—") parts.push(`water:${s.water}`);
        if (s.pairing) parts.push(s.pairing);
        const gs = (s.glasses   || []).map(w => w?.name).filter(Boolean);
        const cs = (s.cocktails || []).map(c => c?.name).filter(Boolean);
        const sp = (s.spirits   || []).map(x => x?.name).filter(Boolean);
        const bs = (s.beers     || []).map(x => x?.name).filter(Boolean);
        if (gs.length) parts.push("glass:"    + gs.join(","));
        if (cs.length) parts.push("cocktail:" + cs.join(","));
        if (sp.length) parts.push("spirit:"   + sp.join(","));
        if (bs.length) parts.push("beer:"     + bs.join(","));
        const extras = dishes.filter(d => s.extras?.[d.id]?.ordered);
        if (extras.length) parts.push(extras.map(d => d.name).join(","));
        const restr = (t.restrictions || []).filter(r => r.pos === s.id);
        if (restr.length) parts.push("⚠" + restr.map(r => r.note).join(","));
        lines.push("  " + parts.join(" | "));
      });
      lines.push("");
    });
    navigator.clipboard?.writeText(lines.join("\n")).catch(() => {});
  };

  return (
    <FullModal title="Service Summary" onClose={onClose} actions={
      <button onClick={copyText} style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "8px 16px", border: "1px solid #e0e0e0", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#555" }}>COPY TEXT</button>
    }>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {active.length === 0 && (
          <div style={{ fontFamily: FONT, fontSize: 11, color: "#bbb", textAlign: "center", padding: "80px 0" }}>No active tables</div>
        )}
        {active.map(t => (
          <div key={t.id} style={{ border: "1px solid #f0f0f0", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "12px 16px", background: "#fafafa", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 300, color: "#1a1a1a", letterSpacing: 1, lineHeight: 1 }}>{String(t.id).padStart(2,"0")}</span>
              {t.resName   && <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>{t.resName}</span>}
              {t.arrivedAt && <span style={{ fontFamily: FONT, fontSize: 11, color: "#4a9a6a", fontWeight: 500 }}>arr. {t.arrivedAt}</span>}
              {t.menuType  && <span style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "3px 8px", border: "1px solid #e0e0e0", borderRadius: 2, color: "#555", background: "#fff" }}>{t.menuType}</span>}
              {t.birthday  && <span style={{ fontSize: 14 }}>🎂</span>}
              {t.notes     && <span style={{ fontFamily: FONT, fontSize: 10, color: "#999", fontStyle: "italic", marginLeft: "auto" }}>{t.notes}</span>}
            </div>
            <div style={{ padding: "8px 12px 12px" }}>
              {t.seats.map(s => {
                const ws      = waterStyle(s.water);
                const restr   = (t.restrictions || []).filter(r => r.pos === s.id);
                const extras  = dishes.filter(d => s.extras?.[d.id]?.ordered);
                const allBevs = [
                  ...(s.glasses   || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.wine })),
                  ...(s.cocktails || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.cocktail })),
                  ...(s.spirits   || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.spirit })),
                  ...(s.beers     || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.beer })),
                ];
                return (
                  <div key={s.id} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", padding: "8px 4px", borderBottom: "1px solid #f5f5f5" }}>
                    <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: restr.length ? "#b04040" : "#999", minWidth: 28, letterSpacing: 0.5 }}>P{s.id}</span>
                    {s.water !== "—" && <span style={{ fontFamily: FONT, fontSize: 10, padding: "2px 8px", borderRadius: 2, background: ws.bg || "#f5f5f5", color: "#333", border: "1px solid #e0e0e0" }}>{s.water}</span>}
                    {s.pairing && <span style={{ fontFamily: FONT, fontSize: 10, padding: "2px 8px", borderRadius: 2, border: "1px solid #e0e0e0", color: pairingColor[s.pairing] || "#555", background: pairingBg[s.pairing] || "#fafafa" }}>{s.pairing}</span>}
                    {extras.map(d => { const ex = s.extras[d.id]; return <span key={d.id} style={{ fontFamily: FONT, fontSize: 10, padding: "2px 7px", borderRadius: 2, border: "1px solid #88cc88", color: "#2a6a2a", background: "#e8f5e8" }}>{d.name}{ex?.pairing && ex.pairing !== "—" ? ` · ${ex.pairing}` : ""}</span>; })}
                    {allBevs.map((b, i) => <span key={i} style={{ fontFamily: FONT, fontSize: 10, padding: "2px 7px", borderRadius: 2, border: `1px solid ${b.ts.border}`, color: b.ts.color, background: b.ts.bg }}>{b.label}</span>)}
                    {restr.map((r, i) => <span key={i} style={{ fontFamily: FONT, fontSize: 10, padding: "2px 7px", borderRadius: 2, border: "1px solid #e09090", color: "#b04040", background: "#fef0f0" }}>⚠ {r.note}</span>)}
                  </div>
                );
              })}
            </div>
            {(t.bottleWines || []).length > 0 && (
              <div style={{ padding: "10px 16px 14px", borderTop: "1px solid #f5f5f5", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: FONT, fontSize: 8, letterSpacing: 2, color: "#bbb", textTransform: "uppercase", marginBottom: 2 }}>Bottles</div>
                {(t.bottleWines || []).map((w, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>🍾 {w.name}</span>
                    {w.producer && <span style={{ fontFamily: FONT, fontSize: 11, color: "#888" }}>{w.producer}</span>}
                    {w.vintage  && <span style={{ fontFamily: FONT, fontSize: 11, color: "#aaa", letterSpacing: 0.5 }}>{w.vintage}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </FullModal>
  );
}

// ── Archive Modal ─────────────────────────────────────────────────────────────
function ArchiveModal({ tables, dishes, onArchiveAndClear, onClearAll, onClose }) {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const pairingColor = { "Wine": "#8a6030", "Non-Alc": "#1f5f73", "Premium": "#3a3a7a", "Our Story": "#2a6a4a" };
  const pairingBg    = { "Wine": "#fdf4e8", "Non-Alc": "#e8f7fb", "Premium": "#eaeaf5", "Our Story": "#e0f5ea" };

  const loadEntries = () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    supabase.from("service_archive").select("*").order("created_at", { ascending: false }).limit(60)
      .then(({ data, error }) => { setEntries(error ? [] : (data || [])); setLoading(false); });
  };
  useEffect(loadEntries, []);

  const deleteEntry = async id => {
    if (!supabase) return;
    setDeleting(id);
    const { error } = await supabase.from("service_archive").delete().eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message + "\n\nYou may need to enable DELETE on the service_archive table in Supabase (Policies → anon → DELETE).");
    } else {
      setEntries(e => e.filter(x => x.id !== id));
      if (expanded === id) setExpanded(null);
    }
    setDeleting(null);
  };

  const deleteAll = async () => {
    if (!supabase) return;
    if (!window.confirm("Delete ALL archive entries? This cannot be undone.")) return;
    setDeleting("all");
    const { error } = await supabase.from("service_archive").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      alert("Delete failed: " + error.message + "\n\nYou may need to enable DELETE on the service_archive table in Supabase (Policies → anon → DELETE).");
    } else {
      setEntries([]);
      setExpanded(null);
    }
    setDeleting(null);
  };

  const activeTables = tables.filter(t => t.active || t.arrivedAt || t.resName || t.resTime);

  const archiveActions = (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={onClearAll} style={{
        fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "8px 14px",
        border: "1px solid #e8e8e8", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#888",
      }}>CLEAR ALL</button>
      <button onClick={async () => { await onArchiveAndClear(); loadEntries(); }} style={{
        fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "8px 16px",
        border: "1px solid #c8a06e", borderRadius: 2, cursor: "pointer", background: "#fdf8f0", color: "#8a6030",
      }}>ARCHIVE & CLEAR ({activeTables.length})</button>
    </div>
  );

  return (
    <FullModal title="Archive · End of Day" onClose={onClose} actions={archiveActions}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {!supabase && <div style={{ fontFamily: FONT, fontSize: 11, color: "#bbb", padding: "60px 0", textAlign: "center" }}>Supabase not connected</div>}
        {supabase && loading && <div style={{ fontFamily: FONT, fontSize: 11, color: "#bbb", padding: "60px 0", textAlign: "center" }}>Loading…</div>}
        {supabase && !loading && entries.length === 0 && <div style={{ fontFamily: FONT, fontSize: 11, color: "#bbb", padding: "60px 0", textAlign: "center" }}>No archived services yet</div>}
        {supabase && !loading && entries.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button onClick={deleteAll} disabled={deleting === "all"} style={{
              fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 14px",
              border: "1px solid #ffcccc", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#e07070",
              opacity: deleting === "all" ? 0.5 : 1,
            }}>{deleting === "all" ? "DELETING…" : "DELETE ALL"}</button>
          </div>
        )}
        {entries.map(entry => {
          const isExp       = expanded === entry.id;
          const entryTables = entry.state?.tables || [];
          const totalGuests = entryTables.reduce((a, t) => a + (t.guests || 0), 0);
          return (
            <div key={entry.id} style={{ border: "1px solid #f0f0f0", borderRadius: 4, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: isExp ? "#fafafa" : "#fff" }}>
                <div onClick={() => setExpanded(isExp ? null : entry.id)} style={{ cursor: "pointer", flex: 1 }}>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: "#1a1a1a", marginBottom: 3 }}>{entry.label}</div>
                  <div style={{ fontFamily: FONT, fontSize: 10, color: "#999" }}>{entryTables.length} tables · {totalGuests} guests</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => deleteEntry(entry.id)} disabled={deleting === entry.id} style={{
                    fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "4px 10px",
                    border: "1px solid #ffcccc", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#e07070",
                    opacity: deleting === entry.id ? 0.5 : 1,
                  }}>{deleting === entry.id ? "…" : "delete"}</button>
                  <span onClick={() => setExpanded(isExp ? null : entry.id)} style={{ fontFamily: FONT, fontSize: 16, color: "#ccc", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.18s", display: "inline-block", cursor: "pointer" }}>⌄</span>
                </div>
              </div>
              {isExp && (
                <div style={{ borderTop: "1px solid #f0f0f0" }}>
                  {entryTables.map(t => (
                    <div key={t.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f8f8f8" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 300, color: "#1a1a1a", letterSpacing: 1 }}>{String(t.id).padStart(2,"0")}</span>
                        {t.resName   && <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500 }}>{t.resName}</span>}
                        {t.arrivedAt && <span style={{ fontFamily: FONT, fontSize: 10, color: "#4a9a6a" }}>arr. {t.arrivedAt}</span>}
                        {t.menuType  && <span style={{ fontFamily: FONT, fontSize: 9, padding: "2px 7px", border: "1px solid #e8e8e8", borderRadius: 2, color: "#555" }}>{t.menuType}</span>}
                        {t.birthday  && <span style={{ fontSize: 12 }}>🎂</span>}
                        {(t.bottleWines || []).map((w, i) => (
                          <span key={i} style={{ fontFamily: FONT, fontSize: 9, padding: "2px 7px", borderRadius: 2, border: "1px solid #c8a060", color: "#7a5020", background: "#fdf4e8" }}>🍾 {w.name}</span>
                        ))}
                      </div>
                      {(t.seats || []).map(s => {
                        const ws    = waterStyle(s.water);
                        const restr = (t.restrictions || []).filter(r => r.pos === s.id);
                        const extra = (entry.state?.dishes || dishes).filter(d => s.extras?.[d.id]?.ordered);
                        const bevs  = [
                          ...(s.glasses   || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.wine })),
                          ...(s.cocktails || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.cocktail })),
                          ...(s.spirits   || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.spirit })),
                          ...(s.beers     || []).filter(Boolean).map(x => ({ label: x.name, ts: BEV_TYPES.beer })),
                        ];
                        return (
                          <div key={s.id} style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center", padding: "5px 4px", borderBottom: "1px solid #fafafa" }}>
                            <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: "#999", minWidth: 26 }}>P{s.id}</span>
                            {s.water !== "—" && <span style={{ fontFamily: FONT, fontSize: 10, padding: "1px 7px", borderRadius: 2, background: ws.bg || "#f0f0f0", color: "#444", border: "1px solid #e0e0e0" }}>{s.water}</span>}
                            {s.pairing && <span style={{ fontFamily: FONT, fontSize: 10, padding: "1px 7px", borderRadius: 2, color: pairingColor[s.pairing] || "#555", background: pairingBg[s.pairing] || "#fafafa", border: "1px solid #e0e0e0" }}>{s.pairing}</span>}
                            {bevs.map((b, i) => <span key={i} style={{ fontFamily: FONT, fontSize: 10, padding: "1px 7px", borderRadius: 2, border: `1px solid ${b.ts.border}`, color: b.ts.color, background: b.ts.bg }}>{b.label}</span>)}
                            {extra.map(d => <span key={d.id} style={{ fontFamily: FONT, fontSize: 10, padding: "1px 7px", borderRadius: 2, border: "1px solid #88cc88", color: "#2a6a2a", background: "#e8f5e8" }}>{d.name}</span>)}
                            {restr.map((r, i) => <span key={i} style={{ fontFamily: FONT, fontSize: 10, padding: "1px 7px", borderRadius: 2, border: "1px solid #e09090", color: "#b04040", background: "#fef0f0" }}>⚠ {r.note}</span>)}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FullModal>
  );
}

// ── Access gate constants ─────────────────────────────────────────────────────
const PINS            = { admin: "3412" };
const ACCESS_PASSWORD = "milka2025";          // ← change to your own password
const ACCESS_KEY      = "milka_access";
const ACCESS_TTL_MS   = 12 * 60 * 60 * 1000; // 12 hours

const readAccess = () => {
  try {
    const raw = localStorage.getItem(ACCESS_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw);
    return Date.now() - ts < ACCESS_TTL_MS;
  } catch { return false; }
};
const writeAccess = () => {
  try { localStorage.setItem(ACCESS_KEY, JSON.stringify({ ts: Date.now() })); } catch {}
};

// ── GateScreen — password wall before anything else ───────────────────────────
function GateScreen({ onPass }) {
  const [pw, setPw]       = useState("");
  const [shake, setShake] = useState(false);
  const [show, setShow]   = useState(false);

  const attempt = val => {
    if (val === ACCESS_PASSWORD) {
      writeAccess();
      onPass();
    } else {
      setShake(true);
      setTimeout(() => { setShake(false); setPw(""); }, 600);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#fff",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: FONT, padding: "20px 16px",
    }}>
      <GlobalStyle />
      <div style={{ marginBottom: 52, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: 6, color: "#1a1a1a", marginBottom: 6 }}>MILKA</div>
        <div style={{ fontSize: 9, letterSpacing: 4, color: "#555" }}>SERVICE BOARD</div>
      </div>

      <div style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
        <div style={{ fontFamily: FONT, fontSize: 10, letterSpacing: 3, color: "#888", marginBottom: 28, textTransform: "uppercase" }}>
          enter password
        </div>

        <div style={{ animation: shake ? "shake 0.4s ease" : "none", marginBottom: 12 }}>
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && attempt(pw)}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                ...baseInp,
                textAlign: "center",
                letterSpacing: show ? 2 : 6,
                fontSize: MOBILE_SAFE_INPUT_SIZE,
                paddingRight: 44,
                borderColor: shake ? "#f0c0c0" : "#e8e8e8",
                transition: "border-color 0.2s",
              }}
              placeholder="••••••••"
            />
            <button onClick={() => setShow(s => !s)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "#bbb", fontSize: 13, padding: 0, lineHeight: 1,
            }}>{show ? "hide" : "show"}</button>
          </div>
        </div>

        <button onClick={() => attempt(pw)} style={{
          width: "100%", fontFamily: FONT, fontSize: 11, letterSpacing: 3,
          padding: "14px", border: "1px solid #1a1a1a", borderRadius: 2,
          cursor: "pointer", background: "#1a1a1a", color: "#fff",
          textTransform: "uppercase", marginTop: 8,
        }}>Enter</button>
      </div>

      <style>{`@keyframes shake {
        0%,100%{transform:translateX(0)}
        20%{transform:translateX(-8px)} 40%{transform:translateX(8px)}
        60%{transform:translateX(-5px)} 80%{transform:translateX(5px)}
      }`}</style>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onEnter }) {
  const MODES = [
    { id: "display",  label: "Display",  sub: "read-only view",      icon: "◎", pin: false },
    { id: "service",  label: "Service",  sub: "full service access",  icon: "◈", pin: false },
    { id: "admin",    label: "Admin",    sub: "pin required",         icon: "◆", pin: true  },
  ];
  const [picking, setPicking] = useState(null);
  const [pin, setPin]         = useState("");
  const [shake, setShake]     = useState(false);

  const handleTile = mode => {
    if (!mode.pin) { onEnter(mode.id); return; }
    setPicking(mode.id);
    setPin("");
  };

  const handleDigit = d => {
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === PINS[picking]) {
        onEnter(picking);
        setPicking(null);
      } else {
        setShake(true);
        setPin("");
        setTimeout(() => setShake(false), 500);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <GlobalStyle />
      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, letterSpacing: 6, color: "#1a1a1a", marginBottom: 8 }}>MILKA</div>
        <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#999" }}>SERVICE BOARD</div>
      </div>

      {!picking ? (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", maxWidth: 480 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => handleTile(m)} style={{
              fontFamily: FONT, cursor: "pointer",
              background: "#fff", border: "1px solid #e8e8e8", borderRadius: 2,
              padding: "28px 32px", width: 140, textAlign: "center",
              transition: "all 0.12s", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 24, color: "#444" }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 2, color: "#1a1a1a", fontWeight: 500 }}>{m.label.toUpperCase()}</div>
                <div style={{ fontSize: 9, letterSpacing: 1, color: "#999", marginTop: 4 }}>{m.sub}</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%", maxWidth: 320 }}>
          <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#666" }}>ENTER PIN</div>
          <div style={{
            display: "flex", gap: 14, animation: shake ? "shake 0.4s" : "none",
          }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 14, height: 14, borderRadius: "50%",
                background: i < pin.length ? "#1a1a1a" : "#e8e8e8",
                transition: "background 0.1s",
              }} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, width: "100%" }}>
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
              <button key={i} onClick={() => {
                if (d === "⌫") setPin(p => p.slice(0,-1));
                else if (d !== "") handleDigit(d);
              }} disabled={d === ""} style={{
                fontFamily: FONT, fontSize: 22, fontWeight: 300,
                padding: "18px 0", border: "1px solid #e8e8e8", borderRadius: 2,
                background: d === "" ? "transparent" : "#fff", cursor: d === "" ? "default" : "pointer",
                color: "#1a1a1a", letterSpacing: 1,
                opacity: d === "" ? 0 : 1,
                transition: "all 0.08s",
              }}>{d}</button>
            ))}
          </div>
          <button onClick={() => { setPicking(null); setPin(""); }} style={{
            fontFamily: FONT, fontSize: 10, letterSpacing: 2, color: "#999",
            background: "none", border: "none", cursor: "pointer", padding: 8,
          }}>CANCEL</button>
          <style>{`@keyframes shake {
            0%{transform:translateX(0)} 20%{transform:translateX(-8px)}
            40%{transform:translateX(8px)} 60%{transform:translateX(-5px)}
            80%{transform:translateX(5px)} 100%{transform:translateX(0)}
          }`}</style>
        </div>
      )}
    </div>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; color: #1a1a1a; }
      input, textarea, select { font-size: ${MOBILE_SAFE_INPUT_SIZE}px; }
      button, a, label { touch-action: manipulation; }
    `}</style>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const localSnapshot = readLocalBoardState();
  const initialState  = localSnapshot || defaultBoardState();

  const localBev = readLocalBeverages();

  const [tables,    setTables]    = useState(initialState.tables);
  const [dishes,    setDishes]    = useState(initialState.dishes);
  const [wines,     setWines]     = useState(initialState.wines);
  const [cocktails, setCocktails] = useState(localBev?.cocktails ?? initialState.cocktails ?? initCocktails);
  const [spirits,   setSpirits]   = useState(localBev?.spirits   ?? initialState.spirits   ?? initSpirits);
  const [beers,     setBeers]     = useState(localBev?.beers      ?? initialState.beers     ?? initBeers);
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("milka_mode") || null; } catch { return null; }
  });
  const [sel,          setSel]          = useState(null);
  const [resModal,     setResModal]     = useState(null);
  const [resModalPresetTime, setResModalPresetTime] = useState(null);
  const [adminOpen,    setAdminOpen]    = useState(false);
  const [summaryOpen,  setSummaryOpen]  = useState(false);
  const [archiveOpen,  setArchiveOpen]  = useState(false);
  const [syncStatus,   setSyncStatus]   = useState(hasSupabaseConfig ? "connecting" : "local-only");
  // Access gate: checked once at init against 12h TTL
  const [authed,       setAuthed]       = useState(() => readAccess());
  // Hydration: render immediately from localStorage, sync Supabase in background
  const [hydrated,     setHydrated]     = useState(() => {
    if (!hasSupabaseConfig) return true;
    try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
  });

  const applyingRemoteRef  = useRef(false);
  const lastRemoteJsonRef  = useRef("");
  const saveTimerRef       = useRef(null);

  const boardState = { tables, dishes, cocktails, spirits, beers };
  const boardJson  = JSON.stringify(boardState);
  const boardStateRef = useRef(boardState);
  boardStateRef.current = boardState;

  const applyBoardState = payload => {
    if (!payload || typeof payload !== "object") return;
    applyingRemoteRef.current = true;
    lastRemoteJsonRef.current = JSON.stringify(payload);
    setTables(Array.isArray(payload.tables) ? payload.tables.map(sanitizeTable) : initTables);
    setDishes(Array.isArray(payload.dishes)    ? payload.dishes    : initDishes);
    // wines loaded separately from wines table
    setCocktails(Array.isArray(payload.cocktails) ? payload.cocktails : initCocktails);
    setSpirits(Array.isArray(payload.spirits)  ? payload.spirits   : initSpirits);
    setBeers(Array.isArray(payload.beers)      ? payload.beers     : initBeers);
    setTimeout(() => { applyingRemoteRef.current = false; }, 0);
  };

  const selTable   = tables.find(t => t.id === sel);
  const modalTable = tables.find(t => t.id === resModal);

  const upd = (id, f, v) => setTables(p => p.map(t => t.id === id ? { ...t, [f]: v } : t));

  const updSeat = (tid, sid, f, v) => setTables(p => p.map(t =>
    t.id !== tid ? t : { ...t, seats: t.seats.map(s => s.id === sid ? { ...s, [f]: v } : s) }
  ));

  const setGuests = (tid, n) => setTables(p => p.map(t =>
    t.id !== tid ? t : { ...t, guests: n, seats: makeSeats(n, t.seats) }
  ));

  const seatTable = id => {
    const now = fmt(new Date());
    setTables(p => p.map(t =>
      t.id !== id ? t : { ...t, active: true, arrivedAt: now, seats: makeSeats(t.guests, t.seats) }
    ));
  };

  const unseatTable = id => {
    setTables(p => p.map(t =>
      t.id !== id ? t : { ...t, active: false, arrivedAt: null }
    ));
  };

  const clear = id => {
    if (typeof window !== "undefined" && !window.confirm("Clear this table and reset its details?")) return;
    setTables(p => p.map(t => t.id !== id ? t : blankTable(id)));
    setSel(null);
  };

  const saveBeverages = async ({ cocktails: newC, spirits: newS, beers: newB }) => {
    setCocktails(newC);
    setSpirits(newS);
    setBeers(newB);
    writeLocalBeverages({ cocktails: newC, spirits: newS, beers: newB });
    if (!supabase) return;
    const rows = [
      ...newC.map((item, i) => ({ category: "cocktail", name: item.name, notes: item.notes || "", position: i })),
      ...newS.map((item, i) => ({ category: "spirit",   name: item.name, notes: item.notes || "", position: i })),
      ...newB.map((item, i) => ({ category: "beer",     name: item.name, notes: item.notes || "", position: i })),
    ];
    await supabase.from("beverages").delete().in("category", ["cocktail", "spirit", "beer"]);
    if (rows.length > 0) await supabase.from("beverages").insert(rows);
  };

  const clearAll = () => {
    if (typeof window !== "undefined" && !window.confirm("Clear ALL tables?")) return;
    setTables(Array.from({ length: 10 }, (_, i) => blankTable(i + 1)));
    setSel(null);
    setArchiveOpen(false);
  };

  const archiveAndClearAll = async () => {
    if (typeof window !== "undefined" && !window.confirm("Archive today's service and clear all tables?")) return;
    const snap = boardStateRef.current; // stable reference, never stale
    const dateStr = new Date().toLocaleDateString("sl-SI", { day: "2-digit", month: "2-digit", year: "numeric" });
    const activeTables = snap.tables.filter(t => t.active || t.arrivedAt || t.resName || t.resTime);
    if (supabase) {
      const { error } = await supabase.from("service_archive").insert({
        date: new Date().toISOString().slice(0, 10),
        label: dateStr,
        state: { ...snap, tables: activeTables },
      });
      if (error) {
        window.alert("Archive failed: " + error.message);
        return;
      }
    }
    setTables(Array.from({ length: 10 }, (_, i) => blankTable(i + 1)));
    setSel(null);
    setArchiveOpen(false);
  };

  const swapSeats = (tid, aId, bId) => setTables(p => p.map(t => {
    if (t.id !== tid) return t;
    const sA = t.seats.find(s => s.id === aId);
    const sB = t.seats.find(s => s.id === bId);
    return { ...t, seats: t.seats.map(s => {
      if (s.id === aId) return { ...sB, id: aId };
      if (s.id === bId) return { ...sA, id: bId };
      return s;
    })};
  }));

  const saveRes = (id, { tableId, name, time, menuType, guests, guestType, room, birthday, restrictions, notes }) => {
    const targetId = tableId ?? id;
    setTables(p => p.map(t => {
      // Clear old table if user picked a different one
      if (t.id === id && id !== targetId) return { ...t, resName: "", resTime: "", menuType: "", guestType: "", room: "", guests: 2, birthday: false, restrictions: [], notes: "" };
      if (t.id !== targetId) return t;
      return { ...t, resName: name, resTime: time, menuType, guestType, room, guests, seats: makeSeats(guests, t.seats), birthday, restrictions, notes };
    }));
    setResModal(null);
  };

  const changeMode = nextMode => {
    setMode(nextMode);
    try {
      if (nextMode) localStorage.setItem("milka_mode", nextMode);
      else          localStorage.removeItem("milka_mode");
    } catch {}
  };

  const switchMode = () => { changeMode(null); setSel(null); };

  // ── Persist + sync to Supabase ────────────────────────────────────────────
  useEffect(() => {
    // Don't write anything until we've loaded remote state — avoids stomping Supabase
    // with a stale localStorage snapshot before the initial fetch resolves.
    if (!hydrated) return;

    writeLocalBoardState(boardStateRef.current);

    if (applyingRemoteRef.current) return;
    if (!supabase) return;

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase.from("board_state").upsert({
        id: "main",
        state: boardStateRef.current,
        updated_at: new Date().toISOString(),
      });
      setSyncStatus(error ? "sync-error" : "live");
    }, 200);

    return () => clearTimeout(saveTimerRef.current);
  }, [boardJson, hydrated]);

  // ── Load from Supabase + subscribe realtime ───────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    // Fallback: open gate after 800ms for cold starts
    const gateTimeout = setTimeout(() => { if (isMounted) setHydrated(true); }, 800);

    const loadRemote = async () => {
      const { data, error } = await supabase
        .from("board_state")
        .select("state, updated_at")
        .eq("id", "main")
        .maybeSingle();

      if (!isMounted) return;
      clearTimeout(gateTimeout);

      if (error) { setSyncStatus("sync-error"); setHydrated(true); return; }

      if (data?.state && Object.keys(data.state).length > 0) {
        applyBoardState(data.state);
        setSyncStatus("live");
      } else {
        // No remote state yet — just mark live, don't seed
        setSyncStatus("live");
      }
      setHydrated(true);
    };

    loadRemote();

    const channel = supabase
      .channel("milka-board-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "board_state", filter: "id=eq.main" }, payload => {
        const nextState = payload.new?.state;
        if (!nextState) return;
        const nextJson = JSON.stringify(nextState);
        if (nextJson === lastRemoteJsonRef.current) return;
        lastRemoteJsonRef.current = nextJson;
        applyBoardState(nextState);
        setSyncStatus("live");
      })
      .subscribe(status => {
        if (status === "SUBSCRIBED") setSyncStatus("live");
      });

    return () => {
      isMounted = false;
      clearTimeout(gateTimeout);
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Beverages: load from Supabase + realtime ─────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;

    const loadBevs = async () => {
      const { data, error } = await supabase
        .from("beverages")
        .select("id, category, name, notes, position")
        .order("position", { ascending: true });
      if (!mounted || error || !data || data.length === 0) return;
      const byCat = cat => data
        .filter(r => r.category === cat)
        .map((r, i) => ({ id: r.id, name: r.name, notes: r.notes || "", position: r.position ?? i }));
      const c = byCat("cocktail");
      const s = byCat("spirit");
      const b = byCat("beer");
      if (c.length) setCocktails(c);
      if (s.length) setSpirits(s);
      if (b.length) setBeers(b);
      writeLocalBeverages({ cocktails: c, spirits: s, beers: b });
    };

    loadBevs();

    const bevChannel = supabase.channel("milka-beverages")
      .on("postgres_changes", { event: "*", schema: "public", table: "beverages" }, loadBevs)
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(bevChannel); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Wines: load from Supabase wines table + realtime ─────────────────────────
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;

    const loadWines = async () => {
      const { data, error } = await supabase
        .from("wines")
        .select("id, name, wine_name, producer, vintage, region, country, by_glass")
        .order("name", { ascending: true });
      if (!mounted || error || !data || data.length === 0) return;
      setWines(data.map(r => ({
        id: r.id, name: r.wine_name || r.name,
        producer: r.producer || "", vintage: r.vintage || "",
        region: r.region || "", country: r.country || "",
        byGlass: r.by_glass ?? false,
      })));
    };

    loadWines();
    const wineChannel = supabase.channel("milka-wines")
      .on("postgres_changes", { event: "*", schema: "public", table: "wines" }, loadWines)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(wineChannel); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active   = tables.filter(t => t.active);
  const seated   = active.reduce((a, t) => a + t.guests, 0);
  const reserved = tables.filter(t => !t.active && (t.resName || t.resTime)).length;

  const syncLabel = syncStatus === "live" ? "SYNC" : syncStatus === "local-only" ? "LOCAL" : syncStatus === "connecting" ? "LINK" : "ERROR";
  const syncLive  = syncStatus === "live";

  const hProps = {
    syncLabel, syncLive,
    activeCount: active.length, reserved, seated,
    onExit: switchMode,
    onMenu: () => setAdminOpen(true),
    onSummary: () => setSummaryOpen(true),
    onArchive: () => setArchiveOpen(true),
    onAddRes: () => {
      const freeTable = tables.find(t => !t.active && !t.resName && !t.resTime);
      if (freeTable) { setResModalPresetTime(null); setResModal(freeTable.id); }
      else { setResModalPresetTime(null); setResModal(tables[0].id); }
    },
  };

  // Gate 1: password wall — must authenticate before anything
  if (!authed) return <GateScreen onPass={() => setAuthed(true)} />;

  // Gate 2: hydration — wait for Supabase state before rendering
  if (!hydrated) return (
    <div style={{
      minHeight: "100vh", background: "#fff", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: FONT, gap: 24,
    }}>
      <GlobalStyle />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 6, color: "#1a1a1a", marginBottom: 6 }}>MILKA</div>
        <div style={{ fontSize: 9, letterSpacing: 4, color: "#bbb" }}>CONNECTING…</div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: "50%", background: "#e0e0e0",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`@keyframes pulse{0%,80%,100%{opacity:0.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );

  if (!mode) return <LoginScreen onEnter={m => { changeMode(m); setSel(null); }} />;

  // Display mode
  if (mode === "display") return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT, overflowX: "hidden", WebkitTextSizeAdjust: "100%" }}>
      <GlobalStyle />
      <Header modeLabel="DISPLAY" showSummary={false} showMenu={false} showArchive={false} {...hProps} />
      <DisplayBoard tables={tables} dishes={dishes} upd={upd} />
    </div>
  );

  // Service + Admin modes
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT, overflowX: "hidden", WebkitTextSizeAdjust: "100%" }}>
      <GlobalStyle />

      <Header
        modeLabel={mode === "admin" ? "ADMIN" : "SERVICE"}
        showSummary={true}
        showAddRes={mode === "admin"}
        showMenu={mode === "admin"}
        showArchive={mode === "admin"}
        {...hProps}
      />

      {sel === null ? (
        <div style={{ padding: "28px 24px", maxWidth: 1100, margin: "0 auto", overflowX: "hidden" }}>
          {(() => {
            const visibleTables = tables.filter(t => mode === "admin" || t.active || t.resName || t.resTime);
            const cardProps = t => ({
              key: t.id, table: t, mode,
              onClick: () => t.active && setSel(t.id),
              onSeat: () => seatTable(t.id),
              onUnseat: () => unseatTable(t.id),
              onClear: () => clear(t.id),
              onEditRes: () => { if (mode === "admin") { setResModalPresetTime(null); setResModal(t.id); } },
            });

            // Group tables by sitting time
            const rows = SITTING_TIMES.map(time => ({
              time,
              tables: visibleTables.filter(t => {
                if (t.resTime === time) return true;
                // 19:15 falls into 19:00 row
                if (time === "19:00" && t.resTime === "19:15") return true;
                return false;
              }),
            }));

            const hasAnyInRows = rows.some(r => r.tables.length > 0);

            if (!hasAnyInRows) {
              return (
                <div style={{ fontFamily: FONT, fontSize: 11, color: "#bbb", textAlign: "center", paddingTop: 80 }}>
                  No reservations yet — add them in Admin
                </div>
              );
            }

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {rows.map(({ time, tables: rowTables }) => {
                  if (rowTables.length === 0 && mode !== "admin") return null;
                  return (
                    <div key={time}>
                      {/* Row label */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <span style={{ fontFamily: FONT, fontSize: 11, letterSpacing: 3, color: "#888", textTransform: "uppercase" }}>
                          {time}
                        </span>
                        <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
                        <span style={{ fontFamily: FONT, fontSize: 10, color: "#bbb" }}>
                          {rowTables.length} / 4
                        </span>
                      </div>
                      {/* Cards — max 4, fixed grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                        {rowTables.slice(0, 4).map(t => <Card {...cardProps(t)} />)}
                        {/* Empty slot placeholders for admin — clickable to add reservation */}
                        {mode === "admin" && rowTables.length < 4 && Array.from({ length: 4 - rowTables.length }).map((_, i) => {
                          // Find next table with no reservation and not active
                          const usedIds = visibleTables.map(t => t.id);
                          const freeTable = tables.find(t => !t.active && !t.resName && !t.resTime);
                          return (
                            <div key={`empty-${time}-${i}`}
                              onClick={() => { if (freeTable) { setResModalPresetTime(time); setResModal(freeTable.id); } }}
                              style={{
                                border: "1px dashed #e0e0e0", borderRadius: 4, minHeight: 190,
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                gap: 8, cursor: freeTable ? "pointer" : "default",
                                transition: "border-color 0.15s, background 0.15s",
                              }}
                              onMouseEnter={e => { if (freeTable) { e.currentTarget.style.borderColor = "#c8a06e"; e.currentTarget.style.background = "#fffdf8"; }}}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.background = ""; }}
                            >
                              <span style={{ fontSize: 18, color: "#ddd" }}>+</span>
                              <span style={{ fontFamily: FONT, fontSize: 9, color: "#ccc", letterSpacing: 2 }}>
                                {freeTable ? "ADD RES" : "FULL"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        <Detail
          table={selTable}
          dishes={dishes}
          wines={wines}
          cocktails={cocktails}
          spirits={spirits}
          beers={beers}
          mode={mode}
          onBack={() => setSel(null)}
          upd={(f, v) => upd(sel, f, v)}
          updSeat={(sid, f, v) => updSeat(sel, sid, f, v)}
          setGuests={n => setGuests(sel, n)}
          swapSeats={(aId, bId) => swapSeats(sel, aId, bId)}
        />
      )}

      {mode === "admin" && resModal !== null && modalTable && (
        <ReservationModal
          table={{ ...modalTable, resTime: resModalPresetTime || modalTable.resTime }}
          tables={tables}
          onSave={data => saveRes(resModal, data)}
          onClose={() => { setResModal(null); setResModalPresetTime(null); }}
        />
      )}
      {adminOpen && (
        <AdminPanel
          dishes={dishes} wines={wines} cocktails={cocktails} spirits={spirits} beers={beers}
          onUpdateDishes={setDishes} onUpdateWines={setWines}
          onSaveBeverages={saveBeverages}
          onClose={() => setAdminOpen(false)}
        />
      )}
      {summaryOpen && (
        <SummaryModal tables={tables} dishes={dishes} onClose={() => setSummaryOpen(false)} />
      )}
      {archiveOpen && (
        <ArchiveModal
          tables={tables} dishes={dishes}
          onArchiveAndClear={archiveAndClearAll}
          onClearAll={clearAll}
          onClose={() => setArchiveOpen(false)}
        />
      )}
    </div>
  );
}
