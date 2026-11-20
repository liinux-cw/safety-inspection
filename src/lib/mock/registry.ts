"use client";
/* ทะเบียน ปจ.2 — ประวัติการตรวจรายคัน + วันครบกำหนดปัจจุบัน
   อัปเดตเองเมื่อ กบค. อนุมัติปิดงานแผนเดินทาง (ผลที่ กบค. อนุมัติแล้วของทุกคันในแผนเดินทาง · ไม่มีปิดแผนหลัก 20 พ.ย. 2569) · กบค. อัปโหลดผลนอกแผนได้เฉพาะคันที่ไม่อยู่ในแผนที่ยังไม่ปิด
   วันครบกำหนดถัดไป: ผ่าน = วันที่ตรวจ + วาระ · ไม่ผ่าน / ระงับ / ตรวจไม่ได้ = คงวันครบกำหนดเดิม (ต้องตรวจใหม่) */
import { VEHICLES, VEHICLE_BY_ID, addMonths, type InspectResult, type Plan, type RegEntry, type RegistryState, type Vehicle } from "./data";
import { setMock, type MockState } from "./store";

export type { RegEntry, RegistryState } from "./data";

export const historyOf = (s: MockState, id: string) => s.registry[id] ?? [];
export const latestOf = (s: MockState, id: string): RegEntry | undefined => historyOf(s, id).slice(-1)[0];
/** วันครบกำหนดปัจจุบัน: จากผลล่าสุดในทะเบียน หรือค่าตั้งต้นของยานพาหนะ */
export const dueOf = (s: MockState, id: string) => latestOf(s, id)?.nextDue ?? VEHICLE_BY_ID[id].due;
/** ยานพาหนะพร้อมวันครบกำหนดปัจจุบันจากทะเบียน (ใช้ในหน้าที่แสดงครบกำหนด) */
export const withDue = (s: MockState, v: Vehicle): Vehicle => ({ ...v, due: dueOf(s, v.id) });
export const vehiclesNow = (s: MockState) => VEHICLES.map((v) => withDue(s, v));
export const nextDue = (v: Vehicle, result: InspectResult, date: string, prevDue: string) => (result === "ผ่าน" ? addMonths(date, v.cycle) : prevDue);
/** แผนที่ยังไม่ปิดที่ยานพาหนะคันนี้อยู่ (null = ไม่อยู่ในแผนใด → อัปโหลดผลนอกแผนได้) */
export const openPlanOf = (s: MockState, id: string): string | null => s.plans.find((p) => p.status !== "closed" && p.cars.includes(id))?.mr ?? null;

/** บันทึกผลของแผนเดินทางที่ปิดงานลงทะเบียน (เฉพาะคันที่ กบค. อนุมัติผลแล้ว) — เรียกตอน กบค. อนุมัติปิดงานแผนเดินทาง */
export function entriesFromPlan(s: MockState, p: Pick<Plan, "mr" | "cars">): RegistryState {
  const reg: RegistryState = { ...s.registry };
  for (const id of p.cars) {
    const d = s.docs[p.mr]?.[id];
    if (!d?.approvedAt || !d.result || !d.date) continue;
    const v = VEHICLE_BY_ID[id];
    reg[id] = [...(reg[id] ?? []), { date: d.date, result: d.result, nextDue: nextDue(v, d.result, d.date, dueOf(s, id)), source: p.mr, files: d.files, reason: d.reason }];
  }
  return reg;
}
/** กบค. อัปโหลดผลตรวจนอกแผน */
export function addOutside(id: string, e: Omit<RegEntry, "nextDue" | "source">) {
  setMock((x) => {
    const v = VEHICLE_BY_ID[id];
    const entry: RegEntry = { ...e, source: "นอกแผน", nextDue: nextDue(v, e.result, e.date, dueOf(x, id)) };
    return { ...x, registry: { ...x.registry, [id]: [...(x.registry[id] ?? []), entry] } };
  });
}
