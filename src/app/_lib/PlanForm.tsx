"use client";
/* ฟอร์มสร้าง/แก้ไขแผนตรวจ ปจ.2 (กบค.) — อิงฟอร์มสร้างแผนของต้นแบบบำรุงรักษาตามวาระ แต่ไม่มีแท็บไตรมาสและไม่มีอะไหล่
   2 section: ข้อมูลแผน (ชื่อแผน · รอบตรวจ · ไม่มีปีงบประมาณ 20 พ.ย. 2569) · ยานพาหนะในแผน: ตาราง + "เพิ่มยานพาหนะ" (VehiclePicker) · เอาออกทีละคัน
   ผู้รับจ้างและค่าจ้างตรวจรายคันย้ายไปกำหนดตอนสร้างแผนเดินทาง หลังแผนอนุมัติ (เจ้าของงาน 20 พ.ย. 2569)
   "บันทึกและส่งอนุมัติ" กดได้เมื่อกรอกครบ + มียานพาหนะอย่างน้อย 1 คัน · ออกจากหน้าตอนแก้ค้าง = ยืนยันก่อน */
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { Alert } from "@/components/vms/Alert";
import { DropdownList } from "@/components/vms/DropdownList";
import { DropdownListItem } from "@/components/vms/DropdownListItem";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { EmptyStateSearchNotFound } from "@/components/vms/EmptyStateSearchNotFound";
import { InputDropdown } from "@/components/vms/InputDropdown";
import { MobileCards } from "@/components/vms/MobileTable";
import { PageHeader } from "@/components/vms/PageHeader";
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { SectionHeader } from "@/components/vms/SectionHeader";
import { Table, type TableColumn, type TableValue } from "@/components/vms/Table";
import { TableHeader } from "@/components/vms/TableHeader";
import { TablePagination } from "@/components/vms/TablePagination";
import { TextInput } from "@/components/vms/TextInput";
import { cx } from "@/lib/cx";
import { MONTH_OPTIONS, VEHICLES, VEHICLE_BY_ID, dateText, dueSub, fiscalYearOf, monthText, rangeText, type Plan } from "@/lib/mock/data";
import { EMPTY_DRAFT, createPlan, draftOf, takenMap, updatePlan, type Draft } from "@/lib/mock/plan";
import { notify, useMock } from "@/lib/mock/store";
import { vehiclesNow, withDue } from "@/lib/mock/registry";
import { useProtoForm } from "@/lib/protoForm";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { VehiclePicker } from "./VehiclePicker";

const COLS: TableColumn[] = [
  { head: "ทะเบียน", width: 260, Style: "Lead text" },
  { head: "สังกัด", width: 150 },
  { head: "ผู้ครอบครอง/เบอร์ติดต่อ" },
  { head: "วาระ", width: 150 },
  { head: "ครบกำหนดตรวจ", width: 150 },
  { head: "", width: 72 },
];
const PER = 10;
const LEAVE = { title: "ยืนยันการออกจากหน้านี้", sub: "ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก", cancel: "อยู่ต่อ", ok: "ออกจากหน้านี้", danger: true };

export function PlanForm({ plan }: { plan?: Plan }) {
  const router = useRouter();
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const edit = !!plan;
  const start = useMemo(() => (plan ? draftOf(plan) : EMPTY_DRAFT), [plan]);
  const [d, setD] = useState<Draft>(start);
  const put = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));
  const [dd, setDd] = useState("");
  const ddOpen = (k: string) => (v: boolean) => { setDd(v ? k : dd === k ? "" : dd); if (!v) touch(k); };
  const [picker, setPicker] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  /* C: ชื่อแผนเติมให้จากรอบตรวจจนกว่าจะพิมพ์เอง · แก้ไขแผนเดิม = ถือว่าพิมพ์เองแล้ว */
  const [nameEdited, setNameEdited] = useState(edit);
  const autoName = (from: string, to: string) => (from && to ? "ตรวจ ปจ.2 รอบ " + rangeText(from, to) : "");
  /* C: ปีงบคิดจากเดือนเริ่มต้น · เดือนสิ้นสุดต้องอยู่ปีงบเดียวกันและไม่ก่อนเดือนเริ่มต้น */
  const pickFrom = (m: string) => {
    const fy = fiscalYearOf(m);
    const to = d.to && d.to >= m ? d.to : "";
    put({ from: m, fy, to, ...(nameEdited ? {} : { name: autoName(m, to) }) });
  };
  const pickTo = (m: string) => put({ to: m, ...(nameEdited ? {} : { name: autoName(d.from, m) }) });

  const taken = useMemo(() => takenMap(mock, plan?.mr), [mock, plan?.mr]);
  const dirty = JSON.stringify(d) !== JSON.stringify(start);
  const rangeBad = !!d.from && !!d.to && d.to < d.from;
  const err = {
    name: touched.name && !d.name.trim() ? "กรุณาระบุชื่อแผน" : undefined,
    from: touched.from && !d.from ? "กรุณาเลือกเดือนเริ่มต้น" : undefined,
    to: touched.to && !d.to ? "กรุณาเลือกเดือนสิ้นสุด" : rangeBad ? "เดือนสิ้นสุดต้องไม่ก่อนเดือนเริ่มต้น" : undefined,
  };
  const complete = !!d.name.trim() && !!d.from && !!d.to && !rangeBad && d.cars.length > 0;

  useProtoForm({
    dirty,
    fill: () => {
      const free = VEHICLES.filter((v) => !taken[v.id]).slice(0, 4).map((v) => v.id);
      setD({ name: "ตรวจ ปจ.2 รอบ ธ.ค. 2569 – ก.พ. 2570", fy: "2570", from: "2026-12", to: "2027-02", cars: free });
      setNameEdited(false);
    },
    clear: () => { setD(start); setTouched({}); setNameEdited(edit); },
  });

  const leave = () => (dirty ? setLeaving(true) : router.push(plan ? "/detail/?mr=" + plan.mr : "/"));
  const save = () => {
    if (!complete) return;
    if (plan) {
      updatePlan(plan.mr, d);
      notify("บันทึกแผน " + plan.mr + " และส่งให้หัวหน้า กบค. อนุมัติอีกครั้งแล้ว");
      router.push("/detail/?mr=" + plan.mr);
    } else {
      const mr = createPlan(d);
      notify("สร้างแผนตรวจ ปจ.2 " + mr + " และส่งให้หัวหน้า กบค. อนุมัติแล้ว");
      router.push("/");
    }
  };

  const cars = d.cars.map((id) => VEHICLE_BY_ID[id]).filter(Boolean).map((v) => withDue(mock, v));   /* ครบกำหนดปัจจุบันจากทะเบียน ปจ.2 */
  const k = query.trim();
  const shownCars = cars.filter((v) => !k || v.plate.includes(k) || v.code.includes(k) || v.org.includes(k));
  const last = Math.max(1, Math.ceil(shownCars.length / PER)), pg = Math.min(page, last);
  const rows: TableValue[][] = shownCars.slice((pg - 1) * PER, pg * PER).map((v) => {
    const acts = [{ IconSwap: "delete-24-300-round", label: "เอาออก " + v.plate, onClick: () => put({ cars: d.cars.filter((c) => c !== v.id) }) }];
    return [{ text: v.plate, sub: v.code + " · " + v.type }, v.org, { text: v.owner, sub: v.tel }, { text: v.cycle + " เดือน", sub: v.cycleSub },
      { text: dateText(v.due), sub: dueSub(v.due) }, { actions: acts, mobileActions: acts }];
  });
  const rowKey = (r: TableValue[]) => (r[0] as { text: string }).text;
  const pagination = <TablePagination total={shownCars.length} page={pg} perPage={PER} onPage={setPage} />;
  const addBtn = <SecondaryButton key="add" Text="เพิ่มยานพาหนะ" LeadingIconSwap="add-24-300-round" Size={mob ? "lg" : "md"} onClick={() => setPicker(true)} />;
  const heading = edit ? "แก้ไขแผนตรวจ ปจ.2" : "สร้างแผนตรวจ ปจ.2";

  return (
    <>
      <PageHeader Title={heading} SupportingText={plan?.mr} onBack={leave}
        crumbs={[{ Text: "Safety Inspection" }, { Text: "แผนตรวจ ปจ.2", onClick: leave }, { Text: heading }]} />
      <div className="flex flex-col gap-8">
        {plan?.status === "returned" && <Alert Color="Error" Text="หัวหน้า กบค. ส่งกลับให้แก้ไข" SupportingText={(plan.returnReason ? plan.returnReason + " · " : "") + "แก้ไขแล้วกดบันทึกและส่งอนุมัติอีกครั้ง"} />}
        <section className="flex flex-col gap-4">
          <SectionHeader Title="ข้อมูลแผน" />
          <div className={cx("grid gap-4", mob ? "grid-cols-1" : "grid-cols-4")}>
            <TextInput className={mob ? undefined : "col-span-2"} LabelText="ชื่อแผน" Text={d.name} Placeholder="เลือกรอบตรวจแล้วระบบเติมให้ หรือพิมพ์เอง" onChange={(v) => { setNameEdited(true); put({ name: v }); }} onBlur={() => touch("name")}
              State={err.name ? "Error" : undefined} HelperText={err.name} />
            <InputDropdown LabelText="รอบตรวจ: เดือนเริ่มต้น" Text={d.from ? monthText(d.from) : ""} Placeholder="เลือกเดือน" open={dd === "from"} onOpenChange={ddOpen("from")}
              State={err.from ? "Error" : undefined} HelperText={err.from}>
              <DropdownList>{MONTH_OPTIONS.map((m) => <DropdownListItem key={m} Text={monthText(m)} State={m === d.from ? "Selected" : "Default"}
                onClick={() => { pickFrom(m); setDd(""); }} />)}</DropdownList>
            </InputDropdown>
            <InputDropdown LabelText="รอบตรวจ: เดือนสิ้นสุด" Text={d.to ? monthText(d.to) : ""} Placeholder="เลือกเดือน" open={dd === "to"} onOpenChange={ddOpen("to")}
              State={err.to ? "Error" : undefined} HelperText={err.to}>
              <DropdownList emptyText={d.from ? undefined : "เลือกเดือนเริ่มต้นก่อน"}>{(d.from ? MONTH_OPTIONS.filter((m) => m >= d.from) : []).map((m) => <DropdownListItem key={m} Text={monthText(m)} State={m === d.to ? "Selected" : "Default"}
                onClick={() => { pickTo(m); setDd(""); }} />)}</DropdownList>
            </InputDropdown>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader Title="ยานพาหนะในแผน" Badge={cars.length + " คัน"}
            SupportingText="วาระและวันครบกำหนดดึงจากทะเบียนการตรวจ ปจ.2 · ผู้รับจ้างและค่าจ้างตรวจกำหนดตอนสร้างแผนเดินทาง หลังแผนอนุมัติ" />
          {cars.length ? <>
            <TableHeader Placeholder="ค้นหาทะเบียน, รหัส, สังกัด" query={query} onQuery={(v) => { setQuery(v); setPage(1); }} FilterButton={false} Actions={addBtn} />
            {!shownCars.length ? <EmptyStateSearchNotFound Text="ไม่พบยานพาหนะ" />
              : mob ? <div className="flex flex-col gap-5"><MobileCards columns={COLS} rows={rows} rowKey={rowKey} />{pagination}</div>
              : <Table columns={COLS} rows={rows} rowKey={rowKey} Pagination={pagination} />}
          </> : (
            <EmptyStateDataEmpty Graphic="vehicle" Text="ยังไม่มียานพาหนะในแผน" SupportingText="เพิ่มยานพาหนะประเภท 09 ที่ต้องตรวจ ปจ.2 อย่างน้อย 1 คัน" Actions={addBtn} />
          )}
        </section>

        <div className={cx("flex", mob ? "gap-4 [&>*]:flex-1 [&>*]:basis-0" : "justify-between gap-3")}>
          <SecondaryButton Text={edit ? "ยกเลิก" : "ย้อนกลับ"} Size="lg" onClick={leave} />
          <PrimaryButton Text="บันทึกและส่งอนุมัติ" Size="lg" State={complete ? "Default" : "Disabled"} onClick={save} />
        </div>
      </div>
      <VehiclePicker open={picker} from={d.from} to={d.to} pool={vehiclesNow(mock).filter((v) => !d.cars.includes(v.id))} taken={taken} onCancel={() => setPicker(false)}
        onAdd={(ids) => { put({ cars: [...d.cars, ...ids] }); setPicker(false); notify("เพิ่มยานพาหนะเข้าแผน " + ids.length + " คันแล้ว"); }} />
      <ConfirmDialog spec={leaving ? LEAVE : null} onCancel={() => setLeaving(false)} onOk={() => { setLeaving(false); router.push(plan ? "/detail/?mr=" + plan.mr : "/"); }} />
    </>
  );
}
