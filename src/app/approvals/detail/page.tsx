"use client";
/* หัวหน้า กบค. · รายละเอียดเพื่ออนุมัติ — /approvals/detail/?mr=
   แผนรออนุมัติ: ข้อมูลแผน + ยานพาหนะ (อ่านอย่างเดียว) → อนุมัติ (กบค. สร้างแผนเดินทางได้) / ส่งกลับแก้ไข (ต้องมีเหตุผล)
   ผู้รับจ้างและค่าจ้างอยู่ที่แผนเดินทาง · ไม่มีอนุมัติปิดแผนหลัก (เจ้าของงาน 20 พ.ย. 2569)
   ผลการพิจารณา = Section label + Radio text card ×2 + Text area อยู่บนสุดของเนื้อหา ใต้ Page header (เจ้าของงาน 20 พ.ย. 2569 · แบบหน้าอนุมัติของต้นแบบบำรุงรักษา) */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlanInfo } from "@/app/_lib/PlanInfo";
import { RoleGate } from "@/app/_lib/RoleGate";
import { AppFrame } from "@/components/shell/AppFrame";
import { Alert } from "@/components/vms/Alert";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { MobileCards } from "@/components/vms/MobileTable";
import { PageHeader } from "@/components/vms/PageHeader";
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { RadioTextCards } from "@/components/vms/RadioTextCard";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { SectionHeader } from "@/components/vms/SectionHeader";
import { SectionLabel } from "@/components/vms/SectionLabel";
import { Table, type TableColumn, type TableValue } from "@/components/vms/Table";
import { TextArea } from "@/components/vms/TextArea";
import { cx } from "@/lib/cx";
import { VEHICLE_BY_ID, dateText, dueSub } from "@/lib/mock/data";
import { approvePlans, returnPlan } from "@/lib/mock/plan";
import { headOf, notify, useHydrated, useMock, useQuery, useRole } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

const COLS: TableColumn[] = [
  { head: "ทะเบียน", width: 220, Style: "Lead text" },
  { head: "สังกัด" },
  { head: "วาระ", width: 160 },
  { head: "ครบกำหนดตรวจ", width: 160 },
];

export default function ApprovalDetail() {
  const router = useRouter();
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const me = headOf(useRole());
  const mr = useQuery("mr");
  const hydrated = useHydrated();
  const plan = mock.plans.find((p) => p.mr === mr);
  const [decision, setDecision] = useState<"" | "approve" | "return">("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const canAct = !!plan && !!me && plan.status === "review";
  const ok = decision === "approve" || (decision === "return" && !!reason.trim());
  const back = () => router.push("/approvals/");
  const confirm = () => {
    if (!plan || !me || !ok) return;
    if (decision === "approve") { approvePlans([plan.mr], me); notify("อนุมัติแผน " + plan.mr + " แล้ว · กบค. สร้างแผนเดินทางได้แล้ว"); }
    else { returnPlan(plan.mr, reason.trim()); notify("ส่งแผน " + plan.mr + " กลับให้ กบค. แก้ไขแล้ว"); }
    back();
  };

  const rows: TableValue[][] = plan ? plan.cars.map((id) => {
    const v = VEHICLE_BY_ID[id];
    return [{ text: v.plate, sub: v.code + " · " + v.type }, v.org, { text: v.cycle + " เดือน", sub: v.cycleSub }, { text: dateText(v.due), sub: dueSub(v.due) }];
  }) : [];
  const rowKey = (r: TableValue[]) => { const v = r[0]; return v && typeof v === "object" && "text" in v ? v.text : String(v); };

  return (
    <AppFrame>
      <RoleGate head>
        {!hydrated ? null : !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนนี้" SupportingText="แผนอาจถูกลบไปแล้ว" /> : <>
          <PageHeader Title={plan.name} SupportingText={plan.mr} onBack={back}
            crumbs={[{ Text: "Safety Inspection" }, { Text: "แผนรออนุมัติ", href: "/approvals/" }, { Text: plan.mr }]} />
          <div className="flex flex-col gap-8">
            {canAct && (
              <section className="flex flex-col gap-4">
                <SectionLabel Title="ผลการพิจารณา" />
                <RadioTextCards options={[
                  { Text: "อนุมัติ", SupportingText: "กบค. สร้างแผนเดินทาง เลือกผู้รับจ้าง และนัดวันเข้าตรวจได้" },
                  { Text: "ส่งกลับแก้ไข", SupportingText: "กบค. แก้ไขแผนแล้วส่งอนุมัติใหม่" },
                ]} value={decision === "approve" ? "อนุมัติ" : decision === "return" ? "ส่งกลับแก้ไข" : null}
                  onChange={(x) => { setDecision(x === "อนุมัติ" ? "approve" : "return"); setTouched(false); }} />
                {decision === "return" && <TextArea LabelText="เหตุผลที่ส่งกลับ" Text={reason} Placeholder="ระบุเหตุผลที่ส่งกลับ" onChange={setReason} onBlur={() => setTouched(true)}
                  State={touched && !reason.trim() ? "Error" : undefined} HelperText={touched && !reason.trim() ? "กรุณาระบุเหตุผลที่ส่งกลับ" : undefined} />}
              </section>
            )}
            {!canAct && <Alert Color="Gray" Text="แผนนี้ไม่ได้รอการพิจารณาจากคุณ" SupportingText="ดูข้อมูลได้อย่างเดียว" />}
            <PlanInfo plan={plan} />
            <section className="flex flex-col gap-4">
              <SectionHeader Title="ยานพาหนะในแผน" Badge={plan.cars.length + " คัน"} />
              {mob ? <MobileCards columns={COLS} rows={rows} rowKey={rowKey} /> : <Table columns={COLS} rows={rows} rowKey={rowKey} />}
            </section>
            <div className={cx("flex", mob ? "gap-4 [&>*]:flex-1 [&>*]:basis-0" : "justify-between gap-3")}>
              <SecondaryButton Text="ย้อนกลับ" Size="lg" onClick={back} />
              {canAct && <PrimaryButton Text="ยืนยันผลการพิจารณา" Size="lg" State={ok ? "Default" : "Disabled"} onClick={confirm} />}
            </div>
          </div>
        </>}
      </RoleGate>
    </AppFrame>
  );
}
