"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ExpenseTable, type Expense } from "@/components/ExpenseTable";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatMonthDisplay(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getPrevMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 2, 1); // m-2 because months are 0-indexed
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getNextMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthlyPage() {
  const router = useRouter();
  const params = useParams();
  const monthKey = params.monthKey as string;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    description: "",
    amount: "",
    category: "",
    dueDate: monthKey ? `${monthKey}-01` : "",
    isRecurring: false,
  });
  const [addError, setAddError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!monthKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses?monthKey=${monthKey}`);
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    fetchExpenses();
    setGenerateMsg(null);
  }, [fetchExpenses]);

  async function handleUpdate(id: string, data: Partial<Expense>) {
    await fetch(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchExpenses();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    await fetchExpenses();
  }

  async function handleGenerateMonth() {
    const nextMonth = getNextMonthKey(monthKey);
    if (
      !confirm(`Generate ${formatMonthDisplay(nextMonth)} from recurring expenses?`)
    )
      return;

    setGenerating(true);
    setGenerateMsg(null);

    try {
      const res = await fetch("/api/expenses/generate-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetMonthKey: nextMonth }),
      });
      const data = await res.json();
      if (res.ok) {
        setGenerateMsg(`✓ ${data.message}`);
        setTimeout(() => router.push(`/monthly/${nextMonth}`), 1000);
      } else {
        setGenerateMsg(`✗ ${data.error}`);
      }
    } catch (err) {
      setGenerateMsg("✗ Network error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);

    if (!addForm.description || !addForm.amount || !addForm.category || !addForm.dueDate) {
      setAddError("All fields are required.");
      return;
    }

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...addForm,
        amount: parseFloat(addForm.amount),
        monthKey,
      }),
    });

    if (res.ok) {
      setShowAddForm(false);
      setAddForm({
        description: "",
        amount: "",
        category: "",
        dueDate: `${monthKey}-01`,
        isRecurring: false,
      });
      await fetchExpenses();
    } else {
      const data = await res.json();
      setAddError(data.error || "Failed to add expense.");
    }
  }

  const prevMonth = getPrevMonthKey(monthKey);
  const nextMonth = getNextMonthKey(monthKey);

  const totalDue = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid = expenses.reduce((s, e) => s + e.amountPaid, 0);
  const totalRemaining = expenses.reduce(
    (s, e) => s + Math.max(0, e.amount - e.amountPaid),
    0
  );

  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return (
      <div className="text-center py-16 text-red-400">
        Invalid month key. Expected format: YYYY-MM
      </div>
    );
  }

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/monthly/${prevMonth}`)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            title={`Go to ${formatMonthDisplay(prevMonth)}`}
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {formatMonthDisplay(monthKey)}
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">{monthKey}</p>
          </div>
          <button
            onClick={() => router.push(`/monthly/${nextMonth}`)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            title={`Go to ${formatMonthDisplay(nextMonth)}`}
          >
            →
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={handleGenerateMonth}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {generating ? "Generating..." : `Generate ${formatMonthDisplay(nextMonth)}`}
          </button>
        </div>
      </div>

      {generateMsg && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            generateMsg.startsWith("✓")
              ? "bg-green-900/30 text-green-400 border border-green-800"
              : "bg-red-900/30 text-red-400 border border-red-800"
          }`}
        >
          {generateMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Total Due</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalDue)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Remaining</p>
          <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalRemaining)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Expenses</p>
          <p className="text-2xl font-bold text-blue-400">{expenses.length}</p>
        </div>
      </div>

      {/* Add Expense */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Expenses</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
        >
          {showAddForm ? "Cancel" : "+ Add Expense"}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddExpense}
          className="mb-6 bg-zinc-900 border border-zinc-700 rounded-xl p-5 grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs text-zinc-500 mb-1">Description *</label>
            <input
              type="text"
              value={addForm.description}
              onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. Netflix"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Amount *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={addForm.amount}
              onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Category *</label>
            <input
              type="text"
              value={addForm.category}
              onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. Subscriptions"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Due Date *</label>
            <input
              type="date"
              value={addForm.dueDate}
              onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={addForm.isRecurring}
                onChange={(e) => setAddForm({ ...addForm, isRecurring: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              Recurring
            </label>
          </div>
          <div className="col-span-2 md:col-span-3">
            {addError && <p className="text-red-400 text-xs mb-2">{addError}</p>}
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add Expense
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-zinc-500">Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500 mb-4">No expenses for {formatMonthDisplay(monthKey)}.</p>
          <button
            onClick={handleGenerateMonth}
            disabled={generating}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Generate from Recurring
          </button>
        </div>
      ) : (
        <ExpenseTable
          expenses={expenses}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
