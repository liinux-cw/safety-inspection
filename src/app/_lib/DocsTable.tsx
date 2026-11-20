"use client";
/* ตารางยานพาหนะในแผน + ผลการตรวจ ปจ.2 รายคัน · popup กรอกผล/ดู/พิจารณา
   ช่องที่ผู้รับจ้างกรอกต่อคัน (prototype พี่มิก P5-Record): วันที่ตรวจ · ค่าจ้างตรวจคันนี้ (บาท) · ผลการตรวจ (ผ่าน / ไม่ผ่าน / ระงับ / ตรวจไม่ได้)
     · เอกสารการตรวจ ปจ.2 (ต้องแนบ) — ผลตรวจไม่ได้ = เหตุผล (ต้องระบุ) + หนังสือรับรองจากผู้แทนหน่วยงาน (ต้องแนบ)
   ผู้รับจ้าง (canEdit): ยังไม่ส่ง หรือ กบค. ส่งกลับแก้ไข = แก้ได้ · ส่งแล้ว (รอ กบค.) หรืออนุมัติแล้ว = ล็อก ดูและดาวน์โหลดได้อย่างเดียว
   กบค. (canReview): คันที่รออนุมัติ = เลือกผลการพิจารณา อนุมัติ / ส่งกลับแก้ไข (ต้องมีเหตุผล) · อื่นๆ ดูอย่างเดียว
   เงื่อนไขไฟล์: PDF/PNG/JPG · ไฟล์ละไม่เกิน 10 MB · 1–10 ไฟล์ต่อคัน */
import { useState } from "react";
import { CheckTable } from "@/components/patterns/CheckTable";
import { DisplayBox } from "@/components/patterns/DisplayBox";
import { PopupModal } from "@/components/patterns/PopupModal";
import { Alert } from "@/components/vms/Alert";
import { ContentDivider } from "@/components/vms/ContentDivider";
import { ContentItemRow } from "@/components/vms/ContentItemRow";
import { DatePicker } from "@/components/vms/DatePicker";
import { FileUpload } from "@/components/vms/FileUpload";
import { InputLabel } from "@/components/vms/InputLabel";
import { MobileCards } from "@/components/vms/MobileTable";
import { PillOutline } from "@/components/vms/PillOutline";
import { RadioTextCards } from "@/components/vms/RadioTextCard";
import { SectionLabel } from "@/components/vms/SectionLabel";
import { Table, type TableColumn, type TableValue } from "@/components/vms/Table";
import { TablePagination } from "@/components/vms/TablePagination";
import { TextArea } from "@/components/vms/TextArea";
import { TextInput } from "@/components/vms/TextInput";
import { downloadFile, rememberFiles } from "@/lib/fileDownload";
import {
  RESULTS, RESULT_COLOR, TODAY, UPLOAD_ACCEPT, UPLOAD_HINT, UPLOAD_MAX_FILES, VEHICLE_BY_ID, addMonths, bahtText, dateText, dueSub, fileOk, rangeText, sizeText,
  type CarDocs, type InspectResult, type Plan, type Vehicle,
} from "@/lib/mock/data";
import { DOC_TEXT, addFiles, approveDocs, carCost, carDocs, contractCost, costDiffers, docState, missing, removeFile, returnDocs, updateResult, vendorCanEdit, vendorCanWork } from "@/lib/mock/plan";
import { notify, useMock } from "@/lib/mock/store";
import { useProtoForm } from "@/lib/protoForm";
import { TH_PICKER } from "@/lib/thaiDate";
import { useBreakpoint } from "@/lib/useBreakpoint";

const COLS: TableColumn[] = [
  { head: "ทะเบียน", width: 200, Style: "Lead text" },
  { head: "สังกัด" },
  { head: "ครบกำหนดตรวจ", width: 150 },
  { head: "วันที่ตรวจ", width: 120 },
  { head: "ผล ปจ.2", width: 120 },
  { head: "ค่าจ้างตรวจ", width: 150 },
  { head: "สถานะ", width: 160 },
  { head: "", width: 72 },
];
const PER = 10;
const toDate = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const toIso = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const docLabel = (c: CarDocs) => (c.result === "ตรวจไม่ได้" ? "หนังสือรับรองจากผู้แทนหน่วยงาน" : "เอกสารการตรวจ ปจ.2");

/** canEdit = บทบาทผู้รับจ้าง (แก้ได้จริงเมื่อแผนอนุมัติแล้ว) · ticked/onTicked = กบค. ติ๊กหลายคันที่รออนุมัติเพื่ออนุมัติพร้อมกัน */
export function DocsTable({ plan, canEdit, canReview, ticked, onTicked }: { plan: Plan; canEdit: boolean; canReview?: boolean; ticked?: string[]; onTicked?: (next: string[]) => void }) {
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const last = Math.max(1, Math.ceil(plan.cars.length / PER)), pg = Math.min(page, last);

  const rows: TableValue[][] = plan.cars.slice((pg - 1) * PER, pg * PER).map((id) => {
    const v = VEHICLE_BY_ID[id];
    const c = carDocs(mock, plan.mr, id);
    const st = docState(c, plan, id);
    const editHere = canEdit && vendorCanWork(plan) && vendorCanEdit(c);
    const reviewHere = !!canReview && st === "sent";
    const act = editHere ? { IconSwap: "edit_note-24-300-round", label: "บันทึกผลตรวจ " + v.plate, onClick: () => setOpen(id) }
      : reviewHere ? { IconSwap: "fact_check-24-300-round", label: "พิจารณาผลตรวจ " + v.plate, onClick: () => setOpen(id) }
      : { IconSwap: "quick_reference_all-24-300-round", label: "ดูผลตรวจ " + v.plate, onClick: () => setOpen(id) };
    return [
      { text: v.plate, sub: v.code + " · " + v.type }, v.org, { text: dateText(v.due), sub: dueSub(v.due) },
      c.date ? dateText(c.date) : "-",
      c.result ? { pills: [[c.result, RESULT_COLOR[c.result]]] } : "-",
      { text: bahtText(carCost(plan, c, id)), sub: costDiffers(plan, c, id) ? "ต่างจากสัญญา (" + bahtText(contractCost(plan, id)) + ")" : st === "none" ? "ตามสัญญา" : undefined },
      { pills: [DOC_TEXT[st]] },
      { actions: [act], mobileActions: [act] },
    ];
  });
  const pageCars = plan.cars.slice((pg - 1) * PER, pg * PER);
  const checkRows = rows.map((r, i) => {
    const id = pageCars[i], v = VEHICLE_BY_ID[id], a = r[7] as { actions: { IconSwap: string; label: string; onClick?: () => void }[] };
    return { key: id, text: v.plate, sub: v.code + " · " + v.type, disabled: docState(carDocs(mock, plan.mr, id), plan, id) !== "sent", cells: r.slice(1), mobileActions: a.actions };
  });
  const rowKey = (r: TableValue[]) => { const v = r[0]; return v && typeof v === "object" && "text" in v ? v.text : String(v); };

  return (
    <>
      {ticked && onTicked ? (
        <CheckTable columns={COLS} rows={checkRows} ticked={ticked} onTicked={onTicked}
          scope={plan.cars.map((id) => ({ key: id, disabled: docState(carDocs(mock, plan.mr, id), plan, id) !== "sent" }))}
          Pagination={<TablePagination total={plan.cars.length} page={pg} perPage={PER} onPage={setPage} />} />
      ) : mob ? (
        <div className="flex flex-col gap-5">
          <MobileCards columns={COLS} rows={rows} rowKey={rowKey} />
          <TablePagination total={plan.cars.length} page={pg} perPage={PER} onPage={setPage} />
        </div>
      ) : <Table columns={COLS} rows={rows} rowKey={rowKey} Pagination={<TablePagination total={plan.cars.length} page={pg} perPage={PER} onPage={setPage} />} />}
      {open && <ResultModal plan={plan} car={open} canEdit={canEdit} canReview={!!canReview} onClose={() => setOpen(null)} />}
    </>
  );
}

/** ข้อความผลที่จะเกิดหลังบันทึก (prototype พี่มิก P5-Record) */
function outcome(v: Vehicle, c: CarDocs): { Color: "Info" | "Warning" | "Gray"; Text: string } | null {
  if (!c.result) return null;
  if (c.result === "ผ่าน") return { Color: "Info", Text: "ทะเบียน ปจ.2 อัปเดตครบกำหนดครั้งถัดไปเป็น " + (c.date ? dateText(addMonths(c.date, v.cycle)) : "วันที่ตรวจ + " + v.cycle + " เดือน") + " (วันที่ตรวจ + " + v.cycle + " เดือน)" };
  if (c.result === "ตรวจไม่ได้") return { Color: "Gray", Text: "ต้องระบุเหตุผลและแนบหนังสือรับรองจากผู้แทนหน่วยงาน · ทะเบียน ปจ.2 คงวันครบกำหนดเดิม (" + dateText(v.due) + ")" };
  return { Color: "Warning", Text: "ผล" + c.result + ": ระบบแจ้งผู้ดูแลยานพาหนะให้เปิดงานซ่อม (งานซ่อมไม่ผูกกับแผนนี้)" };
}

function ResultModal({ plan, car, canEdit, canReview, onClose }: { plan: Plan; car: string; canEdit: boolean; canReview: boolean; onClose: () => void }) {
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const v = VEHICLE_BY_ID[car];
  const c = carDocs(mock, plan.mr, car);
  const st = docState(c, plan, car);
  const contract = contractCost(plan, car);
  const waitPlan = canEdit && !vendorCanWork(plan) && plan.status !== "closed";
  const ro = !canEdit || !vendorCanWork(plan) || !vendorCanEdit(c);
  const review = canReview && st === "sent";
  const [error, setError] = useState<string | null>(null);
  const [cal, setCal] = useState(false);
  const [costText, setCostText] = useState(String(carCost(plan, c, car)));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));
  const [decision, setDecision] = useState<"" | "approve" | "return">("");
  const [reason, setReason] = useState("");
  const [rTouched, setRTouched] = useState(false);
  const reasonErr = rTouched && !reason.trim();
  const decided = decision === "approve" || (decision === "return" && !!reason.trim());
  const left = missing(c, plan, car);
  const differs = costDiffers(plan, c, car);

  const setCost = (t: string) => {
    const clean = t.replace(/[^\d.]/g, "");
    setCostText(clean);
    const n = Number(clean);
    /* B: เท่ากับสัญญา = ไม่เก็บค่า (ใช้ค่าตามสัญญา) · ว่าง = 0 (ต้องกรอก) */
    updateResult(plan.mr, car, { cost: !clean || Number.isNaN(n) ? 0 : n === contract ? undefined : n });
  };
  const sample = () => {
    if (!c.date) updateResult(plan.mr, car, { date: TODAY });
    if (!carCost(plan, c, car)) setCost(String(contract));
    if (!c.result) updateResult(plan.mr, car, { result: "ผ่าน" });
    if (c.result === "ตรวจไม่ได้" && !c.reason) updateResult(plan.mr, car, { reason: "ยานพาหนะอยู่ระหว่างซ่อม ไม่สามารถทดสอบได้" });
    if (!c.files.length) addFiles(plan.mr, car, [{ name: "ปจ2-" + v.plate.split(" ")[0] + "-ตัวอย่าง.pdf", size: "1.2 MB" }]);
    setError(null);
  };
  const clearAll = () => {
    updateResult(plan.mr, car, { date: undefined, cost: undefined, costReason: undefined, result: undefined, reason: undefined });
    for (let i = c.files.length - 1; i >= 0; i--) removeFile(plan.mr, car, i);
    setCostText(String(contract)); setTouched({}); setError(null);
  };
  /* ต้นแบบ: กรอกข้อมูลตัวอย่าง — ผู้รับจ้าง = กรอกผลผ่าน + ไฟล์ตัวอย่าง · กบค. = เลือกอนุมัติ */
  useProtoForm(review ? {
    dirty: !!decision || !!reason,
    fill: () => { setDecision("approve"); setReason(""); },
    clear: () => { setDecision(""); setReason(""); setRTouched(false); },
  } : !ro ? { dirty: st !== "none" && st !== "returned", fill: sample, clear: clearAll } : null);

  const onFiles = (files: File[]) => {
    const bad = files.filter((f) => !fileOk(f));
    const good = files.filter(fileOk);
    const room = UPLOAD_MAX_FILES - c.files.length;
    const take = good.slice(0, Math.max(0, room));
    const msgs: string[] = [];
    if (bad.length) msgs.push("ไฟล์ " + bad.map((f) => f.name).join(", ") + " ไม่ใช่ PDF/PNG/JPG หรือใหญ่เกิน 10 MB");
    if (good.length > take.length) msgs.push("แนบได้สูงสุด " + UPLOAD_MAX_FILES + " ไฟล์ต่อคัน");
    setError(msgs.length ? msgs.join(" · ") : null);
    if (!take.length) return;
    rememberFiles(take);
    addFiles(plan.mr, car, take.map((f) => ({ name: f.name, size: sizeText(f.size) })));
    notify("แนบเอกสาร " + take.length + " ไฟล์แล้ว");
  };
  const confirm = () => {
    if (decision === "approve") { approveDocs(plan.mr, car); notify("อนุมัติผลตรวจ ปจ.2 ของ " + v.plate + " แล้ว"); }
    else { returnDocs(plan.mr, car, reason.trim()); notify("ส่งกลับให้ผู้รับจ้างแก้ไขผลตรวจของ " + v.plate + " แล้ว"); }
    onClose();
  };
  const out = outcome(v, c);
  /* D: วันที่ตรวจเลือกได้ตั้งแต่ 1 เดือนก่อนรอบตรวจ ถึงวันนี้ · นอกรอบตรวจ = เตือน ไม่บล็อก */
  const minDate = addMonths(plan.from + "-01", -1);
  const inRound = (iso: string) => iso.slice(0, 7) >= plan.from && iso.slice(0, 7) <= plan.to;
  const summary = v.plate + " · " + v.code + " · " + v.type + " · วาระ " + v.cycle + " เดือน";
  const fileErr = !ro && touched.files && !c.files.length ? "กรุณาแนบ" + docLabel(c) + " อย่างน้อย 1 ไฟล์" : null;

  return (
    <PopupModal open width={640} title={review ? "พิจารณาผลการตรวจ ปจ.2" : ro ? "ผลการตรวจ ปจ.2" : "บันทึกผลการตรวจ ปจ.2"} sub={summary}
      showOk={review} ok="ยืนยันผลการพิจารณา" okDisabled={!decided} onOk={confirm} cancel={review ? "ยกเลิก" : "ปิด"}
      onCancel={() => { if (!ro && st !== "none" && left.length) notify("บันทึกไว้แล้ว ยังขาด: " + left.join(", ")); onClose(); }}>
      <div className="flex flex-col gap-4">
        {mob && <ContentItemRow perRow={2} items={[["ทะเบียน", v.plate], ["รหัส", v.code], ["ประเภทยานพาหนะ", v.type], ["วาระการตรวจ", v.cycle + " เดือน"]]} />}
        {st === "approved" && <Alert Color="Success" Text={"กบค. อนุมัติแล้วเมื่อ " + dateText(c.approvedAt!)} SupportingText="ผลที่อนุมัติแล้วแก้ไขหรือลบไม่ได้ ดูและดาวน์โหลดได้" />}
        {st === "sent" && <Alert Color="Info" Text={"ส่งอนุมัติแล้วเมื่อ " + dateText(c.sentAt!) + " · รอ กบค. อนุมัติ"} SupportingText={canEdit ? "ระหว่างรออนุมัติแก้ไขหรือลบไม่ได้ ดูและดาวน์โหลดได้" : undefined} />}
        {st === "returned" && <Alert Color="Error" Text="กบค. ส่งกลับแก้ไข" SupportingText={c.returnReason + (canEdit ? " · แก้ไขแล้วกดส่งอนุมัติอีกครั้ง" : "")} />}
        {!canEdit && !c.sentAt && !c.approvedAt && st !== "none" && <Alert Color="Warning" Text="ผู้รับจ้างยังไม่ส่งอนุมัติ" SupportingText="ข้อมูลอาจเปลี่ยนแปลงจนกว่าผู้รับจ้างจะส่ง" />}
        {waitPlan && <Alert Color="Warning" Text="แผนยังไม่อนุมัติ" SupportingText="ดูรายละเอียดได้ก่อน บันทึกและส่งผลตรวจได้เมื่อแผนอนุมัติแล้ว" />}

        {ro ? (
          <DisplayBox perRow={2} pairs={[
            ["วันที่ตรวจ", c.date ? dateText(c.date) : "-"],
            ["ค่าจ้างตรวจคันนี้", st === "none" ? "ตามสัญญา " + bahtText(contract) : bahtText(carCost(plan, c, car)) + (differs ? " (สัญญา " + bahtText(contract) + ")" : "")],
            ...(differs ? [["เหตุผลที่ค่าจ้างต่างจากสัญญา", c.costReason || "-"] as [string, string]] : []),
            ["ผลการตรวจ", c.result ? <PillOutline key="r" Text={c.result} Color={RESULT_COLOR[c.result]} /> : "-"],
            ["ครบกำหนดตรวจเดิม", dateText(v.due)],
            ...(c.date && !inRound(c.date) ? [["หมายเหตุ", "วันที่ตรวจอยู่นอกรอบตรวจของแผน"] as [string, string]] : []),
            ...(c.result === "ตรวจไม่ได้" ? [["เหตุผลที่ตรวจไม่ได้", c.reason || "-"] as [string, string]] : []),
            ...(!c.files.length ? [[docLabel(c), "ยังไม่มีเอกสาร"] as [string, string]] : []),
          ]} />
        ) : <>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <TextInput LabelText="วันที่ตรวจ" LeadingIconSwap="calendar_month-24-300-round" Text={c.date ? dateText(c.date) : ""} Placeholder="วว/ดด/ปปปป" readOnly
                State={cal ? "Focused" : touched.date && !c.date ? "Error" : c.date ? "Filled" : "Default"} HelperText={touched.date && !c.date ? "กรุณาเลือกวันที่ตรวจ" : undefined}
                onClick={() => setCal(true)} />
            </div>
            <TextInput className="min-w-0 flex-1" LabelText="ค่าจ้างตรวจคันนี้ (บาท)" Text={costText} Placeholder="0.00" inputMode="decimal" onChange={setCost} onBlur={() => touch("cost")}
              State={touched.cost && !carCost(plan, c, car) ? "Error" : undefined}
              HelperText={touched.cost && !carCost(plan, c, car) ? "กรุณาระบุค่าจ้างตรวจ" : differs ? "ต่างจากสัญญา (" + bahtText(contract) + ") ต้องระบุเหตุผล" : "ตามสัญญา แก้ได้ถ้าจำเป็น"} />
          </div>
          {differs && <TextArea LabelText="เหตุผลที่ค่าจ้างต่างจากสัญญา" Text={c.costReason ?? ""} Placeholder="เช่น ต้องใช้อุปกรณ์เสริม" onChange={(x) => updateResult(plan.mr, car, { costReason: x })}
            onBlur={() => touch("costReason")} State={touched.costReason && !c.costReason?.trim() ? "Error" : undefined} HelperText={touched.costReason && !c.costReason?.trim() ? "กรุณาระบุเหตุผล" : undefined} />}
          {c.date && !inRound(c.date) && <Alert Color="Warning" Text={"วันที่ตรวจอยู่นอกรอบตรวจของแผน (" + rangeText(plan.from, plan.to) + ")"} SupportingText="ส่งได้ แต่ กบค. จะเห็นคำเตือนนี้ตอนพิจารณา" />}
          {cal && <div className="flex"><DatePicker Type="Single" {...TH_PICKER} min={toDate(minDate)} max={toDate(TODAY)} today={toDate(TODAY)}
            value={{ start: toDate(c.date ?? TODAY), end: toDate(c.date ?? TODAY) }} month={toDate(c.date ?? TODAY)}
            onCancel={() => { setCal(false); touch("date"); }} onApply={(r) => { if (r.start) updateResult(plan.mr, car, { date: toIso(r.start) }); setCal(false); touch("date"); }} /></div>}
          <div className="flex flex-col gap-2">
            <InputLabel LabelText="ผลการตรวจ" />
            <RadioTextCards row={!mob} options={RESULTS.map((r) => ({ Text: r }))} value={c.result ?? null}
              onChange={(x) => updateResult(plan.mr, car, { result: x as InspectResult })} />
          </div>
          {c.result === "ตรวจไม่ได้" && (
            <TextArea LabelText="เหตุผลที่ตรวจไม่ได้" Text={c.reason ?? ""} Placeholder="ระบุเหตุผล เช่น ยานพาหนะอยู่ระหว่างซ่อม" onChange={(x) => updateResult(plan.mr, car, { reason: x })}
              onBlur={() => touch("reason")} State={touched.reason && !c.reason?.trim() ? "Error" : undefined} HelperText={touched.reason && !c.reason?.trim() ? "กรุณาระบุเหตุผลที่ตรวจไม่ได้" : undefined} />
          )}
        </>}

        {!(ro && !c.files.length) && <FileUpload LabelText={docLabel(c)} files={c.files} hint={UPLOAD_HINT} max={UPLOAD_MAX_FILES} accept={UPLOAD_ACCEPT} readonly={ro}
              HelperText={error ?? fileErr ?? undefined} Error={!!error || !!fileErr}
              onFiles={(f) => { touch("files"); onFiles(f); }} onDelete={(i) => { removeFile(plan.mr, car, i); setError(null); touch("files"); }} onDownload={(i) => downloadFile(c.files[i].name)} />}
        {!ro && out && <Alert Color={out.Color} Text={out.Text} />}
        {!ro && st !== "none" && (left.length
          ? <Alert Color="Gray" Text={"ยังขาด: " + left.join(", ")} />
          : <Alert Color="Success" Text="ข้อมูลครบ พร้อมส่งอนุมัติ" SupportingText="กดปุ่มส่งอนุมัติที่หน้าแผน" />)}

        {review && <>
          <ContentDivider />
          <section className="flex flex-col gap-4">
            <SectionLabel Title="ผลการพิจารณา" />
            <RadioTextCards options={[{ Text: "อนุมัติ", SupportingText: "ผลตรวจและเอกสาร ปจ.2 ถูกต้อง ล็อกข้อมูลของยานพาหนะคันนี้" }, { Text: "ส่งกลับแก้ไข", SupportingText: "ผู้รับจ้างแก้ไขแล้วส่งอนุมัติอีกครั้ง" }]}
              value={decision === "approve" ? "อนุมัติ" : decision === "return" ? "ส่งกลับแก้ไข" : null}
              onChange={(x) => { setDecision(x === "อนุมัติ" ? "approve" : "return"); setRTouched(false); }} />
            {decision === "return" && <TextArea LabelText="เหตุผลที่ส่งกลับ" Text={reason} Placeholder="ระบุเหตุผลที่ส่งกลับ" onChange={setReason} onBlur={() => setRTouched(true)}
              State={reasonErr ? "Error" : undefined} HelperText={reasonErr ? "กรุณาระบุเหตุผลที่ส่งกลับ" : undefined} />}
          </section>
        </>}
      </div>
    </PopupModal>
  );
}
