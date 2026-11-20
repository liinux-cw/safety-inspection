"use client";
/* กล่องข้อมูลแผน (DisplayBox) — ใช้หน้ารายละเอียดของ กบค. และหน้าแผนของผู้รับจ้าง */
import { DisplayBox } from "@/components/patterns/DisplayBox";
import { PillOutline } from "@/components/vms/PillOutline";
import { STATUS_TEXT, VENDOR_BY_ID, bahtText, rangeText, type Plan } from "@/lib/mock/data";
import { budget, costTotal } from "@/lib/mock/plan";
import { useMock } from "@/lib/mock/store";

export function PlanInfo({ plan }: { plan: Plan }) {
  const ven = VENDOR_BY_ID[plan.vendor];
  const mock = useMock();
  return (
    <DisplayBox Title="ข้อมูลแผน" pairs={[
      ["เลขที่ MR", plan.mr],
      ["ชื่อแผน", plan.name],
      ["ปีงบประมาณ", plan.fy],
      ["รอบตรวจ", rangeText(plan.from, plan.to)],
      ["ผู้รับจ้าง", ven ? ven.name : "-"],
      ["เบอร์โทรผู้รับจ้าง", plan.vendorTel || "-"],
      ["เลขที่สัญญา/ใบสั่งจ้าง", plan.contract || "-"],
      ["จำนวนยานพาหนะ", plan.cars.length + " คัน"],
      ["ค่าจ้างตรวจต่อคัน (สัญญา)", bahtText(plan.unitCost)],
      ["งบรวมตามสัญญา", bahtText(budget(plan))],
      ["ค่าจ้างตรวจรวม (ที่ส่งแล้ว)", bahtText(costTotal(mock, plan))],
      ["สถานะแผน", <PillOutline key="s" Text={STATUS_TEXT[plan.status][0]} Color={STATUS_TEXT[plan.status][1]} />],
    ]} />
  );
}
