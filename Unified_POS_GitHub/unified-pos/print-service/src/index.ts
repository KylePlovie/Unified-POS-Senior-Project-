const API_BASE = "http://localhost:3001/api";
const PRINTER_USER_ID = process.env.PRINTER_USER_ID || "SET_AFTER_SEEDING";

interface PrintJob { id: string; barLocation: string; payload: string; attempts: number; }

async function fetchQueue(bar: string): Promise<PrintJob[]> {
  const res = await fetch(`${API_BASE}/print/queue?barLocation=${bar}`, { headers: { "x-user-id": PRINTER_USER_ID } });
  if (!res.ok) return [];
  return res.json();
}

async function markComplete(jobId: string): Promise<void> {
  await fetch(`${API_BASE}/print/${jobId}/complete`, { method: "POST", headers: { "x-user-id": PRINTER_USER_ID } });
}

function printTicket(job: PrintJob): void {
  const data = JSON.parse(job.payload);
  console.log(`\n${"=".repeat(40)}\n  PRINTER: ${job.barLocation}\n${"=".repeat(40)}\n  Tab:  ${data.tab}\n  Item: ${data.item} x${data.qty}\n  Time: ${new Date(data.time).toLocaleTimeString()}\n${"=".repeat(40)}\n`);
}

async function pollLoop(bar: string, intervalMs = 3000) {
  console.log(`Print service started for ${bar}`);
  setInterval(async () => {
    try { const jobs = await fetchQueue(bar); for (const job of jobs) { printTicket(job); await markComplete(job.id); } }
    catch (err) { console.error(`Print poll error for ${bar}:`, (err as Error).message); }
  }, intervalMs);
}

["I_BAR", "SERVICE_BAR", "QUICKIE_BAR"].forEach(bar => pollLoop(bar));
