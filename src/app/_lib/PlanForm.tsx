"use client";
/* ฟอร์มสร้าง/แก้ไขแผนตรวจ ปจ.2 (กบค.) — อิงฟอร์มสร้างแผนของต้นแบบบำรุงรักษาตามวาระ แต่ไม่มีแท็บไตรมาสและไม่มีอะไหล่
   ข้อมูลแผน: ชื่อแผน · ปีงบประมาณ · รอบตรวจ (เดือน ถึง เดือน) · ผู้รับจ้าง (ผู้รับจ้างเห็นแผนนี้ในเมนูเอกสาร ปจ.2 หลังอนุมัติ)
   ยานพาหนะในแผน: ตาราง + ปุ่ม "เพิ่มยานพาหนะ" (VehiclePicker) · เอาออกทีละคัน
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
import { JOB_TYPES, MONTH_OPTIONS, VEHICLES, VEHICLE_BY_ID, VENDORS, VENDOR_BY_ID, dateText, dueSub, fiscalYearOf, monthText, type Plan } from "@/lib/mock/data";
import { EMPTY_DRAFT, createPlan, draftOf, takenMap, updatePlan, type Draft } from "@/lib/mock/plan";
import { notify, useMock } from "@/lib/mock/store";
import { useProtoForm } from "@/lib/protoForm";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { VehiclePicker } from "./VehiclePicker";

const COLS: TableColumn[] = [
  { head: "ทะเบียน", width: 210, Style: "Lead text" },
  { head: "ประเภทยานพาหนะ", width: 160 },
  { head: "สังกัด", width: 150 },
  { head: "ผู้ครอบครอง/เบอร์ติดต่อ" },
  { head: "วาระการตรวจ", width: 120 },
  { head: "ครบกำหนดตรวจ", width: 160 },
  { head: "", width: 72 },
];
const YEARS = ["2570", "2571"];
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

  const taken = useMemo(() => takenMap(mock, plan?.mr), [mock, plan?.mr]);
  const dirty = JSON.stringify(d) !== JSON.stringify(start);
  const rangeBad = !!d.from && !!d.to && d.to < d.from;
  const err = {
    jobType: touched.jobType && !d.jobType ? "กรุณาเลือกประเภทงาน" : undefined,
    name: touched.name && !d.name.trim() ? "กรุณาระบุชื่อแผน" : undefined,
    fy: touched.fy && !d.fy ? "กรุณาเลือกปีงบประมาณ" : undefined,
    from: touched.from && !d.from ? "กรุณาเลือกเดือนเริ่มต้น" : undefined,
    to: touched.to && !d.to ? "กรุณาเลือกเดือนสิ้นสุด" : rangeBad ? "เดือนสิ้นสุดต้องไม่ก่อนเดือนเริ่มต้น" : undefined,
    vendor: touched.vendor && !d.vendor ? "กรุณาเลือกผู้รับจ้าง" : undefined,
  };
  const complete = !!d.jobType && !!d.name.trim() && !!d.fy && !!d.from && !!d.to && !rangeBad && !!d.vendor && d.cars.length > 0;

  useProtoForm({
    dirty,
    fill: () => {
      const free = VEHICLES.filter((v) => !taken[v.id]).slice(0, 4).map((v) => v.id);
      setD({ jobType: "งานบำรุงรักษา", name: "ตรวจ ปจ.2 รอบ มี.ค. – พ.ค. 2570", fy: "2570", from: "2027-03", to: "2027-05", vendor: "ven3", cars: free });
    },
    clear: () => { setD(start); setTouched({}); },
  });

  const leave = () => (dirty ? setLeaving(true) : router.push(plan ? "/detail/?mr=" + plan.mr : "/"));
  const save = () => {
    if (!complete || !d.jobType) return;
    const done = { ...d, jobType: d.jobType };
    if (plan) {
      updatePlan(plan.mr, done);
      notify("บันทึกและส่งอนุมัติแผน " + plan.mr + " สำเร็จ");
      router.push("/detail/?mr=" + plan.mr);
    } else {
      const mr = createPlan(done);
      notify("สร้างแผนตรวจ ปจ.2 " + mr + " และส่งอนุมัติสำเร็จ");
      router.push("/");
    }
  };

  const cars = d.cars.map((id) => VEHICLE_BY_ID[id]).filter(Boolean);
  const k = query.trim();
  const shownCars = cars.filter((v) => !k || v.plate.includes(k) || v.code.includes(k) || v.org.includes(k));
  const last = Math.max(1, Math.ceil(shownCars.length / PER)), pg = Math.min(page, last);
  const removeCar = (id: string) => put({ cars: d.cars.filter((c) => c !== id) });
  const rows: TableValue[][] = shownCars.slice((pg - 1) * PER, pg * PER).map((v) => {
    const del = { IconSwap: "delete-24-300-round", label: "เอาออก " + v.plate, onClick: () => removeCar(v.id) };
    return [
      { text: v.plate, sub: v.code }, v.type, v.org, { text: v.owner, sub: v.tel }, v.cycle + " เดือน",
      { text: dateText(v.due), sub: dueSub(v.due) },
      { actions: [del], mobileActions: [del] },
    ];
  });
  const rowKey = (r: TableValue[]) => { const v = r[0]; return v && typeof v === "object" && "text" in v ? v.text : String(v); };
  const addBtn = <SecondaryButton key="add" Text="เพิ่มยานพาหนะ" LeadingIconSwap="add-24-300-round" Size={mob ? "lg" : "md"} onClick={() => setPicker(true)} />;
  const vendor = VENDOR_BY_ID[d.vendor];
  const heading = edit ? "แก้ไขแผนตรวจ ปจ.2" : "สร้างแผนตรวจ ปจ.2";

  return (
    <>
      <PageHeader Title={heading} SupportingText={plan?.mr} onBack={leave}
        crumbs={[{ Text: "Safety Inspection" }, { Text: "แผนตรวจ ปจ.2", onClick: leave }, { Text: heading }]} />
      <div className="flex flex-col gap-8">
        {plan?.status === "returned" && <Alert Color="Error" Text="ผู้อนุมัติส่งกลับให้แก้ไข" SupportingText="แก้ไขแล้วกดบันทึกและส่งอนุมัติอีกครั้ง" />}
        <section className="flex flex-col gap-4">
          <SectionHeader Title="ข้อมูลแผน" />
          <div className={cx("grid gap-4", mob ? "grid-cols-1" : "grid-cols-2")}>
            <TextInput LabelText="ชื่อแผน" Text={d.name} Placeholder="ระบุชื่อแผน" onChange={(v) => put({ name: v })} onBlur={() => touch("name")}
              State={err.name ? "Error" : undefined} HelperText={err.name} />
            <InputDropdown LabelText="ประเภทงาน" Text={d.jobType} Placeholder="เลือกประเภทงาน" open={dd === "jobType"} onOpenChange={ddOpen("jobType")}
              State={err.jobType ? "Error" : undefined} HelperText={err.jobType}>
              <DropdownList>{JOB_TYPES.map((t) => <DropdownListItem key={t} Text={t} State={t === d.jobType ? "Selected" : "Default"} onClick={() => { put({ jobType: t }); setDd(""); }} />)}</DropdownList>
            </InputDropdown>
            <InputDropdown LabelText="ปีงบประมาณ" Text={d.fy} Placeholder="เลือกปีงบประมาณ" open={dd === "fy"} onOpenChange={ddOpen("fy")}
              State={err.fy ? "Error" : undefined} HelperText={err.fy}>
              <DropdownList>{YEARS.map((y) => <DropdownListItem key={y} Text={y} State={y === d.fy ? "Selected" : "Default"} onClick={() => { put({ fy: y }); setDd(""); }} />)}</DropdownList>
            </InputDropdown>
            <InputDropdown LabelText="ผู้รับจ้าง" Text={vendor?.name ?? ""} SupportingText={vendor ? "โทร " + vendor.tel : undefined} Placeholder="เลือกผู้รับจ้าง" open={dd === "vendor"} onOpenChange={ddOpen("vendor")}
              State={err.vendor ? "Error" : undefined} HelperText={err.vendor ?? "ผู้รับจ้างจะเห็นแผนนี้ทันทีหลังสร้าง เพื่ออัปโหลดเอกสาร ปจ.2 ส่งให้ กบค. อนุมัติ"}>
              <DropdownList>{VENDORS.map((v) => <DropdownListItem key={v.id} Text={v.name} SupportingText={v.tel} State={v.id === d.vendor ? "Selected" : "Default"}
                onClick={() => { put({ vendor: v.id }); setDd(""); }} />)}</DropdownList>
            </InputDropdown>
            <InputDropdown LabelText="รอบตรวจ: เดือนเริ่มต้น" Text={d.from ? monthText(d.from) : ""} Placeholder="เลือกเดือน" open={dd === "from"} onOpenChange={ddOpen("from")}
              State={err.from ? "Error" : undefined} HelperText={err.from}>
              <DropdownList>{MONTH_OPTIONS.map((m) => <DropdownListItem key={m} Text={monthText(m)} State={m === d.from ? "Selected" : "Default"}
                onClick={() => { put({ from: m, fy: d.fy || fiscalYearOf(m) }); setDd(""); }} />)}</DropdownList>
            </InputDropdown>
            <InputDropdown LabelText="รอบตรวจ: เดือนสิ้นสุด" Text={d.to ? monthText(d.to) : ""} Placeholder="เลือกเดือน" open={dd === "to"} onOpenChange={ddOpen("to")}
              State={err.to ? "Error" : undefined} HelperText={err.to}>
              <DropdownList>{MONTH_OPTIONS.filter((m) => !d.from || m >= d.from).map((m) => <DropdownListItem key={m} Text={monthText(m)} State={m === d.to ? "Selected" : "Default"}
                onClick={() => { put({ to: m }); setDd(""); }} />)}</DropdownList>
            </InputDropdown>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader Title="ยานพาหนะในแผน" Badge={cars.length + " คัน"} SupportingText="วาระและวันครบกำหนดดึงจากทะเบียนการตรวจ ปจ.2" />
          {cars.length ? <>
            <TableHeader Placeholder="ค้นหาทะเบียน, รหัส, สังกัด" query={query} onQuery={(v) => { setQuery(v); setPage(1); }} FilterButton={false} Actions={addBtn} />
            {!shownCars.length ? <EmptyStateSearchNotFound Text="ไม่พบยานพาหนะ" />
              : mob ? (
                <div className="flex flex-col gap-5">
                  <MobileCards columns={COLS} rows={rows} rowKey={rowKey} />
                  <TablePagination total={shownCars.length} page={pg} perPage={PER} onPage={setPage} />
                </div>
              ) : <Table columns={COLS} rows={rows} rowKey={rowKey} Pagination={<TablePagination total={shownCars.length} page={pg} perPage={PER} onPage={setPage} />} />}
          </> : (
            <EmptyStateDataEmpty Graphic="vehicle" Text="ยังไม่มียานพาหนะในแผน" SupportingText="เพิ่มยานพาหนะประเภท 09 ที่ต้องตรวจ ปจ.2 อย่างน้อย 1 คัน" Actions={addBtn} />
          )}
        </section>

        <div className={cx("flex", mob ? "gap-4 [&>*]:flex-1 [&>*]:basis-0" : "justify-between gap-3")}>
          <SecondaryButton Text={edit ? "ยกเลิก" : "ย้อนกลับ"} Size="lg" onClick={leave} />
          <PrimaryButton Text="บันทึกและส่งอนุมัติ" Size="lg" State={complete ? "Default" : "Disabled"} onClick={save} />
        </div>
      </div>
      <VehiclePicker open={picker} pool={VEHICLES.filter((v) => !d.cars.includes(v.id))} taken={taken} onCancel={() => setPicker(false)}
        onAdd={(ids) => { put({ cars: [...d.cars, ...ids] }); setPicker(false); notify("เพิ่มยานพาหนะเข้าแผน " + ids.length + " คันแล้ว"); }} />
      <ConfirmDialog spec={leaving ? LEAVE : null} onCancel={() => setLeaving(false)} onOk={() => { setLeaving(false); router.push(plan ? "/detail/?mr=" + plan.mr : "/"); }} />
    </>
  );
}
