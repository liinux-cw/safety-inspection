"use client";
/* ตัวช่วยของแผนตรวจ ปจ.2 — สร้าง/แก้ไข/ลบแผน · กฎห้ามซ้อนแผน · แผนเดินทาง · เอกสารของผู้รับจ้าง
   flow (เจ้าของงาน 20 พ.ย. 2569): สร้างแผน + เลือกยานพาหนะ → หัวหน้า กบค. อนุมัติ → กบค. สร้างแผนเดินทาง (เลือกผู้รับจ้าง + ค่าจ้างรายคัน) → หัวหน้า กบค. อนุมัติแผนเดินทาง
   → ผู้รับจ้างบันทึกผลรายคัน (popup) → กบค. อนุมัติรายคัน → ผู้รับจ้างขอปิดงานแผนเดินทาง → กบค. อนุมัติปิดงาน · ไม่มีปิดแผนหลัก */
import { TODAY, VEHICLE_BY_ID, type CarDocs, type DocFile, type Plan, type Trip } from "./data";
import { getMock, setMock, type MockState } from "./store";

export interface Draft { name: string; fy: string; from: string; to: string; cars: string[] }
export const EMPTY_DRAFT: Draft = { name: "", fy: "", from: "", to: "", cars: [] };
export const draftOf = (p: Plan): Draft => ({ name: p.name, fy: p.fy, from: p.from, to: p.to, cars: [...p.cars] });

/** แก้ไข/ลบได้เฉพาะแผนที่ยังไม่อนุมัติ (รออนุมัติ · ส่งกลับแก้ไข) */
export const editable = (p: Plan) => p.status === "review" || p.status === "returned";
/** คันที่ผู้รับจ้างเริ่มกรอกผลแล้ว — เอาออกจากแผนเดินทางไม่ได้ */
export const hasWork = (s: MockState, mr: string, car: string) => { const d = s.docs[mr]?.[car]; return !!d && !!(d.date || d.result || d.files.length || d.sentAt || d.approvedAt); };
/** ปีงบประมาณของรอบตรวจ: ต.ค.–ก.ย. · เดือนสิ้นสุดต้องอยู่ปีงบเดียวกับเดือนเริ่มต้น */
export const fyRange = (fyBE: string) => { const y = Number(fyBE) - 543; return { from: (y - 1) + "-10", to: y + "-09" }; };

/** ยานพาหนะที่อยู่ในแผน ปจ.2 อื่นที่ยังไม่เสร็จสิ้น → เลขที่ MR ของแผนนั้น (เลือกเข้าแผนนี้ไม่ได้) */
export function takenMap(s: MockState, exceptMr?: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of s.plans) {
    if (p.mr === exceptMr || p.status === "closed") continue;
    for (const c of p.cars) out[c] = p.mr;
  }
  return out;
}

export function createPlan(d: Draft): string {
  const s = getMock();
  const mr = "MRZ" + (s.lastMr + 1);
  setMock((x) => ({ ...x, lastMr: x.lastMr + 1, plans: [{ mr, ...d, cars: [...d.cars], status: "review", submittedAt: TODAY }, ...x.plans] }));
  return mr;
}
/** บันทึกแผนที่แก้ไข — แผนที่ส่งกลับแก้ไขกลับไปรออนุมัติ */
export function updatePlan(mr: string, d: Draft) {
  setMock((x) => ({ ...x, plans: x.plans.map((p) => (p.mr === mr ? { ...p, ...d, cars: [...d.cars], status: "review", submittedAt: TODAY, returnReason: undefined } : p)) }));
}
export function deletePlan(mr: string) {
  setMock((x) => {
    const docs = { ...x.docs };
    delete docs[mr];
    return { ...x, plans: x.plans.filter((p) => p.mr !== mr), trips: x.trips.filter((t) => t.mr !== mr), docs };
  });
}
/* ---------- หัวหน้า กบค.: อนุมัติแผน ---------- */
const setPlan = (mr: string, fn: (p: Plan) => Plan) => setMock((x) => ({ ...x, plans: x.plans.map((p) => (p.mr === mr ? fn(p) : p)) }));
/** อนุมัติแผน (หลายแผนพร้อมกันได้) → กบค. สร้างแผนเดินทางได้ */
export const approvePlans = (mrs: string[], head: string) =>
  setMock((x) => ({ ...x, plans: x.plans.map((p) => (mrs.includes(p.mr) && p.status === "review" ? { ...p, status: "approved", approvedBy: head, approvedAt: TODAY, returnReason: undefined } : p)) }));
/** ส่งกลับแก้ไขแผน (ต้องมีเหตุผล) → กบค. แก้แล้วส่งใหม่ */
export const returnPlan = (mr: string, reason: string) => setPlan(mr, (p) => (p.status === "review" ? { ...p, status: "returned", returnReason: reason } : p));

/* ---------- แผนเดินทาง ---------- */
export const tripsOf = (s: MockState, mr: string) => s.trips.filter((t) => t.mr === mr);
export const tripById = (s: MockState, id: string | null) => s.trips.find((t) => t.id === id);
/** แผนเดินทางที่ยานพาหนะคันนี้อยู่ (1 คันอยู่ได้แผนเดินทางเดียว) */
export const tripOfCar = (s: MockState, mr: string, car: string) => s.trips.find((t) => t.mr === mr && t.cars.includes(car));
/** คันในแผนที่ยังไม่อยู่ในแผนเดินทางใด (ยกเว้นแผนเดินทาง except ที่กำลังแก้) */
export const freeCars = (s: MockState, p: Plan, except?: string) => p.cars.filter((c) => !s.trips.some((t) => t.mr === p.mr && t.id !== except && t.cars.includes(c)));
/** สร้างแผนเดินทางได้เมื่อแผนอนุมัติแล้วและยังมีคันที่ไม่อยู่ในแผนเดินทาง */
export const canCreateTrip = (s: MockState, p: Plan) => p.status === "approved" && freeCars(s, p).length > 0;
/** ผู้รับจ้างบันทึก/ส่งผลได้เมื่อแผนเดินทางอนุมัติแล้วและยังไม่ขอปิดงาน */
export const tripOpen = (t: Trip) => t.status === "active";
/** ผู้รับจ้างเห็นแผนเดินทางหลังหัวหน้า กบค. อนุมัติ */
export const vendorSeesTrip = (t: Trip) => t.status === "active" || t.status === "closing" || t.status === "closed";
/** แก้ไข/ลบแผนเดินทางได้ก่อนอนุมัติ (รออนุมัติ · ส่งกลับแก้ไข) */
export const tripEditable = (t: Trip) => t.status === "review" || t.status === "returned";
export type TripDraft = Omit<Trip, "id" | "mr" | "status" | "createdAt" | "submittedAt" | "returnReason" | "approvedBy" | "approvedAt" | "closeRequestedAt" | "closeReturnReason" | "closedAt">;
export const EMPTY_TRIP: TripDraft = { name: "", vendor: "", vendorTel: "", contract: "", costs: {}, cars: [], d1: "", d2: "", locs: {}, phones: {}, names: {}, works: {} };
export const tripDraftOf = (t: Trip): TripDraft => ({ name: t.name, vendor: t.vendor, vendorTel: t.vendorTel, contract: t.contract, costs: { ...t.costs }, cars: [...t.cars], d1: t.d1, d2: t.d2,
  locs: { ...t.locs }, phones: { ...t.phones }, names: { ...t.names }, works: { ...t.works } });
export function createTrip(mr: string, d: TripDraft): string {
  const s = getMock();
  const n = Math.max(0, ...tripsOf(s, mr).map((t) => Number(t.id.split("-")[1]) || 0)) + 1;
  const id = mr + "-" + n;
  setMock((x) => ({ ...x, trips: [...x.trips, { ...d, id, mr, status: "review", createdAt: TODAY, submittedAt: TODAY }] }));
  return id;
}
/** บันทึกแผนเดินทางที่แก้ไข → กลับไปรอหัวหน้า กบค. อนุมัติ */
export const updateTrip = (id: string, d: TripDraft) => setMock((x) => ({ ...x, trips: x.trips.map((t) => (t.id === id ? { ...t, ...d, status: "review", submittedAt: TODAY, returnReason: undefined } : t)) }));
export const deleteTrip = (id: string) => setMock((x) => ({ ...x, trips: x.trips.filter((t) => t.id !== id) }));
const setTrip = (id: string, fn: (t: Trip) => Trip) => setMock((x) => ({ ...x, trips: x.trips.map((t) => (t.id === id ? fn(t) : t)) }));
/** หัวหน้า กบค. อนุมัติแผนเดินทาง (หลายแผนพร้อมกันได้) → แจ้งผู้รับจ้าง กรย. ผู้ดูแลยานพาหนะ · ผู้รับจ้างเริ่มบันทึกผลได้ */
export const approveTrips = (ids: string[], head: string) =>
  setMock((x) => ({ ...x, trips: x.trips.map((t) => (ids.includes(t.id) && t.status === "review" ? { ...t, status: "active", approvedBy: head, approvedAt: TODAY, returnReason: undefined } : t)) }));
/** ส่งกลับแก้ไขแผนเดินทาง (ต้องมีเหตุผล) → กบค. แก้แล้วส่งใหม่ */
export const returnTrip = (id: string, reason: string) => setTrip(id, (t) => (t.status === "review" ? { ...t, status: "returned", returnReason: reason } : t));
/** ผู้รับจ้างส่งอนุมัติปิดงานแผนเดินทาง */
export const requestCloseTrip = (id: string) => setTrip(id, (t) => (t.status === "active" ? { ...t, status: "closing", closeRequestedAt: TODAY, closeReturnReason: undefined } : t));
/** กบค. ส่งกลับคำขอปิดงาน → ผู้รับจ้างแก้แล้วขอปิดใหม่ */
export const returnCloseTrip = (id: string, reason: string) => setTrip(id, (t) => (t.status === "closing" ? { ...t, status: "active", closeReturnReason: reason } : t));
/** กบค. อนุมัติปิดงานแผนเดินทาง · ทุกคันของแผนอยู่ในแผนเดินทางที่ปิดแล้ว = แผนเสร็จสิ้น (ระบบตั้งเอง) */
export const approveCloseTrip = (id: string) => setMock((x) => {
  const trips = x.trips.map((t) => (t.id === id && t.status === "closing" ? { ...t, status: "closed" as const, closedAt: TODAY } : t));
  const mr = trips.find((t) => t.id === id)?.mr;
  const plans = x.plans.map((p) => (p.mr === mr && p.cars.length > 0 && p.cars.every((c) => trips.some((t) => t.mr === p.mr && t.status === "closed" && t.cars.includes(c)))
    ? { ...p, status: "closed" as const, closedAt: TODAY } : p));
  return { ...x, trips, plans };
});

/* ---------- ค่าจ้าง (ตามสัญญาของแผนเดินทาง) ---------- */
/** ขอบเขตที่ใช้นับผลและค่าจ้าง: แผนเดินทาง หรือทั้งแผน (planScope) */
export interface Scope { mr: string; cars: string[]; costs: Record<string, number> }
/** ทั้งแผน: ค่าจ้างรวมจากทุกแผนเดินทาง */
export const planScope = (s: MockState, p: Plan): Scope => ({ mr: p.mr, cars: p.cars, costs: Object.assign({}, ...tripsOf(s, p.mr).map((t) => t.costs)) });
/** ค่าจ้างตามสัญญาของคัน (กบค. กำหนดตอนสร้างแผนเดินทาง) */
export const contractCost = (p: { costs: Record<string, number> }, car: string) => p.costs[car] ?? 0;
export const carCost = (p: Scope, c: CarDocs, car: string) => c.cost ?? contractCost(p, car);
export const costDiffers = (p: Scope, c: CarDocs, car: string) => c.cost != null && c.cost !== contractCost(p, car);
/** งบตามสัญญา = ผลรวมค่าจ้างรายคัน */
export const budget = (p: { costs: Record<string, number>; cars: string[] }) => p.cars.reduce((a, c) => a + contractCost(p, c), 0);

/** สรุปผลตรวจ */
export function resultSummary(s: MockState, p: Scope) {
  const out = { ผ่าน: 0, ไม่ผ่าน: 0, ระงับ: 0, ตรวจไม่ได้: 0 } as Record<string, number>;
  for (const c of p.cars) { const d = carDocs(s, p.mr, c); if (d.approvedAt && d.result) out[d.result] += 1; }
  return out;
}

/* ---------- เอกสาร ปจ.2 (ผู้รับจ้าง แนบ/ส่ง · กบค. อนุมัติ/ส่งกลับแก้ไข) ---------- */
export const carDocs = (s: MockState, mr: string, car: string): CarDocs => s.docs[mr]?.[car] ?? { files: [] };
const setCar = (mr: string, car: string, fn: (c: CarDocs) => CarDocs) =>
  setMock((x) => {
    const cur = x.docs[mr]?.[car] ?? { files: [] };
    return { ...x, docs: { ...x.docs, [mr]: { ...(x.docs[mr] ?? {}), [car]: fn(cur) } } };
  });
/** ผู้รับจ้างแก้ไฟล์ได้เมื่อยังไม่ส่ง หรือ กบค. ส่งกลับแก้ไข */
export const vendorCanEdit = (c: CarDocs) => !c.sentAt && !c.approvedAt;
const putCar = (mr: string, car: string, fn: (c: CarDocs) => CarDocs) => setCar(mr, car, (c) => (vendorCanEdit(c) ? fn(c) : c));
export const addFiles = (mr: string, car: string, files: DocFile[]) => putCar(mr, car, (c) => ({ ...c, files: [...c.files, ...files] }));
export const removeFile = (mr: string, car: string, i: number) => putCar(mr, car, (c) => ({ ...c, files: c.files.filter((_, j) => j !== i) }));
/** ผู้รับจ้างกรอกผลการตรวจ (วันที่ ค่าจ้าง ผล เหตุผล เอกสาร) */
export const updateResult = (mr: string, car: string, patch: Partial<Pick<CarDocs, "date" | "cost" | "costReason" | "result" | "reason" | "files">>) => putCar(mr, car, (c) => ({ ...c, ...patch }));
/** ข้อที่ยังขาดก่อนส่งได้ (ว่าง = ครบ) · p = แผนเดินทาง (ค่าจ้างตามสัญญา) */
export function missing(c: CarDocs, p?: Scope, car?: string): string[] {
  const m: string[] = [];
  if (!c.date) m.push("วันที่ตรวจ");
  const cost = p && car ? carCost(p, c, car) : c.cost;
  if (!cost || cost <= 0) m.push("ค่าจ้างตรวจ");
  if (p && car && costDiffers(p, c, car) && !c.costReason?.trim()) m.push("เหตุผลที่ค่าจ้างต่างจากสัญญา");
  if (!c.result) m.push("ผลการตรวจ");
  if (c.result === "ตรวจไม่ได้" && !c.reason?.trim()) m.push("เหตุผลที่ตรวจไม่ได้");
  if (!c.files.length) m.push(c.result === "ตรวจไม่ได้" ? "หนังสือรับรองจากผู้แทนหน่วยงาน" : "เอกสารการตรวจ ปจ.2");
  return m;
}
const touchedAny = (c: CarDocs) => !!(c.date || c.result || c.reason || c.files.length);
/** คันที่พร้อมส่ง: กรอกครบ และแก้ได้อยู่ (ยังไม่ส่ง / ถูกส่งกลับ) */
export const readyCars = (s: MockState, t: Trip) => tripOpen(t) ? t.cars.filter((c) => { const d = carDocs(s, t.mr, c); return vendorCanEdit(d) && !missing(d, t, c).length; }) : [];
/** ส่งอนุมัติ → รอ กบค. อนุมัติ (ล็อก) */
export function submitDocs(p: Scope, cars: string[]) {
  for (const c of cars) putCar(p.mr, c, (d) => (!missing(d, p, c).length ? { ...d, cost: carCost(p, d, c), returnReason: undefined, sentAt: TODAY } : d));
}
/** กบค. อนุมัติ */
export const approveDocs = (mr: string, car: string) => setCar(mr, car, (d) => (d.sentAt ? { ...d, approvedAt: TODAY } : d));
/** กบค. ส่งกลับแก้ไข (ต้องมีเหตุผล) → ผู้รับจ้างแก้แล้วส่งใหม่ได้ */
export const returnDocs = (mr: string, car: string, reason: string) => setCar(mr, car, (d) => (d.sentAt ? { ...d, sentAt: undefined, returnReason: reason } : d));

export type DocState = "none" | "draft" | "ready" | "sent" | "approved" | "returned";
export const docState = (c: CarDocs, p?: Scope, car?: string): DocState =>
  c.approvedAt ? "approved" : c.sentAt ? "sent" : c.returnReason ? "returned" : !touchedAny(c) ? "none" : missing(c, p, car).length ? "draft" : "ready";
export const DOC_TEXT: Record<DocState, [string, "Gray" | "Warning" | "Success" | "Info" | "Error" | "Brand"]> = {
  none: ["รอดำเนินการ", "Gray"],
  draft: ["กำลังดำเนินการ", "Info"],
  ready: ["กำลังดำเนินการ", "Info"],
  sent: ["รออนุมัติ", "Warning"],
  approved: ["เสร็จสิ้น", "Success"],
  returned: ["ส่งกลับแก้ไข", "Error"],
};
const countOf = (s: MockState, p: Scope, st: DocState) => p.cars.filter((c) => docState(carDocs(s, p.mr, c), p, c) === st).length;
/** จำนวนคันที่ กบค. อนุมัติเอกสารแล้ว */
export const approvedCount = (s: MockState, p: Scope) => countOf(s, p, "approved");
/** จำนวนคันที่รอ กบค. อนุมัติ */
export const pendingCount = (s: MockState, p: Scope) => countOf(s, p, "sent");
export const returnedCount = (s: MockState, p: Scope) => countOf(s, p, "returned");
/** ทุกคันในแผนเดินทาง กบค. อนุมัติผลแล้ว → ผู้รับจ้างส่งอนุมัติปิดงานได้ */
export const allApproved = (s: MockState, p: Scope) => p.cars.length > 0 && approvedCount(s, p) === p.cars.length;
/** ค่าจ้างตรวจรวมของคันที่ส่งแล้ว/อนุมัติแล้ว */
export const costTotal = (s: MockState, p: Scope) => p.cars.reduce((a, c) => { const d = carDocs(s, p.mr, c); return a + (d.sentAt || d.approvedAt ? carCost(p, d, c) : 0); }, 0);
/** คันที่รอ กบค. อนุมัติ */
export const pendingCars = (s: MockState, p: Scope) => p.cars.filter((c) => docState(carDocs(s, p.mr, c), p, c) === "sent");
export const carsOf = (p: { cars: string[] }) => p.cars.map((c) => VEHICLE_BY_ID[c]).filter(Boolean);
