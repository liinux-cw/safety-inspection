"use client";
/* รายละเอียดแผนตรวจ ปจ.2 (กบค.) — /detail/?mr=
   ข้อมูลแผน + แผนเดินทาง (แทนหน้าไตรมาสของต้นแบบบำรุงรักษา · สร้างได้หลังแผนอนุมัติ) + ยานพาหนะในแผนพร้อมแผนเดินทางและสถานะผลตรวจ
   แผนที่ยังไม่อนุมัติ = ปุ่มแก้ไข ลบ · พิจารณาผลตรวจและปิดงานทำที่หน้าแผนเดินทาง */
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { PlanInfo } from "@/app/_lib/PlanInfo";
import { PlanStatusAlert } from "@/app/_lib/PlanStatusAlert";
import { RoleGate } from "@/app/_lib/RoleGate";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { AppFrame } from "@/components/shell/AppFrame";
import { Alert } from "@/components/vms/Alert";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { MobileCards } from "@/components/vms/MobileTable";
import { PageHeader } from "@/components/vms/PageHeader";
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { SecondaryDangerButton } from "@/components/vms/SecondaryDangerButton";
import { SectionHeader } from "@/components/vms/SectionHeader";
import { Table, type TableColumn, type TableValue } from "@/components/vms/Table";
import { TablePagination } from "@/components/vms/TablePagination";
import { TertiaryBrandButton } from "@/components/vms/TertiaryBrandButton";
import { TRIP_STATUS_TEXT, VEHICLE_BY_ID, VENDOR_BY_ID, dateText, dayRange, dueSub, type Trip } from "@/lib/mock/data";
import { DOC_TEXT, approvedCount, canCreateTrip, carDocs, deletePlan, docState, editable, freeCars, pendingCount, tripOfCar, tripsOf } from "@/lib/mock/plan";
import { notify, useHydrated, useMock, useQuery } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { tripWork } from "@/app/_lib/TripForm";
import { withDue } from "@/lib/mock/registry";

const TRIP_COLS: TableColumn[] = [
  { head: "ชื่อแผนเดินทาง", Style: "Lead text" },
  { head: "ช่วงวันทำงาน", width: 220 },
  { head: "ยานพาหนะ", width: 110 },
  { head: "ผลตรวจอนุมัติ", width: 150 },
  { head: "สถานะ", width: 170 },
  { head: "", width: 72 },
];
const CAR_COLS: TableColumn[] = [
  { head: "ทะเบียน", width: 260, Style: "Lead text" },
  { head: "สังกัด", width: 150 },
  { head: "วาระ", width: 150 },
  { head: "ครบกำหนดตรวจ", width: 150 },
  { head: "แผนเดินทาง" },
  { head: "ผล ปจ.2", width: 160 },
];
const PER = 10;

export default function PlanDetail() {
  const router = useRouter();
  const mock = useMock();
  const mr = useQuery("mr");
  const hydrated = useHydrated();
  const mob = useBreakpoint() === "Mobile";
  const plan = mock.plans.find((p) => p.mr === mr);
  const [del, setDel] = useState(false);
  const [page, setPage] = useState(1);
  const crumbs = [{ Text: "Safety Inspection" }, { Text: "แผนตรวจ ปจ.2", href: "/" }, { Text: "รายละเอียดแผน" }];
  const table = (cols: TableColumn[], rows: TableValue[][], pagination?: ReactNode) => {
    const rowKey = (r: TableValue[]) => (r[0] as { text: string }).text;
    return mob ? <div className="flex flex-col gap-5"><MobileCards columns={cols} rows={rows} rowKey={rowKey} />{pagination}</div>
      : <Table columns={cols} rows={rows} rowKey={rowKey} Pagination={pagination} />;
  };
  return (
    <AppFrame>
      <RoleGate kbk>
        {!hydrated ? null : !plan ? <EmptyStateDataEmpty Text="ไม่พบแผนนี้" SupportingText="แผนอาจถูกลบไปแล้ว" /> : (() => {
          const trips = tripsOf(mock, plan.mr), free = freeCars(mock, plan).length, can = canCreateTrip(mock, plan);
          const pending = trips.reduce((a, t) => a + pendingCount(mock, t), 0);
          const create = (Btn: typeof PrimaryButton | typeof TertiaryBrandButton) => <Btn Text="สร้างแผนเดินทาง" LeadingIconSwap="add-24-300-round" State={can ? "Default" : "Disabled"} onClick={() => can && router.push("/trip/new/?mr=" + plan.mr)} />;
          const open = (t: Trip) => ({ IconSwap: "quick_reference_all-24-300-round", label: "เปิด " + t.name, onClick: () => router.push("/trip/?id=" + t.id) });
          const tripRows: TableValue[][] = trips.map((t) => [
            { text: t.name, sub: VENDOR_BY_ID[t.vendor]?.name ?? "-" }, dayRange(t.d1, t.d2), t.cars.length + " คัน",
            { text: approvedCount(mock, t) + "/" + t.cars.length + " คัน", sub: pendingCount(mock, t) ? "รออนุมัติ " + pendingCount(mock, t) + " คัน" : undefined },
            { pills: [TRIP_STATUS_TEXT[t.status]] }, { actions: [open(t)], mobileActions: [open(t)] },
          ]);
          const last = Math.max(1, Math.ceil(plan.cars.length / PER)), pg = Math.min(page, last);
          const carRows: TableValue[][] = plan.cars.slice((pg - 1) * PER, pg * PER).map((id) => {
            const v = withDue(mock, VEHICLE_BY_ID[id]), t = tripOfCar(mock, plan.mr, id);
            const w = t ? tripWork(t, id) : null;
            return [{ text: v.plate, sub: v.code + " · " + v.type }, v.org, { text: v.cycle + " เดือน", sub: v.cycleSub }, { text: dateText(v.due), sub: dueSub(v.due) },
              t && w ? { text: t.name, sub: "วันดำเนินการ " + dayRange(w[0], w[1]) } : { pills: [["ยังไม่มีแผนเดินทาง", "Gray"]] },
              t ? { pills: [DOC_TEXT[docState(carDocs(mock, plan.mr, id), t, id)]] } : "-"];
          });
          return <>
            <PageHeader Title={plan.name} SupportingText={plan.mr} onBack={() => router.push("/")} crumbs={crumbs}
              Actions={editable(plan) ? <>
                <SecondaryDangerButton Text="ลบ" LeadingIconSwap="delete-24-300-round" Size={mob ? "lg" : "md"} onClick={() => setDel(true)} />
                <SecondaryButton Text="แก้ไข" LeadingIconSwap="stylus-24-300-round" Size={mob ? "lg" : "md"} onClick={() => router.push("/edit/?mr=" + plan.mr)} />
              </> : undefined} />
            <div className="flex flex-col gap-8">
              <PlanStatusAlert plan={plan} />
              {plan.status === "approved" && free > 0 && <Alert Color="Warning" Text={"ยานพาหนะ " + free + " คันยังไม่อยู่ในแผนเดินทาง"} SupportingText="สร้างแผนเดินทางเพื่อเลือกผู้รับจ้าง กำหนดค่าจ้าง และนัดวันเข้าตรวจ" />}
              {pending > 0 && <Alert Color="Info" Text={"มีผลการตรวจ ปจ.2 รออนุมัติ " + pending + " คัน"} SupportingText="เปิดแผนเดินทางเพื่อพิจารณาผลรายคัน" />}
              <PlanInfo plan={plan} />
              <section className="flex flex-col gap-4">
                <SectionHeader Title="แผนเดินทาง" Badge={trips.length + " แผน"} Actions={plan.status === "approved" && trips.length ? create(TertiaryBrandButton) : undefined} />
                {trips.length ? table(TRIP_COLS, tripRows)
                  : plan.status === "approved" ? <EmptyStateDataEmpty Text="ยังไม่มีแผนเดินทาง" SupportingText="สร้างแผนเดินทางเพื่อเลือกผู้รับจ้าง นัดวันเข้าตรวจ และแจ้ง กรย. กับผู้ดูแลยานพาหนะ" Actions={create(PrimaryButton)} />
                  : <EmptyStateDataEmpty Text="ยังไม่มีแผนเดินทาง" SupportingText={plan.status === "closed" ? "แผนนี้เสร็จสิ้นแล้ว" : "สร้างแผนเดินทางได้หลังหัวหน้า กบค. อนุมัติแผน"} />}
              </section>
              <section className="flex flex-col gap-4">
                <SectionHeader Title="ยานพาหนะในแผน" Badge={plan.cars.length + " คัน"} />
                {plan.cars.length ? table(CAR_COLS, carRows, <TablePagination total={plan.cars.length} page={pg} perPage={PER} onPage={setPage} />)
                  : <EmptyStateDataEmpty Graphic="vehicle" Text="ไม่มียานพาหนะในแผน" />}
              </section>
            </div>
            <ConfirmDialog spec={del ? { danger: true, title: "ยืนยันการลบแผนตรวจ ปจ.2", sub: "แผนและรายการยานพาหนะในแผนจะถูกลบ ไม่สามารถกู้คืนได้", cancel: "ยกเลิก", ok: "ลบแผน" } : null}
              onCancel={() => setDel(false)} onOk={() => { setDel(false); deletePlan(plan.mr); notify("ลบแผนตรวจ ปจ.2 " + plan.mr + " สำเร็จ"); router.push("/"); }} />
          </>;
        })()}
      </RoleGate>
    </AppFrame>
  );
}
