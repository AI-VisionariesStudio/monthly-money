import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { targetMonthKey } = await request.json();

    if (!targetMonthKey || !/^\d{4}-\d{2}$/.test(targetMonthKey)) {
      return NextResponse.json({ error: "targetMonthKey must be YYYY-MM" }, { status: 400 });
    }

    const existing = await prisma.expense.count({ where: { monthKey: targetMonthKey } });
    if (existing > 0) {
      return NextResponse.json(
        { error: `${targetMonthKey} already has ${existing} expense(s).` },
        { status: 409 }
      );
    }

    const [targetYear, targetMonth] = targetMonthKey.split("-").map(Number);

    // ── 1. Monthly recurring: copy from the most recent month's template ───
    const latestMonth = await prisma.expense.findFirst({
      where: { isRecurring: true, frequency: "monthly" },
      orderBy: { monthKey: "desc" },
      select: { monthKey: true },
    });

    const monthlyTemplate = latestMonth
      ? await prisma.expense.findMany({ where: { isRecurring: true, frequency: "monthly", monthKey: latestMonth.monthKey } })
      : [];

    // ── 2. Annual: find all unique annual expenses whose due-date month matches target ──
    const allAnnual = await prisma.expense.findMany({
      where: { isRecurring: true, frequency: "annual" },
      distinct: ["description"],
      orderBy: { monthKey: "asc" }, // earliest = canonical template
    });

    const annualDue = allAnnual.filter(e => {
      const month = new Date(e.dueDate).getUTCMonth() + 1;
      return month === targetMonth;
    });

    if (monthlyTemplate.length === 0 && annualDue.length === 0) {
      return NextResponse.json({ error: "No recurring expenses found to copy." }, { status: 404 });
    }

    // ── 3. Create monthly copies (preserve original due day) ───────────────
    const monthlyRows = monthlyTemplate.map(e => {
      const origDay = new Date(e.dueDate).getUTCDate();
      const safeDay = Math.min(origDay, new Date(targetYear, targetMonth, 0).getDate());
      return prisma.expense.create({
        data: {
          description: e.description,
          amount: e.amount,
          amountPaid: 0,
          category: e.category,
          dueDate: new Date(Date.UTC(targetYear, targetMonth - 1, safeDay)),
          isRecurring: true,
          frequency: "monthly",
          status: null,
          monthKey: targetMonthKey,
        },
      });
    });

    // ── 4. Create annual copies (preserve original month+day, update year) ─
    const annualRows = annualDue.map(e => {
      const origDay   = new Date(e.dueDate).getUTCDate();
      return prisma.expense.create({
        data: {
          description: e.description,
          amount: e.amount,
          amountPaid: 0,
          category: e.category,
          dueDate: new Date(Date.UTC(targetYear, targetMonth - 1, origDay)),
          isRecurring: true,
          frequency: "annual",
          status: null,
          notes: e.notes,
          monthKey: targetMonthKey,
        },
      });
    });

    const created = await prisma.$transaction([...monthlyRows, ...annualRows]);

    return NextResponse.json({
      success: true,
      monthKey: targetMonthKey,
      monthly: monthlyTemplate.length,
      annual: annualDue.length,
      total: created.length,
      message: `Generated ${monthlyTemplate.length} monthly + ${annualDue.length} annual = ${created.length} expenses for ${targetMonthKey}`,
    });
  } catch (error) {
    console.error("generate-month error:", error);
    return NextResponse.json({ error: "Failed to generate month" }, { status: 500 });
  }
}
