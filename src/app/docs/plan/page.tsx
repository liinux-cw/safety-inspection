"use client";
/* ผู้รับจ้าง · แผนตรวจ ปจ.2 — /docs/plan/?mr=
   แนบเอกสาร ปจ.2 รายคัน (PDF/PNG/JPG · ไฟล์ละไม่เกิน 10 MB · สูงสุด 10 ไฟล์ต่อคัน) → "ส่งอนุมัติ (n คัน)" ส่งทุกคันที่แนบแล้วและยังไม่ส่ง
   ยืนยันแล้ว = ล็อก รอ กบค. อนุมัติ · กบค. ส่งกลับแก้ไข = แก้ไฟล์แล้วส่งใหม่ได้ · อนุมัติแล้ว = ล็อกถาวร · เห็นเฉพาะแผนของตัวเอง (ตั้งแต่สร้างแผน) */
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
import { addFiles, approvedCount, carDocs, readyCars, removeFile, returnedCount, submitDocs, vendorCanEdit } from "@/lib/mock/plan";
import { VEHICLE_BY_ID } from "@/lib/mock/data";
import { useProtoForm } from "@/lib/protoForm";
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
  const plan = mock.plans.find((p) => p.mr === mr && p.vendor === vendor);
  const ready = plan ? readyCars(mock, plan) : [];
  const open = !!plan && plan.status !== "closed";
  /* ต้นแบบ: กรอกข้อมูลตัวอย่าง = แนบไฟล์ตัวอย่างให้ทุกคันที่ยังแก้ได้และยังไม่มีไฟล์ · ล้างค่า = ลบไฟล์ของคันที่ยังแก้ได้ */
  const editableCars = plan && open ? plan.cars.filter((c) => vendorCanEdit(carDocs(mock, plan.mr, c))) : [];
  useProtoForm(plan && open ? {
    dirty: editableCars.some((c) => carDocs(mock, plan.mr, c).files.length),
    fill: () => editableCars.filter((c) => !carDocs(mock, plan.mr, c).files.length)
      .forEach((c) => addFiles(plan.mr, c, [{ name: "ปจ2-" + VEHICLE_BY_ID[c].plate.split(" ")[0] + ".pdf", size: "1.2 MB" }])),
    clear: () => editableCars.forEach((c) => { for (let i = carDocs(mock, plan.mr, c).files.length - 1; i >= 0; i--) removeFile(plan.mr, c, i); }),
  } : null);
  return (
    <AppFrame>
      <RoleGate vendor>
        {!hydrated ? null : !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนนี้" SupportingText="แผนนี้ไม่ได้ระบุคุณเป็นผู้รับจ้าง หรือถูกลบไปแล้ว" /> : <>
          <PageHeader Title={plan.name} SupportingText={plan.mr} onBack={() => router.push("/docs/")}
            crumbs={[{ Text: "Safety Inspection" }, { Text: "เอกสาร ปจ.2", href: "/docs/" }, { Text: plan.mr }]} />
          <div className="flex flex-col gap-8">
            {open
              ? <>
                {returnedCount(mock, plan) > 0 && <Alert Color="Error" Text={"กบค. ส่งกลับแก้ไข " + returnedCount(mock, plan) + " คัน"} SupportingText="เปิดคันที่ถูกส่งกลับเพื่อดูเหตุผล อัปโหลดเอกสารใหม่ แล้วกดส่งอนุมัติอีกครั้ง" />}
                <Alert Color="Info" Text="แนบเอกสาร ปจ.2 รายคันแล้วกดส่งอนุมัติให้ กบค." SupportingText={UPLOAD_HINT + " ต่อคัน (อย่างน้อย 1 ไฟล์) · ส่งแล้วแก้ไขหรือลบไม่ได้ระหว่างรอ กบค. อนุมัติ แต่ดูได้"} />
              </>
              : <Alert Color="Gray" Text="แผนนี้ปิดงานแล้ว" SupportingText="ดูและดาวน์โหลดเอกสารที่ส่งไปแล้วได้อย่างเดียว" />}
            <PlanInfo plan={plan} />
            <section className="flex flex-col gap-4">
              <SectionHeader Title="ยานพาหนะและเอกสาร ปจ.2" Badge={"อนุมัติแล้ว " + approvedCount(mock, plan) + "/" + plan.cars.length + " คัน"} />
              <DocsTable plan={plan} canEdit={open} />
            </section>
            {open && (
              <div className={cx("flex", mob ? "gap-4 [&>*]:flex-1 [&>*]:basis-0" : "justify-between gap-3")}>
                <SecondaryButton Text="ย้อนกลับ" Size="lg" onClick={() => router.push("/docs/")} />
                <PrimaryButton Text={"ส่งอนุมัติ" + (ready.length ? " (" + ready.length + " คัน)" : "")} Size="lg" State={ready.length ? "Default" : "Disabled"} onClick={() => ready.length && setAsk(true)} />
              </div>
            )}
          </div>
          <ConfirmDialog spec={ask ? { title: "ยืนยันส่งเอกสาร ปจ.2 เพื่ออนุมัติ", sub: "ส่งเอกสารของยานพาหนะ " + ready.length + " คันให้ กบค. อนุมัติ ระหว่างรออนุมัติจะแก้ไขหรือลบเอกสารที่ส่งไม่ได้ แต่ยังดูได้", cancel: "ยกเลิก", ok: "ยืนยันส่งอนุมัติ" } : null}
            onCancel={() => setAsk(false)} onOk={() => { setAsk(false); submitDocs(plan.mr, ready); notify("ส่งเอกสาร ปจ.2 เพื่ออนุมัติ " + ready.length + " คันสำเร็จ"); }} />
        </>}
      </RoleGate>
    </AppFrame>
  );
}
