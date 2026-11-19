"use client";
/* ปุ่มช่วยของต้นแบบ "กรอกข้อมูลตัวอย่าง" · "ล้างค่า" (เจ้าของงาน 10 พ.ย. 2569) — ไม่ใช่ปุ่มของระบบจริง ไม่มีใน Figma · แสดงที่แถบต้นแบบ (PrototypeBar) เท่านั้น
   หน้าที่มีฟอร์มเรียก useProtoForm({ fill, clear, dirty }) — แถบต้นแบบแสดง 2 ปุ่มเฉพาะตอนมีฟอร์มลงทะเบียนอยู่ · หน้าที่ไม่มีฟอร์ม = ซ่อน
   fill = กรอกทุกช่องของหน้า/ขั้นปัจจุบันด้วยค่าที่ผ่านเงื่อนไขของหน้า (ปุ่มหลักกดได้) · clear = กลับค่าเริ่มต้นของฟอร์มนี้เท่านั้น · dirty = มีค่าที่กรอกไว้ (ล้างแล้วหาย ⇒ ยืนยันก่อน) */
import { useEffect, useRef, useSyncExternalStore } from "react";

export interface ProtoForm { fill: () => void; clear: () => void; dirty?: boolean }
type Entry = { ref: { current: ProtoForm | null } };
/** ซ้อนกันได้: popup เปิดทับหน้า = ใช้ฟอร์มของ popup · ปิด popup = กลับไปใช้ฟอร์มของหน้า */
const stack: Entry[] = [];
let current: Entry | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function useProtoFormTools() {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => current, () => null);
}
/** ลงทะเบียนฟอร์มของหน้า · null = ไม่มีฟอร์มตอนนี้ (เช่น popup ปิดอยู่ · ดูอย่างเดียว) */
export function useProtoForm(form: ProtoForm | null) {
  const ref = useRef<ProtoForm | null>(form);
  ref.current = form;
  const on = !!form;
  useEffect(() => {
    if (!on) return;
    const me: Entry = { ref };
    stack.push(me); current = me; emit();
    return () => { const i = stack.indexOf(me); if (i >= 0) stack.splice(i, 1); current = stack[stack.length - 1] ?? null; emit(); };
  }, [on]);
}
