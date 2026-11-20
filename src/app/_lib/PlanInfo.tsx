"use client";
/* กล่องข้อมูลแผน (DisplayBox) — ใช้หน้ารายละเอียดของ กบค. และหน้าอนุมัติของหัวหน้า กบค.
   ผู้รับจ้างย้ายไปอยู่ที่แผนเดินทาง (เจ้าของงาน 20 พ.ย. 2569) */
import { DisplayBox } from "@/components/patterns/DisplayBox";
import { PillOutline } from "@/components/vms/PillOutline";
import { STATUS_TEXT, rangeText, type Plan } from "@/lib/mock/data";
import { freeCars, tripsOf } from "@/lib/mock/plan";
import { useMock } from "@/lib/mock/store";

export function PlanInfo({ plan }: { plan: Plan }) {
  const mock = useMock();
  const trips = tripsOf(mock, plan.mr).length, free = freeCars(mock, plan).length;
  return (
    <DisplayBox Title="ข้อมูลแผน" pairs={[
      ["เลขที่ MR", plan.mr],
      ["ชื่อแผน", plan.name],
      ["รอบตรวจ", rangeText(plan.from, plan.to)],
      ["จำนวนยานพาหนะ", plan.cars.length + " คัน"],
      ["สถานะแผน", <PillOutline key="s" Text={STATUS_TEXT[plan.status][0]} Color={STATUS_TEXT[plan.status][1]} />],
      ["แผนเดินทาง", trips + " แผน" + (free ? " · ยังไม่อยู่ในแผนเดินทาง " + free + " คัน" : "")],
    ]} />
  );
}
