"use client";
/* หัวหน้า กบค. · รายละเอียดเพื่ออนุมัติ — /approvals/detail/?mr=
   แผนรออนุมัติ: ข้อมูลแผน + ผู้รับจ้าง + ยานพาหนะและค่าจ้าง (อ่านอย่างเดียว) → อนุมัติ (ผู้รับจ้างเห็นแผน) / ส่งกลับแก้ไข (ต้องมีเหตุผล)
   คำขอปิดงาน (เฉพาะหัวหน้าที่ กบค. เลือก): + สรุปผลตรวจ + ผลรายคัน → อนุมัติ (ปิดงาน) / ส่งกลับ (แผนกลับเป็นอนุมัติแล้ว)
   ผลการพิจารณา = Section label + Radio text card ×2 + Text area อยู่บนสุดของเนื้อหา ใต้ Page header (เจ้าของงาน 20 พ.ย. 2569 · แบบหน้าอนุมัติของต้นแบบบำรุงรักษา) */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CloseSummary } from "@/app/_lib/CloseSummary";
import { DocsTable } from "@/app/_lib/DocsTable";
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
import { VEHICLE_BY_ID, bahtText, dateText, dueSub } from "@/lib/mock/data";
import { approveClose, approvePlans, budget, contractCost, returnClose, returnPlan } from "@/lib/mock/plan";
import { headOf, notify, useHydrated, useMock, useQuery, useRole } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

const COLS: TableColumn[] = [
  { head: "ทะเบียน", width: 220, Style: "Lead text" },
  { head: "สังกัด" },
  { head: "วาระ", width: 100 },
  { head: "ครบกำหนดตรวจ", width: 160 },
  { head: "ค่าจ้างตรวจ", width: 150 },
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

  const isClose = plan?.status === "closing";
  const canAct = !!plan && !!me && (plan.status === "review" || (isClose && plan.closeApprover === me));
  const ok = decision === "approve" || (decision === "return" && !!reason.trim());
  const back = () => router.push("/approvals/");
  const confirm = () => {
    if (!plan || !me || !ok) return;
    if (decision === "approve") {
      if (isClose) { approveClose([plan.mr]); notify("อนุมัติปิดงาน " + plan.mr + " แล้ว"); }
      else { approvePlans([plan.mr], me); notify("อนุมัติแผน " + plan.mr + " แล้ว · ผู้รับจ้างเห็นแผนแล้ว"); }
    } else {
      if (isClose) { returnClose(plan.mr, reason.trim()); notify("ส่งคำขอปิดงาน " + plan.mr + " กลับให้ กบค. แล้ว"); }
      else { returnPlan(plan.mr, reason.trim()); notify("ส่งแผน " + plan.mr + " กลับให้ กบค. แก้ไขแล้ว"); }
    }
    back();
  };

  const rows: TableValue[][] = plan ? plan.cars.map((id) => {
    const v = VEHICLE_BY_ID[id];
    return [{ text: v.plate, sub: v.code + " · " + v.type }, v.org, v.cycle + " เดือน", { text: dateText(v.due), sub: dueSub(v.due) }, bahtText(contractCost(plan, id))];
  }) : [];
  const rowKey = (r: TableValue[]) => { const v = r[0]; return v && typeof v === "object" && "text" in v ? v.text : String(v); };

  return (
    <AppFrame>
      <RoleGate head>
        {!hydrated ? null : !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนนี้" SupportingText="แผนอาจถูกลบไปแล้ว" /> : <>
          <PageHeader Title={plan.name} SupportingText={plan.mr + (isClose ? " · คำขอปิดงาน" : "")} onBack={back}
            crumbs={[{ Text: "Safety Inspection" }, { Text: "แผนรออนุมัติ", href: "/approvals/" }, { Text: plan.mr }]} />
          <div className="flex flex-col gap-8">
            {canAct && (
              <section className="flex flex-col gap-4">
                <SectionLabel Title="ผลการพิจารณา" />
                <RadioTextCards options={[
                  { Text: "อนุมัติ", SupportingText: isClose ? "ปิดงานแผนนี้ แก้ไขไม่ได้อีก" : "ผู้รับจ้างเห็นแผนและเริ่มบันทึกผลตรวจได้" },
                  { Text: "ส่งกลับแก้ไข", SupportingText: isClose ? "แผนกลับไปให้ กบค. ตรวจสอบแล้วขอปิดงานใหม่" : "กบค. แก้ไขแผนแล้วส่งอนุมัติใหม่" },
                ]} value={decision === "approve" ? "อนุมัติ" : decision === "return" ? "ส่งกลับแก้ไข" : null}
                  onChange={(x) => { setDecision(x === "อนุมัติ" ? "approve" : "return"); setTouched(false); }} />
                {decision === "return" && <TextArea LabelText="เหตุผลที่ส่งกลับ" Text={reason} Placeholder="ระบุเหตุผลที่ส่งกลับ" onChange={setReason} onBlur={() => setTouched(true)}
                  State={touched && !reason.trim() ? "Error" : undefined} HelperText={touched && !reason.trim() ? "กรุณาระบุเหตุผลที่ส่งกลับ" : undefined} />}
              </section>
            )}
            {isClose && <Alert Color="Info" Text={"กบค. ขอปิดงานเมื่อ " + (plan.closeRequestedAt ? dateText(plan.closeRequestedAt) : "-")} SupportingText={plan.closeNote ? "หมายเหตุ: " + plan.closeNote : undefined} />}
            {!canAct && <Alert Color="Gray" Text="แผนนี้ไม่ได้รอการพิจารณาจากคุณ" SupportingText="ดูข้อมูลได้อย่างเดียว" />}
            <PlanInfo plan={plan} />
            {isClose || plan.status === "closed" ? <>
              <CloseSummary plan={plan} />
              <section className="flex flex-col gap-4">
                <SectionHeader Title="ผลการตรวจ ปจ.2 รายคัน" />
                <DocsTable plan={plan} canEdit={false} />
              </section>
            </> : (
              <section className="flex flex-col gap-4">
                <SectionHeader Title="ยานพาหนะในแผน" Badge={plan.cars.length + " คัน · งบรวม " + bahtText(budget(plan))} />
                {mob ? <MobileCards columns={COLS} rows={rows} rowKey={rowKey} /> : <Table columns={COLS} rows={rows} rowKey={rowKey} />}
              </section>
            )}
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
