"use client";
/* กล่องข้อมูลแผน (DisplayBox) — ใช้หน้ารายละเอียดของ กบค. และหน้าแผนของผู้รับจ้าง */
import { DisplayBox } from "@/components/patterns/DisplayBox";
import { PillOutline } from "@/components/vms/PillOutline";
import { STATUS_TEXT, VENDOR_BY_ID, rangeText, type Plan } from "@/lib/mock/data";

export function PlanInfo({ plan }: { plan: Plan }) {
  const ven = VENDOR_BY_ID[plan.vendor];
  return (
    <DisplayBox Title="ข้อมูลแผน" pairs={[
      ["เลขที่ MR", plan.mr],
      ["ชื่อแผน", plan.name],
      ["ปีงบประมาณ", plan.fy],
      ["รอบตรวจ", rangeText(plan.from, plan.to)],
      ["ผู้รับจ้าง", ven ? ven.name : "-"],
      ["เบอร์ติดต่อผู้รับจ้าง", ven ? ven.tel : "-"],
      ["จำนวนยานพาหนะ", plan.cars.length + " คัน"],
      ["สถานะแผน", <PillOutline key="s" Text={STATUS_TEXT[plan.status][0]} Color={STATUS_TEXT[plan.status][1]} />],
    ]} />
  );
}
