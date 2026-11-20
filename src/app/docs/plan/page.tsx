"use client";
/* ผู้รับจ้าง · แผนตรวจ ปจ.2 — /docs/plan/?mr=
   บันทึกและส่งอนุมัติผลตรวจรายคันใน popup ของแต่ละคัน · ส่งแล้ว = ล็อก รอ กบค. อนุมัติ · กบค. ส่งกลับแก้ไข = แก้แล้วส่งใหม่ได้ · อนุมัติแล้ว = ล็อกถาวร
   ทุกคันเสร็จสิ้น (กบค. อนุมัติครบ) → "ส่งอนุมัติปิดงาน" → กบค. อนุมัติปิดงาน หรือส่งกลับ · เห็นเฉพาะแผนของตัวเอง (ตั้งแต่สร้างแผน) */
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
import { addFiles, allApproved, approvedCount, carDocs, missing, removeFile, requestClose, returnedCount, updateResult, vendorCanEdit, vendorCanWork, vendorSees } from "@/lib/mock/plan";
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
  const plan = mock.plans.find((p) => p.mr === mr && p.vendor === vendor && vendorSees(p));
  const done = !!plan && allApproved(mock, plan);
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
            crumbs={[{ Text: "งานซ่อมและบำรุงรักษา" }, { Text: "เอกสาร ปจ.2", href: "/docs/" }, { Text: plan.mr }]} />
          <div className="flex flex-col gap-8">
            {open && plan.closeReturnReason && <Alert Color="Error" Text="กบค. ส่งกลับคำขอปิดงาน" SupportingText={plan.closeReturnReason} />}
            {open
              ? returnedCount(mock, plan) > 0 && <Alert Color="Error" Text={"กบค. ส่งกลับแก้ไข " + returnedCount(mock, plan) + " คัน"} SupportingText="เปิดคันที่ถูกส่งกลับเพื่อดูเหตุผล แก้ไขผลหรือเอกสาร แล้วกดส่งอนุมัติอีกครั้ง" />
              : waiting
                ? <Alert Color="Warning" Text="แผนนี้ยังไม่อนุมัติ" SupportingText="ดูรายละเอียดแผนและยานพาหนะเพื่อเตรียมงานได้ บันทึกและส่งผลตรวจได้เมื่อแผนอนุมัติแล้ว" />
                : (plan.status === "closing" || plan.status === "closeReview")
                  ? <Alert Color="Info" Text="ส่งอนุมัติปิดงานแล้ว" SupportingText="รอ กบค. อนุมัติปิดงาน" />
                  : <Alert Color="Gray" Text="แผนนี้ปิดงานแล้ว" SupportingText="ดูและดาวน์โหลดเอกสารที่ส่งไปแล้วได้อย่างเดียว" />}
            <PlanInfo plan={plan} />
            <section className="flex flex-col gap-4">
              <SectionHeader Title="ผลการตรวจ ปจ.2 รายคัน" Badge={"อนุมัติแล้ว " + approvedCount(mock, plan) + "/" + plan.cars.length + " คัน"} />
              <DocsTable plan={plan} canEdit={plan.status !== "closed"} />
            </section>
            {open && (
              <div className={cx("flex", mob ? "gap-4 [&>*]:flex-1 [&>*]:basis-0" : "justify-between gap-3")}>
                <SecondaryButton Text="ย้อนกลับ" Size="lg" onClick={() => router.push("/docs/")} />
                <PrimaryButton Text="ส่งอนุมัติปิดงาน" Size="lg" State={done ? "Default" : "Disabled"} onClick={() => done && setAsk(true)} />
              </div>
            )}
          </div>
          <ConfirmDialog spec={ask ? { title: "ยืนยันส่งอนุมัติปิดงาน", sub: "ผลการตรวจ ปจ.2 อนุมัติครบ " + plan.cars.length + " คัน ส่งให้ กบค. อนุมัติปิดงานแผน " + plan.mr, cancel: "ยกเลิก", ok: "ส่งอนุมัติปิดงาน" } : null}
            onCancel={() => setAsk(false)} onOk={() => { setAsk(false); requestClose(plan.mr); notify("ส่งอนุมัติปิดงานแผน " + plan.mr + " สำเร็จ"); }} />
        </>}
      </RoleGate>
    </AppFrame>
  );
}
