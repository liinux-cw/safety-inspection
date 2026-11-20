"use client";
/* แก้ไขแผนตรวจ ปจ.2 (กบค.) — /edit/?mr= · แก้ได้เฉพาะแผนที่ยังไม่อนุมัติ */
import { PlanForm } from "@/app/_lib/PlanForm";
import { RoleGate } from "@/app/_lib/RoleGate";
import { AppFrame } from "@/components/shell/AppFrame";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { editable } from "@/lib/mock/plan";
import { useHydrated, useMock, useQuery } from "@/lib/mock/store";

export default function EditPlan() {
  const mock = useMock();
  const mr = useQuery("mr");
  const hydrated = useHydrated();
  const plan = mock.plans.find((p) => p.mr === mr);
  return (
    <AppFrame>
      <RoleGate kbk>
        {!hydrated ? null : !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนนี้" SupportingText="แผนอาจถูกลบไปแล้ว" />
          : !editable(plan) ? <EmptyStateDataEmpty Text="แก้ไขแผนนี้ไม่ได้" SupportingText="แผนที่อนุมัติแล้วหรือปิดงานแล้วแก้ไขไม่ได้" />
          : <PlanForm key={plan.mr} plan={plan} />}
      </RoleGate>
    </AppFrame>
  );
}
