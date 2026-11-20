"use client";
/* รายละเอียดแผนตรวจ ปจ.2 (กบค.) — /detail/?mr=
   ข้อมูลแผน + ยานพาหนะในแผนพร้อมสถานะเอกสาร ปจ.2 ที่ผู้รับจ้างส่ง · กบค. พิจารณาเอกสารรายคัน (อนุมัติ / ส่งกลับแก้ไข) · แผนที่ยังไม่อนุมัติ = ปุ่มแก้ไข ลบ */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DocsTable } from "@/app/_lib/DocsTable";
import { PlanInfo } from "@/app/_lib/PlanInfo";
import { PlanStatusAlert } from "@/app/_lib/PlanStatusAlert";
import { RoleGate } from "@/app/_lib/RoleGate";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { FormModal } from "@/components/patterns/FormModal";
import { AppFrame } from "@/components/shell/AppFrame";
import { Alert } from "@/components/vms/Alert";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { PageHeader } from "@/components/vms/PageHeader";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { SecondaryDangerButton } from "@/components/vms/SecondaryDangerButton";
import { SectionHeader } from "@/components/vms/SectionHeader";
import { approveDocs, approvedCount, deletePlan, editable, pendingCars, pendingCount, returnClose } from "@/lib/mock/plan";
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { notify, useHydrated, useMock, useQuery } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

export default function PlanDetail() {
  const router = useRouter();
  const mock = useMock();
  const mr = useQuery("mr");
  const hydrated = useHydrated();
  const mob = useBreakpoint() === "Mobile";
  const plan = mock.plans.find((p) => p.mr === mr);
  const [del, setDel] = useState(false);
  /* D: ติ๊กหลายคันที่รออนุมัติ แล้วอนุมัติพร้อมกัน */
  const [ticked, setTicked] = useState<string[]>([]);
  const [bulk, setBulk] = useState(false);
  /* ส่งกลับคำขอปิดงานของผู้รับจ้าง (จากงานพี่นุ) */
  const [closeBack, setCloseBack] = useState<string | null>(null);
  const pend = plan && plan.status === "approved" ? pendingCars(mock, plan) : [];
  const sel = ticked.filter((c) => pend.includes(c));
  const crumbs = [{ Text: "Safety Inspection" }, { Text: "แผนตรวจ ปจ.2", href: "/" }, { Text: "รายละเอียดแผน" }];
  return (
    <AppFrame>
      <RoleGate kbk>
        {!hydrated ? null : !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนนี้" SupportingText="แผนอาจถูกลบไปแล้ว" /> : <>
          <PageHeader Title={plan.name} SupportingText={plan.mr} onBack={() => router.push("/")} crumbs={crumbs}
            Actions={editable(plan) ? <>
              <SecondaryDangerButton Text="ลบ" LeadingIconSwap="delete-24-300-round" Size={mob ? "lg" : "md"} onClick={() => setDel(true)} />
              <SecondaryButton Text="แก้ไข" LeadingIconSwap="stylus-24-300-round" Size={mob ? "lg" : "md"} onClick={() => router.push("/edit/?mr=" + plan.mr)} />
            </> : plan.status === "closing" ? <>
              <SecondaryButton Text="ส่งกลับให้ผู้รับจ้าง" Size={mob ? "lg" : "md"} onClick={() => setCloseBack("")} />
              <PrimaryButton Text="สรุปปิดงาน" LeadingIconSwap="task_alt-24-300-round" Size={mob ? "lg" : "md"} onClick={() => router.push("/close/?mr=" + plan.mr)} />
            </> : undefined} />
          <div className="flex flex-col gap-8">
            <PlanStatusAlert plan={plan} />
            {pendingCount(mock, plan) > 0 && <Alert Color="Info" Text={"มีผลการตรวจ ปจ.2 รออนุมัติ " + pendingCount(mock, plan) + " คัน"} SupportingText="ติ๊กหลายคันแล้วกดอนุมัติพร้อมกัน หรือกดไอคอนพิจารณาท้ายแถวเพื่อดูทีละคัน/ส่งกลับแก้ไข" />}
            <PlanInfo plan={plan} />
            <section className="flex flex-col gap-4">
              <SectionHeader Title="ผลการตรวจ ปจ.2 รายคัน" Badge={"อนุมัติแล้ว " + approvedCount(mock, plan) + "/" + plan.cars.length + " คัน"}
                Actions={pend.length ? <PrimaryButton Text={"อนุมัติ" + (sel.length ? " (" + sel.length + " คัน)" : "")} LeadingIconSwap="done_all-24-300-round" State={sel.length ? "Default" : "Disabled"} onClick={() => sel.length && setBulk(true)} /> : undefined} />
              {plan.cars.length ? <DocsTable plan={plan} canEdit={false} canReview={plan.status === "approved"} {...(pend.length ? { ticked: sel, onTicked: setTicked } : {})} /> : <EmptyStateDataEmpty Graphic="vehicle" Text="ไม่มียานพาหนะในแผน" />}
            </section>
          </div>
          <ConfirmDialog spec={bulk ? { title: "อนุมัติผลตรวจ ปจ.2 " + sel.length + " คัน", sub: "ผลตรวจและเอกสารของยานพาหนะที่เลือกจะถูกล็อก ส่งกลับแก้ไขไม่ได้อีก", cancel: "ยกเลิก", ok: "อนุมัติ" } : null}
            onCancel={() => setBulk(false)} onOk={() => { setBulk(false); sel.forEach((c) => approveDocs(plan.mr, c)); notify("อนุมัติผลตรวจ ปจ.2 " + sel.length + " คันแล้ว"); setTicked([]); }} />
          <FormModal open={closeBack !== null} title="ส่งกลับคำขอปิดงาน" sub="ผู้รับจ้างจะเห็นเหตุผลนี้ และส่งอนุมัติปิดงานใหม่ได้"
            fields={[{ label: "เหตุผลที่ส่งกลับ", value: closeBack ?? "", placeholder: "ระบุเหตุผลที่ส่งกลับ", area: true }]} onField={(_, v) => setCloseBack(v)}
            ok="ส่งกลับ" okDisabled={!closeBack?.trim()} onCancel={() => setCloseBack(null)}
            onOk={() => { returnClose(plan.mr, (closeBack ?? "").trim()); setCloseBack(null); notify("ส่งกลับคำขอปิดงานแผน " + plan.mr + " ให้ผู้รับจ้างแล้ว"); }} />
          <ConfirmDialog spec={del ? { danger: true, title: "ยืนยันการลบแผนตรวจ ปจ.2", sub: "แผนและรายการยานพาหนะในแผนจะถูกลบ ไม่สามารถกู้คืนได้", cancel: "ยกเลิก", ok: "ลบแผน" } : null}
            onCancel={() => setDel(false)} onOk={() => { setDel(false); deletePlan(plan.mr); notify("ลบแผนตรวจ ปจ.2 " + plan.mr + " สำเร็จ"); router.push("/"); }} />
        </>}
      </RoleGate>
    </AppFrame>
  );
}
