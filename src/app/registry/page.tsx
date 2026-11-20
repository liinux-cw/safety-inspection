"use client";
/* ทะเบียน ปจ.2 (กบค.) — /registry/ · เมนู Safety Inspection › ทะเบียน ปจ.2
   ยานพาหนะประเภท 09 ทุกคัน: ตรวจล่าสุด · ผล · ครบกำหนดครั้งถัดไป · อยู่ในแผนไหน — อัปเดตเองเมื่อหัวหน้า กบค. อนุมัติปิดงานแผน
   ดูประวัติ = popup (ไม่มีหน้าข้อมูลยานพาหนะแยก · เจ้าของงาน 20 พ.ย. 2569)
   อัปโหลดผลนอกแผน = กบค. เท่านั้น เฉพาะคันที่ไม่อยู่ในแผนที่ยังไม่ปิด
   ประกอบจาก Page header + Table header + Table/Mobile table + Table pagination + FilterShell + PopupModal (DisplayBox · Table · File upload · Text input + Date picker · Radio text card · Text area · Alert) */
import { useState } from "react";
import { RoleGate } from "@/app/_lib/RoleGate";
import { DisplayBox } from "@/components/patterns/DisplayBox";
import { FilterShell } from "@/components/patterns/FilterShell";
import { PopupModal } from "@/components/patterns/PopupModal";
import { AppFrame } from "@/components/shell/AppFrame";
import { Alert } from "@/components/vms/Alert";
import { DatePicker } from "@/components/vms/DatePicker";
import { DropdownList } from "@/components/vms/DropdownList";
import { DropdownListItem } from "@/components/vms/DropdownListItem";
import { EmptyStateSearchNotFound } from "@/components/vms/EmptyStateSearchNotFound";
import { FileUpload } from "@/components/vms/FileUpload";
import { InputDropdownWithBadges } from "@/components/vms/InputDropdownWithBadges";
import { InputLabel } from "@/components/vms/InputLabel";
import { MobileCards } from "@/components/vms/MobileTable";
import { PageHeader } from "@/components/vms/PageHeader";
import { PillOutline } from "@/components/vms/PillOutline";
import { RadioTextCards } from "@/components/vms/RadioTextCard";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { Table, type TableColumn, type TableValue } from "@/components/vms/Table";
import { TableHeader } from "@/components/vms/TableHeader";
import { TablePagination } from "@/components/vms/TablePagination";
import { TextArea } from "@/components/vms/TextArea";
import { TextInput } from "@/components/vms/TextInput";
import { downloadFile, rememberFiles } from "@/lib/fileDownload";
import {
  DUE_FILTERS, ORGS, RESULTS, RESULT_COLOR, TODAY, UPLOAD_ACCEPT, UPLOAD_HINT, UPLOAD_MAX_FILES, VEHICLES, VEHICLE_BY_ID,
  dateText, dueBucket, dueSub, fileOk, sizeText, type DocFile, type InspectResult,
} from "@/lib/mock/data";
import { addOutside, dueOf, historyOf, latestOf, nextDue, openPlanOf } from "@/lib/mock/registry";
import { notify, useMock } from "@/lib/mock/store";
import { TH_PICKER } from "@/lib/thaiDate";
import { useBreakpoint } from "@/lib/useBreakpoint";

const PER = 10;
const COLS: TableColumn[] = [
  { head: "ทะเบียน", width: 220, Style: "Lead text" },
  { head: "สังกัด" },
  { head: "ตรวจล่าสุด", width: 140 },
  { head: "ผลล่าสุด", width: 130 },
  { head: "ครบกำหนดครั้งถัดไป", width: 170 },
  { head: "แผน", width: 140 },
  { head: "", width: 104 },
];
const NO_RESULT = "ยังไม่มีผลในระบบ";
const PLAN_F = ["อยู่ในแผน", "ไม่อยู่ในแผน"];
type F = { org: string[]; result: string[]; due: string[]; plan: string[] };
const NONE: F = { org: [], result: [], due: [], plan: [] };
const toDate = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const toIso = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

export default function Registry() {
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [f, setF] = useState<F>(NONE);
  const [panel, setPanel] = useState(false);
  const [fd, setFd] = useState<F>(NONE);
  const [dd, setDd] = useState("");
  const [view, setView] = useState<string | null>(null);
  const [upload, setUpload] = useState<string | null>(null);
  const flip = (k: keyof F, v: string) => setFd((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  const drop = (k: keyof F) => (v: string) => setFd((x) => ({ ...x, [k]: x[k].filter((y) => y !== v) }));
  const ddOpen = (k: string) => (v: boolean) => setDd(v ? k : dd === k ? "" : dd);
  const chips = [...f.org, ...f.result, ...f.due, ...f.plan];
  const removeChip = (c: string) => { setF((x) => ({ org: x.org.filter((y) => y !== c), result: x.result.filter((y) => y !== c), due: x.due.filter((y) => y !== c), plan: x.plan.filter((y) => y !== c) })); setPage(1); };

  const q = query.trim();
  const list = VEHICLES.filter((v) => {
    const last = latestOf(mock, v.id), due = dueOf(mock, v.id), plan = openPlanOf(mock, v.id);
    return (!q || v.plate.includes(q) || v.code.includes(q) || v.org.includes(q) || v.owner.includes(q))
      && (!f.org.length || f.org.includes(v.org))
      && (!f.result.length || f.result.includes(last?.result ?? NO_RESULT))
      && (!f.due.length || f.due.includes(dueBucket(due)))
      && (!f.plan.length || f.plan.includes(plan ? "อยู่ในแผน" : "ไม่อยู่ในแผน"));
  });
  const last = Math.max(1, Math.ceil(list.length / PER)), pg = Math.min(page, last);
  const rows: TableValue[][] = list.slice((pg - 1) * PER, pg * PER).map((v) => {
    const l = latestOf(mock, v.id), due = dueOf(mock, v.id), plan = openPlanOf(mock, v.id);
    const acts = [{ IconSwap: "quick_reference_all-24-300-round", label: "ดูประวัติ " + v.plate, onClick: () => setView(v.id) }];
    if (!plan) acts.push({ IconSwap: "upload-24-300-round", label: "อัปโหลดผลนอกแผน " + v.plate, onClick: () => setUpload(v.id) });
    return [
      { text: v.plate, sub: v.code + " · " + v.type }, v.org,
      l ? { text: dateText(l.date), sub: "วาระ " + v.cycle + " เดือน" } : { text: "-", sub: "วาระ " + v.cycle + " เดือน" },
      l ? { pills: [[l.result, RESULT_COLOR[l.result]]] } : { pills: [[NO_RESULT, "Gray"]] },
      { text: dateText(due), sub: dueSub(due) },
      plan ?? "ไม่อยู่ในแผน",
      { actions: acts, mobileActions: acts },
    ];
  });
  const rowKey = (r: TableValue[]) => { const v = r[0]; return v && typeof v === "object" && "text" in v ? v.text : String(v); };
  const pagination = <TablePagination total={list.length} page={pg} perPage={PER} onPage={setPage} />;

  return (
    <AppFrame>
      <RoleGate kbk>
        <PageHeader Title="ทะเบียน ปจ.2" SupportingText="ผลตรวจล่าสุดและวันครบกำหนดของยานพาหนะประเภท 09 · อัปเดตเองเมื่อแผนปิดงาน"
          crumbs={[{ Text: "Safety Inspection" }, { Text: "ทะเบียน ปจ.2" }]} />
        <section className="flex flex-col gap-6">
          <TableHeader Placeholder="ค้นหาทะเบียน, รหัส, สังกัด, ผู้ครอบครอง" query={query} onQuery={(v) => { setQuery(v); setPage(1); }}
            onFilter={() => { setFd(f); setDd(""); setPanel(true); }} FilterCount={chips.length} Filters={chips} onRemoveFilter={removeChip} />
          {!list.length ? <EmptyStateSearchNotFound Actions={<SecondaryButton Text="ล้างตัวกรอง" Size={mob ? "lg" : "md"} onClick={() => { setQuery(""); setF(NONE); setPage(1); }} />} />
            : mob ? <div className="flex flex-col gap-5"><MobileCards columns={COLS} rows={rows} rowKey={rowKey} />{pagination}</div>
            : <Table columns={COLS} rows={rows} rowKey={rowKey} Pagination={pagination} />}
        </section>
        <FilterShell open={panel} onClose={() => { setDd(""); setPanel(false); }} onClear={() => setFd(NONE)} onApply={() => { setF(fd); setPage(1); setDd(""); setPanel(false); }}>
          <InputDropdownWithBadges LabelText="สังกัด" Optional values={fd.org} Placeholder="ทั้งหมด" onRemove={drop("org")} open={dd === "org"} onOpenChange={ddOpen("org")}>
            <DropdownList>{ORGS.map((x) => <DropdownListItem key={x} Text={x} State={fd.org.includes(x) ? "Selected" : "Default"} onClick={() => flip("org", x)} />)}</DropdownList>
          </InputDropdownWithBadges>
          <InputDropdownWithBadges LabelText="ผลล่าสุด" Optional values={fd.result} Placeholder="ทั้งหมด" onRemove={drop("result")} open={dd === "result"} onOpenChange={ddOpen("result")}>
            <DropdownList>{[...RESULTS, NO_RESULT].map((x) => <DropdownListItem key={x} Text={x} State={fd.result.includes(x) ? "Selected" : "Default"} onClick={() => flip("result", x)} />)}</DropdownList>
          </InputDropdownWithBadges>
          <InputDropdownWithBadges LabelText="ครบกำหนดครั้งถัดไป" Optional values={fd.due} Placeholder="ทั้งหมด" onRemove={drop("due")} open={dd === "due"} onOpenChange={ddOpen("due")}>
            <DropdownList>{DUE_FILTERS.filter((x) => x !== "ครบกำหนดในรอบนี้").map((x) => <DropdownListItem key={x} Text={x} State={fd.due.includes(x) ? "Selected" : "Default"} onClick={() => flip("due", x)} />)}</DropdownList>
          </InputDropdownWithBadges>
          <InputDropdownWithBadges LabelText="แผน" Optional values={fd.plan} Placeholder="ทั้งหมด" onRemove={drop("plan")} open={dd === "plan"} onOpenChange={ddOpen("plan")}>
            <DropdownList>{PLAN_F.map((x) => <DropdownListItem key={x} Text={x} State={fd.plan.includes(x) ? "Selected" : "Default"} onClick={() => flip("plan", x)} />)}</DropdownList>
          </InputDropdownWithBadges>
        </FilterShell>
        {view && <HistoryModal id={view} onClose={() => setView(null)} />}
        {upload && <UploadModal id={upload} onClose={() => setUpload(null)} />}
      </RoleGate>
    </AppFrame>
  );
}

const HIST_COLS: TableColumn[] = [{ head: "วันที่ตรวจ", width: 120 }, { head: "ผล", width: 120 }, { head: "ที่มา" }, { head: "ครบกำหนดถัดไป", width: 150 }];

function HistoryModal({ id, onClose }: { id: string; onClose: () => void }) {
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const v = VEHICLE_BY_ID[id], hist = historyOf(mock, id), l = latestOf(mock, id), due = dueOf(mock, id), plan = openPlanOf(mock, id);
  const rows: TableValue[][] = [...hist].reverse().map((e) => [dateText(e.date), { pills: [[e.result, RESULT_COLOR[e.result]]] }, e.source === "นอกแผน" ? "นอกแผน (กบค. อัปโหลด)" : "แผน " + e.source, dateText(e.nextDue)]);
  return (
    <PopupModal open width={800} title={"ประวัติการตรวจ ปจ.2 · " + v.plate} sub={v.code + " · " + v.type + " · " + v.org} showOk={false} cancel="ปิด" onCancel={onClose}>
      <div className="flex flex-col gap-6">
        <DisplayBox perRow={mob ? 2 : 4} pairs={[
          ["ผลล่าสุด", l ? <PillOutline key="r" Text={l.result} Color={RESULT_COLOR[l.result]} /> : NO_RESULT],
          ["ตรวจล่าสุด", l ? dateText(l.date) : "-"],
          ["วาระการตรวจ", v.cycle + " เดือน"],
          ["ครบกำหนดครั้งถัดไป", dateText(due) + " (" + dueSub(due) + ")"],
          ["ผู้ครอบครอง", v.owner + " · " + v.tel],
          ["แผนที่ยังไม่ปิด", plan ?? "ไม่อยู่ในแผน"],
        ]} />
        {l?.reason && <Alert Color="Gray" Text="เหตุผลที่ตรวจไม่ได้" SupportingText={l.reason} />}
        {l && l.files.length > 0 && <FileUpload LabelText="เอกสารผลล่าสุด" readonly files={l.files} onDownload={(i) => downloadFile(l.files[i].name)} />}
        <section className="flex flex-col gap-3">
          <InputLabel LabelText={"ประวัติการตรวจ (" + hist.length + " ครั้ง)"} />
          {hist.length ? (mob ? <MobileCards columns={HIST_COLS} rows={rows} /> : <Table columns={HIST_COLS} rows={rows} />)
            : <Alert Color="Gray" Text="ยังไม่มีประวัติการตรวจในระบบ" SupportingText={"ครบกำหนดตั้งต้น " + dateText(v.due)} />}
        </section>
      </div>
    </PopupModal>
  );
}

function UploadModal({ id, onClose }: { id: string; onClose: () => void }) {
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const v = VEHICLE_BY_ID[id];
  const [date, setDate] = useState("");
  const [cal, setCal] = useState(false);
  const [result, setResult] = useState<InspectResult | null>(null);
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<DocFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cannot = result === "ตรวจไม่ได้";
  const ok = !!date && !!result && (!cannot || !!reason.trim()) && files.length > 0;
  const prevDue = dueOf(mock, id);
  const onFiles = (fs: File[]) => {
    const bad = fs.filter((x) => !fileOk(x)), good = fs.filter(fileOk), take = good.slice(0, Math.max(0, UPLOAD_MAX_FILES - files.length));
    const msgs: string[] = [];
    if (bad.length) msgs.push("ไฟล์ " + bad.map((x) => x.name).join(", ") + " ไม่ใช่ PDF/PNG/JPG หรือใหญ่เกิน 10 MB");
    if (good.length > take.length) msgs.push("แนบได้สูงสุด " + UPLOAD_MAX_FILES + " ไฟล์");
    setError(msgs.length ? msgs.join(" · ") : null);
    if (!take.length) return;
    rememberFiles(take);
    setFiles((x) => [...x, ...take.map((t) => ({ name: t.name, size: sizeText(t.size) }))]);
  };
  const save = () => {
    if (!ok || !result) return;
    addOutside(id, { date, result, files, reason: cannot ? reason.trim() : undefined });
    notify("บันทึกผลตรวจนอกแผนของ " + v.plate + " แล้ว · ทะเบียนอัปเดตแล้ว");
    onClose();
  };
  return (
    <PopupModal open width={640} title={"อัปโหลดผลตรวจนอกแผน · " + v.plate} sub={v.code + " · " + v.type + " · วาระ " + v.cycle + " เดือน"}
      ok="บันทึก" okDisabled={!ok} onOk={save} onCancel={onClose}>
      <div className="flex flex-col gap-4">
        <Alert Color="Info" Text="ใช้สำหรับยานพาหนะที่ตรวจนอกแผน (ตรวจรายคัน หรือไม่ได้สร้างแผน)" SupportingText="บันทึกแล้วทะเบียน ปจ.2 อัปเดตทันที ไม่ต้องอนุมัติ" />
        <TextInput LabelText="วันที่ตรวจ" LeadingIconSwap="calendar_month-24-300-round" Text={date ? dateText(date) : ""} Placeholder="ระบุวันที่" readOnly
          State={cal ? "Focused" : date ? "Filled" : "Default"} onClick={() => setCal(true)} />
        {cal && <div className="flex"><DatePicker Type="Single" {...TH_PICKER} max={toDate(TODAY)} today={toDate(TODAY)} value={{ start: toDate(date || TODAY), end: toDate(date || TODAY) }} month={toDate(date || TODAY)}
          onCancel={() => setCal(false)} onApply={(r) => { if (r.start) setDate(toIso(r.start)); setCal(false); }} /></div>}
        <div className="flex flex-col gap-2">
          <InputLabel LabelText="ผลการตรวจ" />
          <RadioTextCards row={!mob} options={RESULTS.map((r) => ({ Text: r }))} value={result} onChange={(x) => setResult(x as InspectResult)} />
        </div>
        {cannot && <TextArea LabelText="เหตุผลที่ตรวจไม่ได้" Text={reason} Placeholder="ระบุเหตุผล" onChange={setReason} />}
        <FileUpload LabelText={cannot ? "หนังสือรับรองจากผู้แทนหน่วยงาน" : "เอกสารการตรวจ ปจ.2"} files={files} hint={UPLOAD_HINT} max={UPLOAD_MAX_FILES} accept={UPLOAD_ACCEPT}
          HelperText={error ?? undefined} Error={!!error} onFiles={onFiles} onDelete={(i) => setFiles((x) => x.filter((_, j) => j !== i))} />
        {date && result && <Alert Color={result === "ผ่าน" ? "Success" : "Warning"} Text={"ครบกำหนดครั้งถัดไป: " + dateText(nextDue(v, result, date, prevDue))}
          SupportingText={result === "ผ่าน" ? "วันที่ตรวจ + วาระ " + v.cycle + " เดือน" : "ผล" + result + " คงวันครบกำหนดเดิม ต้องตรวจใหม่"} />}
      </div>
    </PopupModal>
  );
}
