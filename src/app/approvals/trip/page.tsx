"use client";
/* หัวหน้า กบค. · พิจารณาแผนเดินทาง — /approvals/trip/?id=
   ผลการพิจารณา (Section label + Radio text card ×2 + Text area · แบบเดียวกับหน้าอนุมัติแผน) + ข้อมูลแผนเดินทาง/ผู้รับจ้าง + ยานพาหนะ สถานที่ วันดำเนินการ ค่าจ้าง
   อนุมัติ = แจ้งผู้รับจ้าง กรย. ผู้ดูแลยานพาหนะ ผู้รับจ้างเริ่มบันทึกผลได้ · ส่งกลับแก้ไข (ต้องมีเหตุผล) = กบค. แก้แล้วส่งใหม่ (เจ้าของงาน 20 พ.ย. 2569) */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RoleGate } from "@/app/_lib/RoleGate";
import { TripInfo, TripStatusAlert } from "@/app/_lib/TripInfo";
import { tripContact, tripLoc, tripWork } from "@/app/_lib/TripForm";
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
import { VEHICLE_BY_ID, bahtText, dayRange } from "@/lib/mock/data";
import { approveTrips, budget, contractCost, returnTrip, tripById } from "@/lib/mock/plan";
import { headOf, notify, useHydrated, useMock, useQuery, useRole } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

const COLS: TableColumn[] = [
  { head: "ทะเบียน", width: 260, Style: "Lead text" },
  { head: "สถานที่ตรวจ / ผู้ดูแลยานพาหนะ" },
  { head: "วันดำเนินการ", width: 220 },
  { head: "ค่าจ้างตรวจ", width: 150 },
];

export default function TripApproval() {
  const router = useRouter();
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const me = headOf(useRole());
  const hydrated = useHydrated();
  const trip = tripById(mock, useQuery("id"));
  const plan = mock.plans.find((p) => p.mr === trip?.mr);
  const [decision, setDecision] = useState<"" | "approve" | "return">("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const canAct = !!trip && !!me && trip.status === "review";
  const ok = decision === "approve" || (decision === "return" && !!reason.trim());
  const back = () => router.push("/approvals/");
  const confirm = () => {
    if (!trip || !me || !ok) return;
    if (decision === "approve") { approveTrips([trip.id], me); notify("อนุมัติแผนเดินทาง " + trip.name + " แล้ว · แจ้งผู้รับจ้าง กรย. และผู้ดูแลยานพาหนะแล้ว"); }
    else { returnTrip(trip.id, reason.trim()); notify("ส่งแผนเดินทาง " + trip.name + " กลับให้ กบค. แก้ไขแล้ว"); }
    back();
  };
  const rows: TableValue[][] = trip ? trip.cars.map((id) => {
    const v = VEHICLE_BY_ID[id], w = tripWork(trip, id);
    return [{ text: v.plate, sub: v.code + " · " + v.type }, { text: tripLoc(trip, v), sub: tripContact(trip, v) }, dayRange(w[0], w[1]), bahtText(contractCost(trip, id))];
  }) : [];
  const rowKey = (r: TableValue[]) => (r[0] as { text: string }).text;

  return (
    <AppFrame>
      <RoleGate head>
        {!hydrated ? null : !trip || !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนเดินทางนี้" SupportingText="แผนเดินทางอาจถูกลบไปแล้ว" /> : <>
          <PageHeader Title={trip.name} SupportingText={"แผนเดินทาง · " + plan.mr} onBack={back}
            crumbs={[{ Text: "Safety Inspection" }, { Text: "แผนรออนุมัติ", href: "/approvals/" }, { Text: trip.name }]} />
          <div className="flex flex-col gap-8">
            {canAct && (
              <section className="flex flex-col gap-4">
                <SectionLabel Title="ผลการพิจารณา" />
                <RadioTextCards options={[
                  { Text: "อนุมัติ", SupportingText: "แจ้งผู้รับจ้าง กรย. และผู้ดูแลยานพาหนะ ผู้รับจ้างเริ่มบันทึกผลตรวจได้" },
                  { Text: "ส่งกลับแก้ไข", SupportingText: "กบค. แก้ไขแผนเดินทางแล้วส่งอนุมัติใหม่" },
                ]} value={decision === "approve" ? "อนุมัติ" : decision === "return" ? "ส่งกลับแก้ไข" : null}
                  onChange={(x) => { setDecision(x === "อนุมัติ" ? "approve" : "return"); setTouched(false); }} />
                {decision === "return" && <TextArea LabelText="เหตุผลที่ส่งกลับ" Text={reason} Placeholder="ระบุเหตุผลที่ส่งกลับ" onChange={setReason} onBlur={() => setTouched(true)}
                  State={touched && !reason.trim() ? "Error" : undefined} HelperText={touched && !reason.trim() ? "กรุณาระบุเหตุผลที่ส่งกลับ" : undefined} />}
              </section>
            )}
            {canAct ? null : trip.status === "review" ? <Alert Color="Gray" Text="แผนเดินทางนี้ไม่ได้รอการพิจารณาจากคุณ" SupportingText="ดูข้อมูลได้อย่างเดียว" /> : <TripStatusAlert trip={trip} />}
            <TripInfo trip={trip} planName={plan.name} />
            <section className="flex flex-col gap-4">
              <SectionHeader Title="ยานพาหนะในแผนเดินทาง" Badge={trip.cars.length + " คัน · งบรวม " + bahtText(budget(trip))} />
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
