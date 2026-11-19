"use client";
/* รายละเอียดแผนตรวจ ปจ.2 (กบค.) — /detail/?mr=
   ข้อมูลแผน + ยานพาหนะในแผนพร้อมสถานะเอกสาร ปจ.2 ที่ผู้รับจ้างส่ง · กบค. พิจารณาเอกสารรายคัน (อนุมัติ / ส่งกลับแก้ไข) · แผนที่ยังไม่อนุมัติ = ปุ่มแก้ไข ลบ */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DocsTable } from "@/app/_lib/DocsTable";
import { PlanInfo } from "@/app/_lib/PlanInfo";
import { RoleGate } from "@/app/_lib/RoleGate";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { AppFrame } from "@/components/shell/AppFrame";
import { Alert } from "@/components/vms/Alert";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { PageHeader } from "@/components/vms/PageHeader";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { SecondaryDangerButton } from "@/components/vms/SecondaryDangerButton";
import { SectionHeader } from "@/components/vms/SectionHeader";
import { approvedCount, deletePlan, editable, pendingCount } from "@/lib/mock/plan";
import { notify, useHydrated, useMock, useQuery } from "@/lib/mock/store";

export default function PlanDetail() {
  const router = useRouter();
  const mock = useMock();
  const mr = useQuery("mr");
  const hydrated = useHydrated();
  const plan = mock.plans.find((p) => p.mr === mr);
  const [del, setDel] = useState(false);
  const crumbs = [{ Text: "Safety Inspection" }, { Text: "แผนตรวจ ปจ.2", href: "/" }, { Text: "รายละเอียดแผน" }];
  return (
    <AppFrame>
      <RoleGate kbk>
        {!hydrated ? null : !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนนี้" SupportingText="แผนอาจถูกลบไปแล้ว" /> : <>
          <PageHeader Title={plan.name} SupportingText={plan.mr} onBack={() => router.push("/")} crumbs={crumbs}
            Actions={editable(plan) ? <div className="flex gap-3">
              <SecondaryDangerButton Text="ลบ" LeadingIconSwap="delete-24-300-round" onClick={() => setDel(true)} />
              <SecondaryButton Text="แก้ไข" LeadingIconSwap="stylus-24-300-round" onClick={() => router.push("/edit/?mr=" + plan.mr)} />
            </div> : undefined} />
          <div className="flex flex-col gap-8">
            {pendingCount(mock, plan) > 0 && <Alert Color="Info" Text={"มีเอกสาร ปจ.2 รออนุมัติ " + pendingCount(mock, plan) + " คัน"} SupportingText="กดไอคอนพิจารณาท้ายแถว เพื่ออนุมัติหรือส่งกลับให้ผู้รับจ้างแก้ไข" />}
            <PlanInfo plan={plan} />
            <section className="flex flex-col gap-4">
              <SectionHeader Title="ยานพาหนะและเอกสาร ปจ.2" Badge={"อนุมัติแล้ว " + approvedCount(mock, plan) + "/" + plan.cars.length + " คัน"} />
              {plan.cars.length ? <DocsTable plan={plan} canEdit={false} canReview={plan.status !== "closed"} /> : <EmptyStateDataEmpty Graphic="vehicle" Text="ไม่มียานพาหนะในแผน" />}
            </section>
          </div>
          <ConfirmDialog spec={del ? { danger: true, title: "ยืนยันการลบแผนตรวจ ปจ.2", sub: "แผนและรายการยานพาหนะในแผนจะถูกลบ ไม่สามารถกู้คืนได้", cancel: "ยกเลิก", ok: "ลบแผน" } : null}
            onCancel={() => setDel(false)} onOk={() => { setDel(false); deletePlan(plan.mr); notify("ลบแผนตรวจ ปจ.2 " + plan.mr + " สำเร็จ"); router.push("/"); }} />
        </>}
      </RoleGate>
    </AppFrame>
  );
}
