"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ExpenseTable, type Expense } from "@/components/ExpenseTable";
import { computeStatus } from "@/lib/status";

const NAVY       = "#0d2b4e";
const ANNUAL_HDR = "#1a3d6e"; // slightly lighter navy for annual section

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}

function getCurrentMonthKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

function getNextMonthKey(mk: string) {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtMonth(mk: string) {
  const [y, m] = mk.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

interface StatCard { label: string; value: string; sub?: string; accent: string; }

export default function DashboardPage() {
  const router   = useRouter();
  const [monthKey]   = useState(getCurrentMonthKey);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg]     = useState<string | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [addForm, setAddForm]   = useState({
    description: "", amount: "", category: "",
    dueDate: `${getCurrentMonthKey()}-01`, isRecurring: false, frequency: "monthly",
  });
  const [addIncomeForm, setAddIncomeForm] = useState({
    description: "", amount: "", category: "Income",
    dueDate: `${getCurrentMonthKey()}-01`,
  });
  const [addError, setAddError]       = useState<string | null>(null);
  const [addIncomeError, setAddIncomeError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/expenses?monthKey=${monthKey}`);
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }, [monthKey]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  async function handleUpdate(id: string, data: Partial<Expense>) {
    await fetch(`/api/expenses/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    await fetchExpenses();
  }

  async function handleMove(section: Expense[], id: string, dir: "up" | "down") {
    const idx = section.findIndex(e => e.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= section.length) return;
    const allZero = section.every(e => e.sortOrder === 0);
    if (allZero) {
      await Promise.all(section.map((e, i) =>
        fetch(`/api/expenses/${e.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: i * 10 }) })
      ));
    }
    const a = section[idx];
    const b = section[swapIdx];
    const aOrder = allZero ? idx * 10 : a.sortOrder;
    const bOrder = allZero ? swapIdx * 10 : b.sortOrder;
    await Promise.all([
      fetch(`/api/expenses/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: bOrder }) }),
      fetch(`/api/expenses/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: aOrder }) }),
    ]);
    await fetchExpenses();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    await fetchExpenses();
  }

  async function handleGenerate() {
    const next = getNextMonthKey(monthKey);
    if (!confirm(`Generate ${fmtMonth(next)} from recurring expenses?`)) return;
    setGenerating(true); setGenMsg(null);
    try {
      const res  = await fetch("/api/expenses/generate-month", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetMonthKey: next }),
      });
      const data = await res.json();
      if (res.ok) { setGenMsg(`✓ ${data.message}`); router.push(`/monthly/${next}`); }
      else setGenMsg(`✗ ${data.error}`);
    } catch { setGenMsg("✗ Network error"); }
    finally { setGenerating(false); }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault(); setAddError(null);
    if (!addForm.description || !addForm.amount || !addForm.category || !addForm.dueDate) {
      setAddError("All fields required."); return;
    }
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, amount: parseFloat(addForm.amount), monthKey }),
    });
    if (res.ok) {
      setShowAdd(false);
      setAddForm({ description: "", amount: "", category: "", dueDate: `${monthKey}-01`, isRecurring: false, frequency: "monthly" });
      fetchExpenses();
    } else {
      const d = await res.json(); setAddError(d.error || "Failed.");
    }
  }

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault(); setAddIncomeError(null);
    if (!addIncomeForm.description || !addIncomeForm.amount || !addIncomeForm.dueDate) {
      setAddIncomeError("All fields required."); return;
    }
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addIncomeForm, amount: parseFloat(addIncomeForm.amount), frequency: "income", monthKey }),
    });
    if (res.ok) {
      setShowAddIncome(false);
      setAddIncomeForm({ description: "", amount: "", category: "Income", dueDate: `${monthKey}-01` });
      fetchExpenses();
    } else {
      const d = await res.json(); setAddIncomeError(d.error || "Failed.");
    }
  }

  // ── Split expenses ────────────────────────────────────────────────────────
  const monthly = expenses.filter(e => e.frequency === "monthly");
  const annual  = expenses.filter(e => e.frequency === "annual");
  const liens   = expenses.filter(e => e.frequency === "lien");
  const income  = expenses.filter(e => e.frequency === "income");

  // ── Stats ─────────────────────────────────────────────────────────────────
  const mDue  = monthly.reduce((s, e) => s + e.amount, 0);
  const mPaid = monthly.reduce((s, e) => s + e.amountPaid, 0);
  const mRem  = monthly.reduce((s, e) => s + Math.max(0, e.amount - e.amountPaid), 0);
  const aDue  = annual.reduce((s, e) => s + e.amount, 0);
  const aPaid = annual.reduce((s, e) => s + e.amountPaid, 0);
  const aRem  = annual.reduce((s, e) => s + Math.max(0, e.amount - e.amountPaid), 0);
  const lDue  = liens.reduce((s, e) => s + e.amount, 0);
  const lPaid = liens.reduce((s, e) => s + e.amountPaid, 0);
  const lRem  = liens.reduce((s, e) => s + Math.max(0, e.amount - e.amountPaid), 0);
  const iExp  = income.reduce((s, e) => s + e.amount, 0);
  const iRec  = income.reduce((s, e) => s + e.amountPaid, 0);

  const totalDue  = mDue + aDue + lDue;
  const totalPaid = mPaid + aPaid + lPaid;
  const totalRem  = mRem + aRem + lRem;
  const pctPaid   = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
  const netBalance = iRec - totalRem;

  const pastDueCount = expenses.filter(e => {
    const s = computeStatus({ status: e.status, paymentDate: e.paymentDate, dueDate: e.dueDate, amountPaid: e.amountPaid, amount: e.amount });
    return s === "Past Due" || s === "Overdue";
  }).length;
  const paidCount = expenses.filter(e => {
    const s = computeStatus({ status: e.status, paymentDate: e.paymentDate, dueDate: e.dueDate, amountPaid: e.amountPaid, amount: e.amount });
    return s === "Paid";
  }).length;

  const cards: StatCard[] = [
    { label: "Grand Total Due",      value: fmt(totalDue),       sub: `${pctPaid.toFixed(0)}% paid`,      accent: NAVY },
    { label: "Monthly Expenses",     value: fmt(mDue),           sub: `${monthly.length} items`,          accent: "#1e40af" },
    { label: "Annual Expenses",      value: fmt(aDue),           sub: `${annual.length} items`,           accent: "#1a5c8a" },
    { label: "Total Paid",           value: fmt(totalPaid),      sub: `${paidCount} items paid`,          accent: "#16a34a" },
    { label: "Remaining Balance",    value: fmt(totalRem),       sub: `Monthly: ${fmt(mRem)}`,            accent: "#dc2626" },
    { label: "Past Due",             value: String(pastDueCount),sub: `items need attention`,             accent: "#b91c1c" },
    { label: "Income Expected",      value: fmt(iExp),           sub: `${income.length} sources`,         accent: "#0f766e" },
    { label: "Income Received",      value: fmt(iRec),           sub: `of ${fmt(iExp)} expected`,         accent: "#16a34a" },
    { label: "Net Balance",          value: fmt(netBalance),     sub: netBalance >= 0 ? "surplus" : "deficit", accent: netBalance >= 0 ? "#16a34a" : "#dc2626" },
  ];

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh" }}>

      {/* Page header */}
      <div style={{ background: "linear-gradient(135deg, #0d2b4e 0%, #1a4a8a 100%)", borderBottom: "1px solid #163152" }}>
        <div className="max-w-screen-2xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Budget Dashboard</h1>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{fmtMonth(monthKey)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => router.push(`/monthly/${monthKey}`)}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
                Monthly View
              </button>
              <button onClick={handleGenerate} disabled={generating}
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                style={{ background: "#fff", color: NAVY }}>
                {generating ? "Generating…" : `+ ${fmtMonth(getNextMonthKey(monthKey))}`}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pctPaid}%`, background: "linear-gradient(90deg, #34d399, #10b981)" }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            {fmt(totalPaid)} paid of {fmt(totalDue)} total
          </p>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-8">

        {genMsg && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm font-medium"
            style={genMsg.startsWith("✓")
              ? { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }
              : { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" }}>
            {genMsg}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
          {cards.map(c => (
            <div key={c.label} className="rounded-xl p-4 shadow-sm"
              style={{ background: "#fff", border: `1px solid #e2e8f0`, borderTop: `3px solid ${c.accent}` }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#94a3b8" }}>{c.label}</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: c.accent }}>{c.value}</p>
              {c.sub && <p className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>{c.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── MONTHLY EXPENSES ─────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full" style={{ background: NAVY }} />
              <div>
                <h2 className="text-base font-bold" style={{ color: NAVY }}>Monthly Expenses</h2>
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  {monthly.length} items · Due: {fmt(mDue)} · Paid: {fmt(mPaid)} · Remaining: {fmt(mRem)}
                </p>
              </div>
            </div>
            <button onClick={() => setShowAdd(!showAdd)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
              style={{ background: showAdd ? "#fee2e2" : "#fff", color: showAdd ? "#b91c1c" : NAVY, border: `1px solid ${showAdd ? "#fecaca" : "#cbd5e1"}` }}>
              {showAdd ? "Cancel" : "+ Add Expense"}
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
            <form onSubmit={handleAddExpense}
              className="mb-5 rounded-xl p-5 grid grid-cols-2 md:grid-cols-3 gap-4"
              style={{ background: "#fff", border: "1px solid #cbd5e1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              {[
                { label: "Description *", key: "description", type: "text",   placeholder: "e.g. Netflix" },
                { label: "Amount *",      key: "amount",      type: "number", placeholder: "0.00" },
                { label: "Category *",    key: "category",    type: "text",   placeholder: "e.g. GR Business" },
                { label: "Due Date *",    key: "dueDate",     type: "date",   placeholder: "" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748b" }}>{f.label}</label>
                  <input type={f.type} value={(addForm as any)[f.key]} placeholder={f.placeholder}
                    onChange={e => setAddForm({ ...addForm, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }} />
                </div>
              ))}
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#64748b" }}>
                  <input type="checkbox" checked={addForm.isRecurring}
                    onChange={e => setAddForm({ ...addForm, isRecurring: e.target.checked })}
                    className="w-4 h-4 accent-blue-700" /> Recurring
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#64748b" }}>
                  <input type="checkbox" checked={addForm.frequency === "annual"}
                    onChange={e => setAddForm({ ...addForm, frequency: e.target.checked ? "annual" : "monthly" })}
                    className="w-4 h-4 accent-blue-700" /> Annual
                </label>
              </div>
              <div className="col-span-2 md:col-span-3 flex items-center gap-3">
                {addError && <p className="text-xs" style={{ color: "#dc2626" }}>{addError}</p>}
                <button type="submit"
                  className="px-5 py-2 text-sm font-semibold rounded-lg transition-all"
                  style={{ background: NAVY, color: "#fff" }}>
                  Add Expense
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="py-16 text-center" style={{ color: "#94a3b8" }}>Loading…</div>
          ) : (
            <ExpenseTable expenses={monthly} onUpdate={handleUpdate} onDelete={handleDelete}
              onMoveUp={id => handleMove(monthly, id, "up")} onMoveDown={id => handleMove(monthly, id, "down")}
              headerColor={NAVY} />
          )}
        </div>

        {/* ── ANNUAL EXPENSES ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 rounded-full" style={{ background: "#1a5c8a" }} />
            <div>
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "#1a3a5c" }}>
                Annual Expenses
                <span className="text-xs font-normal px-2 py-0.5 rounded-full"
                  style={{ background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" }}>
                  auto-added on due month
                </span>
              </h2>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                {annual.length} items · Due: {fmt(aDue)} · Paid: {fmt(aPaid)} · Remaining: {fmt(aRem)}
              </p>
            </div>
          </div>

          {loading ? null : (
            <ExpenseTable expenses={annual} onUpdate={handleUpdate} onDelete={handleDelete}
              onMoveUp={id => handleMove(annual, id, "up")} onMoveDown={id => handleMove(annual, id, "down")}
              headerColor={ANNUAL_HDR} />
          )}
        </div>

        {/* ── LIENS & COLLECTIONS ──────────────────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 rounded-full" style={{ background: "#7f1d1d" }} />
            <div>
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "#7f1d1d" }}>
                Liens, Collections &amp; Defaulted Debt
                <span className="text-xs font-normal px-2 py-0.5 rounded-full"
                  style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" }}>
                  not auto-copied
                </span>
              </h2>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                {liens.length} items · Total: {fmt(lDue)} · Paid: {fmt(lPaid)} · Remaining: {fmt(lRem)}
              </p>
            </div>
          </div>

          {loading ? null : (
            <ExpenseTable expenses={liens} onUpdate={handleUpdate} onDelete={handleDelete}
              onMoveUp={id => handleMove(liens, id, "up")} onMoveDown={id => handleMove(liens, id, "down")}
              headerColor="#7f1d1d" />
          )}
        </div>

        {/* ── INCOME ───────────────────────────────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full" style={{ background: "#0f766e" }} />
              <div>
                <h2 className="text-base font-bold" style={{ color: "#0f766e" }}>Income</h2>
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  {income.length} sources · Expected: {fmt(iExp)} · Received: {fmt(iRec)} · Net Balance: <span style={{ color: netBalance >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{fmt(netBalance)}</span>
                </p>
              </div>
            </div>
            <button onClick={() => setShowAddIncome(!showAddIncome)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
              style={{ background: showAddIncome ? "#fee2e2" : "#fff", color: showAddIncome ? "#b91c1c" : "#0f766e", border: `1px solid ${showAddIncome ? "#fecaca" : "#99f6e4"}` }}>
              {showAddIncome ? "Cancel" : "+ Add Income"}
            </button>
          </div>

          {showAddIncome && (
            <form onSubmit={handleAddIncome}
              className="mb-5 rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4"
              style={{ background: "#fff", border: "1px solid #99f6e4", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              {[
                { label: "Description *", key: "description", type: "text",   placeholder: "e.g. Paycheck" },
                { label: "Expected Amount *", key: "amount",  type: "number", placeholder: "0.00" },
                { label: "Category",      key: "category",    type: "text",   placeholder: "Income" },
                { label: "Date *",        key: "dueDate",     type: "date",   placeholder: "" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748b" }}>{f.label}</label>
                  <input type={f.type} value={(addIncomeForm as any)[f.key]} placeholder={f.placeholder}
                    onChange={e => setAddIncomeForm({ ...addIncomeForm, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }} />
                </div>
              ))}
              <div className="col-span-2 md:col-span-4 flex items-center gap-3">
                {addIncomeError && <p className="text-xs" style={{ color: "#dc2626" }}>{addIncomeError}</p>}
                <button type="submit"
                  className="px-5 py-2 text-sm font-semibold rounded-lg"
                  style={{ background: "#0f766e", color: "#fff" }}>Add Income</button>
              </div>
            </form>
          )}

          {loading ? null : (
            <ExpenseTable expenses={income} onUpdate={handleUpdate} onDelete={handleDelete}
              onMoveUp={id => handleMove(income, id, "up")} onMoveDown={id => handleMove(income, id, "down")}
              headerColor="#0f766e" />
          )}
        </div>

      </div>
    </div>
  );
}
