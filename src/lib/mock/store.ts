"use client";
/* ที่เก็บข้อมูลจำลอง — localStorage คีย์ si-next-v1 · บทบาทเก็บแยกคีย์ si-next-v1:role
   อ่านด้วย useMock() · เขียนด้วย setMock() · ล้างด้วย resetMock() */
import { useSyncExternalStore } from "react";
import { DOCS, HEADS, PLANS, VENDORS, type DocsState, type Plan } from "./data";

export const KEY = "si-next-v1";
export const ROLE_KEY = "si-next-v1:role";
/** รุ่นข้อมูลจำลอง — รุ่นไม่ตรง = เริ่มจากค่าตั้งต้นใหม่ */
export const MOCK_V = 8;   // 8 = หัวหน้า กบค. อนุมัติแผน/ปิดงาน (สถานะ closing) ·   // 7 = ค่าจ้างตามสัญญารายคัน (costs) แทนค่าเดียวทั้งแผน ·   // 6 = ค่าจ้างต่อคันตามสัญญา (unitCost) + เหตุผลค่าจ้างต่างจากสัญญา ·   // 3 = กบค. อนุมัติ/ส่งกลับ · 4 = เอาประเภทงานออก · 5 = ผลตรวจรายคัน (วันที่ ค่าจ้าง ผล เหตุผล) + เบอร์/เลขที่สัญญาผู้รับจ้าง

export interface MockState {
  v: typeof MOCK_V;
  plans: Plan[];
  docs: DocsState;
  /** เลขที่ MR ล่าสุดที่ออกไปแล้ว (ไม่นำเลขของแผนที่ลบกลับมาใช้) */
  lastMr: number;
}

const initial = (): MockState => ({
  v: MOCK_V,
  plans: PLANS.map((p) => ({ ...p, cars: [...p.cars] })),
  docs: JSON.parse(JSON.stringify(DOCS)) as DocsState,
  lastMr: 7000012,
});

let state: MockState | null = null;
const subs = new Set<() => void>();

function load(): MockState {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(KEY);
    const j = raw ? (JSON.parse(raw) as MockState) : null;
    state = j && j.v === MOCK_V && Array.isArray(j.plans) ? j : initial();
  } catch {
    state = initial();
  }
  return state;
}
function save() {
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* โหมดส่วนตัว — ใช้ในหน่วยความจำ */ }
  subs.forEach((f) => f());
}

const SERVER = initial();
export function useMock(): MockState {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, load, () => SERVER);
}
export function getMock(): MockState { return load(); }
export function setMock(fn: (s: MockState) => MockState) { state = fn(load()); save(); }
export function resetMock() { state = initial(); save(); }

/* ---------- บทบาท (แถบต้นแบบ) ---------- */
export const KBK = "กบค.";
export const vendorRole = (id: string) => "ผู้รับจ้าง (" + (VENDORS.find((v) => v.id === id)?.name ?? id) + ")";
export const headRole = (id: string) => "หัวหน้า กบค. (" + (HEADS.find((h) => h.id === id)?.name ?? id) + ")";
export const ROLES: string[] = [KBK, ...HEADS.map((h) => headRole(h.id)), ...VENDORS.map((v) => vendorRole(v.id))];
/** รหัสหัวหน้า กบค. ของบทบาท (ไม่ใช่ = null) */
export const headOf = (r: string): string | null => HEADS.find((h) => headRole(h.id) === r)?.id ?? null;
export type Role = string;
/** รหัสผู้รับจ้างของบทบาท (ไม่ใช่ผู้รับจ้าง = null) */
export const vendorOf = (r: Role): string | null => VENDORS.find((v) => vendorRole(v.id) === r)?.id ?? null;

let role: Role | null = null;
const roleSubs = new Set<() => void>();
function loadRole(): Role {
  if (role) return role;
  try {
    const r = window.localStorage.getItem(ROLE_KEY);
    role = r && ROLES.includes(r) ? r : KBK;
  } catch { role = KBK; }
  return role;
}
export function useRole(): Role {
  return useSyncExternalStore((cb) => { roleSubs.add(cb); return () => roleSubs.delete(cb); }, loadRole, () => KBK);
}
export function setRole(r: Role) {
  role = r;
  try { window.localStorage.setItem(ROLE_KEY, r); } catch { /* ข้าม */ }
  roleSubs.forEach((f) => f());
}

/* ---------- toast ที่ข้ามหน้าได้ ---------- */
export interface Toast { id: number; Text: string; Type: "Success" | "Error" }
let toast: Toast | null = null;
const toastSubs = new Set<() => void>();
export function useToast(): Toast | null {
  return useSyncExternalStore((cb) => { toastSubs.add(cb); return () => toastSubs.delete(cb); }, () => toast, () => null);
}
export function notify(Text: string, Type: "Success" | "Error" = "Success") {
  toast = { id: Date.now(), Text, Type };
  toastSubs.forEach((f) => f());
}
export function clearToast() { toast = null; toastSubs.forEach((f) => f()); }

/* ---------- โหลดเสร็จแล้ว (กันหน้าแว้บค่าตั้งต้นก่อนอ่าน localStorage) ---------- */
export function useHydrated() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}
/** อ่านค่าจาก ?key= หลังโหลด (static export ไม่ใช้ useSearchParams) */
export function useQuery(key: string): string | null {
  return useSyncExternalStore(() => () => {}, () => new URLSearchParams(window.location.search).get(key), () => null);
}
