"use client";
/* หัวหน้า กบค. · แผนรออนุมัติ — /approvals/ (เมนู Safety Inspection › แผนรออนุมัติ)
   แท็บ: รออนุมัติแผน · รออนุมัติแผนเดินทาง (20 พ.ย. 2569) · ดำเนินการแล้ว — ไม่มีปิดแผนหลัก ปิดงานเฉพาะแผนเดินทางโดย กบค. (เจ้าของงาน 20 พ.ย. 2569)
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
import { STATUS_TEXT, TRIP_STATUS_TEXT, VENDOR_BY_ID, dateText, dayRange, rangeText, type Plan, type Trip } from "@/lib/mock/data";
import { approvePlans, approveTrips } from "@/lib/mock/plan";
import { headOf, notify, useMock, useRole } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

const PER = 10;
type Tab = "plan" | "trip" | "done";
/** แถวของแผนหรือแผนเดินทาง (หัวหน้า กบค. อนุมัติทั้งสองอย่าง) */
interface Item { key: string; kind: "plan" | "trip"; title: string; sub: string; range: string; cars: number; sent?: string; pill: [string, "Warning" | "Error" | "Info" | "Gray" | "Purple"]; href: string }
const COLS: TableColumn[] = [
  { head: "ชื่อ" },
  { head: "ช่วงเวลา", width: 230 },
  { head: "ยานพาหนะ", width: 120 },
  { head: "วันที่ส่ง", width: 140 },
  { head: "", width: 104 },
];
const DONE_COLS: TableColumn[] = [...COLS.slice(0, 3), { head: "สถานะ", width: 160 }, { head: "", width: 72 }];
const TEXT: Record<"plan" | "trip", { approve: string; unit: string; sub: string; done: string }> = {
  plan: { approve: "อนุมัติแผน", unit: "แผน", sub: "กบค. สร้างแผนเดินทางของแผนที่เลือกได้ เพื่อเลือกผู้รับจ้างและนัดวันเข้าตรวจ", done: "กบค. สร้างแผนเดินทางได้แล้ว" },
  trip: { approve: "อนุมัติแผนเดินทาง", unit: "แผนเดินทาง", sub: "แจ้งผู้รับจ้าง กรย. และผู้ดูแลยานพาหนะ · ผู้รับจ้างเริ่มบันทึกผลตรวจได้", done: "แจ้งผู้รับจ้าง กรย. และผู้ดูแลยานพาหนะแล้ว" },
};

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
  /* อนุมัติทีละรายการจากไอคอนท้ายแถว (one) หรือหลายรายการที่ติ๊ก (sel) */
  const [one, setOne] = useState<string | null>(null);

  const planItem = (p: Plan): Item => ({ key: p.mr, kind: "plan", title: p.mr, sub: p.name, range: rangeText(p.from, p.to), cars: p.cars.length, sent: p.submittedAt, pill: STATUS_TEXT[p.status], href: "/approvals/detail/?mr=" + p.mr });
  const tripItem = (t: Trip): Item => ({ key: t.id, kind: "trip", title: t.name, sub: t.mr + " · " + (VENDOR_BY_ID[t.vendor]?.name ?? "-"), range: dayRange(t.d1, t.d2), cars: t.cars.length, sent: t.submittedAt, pill: TRIP_STATUS_TEXT[t.status], href: "/approvals/trip/?id=" + t.id });
  const lists: Record<Tab, Item[]> = {
    plan: mock.plans.filter((p) => p.status === "review").map(planItem),
    trip: mock.trips.filter((t) => t.status === "review").map(tripItem),
    done: [...mock.plans.filter((p) => p.approvedBy === me).map(planItem), ...mock.trips.filter((t) => t.approvedBy === me).map(tripItem)],
  };
  const q = query.trim();
  const list = lists[tab].filter((x) => !q || x.title.includes(q) || x.sub.includes(q));
  const last = Math.max(1, Math.ceil(list.length / PER)), pg = Math.min(page, last);
  const shown = list.slice((pg - 1) * PER, pg * PER);
  const sel = ticked.filter((k) => list.some((x) => x.key === k));
  const switchTab = (t: Tab) => { setTab(t); setPage(1); setTicked([]); setQuery(""); };
  const act = (x: Item) => ({ IconSwap: "quick_reference_all-24-300-round", label: "ดูรายละเอียด " + x.title, onClick: () => router.push(x.href) });
  const sentOn = (x: Item) => (x.sent ? dateText(x.sent) : "-");

  const kind = tab === "trip" ? "trip" : "plan";
  const T = TEXT[kind];
  const targets = one ? [one] : sel;
  const confirm = () => {
    setAsk(false);
    if (!me) return;
    const label = one ? (list.find((x) => x.key === one)?.title ?? one) + " " : targets.length + " " + T.unit;
    if (kind === "plan") approvePlans(targets, me); else approveTrips(targets, me);
    notify(T.approve + " " + label + "แล้ว · " + T.done);
    setTicked(ticked.filter((x) => !targets.includes(x))); setOne(null);
  };
  const approveOne = (x: Item) => ({ IconSwap: "check_circle-24-300-round", label: TEXT[x.kind].approve + " " + x.title, onClick: () => { setOne(x.key); setAsk(true); } });

  const pendingRows = shown.map((x) => ({
    key: x.key, text: x.title, sub: x.sub,
    mobileSub: x.sub + " · " + x.range + " · " + x.cars + " คัน",
    cells: [x.range, x.cars + " คัน", sentOn(x), { actions: [act(x), approveOne(x)] }] as TableValue[],
    mobileActions: [act(x), approveOne(x)],
  }));
  const doneRows: TableValue[][] = shown.map((x) => [
    { text: x.title, sub: (x.kind === "trip" ? "แผนเดินทาง · " : "แผนตรวจ · ") + x.sub }, x.range, x.cars + " คัน",
    { pills: [x.pill] }, { actions: [act(x)], mobileActions: [act(x)] },
  ]);
  const rowKey = (r: TableValue[]) => { const v = r[0]; return v && typeof v === "object" && "text" in v ? v.text + v.sub : String(v); };
  const pagination = <TablePagination total={list.length} page={pg} perPage={PER} onPage={setPage} />;
  const emptyText = tab === "plan" ? "ไม่มีแผนรออนุมัติ" : tab === "trip" ? "ไม่มีแผนเดินทางรออนุมัติ" : "ยังไม่มีรายการที่ดำเนินการแล้ว";

  return (
    <AppFrame>
      <RoleGate head>
        <PageHeader Title="แผนรออนุมัติ" crumbs={[{ Text: "Safety Inspection" }, { Text: "แผนรออนุมัติ" }]} />
        <section className="flex flex-col gap-6">
          <Tabs>
            <TabItem Text="รออนุมัติแผน" Badge={lists.plan.length} Active={tab === "plan"} onClick={() => switchTab("plan")} />
            <TabItem Text="รออนุมัติแผนเดินทาง" Badge={lists.trip.length} Active={tab === "trip"} onClick={() => switchTab("trip")} />
            <TabItem Text="ดำเนินการแล้ว" Active={tab === "done"} onClick={() => switchTab("done")} />
          </Tabs>
          {!lists[tab].length ? <EmptyStateDataEmpty Text={emptyText} /> : <>
            <TableHeader Placeholder={tab === "plan" ? "ค้นหาเลขที่ MR, ชื่อแผน" : "ค้นหาชื่อ, เลขที่ MR"} query={query} onQuery={(v) => { setQuery(v); setPage(1); }} FilterButton={false}
              Actions={tab !== "done" ? <PrimaryButton Text={T.approve + (sel.length ? " (" + sel.length + ")" : "")} LeadingIconSwap="done_all-24-300-round"
                Size={mob ? "lg" : "md"} State={sel.length ? "Default" : "Disabled"} onClick={() => { if (sel.length) { setOne(null); setAsk(true); } }} /> : undefined} />
            {!list.length ? <EmptyStateSearchNotFound />
              : tab === "done"
                ? (mob ? <div className="flex flex-col gap-5"><MobileCards columns={DONE_COLS} rows={doneRows} rowKey={rowKey} />{pagination}</div>
                  : <Table columns={DONE_COLS} rows={doneRows} rowKey={rowKey} Pagination={pagination} />)
                : <CheckTable columns={COLS} rows={pendingRows} ticked={sel} onTicked={setTicked} scope={list.map((x) => ({ key: x.key }))} Pagination={pagination} />}
          </>}
        </section>
        <ConfirmDialog spec={ask ? { title: T.approve + " " + (one ? list.find((x) => x.key === one)?.title ?? one : targets.length + " " + T.unit), sub: T.sub, cancel: "ยกเลิก", ok: T.approve } : null}
          onCancel={() => { setAsk(false); setOne(null); }} onOk={confirm} />
      </RoleGate>
    </AppFrame>
  );
}
