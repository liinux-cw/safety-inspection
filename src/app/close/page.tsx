"use client";
/* กบค. · สรุปปิดงานแผน — /close/?mr= (จากปุ่ม "สรุปปิดงาน" ในหน้ารายละเอียดแผน)
   เงื่อนไข: ผลตรวจอนุมัติครบทุกคัน · สรุปผ่าน/ไม่ผ่าน/ระงับ/ตรวจไม่ได้ + ค่าจ้างรวมเทียบงบ · ผลรายคัน
   ขั้น 2 ของการปิดงาน: ผู้รับจ้างขอปิดงานแล้ว (closing) → กบค. ขออนุมัติปิดงาน → หัวหน้า กบค.
   "ขออนุมัติปิดงาน" → popup เลือกหัวหน้า กบค. ผู้อนุมัติ (เลือกใหม่ได้ ไม่ต้องเป็นคนที่อนุมัติแผน · รายชื่อเฉพาะหัวหน้า กบค.) + หมายเหตุ (ถ้ามี) */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CloseSummary } from "@/app/_lib/CloseSummary";
import { DocsTable } from "@/app/_lib/DocsTable";
import { PlanStatusAlert } from "@/app/_lib/PlanStatusAlert";
import { RoleGate } from "@/app/_lib/RoleGate";
import { PopupModal } from "@/components/patterns/PopupModal";
import { AppFrame } from "@/components/shell/AppFrame";
import { Alert } from "@/components/vms/Alert";
import { DropdownList } from "@/components/vms/DropdownList";
import { DropdownListItem } from "@/components/vms/DropdownListItem";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { InputDropdown } from "@/components/vms/InputDropdown";
import { PageHeader } from "@/components/vms/PageHeader";
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { SectionHeader } from "@/components/vms/SectionHeader";
import { TextArea } from "@/components/vms/TextArea";
import { cx } from "@/lib/cx";
import { HEADS, HEAD_BY_ID } from "@/lib/mock/data";
import { approvedCount, canClose, kbkRequestClose } from "@/lib/mock/plan";
import { notify, useHydrated, useMock, useQuery } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

export default function ClosePlan() {
  const router = useRouter();
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const mr = useQuery("mr");
  const hydrated = useHydrated();
  const plan = mock.plans.find((p) => p.mr === mr);
  const [open, setOpen] = useState(false);
  const [approver, setApprover] = useState("");
  const [dd, setDd] = useState(false);
  const [note, setNote] = useState("");
  const back = () => router.push("/detail/?mr=" + mr);

  return (
    <AppFrame>
      <RoleGate kbk>
        {!hydrated ? null : !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนนี้" SupportingText="แผนอาจถูกลบไปแล้ว" /> : (() => {
          const ready = canClose(mock, plan), done = approvedCount(mock, plan);
          return <>
            <PageHeader Title="สรุปปิดงาน" SupportingText={plan.mr + " · " + plan.name} onBack={back}
              crumbs={[{ Text: "Safety Inspection" }, { Text: "แผนตรวจ ปจ.2", href: "/" }, { Text: plan.mr, href: "/detail/?mr=" + plan.mr }, { Text: "สรุปปิดงาน" }]} />
            <div className="flex flex-col gap-8">
              <PlanStatusAlert plan={plan} />
              {plan.status === "approved" && <Alert Color="Gray" Text="รอผู้รับจ้างขอปิดงาน" SupportingText="ขออนุมัติปิดงานได้หลังผู้รับจ้างส่งอนุมัติปิดงาน และผลตรวจอนุมัติครบทุกคัน" />}
              {plan.status === "closing" && (ready
                ? <Alert Color="Success" Text="พร้อมขออนุมัติปิดงาน" SupportingText="ผลตรวจของยานพาหนะทุกคันได้รับอนุมัติแล้ว" />
                : <Alert Color="Warning" Text={"ยังขอปิดงานไม่ได้ · ผลอนุมัติแล้ว " + done + "/" + plan.cars.length + " คัน"} SupportingText="ต้องอนุมัติผลตรวจของยานพาหนะครบทุกคันก่อน" />)}
              <CloseSummary plan={plan} />
              <section className="flex flex-col gap-4">
                <SectionHeader Title="ผลการตรวจ ปจ.2 รายคัน" />
                <DocsTable plan={plan} canEdit={false} />
              </section>
              <div className={cx("flex", mob ? "gap-4 [&>*]:flex-1 [&>*]:basis-0" : "justify-between gap-3")}>
                <SecondaryButton Text="ย้อนกลับ" Size="lg" onClick={back} />
                {plan.status === "closing" && <PrimaryButton Text="ขออนุมัติปิดงาน" Size="lg" State={ready ? "Default" : "Disabled"} onClick={() => ready && setOpen(true)} />}
              </div>
            </div>
            <PopupModal open={open} title="ขออนุมัติปิดงาน" sub={plan.mr + " · " + plan.name} ok="ส่งขออนุมัติ" okDisabled={!approver}
              onCancel={() => setOpen(false)}
              onOk={() => { kbkRequestClose(plan.mr, approver, note.trim()); setOpen(false); notify("ส่งขออนุมัติปิดงานถึง " + HEAD_BY_ID[approver].name + " แล้ว"); back(); }}>
              <div className="flex flex-col gap-4">
                <InputDropdown LabelText="ผู้อนุมัติปิดงาน" Text={approver ? HEAD_BY_ID[approver].name : ""} Placeholder="เลือกหัวหน้า กบค." open={dd} onOpenChange={setDd}
                  HelperText="เฉพาะหัวหน้า กบค. ที่มีสิทธิ์อนุมัติ · ไม่จำเป็นต้องเป็นคนเดียวกับที่อนุมัติแผน">
                  <DropdownList>{HEADS.map((h) => <DropdownListItem key={h.id} Text={h.name} SupportingText={h.id === plan.approvedBy ? "ผู้อนุมัติแผนนี้" : undefined}
                    State={h.id === approver ? "Selected" : "Default"} onClick={() => { setApprover(h.id); setDd(false); }} />)}</DropdownList>
                </InputDropdown>
                <TextArea LabelText="หมายเหตุ" Optional Text={note} Placeholder="เช่น มียานพาหนะ 1 คันตรวจไม่ได้ พร้อมหนังสือรับรอง" onChange={setNote} />
              </div>
            </PopupModal>
          </>;
        })()}
      </RoleGate>
    </AppFrame>
  );
}
