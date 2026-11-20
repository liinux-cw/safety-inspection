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
import { addFiles, approvedCount, carDocs, missing, readyCars, removeFile, returnedCount, submitDocs, updateResult, vendorCanEdit, vendorCanWork } from "@/lib/mock/plan";
import { TODAY, VEHICLE_BY_ID } from "@/lib/mock/data";
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
  /* A: ผู้รับจ้างเห็นแผนทันที แต่บันทึก/ส่งผลได้เมื่อแผนอนุมัติแล้ว */
  const open = !!plan && vendorCanWork(plan);
  const waiting = !!plan && (plan.status === "review" || plan.status === "returned");
  /* ต้นแบบ: กรอกข้อมูลตัวอย่าง = กรอกผลผ่าน + ค่าจ้าง + ไฟล์ตัวอย่างให้ทุกคันที่ยังแก้ได้และยังไม่ครบ · ล้างค่า = ล้างผลและไฟล์ของคันที่ยังแก้ได้ */
  const editableCars = plan && open ? plan.cars.filter((c) => vendorCanEdit(carDocs(mock, plan.mr, c))) : [];
  useProtoForm(plan && open ? {
    dirty: editableCars.some((c) => { const d = carDocs(mock, plan.mr, c); return !!(d.files.length || d.result || d.date || d.cost); }),
    fill: () => editableCars.forEach((c) => {
      const d = carDocs(mock, plan.mr, c);
      if (!missing(d, plan, c).length) return;
      updateResult(plan.mr, c, { date: d.date ?? TODAY, result: d.result ?? "ผ่าน", reason: d.result === "ตรวจไม่ได้" ? d.reason || "ยานพาหนะอยู่ระหว่างซ่อม ไม่สามารถทดสอบได้" : d.reason });
      if (!d.files.length) addFiles(plan.mr, c, [{ name: "ปจ2-" + VEHICLE_BY_ID[c].plate.split(" ")[0] + ".pdf", size: "1.2 MB" }]);
    }),
    clear: () => editableCars.forEach((c) => {
      updateResult(plan.mr, c, { date: undefined, cost: undefined, costReason: undefined, result: undefined, reason: undefined });
      for (let i = carDocs(mock, plan.mr, c).files.length - 1; i >= 0; i--) removeFile(plan.mr, c, i);
    }),
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
                {returnedCount(mock, plan) > 0 && <Alert Color="Error" Text={"กบค. ส่งกลับแก้ไข " + returnedCount(mock, plan) + " คัน"} SupportingText="เปิดคันที่ถูกส่งกลับเพื่อดูเหตุผล แก้ไขผลหรือเอกสาร แล้วกดส่งอนุมัติอีกครั้ง" />}
                <Alert Color="Info" Text="บันทึกผลตรวจ ปจ.2 รายคันแล้วกดส่งอนุมัติให้ กบค." SupportingText={"ต่อคัน: วันที่ตรวจ · ค่าจ้างตรวจ (ตั้งต้นตามสัญญาของคันนั้น) · ผลการตรวจ · เอกสาร ปจ.2 (" + UPLOAD_HINT + ", อย่างน้อย 1 ไฟล์) · ตรวจไม่ได้ = เหตุผล + หนังสือรับรองจากผู้แทนหน่วยงาน · ส่งแล้วแก้ไขไม่ได้ระหว่างรอ กบค. อนุมัติ"} />
              </>
              : waiting
                ? <Alert Color="Warning" Text="แผนนี้ยังไม่อนุมัติ" SupportingText="ดูรายละเอียดแผนและยานพาหนะเพื่อเตรียมงานได้ บันทึกและส่งผลตรวจได้เมื่อแผนอนุมัติแล้ว" />
                : <Alert Color="Gray" Text="แผนนี้ปิดงานแล้ว" SupportingText="ดูและดาวน์โหลดเอกสารที่ส่งไปแล้วได้อย่างเดียว" />}
            <PlanInfo plan={plan} />
            <section className="flex flex-col gap-4">
              <SectionHeader Title="ผลการตรวจ ปจ.2 รายคัน" Badge={"อนุมัติแล้ว " + approvedCount(mock, plan) + "/" + plan.cars.length + " คัน"} />
              <DocsTable plan={plan} canEdit={plan.status !== "closed"} />
            </section>
            {open && (
              <div className={cx("flex", mob ? "gap-4 [&>*]:flex-1 [&>*]:basis-0" : "justify-between gap-3")}>
                <SecondaryButton Text="ย้อนกลับ" Size="lg" onClick={() => router.push("/docs/")} />
                <PrimaryButton Text={"ส่งอนุมัติ" + (ready.length ? " (" + ready.length + " คัน)" : "")} Size="lg" State={ready.length ? "Default" : "Disabled"} onClick={() => ready.length && setAsk(true)} />
              </div>
            )}
          </div>
          <ConfirmDialog spec={ask ? { title: "ยืนยันส่งผลการตรวจ ปจ.2 เพื่ออนุมัติ", sub: "ส่งผลการตรวจและเอกสารของยานพาหนะ " + ready.length + " คันให้ กบค. อนุมัติ ระหว่างรออนุมัติจะแก้ไขหรือลบเอกสารที่ส่งไม่ได้ แต่ยังดูได้", cancel: "ยกเลิก", ok: "ยืนยันส่งอนุมัติ" } : null}
            onCancel={() => setAsk(false)} onOk={() => { setAsk(false); submitDocs(plan, ready); notify("ส่งผลการตรวจ ปจ.2 เพื่ออนุมัติ " + ready.length + " คันสำเร็จ"); }} />
        </>}
      </RoleGate>
    </AppFrame>
  );
}
