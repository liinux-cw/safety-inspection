"use client";
/* popup เพิ่มยานพาหนะเข้าแผนตรวจ ปจ.2 — แบบเดียวกับ TripCarPicker ของต้นแบบบำรุงรักษาตามวาระ (PopupModal 1140 + Table header + CheckTable + Table pagination)
   แสดงเฉพาะยานพาหนะประเภท 09 ที่ต้องตรวจ ปจ.2 · ตัวกรอง (แผงเลื่อนจากขวา): สังกัด · ครบกำหนดตรวจ · วาระ · ประเภทยานพาหนะ
   ยานพาหนะที่อยู่ในแผน ปจ.2 อื่นที่ยังไม่ปิด = แสดงแต่เลือกไม่ได้ (ห้ามซ้อนแผน) · สถานะไม่พร้อมใช้งาน = เลือกได้ แต่เตือนว่าอาจตรวจไม่ได้ */
import { useState } from "react";
import { CheckTable } from "@/components/patterns/CheckTable";
import { PopupModal } from "@/components/patterns/PopupModal";
import { DropdownList } from "@/components/vms/DropdownList";
import { DropdownListItem } from "@/components/vms/DropdownListItem";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { EmptyStateSearchNotFound } from "@/components/vms/EmptyStateSearchNotFound";
import { InputDropdownWithBadges } from "@/components/vms/InputDropdownWithBadges";
import { TableHeader } from "@/components/vms/TableHeader";
import { TertiaryBrandButton } from "@/components/vms/TertiaryBrandButton";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { TablePagination } from "@/components/vms/TablePagination";
import type { TableColumn } from "@/components/vms/Table";
import { CYCLE_FILTERS, DUE_FILTERS, ORGS, VEHICLE_TYPES, dateText, dueBucket, dueInRange, dueSub, rangeText, type Vehicle } from "@/lib/mock/data";

const COLS: TableColumn[] = [
  { head: "ทะเบียน", width: 230 },
  { head: "สังกัด", width: 150 },
  { head: "ผู้ครอบครอง/เบอร์ติดต่อ", width: 190 },
  { head: "สถานะยานพาหนะ", width: 170 },
  { head: "วาระ", width: 90 },
  { head: "ครบกำหนดตรวจ" },
];
const SEARCH = "ค้นหาทะเบียน, รหัส, สังกัด";
const PER = 10;
type F = { org: string[]; due: string[]; cycle: string[]; type: string[] };
const NONE: F = { org: [], due: [], cycle: [], type: [] };

export function VehiclePicker({ open, ...p }: PickerProps & { open: boolean }) {
  if (!open) return null;
  return <Picker {...p} />;
}
interface PickerProps { pool: Vehicle[]; taken: Record<string, string>; onAdd: (ids: string[]) => void; onCancel: () => void; /** รอบตรวจของแผน (YYYY-MM) — มีค่า = ตั้งตัวกรองครบกำหนดในรอบนี้ + เกินกำหนดให้ตั้งแต่เปิด */ from?: string; to?: string }

function Picker({ pool, taken, onAdd, onCancel, from = "", to = "" }: PickerProps) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [ticked, setTicked] = useState<string[]>([]);
  const hasRange = !!from && !!to;
  const START: F = hasRange ? { ...NONE, due: ["ครบกำหนดในรอบนี้", "เกินกำหนด"] } : NONE;
  const [f, setF] = useState<F>(START);
  const dueMatch = (v: Vehicle) => f.due.some((x) => (x === "ครบกำหนดในรอบนี้" ? dueInRange(v.due, from, to) : dueBucket(v.due) === x));
  /* ตัวกรองวางใต้ช่องค้นหาในตัว popup (ไม่เปิดแผงซ้อน popup · เจ้าของงาน 20 พ.ย. 2569) — เลือกแล้วกรองทันที */
  const mob = useBreakpoint() === "Mobile";
  const [dd, setDd] = useState("");
  const flip = (k: keyof F, v: string) => { setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] })); setPage(1); };
  const drop = (k: keyof F) => (v: string) => { setF((x) => ({ ...x, [k]: x[k].filter((y) => y !== v) })); setPage(1); };
  const ddOpen = (k: string) => (v: boolean) => setDd(v ? k : dd === k ? "" : dd);
  const nFilters = f.org.length + f.due.length + f.cycle.length + f.type.length;

  const k = q.trim();
  const shown = pool.filter((v) => (!k || v.plate.includes(k) || v.code.includes(k) || v.org.includes(k))
    && (!f.org.length || f.org.includes(v.org)) && (!f.due.length || dueMatch(v))
    && (!f.cycle.length || f.cycle.includes(v.cycle + " เดือน")) && (!f.type.length || f.type.includes(v.type)));
  const last = Math.max(1, Math.ceil(shown.length / PER)), pg = Math.min(page, last);
  const nTaken = pool.filter((v) => taken[v.id]).length;
  const n = ticked.length;
  const rows = shown.slice((pg - 1) * PER, pg * PER).map((v) => {
    const inPlan = taken[v.id] ? "อยู่ในแผน " + taken[v.id] + " ที่ยังไม่ปิด เลือกไม่ได้" : undefined;
    const warn = v.status !== "พร้อมใช้งาน" ? "เลือกได้ แต่อาจตรวจไม่ได้" : undefined;
    return {
      key: v.id, text: v.plate, sub: inPlan ?? v.code + " · " + v.type,
      mobileSub: [inPlan, v.org, "ครบกำหนด " + dateText(v.due)].filter(Boolean).join(" · "),
      disabled: !!taken[v.id],
      cells: [v.org, { text: v.owner, sub: v.tel }, { text: v.status, sub: warn }, v.cycle + " เดือน",
        { text: dateText(v.due), sub: dueSub(v.due) + (dueInRange(v.due, from, to) ? " · ครบกำหนดในรอบนี้" : "") }],
    };
  });

  const filters = <>
        <InputDropdownWithBadges LabelText="สังกัด" Optional values={f.org} Placeholder="ทั้งหมด" onRemove={drop("org")} open={dd === "org"} onOpenChange={ddOpen("org")}>
          <DropdownList>{ORGS.map((x) => <DropdownListItem key={x} Text={x} State={f.org.includes(x) ? "Selected" : "Default"} onClick={() => flip("org", x)} />)}</DropdownList>
        </InputDropdownWithBadges>
        <InputDropdownWithBadges LabelText="ครบกำหนดตรวจ" Optional values={f.due} Placeholder="ทั้งหมด" onRemove={drop("due")} open={dd === "due"} onOpenChange={ddOpen("due")}>
          <DropdownList>{DUE_FILTERS.filter((x) => hasRange || x !== "ครบกำหนดในรอบนี้").map((x) => <DropdownListItem key={x} Text={x} State={f.due.includes(x) ? "Selected" : "Default"} onClick={() => flip("due", x)} />)}</DropdownList>
        </InputDropdownWithBadges>
        <InputDropdownWithBadges LabelText="วาระ" Optional values={f.cycle} Placeholder="ทั้งหมด" onRemove={drop("cycle")} open={dd === "cycle"} onOpenChange={ddOpen("cycle")}>
          <DropdownList>{CYCLE_FILTERS.map((x) => <DropdownListItem key={x} Text={x} State={f.cycle.includes(x) ? "Selected" : "Default"} onClick={() => flip("cycle", x)} />)}</DropdownList>
        </InputDropdownWithBadges>
        <InputDropdownWithBadges LabelText="ประเภทยานพาหนะ" Optional values={f.type} Placeholder="ทั้งหมด" onRemove={drop("type")} open={dd === "type"} onOpenChange={ddOpen("type")}>
          <DropdownList>{VEHICLE_TYPES.map((x) => <DropdownListItem key={x} Text={x} State={f.type.includes(x) ? "Selected" : "Default"} onClick={() => flip("type", x)} />)}</DropdownList>
        </InputDropdownWithBadges>
  </>;

  const body = !pool.length
    ? <EmptyStateDataEmpty Graphic="vehicle" Text="ไม่มียานพาหนะที่เพิ่มเข้าแผนได้" SupportingText="ยานพาหนะประเภท 09 ทุกคันอยู่ในแผนนี้แล้ว" />
    : <>
      <TableHeader query={q} Placeholder={SEARCH} onQuery={(v) => { setQ(v); setPage(1); }} FilterButton={false}
        Actions={nFilters ? <TertiaryBrandButton Text="ล้างตัวกรอง" onClick={() => { setF(NONE); setPage(1); }} /> : undefined} />
      <div className={mob ? "grid grid-cols-1 gap-4" : "grid grid-cols-4 gap-4"}>{filters}</div>
      {shown.length
        ? <CheckTable columns={COLS} rows={rows} scope={shown.map((v) => ({ key: v.id, disabled: !!taken[v.id] }))} ticked={ticked} onTicked={setTicked}
            Pagination={<TablePagination total={shown.length} page={pg} perPage={PER} onPage={setPage} />} />
        : <EmptyStateSearchNotFound Text="ไม่พบยานพาหนะ" />}
    </>;

  return (
    <>
      <PopupModal open width={1140} title="เพิ่มยานพาหนะเข้าแผน"
        sub={"แสดงเฉพาะยานพาหนะประเภท 09 ที่ต้องตรวจ ปจ.2" + (hasRange ? " · ตั้งตัวกรองให้: ครบกำหนดในรอบ " + rangeText(from, to) + " และเกินกำหนด" : "") + (nTaken ? " · " + nTaken + " คันอยู่ในแผนอื่นที่ยังไม่ปิด เลือกไม่ได้" : "")}
        ok={"เพิ่ม " + n + " คันเข้าแผน"} okDisabled={!n} onCancel={onCancel}
        onOk={() => onAdd(ticked.filter((id) => !taken[id]))}>
        {body}
      </PopupModal>
    </>
  );
}
