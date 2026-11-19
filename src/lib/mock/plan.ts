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

export function createPlan(d: Draft): string {
  const s = getMock();
  const mr = "MRZ" + (s.lastMr + 1);
  setMock((x) => ({ ...x, lastMr: x.lastMr + 1, plans: [{ mr, ...d, cars: [...d.cars], status: "review" }, ...x.plans] }));
  return mr;
}
/** บันทึกแผนที่แก้ไข — แผนที่ส่งกลับแก้ไขกลับไปรออนุมัติ */
export function updatePlan(mr: string, d: Draft) {
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

/* ---------- เอกสาร ปจ.2 (ผู้รับจ้าง) ---------- */
export const carDocs = (s: MockState, mr: string, car: string): CarDocs => s.docs[mr]?.[car] ?? { files: [] };
const putCar = (mr: string, car: string, fn: (c: CarDocs) => CarDocs) =>
  setMock((x) => {
    const cur = x.docs[mr]?.[car] ?? { files: [] };
    if (cur.sentAt) return x;   // ส่งแล้ว = ล็อก
    return { ...x, docs: { ...x.docs, [mr]: { ...(x.docs[mr] ?? {}), [car]: fn(cur) } } };
  });
export const addFiles = (mr: string, car: string, files: DocFile[]) => putCar(mr, car, (c) => ({ ...c, files: [...c.files, ...files] }));
export const removeFile = (mr: string, car: string, i: number) => putCar(mr, car, (c) => ({ ...c, files: c.files.filter((_, j) => j !== i) }));
/** ส่งอนุมัติ: ทุกคันที่แนบเอกสารแล้วและยังไม่ส่ง → ล็อก */
export function submitDocs(mr: string, cars: string[]) {
  setMock((x) => {
    const plan = { ...(x.docs[mr] ?? {}) };
    for (const c of cars) if (plan[c]?.files.length && !plan[c].sentAt) plan[c] = { ...plan[c], sentAt: TODAY };
    return { ...x, docs: { ...x.docs, [mr]: plan } };
  });
}

export type DocState = "none" | "draft" | "sent";
export const docState = (c: CarDocs): DocState => (c.sentAt ? "sent" : c.files.length ? "draft" : "none");
export const DOC_TEXT: Record<DocState, [string, "Gray" | "Warning" | "Success"]> = {
  none: ["ยังไม่แนบเอกสาร", "Gray"],
  draft: ["แนบแล้ว ยังไม่ส่ง", "Warning"],
  sent: ["ส่งอนุมัติแล้ว", "Success"],
};
/** สรุปเอกสารของแผน: ส่งแล้ว x/ทั้งหมด */
export const sentCount = (s: MockState, p: Plan) => p.cars.filter((c) => carDocs(s, p.mr, c).sentAt).length;
export const carsOf = (p: Plan) => p.cars.map((c) => VEHICLE_BY_ID[c]).filter(Boolean);
