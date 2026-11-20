"use client";
/* สรุปปิดงานแผน (DisplayBox ของไลบรารี) — ใช้หน้าสรุปปิดงานของ กบค. และหน้าอนุมัติปิดงานของหัวหน้า กบค. */
import { DisplayBox } from "@/components/patterns/DisplayBox";
import { bahtText, type Plan } from "@/lib/mock/data";
import { approvedCount, budget, costTotal, resultSummary } from "@/lib/mock/plan";
import { useMock } from "@/lib/mock/store";

export function CloseSummary({ plan }: { plan: Plan }) {
  const mock = useMock();
  const r = resultSummary(mock, plan);
  return (
    <DisplayBox Title="สรุปผลการตรวจ" pairs={[
      ["ผลอนุมัติแล้ว", approvedCount(mock, plan) + "/" + plan.cars.length + " คัน"],
      ["ผ่าน", r["ผ่าน"] + " คัน"],
      ["ไม่ผ่าน", r["ไม่ผ่าน"] + " คัน"],
      ["ระงับ", r["ระงับ"] + " คัน"],
      ["ตรวจไม่ได้", r["ตรวจไม่ได้"] + " คัน"],
      ["ค่าจ้างตรวจรวม", bahtText(costTotal(mock, plan))],
      ["งบรวมตามสัญญา", bahtText(budget(plan))],
    ]} />
  );
}
