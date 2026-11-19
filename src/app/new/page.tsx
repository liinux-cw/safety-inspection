"use client";
/* สร้างแผนตรวจ ปจ.2 (กบค.) — /new/ */
import { PlanForm } from "@/app/_lib/PlanForm";
import { RoleGate } from "@/app/_lib/RoleGate";
import { AppFrame } from "@/components/shell/AppFrame";

export default function NewPlan() {
  return <AppFrame><RoleGate kbk><PlanForm /></RoleGate></AppFrame>;
}
