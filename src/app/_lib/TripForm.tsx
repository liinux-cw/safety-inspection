"use client";
/* ฟอร์มสร้าง/แก้ไขแผนเดินทาง (กบค.) — /trip/new/?mr= · /trip/edit/?id=
   แบบ TripForm "จ้างดำเนินการ" ของต้นแบบบำรุงรักษาตามวาระ (src/app/quarter/_shared/TripForm.tsx) แต่ไม่มีไตรมาส ไม่มีอะไหล่ ไม่มีโหมดดำเนินการเอง
   สร้างหลังหัวหน้า กบค. อนุมัติแผน · บันทึก = ส่งหัวหน้า กบค. อนุมัติ · เลือกผู้รับจ้าง + ค่าจ้างตรวจรายคันที่นี่ (เจ้าของงาน 20 พ.ย. 2569)
   section: ข้อมูลแผนเดินทาง (ชื่อ · ช่วงวันทำงาน) · ผู้รับจ้าง (ผู้รับจ้าง · เบอร์ · เลขที่สัญญา) · ยานพาหนะในแผนเดินทาง (คันของแผนที่ยังไม่อยู่ในแผนเดินทางอื่น
   + สถานที่ตรวจ/ผู้ดูแล/วันดำเนินการแก้รายคันใน popup + ค่าจ้างพิมพ์ในตาราง หรือติ๊กหลายคันแล้วกำหนดพร้อมกัน) */
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { CheckTable } from "@/components/patterns/CheckTable";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { FormModal } from "@/components/patterns/FormModal";
import { Alert } from "@/components/vms/Alert";
import { CardFormRow } from "@/components/vms/CardFormRow";
import { DatePicker } from "@/components/vms/DatePicker";
import { DropdownList } from "@/components/vms/DropdownList";
import { DropdownListItem } from "@/components/vms/DropdownListItem";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { InputDropdown } from "@/components/vms/InputDropdown";
import { PageHeader } from "@/components/vms/PageHeader";
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { SectionHeader } from "@/components/vms/SectionHeader";
import type { TableColumn } from "@/components/vms/Table";
import { TablePagination } from "@/components/vms/TablePagination";
import { TextInput } from "@/components/vms/TextInput";
import { cx } from "@/lib/cx";
import { TODAY, VEHICLE_BY_ID, VENDORS, VENDOR_BY_ID, bahtText, dateText, dayRange, moneyInput, moneyText, moneyValue, type Plan, type Trip, type Vehicle } from "@/lib/mock/data";
import { EMPTY_TRIP, budget, contractCost, createTrip, freeCars, hasWork, tripDraftOf, updateTrip, type TripDraft } from "@/lib/mock/plan";
import { withDue } from "@/lib/mock/registry";
import { notify, useMock } from "@/lib/mock/store";
import { useProtoForm } from "@/lib/protoForm";
import { TH_PICKER } from "@/lib/thaiDate";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { useOutside } from "@/lib/useOutside";
import { VehiclePicker } from "./VehiclePicker";

const COLS: TableColumn[] = [
  { head: "ทะเบียน", width: 240 },
  { head: "สถานที่ตรวจ / ผู้ดูแลยานพาหนะ" },
  { head: "วันดำเนินการ", width: 200 },
  { head: "ค่าจ้างตรวจ (บาท)", width: 160 },
  { head: "", width: 104 },
];
const PER = 10;
const LEAVE = { title: "ยืนยันการออกจากหน้านี้", sub: "ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก", cancel: "อยู่ต่อ", ok: "ออกจากหน้านี้", danger: true };
const toDate = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const toIso = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
/** ค่าเริ่มต้นรายคัน: สถานที่ = สำนักงานสังกัด · ผู้ดูแล/เบอร์ = ผู้ครอบครอง · วันดำเนินการ = ช่วงวันทำงานของแผนเดินทาง */
export const tripLoc = (t: Pick<Trip, "locs">, v: Vehicle) => t.locs[v.id] || "สำนักงาน " + v.org;
export const tripContact = (t: Pick<Trip, "names" | "phones">, v: Vehicle) => (t.names[v.id] || v.owner) + " · " + (t.phones[v.id] || v.tel);
export const tripWork = (t: Pick<Trip, "works" | "d1" | "d2">, id: string): [string, string] => t.works[id] ?? [t.d1, t.d2];

export function TripForm({ plan, trip }: { plan: Plan; trip?: Trip }) {
  const router = useRouter();
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const edit = !!trip;
  const start = useMemo(() => (trip ? tripDraftOf(trip) : EMPTY_TRIP), [trip]);
  const [d, setD] = useState<TripDraft>(start);
  const put = (p: Partial<TripDraft>) => setD((x) => ({ ...x, ...p }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));
  const [dd, setDd] = useState(false);
  const [picker, setPicker] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [page, setPage] = useState(1);
  const [editCar, setEditCar] = useState<string | null>(null);
  /* ช่วงวันทำงาน: ปฏิทินลอยใต้ช่อง (มือถือแสดงใต้ช่อง) */
  const [cal, setCal] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const closeCal = useCallback(() => { setCal(false); setTouched((t) => ({ ...t, d1: true })); }, []);
  useOutside(dateRef, cal && !mob, closeCal);
  /* ค่าจ้างรายคัน (แบบเดิมของฟอร์มแผน): พิมพ์ในตาราง · ติ๊กหลายคัน = กำหนดพร้อมกัน */
  const [ticked, setTicked] = useState<string[]>([]);
  const [costFor, setCostFor] = useState<string[] | null>(null);
  const [costText, setCostText] = useState("");
  const toInputs = (c: Record<string, number>) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, moneyText(v)]));
  const [costIn, setCostIn] = useState<Record<string, string>>(() => toInputs(start.costs));
  const [costTouched, setCostTouched] = useState<Record<string, boolean>>({});
  const typeCost = (id: string, raw: string) => {
    const t = moneyInput(raw);
    setCostIn((x) => ({ ...x, [id]: t }));
    const n = moneyValue(t);
    setD((x) => { const costs = { ...x.costs }; if (n > 0) costs[id] = n; else delete costs[id]; return { ...x, costs }; });
  };
  const blurCost = (id: string) => { setCostTouched((x) => ({ ...x, [id]: true })); setCostIn((x) => ({ ...x, [id]: moneyText(moneyValue(x[id] ?? "")) })); };
  const costN = moneyValue(costText);
  const applyCost = () => {
    if (!costFor || !(costN > 0)) return;
    put({ costs: { ...d.costs, ...Object.fromEntries(costFor.map((id) => [id, costN])) } });
    setCostIn((x) => ({ ...x, ...Object.fromEntries(costFor.map((id) => [id, moneyText(costN)])) }));
    notify("กำหนดค่าจ้างตรวจ " + bahtText(costN) + " ให้ " + costFor.length + " คันแล้ว");
    setCostFor(null); setTicked([]);
  };
  /* มีผลตรวจแล้ว → เอาคันนั้นออก/เปลี่ยนผู้รับจ้างไม่ได้ */
  const worked = (id: string) => !!trip && hasWork(mock, plan.mr, id);
  const vendorLocked = !!trip && trip.cars.some(worked);

  const pool = freeCars(mock, plan, trip?.id).filter((id) => !d.cars.includes(id)).map((id) => withDue(mock, VEHICLE_BY_ID[id]));
  const dirty = JSON.stringify(d) !== JSON.stringify(start);
  const noCost = d.cars.filter((id) => !(contractCost(d, id) > 0));
  const err = {
    name: touched.name && !d.name.trim() ? "กรุณาระบุชื่อแผนเดินทาง" : undefined,
    d1: touched.d1 && !d.d1 ? "กรุณาเลือกช่วงวันทำงาน" : undefined,
    vendor: touched.vendor && !d.vendor ? "กรุณาเลือกผู้รับจ้าง" : undefined,
    vendorTel: touched.vendorTel && !d.vendorTel.trim() ? "กรุณาระบุเบอร์โทรผู้รับจ้าง" : undefined,
  };
  const complete = !!d.name.trim() && !!d.d1 && !!d.d2 && !!d.vendor && !!d.vendorTel.trim() && d.cars.length > 0 && noCost.length === 0;

  useProtoForm({
    dirty,
    fill: () => {
      const ids = d.cars.length ? d.cars : pool.slice(0, 3).map((v) => v.id);
      const costs = { ...Object.fromEntries(ids.map((id, i) => [id, i % 2 ? 9500 : 9000])), ...d.costs };
      setD({ ...d, name: d.name.trim() ? d.name : "ตรวจ ปจ.2 " + plan.name.replace("ตรวจ ปจ.2 ", ""), vendor: d.vendor || VENDORS[0].id, vendorTel: d.vendorTel || VENDORS[0].tel,
        d1: d.d1 || "2026-12-01", d2: d.d2 || "2026-12-15", cars: ids, costs });
      setCostIn(toInputs(costs)); setTouched({});
    },
    clear: () => { setD(start); setTouched({}); setTicked([]); setCostIn(toInputs(start.costs)); setCostTouched({}); },
  });

  const backTo = trip ? "/trip/?id=" + trip.id : "/detail/?mr=" + plan.mr;
  const leave = () => (dirty ? setLeaving(true) : router.push(backTo));
  const save = () => {
    if (!complete) return;
    if (trip) {
      updateTrip(trip.id, d);
      notify("บันทึกแผนเดินทาง " + d.name.trim() + " และส่งให้หัวหน้า กบค. อนุมัติอีกครั้งแล้ว");
      router.push("/trip/?id=" + trip.id);
    } else {
      createTrip(plan.mr, { ...d, name: d.name.trim() });
      notify("สร้างแผนเดินทางและส่งให้หัวหน้า กบค. อนุมัติแล้ว");
      router.push("/detail/?mr=" + plan.mr);
    }
  };
  /* เปลี่ยนช่วงวันทำงาน = วันดำเนินการรายคันกลับเป็นค่าเริ่มต้น */
  const pickRange = (a: string, b: string) => put({ d1: a, d2: b, works: {} });
  const dropCar = (id: string) => {
    if (worked(id)) return notify("เอา " + VEHICLE_BY_ID[id].plate + " ออกไม่ได้ ผู้รับจ้างบันทึกผลตรวจคันนี้แล้ว", "Error");
    const strip = <T,>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== id));
    put({ cars: d.cars.filter((c) => c !== id), costs: strip(d.costs), locs: strip(d.locs), phones: strip(d.phones), names: strip(d.names), works: strip(d.works) });
    setTicked(ticked.filter((c) => c !== id));
  };

  const cars = d.cars.map((id) => VEHICLE_BY_ID[id]).filter(Boolean);
  const last = Math.max(1, Math.ceil(cars.length / PER)), pg = Math.min(page, last);
  const rows = cars.slice((pg - 1) * PER, pg * PER).map((v) => {
    const cost = contractCost(d, v.id);
    const acts = [
      { IconSwap: "stylus-24-300-round", label: "แก้ไข " + v.plate, onClick: () => setEditCar(v.id) },
      { IconSwap: "delete-24-300-round", label: "เอาออก " + v.plate, onClick: () => dropCar(v.id) },
    ];
    const bad = costTouched[v.id] && !(cost > 0);
    const input = <TextInput Label={false} LabelText={"ค่าจ้างตรวจ " + v.plate} aria-label={"ค่าจ้างตรวจ " + v.plate} Text={costIn[v.id] ?? ""} Placeholder="0.00" inputMode="decimal"
      onChange={(t) => typeCost(v.id, t)} onBlur={() => blurCost(v.id)} State={bad ? "Error" : undefined} HelperText={bad ? "กรุณาระบุค่าจ้าง" : undefined} />;
    const w = tripWork(d, v.id);
    return {
      key: v.id, text: v.plate, sub: worked(v.id) ? v.code + " · มีผลตรวจแล้ว เอาออกไม่ได้" : v.code + " · " + v.type,
      mobileSub: tripLoc(d, v) + " · " + (d.d1 ? dayRange(w[0], w[1]) : "ยังไม่กำหนดวัน"),
      mobileExtra: input,
      cells: [{ text: tripLoc(d, v), sub: tripContact(d, v) },
        d.d1 ? { text: dayRange(w[0], w[1]), sub: d.works[v.id] ? "แก้จากช่วงวันทำงาน" : "ตามช่วงวันทำงาน" } : "-",
        { node: input }, { actions: acts }],
      mobileActions: acts,
    };
  });
  const setCostBtn = ticked.length ? <SecondaryButton key="cost" Text={"กำหนดค่าจ้าง (" + ticked.length + " คัน)"} LeadingIconSwap="payments-24-300-round" Size={mob ? "lg" : "md"} onClick={() => { setCostFor(ticked); setCostText(""); }} /> : null;
  const addBtn = <SecondaryButton key="add" Text="เพิ่มยานพาหนะ" LeadingIconSwap="add-24-300-round" Size={mob ? "lg" : "md"} onClick={() => setPicker(true)} />;
  const vendor = VENDOR_BY_ID[d.vendor];
  const heading = edit ? "แก้ไขแผนเดินทาง" : "สร้างแผนเดินทาง";
  const rangePicker = (
    <DatePicker Type={mob ? "Single" : "Dual"} range {...TH_PICKER} value={d.d1 ? { start: toDate(d.d1), end: toDate(d.d2 || d.d1) } : undefined} month={toDate(d.d1 || TODAY)}
      onCancel={closeCal} onApply={(r) => { if (r.start) pickRange(toIso(r.start), toIso(r.end ?? r.start)); closeCal(); }} />
  );

  return (
    <>
      <PageHeader Title={heading} SupportingText={plan.mr + " · " + plan.name} onBack={leave}
        crumbs={[{ Text: "Safety Inspection" }, { Text: "แผนตรวจ ปจ.2", href: "/" }, { Text: plan.mr, onClick: () => (dirty ? setLeaving(true) : router.push("/detail/?mr=" + plan.mr)) }, { Text: heading }]} />
      <div className="flex flex-col gap-8">
        {trip?.status === "returned" && <Alert Color="Error" Text="หัวหน้า กบค. ส่งกลับให้แก้ไข" SupportingText={(trip.returnReason ? trip.returnReason + " · " : "") + "แก้ไขแล้วกดบันทึกและส่งอนุมัติอีกครั้ง"} />}
        <section className="flex flex-col gap-4">
          <SectionHeader Title="ข้อมูลแผนเดินทาง" />
          <div className={cx("grid gap-4", mob ? "grid-cols-1" : "grid-cols-4")}>
            <TextInput className={mob ? undefined : "col-span-2"} LabelText="ชื่อแผนเดินทาง" Text={d.name} Placeholder="เช่น ตรวจ ปจ.2 ภาคเหนือ" onChange={(v) => put({ name: v })} onBlur={() => touch("name")}
              State={err.name ? "Error" : undefined} HelperText={err.name} />
            <div ref={dateRef} className={cx("relative flex flex-col gap-4", mob ? undefined : "col-span-2")}>
              <TextInput LabelText="ช่วงวันทำงาน" LeadingIconSwap="calendar_month-24-300-round" Text={d.d1 ? dayRange(d.d1, d.d2) : ""} Placeholder="วว/ดด/ปปปป – วว/ดด/ปปปป" readOnly
                State={cal ? "Focused" : err.d1 ? "Error" : d.d1 ? "Filled" : "Default"} HelperText={err.d1 ?? "เปลี่ยนช่วงวัน = วันดำเนินการรายคันกลับเป็นค่าเริ่มต้น"} onClick={() => setCal(true)} />
              {cal && (mob ? <div className="flex justify-center">{rangePicker}</div> : <div className="absolute top-full left-0 z-30 mt-1">{rangePicker}</div>)}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader Title="ผู้รับจ้าง" SupportingText="ผู้รับจ้างเห็นแผนเดินทางหลังหัวหน้า กบค. อนุมัติ แล้วบันทึกผลตรวจรายคันส่งให้ กบค. พิจารณา" />
          <div className={cx("grid gap-4", mob ? "grid-cols-1" : "grid-cols-4")}>
            {vendorLocked ? <TextInput className={mob ? undefined : "col-span-2"} LabelText="ผู้รับจ้าง" Text={vendor?.name ?? ""} State="Readonly" readOnly HelperText="เปลี่ยนไม่ได้ ผู้รับจ้างบันทึกผลตรวจในแผนเดินทางนี้แล้ว" /> :
            <InputDropdown className={mob ? undefined : "col-span-2"} LabelText="ผู้รับจ้าง" Text={vendor?.name ?? ""} Placeholder="เลือกผู้รับจ้าง" open={dd} onOpenChange={(v) => { setDd(v); if (!v) touch("vendor"); }}
              State={err.vendor ? "Error" : undefined} HelperText={err.vendor}>
              <DropdownList>{VENDORS.map((v) => <DropdownListItem key={v.id} Text={v.name} SupportingText={v.tel} State={v.id === d.vendor ? "Selected" : "Default"}
                onClick={() => { put({ vendor: v.id, vendorTel: v.tel }); setDd(false); }} />)}</DropdownList>
            </InputDropdown>}
            <TextInput LabelText="เบอร์โทรผู้รับจ้าง" Text={d.vendorTel} Placeholder="0XX-XXX-XXXX" inputMode="tel" onChange={(v) => put({ vendorTel: v })} onBlur={() => touch("vendorTel")}
              State={err.vendorTel ? "Error" : undefined} HelperText={err.vendorTel} />
            <TextInput LabelText="เลขที่สัญญา/ใบสั่งจ้าง" Optional Text={d.contract} Placeholder="ระบุเลขที่สัญญาหรือใบสั่งจ้าง" onChange={(v) => put({ contract: v })} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader Title="ยานพาหนะในแผนเดินทาง" Badge={cars.length + " คัน · งบรวม " + bahtText(budget(d))}
            SupportingText="เลือกจากยานพาหนะในแผนที่ยังไม่อยู่ในแผนเดินทางใด · ค่าจ้างตรวจกำหนดรายคัน (ผู้รับจ้างเห็นเป็นค่าตั้งต้นของคันนั้น)"
            Actions={cars.length ? <div className="flex flex-wrap gap-3">{setCostBtn}{addBtn}</div> : undefined} />
          {cars.length > 0 && noCost.length > 0 && <Alert Color="Warning" Text={"ยังไม่กำหนดค่าจ้างตรวจ " + noCost.length + " คัน"} SupportingText="พิมพ์ค่าจ้างในช่องของแต่ละคัน หรือติ๊กหลายคันแล้วกด กำหนดค่าจ้าง เพื่อใส่ค่าเดียวกันพร้อมกัน" />}
          {cars.length
            ? <CheckTable columns={COLS} rows={rows} ticked={ticked} onTicked={setTicked} scope={cars.map((v) => ({ key: v.id }))}
                Pagination={<TablePagination total={cars.length} page={pg} perPage={PER} onPage={setPage} />} />
            : <EmptyStateDataEmpty Graphic="vehicle" Text="ยังไม่มียานพาหนะในแผนเดินทาง" SupportingText="เพิ่มยานพาหนะของแผนนี้ที่ยังไม่อยู่ในแผนเดินทางใด อย่างน้อย 1 คัน" Actions={addBtn} />}
        </section>

        <div className={cx("flex", mob ? "gap-4 [&>*]:flex-1 [&>*]:basis-0" : "justify-between gap-3")}>
          <SecondaryButton Text={edit ? "ยกเลิก" : "ย้อนกลับ"} Size="lg" onClick={leave} />
          <PrimaryButton Text="บันทึกและส่งอนุมัติ" Size="lg" State={complete ? "Default" : "Disabled"} onClick={save} />
        </div>
      </div>
      <VehiclePicker open={picker} trip={d.name} pool={pool} taken={{}} onCancel={() => setPicker(false)}
        onAdd={(ids) => { put({ cars: [...d.cars, ...ids] }); setPicker(false); notify("เพิ่มยานพาหนะเข้าแผนเดินทาง " + ids.length + " คันแล้ว"); }} />
      <FormModal open={!!costFor} title={"กำหนดค่าจ้างตรวจ · " + (costFor?.length ?? 0) + " คัน"} sub="ใส่ค่าเดียวกันให้ทุกคันที่ติ๊ก"
        fields={[{ label: "ค่าจ้างตรวจ (บาท)", value: costText, placeholder: "0.00", error: costText && !(costN > 0) ? "กรุณาระบุจำนวนเงินมากกว่า 0" : undefined }]}
        onField={(_, v) => setCostText(moneyInput(v))} ok="บันทึก" okDisabled={!(costN > 0)} onOk={applyCost} onCancel={() => setCostFor(null)} />
      {editCar && <CarEditModal key={editCar} car={VEHICLE_BY_ID[editCar]} d={d} onCancel={() => setEditCar(null)}
        onSave={(p) => { put(p); setEditCar(null); }} />}
      <ConfirmDialog spec={leaving ? LEAVE : null} onCancel={() => setLeaving(false)} onOk={() => { setLeaving(false); router.push(backTo); }} />
    </>
  );
}

/** แก้รายคัน: เบอร์ติดต่อ · ผู้ดูแลยานพาหนะ · สถานที่ตรวจ · วันดำเนินการ (ภายในช่วงวันทำงาน) — แบบ TripCarEditModal ของต้นแบบบำรุงรักษา */
function CarEditModal({ car, d, onSave, onCancel }: { car: Vehicle; d: TripDraft; onSave: (p: Pick<TripDraft, "locs" | "phones" | "names" | "works">) => void; onCancel: () => void }) {
  const mob = useBreakpoint() === "Mobile";
  const [phone, setPhone] = useState(d.phones[car.id] || car.tel);
  const [name, setName] = useState(d.names[car.id] || car.owner);
  const [loc, setLoc] = useState(tripLoc(d, car));
  const [w, setW] = useState<[string, string] | null>(d.d1 ? tripWork(d, car.id) : null);
  const [cal, setCal] = useState(false);
  const save = () => {
    const keep = (o: Record<string, string>, v: string, def: string) => { const n = { ...o }; if (v.trim() && v.trim() !== def) n[car.id] = v.trim(); else delete n[car.id]; return n; };
    const works = { ...d.works };
    if (w && (w[0] !== d.d1 || w[1] !== d.d2)) works[car.id] = w; else delete works[car.id];
    onSave({ phones: keep(d.phones, phone, car.tel), names: keep(d.names, name, car.owner), locs: keep(d.locs, loc, "สำนักงาน " + car.org), works });
  };
  const phoneIn = <TextInput LabelText="เบอร์ติดต่อ" Text={phone} onChange={setPhone} />;
  const nameIn = <TextInput LabelText="ผู้ดูแลยานพาหนะ" Text={name} onChange={setName} />;
  const locIn = <TextInput LabelText="สถานที่ตรวจ" Text={loc} onChange={setLoc} />;
  const dateIn = <TextInput LabelText="วันดำเนินการ" LeadingIconSwap="calendar_month-24-300-round" Text={w ? dayRange(w[0], w[1]) : ""} Placeholder="เลือกช่วงวันทำงานของแผนเดินทางก่อน" readOnly
    State={!d.d1 ? "Disabled" : cal ? "Focused" : "Filled"} onClick={() => d.d1 && setCal(true)} />;
  const picker = cal && d.d1 && (
    <div className="flex">
      <DatePicker Type="Single" range {...TH_PICKER} Today={false} min={toDate(d.d1)} max={toDate(d.d2)} month={toDate(w?.[0] ?? d.d1)}
        value={w ? { start: toDate(w[0]), end: toDate(w[1]) } : undefined} onCancel={() => setCal(false)}
        onApply={(r) => { if (r.start) setW([toIso(r.start), toIso(r.end ?? r.start)]); setCal(false); }} />
    </div>
  );
  return (
    <FormModal open title={"แก้ไขยานพาหนะในแผนเดินทาง · " + car.plate} sub={"ค่าเริ่มต้น: สำนักงาน " + car.org + " · " + car.owner + (d.d1 ? " · " + dateText(d.d1) + " – " + dateText(d.d2) : "")} onCancel={onCancel} onOk={save}>
      {mob
        ? <div className="flex flex-col gap-4">{phoneIn}{nameIn}{locIn}{dateIn}{picker}</div>
        : <>
          <CardFormRow Input1={phoneIn} Input2={nameIn} />
          <CardFormRow Input1={locIn} />
          <CardFormRow Input1={dateIn} />
          {picker}
        </>}
    </FormModal>
  );
}
