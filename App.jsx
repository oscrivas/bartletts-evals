import React, { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import { storageGet, storageSet } from "./firebase";
import { sendSurveyEmails } from "./notifications";
import {
  ChefHat, Users, ClipboardList, ChevronDown, ChevronRight, Check,
  Loader2, Plus, X, AlertTriangle, DollarSign, CalendarClock, Printer, Home, Send,
} from "lucide-react";

/* ================= ROLE RUBRICS ================= */

const SB_MB_CATEGORIES = [
  { key: "hospitality", label: "Hospitality", points: 10, desc: "Demonstrates care and grace. Enthusiasm for serving and pleasing guests." },
  { key: "attitude", label: "Positive Mental Attitude", points: 10, desc: "Natural smile, takes constructive criticism, upbeat with guests and co-workers." },
  { key: "professionalism", label: "Professionalism", points: 10, desc: "Impeccable uniform, clean grooming, energy and speed, proper etiquette." },
  { key: "foodWine", label: "Food & Wine Knowledge", points: 10, desc: "Strong knowledge of food, liquor, beer & wine. Prepares specs promptly." },
  { key: "criticalThinking", label: "Critical Thinking", points: 10, desc: "Reads and reacts to guest situations. Good judgement. Financially responsible." },
  { key: "techLang", label: "Technical Proficiency & Language", points: 20, desc: "Mastery of service standards, proper drink pours, reads tickets, rich language." },
  { key: "teamwork", label: "Quantity of Work/Teamwork", points: 20, desc: "Opens/closes bar efficiently, keeps hands full, gives to the team, stays busy." },
  { key: "aimToPlease", label: "Aim to Please Approach", points: 10, desc: "Own style of hospitality, inspires loyalty, sense of urgency, initiative." },
];

const ROLES = {
  HOH: {
    label: "Heart of House", short: "Kitchen", hasRaise: true,
    categories: [
      { key: "professionalism", label: "Professionalism", points: 20, desc: "Clocks in on time. Chef coat tucked in. Well-groomed. Uniform in good condition. Sharp knives." },
      { key: "attitude", label: "Attitude", points: 10, desc: "Positive mental attitude. Takes instruction well. Maintains focus under pressure." },
      { key: "communication", label: "Communication", points: 10, desc: "Constant communication with team. Correct calls and call-backs. Calls for backup." },
      { key: "teamwork", label: "Teamwork", points: 20, desc: "Accepts & offers help. Upholds standards. Uses down time to prep/clean/restock." },
      { key: "integrity", label: "Integrity", points: 20, desc: "Own quality calls, executes prep to standard, labels/rotates, food safety procedures." },
      { key: "cleanliness", label: "Cleanliness", points: 20, desc: "Clean floors & walkways. Daily cleaning unprompted. Hand washing. FIFO." },
    ],
  },
  SERVER: {
    label: "Server", short: "Server", hasRaise: false,
    categories: [
      { key: "hospitality", label: "Hospitality & Aim to Please", points: 20, desc: "Care and grace. Enthusiasm for guests. Two feet/five feet rule. Anticipates needs." },
      { key: "attitude", label: "Positive Mental Attitude", points: 10, desc: "Natural smile, takes constructive criticism, upbeat and friendly." },
      { key: "professionalism", label: "Professionalism", points: 10, desc: "Impeccable uniform, energy and speed, proper language and etiquette." },
      { key: "criticalThinking", label: "Critical Thinking", points: 10, desc: "Reads guest situations. Good judgement. Financially responsible. Reads table pace." },
      { key: "technical", label: "Technical Proficiency", points: 10, desc: "Mastery of service standards. Reads tickets. Strong POS knowledge." },
      { key: "language", label: "Language", points: 10, desc: "Rich, varied language. Precise table introduction. Communicates well." },
      { key: "teamwork", label: "Quantity of Work/Teamwork", points: 20, desc: "Runs food/drinks unprompted. Uses the 3 C's: consolidate, communicate, circulate." },
    ],
  },
  SA: {
    label: "Server Assistant", short: "Assistant", hasRaise: true,
    categories: [
      { key: "hospitality", label: "Hospitality & Aim to Please", points: 20, desc: "Care and grace. Anticipates server needs and steps in appropriately." },
      { key: "attitude", label: "Positive Mental Attitude", points: 10, desc: "Natural smile, takes constructive criticism, upbeat and friendly." },
      { key: "professionalism", label: "Professionalism", points: 10, desc: "Impeccable uniform, energy and speed, proper language and etiquette." },
      { key: "criticalThinking", label: "Critical Thinking", points: 10, desc: "Reads guest situations. Anticipates teammates' needs before being asked." },
      { key: "technical", label: "Technical Proficiency", points: 20, desc: "Mastery of service standards. Runs food/drinks/side work without prompting." },
      { key: "language", label: "Language", points: 10, desc: "Rich, varied language. Precise table introduction. Communicates well." },
      { key: "teamwork", label: "Quantity of Work/Teamwork", points: 20, desc: "Runs food/drinks unprompted. Uses the 3 C's: consolidate, communicate, circulate." },
    ],
  },
  SB: { label: "Service Bartender", short: "Service Bar", hasRaise: true, categories: SB_MB_CATEGORIES },
  MB: { label: "Main Bartender", short: "Main Bar", hasRaise: false, categories: SB_MB_CATEGORIES },
  HOST: {
    label: "Host", short: "Host", hasRaise: true,
    categories: [
      { key: "hospitality", label: "Hospitality & Aim to Please", points: 20, desc: "Care and grace. Aware of guests arriving/departing. Goes above and beyond." },
      { key: "attitude", label: "Positive Mental Attitude", points: 10, desc: "Natural smile, takes constructive criticism, upbeat and friendly." },
      { key: "professionalism", label: "Professionalism", points: 10, desc: "Impeccable uniform, energy and speed, proper language and etiquette." },
      { key: "restaurantOps", label: "Restaurant Operations", points: 10, desc: "Attends meetings. Supports management. Leads shifts. Knows seating for all zones." },
      { key: "criticalThinking", label: "Critical Thinking", points: 10, desc: "Reads guest situations. Calm under pressure. Offers to carry apps/drinks." },
      { key: "technical", label: "Technical Proficiency", points: 10, desc: "Mastery of standards. Actively greets & hot-boxes. Quotes wait times accurately." },
      { key: "language", label: "Language", points: 10, desc: "Rich, varied language. Good phone etiquette. Provides reservation info." },
      { key: "teamwork", label: "Quantity of Work/Teamwork", points: 20, desc: "Initiates cleanliness. Works well with others. Floor awareness, sets pace." },
    ],
  },
};

const ROLE_ORDER = ["HOH", "SERVER", "SA", "SB", "MB", "HOST"];
const SERVER_TIERS = ["Tier 1", "Tier 2", "Tier 3"];
const RATE_ROLES = ["HOH", "SA", "SB", "HOST"]; // hourly-rate-based roles (Main Bartender intentionally excluded)

function matchRoleKey(input) {
  const norm = input.trim().toLowerCase();
  for (const key of ROLE_ORDER) {
    const candidates = [key.toLowerCase(), ROLES[key].label.toLowerCase(), ROLES[key].short.toLowerCase()];
    if (candidates.includes(norm)) return key;
  }
  return null;
}

const TIERS = [
  { key: "exceeds", label: "Exceeds", factor: 1 },
  { key: "meets", label: "Meets", factor: 0.8 },
  { key: "development", label: "Development Needed", factor: 0.6 },
];

/* ================= HELPERS ================= */

const CYCLE_MONTHS = 6;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function addMonths(iso, n) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + n);
  return d;
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function bandFor(total) {
  if (total >= 90) return { label: "Exceeds Standards", color: "#4B6E4F" };
  if (total >= 75) return { label: "Meets Standards", color: "#B8863B" };
  return { label: "Does Not Meet Standards", color: "#C4472A" };
}
function dueStatus(lastEvaluatedOrHire) {
  const due = addMonths(lastEvaluatedOrHire, CYCLE_MONTHS);
  const daysUntil = Math.round((due - new Date()) / 86400000);
  let level = "ok";
  if (daysUntil < 0) level = "overdue";
  else if (daysUntil <= 14) level = "soon";
  return { due, daysUntil, level };
}
// Standing weekly cadence: team meeting every Tuesday, surveys due the Monday before (end of day).
function meetingCycle() {
  const now = new Date();
  const dow = now.getDay();
  let daysUntilTuesday = (2 - dow + 7) % 7;
  if (daysUntilTuesday === 0) daysUntilTuesday = 7;
  const meetingDate = new Date(now);
  meetingDate.setDate(now.getDate() + daysUntilTuesday);
  meetingDate.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(meetingDate);
  deadlineDate.setDate(meetingDate.getDate() - 1);
  deadlineDate.setHours(23, 59, 59, 999);
  const msLeft = deadlineDate - now;
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
  return { meetingDate, deadlineDate, daysLeft, isPastDeadline: msLeft < 0 };
}

async function safeGet(key, _shared) {
  return storageGet(key);
}
async function safeSet(key, value, _shared) {
  return storageSet(key, value);
}

async function notifyManagers(managers, survey) {
  return sendSurveyEmails(managers, survey);
}

/* ================= DATA HOOKS ================= */

function useManagers() {
  const [managers, setManagers] = useState(null);
  const load = useCallback(async () => {
    const raw = await safeGet("managers_v1", true);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Normalize any leftover legacy entries (plain name strings, from
        // before email addresses were required) into the current shape.
        const normalized = parsed.map((m) => (typeof m === "string" ? { name: m, email: "" } : m));
        setManagers(normalized);
        return;
      } catch (e) {}
    }
    setManagers([]);
  }, []);
  useEffect(() => { load(); }, [load]);
  const save = async (next) => {
    const ok = await safeSet("managers_v1", JSON.stringify(next), true);
    if (ok) setManagers(next);
    return ok;
  };
  return { managers, load, save };
}

function useEmployees() {
  const [employees, setEmployees] = useState(null);
  const load = useCallback(async () => {
    const raw = await safeGet("employees_v1", true);
    if (raw) { try { setEmployees(JSON.parse(raw)); return; } catch (e) {} }
    setEmployees([]);
  }, []);
  useEffect(() => { load(); }, [load]);
  const save = async (next) => {
    const ok = await safeSet("employees_v1", JSON.stringify(next), true);
    if (ok) setEmployees(next);
    return ok;
  };
  return { employees, load, save };
}

function useSurveys() {
  const [surveys, setSurveys] = useState(null);
  const load = useCallback(async () => {
    const raw = await safeGet("surveys_v1", true);
    if (raw) { try { setSurveys(JSON.parse(raw)); return; } catch (e) {} }
    setSurveys([]);
  }, []);
  useEffect(() => { load(); }, [load]);
  const save = async (next) => {
    const ok = await safeSet("surveys_v1", JSON.stringify(next), true);
    if (ok) setSurveys(next);
    return ok;
  };
  return { surveys, load, save };
}

/* ================= APP SHELL ================= */

export default function App() {
  const [tab, setTab] = useState("hq");
  const [managerName, setManagerName] = useState("");
  const [nameLocked, setNameLocked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("bartletts_manager_name");
    if (saved) {
      setManagerName(saved);
      setNameLocked(true);
    }
  }, []);

  const lockName = (name) => {
    localStorage.setItem("bartletts_manager_name", name);
    setManagerName(name);
    setNameLocked(true);
  };
  const switchManager = () => {
    localStorage.removeItem("bartletts_manager_name");
    setManagerName("");
    setNameLocked(false);
  };

  return (
    <div style={styles.page}>
      <style>{globalCss}</style>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <ChefHat size={22} color="#EFEAE0" strokeWidth={2} />
          <span style={styles.brand}>BARTLETT'S</span>
        </div>
        <div style={styles.headerSub}>Staff Evaluations</div>
      </header>

      <nav style={styles.tabBar}>
        <button style={{ ...styles.tabBtn, ...(tab === "hq" ? styles.tabBtnActive : {}) }} onClick={() => setTab("hq")}>
          <Home size={16} /><span>HQ</span>
        </button>
        <button style={{ ...styles.tabBtn, ...(tab === "directory" ? styles.tabBtnActive : {}) }} onClick={() => setTab("directory")}>
          <Users size={16} /><span>Directory</span>
        </button>
        <button style={{ ...styles.tabBtn, ...(tab === "surveys" ? styles.tabBtnActive : {}) }} onClick={() => setTab("surveys")}>
          <ClipboardList size={16} /><span>Surveys</span>
        </button>
      </nav>

      {!nameLocked ? (
        <ManagerGate onLock={lockName} />
      ) : tab === "hq" ? (
        <HQView managerName={managerName} onGoSurveys={() => setTab("surveys")} onGoDirectory={() => setTab("directory")} />
      ) : tab === "directory" ? (
        <DirectoryView />
      ) : (
        <SurveysView managerName={managerName} onSwitchManager={switchManager} />
      )}
    </div>
  );
}

function ManagerGate({ onLock }) {
  const { managers, save } = useManagers();
  const [query, setQuery] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [adding, setAdding] = useState(false);

  if (managers === null) {
    return <div style={styles.card}><div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Loader2 size={22} className="spin" color="#6B7280" /></div></div>;
  }

  const addManager = async () => {
    if (!query.trim() || !emailInput.trim()) return;
    const next = [...managers, { name: query.trim(), email: emailInput.trim() }].sort((a, b) => a.name.localeCompare(b.name));
    await save(next);
    onLock(query.trim());
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Who's this?</h2>
      <p style={styles.cardHint}>Pick your name from the list — no password, this just tags what you submit.</p>

      {managers.length > 0 && !adding && (
        <div style={styles.suggestBox}>
          {managers.map((m) => (
            <button key={m.name} style={styles.suggestItem} onClick={() => onLock(m.name)}>
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      )}

      {!adding ? (
        <button style={styles.linkBtn} onClick={() => setAdding(true)}>+ I'm not on this list yet</button>
      ) : (
        <div style={styles.roleAddBox}>
          <input style={styles.input} placeholder="Your full name" value={query} onChange={(e) => setQuery(e.target.value)} />
          <input style={{ ...styles.input, marginTop: 8 }} placeholder="Your email (for survey notifications)" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
          <button style={styles.primaryBtnSmall} onClick={addManager} disabled={!query.trim() || !emailInput.trim()}>
            <Plus size={14} /> Add me & continue
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= DEADLINE BANNER ================= */

function DeadlineBanner({ pendingCount }) {
  const { meetingDate, daysLeft, isPastDeadline } = meetingCycle();
  const meetingLabel = meetingDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  return (
    <div style={{ ...styles.deadlineBanner, ...(isPastDeadline || (pendingCount > 0 && daysLeft === 0) ? styles.deadlineBannerUrgent : {}) }}>
      <div style={styles.deadlineTop}>
        <CalendarClock size={15} />
        <span style={styles.deadlineTitle}>Weekly cutoff: fill out by Monday, 11:59pm</span>
      </div>
      <div style={styles.deadlineSub}>
        Team meeting {meetingLabel} · {daysLeft === 0 ? "due today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
        {pendingCount > 0 && ` · ${pendingCount} open survey${pendingCount === 1 ? "" : "s"} still missing responses`}
      </div>
    </div>
  );
}

/* ================= HQ VIEW ================= */

function HQView({ managerName, onGoSurveys, onGoDirectory }) {
  const { employees } = useEmployees();
  const { managers } = useManagers();
  const { surveys } = useSurveys();

  if (employees === null || managers === null || surveys === null) {
    return <div style={styles.card}><div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Loader2 size={22} className="spin" color="#6B7280" /></div></div>;
  }

  const pairs = [];
  employees.forEach((emp) => emp.roles.forEach((role) => pairs.push({ empId: emp.id, name: emp.name, role })));

  const openSurveys = surveys.filter((s) => s.status === "open");
  const dueList = pairs
    .map((p) => {
      const openSurvey = openSurveys.find((s) => s.empId === p.empId && s.role === p.role);
      const emp = employees.find((e) => e.id === p.empId);
      const start = emp.lastEvaluated?.[p.role] || emp.createdAt;
      const status = dueStatus(start);
      return { ...p, status, openSurvey };
    })
    .filter((p) => !p.openSurvey && (p.status.level === "overdue" || p.status.level === "soon"));

  const pendingSurveys = openSurveys.filter((s) => (s.responses || []).length < managers.length);
  const orgScores = surveys.filter((s) => s.status === "closed").flatMap((s) => (s.responses || []).map((r) => r.total));
  const orgAvg = orgScores.length ? orgScores.reduce((a, b) => a + b, 0) / orgScores.length : null;

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Command Center</h2>
      <p style={styles.cardHint}>Hey {managerName ? managerName.split(" ")[0] : "there"} — here's where things stand.</p>

      <DeadlineBanner pendingCount={pendingSurveys.length} />

      <div style={styles.hqStatGrid}>
        <div style={styles.hqStat}>
          <div style={styles.hqStatNum}>{employees.length}</div>
          <div style={styles.hqStatLabel}>Employees tracked</div>
        </div>
        <div style={styles.hqStat}>
          <div style={styles.hqStatNum}>{orgAvg !== null ? Math.round(orgAvg) : "—"}</div>
          <div style={styles.hqStatLabel}>Avg score / 100</div>
        </div>
        <div style={{ ...styles.hqStat, ...(dueList.length ? styles.hqStatWarn : {}) }}>
          <div style={styles.hqStatNum}>{dueList.length}</div>
          <div style={styles.hqStatLabel}>Due for a survey</div>
        </div>
        <div style={{ ...styles.hqStat, ...(pendingSurveys.length ? styles.hqStatWarn : {}) }}>
          <div style={styles.hqStatNum}>{pendingSurveys.length}</div>
          <div style={styles.hqStatLabel}>Open surveys pending</div>
        </div>
      </div>

      <div style={styles.hqSection}>
        <div style={styles.hqSectionHead}>
          <AlertTriangle size={15} color={"#C4472A"} />
          <span style={styles.hqSectionTitle}>Due for a Survey</span>
        </div>
        {dueList.length === 0 ? (
          <p style={styles.cardHint}>Nobody's due right now — you're all caught up.</p>
        ) : (
          dueList.slice(0, 8).map((p) => (
            <div key={`${p.empId}-${p.role}`} style={styles.hqRow}>
              <span>{p.name} <span style={styles.hqRowSub}>({ROLES[p.role].short})</span></span>
              <span style={{ color: p.status.level === "overdue" ? "#C4472A" : "#B8863B", fontWeight: 700, fontSize: 11 }}>
                {p.status.level === "overdue" ? `Overdue ${Math.abs(p.status.daysUntil)}d` : `Due in ${p.status.daysUntil}d`}
              </span>
            </div>
          ))
        )}
        <button style={styles.hqLinkBtn} onClick={onGoSurveys}>Go send a survey →</button>
      </div>

      <div style={styles.hqSection}>
        <div style={styles.hqSectionHead}>
          <ClipboardList size={15} color={"#6B7280"} />
          <span style={styles.hqSectionTitle}>Open Surveys</span>
        </div>
        {openSurveys.length === 0 ? (
          <p style={styles.cardHint}>No surveys currently open.</p>
        ) : (
          openSurveys.map((s) => {
            const responded = (s.responses || []).length;
            return (
              <div key={s.id} style={styles.hqRow}>
                <span>{s.employee} <span style={styles.hqRowSub}>({ROLES[s.role].short})</span></span>
                <span style={{ fontSize: 11, color: "#6B7280" }}>{responded}/{managers.length} responded</span>
              </div>
            );
          })
        )}
        <button style={styles.hqLinkBtn} onClick={onGoSurveys}>Open Surveys tab →</button>
      </div>

      <div style={styles.hqSection}>
        <div style={styles.hqSectionHead}>
          <Users size={15} color={"#6B7280"} />
          <span style={styles.hqSectionTitle}>Directory</span>
        </div>
        <p style={styles.cardHint}>{employees.length} employees, {managers.length} managers on file.</p>
        <button style={styles.hqLinkBtn} onClick={onGoDirectory}>Open Directory →</button>
      </div>
    </div>
  );
}

/* ================= DIRECTORY VIEW ================= */

function DirectoryView() {
  const { employees, save } = useEmployees();
  const { surveys } = useSurveys();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [roles, setRoles] = useState(new Set());
  const [salary, setSalary] = useState("");
  const [tier, setTier] = useState(SERVER_TIERS[0]);
  const [lastEval, setLastEval] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [editSalaryId, setEditSalaryId] = useState(null);
  const [editSalaryValue, setEditSalaryValue] = useState("");
  const [editTierId, setEditTierId] = useState(null);
  const [editTierValue, setEditTierValue] = useState(SERVER_TIERS[0]);
  const [printTarget, setPrintTarget] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState("");

  if (employees === null || surveys === null) {
    return <div style={styles.card}><div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Loader2 size={22} className="spin" color="#6B7280" /></div></div>;
  }

  if (printTarget) {
    const emp = employees.find((e) => e.id === printTarget.empId);
    return <SurveyPrintReport survey={printTarget} employee={emp} onClose={() => setPrintTarget(null)} />;
  }

  const toggleRole = (rk) => {
    setRoles((prev) => {
      const next = new Set(prev);
      next.has(rk) ? next.delete(rk) : next.add(rk);
      return next;
    });
  };

  const needsRate = (roleSet) => RATE_ROLES.some((rk) => roleSet.has(rk));
  const needsTier = (roleSet) => roleSet.has("SERVER");

  const confirmAdd = async () => {
    if (!name.trim() || roles.size === 0) return;
    setSaving(true);
    setError("");
    const lastEvaluated = {};
    if (lastEval) {
      roles.forEach((rk) => { lastEvaluated[rk] = new Date(lastEval).toISOString(); });
    }
    const emp = {
      id: uid(),
      name: name.trim(),
      roles: Array.from(roles),
      salary: needsRate(roles) && salary ? parseFloat(salary) : null,
      tier: needsTier(roles) ? tier : null,
      createdAt: new Date().toISOString(),
      lastEvaluated,
    };
    const next = [...employees, emp].sort((a, b) => a.name.localeCompare(b.name));
    const ok = await save(next);
    setSaving(false);
    if (!ok) {
      setError("Couldn't save — connection issue. Try again.");
      return;
    }
    setAdding(false);
    setName("");
    setRoles(new Set());
    setSalary("");
    setTier(SERVER_TIERS[0]);
    setLastEval("");
  };

  const startEditSalary = (emp) => {
    setEditSalaryId(emp.id);
    setEditSalaryValue(emp.salary != null ? String(emp.salary) : "");
  };
  const saveSalary = async (empId) => {
    const next = employees.map((e) => (e.id === empId ? { ...e, salary: editSalaryValue ? parseFloat(editSalaryValue) : null } : e));
    await save(next);
    setEditSalaryId(null);
  };

  const startEditTier = (emp) => {
    setEditTierId(emp.id);
    setEditTierValue(emp.tier || SERVER_TIERS[0]);
  };
  const saveTier = async (empId) => {
    const next = employees.map((e) => (e.id === empId ? { ...e, tier: editTierValue } : e));
    await save(next);
    setEditTierId(null);
  };

  const compBadge = (emp) => {
    const parts = [];
    if (emp.tier) parts.push(emp.tier);
    if (emp.salary != null) parts.push(`$${emp.salary.toFixed(2)}/hr`);
    return parts.length ? parts.join(" · ") : "no pay info on file";
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkError("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map(parseCsvRow);
        setCsvPreview(parsed);
      },
      error: () => setBulkError("Couldn't read that file — make sure it's a .csv export."),
    });
    e.target.value = "";
  };

  const confirmBulkImport = async () => {
    const validRows = csvPreview.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) return;
    setBulkSaving(true);
    setBulkError("");
    const newEmployees = validRows.map((r) => {
      const lastEvaluated = {};
      if (r.lastEvalIso) r.roleKeys.forEach((rk) => { lastEvaluated[rk] = r.lastEvalIso; });
      return {
        id: uid(),
        name: r.name,
        roles: r.roleKeys,
        salary: r.roleKeys.some((rk) => RATE_ROLES.includes(rk)) ? r.rate : null,
        tier: r.roleKeys.includes("SERVER") ? (r.tier || SERVER_TIERS[0]) : null,
        createdAt: new Date().toISOString(),
        lastEvaluated,
      };
    });
    const next = [...employees, ...newEmployees].sort((a, b) => a.name.localeCompare(b.name));
    const ok = await save(next);
    setBulkSaving(false);
    if (!ok) {
      setBulkError("Couldn't save — connection issue. Try again.");
      return;
    }
    setCsvPreview(null);
    setShowBulkImport(false);
  };

  const downloadTemplate = () => {
    const csv = [
      "Name,Roles,Rate,Tier,LastEvaluated",
      "Jane Smith,Server,,Tier 1,",
      "Miguel Torres,Heart of House,19.50,,2026-03-01",
      "Alex Kim,Server;Service Bartender,17.00,Tier 2,",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCsvRow = (row) => {
    const name = (row.Name || "").trim();
    const rolesRaw = (row.Roles || "").split(/[;,]/).map((r) => r.trim()).filter(Boolean);
    const roleKeys = rolesRaw.map(matchRoleKey);
    const unmatched = rolesRaw.filter((_, i) => roleKeys[i] === null);
    const validRoleKeys = roleKeys.filter(Boolean);

    const errors = [];
    if (!name) errors.push("missing name");
    if (validRoleKeys.length === 0) errors.push("no valid role(s)");
    if (unmatched.length > 0) errors.push(`unrecognized role: ${unmatched.join(", ")}`);

    const rateStr = (row.Rate || "").trim();
    const tierStr = (row.Tier || "").trim();
    if (validRoleKeys.some((rk) => RATE_ROLES.includes(rk)) && rateStr && isNaN(parseFloat(rateStr))) {
      errors.push("rate isn't a number");
    }
    if (validRoleKeys.includes("SERVER") && tierStr && !SERVER_TIERS.includes(tierStr)) {
      errors.push(`tier must be one of: ${SERVER_TIERS.join(", ")}`);
    }
    const lastEvalStr = (row.LastEvaluated || "").trim();
    if (lastEvalStr && isNaN(new Date(lastEvalStr).getTime())) {
      errors.push("last evaluated date isn't valid (use YYYY-MM-DD)");
    }

    return {
      name,
      roleKeys: validRoleKeys,
      rate: rateStr ? parseFloat(rateStr) : null,
      tier: tierStr && SERVER_TIERS.includes(tierStr) ? tierStr : null,
      lastEvalIso: lastEvalStr && !isNaN(new Date(lastEvalStr).getTime()) ? new Date(lastEvalStr).toISOString() : null,
      errors,
      raw: row,
    };
  };

  return (
    <div style={styles.card}>
      <div style={styles.boardHeadRow}>
        <h2 style={styles.cardTitle}>Directory</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={styles.linkBtn} onClick={() => { setShowBulkImport((v) => !v); setCsvPreview(null); setBulkError(""); }}>
            {showBulkImport ? "cancel" : "bulk import"}
          </button>
          <button style={styles.linkBtn} onClick={() => setAdding((v) => !v)}>{adding ? "cancel" : "+ add employee"}</button>
        </div>
      </div>
      <p style={styles.cardHint}>Every employee, their role(s), current pay, and evaluation history — visible to any manager.</p>

      {showBulkImport && (
        <div style={styles.roleAddBox}>
          <label style={styles.label}>1. Get the template</label>
          <button style={styles.primaryBtnSmall} onClick={downloadTemplate}>Download CSV Template</button>
          <p style={styles.cardHint}>
            Columns: <strong>Name, Roles, Rate, Tier, LastEvaluated</strong>. Separate multiple roles with a semicolon
            (e.g. "Server;Service Bartender"). Rate is only used for Heart of House / Server Assistant / Service Bartender / Host.
            Tier (Tier 1/2/3) is only used for Server. LastEvaluated is optional, format YYYY-MM-DD.
          </p>

          <label style={styles.label}>2. Upload your filled-in CSV</label>
          <input type="file" accept=".csv" onChange={handleCsvUpload} />
          {bulkError && <div style={styles.warnBox}>{bulkError}</div>}

          {csvPreview && (
            <div style={{ marginTop: 12 }}>
              <p style={styles.cardHint}>
                {csvPreview.filter((r) => r.errors.length === 0).length} of {csvPreview.length} rows look good.
                {csvPreview.some((r) => r.errors.length > 0) && " Rows with errors will be skipped."}
              </p>
              {csvPreview.map((r, i) => (
                <div key={i} style={styles.directoryDetailRow}>
                  <span>{r.name || "(no name)"}</span>
                  <span style={{ fontSize: 11, color: r.errors.length ? "#C4472A" : "#4B6E4F" }}>
                    {r.errors.length ? r.errors.join("; ") : `OK — ${r.roleKeys.map((rk) => ROLES[rk].short).join(", ")}`}
                  </span>
                </div>
              ))}
              <button
                style={styles.primaryBtnSmall}
                onClick={confirmBulkImport}
                disabled={bulkSaving || csvPreview.filter((r) => r.errors.length === 0).length === 0}
              >
                {bulkSaving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                {bulkSaving ? "Importing..." : `Import ${csvPreview.filter((r) => r.errors.length === 0).length} Employees`}
              </button>
            </div>
          )}
        </div>
      )}

      {adding && (
        <div style={styles.roleAddBox}>
          <label style={styles.label}>Name</label>
          <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          <div style={styles.label}>Role(s)</div>
          <div style={styles.roleGrid}>
            {ROLE_ORDER.map((rk) => (
              <button key={rk} style={{ ...styles.roleChip, ...(roles.has(rk) ? styles.roleChipActive : {}) }} onClick={() => toggleRole(rk)}>
                {ROLES[rk].label}
              </button>
            ))}
          </div>
          {needsTier(roles) && (
            <>
              <label style={styles.label}>Current server tier</label>
              <div style={styles.roleGrid}>
                {SERVER_TIERS.map((t) => (
                  <button key={t} style={{ ...styles.roleChip, ...(tier === t ? styles.roleChipActive : {}) }} onClick={() => setTier(t)}>{t}</button>
                ))}
              </div>
            </>
          )}
          {needsRate(roles) && (
            <>
              <label style={styles.label}>Current pay rate ($/hr, optional)</label>
              <input style={styles.input} inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. 18.50" />
            </>
          )}
          <label style={styles.label}>Last evaluated (optional — leave blank if never evaluated)</label>
          <input type="date" style={styles.input} value={lastEval} onChange={(e) => setLastEval(e.target.value)} />
          <button style={styles.primaryBtnSmall} onClick={confirmAdd} disabled={!name.trim() || roles.size === 0 || saving}>
            {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} {saving ? "Saving..." : "Save Employee"}
          </button>
          {error && <div style={styles.warnBox}>{error}</div>}
        </div>
      )}

      {employees.length === 0 && <p style={styles.cardHint}>No employees yet — add the first one above.</p>}

      {employees.map((emp) => (
        <div key={emp.id} style={styles.dueRow}>
          <button style={styles.dueRowHead} onClick={() => setExpanded(expanded === emp.id ? null : emp.id)}>
            <div style={styles.empRowLeft}>
              {expanded === emp.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <div>
                <div style={styles.empName}>{emp.name}</div>
                <div style={styles.empRoleTags}>{emp.roles.map((r) => ROLES[r].short).join(" / ")}</div>
              </div>
            </div>
            <span style={styles.empBadgeNeutral}>{compBadge(emp)}</span>
          </button>

          {expanded === emp.id && (
            <div style={styles.empDetail}>
              {emp.roles.includes("SERVER") && (
                <div style={styles.directoryDetailRow}>
                  <span>Current server tier</span>
                  {editTierId === emp.id ? (
                    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <select style={styles.inlineSalaryInput} value={editTierValue} onChange={(e) => setEditTierValue(e.target.value)}>
                        {SERVER_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button style={styles.linkBtn} onClick={() => saveTier(emp.id)}>save</button>
                    </span>
                  ) : (
                    <button style={styles.linkBtn} onClick={() => startEditTier(emp)}>{emp.tier || "set tier"} · edit</button>
                  )}
                </div>
              )}
              {RATE_ROLES.some((rk) => emp.roles.includes(rk)) && (
                <div style={styles.directoryDetailRow}>
                  <span>Current pay rate</span>
                  {editSalaryId === emp.id ? (
                    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input style={styles.inlineSalaryInput} inputMode="decimal" value={editSalaryValue} onChange={(e) => setEditSalaryValue(e.target.value)} />
                      <button style={styles.linkBtn} onClick={() => saveSalary(emp.id)}>save</button>
                    </span>
                  ) : (
                    <button style={styles.linkBtn} onClick={() => startEditSalary(emp)}>
                      {emp.salary != null ? `$${emp.salary.toFixed(2)}/hr` : "set rate"} · edit
                    </button>
                  )}
                </div>
              )}
              {emp.roles.map((rk) => {
                const start = emp.lastEvaluated?.[rk] || emp.createdAt;
                const status = dueStatus(start);
                return (
                  <div key={rk} style={styles.directoryDetailRow}>
                    <span>{ROLES[rk].label}</span>
                    <span style={{ fontSize: 11, color: status.level === "overdue" ? "#C4472A" : "#6B7280" }}>
                      {emp.lastEvaluated?.[rk] ? `Last eval ${formatDate(emp.lastEvaluated[rk])}` : "Never evaluated"} · due {formatDate(status.due)}
                    </span>
                  </div>
                );
              })}

              {(() => {
                const history = surveys
                  .filter((s) => s.empId === emp.id && s.status === "closed")
                  .sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));
                if (history.length === 0) {
                  return <p style={{ ...styles.cardHint, marginTop: 8 }}>No past evaluations on file yet.</p>;
                }
                return (
                  <div style={{ marginTop: 10 }}>
                    <div style={styles.label}>Evaluation History ({history.length})</div>
                    {history.map((s) => {
                      const avg = s.responses.length ? s.responses.reduce((a, r) => a + r.total, 0) / s.responses.length : 0;
                      const band = bandFor(avg);
                      return (
                        <div key={s.id} style={styles.entryCard}>
                          <div style={styles.entryHead}>
                            <span style={styles.entryManager}>{ROLES[s.role].short} · {formatDate(s.closedAt)}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: band.color }}>{avg.toFixed(1)}/100</span>
                          </div>
                          {s.responses.map((r) => (
                            r.coreMessage && <div key={r.manager} style={styles.entryFeedback}>{r.manager}: "{r.coreMessage}"</div>
                          ))}
                          <button style={styles.linkBtn} onClick={() => setPrintTarget(s)}>view full report</button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ================= SURVEYS VIEW ================= */

function SurveysView({ managerName, onSwitchManager }) {
  const { employees, save: saveEmployees } = useEmployees();
  const { managers } = useManagers();
  const { surveys, save: saveSurveys } = useSurveys();
  const [expanded, setExpanded] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);
  const [printTarget, setPrintTarget] = useState(null);
  const [sendError, setSendError] = useState("");
  const [showClosed, setShowClosed] = useState(false);

  if (employees === null || managers === null || surveys === null) {
    return <div style={styles.card}><div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Loader2 size={22} className="spin" color="#6B7280" /></div></div>;
  }

  if (printTarget) {
    const emp = employees.find((e) => e.id === printTarget.empId);
    return <SurveyPrintReport survey={printTarget} employee={emp} onClose={() => setPrintTarget(null)} />;
  }

  if (respondingTo) {
    const survey = surveys.find((s) => s.id === respondingTo);
    const emp = employees.find((e) => e.id === survey.empId);
    return (
      <SurveyForm
        survey={survey}
        employee={emp}
        managerName={managerName}
        onCancel={() => setRespondingTo(null)}
        onSubmitted={async (updatedSurvey) => {
          const next = surveys.map((s) => (s.id === updatedSurvey.id ? updatedSurvey : s));
          const ok = await saveSurveys(next);
          if (ok) setRespondingTo(null);
          return ok;
        }}
      />
    );
  }

  const openSurveys = surveys.filter((s) => s.status === "open");
  const closedSurveys = surveys.filter((s) => s.status === "closed").sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));

  const pairs = [];
  employees.forEach((emp) => emp.roles.forEach((role) => pairs.push({ empId: emp.id, name: emp.name, role })));

  const dueList = pairs
    .map((p) => {
      const emp = employees.find((e) => e.id === p.empId);
      const start = emp.lastEvaluated?.[p.role] || emp.createdAt;
      const status = dueStatus(start);
      const hasOpen = openSurveys.some((s) => s.empId === p.empId && s.role === p.role);
      return { ...p, status, hasOpen };
    })
    .filter((p) => !p.hasOpen)
    .sort((a, b) => a.status.daysUntil - b.status.daysUntil);

  const sendSurvey = async (p) => {
    setSendError("");
    const { deadlineDate } = meetingCycle();
    const survey = {
      id: uid(),
      empId: p.empId,
      employee: p.name,
      role: p.role,
      createdAt: new Date().toISOString(),
      deadline: deadlineDate.toISOString(),
      responses: [],
      assignedTo: null,
      status: "open",
      closedAt: null,
    };
    const ok = await saveSurveys([...surveys, survey]);
    if (!ok) {
      setSendError("Couldn't send — connection issue. Try again.");
      return;
    }
    notifyManagers(managers, survey); // fire-and-forget; a failure here shouldn't block the survey itself
  };

  const assignExecutor = async (surveyId, name) => {
    const next = surveys.map((s) => (s.id === surveyId ? { ...s, assignedTo: name || null } : s));
    await saveSurveys(next);
  };

  const closeSurvey = async (survey) => {
    const next = surveys.map((s) => (s.id === survey.id ? { ...s, status: "closed", closedAt: new Date().toISOString() } : s));
    await saveSurveys(next);
    const nextEmployees = employees.map((e) => {
      if (e.id !== survey.empId) return e;
      return { ...e, lastEvaluated: { ...(e.lastEvaluated || {}), [survey.role]: new Date().toISOString() } };
    });
    await saveEmployees(nextEmployees);
  };

  const pendingCount = openSurveys.filter((s) => (s.responses || []).length < managers.length).length;

  return (
    <div style={styles.card}>
      <div style={styles.managerRow}>
        <span style={styles.managerTag}>Signed in as: {managerName}</span>
        <button style={styles.linkBtn} onClick={onSwitchManager}>switch</button>
      </div>

      <DeadlineBanner pendingCount={pendingCount} />

      <div style={styles.hqSection}>
        <div style={styles.hqSectionHead}>
          <Send size={15} color={"#C4472A"} />
          <span style={styles.hqSectionTitle}>Due — Send a Survey</span>
        </div>
        {dueList.length === 0 ? (
          <p style={styles.cardHint}>Nobody new is due right now.</p>
        ) : (
          dueList.map((p) => (
            <div key={`${p.empId}-${p.role}`} style={styles.dueActionRow2}>
              <span>{p.name} <span style={styles.hqRowSub}>({ROLES[p.role].short})</span></span>
              <button style={styles.sendBtn} onClick={() => sendSurvey(p)}>
                <Send size={12} /> Send Survey
              </button>
            </div>
          ))
        )}
        {sendError && <div style={styles.warnBox}>{sendError}</div>}
      </div>

      <div style={styles.hqSection}>
        <div style={styles.hqSectionHead}>
          <ClipboardList size={15} color={"#6B7280"} />
          <span style={styles.hqSectionTitle}>Open Surveys</span>
        </div>
        {openSurveys.length === 0 && <p style={styles.cardHint}>Nothing open right now.</p>}
        {openSurveys.map((s) => {
          const responded = new Set((s.responses || []).map((r) => r.manager));
          const iResponded = responded.has(managerName);
          const missing = managers.filter((m) => !responded.has(m.name));
          const avgTotal = s.responses.length ? s.responses.reduce((a, r) => a + r.total, 0) / s.responses.length : null;
          return (
            <div key={s.id} style={styles.dueRow}>
              <button style={styles.dueRowHead} onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                <div style={styles.empRowLeft}>
                  {expanded === s.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <div>
                    <div style={styles.empName}>{s.employee}</div>
                    <div style={styles.empRoleTags}>{ROLES[s.role].label} · deadline {formatDate(s.deadline)}</div>
                  </div>
                </div>
                <span style={styles.empBadgeNeutral}>{responded.size}/{managers.length} responded</span>
              </button>

              {expanded === s.id && (
                <div style={styles.empDetail}>
                  <div style={styles.signupRow}>
                    {managers.map((m) => (
                      <span key={m.name} style={{ ...styles.signupChip, ...(responded.has(m.name) ? styles.signupChipDone : {}) }}>
                        {responded.has(m.name) ? <Check size={10} /> : null} {m.name}
                      </span>
                    ))}
                  </div>
                  {missing.length > 0 && (
                    <p style={styles.cardHint}>Waiting on: {missing.map((m) => m.name).join(", ")}</p>
                  )}

                  {!iResponded && (
                    <button style={styles.primaryBtnSmall} onClick={() => setRespondingTo(s.id)}>
                      <ClipboardList size={14} /> Fill out my response
                    </button>
                  )}
                  {iResponded && <p style={styles.cardHint}>You've already responded. You can still view results below.</p>}

                  {s.responses.length > 0 && (
                    <>
                      <div style={styles.directoryDetailRow}>
                        <strong>Average so far</strong>
                        <span>{avgTotal.toFixed(1)}/100 — {bandFor(avgTotal).label}</span>
                      </div>
                      {s.responses.map((r) => (
                        <div key={r.manager} style={styles.entryCard}>
                          <div style={styles.entryHead}>
                            <span style={styles.entryManager}>{r.manager}</span>
                            <span style={styles.entryDate}>{Math.round(r.total)}/100</span>
                          </div>
                          {r.coreMessage && <div style={styles.entryFeedback}>"{r.coreMessage}"</div>}
                        </div>
                      ))}
                    </>
                  )}

                  <label style={styles.label}>Who will deliver this evaluation?</label>
                  <select style={styles.input} value={s.assignedTo || ""} onChange={(e) => assignExecutor(s.id, e.target.value)}>
                    <option value="">Not decided yet</option>
                    {managers.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
                  </select>

                  <div style={styles.dueActionRow}>
                    <button style={styles.printLinkBtn} onClick={() => setPrintTarget(s)}>
                      <Printer size={13} /> Print / Download
                    </button>
                    <button style={styles.signupBtn} onClick={() => closeSurvey(s)}>
                      Mark Delivered & Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.hqSection}>
        <button style={styles.linkBtn} onClick={() => setShowClosed((v) => !v)}>
          {showClosed ? "hide" : "show"} closed surveys ({closedSurveys.length})
        </button>
        {showClosed && closedSurveys.map((s) => (
          <div key={s.id} style={styles.hqRow}>
            <span>{s.employee} <span style={styles.hqRowSub}>({ROLES[s.role].short})</span></span>
            <button style={styles.linkBtn} onClick={() => setPrintTarget(s)}>view / print</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= SURVEY RESPONSE FORM ================= */

function SurveyForm({ survey, employee, managerName, onCancel, onSubmitted }) {
  const roleConfig = ROLES[survey.role];
  const isServerRole = survey.role === "SERVER";
  const [tiers, setTiers] = useState({});
  const [notes, setNotes] = useState({});
  const [coreMessage, setCoreMessage] = useState("");
  const [goals, setGoals] = useState("");
  const [increase, setIncrease] = useState("");
  const [recommendedTier, setRecommendedTier] = useState(employee?.tier || SERVER_TIERS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const setTier = (catKey, tierKey) => setTiers((t) => ({ ...t, [catKey]: tierKey }));
  const setNote = (catKey, val) => setNotes((n) => ({ ...n, [catKey]: val }));

  const categoryPoints = (cat) => {
    const tier = tiers[cat.key];
    if (!tier) return null;
    const t = TIERS.find((x) => x.key === tier);
    return cat.points * t.factor;
  };

  const allRated = roleConfig.categories.every((c) => categoryPoints(c) !== null);
  const maxPossible = roleConfig.categories.reduce((s, c) => s + c.points, 0);
  const earnedPoints = roleConfig.categories.reduce((s, c) => s + (categoryPoints(c) || 0), 0);
  const total = maxPossible > 0 ? (earnedPoints / maxPossible) * 100 : 0;
  const band = bandFor(total);
  const canSubmit = allRated && coreMessage.trim();

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    const categoryScores = {};
    roleConfig.categories.forEach((c) => {
      categoryScores[c.key] = { label: c.label, max: c.points, points: categoryPoints(c), note: notes[c.key] || "" };
    });

    const response = {
      manager: managerName,
      categoryScores,
      total,
      coreMessage: coreMessage.trim(),
      goals: goals.trim(),
      increase: roleConfig.hasRaise ? (parseFloat(increase) || 0) : null,
      recommendedTier: isServerRole ? recommendedTier : null,
      timestamp: new Date().toISOString(),
    };

    const nextResponses = [...survey.responses.filter((r) => r.manager !== managerName), response];
    const updatedSurvey = { ...survey, responses: nextResponses };

    const ok = await onSubmitted(updatedSurvey);
    setSubmitting(false);
    if (ok === false) {
      setError("Couldn't save — connection issue. Please try again.");
    }
  };

  return (
    <div style={styles.card}>
      <button style={styles.linkBtn} onClick={onCancel}>&larr; back to surveys</button>
      <h2 style={{ ...styles.cardTitle, marginTop: 10 }}>{survey.employee}</h2>
      <p style={styles.cardHint}>{roleConfig.label} · your response, {managerName}</p>

      {roleConfig.categories.map((cat) => (
        <div key={cat.key} style={styles.catBlock}>
          <div style={styles.catHeadRow}>
            <span style={styles.catLabel}>{cat.label}</span>
            <span style={styles.catPoints}>{cat.points} pts</span>
          </div>
          <div style={styles.catDesc}>{cat.desc}</div>
          <div style={styles.segRow}>
            {TIERS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTier(cat.key, t.key)}
                style={{ ...styles.segBtn, ...(tiers[cat.key] === t.key ? styles.segBtnActive : {}) }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            style={styles.noteInput}
            placeholder="Notes for this category (optional)"
            value={notes[cat.key] || ""}
            onChange={(e) => setNote(cat.key, e.target.value)}
          />
        </div>
      ))}

      <div style={styles.divider} />

      <label style={styles.label}>Your core message</label>
      <textarea style={styles.textarea} placeholder="One or two sentences summarizing this period." value={coreMessage} onChange={(e) => setCoreMessage(e.target.value)} rows={3} />

      <label style={styles.label}>Goals (optional)</label>
      <textarea style={styles.textarea} placeholder="Development goals for next period." value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} />

      {roleConfig.hasRaise && (
        <>
          <label style={styles.label}>
            Recommended increase ($/hr) <span style={styles.currentCompNote}>— currently ${employee?.salary != null ? employee.salary.toFixed(2) : "—"}/hr</span>
          </label>
          <div style={styles.payField}>
            <span style={styles.payPrefix}>$</span>
            <input style={styles.payInput} inputMode="decimal" placeholder="0.00" value={increase} onChange={(e) => setIncrease(e.target.value)} />
          </div>
        </>
      )}

      {isServerRole && (
        <>
          <label style={styles.label}>
            Recommended tier <span style={styles.currentCompNote}>— currently {employee?.tier || "not set"}</span>
          </label>
          <div style={styles.roleGrid}>
            {SERVER_TIERS.map((t) => (
              <button key={t} style={{ ...styles.roleChip, ...(recommendedTier === t ? styles.roleChipActive : {}) }} onClick={() => setRecommendedTier(t)}>
                {t}
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ ...styles.totalRow, borderColor: band.color }}>
        {total < 75 && <AlertTriangle size={16} color={band.color} />}
        <span style={styles.totalText}>Score: <strong>{Math.round(total)}</strong>/100 — <span style={{ color: band.color, fontWeight: 700 }}>{band.label}</span></span>
      </div>

      <button style={styles.primaryBtn} onClick={submit} disabled={!canSubmit || submitting}>
        {submitting ? <Loader2 size={16} className="spin" /> : <Check size={16} />} {submitting ? "Sending..." : "Submit Response"}
      </button>
      {!canSubmit && <div style={styles.warnText}>{!allRated ? "Rate every category above." : "Add a core message to finish."}</div>}
      {error && <div style={styles.warnBox}>{error}</div>}
    </div>
  );
}

/* ================= PRINT REPORT ================= */

function SurveyPrintReport({ survey, employee, onClose }) {
  const roleConfig = ROLES[survey.role];
  const isServerRole = survey.role === "SERVER";
  const responses = survey.responses || [];
  const avgTotal = responses.length ? responses.reduce((s, r) => s + r.total, 0) / responses.length : 0;
  const band = bandFor(avgTotal);

  const catRows = roleConfig.categories.map((cat) => {
    const points = responses.map((r) => r.categoryScores[cat.key]?.points).filter((p) => p !== undefined);
    const avg = points.length ? points.reduce((a, b) => a + b, 0) / points.length : 0;
    const notes = responses.map((r) => ({ manager: r.manager, note: r.categoryScores[cat.key]?.note })).filter((n) => n.note);
    return { ...cat, avg, notes };
  });

  const raiseResponses = responses.filter((r) => r.increase !== null && r.increase !== undefined);
  const avgIncrease = raiseResponses.length ? raiseResponses.reduce((s, r) => s + r.increase, 0) / raiseResponses.length : null;
  const tierVotes = responses.filter((r) => r.recommendedTier);

  return (
    <div style={printStyles.page}>
      <style>{printCss}</style>
      <div className="no-print" style={printStyles.actionBar}>
        <button style={styles.linkBtn} onClick={onClose}>&larr; back</button>
        <button style={styles.primaryBtnSmall} onClick={() => window.print()}><Printer size={14} /> Print</button>
      </div>
      <div style={printStyles.sheet}>
        <div style={printStyles.header}>
          <div style={printStyles.brandRow}>BARTLETT'S — STAFF EVALUATION</div>
          <div style={printStyles.title}>{survey.employee}</div>
          <div style={printStyles.subtitle}>
            {roleConfig.label} · Survey sent {formatDate(survey.createdAt)} · Deadline {formatDate(survey.deadline)}
          </div>
          {employee?.salary != null && <div style={printStyles.subtitle}>Current pay rate: ${employee.salary.toFixed(2)}/hr</div>}
          {employee?.tier && <div style={printStyles.subtitle}>Current tier: {employee.tier}</div>}
          {survey.assignedTo && <div style={printStyles.subtitle}>Delivering: {survey.assignedTo}</div>}
        </div>

        <table style={printStyles.table}>
          <thead><tr><th style={printStyles.th}>Category</th><th style={printStyles.thNum}>Avg Score</th></tr></thead>
          <tbody>
            {catRows.map((c) => (
              <React.Fragment key={c.key}>
                <tr>
                  <td style={printStyles.td}>{c.label}</td>
                  <td style={printStyles.tdNum}>{c.avg.toFixed(1)} / {c.points}</td>
                </tr>
                {c.notes.map((n, i) => (
                  <tr key={i}><td colSpan={2} style={printStyles.noteRow}><em>{n.manager}:</em> {n.note}</td></tr>
                ))}
              </React.Fragment>
            ))}
            <tr>
              <td style={printStyles.tdTotal}>TOTAL</td>
              <td style={printStyles.tdNumTotal}>{avgTotal.toFixed(1)} / 100 — {band.label}</td>
            </tr>
          </tbody>
        </table>

        <div style={printStyles.section}>
          <div style={printStyles.sectionTitle}>Evaluator Comments</div>
          {responses.map((r) => (
            <div key={r.manager} style={printStyles.commentBlock}>
              <strong>{r.manager}</strong> ({formatDate(r.timestamp)}): {r.coreMessage}
              {r.goals && <div style={printStyles.goalsLine}>Goals: {r.goals}</div>}
            </div>
          ))}
          {responses.length === 0 && <p>No responses yet.</p>}
        </div>

        {roleConfig.hasRaise && (
          <div style={printStyles.section}>
            <div style={printStyles.sectionTitle}>Pay & Raise</div>
            {employee?.salary != null && <div style={printStyles.payLine}><strong>Current rate: ${employee.salary.toFixed(2)}/hr</strong></div>}
            {raiseResponses.map((r) => <div key={r.manager} style={printStyles.payLine}>{r.manager}: recommends +${r.increase.toFixed(2)}/hr</div>)}
            {avgIncrease !== null && <div style={printStyles.payAvg}>Average recommended increase: +${avgIncrease.toFixed(2)}/hr</div>}
          </div>
        )}

        {isServerRole && (
          <div style={printStyles.section}>
            <div style={printStyles.sectionTitle}>Tier Recommendation</div>
            {employee?.tier && <div style={printStyles.payLine}><strong>Current tier: {employee.tier}</strong></div>}
            {tierVotes.map((r) => <div key={r.manager} style={printStyles.payLine}>{r.manager}: recommends {r.recommendedTier}</div>)}
            {tierVotes.length === 0 && <p>No tier recommendations yet.</p>}
          </div>
        )}

        <div style={printStyles.signatures}>
          <div style={printStyles.sigLine}>Employee Signature ______________________________ Date __________</div>
          <div style={printStyles.sigLine}>Manager Signature ______________________________ Date __________</div>
        </div>
      </div>
    </div>
  );
}

const printCss = `
@media print {
  .no-print { display: none !important; }
  body { background: #fff !important; }
}
`;

/* ================= STYLES ================= */

const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
input::placeholder, textarea::placeholder { color: #9C9488; }
`;

const COLORS = {
  paper: "#EFEAE0", paperDark: "#E2DBCC", ink: "#1C1B19", char: "#2A2622",
  steel: "#6B7280", ember: "#C4472A", herb: "#4B6E4F", amber: "#B8863B",
};

const styles = {
  page: { minHeight: "100vh", background: COLORS.paperDark, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.ink, paddingBottom: 40 },
  header: { background: COLORS.char, padding: "18px 20px 14px" },
  headerTop: { display: "flex", alignItems: "center", gap: 8 },
  brand: { color: COLORS.paper, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: 2 },
  headerSub: { color: "#A79E8F", fontSize: 12, marginTop: 2, marginLeft: 30, letterSpacing: 1, textTransform: "uppercase" },
  tabBar: { display: "flex", background: COLORS.char, borderTop: "1px solid #3A352F" },
  tabBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 8px", background: "transparent", border: "none", color: "#8E8578", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 1, cursor: "pointer" },
  tabBtnActive: { color: COLORS.paper, borderBottom: `3px solid ${COLORS.ember}` },
  card: { margin: "16px 14px", background: COLORS.paper, borderRadius: 4, padding: "20px 18px", position: "relative", boxShadow: "0 2px 10px rgba(0,0,0,0.12)", borderLeft: `4px dashed ${COLORS.steel}55` },
  cardTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, margin: "0 0 4px", letterSpacing: 0.5 },
  cardHint: { fontSize: 13, color: COLORS.steel, margin: "0 0 16px", lineHeight: 1.5 },
  label: { display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: COLORS.steel, marginBottom: 6, marginTop: 14 },
  input: { width: "100%", boxSizing: "border-box", padding: "11px 12px", fontSize: 15, fontFamily: "'IBM Plex Mono', monospace", border: `1.5px solid ${COLORS.steel}66`, borderRadius: 3, background: "#FBF9F4", color: COLORS.ink, outline: "none" },
  noteInput: { width: "100%", boxSizing: "border-box", padding: "8px 10px", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", border: `1px solid ${COLORS.steel}44`, borderRadius: 3, background: "#FBF9F4", color: COLORS.ink, outline: "none", marginTop: 8 },
  textarea: { width: "100%", boxSizing: "border-box", padding: "11px 12px", fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", border: `1.5px solid ${COLORS.steel}66`, borderRadius: 3, background: "#FBF9F4", color: COLORS.ink, outline: "none", resize: "vertical" },
  primaryBtn: { width: "100%", marginTop: 20, padding: "13px 16px", background: COLORS.char, color: COLORS.paper, border: "none", borderRadius: 3, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" },
  primaryBtnSmall: { marginTop: 10, padding: "9px 14px", background: COLORS.char, color: COLORS.paper, border: "none", borderRadius: 3, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" },
  linkBtn: { background: "none", border: "none", color: COLORS.ember, fontSize: 12, fontWeight: 600, textDecoration: "underline", cursor: "pointer", padding: 0 },
  managerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  managerTag: { fontSize: 12, color: COLORS.steel, fontWeight: 600 },
  divider: { height: 1, background: `${COLORS.steel}33`, margin: "18px 0" },
  suggestBox: { marginTop: 6, border: `1px solid ${COLORS.steel}44`, borderRadius: 3, overflow: "hidden", background: "#FBF9F4", marginBottom: 10 },
  suggestItem: { width: "100%", display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "none", border: "none", borderBottom: `1px solid ${COLORS.steel}22`, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: COLORS.ink, textAlign: "left" },
  roleAddBox: { marginTop: 10, padding: "12px", background: COLORS.paperDark, borderRadius: 3 },
  roleGrid: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 },
  roleChip: { padding: "7px 10px", fontSize: 11, fontWeight: 600, border: `1.5px solid ${COLORS.steel}66`, borderRadius: 3, background: "#FBF9F4", color: COLORS.steel, cursor: "pointer" },
  roleChipActive: { background: COLORS.herb, color: "#fff", borderColor: COLORS.herb },
  catBlock: { marginBottom: 16 },
  catHeadRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  catLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16 },
  catPoints: { fontSize: 11, color: COLORS.steel, fontWeight: 600 },
  catDesc: { fontSize: 12, color: COLORS.steel, margin: "3px 0 8px", lineHeight: 1.4 },
  segRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  segBtn: { flex: "1 1 30%", padding: "9px 4px", fontSize: 11, fontWeight: 600, border: `1.5px solid ${COLORS.steel}66`, borderRadius: 3, background: "#FBF9F4", color: COLORS.steel, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" },
  segBtnActive: { background: COLORS.char, color: COLORS.paper, borderColor: COLORS.char },
  payField: { display: "flex", alignItems: "center", border: `1.5px solid ${COLORS.steel}66`, borderRadius: 3, background: "#FBF9F4", overflow: "hidden" },
  payPrefix: { padding: "0 8px", color: COLORS.steel, fontWeight: 600 },
  payInput: { flex: 1, padding: "11px 8px 11px 0", fontSize: 14, fontFamily: "'IBM Plex Mono', monospace", border: "none", background: "transparent", color: COLORS.ink, outline: "none" },
  totalRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 18, padding: "10px 12px", background: COLORS.paperDark, borderRadius: 3, border: "1.5px solid" },
  totalText: { fontSize: 13 },
  warnBox: { marginTop: 8, fontSize: 11, color: COLORS.ember, background: `${COLORS.ember}15`, padding: "8px 10px", borderRadius: 3 },
  warnText: { marginTop: 8, fontSize: 12, color: COLORS.ember, textAlign: "center" },
  currentCompNote: { textTransform: "none", fontWeight: 400, letterSpacing: 0, color: COLORS.steel },
  boardHeadRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  hqStatGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 },
  hqStat: { background: COLORS.paperDark, borderRadius: 4, padding: "12px 10px", textAlign: "center" },
  hqStatWarn: { background: `${COLORS.ember}22` },
  hqStatNum: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 28, color: COLORS.ink },
  hqStatLabel: { fontSize: 10, color: COLORS.steel, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },
  hqSection: { marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${COLORS.steel}33` },
  hqSectionHead: { display: "flex", alignItems: "center", gap: 6, marginBottom: 10 },
  hqSectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16 },
  hqRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", fontSize: 13, borderBottom: `1px solid ${COLORS.steel}22`, gap: 8 },
  hqRowSub: { fontSize: 11, color: COLORS.steel },
  hqLinkBtn: { marginTop: 10, background: "none", border: "none", color: COLORS.ember, fontSize: 12, fontWeight: 700, textDecoration: "underline", cursor: "pointer", padding: 0 },
  dueRow: { borderBottom: `1px solid ${COLORS.steel}33`, padding: "10px 0" },
  dueRowHead: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: "8px 0", cursor: "pointer", textAlign: "left" },
  dueActionRow: { display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" },
  dueActionRow2: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${COLORS.steel}22` },
  sendBtn: { display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 3, background: COLORS.ember, color: "#fff", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif" },
  signupBtn: { padding: "8px 12px", fontSize: 12, fontWeight: 600, border: `1.5px solid ${COLORS.steel}66`, borderRadius: 3, background: "#FBF9F4", color: COLORS.steel, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" },
  printLinkBtn: { display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 3, background: COLORS.char, color: COLORS.paper, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif" },
  signupRow: { display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0" },
  signupChip: { fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 3, background: COLORS.paperDark, color: COLORS.ink, display: "flex", alignItems: "center", gap: 3 },
  signupChipDone: { background: COLORS.herb, color: "#fff" },
  empRowLeft: { display: "flex", alignItems: "center", gap: 6, color: COLORS.ink },
  empName: { fontWeight: 600, fontSize: 14 },
  empRoleTags: { fontSize: 10, color: COLORS.steel },
  empBadgeNeutral: { fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 3, background: COLORS.paperDark, color: COLORS.ink, whiteSpace: "nowrap" },
  empDetail: { paddingLeft: 4, display: "flex", flexDirection: "column", gap: 8, marginTop: 8 },
  directoryDetailRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "6px 0", borderBottom: `1px solid ${COLORS.steel}22` },
  inlineSalaryInput: { width: 80, padding: "5px 8px", fontSize: 12, border: `1px solid ${COLORS.steel}66`, borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace" },
  entryCard: { background: "#FBF9F4", border: `1px solid ${COLORS.steel}33`, borderRadius: 3, padding: "10px 12px" },
  entryHead: { display: "flex", justifyContent: "space-between", marginBottom: 4 },
  entryManager: { fontWeight: 700, fontSize: 12 },
  entryDate: { fontSize: 11, color: COLORS.steel },
  entryFeedback: { fontSize: 12, fontStyle: "italic", color: COLORS.ink, marginBottom: 4, lineHeight: 1.4 },
  deadlineBanner: { background: COLORS.char, color: COLORS.paper, borderRadius: 4, padding: "10px 14px", marginBottom: 16 },
  deadlineBannerUrgent: { background: COLORS.ember },
  deadlineTop: { display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif" },
  deadlineSub: { fontSize: 11, color: "#D8D0C2", marginTop: 3 },
};

const printStyles = {
  page: { minHeight: "100vh", background: "#fff", fontFamily: "'IBM Plex Mono', monospace" },
  actionBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, background: "#E2DBCC" },
  sheet: { maxWidth: 700, margin: "0 auto", padding: "24px 20px", color: "#111" },
  header: { borderBottom: "2px solid #111", paddingBottom: 12, marginBottom: 16 },
  brandRow: { fontSize: 11, letterSpacing: 2, color: "#555" },
  title: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 28, margin: "4px 0 2px" },
  subtitle: { fontSize: 13, color: "#444" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 20 },
  th: { textAlign: "left", borderBottom: "1px solid #999", padding: "6px 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  thNum: { textAlign: "right", borderBottom: "1px solid #999", padding: "6px 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  td: { padding: "6px 4px", borderBottom: "1px solid #eee", fontWeight: 600 },
  tdNum: { padding: "6px 4px", borderBottom: "1px solid #eee", textAlign: "right" },
  noteRow: { padding: "2px 4px 8px 12px", fontSize: 12, color: "#333", borderBottom: "1px solid #eee" },
  tdTotal: { padding: "8px 4px", fontWeight: 700, fontSize: 15 },
  tdNumTotal: { padding: "8px 4px", fontWeight: 700, fontSize: 15, textAlign: "right" },
  section: { marginBottom: 18 },
  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, borderBottom: "1px solid #ccc", marginBottom: 8, paddingBottom: 4 },
  commentBlock: { fontSize: 12.5, marginBottom: 8, lineHeight: 1.5 },
  goalsLine: { fontSize: 12, color: "#555", marginTop: 2 },
  payLine: { fontSize: 12.5, marginBottom: 4 },
  payAvg: { fontSize: 13, fontWeight: 700, marginTop: 6 },
  signatures: { marginTop: 30 },
  sigLine: { fontSize: 12.5, marginBottom: 20 },
};
