"use client";
/* สรุปผลการตรวจของแผนเดินทาง (DisplayBox ของไลบรารี) — ใช้ตอนขอปิดงาน/ปิดงานแล้ว ทั้งฝั่ง กบค. และผู้รับจ้าง */
import { DisplayBox } from "@/components/patterns/DisplayBox";
import { bahtText, type Trip } from "@/lib/mock/data";
import { approvedCount, budget, costTotal, resultSummary } from "@/lib/mock/plan";
import { useMock } from "@/lib/mock/store";

export function CloseSummary({ trip }: { trip: Trip }) {
  const mock = useMock();
  const r = resultSummary(mock, trip);
  return (
    <DisplayBox Title="สรุปผลการตรวจ" pairs={[
      ["ผลอนุมัติแล้ว", approvedCount(mock, trip) + "/" + trip.cars.length + " คัน"],
      ["ผ่าน", r["ผ่าน"] + " คัน"],
      ["ไม่ผ่าน", r["ไม่ผ่าน"] + " คัน"],
      ["ระงับ", r["ระงับ"] + " คัน"],
      ["ตรวจไม่ได้", r["ตรวจไม่ได้"] + " คัน"],
      ["ค่าจ้างตรวจรวม", bahtText(costTotal(mock, trip))],
      ["งบรวมตามสัญญา", bahtText(budget(trip))],
    ]} />
  );
}
