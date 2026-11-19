"use client";
/* ตัวช่วยของแผนตรวจ ปจ.2 — สร้าง/แก้ไข/ลบ · กฎห้ามซ้อนแผน · เอกสารของผู้รับจ้าง */
import { TODAY, VEHICLE_BY_ID, type CarDocs, type DocFile, type Plan } from "./data";
import { getMock, setMock, type MockState } from "./store";

export interface Draft { name: string; fy: string; from: string; to: string; vendor: string; cars: string[] }
export const EMPTY_DRAFT: Draft = { name: "", fy: "", from: "", to: "", vendor: "", cars: [] };
export const draftOf = (p: Plan): Draft => ({ name: p.name, fy: p.fy, from: p.from, to: p.to, vendor: p.vendor, cars: [...p.cars] });

/** แก้ไข/ลบได้เฉพาะแผนที่ยังไม่อนุมัติ (รออนุมัติ · ส่งกลับแก้ไข) */
export const editable = (p: Plan) => p.status === "review" || p.status === "returned";

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
/** คันที่พร้อมส่ง: มีไฟล์อย่างน้อย 1 และแก้ได้อยู่ (ยังไม่ส่ง / ถูกส่งกลับ) */
export const readyCars = (s: MockState, p: Plan) => p.cars.filter((c) => { const d = carDocs(s, p.mr, c); return d.files.length > 0 && vendorCanEdit(d); });
/** ส่งอนุมัติ → รอ กบค. อนุมัติ (ล็อก) */
export function submitDocs(mr: string, cars: string[]) {
  for (const c of cars) putCar(mr, c, (d) => (d.files.length ? { files: d.files, sentAt: TODAY } : d));
}
/** กบค. อนุมัติ */
export const approveDocs = (mr: string, car: string) => setCar(mr, car, (d) => (d.sentAt ? { files: d.files, sentAt: d.sentAt, approvedAt: TODAY } : d));
/** กบค. ส่งกลับแก้ไข (ต้องมีเหตุผล) → ผู้รับจ้างแก้ไฟล์แล้วส่งใหม่ได้ */
export const returnDocs = (mr: string, car: string, reason: string) => setCar(mr, car, (d) => (d.sentAt ? { files: d.files, returnReason: reason } : d));

export type DocState = "none" | "draft" | "sent" | "approved" | "returned";
export const docState = (c: CarDocs): DocState =>
  c.approvedAt ? "approved" : c.sentAt ? "sent" : c.returnReason ? "returned" : c.files.length ? "draft" : "none";
export const DOC_TEXT: Record<DocState, [string, "Gray" | "Warning" | "Success" | "Info" | "Error"]> = {
  none: ["ยังไม่แนบเอกสาร", "Gray"],
  draft: ["แนบแล้ว ยังไม่ส่ง", "Warning"],
  sent: ["รอ กบค. อนุมัติ", "Info"],
  approved: ["อนุมัติแล้ว", "Success"],
  returned: ["ส่งกลับแก้ไข", "Error"],
};
const countOf = (s: MockState, p: Plan, st: DocState) => p.cars.filter((c) => docState(carDocs(s, p.mr, c)) === st).length;
/** จำนวนคันที่ กบค. อนุมัติเอกสารแล้ว */
export const approvedCount = (s: MockState, p: Plan) => countOf(s, p, "approved");
/** จำนวนคันที่รอ กบค. อนุมัติ */
export const pendingCount = (s: MockState, p: Plan) => countOf(s, p, "sent");
export const returnedCount = (s: MockState, p: Plan) => countOf(s, p, "returned");
export const carsOf = (p: Plan) => p.cars.map((c) => VEHICLE_BY_ID[c]).filter(Boolean);
