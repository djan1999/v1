import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const FONT = "'Roboto Mono', monospace";
const MOBILE_SAFE_INPUT_SIZE = 16;

// ── Wine DB ───────────────────────────────────────────────────────────────────
const initWines = [
  { id:1,  name:"Lunar",              producer:"Movia",             vintage:"2020", byGlass:true  },
  { id:2,  name:"Rebula Selections",  producer:"Edi Simčič",        vintage:"2021", byGlass:true  },
  { id:3,  name:"Tocai Friulano",     producer:"Radikon",           vintage:"2018", byGlass:false },
  { id:4,  name:"Malvazija",          producer:"Rojac",             vintage:"2022", byGlass:true  },
  { id:5,  name:"Blaufränkisch Res.", producer:"Moric",             vintage:"2019", byGlass:false },
  { id:6,  name:"Pinot Noir",         producer:"Edi Simčič",        vintage:"2020", byGlass:true  },
  { id:7,  name:"Jakot",              producer:"Gravner",           vintage:"2015", byGlass:false },
  { id:8,  name:"Sauvignon Blanc",    producer:"Verus",             vintage:"2023", byGlass:true  },
  { id:9,  name:"Ribolla Gialla",     producer:"Damijan Podversič", vintage:"2017", byGlass:false },
  { id:10, name:"Cviček",             producer:"Kogl",              vintage:"2022", byGlass:true  },
];

// ── Initial extra dishes ──────────────────────────────────────────────────────
const initDishes = [
  { id: 1, name: "Beetroot",  pairings: ["—", "Wine", "Non-Alc"] },
  { id: 2, name: "Cheese",    pairings: ["—", "Wine", "Non-Alc"] },
];

// ── Cocktails & Spirits ───────────────────────────────────────────────────────
const initCocktails = [
  { id: 1, name: "Aperol Spritz",    notes: "" },
  { id: 2, name: "Negroni",          notes: "" },
  { id: 3, name: "Hugo",             notes: "" },
  { id: 4, name: "Espresso Martini", notes: "" },
];
const initSpirits = [
  { id: 1, name: "Hendrick's Gin",   notes: "" },
  { id: 2, name: "Johnnie Walker",   notes: "Black Label" },
  { id: 3, name: "Diplomatico Rum",  notes: "Reserva" },
  { id: 4, name: "Grey Goose Vodka", notes: "" },
];

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
    pairing:   ex[i]?.pairing   ?? "",
    extras:    ex[i]?.extras    ?? {},
  }));

const fmt = d => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;

const initTables = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  active: i < 4,
  guests: [4,2,6,3,2,2,2,2,2,2][i],
  resName:    ["Kovač","Smith","Bianchi","","","","","","",""][i],
  resTime:    ["19:00","18:30","18:00","","","","","","",""][i],
  guestType:  ["hotel","outside","hotel","","","","","","",""][i],
  arrivedAt:  i < 3 ? fmt(new Date(Date.now() - [12,34,5][i] * 60000)) : null,
  menuType:   ["Long","Short","Long","","","","","","",""][i],
  bottleWine: null,
  restrictions: i === 1 ? [{ pos: null, note: "no gluten" }, { pos: null, note: "vegetarian" }] : [],
  birthday: i === 2,
  notes: i === 0 ? "VIP — slow pace" : "",
  seats: makeSeats([4,2,6,3,2,2,2,2,2,2][i]),
}));

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
    return () => document.removeEventListener("mousedown", h);
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
    return () => document.removeEventListener("mousedown", h);
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
    return () => document.removeEventListener("mousedown", h);
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
    return () => document.removeEventListener("mousedown", h);
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

// ── Admin Panel ───────────────────────────────────────────────────────────────
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
function AdminPanel({ dishes, wines, cocktails, spirits, onUpdateDishes, onUpdateWines, onUpdateCocktails, onUpdateSpirits, onClose }) {
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

  const handleSave = () => {
    onUpdateDishes(localDishes);
    onUpdateWines(localWines);
    onUpdateCocktails(localCocktails);
    onUpdateSpirits(localSpirits);
    onClose();
  };

  const TABS = ["wines", "cocktails", "spirits", "dishes"];
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
function ReservationModal({ table, onSave, onClose }) {
  const isMobile = useIsMobile(700);
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

        <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#666", marginBottom: 20 }}>
          TABLE {String(table.id).padStart(2,"0")} · RESERVATION
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={fieldLabel}>Name</div>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Guest name…" style={baseInp} />
          </div>

          <div>
            <div style={fieldLabel}>Sitting</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 8 }}>
              {["18:00","18:30","19:00","19:15"].map(t => (
                <button key={t} onClick={() => setTime(t)} style={{
                  fontFamily: FONT, fontSize: 13, letterSpacing: 1,
                  padding: "14px 0", flex: 1, border: "1px solid",
                  borderColor: time === t ? "#1a1a1a" : "#e8e8e8",
                  borderRadius: 2, cursor: "pointer",
                  background: time === t ? "#1a1a1a" : "#fff",
                  color: time === t ? "#fff" : t === "19:15" ? "#555" : "#888",
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
                    fontFamily: FONT, fontSize: 11, letterSpacing: 1,
                    padding: "12px 0", flex: 1, border: "1px solid",
                    borderColor: menuType === opt ? "#1a1a1a" : "#e8e8e8",
                    borderRadius: 2, cursor: "pointer",
                    background: menuType === opt ? "#1a1a1a" : "#fff",
                    color: menuType === opt ? "#fff" : "#444",
                    transition: "all 0.12s", textTransform: "uppercase",
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
          <button onClick={() => onSave({ name, time, menuType, guests, guestType, room, birthday, restrictions, notes })} style={{
            flex: 2, fontFamily: FONT, fontSize: 12, letterSpacing: 2,
            padding: "14px", border: "1px solid #1a1a1a", borderRadius: 2, cursor: "pointer", background: "#1a1a1a", color: "#fff",
          }}>SAVE</button>
        </div>
      </div>
    </div>
  );
}

// ── Table Card ────────────────────────────────────────────────────────────────
function Card({ table, mode, onClick, onSeat, onClear, onEditRes }) {
  const hasRes = table.resName || table.resTime;
  const menuLabel = table.menuType ? `${table.menuType} menu` : null;
  return (
    <div style={{
      background: "#fff", border: "1px solid",
      borderColor: table.active ? "#e0e0e0" : hasRes ? "#ebebeb" : "#f5f5f5",
      borderRadius: 2, padding: "16px 14px", cursor: table.active ? "pointer" : "default",
      display: "flex", flexDirection: "column", gap: 8, minHeight: 160,
      opacity: !table.active && !hasRes ? 0.4 : 1,
    }} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontFamily: FONT, fontSize: 20, fontWeight: 300, color: table.active ? "#1a1a1a" : "#666", letterSpacing: 1 }}>
          {String(table.id).padStart(2, "0")}
        </span>
        <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 3 }}>
          {table.birthday                 && <span style={{ fontSize: 11 }}>🎂</span>}
          {table.restrictions?.length > 0 && <span style={{ fontSize: 11 }}>⚠️</span>}
          {table.guestType === "hotel"    && <span style={{ fontFamily: FONT, fontSize: 8, color: "#1a1a1a", letterSpacing: 1, border: "1px solid #e8e8e8", borderRadius: 2, padding: "1px 4px" }}>
            {table.room ? `Hotel #${table.room}` : "H"}
          </span>}
          {menuLabel && <span style={{ fontFamily: FONT, fontSize: 8, color: "#1a1a1a", letterSpacing: 1, border: "1px solid #e8e8e8", borderRadius: 2, padding: "1px 4px" }}>{menuLabel}</span>}
          {table.active                   && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4a9a6a", display: "inline-block" }} />}
        </div>
      </div>

      {hasRes && (
        <div style={{ borderTop: "1px solid #f5f5f5", paddingTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
          {table.resName && <div style={{ fontFamily: FONT, fontSize: 12, color: "#1a1a1a" }}>{table.resName}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {table.resTime && <span style={{ fontFamily: FONT, fontSize: 10, color: "#444" }}>res. {table.resTime}</span>}
            {table.arrivedAt && <>
              <span style={{ color: "#ddd", fontSize: 10 }}>·</span>
              <span style={{ fontFamily: FONT, fontSize: 10, color: "#4a9a6a" }}>arr. {table.arrivedAt}</span>
            </>}
          </div>
        </div>
      )}

      {table.active && (
        <>
          <div style={{ fontFamily: FONT, fontSize: 10, color: "#666", letterSpacing: 1 }}>{table.guests} guests</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {table.seats.map(s => (
              <div key={s.id} style={{
                width: 7, height: 7, borderRadius: "50%",
                background: s.pairing ? (pairingStyle[s.pairing]?.color || "#e8e8e8") : "#e8e8e8",
              }} />
            ))}
          </div>
          {table.notes && <div style={{ fontFamily: FONT, fontSize: 10, color: "#555", fontStyle: "italic" }}>{table.notes}</div>}
        </>
      )}

      <div style={{ marginTop: "auto", display: "flex", gap: 6, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
        {!table.active && mode === "admin" && (
          <button onClick={onEditRes} style={{
            fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "3px 8px",
            border: "1px solid #e0e0e0", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#444",
          }}>{(table.resName || table.resTime) ? "edit" : "reserve"}</button>
        )}
        {!table.active && (
          <button onClick={onSeat} style={{
            fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "3px 8px",
            border: "1px solid #cce8cc", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#70b870",
          }}>seat</button>
        )}
        {table.active && (
          <button onClick={onClear} style={{
            fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "3px 8px",
            border: "1px solid #ffcccc", borderRadius: 2, cursor: "pointer", background: "#fff", color: "#e07070",
          }}>clear</button>
        )}
      </div>
    </div>
  );
}

// ── Detail View ───────────────────────────────────────────────────────────────
function Detail({ table, dishes, wines = [], cocktails = [], spirits = [], mode, onBack, upd, updSeat, setGuests, swapSeats }) {
  const isMobile = useIsMobile(860);
  const row1 = isMobile ? "34px 68px 1fr 28px" : "38px 75px 1fr 28px";
  const [activeDrinkTab, setActiveDrinkTab] = useState({});
  const getDrinkTab = (seatId) => activeDrinkTab[seatId] || "glass";

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
            {/* ── Line 2: Drinks / Extras ── */}
            <div style={{ paddingLeft: isMobile ? 0 : 48, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{
                border: "1px solid #ececec",
                borderRadius: 10,
                background: "#fcfcfc",
                padding: isMobile ? "10px" : "12px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ ...fieldLabel, marginBottom: 0, color: "#444" }}>Beverages</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { key: "glass", label: "By Glass", color: "#555", border: "#dedede", bg: "#ffffff" },
                      { key: "cocktail", label: "Cocktail", color: "#7a507a", border: "#dcc9ea", bg: "#fcf9ff" },
                      { key: "spirit", label: "Spirit", color: "#a07040", border: "#e5d3bb", bg: "#fffaf5" },
                    ].map(tab => {
                      const on = getDrinkTab(seat.id) === tab.key;
                      return (
                        <button key={tab.key} onClick={() => setActiveDrinkTab(prev => ({ ...prev, [seat.id]: tab.key }))} style={{
                          fontFamily: FONT, fontSize: 9, letterSpacing: 1, padding: "6px 10px",
                          border: "1px solid", borderColor: on ? tab.border : "#e8e8e8", borderRadius: 999,
                          cursor: "pointer", background: on ? tab.bg : "#fff", color: on ? tab.color : "#555",
                          fontWeight: on ? 600 : 500,
                        }}>{tab.label}</button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: isMobile ? "100%" : 260 }}>
                    {getDrinkTab(seat.id) === "glass" ? (
                      <WineSearch wineObj={null} wines={wines} byGlass={true} compact={false} placeholder="search by glass…"
                        onChange={updated => { if (!updated) return; updSeat(seat.id, "glasses", [...glasses, updated]); }} />
                    ) : getDrinkTab(seat.id) === "cocktail" ? (
                      <DrinkSearch drinkObj={null} list={cocktails} accentColor="#7a507a" placeholder="search cocktail…"
                        onChange={updated => { if (!updated) return; updSeat(seat.id, "cocktails", [...cocktailList, updated]); }} />
                    ) : (
                      <DrinkSearch drinkObj={null} list={spirits} accentColor="#a07040" placeholder="search spirit…"
                        onChange={updated => { if (!updated) return; updSeat(seat.id, "spirits", [...spiritList, updated]); }} />
                    )}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 10, color: "#666", letterSpacing: 0.5 }}>
                    {getDrinkTab(seat.id) === "glass" ? "Adds to by-glass" : getDrinkTab(seat.id) === "cocktail" ? "Adds to cocktails" : "Adds to spirits"}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...fieldLabel, marginBottom: 6, color: "#444" }}>By Glass</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {glasses.length === 0 ? <div style={{ fontFamily: FONT, fontSize: 11, color: "#777", padding: "8px 10px", border: "1px dashed #e2e2e2", borderRadius: 8 }}>none</div> : glasses.map((w, gi) => (
                        <div key={gi} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 9px", border: "1px solid #e2e2e2", borderRadius: 8, background: "#fff" }}>
                          <div style={{ width: 8, alignSelf: "stretch", borderRadius: 999, background: "#d8d8d8", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0, fontFamily: FONT, fontSize: 11, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w?.name} · {w?.producer} · {w?.vintage}</div>
                          <button onClick={() => updSeat(seat.id, "glasses", glasses.filter((_, idx) => idx !== gi))} style={{ background: "none", border: "none", color: "#777", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...fieldLabel, marginBottom: 6, color: "#6f4d85" }}>Cocktail</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {cocktailList.length === 0 ? <div style={{ fontFamily: FONT, fontSize: 11, color: "#7f7090", padding: "8px 10px", border: "1px dashed #dcc9ea", borderRadius: 8, background: "#fcf9ff" }}>none</div> : cocktailList.map((c, ci) => (
                        <div key={ci} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 9px", border: "1px solid #e5d7f0", borderRadius: 8, background: "#fcf9ff" }}>
                          <div style={{ width: 8, alignSelf: "stretch", borderRadius: 999, background: "#cfaee2", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0, fontFamily: FONT, fontSize: 11, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c?.name}{c?.notes ? ` · ${c.notes}` : ""}</div>
                          <button onClick={() => updSeat(seat.id, "cocktails", cocktailList.filter((_, idx) => idx !== ci))} style={{ background: "none", border: "none", color: "#777", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...fieldLabel, marginBottom: 6, color: "#8a6236" }}>Spirit</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {spiritList.length === 0 ? <div style={{ fontFamily: FONT, fontSize: 11, color: "#8a6d4a", padding: "8px 10px", border: "1px dashed #e5d3bb", borderRadius: 8, background: "#fffaf5" }}>none</div> : spiritList.map((sp, si2) => (
                        <div key={si2} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 9px", border: "1px solid #eadfce", borderRadius: 8, background: "#fffaf5" }}>
                          <div style={{ width: 8, alignSelf: "stretch", borderRadius: 999, background: "#d8b48c", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0, fontFamily: FONT, fontSize: 11, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sp?.name}{sp?.notes ? ` · ${sp.notes}` : ""}</div>
                          <button onClick={() => updSeat(seat.id, "spirits", spiritList.filter((_, idx) => idx !== si2))} style={{ background: "none", border: "none", color: "#777", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Extra dishes */}
              {dishes.length > 0 && (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {dishes.map(dish => {
                    const extra = seat.extras?.[dish.id] || { ordered: false, pairing: dish.pairings[0] };
                    return (
                      <div key={dish.id} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 92 }}>
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
          <div style={fieldLabel}>🍾 Bottle</div>
          <WineSearch wineObj={table.bottleWine} wines={wines} byGlass={false} placeholder="search bottle…" onChange={w => upd("bottleWine", w)} />
        </div>
        <div>
          <div style={fieldLabel}>Menu</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["Long", "Short"].map(opt => (
              <button key={opt} onClick={() => upd("menuType", table.menuType === opt ? "" : opt)} style={{
                fontFamily: FONT, fontSize: 11, letterSpacing: 1,
                padding: "12px 0", flex: 1, border: "1px solid",
                borderColor: table.menuType === opt ? "#1a1a1a" : "#e8e8e8",
                borderRadius: 2, cursor: "pointer",
                background: table.menuType === opt ? "#1a1a1a" : "#fff",
                color: table.menuType === opt ? "#fff" : "#444",
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
    </div>
  );
}


function statusPill(isActive, label) {
  return (
    <span style={{
      fontFamily: FONT, fontSize: 8, letterSpacing: 1, fontWeight: 700,
      color: isActive ? "#2f7a45" : "#9a6a18",
      border: `1px solid ${isActive ? "#9bd0aa" : "#e8d8b8"}`,
      background: isActive ? "#ecf8ef" : "#fff8ea",
      borderRadius: 999, padding: "3px 8px"
    }}>{label}</span>
  );
}

// ── Display Board ─────────────────────────────────────────────────────────────
function DisplayBoard({ tables, dishes }) {
  const [sel, setSel]       = useState(null);   // desktop: selected table id
  const [expanded, setExp]  = useState(null);   // mobile: expanded table id
  const isMobile = useIsMobile(700);

  const sorted = [...tables].sort((a, b) => {
    const rank = t => t.active ? 0 : (t.resTime ? 1 : 2);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    const timeA = a.arrivedAt || a.resTime || "99:99";
    const timeB = b.arrivedAt || b.resTime || "99:99";
    return timeA.localeCompare(timeB);
  });
  const visible = sorted.filter(t => t.active || t.resTime || t.resName);

  useEffect(() => {
    const firstActive = sorted.find(t => t.active);
    if (sel === null && firstActive) setSel(firstActive.id);
  }, [tables]);

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

  // ── Shared seat detail block (used in both layouts) ──────────────────────────
  const TableDetail = ({ table }) => (
    <>
      {table.notes && (
        <div style={{
          fontFamily: FONT, fontSize: 12, color: "#555", fontStyle: "italic",
          padding: "10px 14px", background: "#f8f8f8", border: "1px solid #e8e8e8",
          borderRadius: 2, marginBottom: 20,
        }}>{table.notes}</div>
      )}

      {/* Unassigned restrictions warning */}
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

      {/* Seat cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
      {table.seats.map((seat) => {
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
                <div style={{ ...fieldLabel, marginBottom: 0, color: "#555" }}>Position</div>
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

  // ── MOBILE layout: stacked tap-to-expand cards ───────────────────────────────
  if (isMobile) {
    return (
      <div style={{ overflowY: "auto", overflowX: "hidden", padding: "12px 12px 40px", background: "#fafafa", minHeight: "calc(100vh - 52px)" }}>
        {visible.length === 0 && (
          <div style={{ fontFamily: FONT, fontSize: 10, color: "#666", textAlign: "center", marginTop: 60, letterSpacing: 2 }}>
            no active tables
          </div>
        )}
        {visible.map(t => {
          const isOpen   = expanded === t.id;
          const isSeated = t.active;
          const hasRestr = (t.restrictions || []).some(r => r.note);

          return (
            <div key={t.id} style={{
              background: isSeated ? "#f8fcf9" : "#fff", borderRadius: 4,
              border: `1px solid ${isSeated ? "#9bd0aa" : "#ebebeb"}`,
              marginBottom: 10,
              boxShadow: isOpen ? "0 2px 16px rgba(0,0,0,0.07)" : "none",
              transition: "box-shadow 0.15s",
              overflow: "hidden",
            }}>
              {/* ── Tap row ── */}
              <div onClick={() => setExp(isOpen ? null : t.id)} style={{
                padding: "16px 16px",
                display: "flex", alignItems: "center", gap: 14,
                cursor: "pointer",
              }}>
                {/* Table number */}
                <div style={{
                  fontFamily: FONT, fontSize: 26, fontWeight: 300,
                  color: isSeated ? "#1a1a1a" : "#444",
                  minWidth: 36, lineHeight: 1,
                }}>{String(t.id).padStart(2,"0")}</div>

                {/* Middle: name + times */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {t.resName && (
                    <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: "#1a1a1a", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.resName}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {t.resTime && (
                      <span style={{ fontFamily: FONT, fontSize: 11, color: "#1a1a1a", fontWeight: 500 }}>res. {t.resTime}</span>
                    )}
                    {t.arrivedAt && (
                      <span style={{ fontFamily: FONT, fontSize: 11, color: "#4a9a6a", fontWeight: 500 }}>arr. {t.arrivedAt}</span>
                    )}
                    {isSeated ? (
                      <span style={{ fontFamily: FONT, fontSize: 9, color: "#2f7a45", letterSpacing: 1, border: "1px solid #9bd0aa", borderRadius: 999, padding: "3px 8px", background: "#ecf8ef", fontWeight: 700 }}>SEATED</span>
                    ) : (
                      <span style={{ fontFamily: FONT, fontSize: 9, color: "#9a6a18", letterSpacing: 1, border: "1px solid #e8d8b8", borderRadius: 999, padding: "3px 8px", background: "#fff8ea", fontWeight: 700 }}>RESERVED</span>
                    )}
                  </div>
                </div>

                {/* Right: badges + chevron */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {<span style={statusPill(isSeated, isSeated ? "LIVE" : "RESERVED")}>{isSeated ? "LIVE" : "RESERVED"}</span>}
                  {t.birthday && <span style={{ fontSize: 14 }}>🎂</span>}
                  {t.menuType && <span style={{ fontFamily: FONT, fontSize: 8, color: "#1a1a1a", border: "1px solid #e8e8e8", borderRadius: 2, padding: "3px 6px" }}>{t.menuType}</span>}
                  {hasRestr   && <span style={{ fontSize: 14 }}>⚠️</span>}
                  {t.guestType === "hotel" && t.room && (
                    <span style={{ fontFamily: FONT, fontSize: 9, color: "#a07040", border: "1px solid #d4b888", borderRadius: 2, padding: "3px 6px", fontWeight: 500 }}>
                      #{t.room}
                    </span>
                  )}
                  <span style={{
                    fontFamily: FONT, fontSize: 16, color: "#555",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s", display: "inline-block", lineHeight: 1,
                    marginLeft: 4,
                  }}>⌄</span>
                </div>
              </div>

              {/* ── Expanded detail ── */}
              {isOpen && (
                <div style={{ borderTop: "1px solid #f0f0f0", padding: "16px 16px 20px", background: "#fff" }}>
                  {/* Hotel + timing chips */}
                  {(t.guestType === "hotel" || t.arrivedAt || t.resTime || t.menuType) && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                      {t.guestType === "hotel" && t.room && chip(`Hotel #${t.room}`, "#7a5020", "#f5ead8", "#c8a060", true)}
                      {t.menuType && chip(`${t.menuType} menu`, "#333", "#f8f8f8", "#d8d8d8", true)}
                      {t.resTime   && chip(`res. ${t.resTime}`,   "#555", "#f0f0f0", "#d8d8d8")}
                      {t.arrivedAt && chip(`arr. ${t.arrivedAt}`, "#2a6a3a", "#e0f5ea", "#7acc8a", true)}
                      {chip(`${t.guests} guest${t.guests === 1 ? "" : "s"}`, "#333", "#f5f5f5", "#dedede", true)}
                      {t.birthday  && chip("🎂 birthday", "#7a5020", "#fdf0e0", "#d4b888", true)}
                    </div>
                  )}
                  <TableDetail table={t} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── DESKTOP layout: split panel ──────────────────────────────────────────────
  const table = tables.find(t => t.id === sel);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 52px)", overflow: "hidden" }}>

      {/* Left: table list */}
      <div style={{
        width: 220, flexShrink: 0, borderRight: "1px solid #e8e8e8",
        overflowY: "auto", padding: "16px 0", background: "#fafafa",
      }}>
        {visible.length === 0 && (
          <div style={{ fontFamily: FONT, fontSize: 10, color: "#666", padding: "20px", letterSpacing: 1 }}>no reservations</div>
        )}
        {visible.map(t => {
          const isSel = t.id === sel;
          const isSeated = t.active;
          return (
            <div key={t.id} onClick={() => setSel(t.id)} style={{
              padding: "14px 20px", cursor: "pointer",
              background: isSel ? "#fff" : isSeated ? "#f8fcf9" : "transparent",
              borderLeft: isSel ? "2px solid #1a1a1a" : isSeated ? "2px solid #7bc492" : "2px solid transparent",
              borderBottom: "1px solid #f0f0f0",
              transition: "all 0.1s",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 400, color: "#1a1a1a", letterSpacing: 1 }}>
                    {String(t.id).padStart(2,"0")}
                  </span>
                  {isSeated && <span style={{ fontFamily: FONT, fontSize: 8, color: "#2f7a45", border: "1px solid #9bd0aa", background: "#ecf8ef", borderRadius: 2, padding: "2px 5px", fontWeight: 600, letterSpacing: 1 }}>SEATED</span>}
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {t.birthday && <span style={{ fontSize: 11 }}>🎂</span>}
                  {t.menuType && <span style={{ fontFamily: FONT, fontSize: 8, color: "#1a1a1a", border: "1px solid #e8e8e8", borderRadius: 2, padding: "2px 5px" }}>{t.menuType}</span>}
                  {(t.restrictions||[]).some(r => r.note) && <span style={{ fontSize: 11 }}>⚠️</span>}
                  {t.guestType === "hotel" && (
                    <span style={{ fontFamily: FONT, fontSize: 8, color: "#a07040", border: "1px solid #d4b888", borderRadius: 2, padding: "2px 5px", fontWeight: 500 }}>
                      {t.room ? `#${t.room}` : "H"}
                    </span>
                  )}
                </div>
              </div>
              {t.resName && (
                <div style={{ fontFamily: FONT, fontSize: 12, color: "#1a1a1a", fontWeight: 500, marginBottom: 3 }}>{t.resName}</div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {t.resTime && (
                  <span style={{ fontFamily: FONT, fontSize: 10, color: "#1a1a1a", fontWeight: 500 }}>
                    {isSeated ? `res. ${t.resTime}` : `res. ${t.resTime}`}
                  </span>
                )}
                {t.arrivedAt && (
                  <span style={{ fontFamily: FONT, fontSize: 10, color: "#4a9a6a", fontWeight: 500 }}>arr. {t.arrivedAt}</span>
                )}
                {!isSeated && (
                  <span style={{ fontFamily: FONT, fontSize: 9, color: "#666", letterSpacing: 1 }}>PENDING</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: detail */}
      <div style={{ flex: 1, overflowY: "auto", padding: "36px 48px", background: "#fff" }}>
        {!table ? (
          <div style={{ fontFamily: FONT, fontSize: 11, color: "#666", marginTop: 60, textAlign: "center", letterSpacing: 2 }}>
            SELECT A TABLE
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 4, color: "#444", marginBottom: 4 }}>TABLE</div>
                <div style={{ fontFamily: FONT, fontSize: 60, fontWeight: 300, color: "#1a1a1a", lineHeight: 1 }}>
                  {String(table.id).padStart(2,"0")}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, paddingTop: 4 }}>
                {table.resName && (
                  <span style={{ fontFamily: FONT, fontSize: 18, color: "#1a1a1a", fontWeight: 400 }}>{table.resName}</span>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {table.guestType === "hotel" && table.room && chip(`Hotel #${table.room}`, "#7a5020", "#f5ead8", "#c8a060", true)}
                  {table.menuType && chip(`${table.menuType} menu`, "#333", "#f8f8f8", "#d0d0d0", true)}
                  {table.resTime   && chip(`res. ${table.resTime}`,   "#333", "#f0f0f0", "#d0d0d0")}
                  {table.arrivedAt && chip(`arr. ${table.arrivedAt}`, "#2a6a3a", "#e0f5ea", "#7acc8a", true)}
                  {chip(`${table.guests} guest${table.guests === 1 ? "" : "s"}`, "#333", "#f5f5f5", "#dedede", true)}
                  {table.birthday  && chip("🎂 birthday cake", "#7a5020", "#fdf0e0", "#d4b888", true)}
                </div>
              </div>
            </div>
            <TableDetail table={table} />
          </>
        )}
      </div>
    </div>
  );
}


// ── PIN codes ─────────────────────────────────────────────────────────────────
const PINS = { admin: "3412" };

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onEnter }) {
  const [picking, setPicking] = useState(null); // null | "admin" | "service"
  const [pin, setPin]         = useState("");
  const [shake, setShake]     = useState(false);

  const MODES = [
    { id: "display", label: "Display",  sub: "Read-only view",        locked: false },
    { id: "service", label: "Service",  sub: "Seat & service inputs", locked: false },
    { id: "admin",   label: "Admin",    sub: "Full access",           locked: true  },
  ];

  const handlePick = mode => {
    if (!mode.locked) { onEnter(mode.id); return; }
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
        setPin("");
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setPin(""); }, 600);
      }
    }
  };

  const handleBack = () => { setPicking(null); setPin(""); };

  return (
    <div style={{
      minHeight: "100vh", background: "#fff",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: FONT, padding: "20px 16px", overflowX: "hidden", WebkitTextSizeAdjust: "100%",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <GlobalStyle />

      <div style={{ marginBottom: 52, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: 6, color: "#1a1a1a", marginBottom: 6 }}>MILKA</div>
        <div style={{ fontSize: 9, letterSpacing: 4, color: "#555" }}>SERVICE BOARD</div>
      </div>

      {!picking ? (
        /* Mode selection tiles */
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => handlePick(m)} style={{
              fontFamily: FONT, textAlign: "left",
              padding: "22px 24px", border: "1px solid #e8e8e8",
              borderRadius: 3, cursor: "pointer", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "all 0.12s", width: "100%",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#1a1a1a"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e8e8e8"}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", letterSpacing: 2, marginBottom: 4 }}>
                  {m.label.toUpperCase()}
                </div>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: 1 }}>{m.sub}</div>
              </div>
              <div style={{ fontSize: 14, color: m.locked ? "#555" : "#4a9a6a" }}>
                {m.locked ? "🔒" : "→"}
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* PIN entry */
        <div style={{ width: "100%", maxWidth: 300, margin: "0 auto", textAlign: "center" }}>
          <button onClick={handleBack} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: FONT, fontSize: 10, color: "#666", letterSpacing: 2,
            marginBottom: 32, display: "block", margin: "0 auto 32px",
          }}>← back</button>

          <div style={{ fontSize: 11, letterSpacing: 3, color: "#444", marginBottom: 28, textTransform: "uppercase" }}>
            {picking} · enter PIN
          </div>

          {/* PIN dots */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 14, marginBottom: 36,
            animation: shake ? "shake 0.4s ease" : "none",
          }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: "50%",
                background: pin.length > i ? "#1a1a1a" : "#e8e8e8",
                transition: "background 0.1s",
              }} />
            ))}
          </div>

          {/* Numpad */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d, i) => (
              <button key={i} onClick={() => {
                if (d === "") return;
                if (d === "⌫") { setPin(p => p.slice(0,-1)); return; }
                if (pin.length < 4) handleDigit(String(d));
              }} style={{
                fontFamily: FONT, fontSize: 20, fontWeight: 300,
                padding: "20px 0", border: "1px solid #e8e8e8",
                borderRadius: 2, cursor: d === "" ? "default" : "pointer",
                background: d === "" ? "transparent" : "#fff",
                color: "#1a1a1a", transition: "all 0.08s",
                visibility: d === "" ? "hidden" : "visible",
              }}
              onMouseEnter={e => { if (d !== "") e.currentTarget.style.background = "#f5f5f5"; }}
              onMouseLeave={e => { if (d !== "") e.currentTarget.style.background = "#fff"; }}
              >{d}</button>
            ))}
          </div>

          <style>{`@keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-8px)}
            40%{transform:translateX(8px)}
            60%{transform:translateX(-5px)}
            80%{transform:translateX(5px)}
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
  const initialState = localSnapshot || defaultBoardState();

  const [tables, setTables]         = useState(initialState.tables);
  const [dishes, setDishes]         = useState(initialState.dishes);
  const [wines, setWines]           = useState(initialState.wines);
  const [cocktails, setCocktails]   = useState(initialState.cocktails);
  const [spirits, setSpirits]       = useState(initialState.spirits);
  const [mode, setMode]             = useState(() => {
    try {
      return localStorage.getItem("milka_mode") || null;
    } catch {
      return null;
    }
  }); // null = login screen
  const [sel, setSel]             = useState(null);
  const [resModal, setResModal]   = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState(hasSupabaseConfig ? "connecting" : "local-only");
  const isMobileUi = useIsMobile(760);

  const applyingRemoteRef = useRef(false);
  const lastRemoteJsonRef = useRef("");
  const saveTimerRef = useRef(null);

  const boardState = { tables, dishes, wines, cocktails, spirits };
  const boardJson = JSON.stringify(boardState);

  const applyBoardState = payload => {
    if (!payload || typeof payload !== "object") return;
    applyingRemoteRef.current = true;
    lastRemoteJsonRef.current = JSON.stringify(payload);
    setTables(payload.tables || initTables);
    setDishes(payload.dishes || initDishes);
    setWines(payload.wines || initWines);
    setCocktails(payload.cocktails || initCocktails);
    setSpirits(payload.spirits || initSpirits);
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

  const clear = id => {
    if (typeof window !== "undefined" && !window.confirm("Clear this table and reset its details?")) return;
    setTables(p => p.map(t =>
      t.id !== id ? t : {
        ...t, active: false, arrivedAt: null, resName: "", resTime: "", guestType: "", room: "",
        seats: makeSeats(2), bottleWine: null, restrictions: [], birthday: false, notes: "",
      }
    ));
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

  const saveRes = (id, { name, time, menuType, guests, guestType, room, birthday, restrictions, notes }) => {
    setTables(p => p.map(t =>
      t.id !== id ? t : { ...t, resName: name, resTime: time, menuType, guestType, room, guests, seats: makeSeats(guests, t.seats), birthday, restrictions, notes }
    ));
    setResModal(null);
  };

  const changeMode = nextMode => {
    setMode(nextMode);
    try {
      if (nextMode) localStorage.setItem("milka_mode", nextMode);
      else localStorage.removeItem("milka_mode");
    } catch {}
  };

  const switchMode = () => { changeMode(null); setSel(null); };

  useEffect(() => {
    writeLocalBoardState(boardState);

    if (applyingRemoteRef.current && boardJson === lastRemoteJsonRef.current) {
      applyingRemoteRef.current = false;
      return;
    }

    if (!supabase) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from("board_state")
        .upsert({
          id: "main",
          state: boardState,
          updated_at: new Date().toISOString(),
        });

      setSyncStatus(error ? "sync-error" : "live");
    }, 350);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [boardJson]);

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    const loadRemote = async () => {
      const { data, error } = await supabase
        .from("board_state")
        .select("state, updated_at")
        .eq("id", "main")
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setSyncStatus("sync-error");
        return;
      }

      if (data?.state) {
        applyBoardState(data.state);
        setSyncStatus("live");
      } else {
        const { error: seedError } = await supabase
          .from("board_state")
          .upsert({ id: "main", state: boardState, updated_at: new Date().toISOString() });

        setSyncStatus(seedError ? "sync-error" : "live");
      }
    };

    loadRemote();

    const channel = supabase
      .channel("milka-board-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "board_state", filter: "id=eq.main" },
        payload => {
          const nextState = payload.new?.state;
          if (!nextState) return;
          const nextJson = JSON.stringify(nextState);
          if (nextJson === boardJson) return;
          applyBoardState(nextState);
          setSyncStatus("live");
        }
      )
      .subscribe(status => {
        if (status === "SUBSCRIBED") setSyncStatus("live");
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);


  const active   = tables.filter(t => t.active);
  const seated   = active.reduce((a, t) => a + t.guests, 0);
  const reserved = tables.filter(t => !t.active && (t.resName || t.resTime)).length;

  // Login screen
  if (!mode) return <LoginScreen onEnter={m => { changeMode(m); setSel(null); }} />;

  // Display mode — no header chrome needed
  if (mode === "display") return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT, overflowX: "hidden", WebkitTextSizeAdjust: "100%" }}>
      <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <GlobalStyle />
      <div style={{
        borderBottom: "1px solid #f0f0f0",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 4, color: "#1a1a1a" }}>MILKA</span>
            <span style={{ width: 1, height: 12, background: "#e8e8e8" }} />
            <span style={{ fontSize: 10, letterSpacing: 3, color: "#1a1a1a" }}>DISPLAY</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={statusPill(syncStatus === "live", syncStatus === "live" ? "SYNC" : syncStatus === "local-only" ? "LOCAL" : syncStatus === "connecting" ? "LINK" : "ERROR")}>
              {syncStatus === "live" ? "SYNC" : syncStatus === "local-only" ? "LOCAL" : syncStatus === "connecting" ? "LINK" : "ERROR"}
            </span>
            <button onClick={switchMode} style={{
              fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px",
              border: "1px solid #e8e8e8", borderRadius: 999, cursor: "pointer",
              background: "#fff", color: "#1a1a1a", flexShrink: 0,
            }}>EXIT</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={topStatChip}>{active.length} seated</span>
          <span style={topStatChip}>{reserved} reserved</span>
          <span style={topStatChip}>{seated} guests</span>
        </div>
      </div>
      <DisplayBoard tables={tables} dishes={dishes} />
    </div>
  );

  // Admin + Service modes share the same layout
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT, overflowX: "hidden", WebkitTextSizeAdjust: "100%" }}>
      <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <GlobalStyle />

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #f0f0f0",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 4, color: "#1a1a1a" }}>MILKA</span>
            <span style={{ width: 1, height: 14, background: "#e8e8e8" }} />
            <span style={{
              fontSize: 10, letterSpacing: 3,
              color: mode === "admin" ? "#4b4b88" : "#2f7a45",
              textTransform: "uppercase",
              fontWeight: 700,
            }}>{mode}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {mode === "admin" && (
              <button onClick={() => setAdminOpen(true)} style={{
                fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px",
                border: "1px solid #e8e8e8", borderRadius: 999, cursor: "pointer",
                background: "#fff", color: "#1a1a1a",
              }}>MENU</button>
            )}
            <span style={statusPill(true, "LIVE")}>LIVE</span>
            <button onClick={switchMode} style={{
              fontFamily: FONT, fontSize: 9, letterSpacing: 2, padding: "6px 10px",
              border: "1px solid #e8e8e8", borderRadius: 999, cursor: "pointer",
              background: "#fff", color: "#1a1a1a", flexShrink: 0,
            }}>EXIT</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={topStatChip}>{active.length} seated</span>
          <span style={topStatChip}>{reserved} reserved</span>
          <span style={topStatChip}>{seated} guests</span>
        </div>
      </div>

      {sel === null ? (
        <div style={{ padding: "20px 12px", maxWidth: 960, margin: "0 auto", overflowX: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {tables.map(t => (
              <Card key={t.id} table={t}
                mode={mode}
                onClick={() => t.active && setSel(t.id)}
                onSeat={() => seatTable(t.id)}
                onClear={() => clear(t.id)}
                onEditRes={() => mode === "admin" && setResModal(t.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <Detail
          table={selTable}
          dishes={dishes}
          wines={wines}
          cocktails={cocktails}
          spirits={spirits}
          mode={mode}
          onBack={() => setSel(null)}
          upd={(f, v) => upd(sel, f, v)}
          updSeat={(sid, f, v) => updSeat(sel, sid, f, v)}
          setGuests={n => setGuests(sel, n)}
          swapSeats={(aId, bId) => swapSeats(sel, aId, bId)}
        />
      )}

      {mode === "admin" && resModal !== null && modalTable && (
        <ReservationModal table={modalTable} onSave={data => saveRes(resModal, data)} onClose={() => setResModal(null)} />
      )}
      {adminOpen && (
        <AdminPanel
          dishes={dishes} wines={wines} cocktails={cocktails} spirits={spirits}
          onUpdateDishes={setDishes} onUpdateWines={setWines}
          onUpdateCocktails={setCocktails} onUpdateSpirits={setSpirits}
          onClose={() => setAdminOpen(false)} />
      )}
    </div>
  );
}
