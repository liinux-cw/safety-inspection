"use client";
/* ผู้รับจ้าง · เมนู Safety Inspection > เอกสาร ปจ.2 — /docs/
   รายการแผนเดินทางที่ระบุผู้รับจ้างรายนี้ เห็นหลังหัวหน้า กบค. อนุมัติแผนเดินทาง · เปิดแผนเดินทางเพื่อบันทึกผลตรวจ ปจ.2 รายคันแล้วส่งให้ กบค. อนุมัติ */
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RoleGate } from "@/app/_lib/RoleGate";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { AppFrame } from "@/components/shell/AppFrame";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { EmptyStateSearchNotFound } from "@/components/vms/EmptyStateSearchNotFound";
import { MobileCards } from "@/components/vms/MobileTable";
import { PageHeader } from "@/components/vms/PageHeader";
import { Table, type TableColumn, type TableValue } from "@/components/vms/Table";
import { TableHeader } from "@/components/vms/TableHeader";
import { TablePagination } from "@/components/vms/TablePagination";
import { dayRange } from "@/lib/mock/data";
import { approvedCount, pendingCount, readyCars, returnedCount, vendorSeesTrip } from "@/lib/mock/plan";
import { useMock, useRole, vendorOf } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

const PER = 10;
const COLS: TableColumn[] = [
  { head: "ชื่อแผนเดินทาง", Style: "Lead text" },
  { head: "ช่วงวันทำงาน", width: 220 },
  { head: "ยานพาหนะ", width: 110 },
  { head: "อนุมัติแล้ว", width: 120 },
  { head: "สถานะ", width: 210 },
  { head: "", width: 72 },
];

export default function VendorPlans() {
  const router = useRouter();
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const vendor = vendorOf(useRole());
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const mine = useMemo(() => mock.trips.filter((t) => t.vendor === vendor && vendorSeesTrip(t)), [mock.trips, vendor]);
  const q = query.trim();
  const list = mine.filter((p) => (!q || p.mr.includes(q) || p.name.includes(q)));
  const data: TableValue[][] = list.slice((page - 1) * PER, page * PER).map((p) => {
    const ok = approvedCount(mock, p), ret = returnedCount(mock, p), pend = pendingCount(mock, p), draft = readyCars(mock, p).length - ret;
    const st: [string, "Success" | "Warning" | "Info" | "Gray" | "Error"] = p.status === "closed" ? ["ปิดงานแล้ว", "Gray"]
      : p.status === "closing" ? ["รออนุมัติปิดงาน", "Warning"]
      : p.closeReturnReason ? ["คำขอปิดงานถูกส่งกลับ", "Error"]
      : ret ? ["มีเอกสารที่ถูกส่งกลับแก้ไข", "Error"] : ok === p.cars.length ? ["พร้อมส่งปิดงาน", "Success"]
      : draft ? ["มีเอกสารยังไม่ส่ง", "Warning"] : pend ? ["รอ กบค. อนุมัติ", "Info"] : ["รอแนบเอกสาร", "Gray"];
    const open = { IconSwap: "quick_reference_all-24-300-round", label: "เปิด " + p.name, onClick: () => router.push("/docs/trip/?id=" + p.id) };
    return [{ text: p.name, sub: p.mr }, dayRange(p.d1, p.d2), p.cars.length + " คัน", ok + "/" + p.cars.length + " คัน", { pills: [st] }, { actions: [open], mobileActions: [open] }];
  });
  const rowKey = (r: TableValue[]) => (r[0] as { text: string }).text;
  return (
    <AppFrame>
      <RoleGate vendor>
        <PageHeader Title="เอกสาร ปจ.2" SupportingText="แผนเดินทางที่คุณเป็นผู้รับจ้าง บันทึกผลตรวจรายคันแล้วส่งอนุมัติ" crumbs={[{ Text: "Safety Inspection" }, { Text: "เอกสาร ปจ.2" }]} />
        {!mine.length ? <EmptyStateDataEmpty Text="ยังไม่มีแผนเดินทางที่ต้องส่งเอกสาร" SupportingText="เมื่อแผนเดินทางที่ระบุคุณเป็นผู้รับจ้างได้รับอนุมัติ แผนเดินทางจะแสดงที่นี่" /> : (
          <section className="flex flex-col gap-6">
            <TableHeader Placeholder="ค้นหาชื่อแผนเดินทาง, เลขที่ MR" query={query} onQuery={(v) => { setQuery(v); setPage(1); }} FilterButton={false} />
            {!list.length ? <EmptyStateSearchNotFound Actions={<SecondaryButton Text="ล้างตัวกรอง" Size={mob ? "lg" : "md"} onClick={() => { setQuery(""); setPage(1); }} />} /> : mob ? (
              <div className="flex flex-col gap-5">
                <MobileCards columns={COLS} rows={data} rowKey={rowKey} />
                <TablePagination total={list.length} page={page} perPage={PER} onPage={setPage} />
              </div>
            ) : <Table columns={COLS} rows={data} rowKey={rowKey} Pagination={<TablePagination total={list.length} page={page} perPage={PER} onPage={setPage} />} />}
          </section>
        )}
      </RoleGate>
    </AppFrame>
  );
}
