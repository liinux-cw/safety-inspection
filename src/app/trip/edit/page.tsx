"use client";
/* แก้ไขแผนเดินทาง (กบค.) — /trip/edit/?id= · แก้ได้ก่อนอนุมัติ (รออนุมัติ · ส่งกลับแก้ไข) · บันทึก = ส่งหัวหน้า กบค. อนุมัติใหม่ */
import { RoleGate } from "@/app/_lib/RoleGate";
import { TripForm } from "@/app/_lib/TripForm";
import { AppFrame } from "@/components/shell/AppFrame";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { tripById, tripEditable } from "@/lib/mock/plan";
import { useHydrated, useMock, useQuery } from "@/lib/mock/store";

export default function EditTrip() {
  const mock = useMock();
  const trip = tripById(mock, useQuery("id"));
  const plan = mock.plans.find((p) => p.mr === trip?.mr);
  const hydrated = useHydrated();
  return (
    <AppFrame>
      <RoleGate kbk>
        {!hydrated ? null : !trip || !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนเดินทางนี้" SupportingText="แผนเดินทางอาจถูกลบไปแล้ว" />
          : !tripEditable(trip) ? <EmptyStateDataEmpty Text="แก้ไขแผนเดินทางนี้ไม่ได้" SupportingText="แผนเดินทางที่อนุมัติแล้วแก้ไขไม่ได้" />
          : <TripForm key={trip.id} plan={plan} trip={trip} />}
      </RoleGate>
    </AppFrame>
  );
}
