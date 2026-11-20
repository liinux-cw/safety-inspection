"use client";
/* หัวหน้า กบค. · แผนรออนุมัติ — /approvals/ (เมนู Safety Inspection › แผนรออนุมัติ)
   แท็บ: รออนุมัติแผน (ทุกแผนที่ กบค. ส่งมา) · รออนุมัติปิดงาน (เฉพาะที่ กบค. เลือกหัวหน้าคนนี้) · ดำเนินการแล้ว
   ติ๊กหลายแผนแล้วอนุมัติพร้อมกันได้ (เจ้าของงาน 20 พ.ย. 2569) · ส่งกลับแก้ไขทำทีละแผนในหน้ารายละเอียด (ต้องมีเหตุผล)
   ประกอบจาก Page header + Tabs/Tab item + Table header + CheckTable + Table + Table pagination + ConfirmDialog */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RoleGate } from "@/app/_lib/RoleGate";
import { CheckTable } from "@/components/patterns/CheckTable";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { AppFrame } from "@/components/shell/AppFrame";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { EmptyStateSearchNotFound } from "@/components/vms/EmptyStateSearchNotFound";
import { MobileCards } from "@/components/vms/MobileTable";
import { PageHeader } from "@/components/vms/PageHeader";
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { TabItem } from "@/components/vms/TabItem";
import { Table, type TableColumn, type TableValue } from "@/components/vms/Table";
import { TableHeader } from "@/components/vms/TableHeader";
import { TablePagination } from "@/components/vms/TablePagination";
import { Tabs } from "@/components/vms/Tabs";
import { STATUS_TEXT, VENDOR_BY_ID, bahtText, dateText, rangeText, type Plan } from "@/lib/mock/data";
import { approveClose, approvePlans, budget } from "@/lib/mock/plan";
import { headOf, notify, useMock, useRole } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

const PER = 10;
type Tab = "plan" | "close" | "done";
const COLS: TableColumn[] = [
  { head: "เลขที่ MR / ชื่อแผน" },
  { head: "รอบตรวจ", width: 190 },
  { head: "ผู้รับจ้าง", width: 210 },
  { head: "ยานพาหนะ", width: 100 },
  { head: "งบรวมตามสัญญา", width: 160 },
  { head: "วันที่ส่ง", width: 120 },
  { head: "", width: 104 },
];
const DONE_COLS: TableColumn[] = [...COLS.slice(0, 5), { head: "สถานะ", width: 160 }, { head: "", width: 72 }];

export default function Approvals() {
  const router = useRouter();
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const me = headOf(useRole());
  const [tab, setTab] = useState<Tab>("plan");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [ticked, setTicked] = useState<string[]>([]);
  const [ask, setAsk] = useState(false);
  /* อนุมัติทีละแผนจากไอคอนท้ายแถว (one) หรือหลายแผนที่ติ๊ก (sel) */
  const [one, setOne] = useState<string | null>(null);

  const lists: Record<Tab, Plan[]> = {
    plan: mock.plans.filter((p) => p.status === "review"),
    close: mock.plans.filter((p) => p.status === "closing" && p.closeApprover === me),
    done: mock.plans.filter((p) => p.approvedBy === me || (p.status === "closed" && p.closeApprover === me)),
  };
  const q = query.trim();
  const list = lists[tab].filter((p) => !q || p.mr.includes(q) || p.name.includes(q));
  const last = Math.max(1, Math.ceil(list.length / PER)), pg = Math.min(page, last);
  const shown = list.slice((pg - 1) * PER, pg * PER);
  const sel = ticked.filter((mr) => list.some((p) => p.mr === mr));
  const switchTab = (t: Tab) => { setTab(t); setPage(1); setTicked([]); setQuery(""); };
  const open = (p: Plan) => router.push("/approvals/detail/?mr=" + p.mr);
  const act = (p: Plan) => ({ IconSwap: "quick_reference_all-24-300-round", label: "ดูรายละเอียด " + p.mr, onClick: () => open(p) });
  const sentOn = (p: Plan) => { const d = tab === "close" ? p.closeRequestedAt : p.submittedAt; return d ? dateText(d) : "-"; };

  const approveText = tab === "plan" ? "อนุมัติแผน" : "อนุมัติปิดงาน";
  const targets = one ? [one] : sel;
  const confirm = () => {
    setAsk(false);
    if (!me) return;
    const label = one ? one + " " : targets.length + " แผน";
    if (tab === "plan") { approvePlans(targets, me); notify("อนุมัติแผน " + label + "แล้ว · ผู้รับจ้างเห็นแผนแล้ว"); }
    else { approveClose(targets); notify("อนุมัติปิดงาน " + label + "แล้ว"); }
    setTicked(ticked.filter((x) => !targets.includes(x))); setOne(null);
  };
  const approveOne = (p: Plan) => ({ IconSwap: "check_circle-24-300-round", label: (tab === "plan" ? "อนุมัติแผน " : "อนุมัติปิดงาน ") + p.mr, onClick: () => { setOne(p.mr); setAsk(true); } });

  const pendingRows = shown.map((p) => ({
    key: p.mr, text: p.mr, sub: p.name,
    mobileSub: p.name + " · " + (VENDOR_BY_ID[p.vendor]?.name ?? "-") + " · " + p.cars.length + " คัน · " + bahtText(budget(p)),
    cells: [rangeText(p.from, p.to), VENDOR_BY_ID[p.vendor]?.name ?? "-", p.cars.length + " คัน", bahtText(budget(p)), sentOn(p), { actions: [act(p), approveOne(p)] }] as TableValue[],
    mobileActions: [act(p), approveOne(p)],
  }));
  const doneRows: TableValue[][] = shown.map((p) => [
    { text: p.mr, sub: p.name }, rangeText(p.from, p.to), VENDOR_BY_ID[p.vendor]?.name ?? "-", p.cars.length + " คัน", bahtText(budget(p)),
    { pills: [STATUS_TEXT[p.status]] }, { actions: [act(p)], mobileActions: [act(p)] },
  ]);
  const rowKey = (r: TableValue[]) => { const v = r[0]; return v && typeof v === "object" && "text" in v ? v.text : String(v); };
  const pagination = <TablePagination total={list.length} page={pg} perPage={PER} onPage={setPage} />;
  const emptyText = tab === "plan" ? "ไม่มีแผนรออนุมัติ" : tab === "close" ? "ไม่มีแผนรออนุมัติปิดงาน" : "ยังไม่มีแผนที่ดำเนินการแล้ว";

  return (
    <AppFrame>
      <RoleGate head>
        <PageHeader Title="แผนรออนุมัติ" crumbs={[{ Text: "Safety Inspection" }, { Text: "แผนรออนุมัติ" }]} />
        <section className="flex flex-col gap-6">
          <Tabs>
            <TabItem Text="รออนุมัติแผน" Badge={lists.plan.length} Active={tab === "plan"} onClick={() => switchTab("plan")} />
            <TabItem Text="รออนุมัติปิดงาน" Badge={lists.close.length} Active={tab === "close"} onClick={() => switchTab("close")} />
            <TabItem Text="ดำเนินการแล้ว" Active={tab === "done"} onClick={() => switchTab("done")} />
          </Tabs>
          {!lists[tab].length ? <EmptyStateDataEmpty Text={emptyText} /> : <>
            <TableHeader Placeholder="ค้นหาเลขที่ MR, ชื่อแผน" query={query} onQuery={(v) => { setQuery(v); setPage(1); }} FilterButton={false}
              Actions={tab !== "done" ? <PrimaryButton Text={approveText + (sel.length ? " (" + sel.length + ")" : "")} LeadingIconSwap="done_all-24-300-round"
                Size={mob ? "lg" : "md"} State={sel.length ? "Default" : "Disabled"} onClick={() => { if (sel.length) { setOne(null); setAsk(true); } }} /> : undefined} />
            {!list.length ? <EmptyStateSearchNotFound />
              : tab === "done"
                ? (mob ? <div className="flex flex-col gap-5"><MobileCards columns={DONE_COLS} rows={doneRows} rowKey={rowKey} />{pagination}</div>
                  : <Table columns={DONE_COLS} rows={doneRows} rowKey={rowKey} Pagination={pagination} />)
                : <CheckTable columns={COLS} rows={pendingRows} ticked={sel} onTicked={setTicked} scope={list.map((p) => ({ key: p.mr }))} Pagination={pagination} />}
          </>}
        </section>
        <ConfirmDialog spec={ask ? { title: approveText + " " + (one ?? targets.length + " แผน"), sub: tab === "plan" ? "ผู้รับจ้างของแผนที่เลือกจะเห็นแผนและเริ่มบันทึกผลตรวจได้" : "แผนที่เลือกจะปิดงาน แก้ไขไม่ได้อีก", cancel: "ยกเลิก", ok: approveText } : null}
          onCancel={() => { setAsk(false); setOne(null); }} onOk={confirm} />
      </RoleGate>
    </AppFrame>
  );
}
