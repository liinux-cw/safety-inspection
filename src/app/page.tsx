"use client";
/* รายการแผนตรวจ ปจ.2 (กบค.) — รากเว็บ / · เมนู Safety Inspection > แผนตรวจ ปจ.2
   Page header → Table header (ค้นหา + ตัวกรอง + Primary "สร้างแผนตรวจ ปจ.2") + Table + Table pagination · มือถือ Mobile table
   เมนู "…": ดูรายละเอียด · แก้ไข · ลบ (แก้ไข/ลบ เฉพาะแผนที่ยังไม่อนุมัติ) · ผู้รับจ้างเข้าหน้านี้ = ไปเมนูเอกสาร ปจ.2 */
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { FilterShell } from "@/components/patterns/FilterShell";
import { RowMenu, anchorOf, type MenuAnchor } from "@/components/patterns/RowMenu";
import { AppFrame } from "@/components/shell/AppFrame";
import { DropdownList } from "@/components/vms/DropdownList";
import { DropdownListItem } from "@/components/vms/DropdownListItem";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { EmptyStateSearchNotFound } from "@/components/vms/EmptyStateSearchNotFound";
import { InputDropdownWithBadges } from "@/components/vms/InputDropdownWithBadges";
import { MobileCards } from "@/components/vms/MobileTable";
import { PageHeader } from "@/components/vms/PageHeader";
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { Table, type TableColumn, type TableValue } from "@/components/vms/Table";
import { TableHeader } from "@/components/vms/TableHeader";
import { TablePagination } from "@/components/vms/TablePagination";
import { STATUS_TEXT, VENDORS, VENDOR_BY_ID, rangeText, type Plan, type PlanStatus } from "@/lib/mock/data";
import { approvedCount, deletePlan, editable, pendingCount } from "@/lib/mock/plan";
import { notify, useHydrated, useMock, useRole, vendorOf } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

const PER = 10;
const COLS: TableColumn[] = [
  { head: "เลขที่ MR", width: 140, Style: "Lead text" },
  { head: "ชื่อแผน" },
  { head: "รอบตรวจ", width: 190 },
  { head: "ผู้รับจ้าง", width: 220 },
  { head: "ยานพาหนะ", width: 110 },
  { head: "เอกสาร ปจ.2", width: 140 },
  { head: "สถานะ", width: 140 },
  { head: "", width: 72 },
];
const MENU = [
  { Text: "ดูรายละเอียด", IconSwap: "quick_reference_all-24-300-round" },
  { Text: "แก้ไข", IconSwap: "stylus-24-300-round" },
  { Text: "ลบ", IconSwap: "delete-24-300-round" },
];
const STATUSES = Object.keys(STATUS_TEXT) as PlanStatus[];
const DELETE_CONFIRM = { danger: true, title: "ยืนยันการลบแผนตรวจ ปจ.2", sub: "แผนและรายการยานพาหนะในแผนจะถูกลบ ไม่สามารถกู้คืนได้", cancel: "ยกเลิก", ok: "ลบแผน" };

export default function PlanList() {
  const router = useRouter();
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const role = useRole();
  const hydrated = useHydrated();
  useEffect(() => { if (hydrated && vendorOf(role)) router.replace("/docs/"); }, [hydrated, role, router]);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState<{ mr: string; anchor: MenuAnchor } | null>(null);
  const [del, setDel] = useState<string | null>(null);
  type F = { status: string[]; vendor: string[] };
  const NONE: F = { status: [], vendor: [] };
  const [applied, setApplied] = useState<F>(NONE);
  const [panel, setPanel] = useState(false);
  const [fd, setFd] = useState<F>(NONE);
  const [dd, setDd] = useState("");
  const flip = (k: keyof F, v: string) => setFd((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));
  const drop = (k: keyof F) => (v: string) => setFd((f) => ({ ...f, [k]: f[k].filter((x) => x !== v) }));
  const chips = [...applied.status, ...applied.vendor];
  const removeChip = (c: string) => { setApplied((a) => ({ status: a.status.filter((x) => x !== c), vendor: a.vendor.filter((x) => x !== c) })); setPage(1); };

  const rows = useMemo(() => {
    const q = query.trim();
    return mock.plans.filter((p) => (!q || p.mr.includes(q) || p.name.includes(q))
      && (!applied.status.length || applied.status.includes(STATUS_TEXT[p.status][0]))
      && (!applied.vendor.length || applied.vendor.includes(VENDOR_BY_ID[p.vendor]?.name ?? "")));
  }, [mock.plans, query, applied]);
  const shown = rows.slice((page - 1) * PER, page * PER);

  const nMenu = (p: Plan) => (editable(p) ? 3 : 1);
  const act = (p: Plan, i: number) => {
    if (i === 0) router.push("/detail/?mr=" + p.mr);
    else if (i === 1) router.push("/edit/?mr=" + p.mr);
    else setDel(p.mr);
  };
  const opened = mock.plans.find((p) => p.mr === menu?.mr);
  const items = opened ? MENU.slice(0, nMenu(opened)).map((m, i) => ({ ...m, onClick: () => act(opened, i) })) : [];

  const data: TableValue[][] = shown.map((p) => [
    p.mr,
    { text: p.name, sub: "ปีงบประมาณ " + p.fy },
    rangeText(p.from, p.to),
    VENDOR_BY_ID[p.vendor]?.name ?? "-",
    p.cars.length + " คัน",
    { text: "อนุมัติ " + approvedCount(mock, p) + "/" + p.cars.length, sub: pendingCount(mock, p) ? "รออนุมัติ " + pendingCount(mock, p) + " คัน" : undefined },
    { pills: [STATUS_TEXT[p.status]] },
    {
      actions: [{ IconSwap: "more_horiz-20-400-round", label: "เมนู " + p.mr, onClick: (e) => setMenu({ mr: p.mr, anchor: anchorOf(e.currentTarget) }) }],
      mobileActions: MENU.slice(0, nMenu(p)).map((m, i) => ({ IconSwap: m.IconSwap, label: m.Text + " " + p.mr, onClick: () => act(p, i) })),
    },
  ]);
  const rowKey = (r: TableValue[]) => String(r[0]);
  const create = <PrimaryButton Text="สร้างแผนตรวจ ปจ.2" LeadingIconSwap="add-24-300-round" Size={mob ? "lg" : "md"} onClick={() => router.push("/new/")} />;

  return (
    <AppFrame>
      <PageHeader Title="แผนตรวจ ปจ.2" crumbs={[{ Text: "งานซ่อมและบำรุงรักษา" }, { Text: "แผนตรวจ ปจ.2" }]} />
      {hydrated && !mock.plans.length ? (
        <EmptyStateDataEmpty Text="ยังไม่มีแผนตรวจ ปจ.2" SupportingText="เมื่อสร้างแผนตรวจ ปจ.2 รายการแผนจะแสดงที่นี่" Actions={create} />
      ) : (
        <section className="flex flex-col gap-6">
          <TableHeader Placeholder="ค้นหาเลขที่ MR, ชื่อแผน" query={query} onQuery={(q) => { setQuery(q); setPage(1); }} Actions={create}
            onFilter={() => { setFd(applied); setDd(""); setPanel(true); }} FilterCount={chips.length} Filters={chips} onRemoveFilter={removeChip} />
          {!rows.length ? (
            <EmptyStateSearchNotFound Actions={<SecondaryButton Text="ล้างตัวกรอง" Size={mob ? "lg" : "md"} onClick={() => { setQuery(""); setApplied(NONE); setPage(1); }} />} />
          ) : mob ? (
            <div className="flex flex-col gap-5">
              <MobileCards columns={COLS} rows={data} rowKey={rowKey} />
              <TablePagination total={rows.length} page={page} perPage={PER} onPage={setPage} />
            </div>
          ) : (
            <Table columns={COLS} rows={data} rowKey={rowKey} Pagination={<TablePagination total={rows.length} page={page} perPage={PER} onPage={setPage} />} />
          )}
        </section>
      )}
      <RowMenu anchor={menu?.anchor ?? null} items={items} onClose={() => setMenu(null)} />
      <FilterShell open={panel} onClose={() => { setDd(""); setPanel(false); }} onClear={() => setFd(NONE)} onApply={() => { setApplied(fd); setPage(1); setDd(""); setPanel(false); }}>
        <InputDropdownWithBadges LabelText="สถานะ" Optional values={fd.status} Placeholder="ทั้งหมด" onRemove={drop("status")} open={dd === "status"} onOpenChange={(v) => setDd(v ? "status" : "")}>
          <DropdownList>{STATUSES.map((s) => STATUS_TEXT[s][0]).map((t) => <DropdownListItem key={t} Text={t} State={fd.status.includes(t) ? "Selected" : "Default"} onClick={() => flip("status", t)} />)}</DropdownList>
        </InputDropdownWithBadges>
        <InputDropdownWithBadges LabelText="ผู้รับจ้าง" Optional values={fd.vendor} Placeholder="ทั้งหมด" onRemove={drop("vendor")} open={dd === "vendor"} onOpenChange={(v) => setDd(v ? "vendor" : "")}>
          <DropdownList>{VENDORS.map((v) => <DropdownListItem key={v.id} Text={v.name} State={fd.vendor.includes(v.name) ? "Selected" : "Default"} onClick={() => flip("vendor", v.name)} />)}</DropdownList>
        </InputDropdownWithBadges>
      </FilterShell>
      <ConfirmDialog spec={del ? DELETE_CONFIRM : null} onCancel={() => setDel(null)}
        onOk={() => { const mr = del; setDel(null); if (mr) { deletePlan(mr); notify("ลบแผนตรวจ ปจ.2 " + mr + " สำเร็จ"); } }} />
    </AppFrame>
  );
}
