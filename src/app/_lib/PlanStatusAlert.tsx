"use client";
/* แถบสถานะของแผน (Alert ของไลบรารี) — ใช้หน้ารายละเอียดของ กบค. และหน้าสรุปปิดงาน */
import { Alert } from "@/components/vms/Alert";
import { HEAD_BY_ID, dateText, type Plan } from "@/lib/mock/data";

export function PlanStatusAlert({ plan }: { plan: Plan }) {
  const head = (id?: string) => (id ? HEAD_BY_ID[id]?.name ?? id : "-");
  if (plan.status === "review") return <Alert Color="Warning" Text="รอหัวหน้า กบค. อนุมัติแผน" SupportingText={"ส่งเมื่อ " + (plan.submittedAt ? dateText(plan.submittedAt) : "-") + " · ผู้รับจ้างจะเห็นแผนหลังอนุมัติ"} />;
  if (plan.status === "returned") return <Alert Color="Error" Text="หัวหน้า กบค. ส่งกลับให้แก้ไข" SupportingText={(plan.returnReason ?? "") + " · กดแก้ไขแล้วส่งอนุมัติอีกครั้ง"} />;
  if (plan.status === "closing") return <Alert Color={plan.headReturnReason ? "Error" : "Warning"} Text={plan.headReturnReason ? "หัวหน้า กบค. ไม่อนุมัติปิดงาน" : "ผู้รับจ้างขอปิดงาน"} SupportingText={plan.headReturnReason ? plan.headReturnReason + " · ตรวจสอบแล้วขออนุมัติปิดงานอีกครั้ง หรือส่งกลับให้ผู้รับจ้าง" : "ตรวจสอบสรุปปิดงาน แล้วขออนุมัติปิดงานจากหัวหน้า กบค. หรือส่งกลับให้ผู้รับจ้างแก้ไข"} />;
  if (plan.status === "closeReview") return <Alert Color="Info" Text={"รออนุมัติปิดงานจาก " + head(plan.closeApprover)} SupportingText={"ขอเมื่อ " + (plan.closeRequestedAt ? dateText(plan.closeRequestedAt) : "-") + (plan.closeNote ? " · หมายเหตุ: " + plan.closeNote : "")} />;
  if (plan.status === "closed") return <Alert Color="Success" Text={"ปิดงานแล้วเมื่อ " + (plan.closedAt ? dateText(plan.closedAt) : "-")} SupportingText={"อนุมัติปิดงานโดย " + head(plan.closeApprover)} />;
  if (plan.closeReturnReason) return <Alert Color="Gray" Text="ส่งกลับคำขอปิดงานให้ผู้รับจ้างแล้ว" SupportingText={plan.closeReturnReason} />;
  return null;
}
