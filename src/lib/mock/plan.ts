"use client";
/* ตัวช่วยของแผนตรวจ ปจ.2 — สร้าง/แก้ไข/ลบ · กฎห้ามซ้อนแผน · เอกสารของผู้รับจ้าง */
import { TODAY, VEHICLE_BY_ID, type CarDocs, type DocFile, type Plan } from "./data";
import { getMock, setMock, type MockState } from "./store";

export interface Draft { name: string; fy: string; from: string; to: string; vendor: string; vendorTel: string; contract: string; costs: Record<string, number>; cars: string[] }
export const EMPTY_DRAFT: Draft = { name: "", fy: "", from: "", to: "", vendor: "", vendorTel: "", contract: "", costs: {}, cars: [] };
export const draftOf = (p: Plan): Draft => ({ name: p.name, fy: p.fy, from: p.from, to: p.to, vendor: p.vendor, vendorTel: p.vendorTel, contract: p.contract, costs: { ...p.costs }, cars: [...p.cars] });

/** แก้ไข/ลบได้เฉพาะแผนที่ยังไม่อนุมัติ (รออนุมัติ · ส่งกลับแก้ไข) */
export const editable = (p: Plan) => p.status === "review" || p.status === "returned";
/** ผู้รับจ้างบันทึก/ส่งผลได้เมื่อแผนอนุมัติแล้วและยังไม่ปิด (ก่อนหน้านั้นดูได้อย่างเดียว) */
export const vendorCanWork = (p: Plan) => p.status === "approved";
/** คันที่ผู้รับจ้างเริ่มกรอกผลแล้ว — เอาออกจากแผนไม่ได้ */
export const hasWork = (s: MockState, mr: string, car: string) => { const d = s.docs[mr]?.[car]; return !!d && !!(d.date || d.result || d.files.length || d.sentAt || d.approvedAt); };
/** ค่าจ้างของคัน (ไม่ระบุ = ตามสัญญา) */
/** ค่าจ้างตามสัญญาของคัน (กบค. กำหนด) */
export const contractCost = (p: { costs: Record<string, number> }, car: string) => p.costs[car] ?? 0;
export const carCost = (p: Plan, c: CarDocs, car: string) => c.cost ?? contractCost(p, car);
export const costDiffers = (p: Plan, c: CarDocs, car: string) => c.cost != null && c.cost !== contractCost(p, car);
/** ปีงบประมาณของรอบตรวจ: ต.ค.–ก.ย. · เดือนสิ้นสุดต้องอยู่ปีงบเดียวกับเดือนเริ่มต้น */
export const fyRange = (fyBE: string) => { const y = Number(fyBE) - 543; return { from: (y - 1) + "-10", to: y + "-09" }; };

/** ยานพาหนะที่อยู่ในแผน ปจ.2 อื่นที่ยังไม่ปิด → เลขที่ MR ของแผนนั้น (เลือกเข้าแผนนี้ไม่ได้) */
export function takenMap(s: MockState, exceptMr?: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of s.plans) {
    if (p.mr === exceptMr || p.status === "closed") continue;
    for (const c of p.cars) out[c] = p.mr;
  }
  return out;
}

type Done = Draft;
export function createPlan(d: Done): string {
  const s = getMock();
  const mr = "MRZ" + (s.lastMr + 1);
  setMock((x) => ({ ...x, lastMr: x.lastMr + 1, plans: [{ mr, ...d, cars: [...d.cars], status: "review" }, ...x.plans] }));
  return mr;
}
/** บันทึกแผนที่แก้ไข — แผนที่ส่งกลับแก้ไขกลับไปรออนุมัติ */
export function updatePlan(mr: string, d: Done) {
  setMock((x) => ({ ...x, plans: x.plans.map((p) => (p.mr === mr ? { ...p, ...d, cars: [...d.cars], status: "review" } : p)) }));
}
export function deletePlan(mr: string) {
  setMock((x) => {
    const docs = { ...x.docs };
    delete docs[mr];
    return { ...x, plans: x.plans.filter((p) => p.mr !== mr), docs };
  });
}
/** ต้นแบบเท่านั้น: จำลองผู้อนุมัติอนุมัติแผนที่รออนุมัติ (ขั้นอนุมัติเป็นงานอีกส่วน) */
export function approveAll() {
  setMock((x) => ({ ...x, plans: x.plans.map((p) => (p.status === "review" ? { ...p, status: "approved" } : p)) }));
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
/** ข้อที่ยังขาดก่อนส่งได้ (ว่าง = ครบ) · p = แผน (ค่าจ้างตามสัญญา) */
export function missing(c: CarDocs, p?: Plan, car?: string): string[] {
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
export const readyCars = (s: MockState, p: Plan) => vendorCanWork(p) ? p.cars.filter((c) => { const d = carDocs(s, p.mr, c); return vendorCanEdit(d) && !missing(d, p, c).length; }) : [];
/** ส่งอนุมัติ → รอ กบค. อนุมัติ (ล็อก) */
export function submitDocs(p: Plan, cars: string[]) {
  for (const c of cars) putCar(p.mr, c, (d) => (!missing(d, p, c).length ? { ...d, cost: carCost(p, d, c), returnReason: undefined, sentAt: TODAY } : d));
}
/** กบค. อนุมัติ */
export const approveDocs = (mr: string, car: string) => setCar(mr, car, (d) => (d.sentAt ? { ...d, approvedAt: TODAY } : d));
/** กบค. ส่งกลับแก้ไข (ต้องมีเหตุผล) → ผู้รับจ้างแก้แล้วส่งใหม่ได้ */
export const returnDocs = (mr: string, car: string, reason: string) => setCar(mr, car, (d) => (d.sentAt ? { ...d, sentAt: undefined, returnReason: reason } : d));

export type DocState = "none" | "draft" | "ready" | "sent" | "approved" | "returned";
export const docState = (c: CarDocs, p?: Plan, car?: string): DocState =>
  c.approvedAt ? "approved" : c.sentAt ? "sent" : c.returnReason ? "returned" : !touchedAny(c) ? "none" : missing(c, p, car).length ? "draft" : "ready";
export const DOC_TEXT: Record<DocState, [string, "Gray" | "Warning" | "Success" | "Info" | "Error" | "Brand"]> = {
  none: ["ยังไม่บันทึกผล", "Gray"],
  draft: ["กรอกยังไม่ครบ", "Warning"],
  ready: ["พร้อมส่ง", "Brand"],
  sent: ["รอ กบค. อนุมัติ", "Info"],
  approved: ["อนุมัติแล้ว", "Success"],
  returned: ["ส่งกลับแก้ไข", "Error"],
};
const countOf = (s: MockState, p: Plan, st: DocState) => p.cars.filter((c) => docState(carDocs(s, p.mr, c), p, c) === st).length;
/** จำนวนคันที่ กบค. อนุมัติเอกสารแล้ว */
export const approvedCount = (s: MockState, p: Plan) => countOf(s, p, "approved");
/** จำนวนคันที่รอ กบค. อนุมัติ */
export const pendingCount = (s: MockState, p: Plan) => countOf(s, p, "sent");
export const returnedCount = (s: MockState, p: Plan) => countOf(s, p, "returned");
/** ค่าจ้างตรวจรวมของคันที่ส่งแล้ว/อนุมัติแล้ว */
export const costTotal = (s: MockState, p: Plan) => p.cars.reduce((a, c) => { const d = carDocs(s, p.mr, c); return a + (d.sentAt || d.approvedAt ? carCost(p, d, c) : 0); }, 0);
/** งบตามสัญญา = ผลรวมค่าจ้างรายคัน */
export const budget = (p: { costs: Record<string, number>; cars: string[] }) => p.cars.reduce((a, c) => a + contractCost(p, c), 0);
/** คันที่รอ กบค. อนุมัติ */
export const pendingCars = (s: MockState, p: Plan) => p.cars.filter((c) => docState(carDocs(s, p.mr, c), p, c) === "sent");
export const carsOf = (p: Plan) => p.cars.map((c) => VEHICLE_BY_ID[c]).filter(Boolean);
