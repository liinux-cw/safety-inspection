"use client";
/* รายละเอียดแผนเดินทาง (กบค.) — /trip/?id=
   ข้อมูลแผนเดินทาง + ผู้รับจ้าง + ผลการตรวจ ปจ.2 รายคัน · กบค. พิจารณาผลรายคัน (อนุมัติ / ส่งกลับแก้ไข · ติ๊กหลายคันอนุมัติพร้อมกัน)
   รออนุมัติ/ส่งกลับแก้ไข = แก้ไข · ลบ · ผู้รับจ้างขอปิดงาน = อนุมัติปิดงาน / ส่งกลับให้ผู้รับจ้าง (ไม่มีขั้นหัวหน้า กบค. · เจ้าของงาน 20 พ.ย. 2569) */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CloseSummary } from "@/app/_lib/CloseSummary";
import { DocsTable } from "@/app/_lib/DocsTable";
import { RoleGate } from "@/app/_lib/RoleGate";
import { TripInfo, TripStatusAlert } from "@/app/_lib/TripInfo";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { FormModal } from "@/components/patterns/FormModal";
import { AppFrame } from "@/components/shell/AppFrame";
import { Alert } from "@/components/vms/Alert";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { PageHeader } from "@/components/vms/PageHeader";
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { SecondaryDangerButton } from "@/components/vms/SecondaryDangerButton";
import { SectionHeader } from "@/components/vms/SectionHeader";
import { approveCloseTrip, approveDocs, approvedCount, deleteTrip, pendingCars, pendingCount, returnCloseTrip, tripById, tripEditable } from "@/lib/mock/plan";
import { notify, useHydrated, useMock, useQuery } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

export default function TripDetail() {
  const router = useRouter();
  const mock = useMock();
  const hydrated = useHydrated();
  const mob = useBreakpoint() === "Mobile";
  const trip = tripById(mock, useQuery("id"));
  const plan = mock.plans.find((p) => p.mr === trip?.mr);
  const [del, setDel] = useState(false);
  const [ticked, setTicked] = useState<string[]>([]);
  const [bulk, setBulk] = useState(false);
  const [closeOk, setCloseOk] = useState(false);
  const [closeBack, setCloseBack] = useState<string | null>(null);
  const pend = trip && trip.status === "active" ? pendingCars(mock, trip) : [];
  const sel = ticked.filter((c) => pend.includes(c));
  const size = mob ? "lg" : "md";
  return (
    <AppFrame>
      <RoleGate kbk>
        {!hydrated ? null : !trip || !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนเดินทางนี้" SupportingText="แผนเดินทางอาจถูกลบไปแล้ว" /> : <>
          <PageHeader Title={trip.name} SupportingText={"แผนเดินทาง · " + plan.mr} onBack={() => router.push("/detail/?mr=" + plan.mr)}
            crumbs={[{ Text: "Safety Inspection" }, { Text: "แผนตรวจ ปจ.2", href: "/" }, { Text: plan.mr, href: "/detail/?mr=" + plan.mr }, { Text: trip.name }]}
            Actions={tripEditable(trip) ? <>
              <SecondaryDangerButton Text="ลบ" LeadingIconSwap="delete-24-300-round" Size={size} onClick={() => setDel(true)} />
              <SecondaryButton Text="แก้ไข" LeadingIconSwap="stylus-24-300-round" Size={size} onClick={() => router.push("/trip/edit/?id=" + trip.id)} />
            </> : trip.status === "closing" ? <>
              <SecondaryButton Text="ส่งกลับให้ผู้รับจ้าง" Size={size} onClick={() => setCloseBack("")} />
              <PrimaryButton Text="อนุมัติปิดงาน" LeadingIconSwap="task_alt-24-300-round" Size={size} onClick={() => setCloseOk(true)} />
            </> : undefined} />
          <div className="flex flex-col gap-8">
            <TripStatusAlert trip={trip} />
            {pendingCount(mock, trip) > 0 && <Alert Color="Info" Text={"มีผลการตรวจ ปจ.2 รออนุมัติ " + pendingCount(mock, trip) + " คัน"} SupportingText="ติ๊กหลายคันแล้วกดอนุมัติพร้อมกัน หรือกดไอคอนพิจารณาท้ายแถวเพื่อดูทีละคัน/ส่งกลับแก้ไข" />}
            <TripInfo trip={trip} planName={plan.name} />
            {(trip.status === "closing" || trip.status === "closed") && <CloseSummary trip={trip} />}
            <section className="flex flex-col gap-4">
              <SectionHeader Title="ผลการตรวจ ปจ.2 รายคัน" Badge={"อนุมัติแล้ว " + approvedCount(mock, trip) + "/" + trip.cars.length + " คัน"}
                Actions={pend.length ? <PrimaryButton Text={"อนุมัติ" + (sel.length ? " (" + sel.length + " คัน)" : "")} LeadingIconSwap="done_all-24-300-round" State={sel.length ? "Default" : "Disabled"} onClick={() => sel.length && setBulk(true)} /> : undefined} />
              <DocsTable trip={trip} canEdit={false} canReview={trip.status === "active"} {...(pend.length ? { ticked: sel, onTicked: setTicked } : {})} />
            </section>
          </div>
          <ConfirmDialog spec={bulk ? { title: "อนุมัติผลตรวจ ปจ.2 " + sel.length + " คัน", sub: "ผลตรวจและเอกสารของยานพาหนะที่เลือกจะถูกล็อก ส่งกลับแก้ไขไม่ได้อีก", cancel: "ยกเลิก", ok: "อนุมัติ" } : null}
            onCancel={() => setBulk(false)} onOk={() => { setBulk(false); sel.forEach((c) => approveDocs(trip.mr, c)); notify("อนุมัติผลตรวจ ปจ.2 " + sel.length + " คันแล้ว"); setTicked([]); }} />
          <ConfirmDialog spec={closeOk ? { title: "อนุมัติปิดงานแผนเดินทาง", sub: trip.name + " · ผลตรวจอนุมัติครบ " + trip.cars.length + " คัน ปิดงานแล้วแก้ไขไม่ได้อีก", cancel: "ยกเลิก", ok: "อนุมัติปิดงาน" } : null}
            onCancel={() => setCloseOk(false)} onOk={() => { setCloseOk(false); approveCloseTrip(trip.id); notify("อนุมัติปิดงานแผนเดินทาง " + trip.name + " แล้ว"); }} />
          <FormModal open={closeBack !== null} title="ส่งกลับคำขอปิดงาน" sub="ผู้รับจ้างจะเห็นเหตุผลนี้ และส่งอนุมัติปิดงานใหม่ได้"
            fields={[{ label: "เหตุผลที่ส่งกลับ", value: closeBack ?? "", placeholder: "ระบุเหตุผลที่ส่งกลับ", area: true }]} onField={(_, v) => setCloseBack(v)}
            ok="ส่งกลับ" okDisabled={!closeBack?.trim()} onCancel={() => setCloseBack(null)}
            onOk={() => { returnCloseTrip(trip.id, (closeBack ?? "").trim()); setCloseBack(null); notify("ส่งกลับคำขอปิดงานให้ผู้รับจ้างแล้ว"); }} />
          <ConfirmDialog spec={del ? { danger: true, title: "ยืนยันการลบแผนเดินทาง", sub: "ยานพาหนะในแผนเดินทางนี้จะกลับไปเป็นคันที่ยังไม่มีแผนเดินทาง", cancel: "ยกเลิก", ok: "ลบแผนเดินทาง" } : null}
            onCancel={() => setDel(false)} onOk={() => { setDel(false); deleteTrip(trip.id); notify("ลบแผนเดินทาง " + trip.name + " แล้ว"); router.push("/detail/?mr=" + plan.mr); }} />
        </>}
      </RoleGate>
    </AppFrame>
  );
}
