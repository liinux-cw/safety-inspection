"use client";
/* ผู้รับจ้าง · แผนตรวจ ปจ.2 — /docs/plan/?mr=
   แนบเอกสาร ปจ.2 รายคัน (PDF/PNG/JPG · ไฟล์ละไม่เกิน 10 MB · สูงสุด 10 ไฟล์ต่อคัน) → "ส่งอนุมัติ (n คัน)" ส่งทุกคันที่แนบแล้วและยังไม่ส่ง
   ยืนยันแล้ว = ล็อก แก้ไขหรือลบไม่ได้ ดูและดาวน์โหลดได้ · เห็นเฉพาะแผนของตัวเองที่อนุมัติแล้ว */
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
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { SectionHeader } from "@/components/vms/SectionHeader";
import { cx } from "@/lib/cx";
import { UPLOAD_HINT } from "@/lib/mock/data";
import { carDocs, sentCount, submitDocs } from "@/lib/mock/plan";
import { notify, useHydrated, useMock, useQuery, useRole, vendorOf } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

export default function VendorPlan() {
  const router = useRouter();
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const vendor = vendorOf(useRole());
  const mr = useQuery("mr");
  const hydrated = useHydrated();
  const [ask, setAsk] = useState(false);
  const plan = mock.plans.find((p) => p.mr === mr && p.vendor === vendor && (p.status === "approved" || p.status === "closed"));
  const ready = plan ? plan.cars.filter((c) => { const d = carDocs(mock, plan.mr, c); return d.files.length > 0 && !d.sentAt; }) : [];
  const open = plan?.status === "approved";
  return (
    <AppFrame>
      <RoleGate vendor>
        {!hydrated ? null : !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนนี้" SupportingText="แผนนี้ไม่ได้ระบุคุณเป็นผู้รับจ้าง หรือยังไม่อนุมัติ" /> : <>
          <PageHeader Title={plan.name} SupportingText={plan.mr} onBack={() => router.push("/docs/")}
            crumbs={[{ Text: "Safety Inspection" }, { Text: "เอกสาร ปจ.2", href: "/docs/" }, { Text: plan.mr }]} />
          <div className="flex flex-col gap-8">
            {open
              ? <Alert Color="Info" Text="แนบเอกสาร ปจ.2 รายคันแล้วกดส่งอนุมัติ" SupportingText={UPLOAD_HINT + " ต่อคัน · ส่งอนุมัติแล้วแก้ไขหรือลบเอกสารของคันนั้นไม่ได้ แต่ดูได้"} />
              : <Alert Color="Gray" Text="แผนนี้ปิดงานแล้ว" SupportingText="ดูและดาวน์โหลดเอกสารที่ส่งไปแล้วได้อย่างเดียว" />}
            <PlanInfo plan={plan} />
            <section className="flex flex-col gap-4">
              <SectionHeader Title="ยานพาหนะและเอกสาร ปจ.2" Badge={"ส่งแล้ว " + sentCount(mock, plan) + "/" + plan.cars.length + " คัน"} />
              <DocsTable plan={plan} canEdit={open} />
            </section>
            {open && (
              <div className={cx("flex", mob ? "gap-4 [&>*]:flex-1 [&>*]:basis-0" : "justify-between gap-3")}>
                <SecondaryButton Text="ย้อนกลับ" Size="lg" onClick={() => router.push("/docs/")} />
                <PrimaryButton Text={"ส่งอนุมัติ" + (ready.length ? " (" + ready.length + " คัน)" : "")} Size="lg" State={ready.length ? "Default" : "Disabled"} onClick={() => ready.length && setAsk(true)} />
              </div>
            )}
          </div>
          <ConfirmDialog spec={ask ? { title: "ยืนยันส่งเอกสาร ปจ.2 เพื่ออนุมัติ", sub: "ส่งเอกสารของยานพาหนะ " + ready.length + " คัน เมื่อส่งแล้วจะแก้ไขหรือลบเอกสารที่ส่งไม่ได้ แต่ยังดูได้", cancel: "ยกเลิก", ok: "ยืนยันส่งอนุมัติ" } : null}
            onCancel={() => setAsk(false)} onOk={() => { setAsk(false); submitDocs(plan.mr, ready); notify("ส่งเอกสาร ปจ.2 เพื่ออนุมัติ " + ready.length + " คันสำเร็จ"); }} />
        </>}
      </RoleGate>
    </AppFrame>
  );
}
