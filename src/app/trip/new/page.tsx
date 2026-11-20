"use client";
/* สร้างแผนเดินทาง (กบค.) — /trip/new/?mr= · ได้เมื่อแผนอนุมัติแล้วและยังมีคันที่ไม่อยู่ในแผนเดินทาง */
import { RoleGate } from "@/app/_lib/RoleGate";
import { TripForm } from "@/app/_lib/TripForm";
import { AppFrame } from "@/components/shell/AppFrame";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { canCreateTrip } from "@/lib/mock/plan";
import { useHydrated, useMock, useQuery } from "@/lib/mock/store";

export default function NewTrip() {
  const mock = useMock();
  const mr = useQuery("mr");
  const hydrated = useHydrated();
  const plan = mock.plans.find((p) => p.mr === mr);
  return (
    <AppFrame>
      <RoleGate kbk>
        {!hydrated ? null : !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนนี้" SupportingText="แผนอาจถูกลบไปแล้ว" />
          : !canCreateTrip(mock, plan) ? <EmptyStateDataEmpty Text="สร้างแผนเดินทางไม่ได้" SupportingText="สร้างได้เมื่อแผนอนุมัติแล้ว และยังมียานพาหนะที่ไม่อยู่ในแผนเดินทางใด" />
          : <TripForm key={plan.mr} plan={plan} />}
      </RoleGate>
    </AppFrame>
  );
}
