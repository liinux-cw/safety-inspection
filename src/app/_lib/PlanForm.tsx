"use client";
/* ฟอร์มสร้าง/แก้ไขแผนตรวจ ปจ.2 (กบค.) — อิงฟอร์มสร้างแผนของต้นแบบบำรุงรักษาตามวาระ แต่ไม่มีแท็บไตรมาสและไม่มีอะไหล่
   3 section: ข้อมูลแผน (ชื่อแผน · ปีงบอัตโนมัติ · รอบตรวจ) · ข้อมูลผู้รับจ้าง (ผู้รับจ้าง · เบอร์ · เลขที่สัญญา — แยก section ให้ย้ายไปแผนเดินทางได้ทั้งก้อน)
   · ยานพาหนะในแผน: ตาราง + ค่าจ้างตรวจตามสัญญารายคัน (กำหนดทีละคันจากไอคอนท้ายแถว หรือติ๊กหลายคันแล้วกำหนดพร้อมกัน) + "เพิ่มยานพาหนะ" (VehiclePicker) · เอาออกทีละคัน
   "บันทึกและส่งอนุมัติ" กดได้เมื่อกรอกครบ + มียานพาหนะอย่างน้อย 1 คัน · ออกจากหน้าตอนแก้ค้าง = ยืนยันก่อน */
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckTable } from "@/components/patterns/CheckTable";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { FormModal } from "@/components/patterns/FormModal";
import { Alert } from "@/components/vms/Alert";
import { DropdownList } from "@/components/vms/DropdownList";
import { DropdownListItem } from "@/components/vms/DropdownListItem";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { EmptyStateSearchNotFound } from "@/components/vms/EmptyStateSearchNotFound";
import { InputDropdown } from "@/components/vms/InputDropdown";
import { PageHeader } from "@/components/vms/PageHeader";
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { SectionHeader } from "@/components/vms/SectionHeader";
import type { TableColumn } from "@/components/vms/Table";
import { TableHeader } from "@/components/vms/TableHeader";
import { TablePagination } from "@/components/vms/TablePagination";
import { TextInput } from "@/components/vms/TextInput";
import { cx } from "@/lib/cx";
import { MONTH_OPTIONS, VEHICLES, VEHICLE_BY_ID, VENDORS, VENDOR_BY_ID, bahtText, dateText, dueSub, fiscalYearOf, monthText, rangeText, type Plan } from "@/lib/mock/data";
import { EMPTY_DRAFT, budget, contractCost, createPlan, draftOf, fyRange, hasWork, takenMap, updatePlan, type Draft } from "@/lib/mock/plan";
import { notify, useMock } from "@/lib/mock/store";
import { useProtoForm } from "@/lib/protoForm";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { VehiclePicker } from "./VehiclePicker";

const COLS: TableColumn[] = [
  { head: "ทะเบียน", width: 220 },
  { head: "สังกัด", width: 150 },
  { head: "ผู้ครอบครอง/เบอร์ติดต่อ" },
  { head: "วาระ", width: 90 },
  { head: "ครบกำหนดตรวจ", width: 150 },
  { head: "ค่าจ้างตรวจ (บาท)", width: 160 },
  { head: "", width: 104 },
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
  /* ค่าจ้างรายคัน: costFor = รหัสยานพาหนะที่กำลังกำหนด (1 คัน หรือหลายคันที่ติ๊ก) */
  const [ticked, setTicked] = useState<string[]>([]);
  const [costFor, setCostFor] = useState<string[] | null>(null);
  const [costText, setCostText] = useState("");
  const openCost = (ids: string[]) => { setCostFor(ids); setCostText(ids.length === 1 && d.costs[ids[0]] ? String(d.costs[ids[0]]) : ""); };
  const costN = Number(costText);
  const applyCost = () => {
    if (!costFor || !(costN > 0)) return;
    put({ costs: { ...d.costs, ...Object.fromEntries(costFor.map((id) => [id, costN])) } });
    notify("กำหนดค่าจ้างตรวจ " + bahtText(costN) + " ให้ " + costFor.length + " คันแล้ว");
    setCostFor(null); setTicked([]);
  };
  const autoName = (from: string, to: string) => (from && to ? "ตรวจ ปจ.2 รอบ " + rangeText(from, to) : "");
  /* C: ปีงบคิดจากเดือนเริ่มต้น · เดือนสิ้นสุดต้องอยู่ปีงบเดียวกันและไม่ก่อนเดือนเริ่มต้น */
  const pickFrom = (m: string) => {
    const fy = fiscalYearOf(m), r = fyRange(fy);
    const to = d.to && d.to >= m && d.to <= r.to ? d.to : "";
    put({ from: m, fy, to, ...(nameEdited ? {} : { name: autoName(m, to) }) });
  };
  const pickTo = (m: string) => put({ to: m, ...(nameEdited ? {} : { name: autoName(d.from, m) }) });
  /* A: มีผลตรวจจากผู้รับจ้างแล้ว → เปลี่ยนผู้รับจ้าง/เอาคันนั้นออกไม่ได้ */
  const worked = (id: string) => !!plan && hasWork(mock, plan.mr, id);
  const vendorLocked = !!plan && plan.cars.some(worked);

  const taken = useMemo(() => takenMap(mock, plan?.mr), [mock, plan?.mr]);
  const dirty = JSON.stringify(d) !== JSON.stringify(start);
  const rangeBad = !!d.from && !!d.to && d.to < d.from;
  const noCost = d.cars.filter((id) => !(contractCost(d, id) > 0));
  const err = {
    name: touched.name && !d.name.trim() ? "กรุณาระบุชื่อแผน" : undefined,
    from: touched.from && !d.from ? "กรุณาเลือกเดือนเริ่มต้น" : undefined,
    to: touched.to && !d.to ? "กรุณาเลือกเดือนสิ้นสุด" : rangeBad ? "เดือนสิ้นสุดต้องไม่ก่อนเดือนเริ่มต้น" : undefined,
    vendor: touched.vendor && !d.vendor ? "กรุณาเลือกผู้รับจ้าง" : undefined,
    vendorTel: touched.vendorTel && !d.vendorTel.trim() ? "กรุณาระบุเบอร์โทรผู้รับจ้าง" : undefined,
  };
  const complete = !!d.name.trim() && !!d.fy && !!d.from && !!d.to && !rangeBad && !!d.vendor && !!d.vendorTel.trim() && d.cars.length > 0 && noCost.length === 0;

  useProtoForm({
    dirty,
    fill: () => {
      const free = VEHICLES.filter((v) => !taken[v.id]).slice(0, 4).map((v) => v.id);
      setD({ name: "ตรวจ ปจ.2 รอบ ธ.ค. 2569 – ก.พ. 2570", fy: "2570", from: "2026-12", to: "2027-02", vendor: "ven3", vendorTel: "02-555-0303", contract: "PO-2570-0150", costs: Object.fromEntries(free.map((id, i) => [id, i % 2 ? 9500 : 9000])), cars: free });
      setNameEdited(false);
    },
    clear: () => { setD(start); setTouched({}); setNameEdited(edit); setTicked([]); },
  });

  const leave = () => (dirty ? setLeaving(true) : router.push(plan ? "/detail/?mr=" + plan.mr : "/"));
  const save = () => {
    if (!complete) return;
    const done = d;
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
  const removeCar = (id: string) => (worked(id)
    ? notify("เอา " + VEHICLE_BY_ID[id].plate + " ออกไม่ได้ ผู้รับจ้างบันทึกผลตรวจคันนี้แล้ว", "Error")
    : (put({ cars: d.cars.filter((c) => c !== id) }), setTicked(ticked.filter((c) => c !== id))));
  const rows = shownCars.slice((pg - 1) * PER, pg * PER).map((v) => {
    const cost = contractCost(d, v.id);
    const acts = [
      { IconSwap: "payments-24-300-round", label: "กำหนดค่าจ้าง " + v.plate, onClick: () => openCost([v.id]) },
      { IconSwap: "delete-24-300-round", label: "เอาออก " + v.plate, onClick: () => removeCar(v.id) },
    ];
    return {
      key: v.id, text: v.plate, sub: worked(v.id) ? v.code + " · มีผลตรวจแล้ว เอาออกไม่ได้" : v.code + " · " + v.type,
      mobileSub: v.org + " · " + (cost > 0 ? bahtText(cost) : "ยังไม่กำหนดค่าจ้าง"),
      cells: [v.org, { text: v.owner, sub: v.tel }, v.cycle + " เดือน", { text: dateText(v.due), sub: dueSub(v.due) },
        cost > 0 ? bahtText(cost) : { text: "ยังไม่กำหนด", sub: "กดไอคอนกำหนดค่าจ้าง" }, { actions: acts }],
      mobileActions: acts,
    };
  });
  const setCostBtn = ticked.length ? <SecondaryButton key="cost" Text={"กำหนดค่าจ้าง (" + ticked.length + " คัน)"} LeadingIconSwap="payments-24-300-round" Size={mob ? "lg" : "md"} onClick={() => openCost(ticked)} /> : null;
  const addBtn = <SecondaryButton key="add" Text="เพิ่มยานพาหนะ" LeadingIconSwap="add-24-300-round" Size={mob ? "lg" : "md"} onClick={() => setPicker(true)} />;
  const vendor = VENDOR_BY_ID[d.vendor];
  const heading = edit ? "แก้ไขแผนตรวจ ปจ.2" : "สร้างแผนตรวจ ปจ.2";

  return (
    <>
      <PageHeader Title={heading} SupportingText={plan?.mr} onBack={leave}
        crumbs={[{ Text: "งานซ่อมและบำรุงรักษา" }, { Text: "แผนตรวจ ปจ.2", onClick: leave }, { Text: heading }]} />
      <div className="flex flex-col gap-8">
        {plan?.status === "returned" && <Alert Color="Error" Text="ผู้อนุมัติส่งกลับให้แก้ไข" SupportingText="แก้ไขแล้วกดบันทึกและส่งอนุมัติอีกครั้ง" />}
        <section className="flex flex-col gap-4">
          <SectionHeader Title="ข้อมูลแผน" />
          <div className={cx("grid gap-4", mob ? "grid-cols-1" : "grid-cols-2")}>
            <TextInput LabelText="ชื่อแผน" Text={d.name} Placeholder="เลือกรอบตรวจแล้วระบบเติมให้ หรือพิมพ์เอง" onChange={(v) => { setNameEdited(true); put({ name: v }); }} onBlur={() => touch("name")}
              State={err.name ? "Error" : undefined} HelperText={err.name} />
            <TextInput LabelText="ปีงบประมาณ" Text={d.fy} Placeholder="เลือกเดือนเริ่มต้นก่อน" State="Readonly" readOnly HelperText="คิดให้อัตโนมัติจากเดือนเริ่มต้น (ปีงบ ต.ค. – ก.ย.)" />
            <InputDropdown LabelText="รอบตรวจ: เดือนเริ่มต้น" Text={d.from ? monthText(d.from) : ""} Placeholder="เลือกเดือน" open={dd === "from"} onOpenChange={ddOpen("from")}
              State={err.from ? "Error" : undefined} HelperText={err.from}>
              <DropdownList>{MONTH_OPTIONS.map((m) => <DropdownListItem key={m} Text={monthText(m)} State={m === d.from ? "Selected" : "Default"}
                onClick={() => { pickFrom(m); setDd(""); }} />)}</DropdownList>
            </InputDropdown>
            <InputDropdown LabelText="รอบตรวจ: เดือนสิ้นสุด" Text={d.to ? monthText(d.to) : ""} Placeholder="เลือกเดือน" open={dd === "to"} onOpenChange={ddOpen("to")}
              State={err.to ? "Error" : undefined} HelperText={err.to}>
              <DropdownList emptyText={d.from ? undefined : "เลือกเดือนเริ่มต้นก่อน"}>{(d.from ? MONTH_OPTIONS.filter((m) => m >= d.from && m <= fyRange(d.fy).to) : []).map((m) => <DropdownListItem key={m} Text={monthText(m)} State={m === d.to ? "Selected" : "Default"}
                onClick={() => { pickTo(m); setDd(""); }} />)}</DropdownList>
            </InputDropdown>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader Title="ข้อมูลผู้รับจ้าง" SupportingText="ผู้รับจ้างเห็นแผนทันทีหลังสร้าง และบันทึกผลตรวจได้เมื่อแผนอนุมัติแล้ว" />
          <div className={cx("grid gap-4", mob ? "grid-cols-1" : "grid-cols-2")}>
            {vendorLocked ? <TextInput LabelText="ผู้รับจ้าง" Text={vendor?.name ?? ""} State="Readonly" readOnly HelperText="เปลี่ยนไม่ได้ ผู้รับจ้างบันทึกผลตรวจในแผนนี้แล้ว" /> :
            <InputDropdown LabelText="ผู้รับจ้าง" Text={vendor?.name ?? ""} Placeholder="เลือกผู้รับจ้าง" open={dd === "vendor"} onOpenChange={ddOpen("vendor")}
              State={err.vendor ? "Error" : undefined} HelperText={err.vendor}>
              <DropdownList>{VENDORS.map((v) => <DropdownListItem key={v.id} Text={v.name} SupportingText={v.tel} State={v.id === d.vendor ? "Selected" : "Default"}
                onClick={() => { put({ vendor: v.id, vendorTel: v.tel }); setDd(""); }} />)}</DropdownList>
            </InputDropdown>}
            <TextInput LabelText="เบอร์โทรผู้รับจ้าง" Text={d.vendorTel} Placeholder="0XX-XXX-XXXX" onChange={(v) => put({ vendorTel: v })} onBlur={() => touch("vendorTel")}
              State={err.vendorTel ? "Error" : undefined} HelperText={err.vendorTel} />
            <TextInput LabelText="เลขที่สัญญา/ใบสั่งจ้าง" Optional Text={d.contract} Placeholder="ระบุเลขที่สัญญาหรือใบสั่งจ้าง" onChange={(v) => put({ contract: v })} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader Title="ยานพาหนะในแผน" Badge={cars.length + " คัน · งบรวม " + bahtText(budget(d))}
            SupportingText="วาระและวันครบกำหนดดึงจากทะเบียนการตรวจ ปจ.2 · ค่าจ้างตรวจกำหนดรายคัน (ผู้รับจ้างเห็นเป็นค่าตั้งต้นของคันนั้น)" />
          {cars.length > 0 && noCost.length > 0 && <Alert Color="Warning" Text={"ยังไม่กำหนดค่าจ้างตรวจ " + noCost.length + " คัน"} SupportingText="ติ๊กหลายคันแล้วกด กำหนดค่าจ้าง เพื่อใส่ค่าเดียวกันพร้อมกัน หรือกดไอคอนท้ายแถวทีละคัน" />}
          {cars.length ? <>
            <TableHeader Placeholder="ค้นหาทะเบียน, รหัส, สังกัด" query={query} onQuery={(v) => { setQuery(v); setPage(1); }} FilterButton={false} Actions={setCostBtn ? <div className="flex flex-wrap gap-3">{setCostBtn}{addBtn}</div> : addBtn} />
            {!shownCars.length ? <EmptyStateSearchNotFound Text="ไม่พบยานพาหนะ" />
              : <CheckTable columns={COLS} rows={rows} ticked={ticked} onTicked={setTicked} scope={shownCars.map((v) => ({ key: v.id }))}
                  Pagination={<TablePagination total={shownCars.length} page={pg} perPage={PER} onPage={setPage} />} />}
          </> : (
            <EmptyStateDataEmpty Graphic="vehicle" Text="ยังไม่มียานพาหนะในแผน" SupportingText="เพิ่มยานพาหนะประเภท 09 ที่ต้องตรวจ ปจ.2 อย่างน้อย 1 คัน" Actions={addBtn} />
          )}
        </section>

        <div className={cx("flex", mob ? "gap-4 [&>*]:flex-1 [&>*]:basis-0" : "justify-between gap-3")}>
          <SecondaryButton Text={edit ? "ยกเลิก" : "ย้อนกลับ"} Size="lg" onClick={leave} />
          <PrimaryButton Text="บันทึกและส่งอนุมัติ" Size="lg" State={complete ? "Default" : "Disabled"} onClick={save} />
        </div>
      </div>
      <VehiclePicker open={picker} from={d.from} to={d.to} pool={VEHICLES.filter((v) => !d.cars.includes(v.id))} taken={taken} onCancel={() => setPicker(false)}
        onAdd={(ids) => { put({ cars: [...d.cars, ...ids] }); setPicker(false); notify("เพิ่มยานพาหนะเข้าแผน " + ids.length + " คันแล้ว"); }} />
      <FormModal open={!!costFor} title={"กำหนดค่าจ้างตรวจ" + (costFor && costFor.length === 1 ? " · " + VEHICLE_BY_ID[costFor[0]].plate : " · " + (costFor?.length ?? 0) + " คัน")}
        sub={costFor && costFor.length > 1 ? "ใส่ค่าเดียวกันให้ทุกคันที่ติ๊ก" : "ค่าจ้างตามสัญญาของยานพาหนะคันนี้"}
        fields={[{ label: "ค่าจ้างตรวจ (บาท)", value: costText, placeholder: "0.00", error: costText && !(costN > 0) ? "กรุณาระบุจำนวนเงินมากกว่า 0" : undefined }]}
        onField={(_, v) => setCostText(v.replace(/[^\d.]/g, ""))} ok="บันทึก" okDisabled={!(costN > 0)} onOk={applyCost} onCancel={() => setCostFor(null)} />
      <ConfirmDialog spec={leaving ? LEAVE : null} onCancel={() => setLeaving(false)} onOk={() => { setLeaving(false); router.push(plan ? "/detail/?mr=" + plan.mr : "/"); }} />
    </>
  );
}
