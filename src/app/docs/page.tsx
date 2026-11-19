"use client";
/* ผู้รับจ้าง · เมนู Safety Inspection > เอกสาร ปจ.2 — /docs/
   รายการแผนที่ระบุผู้รับจ้างรายนี้ และแผนอนุมัติแล้ว (แผนรออนุมัติยังไม่แสดง) · เปิดแผนเพื่อแนบเอกสาร ปจ.2 รายคันแล้วส่งอนุมัติ
   ตัวกรองประเภทงาน (ผู้รับจ้างรับงานได้มากกว่า 1 ประเภท · เจ้าของงาน 19 พ.ย. 2569) */
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RoleGate } from "@/app/_lib/RoleGate";
import { FilterShell } from "@/components/patterns/FilterShell";
import { DropdownList } from "@/components/vms/DropdownList";
import { DropdownListItem } from "@/components/vms/DropdownListItem";
import { InputDropdownWithBadges } from "@/components/vms/InputDropdownWithBadges";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { AppFrame } from "@/components/shell/AppFrame";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { EmptyStateSearchNotFound } from "@/components/vms/EmptyStateSearchNotFound";
import { MobileCards } from "@/components/vms/MobileTable";
import { PageHeader } from "@/components/vms/PageHeader";
import { Table, type TableColumn, type TableValue } from "@/components/vms/Table";
import { TableHeader } from "@/components/vms/TableHeader";
import { TablePagination } from "@/components/vms/TablePagination";
import { JOB_TYPES, rangeText } from "@/lib/mock/data";
import { carDocs, sentCount } from "@/lib/mock/plan";
import { useMock, useRole, vendorOf } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

const PER = 10;
const COLS: TableColumn[] = [
  { head: "เลขที่ MR", width: 140, Style: "Lead text" },
  { head: "ประเภทงาน", width: 150 },
  { head: "ชื่อแผน" },
  { head: "รอบตรวจ", width: 190 },
  { head: "ยานพาหนะ", width: 110 },
  { head: "ส่งเอกสารแล้ว", width: 140 },
  { head: "สถานะ", width: 170 },
  { head: "", width: 72 },
];

export default function VendorPlans() {
  const router = useRouter();
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const vendor = vendorOf(useRole());
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const mine = useMemo(() => mock.plans.filter((p) => p.vendor === vendor && (p.status === "approved" || p.status === "closed")), [mock.plans, vendor]);
  const [jobs, setJobs] = useState<string[]>([]);
  const [panel, setPanel] = useState(false);
  const [fd, setFd] = useState<string[]>([]);
  const [dd, setDd] = useState(false);
  const q = query.trim();
  const list = mine.filter((p) => (!q || p.mr.includes(q) || p.name.includes(q)) && (!jobs.length || jobs.includes(p.jobType)));
  const data: TableValue[][] = list.slice((page - 1) * PER, page * PER).map((p) => {
    const sent = sentCount(mock, p);
    const draft = p.cars.filter((c) => { const d = carDocs(mock, p.mr, c); return d.files.length && !d.sentAt; }).length;
    const st: [string, "Success" | "Warning" | "Info" | "Gray"] = p.status === "closed" ? ["ปิดงานแล้ว", "Gray"]
      : sent === p.cars.length ? ["ส่งครบแล้ว", "Success"] : draft ? ["มีเอกสารยังไม่ส่ง", "Warning"] : ["รอแนบเอกสาร", "Info"];
    const open = { IconSwap: "quick_reference_all-24-300-round", label: "เปิดแผน " + p.mr, onClick: () => router.push("/docs/plan/?mr=" + p.mr) };
    return [p.mr, { pills: [[p.jobType, "Brand"]] }, p.name, rangeText(p.from, p.to), p.cars.length + " คัน", sent + "/" + p.cars.length + " คัน", { pills: [st] }, { actions: [open], mobileActions: [open] }];
  });
  const rowKey = (r: TableValue[]) => String(r[0]);
  return (
    <AppFrame>
      <RoleGate vendor>
        <PageHeader Title="เอกสาร ปจ.2" SupportingText="แผนตรวจ ปจ.2 ที่คุณเป็นผู้รับจ้าง แนบเอกสารรายคันแล้วส่งอนุมัติ" crumbs={[{ Text: "Safety Inspection" }, { Text: "เอกสาร ปจ.2" }]} />
        {!mine.length ? <EmptyStateDataEmpty Text="ยังไม่มีแผนที่ต้องส่งเอกสาร" SupportingText="เมื่อ กบค. สร้างแผนที่ระบุคุณเป็นผู้รับจ้างและแผนอนุมัติแล้ว แผนจะแสดงที่นี่" /> : (
          <section className="flex flex-col gap-6">
            <TableHeader Placeholder="ค้นหาเลขที่ MR, ชื่อแผน" query={query} onQuery={(v) => { setQuery(v); setPage(1); }}
              onFilter={() => { setFd(jobs); setDd(false); setPanel(true); }} FilterCount={jobs.length} Filters={jobs} onRemoveFilter={(c) => { setJobs(jobs.filter((x) => x !== c)); setPage(1); }} />
            {!list.length ? <EmptyStateSearchNotFound Actions={<SecondaryButton Text="ล้างตัวกรอง" Size={mob ? "lg" : "md"} onClick={() => { setQuery(""); setJobs([]); setPage(1); }} />} /> : mob ? (
              <div className="flex flex-col gap-5">
                <MobileCards columns={COLS} rows={data} rowKey={rowKey} />
                <TablePagination total={list.length} page={page} perPage={PER} onPage={setPage} />
              </div>
            ) : <Table columns={COLS} rows={data} rowKey={rowKey} Pagination={<TablePagination total={list.length} page={page} perPage={PER} onPage={setPage} />} />}
          </section>
        )}
        <FilterShell open={panel} onClose={() => { setDd(false); setPanel(false); }} onClear={() => setFd([])} onApply={() => { setJobs(fd); setPage(1); setDd(false); setPanel(false); }}>
          <InputDropdownWithBadges LabelText="ประเภทงาน" Optional values={fd} Placeholder="ทั้งหมด" onRemove={(v) => setFd(fd.filter((x) => x !== v))} open={dd} onOpenChange={setDd}>
            <DropdownList>{JOB_TYPES.map((t) => <DropdownListItem key={t} Text={t} State={fd.includes(t) ? "Selected" : "Default"} onClick={() => setFd(fd.includes(t) ? fd.filter((x) => x !== t) : [...fd, t])} />)}</DropdownList>
          </InputDropdownWithBadges>
        </FilterShell>
      </RoleGate>
    </AppFrame>
  );
}
