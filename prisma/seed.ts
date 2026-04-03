import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MONTH_KEY = "2026-04";

// Monthly due dates (all April 2026)
function apr(day: number) {
  return new Date(`2026-04-${String(day).padStart(2, "0")}T12:00:00.000Z`);
}

// Annual due dates — stored with their TRUE calendar date so the
// generate-month logic knows which month to auto-include them.
function dt(yyyy: number, mm: number, dd: number) {
  return new Date(`${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T12:00:00.000Z`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY EXPENSES — appear every month
// ─────────────────────────────────────────────────────────────────────────────
const monthly = [
  // ── April 1 ──
  { description: "Jewish Therapist Collective",             amount: 18.00,    amountPaid: 0,        category: "GR Business",               dueDate: apr(1),  status: "Past Due" },
  { description: "Ensora Health (Activate 12/04/25)",       amount: 59.00,    amountPaid: 0,        category: "GR Business",               dueDate: apr(1),  status: "Past Due" },
  { description: "Google Photos Storage",                   amount: 0,        amountPaid: 0,        category: "GR Business",               dueDate: apr(1),  notes: "flow" },
  { description: "Google Photos Storage",                   amount: 1.99,     amountPaid: 1.99,     category: "GR Business",               dueDate: apr(1) },
  { description: "Personalized Landscaping",                amount: 200.00,   amountPaid: 0,        category: "Utilities",                 dueDate: apr(1),  status: "Paid as Agreed" },
  { description: "HSPO (AON) INSURANCE",                    amount: 157.00,   amountPaid: 157.00,   category: "GR Business",               dueDate: apr(1) },
  { description: "Housing Mortgage",                        amount: 2595.00,  amountPaid: 2595.00,  category: "Mortgage",                  dueDate: apr(1) },
  // ── April 2 ──
  { description: "IDF Israel Defense Fund",                 amount: 50.00,    amountPaid: 0,        category: "IDF Donation",              dueDate: apr(2) },
  { description: "IDFWO | Widows and Orphans Oct 7th",      amount: 50.00,    amountPaid: 0,        category: "IDFWO Donation",            dueDate: apr(2) },
  { description: "Credit One- (Non Amex)",                  amount: 35.15,    amountPaid: 0,        category: "Credit Card",               dueDate: apr(2),  status: "Past Due" },
  { description: "Canva Pro (cancelled) (expires 04/24)",   amount: 15.00,    amountPaid: 0,        category: "Account Closed",            dueDate: apr(2) },
  // ── April 3 ──
  { description: "AT&T Internet",                           amount: 0,        amountPaid: 0,        category: "Utilities",                 dueDate: apr(3) },
  { description: "AT&T Phone",                              amount: 206.17,   amountPaid: 206.17,   category: "Utilities",                 dueDate: apr(3) },
  { description: "Proactive",                               amount: 24.95,    amountPaid: 0,        category: "Skincare",                  dueDate: apr(3) },
  { description: "Photoroom",                               amount: 10.69,    amountPaid: 0,        category: "GR Business",               dueDate: apr(3) },
  { description: "VSCO-PRO",                                amount: 13.90,    amountPaid: 0,        category: "GR Business",               dueDate: apr(3) },
  // ── April 4 ──
  { description: "Sticky Notes ($2.99) (Monthly)",          amount: 2.99,     amountPaid: 0,        category: "GR Business",               dueDate: apr(4) },
  { description: "MRC Chat GPT",                            amount: 21.39,    amountPaid: 21.39,    category: "GR Business",               dueDate: apr(4) },
  { description: "CapCut",                                  amount: 11.99,    amountPaid: 0,        category: "GR Business",               dueDate: apr(4) },
  { description: "MRC School Loan  Due: 02/18/2026",        amount: 154.00,   amountPaid: 0,        category: "In Forbearance",            dueDate: apr(4) },
  // ── April 5 ──
  { description: "Kohl's credit (MRC) (Paid off 10/3/25)",  amount: 56.00,    amountPaid: 0,        category: "Credit Card",               dueDate: apr(5) },
  { description: "401K American Express Card",              amount: 60.00,    amountPaid: 0,        category: "Credit Card",               dueDate: apr(5) },
  { description: "Progressive Car Insurance",               amount: 290.00,   amountPaid: 290.00,   category: "Auto Insurance",            dueDate: apr(5) },
  // ── April 6 ──
  { description: "IG Comment (As Needed)",                  amount: 30.00,    amountPaid: 0,        category: "GR Business",               dueDate: apr(6) },
  { description: "Microsoft Business 365 Co-Pilot",         amount: 28.10,    amountPaid: 0,        category: "GR Business",               dueDate: apr(6),  status: "Paid as Agreed" },
  // ── April 7 ──
  { description: "First Choice Disposal",                   amount: 198.00,   amountPaid: 0,        category: "Quarterly Trash Pickup",    dueDate: apr(7),  status: "Paid as Agreed" },
  { description: "Canva Pro",                               amount: 16.05,    amountPaid: 0,        category: "GR Business",               dueDate: apr(7) },
  { description: "ULTA credit (MRC)",                       amount: 63.00,    amountPaid: 0,        category: "Credit Card",               dueDate: apr(7) },
  { description: "The Treeist",                             amount: 1400.00,  amountPaid: 0,        category: "Utilities",                 dueDate: apr(7) },
  { description: "ADT (Home Security)",                     amount: 0,        amountPaid: 0,        category: "ADT",                       dueDate: apr(7),  status: "Paid as Agreed" },
  // ── April 8 ──
  { description: "Instagram Meta Verified (MRC)",           amount: 16.04,    amountPaid: 16.04,    category: "GR Business",               dueDate: apr(8) },
  { description: "UpGrow (As Needed) (on hold)",            amount: 99.00,    amountPaid: 0,        category: "GR Business",               dueDate: apr(8) },
  // ── April 9 ──
  { description: "Vi Health",                               amount: 17.10,    amountPaid: 17.10,    category: "Health App",                dueDate: apr(9) },
  // ── April 10 ──
  { description: "Netflix",                                 amount: 19.25,    amountPaid: 0,        category: "Netflix",                   dueDate: apr(10) },
  { description: "ChatGPT-CVH",                             amount: 21.39,    amountPaid: 21.39,    category: "Business",                  dueDate: apr(10) },
  { description: "Psychology Today",                        amount: 29.95,    amountPaid: 0,        category: "GR Business",               dueDate: apr(10) },
  { description: "Repost (monthly)",                        amount: 5.34,     amountPaid: 0,        category: "GR Business",               dueDate: apr(10) },
  // ── April 12 ──
  { description: "Regional Finance",                        amount: 49.15,    amountPaid: 0,        category: "Debt",                      dueDate: apr(12) },
  // ── April 15 ──
  { description: "BOA Maintenance Fee",                     amount: 12.00,    amountPaid: 12.00,    category: "Bank Fee 9850",             dueDate: apr(15) },
  { description: "BOA Maintenance Fee",                     amount: 4.95,     amountPaid: 0,        category: "Bank Fee 4051",             dueDate: apr(15) },
  // ── April 16 ──
  { description: "Unfold-PRO",                              amount: 13.90,    amountPaid: 0,        category: "GR Business",               dueDate: apr(16) },
  // ── April 17 ──
  { description: "Duke Energy",                             amount: 626.80,   amountPaid: 626.80,   category: "Utilities",                 dueDate: apr(17) },
  // ── April 18 ──
  { description: "Square Space",                            amount: 36.00,    amountPaid: 36.00,    category: "GR Business",               dueDate: apr(18) },
  // ── April 20 ──
  { description: "Runway",                                  amount: 15.00,    amountPaid: 0,        category: "GR Business",               dueDate: apr(20) },
  { description: "AT&T Phone",                              amount: 203.65,   amountPaid: 203.65,   category: "Utilities",                 dueDate: apr(20) },
  { description: "NCBLCMHC (PLLC Renewal)",                 amount: 35.00,    amountPaid: 0,        category: "GR Business",               dueDate: apr(20) },
  { description: "Personalized Landscaping",                amount: 400.00,   amountPaid: 400.00,   category: "Utilities",                 dueDate: apr(20) },
  // ── April 21 ──
  { description: "Respicare (MRC)",                         amount: 100.00,   amountPaid: 0,        category: "Health Bill",               dueDate: apr(21) },
  { description: "Respicare (CVH)",                         amount: 0,        amountPaid: 0,        category: "Health Bill",               dueDate: apr(21) },
  { description: "Apple Card Goldman Sachs",                amount: 50.00,    amountPaid: 0,        category: "Microsoft 365",             dueDate: apr(21) },
  { description: "Aqua Waters (Sewage)",                    amount: 120.00,   amountPaid: 0,        category: "Aqua Water-Sewage",         dueDate: apr(21), status: "Paid as Agreed" },
  // ── April 22 ──
  { description: "Enbridge (Gas Bill) connect with Svc Ex", amount: 79.59,   amountPaid: 0,        category: "Utilities & Loan Combo",    dueDate: apr(22) },
  // ── April 25 ──
  { description: "Happy Home HVAC Services",                amount: 25.00,    amountPaid: 0,        category: "HVAC Maintenance",          dueDate: apr(25) },
  { description: "Tri-River Water",                         amount: 54.43,    amountPaid: 0,        category: "Utilities",                 dueDate: apr(25) },
  // ── April 27 ──
  { description: "Capital One credit (MRC) 27th of month",  amount: 25.00,   amountPaid: 25.00,    category: "Credit Card",               dueDate: apr(27) },
  { description: "Preview-PRO (Renews 27th of month)",      amount: 8.55,    amountPaid: 8.55,     category: "GR Business",               dueDate: apr(27) },
  // ── April 28 ──
  { description: "Salon Lofts (Appt: Jan 2, 2026)",         amount: 284.00,  amountPaid: 0,        category: "Salon",                     dueDate: apr(28) },
];

// ─────────────────────────────────────────────────────────────────────────────
// LIENS, COLLECTIONS & DEFAULTED DEBT — separate section, never auto-copied
// ─────────────────────────────────────────────────────────────────────────────
const liens = [
  { description: "Drexel Perkins Loan (IN DEFAULT)",       amount: 5694.34, amountPaid: 0, category: "Student Loan — Default",        dueDate: apr(22), notes: "In default / forbearance" },
  { description: "Service Experts Ducts (LIEN HOME)",      amount: 6694.76, amountPaid: 0, category: "Collections LIEN ON HOME",      dueDate: apr(6),  notes: "Lien on home — Attorney General dispute" },
  { description: "AC UNITS (Serv Experts) (LIEN HOME)",    amount: 345.00,  amountPaid: 0, category: "Collections LIEN ON HOME",      dueDate: apr(7),  notes: "Dispute — Attorney General" },
  { description: "PayPal (Synchrony Bank) (Written Off)",  amount: 1870.00, amountPaid: 0, category: "Written Off — In Forbearance",  dueDate: apr(3),  notes: "Written off / in forbearance" },
];

// ─────────────────────────────────────────────────────────────────────────────
// ANNUAL EXPENSES — each carries its TRUE calendar due date so the
// generate-month route knows which month to auto-include it.
// ─────────────────────────────────────────────────────────────────────────────
const annual = [
  // Due in APRIL
  { description: "Apple Card Plan MacBook Pro (Annual)",   amount: 99.00,    amountPaid: 0,       category: "GR Business",    dueDate: dt(2026,4,1),  status: "Past Due",       notes: "Annual — renews every April" },
  { description: "1Password 35.99 (Yearly)",              amount: 35.99,    amountPaid: 0,       category: "Business",       dueDate: dt(2026,4,4),  notes: "Annual — renews every April" },
  { description: "HOA Governor's Club",                   amount: 3744.00,  amountPaid: 0,       category: "HOA",            dueDate: dt(2026,4,1),  status: "Past Due",       notes: "Annual HOA dues" },
  { description: "POA Stone Brook",                       amount: 1867.77,  amountPaid: 0,       category: "HOA",            dueDate: dt(2026,4,1),  status: "Past Due",       notes: "Annual POA dues" },
  // Due in MAY
  { description: "Norton (Annually) 05/09/26",            amount: 155.86,   amountPaid: 0,       category: "Annual Subscription", dueDate: dt(2026,5,9),   notes: "Annual — renews every May 9" },
  // Due in JULY
  { description: "Ring (Monitoring) (Annual) (07/16/26)", amount: 49.99,    amountPaid: 0,       category: "Annual Subscription", dueDate: dt(2026,7,16),  notes: "Annual — renews every July 16" },
  { description: "InShot-Video (Annual) (07/16/25)",      amount: 5.34,     amountPaid: 5.34,    category: "GR Business",    dueDate: dt(2026,7,16),  notes: "Annual — renews every July 16" },
  // Due in SEPTEMBER
  { description: "Zoom Business (Renewal 09/29/26)",      amount: 160.00,   amountPaid: 0,       category: "GR Business",    dueDate: dt(2026,9,29),  status: "Past Due",       notes: "Annual — renews every September 29" },
  // Due in DECEMBER
  { description: "FaceApp PRO (Annual) (12/5/25)",        amount: 39.99,    amountPaid: 0,       category: "GR Business",    dueDate: dt(2026,12,5),  status: "Paid as Agreed", notes: "Annual — renews every December 5" },
];

async function main() {
  console.log("Seeding database...");
  await prisma.expense.deleteMany({});

  for (const e of monthly) {
    await prisma.expense.create({
      data: {
        description: e.description,
        amount: e.amount,
        amountPaid: e.amountPaid,
        category: e.category,
        dueDate: e.dueDate,
        isRecurring: true,
        frequency: "monthly",
        status: (e as any).status ?? null,
        notes: (e as any).notes ?? null,
        monthKey: MONTH_KEY,
      },
    });
  }

  for (const e of annual) {
    await prisma.expense.create({
      data: {
        description: e.description,
        amount: e.amount,
        amountPaid: e.amountPaid,
        category: e.category,
        dueDate: e.dueDate,
        isRecurring: true,
        frequency: "annual",
        status: (e as any).status ?? null,
        notes: (e as any).notes ?? null,
        monthKey: MONTH_KEY,
      },
    });
  }

  for (const e of liens) {
    await prisma.expense.create({
      data: {
        description: e.description,
        amount: e.amount,
        amountPaid: e.amountPaid,
        category: e.category,
        dueDate: e.dueDate,
        isRecurring: false,
        frequency: "lien",
        status: (e as any).status ?? null,
        notes: (e as any).notes ?? null,
        monthKey: MONTH_KEY,
      },
    });
  }

  console.log(`✓ Seeded ${monthly.length} monthly + ${annual.length} annual + ${liens.length} liens = ${monthly.length + annual.length + liens.length} total for ${MONTH_KEY}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
