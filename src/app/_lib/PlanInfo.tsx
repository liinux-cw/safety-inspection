"use client";
/* กล่องข้อมูลแผน + ข้อมูลผู้รับจ้าง (DisplayBox แยก 2 กล่อง) — ใช้หน้ารายละเอียดของ กบค. และหน้าแผนของผู้รับจ้าง
   แยกผู้รับจ้างเป็นกล่องของตัวเอง: อ่านง่าย และย้ายไปอยู่ที่แผนเดินทางได้ทั้งก้อนถ้าตกลงกันภายหลัง */
import { DisplayBox } from "@/components/patterns/DisplayBox";
import { PillOutline } from "@/components/vms/PillOutline";
import { STATUS_TEXT, VENDOR_BY_ID, bahtText, rangeText, type Plan } from "@/lib/mock/data";
import { budget, costTotal } from "@/lib/mock/plan";
import { useMock } from "@/lib/mock/store";

export function PlanInfo({ plan }: { plan: Plan }) {
  const ven = VENDOR_BY_ID[plan.vendor];
  const mock = useMock();
  return (
    <div className="flex flex-col gap-6">
      <DisplayBox Title="ข้อมูลแผน" pairs={[
        ["เลขที่ MR", plan.mr],
        ["ชื่อแผน", plan.name],
        ["ปีงบประมาณ", plan.fy],
        ["รอบตรวจ", rangeText(plan.from, plan.to)],
        ["จำนวนยานพาหนะ", plan.cars.length + " คัน"],
        ["สถานะแผน", <PillOutline key="s" Text={STATUS_TEXT[plan.status][0]} Color={STATUS_TEXT[plan.status][1]} />],
      ]} />
      <DisplayBox Title="ข้อมูลผู้รับจ้าง" pairs={[
        ["ผู้รับจ้าง", ven ? ven.name : "-"],
        ["เบอร์โทรผู้รับจ้าง", plan.vendorTel || "-"],
        ["เลขที่สัญญา/ใบสั่งจ้าง", plan.contract || "-"],
        ["งบรวมตามสัญญา", bahtText(budget(plan))],
        ["ค่าจ้างตรวจรวม (ที่ส่งแล้ว)", bahtText(costTotal(mock, plan))],
      ]} />
    </div>
  );
}
