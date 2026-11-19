"use client";
/* ตารางยานพาหนะในแผน + สถานะเอกสาร ปจ.2 รายคัน · popup แนบ/ดูเอกสาร (ใช้ทั้งผู้รับจ้างและ กบค.)
   ผู้รับจ้าง (canEdit): คันที่ยังไม่ส่ง = แนบ/ลบไฟล์ได้ · คันที่ส่งอนุมัติแล้ว = ล็อก ดูและดาวน์โหลดได้อย่างเดียว
   กบค.: ดูและดาวน์โหลดอย่างเดียวทุกคัน
   เงื่อนไขไฟล์: PDF/PNG/JPG · ไฟล์ละไม่เกิน 10 MB · สูงสุด 10 ไฟล์ต่อคัน */
import { useState } from "react";
import { PopupModal } from "@/components/patterns/PopupModal";
import { Alert } from "@/components/vms/Alert";
import { FileUpload } from "@/components/vms/FileUpload";
import { MobileCards } from "@/components/vms/MobileTable";
import { Table, type TableColumn, type TableValue } from "@/components/vms/Table";
import { TablePagination } from "@/components/vms/TablePagination";
import { downloadFile, rememberFiles } from "@/lib/fileDownload";
import { UPLOAD_ACCEPT, UPLOAD_HINT, UPLOAD_MAX_FILES, VEHICLE_BY_ID, dateText, dueSub, fileOk, sizeText, type Plan } from "@/lib/mock/data";
import { DOC_TEXT, addFiles, carDocs, docState, removeFile } from "@/lib/mock/plan";
import { notify, useMock } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

const COLS: TableColumn[] = [
  { head: "ทะเบียน", width: 210, Style: "Lead text" },
  { head: "ประเภทยานพาหนะ", width: 160 },
  { head: "สังกัด" },
  { head: "ครบกำหนดตรวจ", width: 160 },
  { head: "เอกสาร", width: 100 },
  { head: "สถานะเอกสาร", width: 170 },
  { head: "", width: 72 },
];
const PER = 10;

export function DocsTable({ plan, canEdit }: { plan: Plan; canEdit: boolean }) {
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const last = Math.max(1, Math.ceil(plan.cars.length / PER)), pg = Math.min(page, last);

  const rows: TableValue[][] = plan.cars.slice((pg - 1) * PER, pg * PER).map((id) => {
    const v = VEHICLE_BY_ID[id];
    const c = carDocs(mock, plan.mr, id);
    const st = docState(c);
    const editHere = canEdit && st !== "sent";
    const act = { IconSwap: editHere ? "upload-24-300-round" : "quick_reference_all-24-300-round", label: (editHere ? "แนบเอกสาร " : "ดูเอกสาร ") + v.plate, onClick: () => setOpen(id) };
    return [
      { text: v.plate, sub: v.code }, v.type, v.org, { text: dateText(v.due), sub: dueSub(v.due) },
      c.files.length + " ไฟล์",
      { pills: [DOC_TEXT[st]] },
      { actions: [act], mobileActions: [act] },
    ];
  });
  const rowKey = (r: TableValue[]) => { const v = r[0]; return v && typeof v === "object" && "text" in v ? v.text : String(v); };

  return (
    <>
      {mob ? (
        <div className="flex flex-col gap-5">
          <MobileCards columns={COLS} rows={rows} rowKey={rowKey} />
          <TablePagination total={plan.cars.length} page={pg} perPage={PER} onPage={setPage} />
        </div>
      ) : <Table columns={COLS} rows={rows} rowKey={rowKey} Pagination={<TablePagination total={plan.cars.length} page={pg} perPage={PER} onPage={setPage} />} />}
      {open && <DocsModal plan={plan} car={open} canEdit={canEdit} onClose={() => setOpen(null)} />}
    </>
  );
}

function DocsModal({ plan, car, canEdit, onClose }: { plan: Plan; car: string; canEdit: boolean; onClose: () => void }) {
  const mock = useMock();
  const v = VEHICLE_BY_ID[car];
  const c = carDocs(mock, plan.mr, car);
  const locked = !!c.sentAt;
  const ro = !canEdit || locked;
  const [error, setError] = useState<string | null>(null);

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

  return (
    <PopupModal open title={(ro ? "เอกสาร ปจ.2 · " : "แนบเอกสาร ปจ.2 · ") + v.plate} sub={v.code + " · " + v.type + " · " + v.org}
      showOk={false} cancel="ปิด" onCancel={onClose}>
      <div className="flex flex-col gap-4">
        {locked && <Alert Color="Success" Text={"ส่งอนุมัติแล้วเมื่อ " + dateText(c.sentAt!)} SupportingText={canEdit ? "เอกสารที่ส่งแล้วแก้ไขหรือลบไม่ได้ ดูและดาวน์โหลดได้" : undefined} />}
        {!canEdit && !locked && c.files.length > 0 && <Alert Color="Warning" Text="ผู้รับจ้างยังไม่ส่งอนุมัติ" SupportingText="เอกสารอาจมีการเปลี่ยนแปลงจนกว่าผู้รับจ้างจะส่ง" />}
        {ro && !c.files.length
          ? <p className="text-sm text-gray-600">ยังไม่มีเอกสาร</p>
          : <FileUpload LabelText="เอกสาร ปจ.2" files={c.files} hint={UPLOAD_HINT} max={UPLOAD_MAX_FILES} accept={UPLOAD_ACCEPT} readonly={ro}
              HelperText={error ?? undefined} Error={!!error}
              onFiles={onFiles} onDelete={(i) => { removeFile(plan.mr, car, i); setError(null); }} onDownload={(i) => downloadFile(c.files[i].name)} />}
      </div>
    </PopupModal>
  );
}
