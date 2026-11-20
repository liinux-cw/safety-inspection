"use client";
/* แถบสถานะของแผน (Alert ของไลบรารี) — หน้ารายละเอียดแผนของ กบค. */
import { Alert } from "@/components/vms/Alert";
import { dateText, type Plan } from "@/lib/mock/data";

export function PlanStatusAlert({ plan }: { plan: Plan }) {
  if (plan.status === "review") return <Alert Color="Warning" Text="รอหัวหน้า กบค. อนุมัติแผน" SupportingText={"ส่งเมื่อ " + (plan.submittedAt ? dateText(plan.submittedAt) : "-") + " · สร้างแผนเดินทางได้หลังอนุมัติ"} />;
  if (plan.status === "returned") return <Alert Color="Error" Text="หัวหน้า กบค. ส่งกลับให้แก้ไข" SupportingText={(plan.returnReason ?? "") + " · กดแก้ไขแล้วส่งอนุมัติอีกครั้ง"} />;
  if (plan.status === "closed") return <Alert Color="Success" Text={"แผนเสร็จสิ้นเมื่อ " + (plan.closedAt ? dateText(plan.closedAt) : "-")} SupportingText="ยานพาหนะทุกคันอยู่ในแผนเดินทางที่ปิดงานแล้ว" />;
  return null;
}
