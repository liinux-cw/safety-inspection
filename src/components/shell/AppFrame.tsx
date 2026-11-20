"use client";
/* กรอบหน้า (ยกจากต้นแบบบำรุงรักษาตามวาระ) — Desktop: Sidebar navigation ซ้าย ย่อ 80 / ชี้เมาส์ขยาย 280 ลอยทับ · Mobile (< 768): ปุ่ม menu เปิด Sidebar จากซ้าย
   เมนูตามบทบาท: กบค. = แผนตรวจ ปจ.2 · ผู้รับจ้าง = เอกสาร ปจ.2 · บนสุดมีแถบต้นแบบ (PrototypeBar) · toast ผ่าน ToastHost */
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BackgroundOverlay } from "@/components/vms/BackgroundOverlay";
import { HeaderNavigation } from "@/components/vms/HeaderNavigation";
import { APPROVE_LABEL, DOCS_LABEL, MT_LABEL, REG_LABEL, SIDEBAR_MENU, SidebarNavigation } from "@/components/vms/SidebarNavigation";
import { headOf, useMock, useRole, vendorOf } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { useOutside } from "@/lib/useOutside";
import { PrototypeBar } from "./PrototypeBar";
import { ToastHost } from "./ToastHost";

export function AppFrame({ children }: { children: ReactNode }) {
  const mob = useBreakpoint() === "Mobile";
  const [pinned, setPinnedState] = useState(false);
  const [hover, setHover] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const side = useRef<HTMLDivElement>(null);
  const setPinned = (v: boolean) => { setPinnedState(v); if (!v) setHover(false); };
  const [unpin] = useState(() => () => { setPinnedState(false); setHover(false); });
  useOutside(side, pinned, unpin);

  useEffect(() => {
    if (!drawer && !pinned) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { setDrawer(false); unpin(); } };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [drawer, pinned, unpin]);
  useEffect(() => { if (!mob) setDrawer(false); }, [mob]);

  const path = (usePathname() || "/").replace(/\/$/, "");
  const active = path.startsWith("/docs") ? DOCS_LABEL : path.startsWith("/approvals") ? APPROVE_LABEL : path.startsWith("/registry") ? REG_LABEL : MT_LABEL;
  const role = useRole();
  const mock = useMock();
  /* เมนูตามบทบาท: กบค. = แผนตรวจ ปจ.2 · หัวหน้า กบค. = แผนรออนุมัติ (Badge = จำนวนที่รอ) · ผู้รับจ้าง = เอกสาร ปจ.2 */
  const head = headOf(role);
  const own = vendorOf(role) ? DOCS_LABEL : head ? APPROVE_LABEL : MT_LABEL;
  const nWait = head ? mock.plans.filter((p) => p.status === "review").length + mock.trips.filter((t) => t.status === "review").length : 0;
  const menu = SIDEBAR_MENU.map((g) => (g.items ? { ...g, items: g.items.filter((s) => ![MT_LABEL, APPROVE_LABEL, DOCS_LABEL, REG_LABEL].includes(s.Text) || s.Text === own || (s.Text === REG_LABEL && own === MT_LABEL))
    .map((s) => (s.Text === APPROVE_LABEL && nWait ? { ...s, badge: String(nWait) } : s)) } : g));

  const expanded = pinned || hover;
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PrototypeBar />
      <div className="flex flex-1">
        {!mob && (
          <div ref={side} className="relative z-30 w-20 shrink-0" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <SidebarNavigation State={expanded ? "Expanded" : "Collapsed"} menu={menu} active={active} onToggle={() => setPinned(!pinned)} toggleLabel={pinned ? "ย่อเมนู" : "ค้างเมนูไว้"}
              className="sticky top-0 h-screen overflow-y-auto" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <HeaderNavigation Breakpoint={mob ? "Mobile" : "Desktop"} onMenu={mob ? () => setDrawer(true) : undefined} />
          <main className={mob ? "flex flex-col gap-6 p-4" : "flex flex-col gap-8 p-8"}>{children}</main>
        </div>
      </div>
      {mob && drawer && (
        <>
          <BackgroundOverlay onClick={() => setDrawer(false)} />
          <div role="dialog" aria-modal="true" aria-label="เมนูหลัก" className="fixed inset-y-0 left-0 z-50 flex max-w-full">
            <SidebarNavigation State="Expanded" menu={menu} active={active} onToggle={() => setDrawer(false)} toggleLabel="ปิดเมนู" className="h-dvh overflow-y-auto" />
          </div>
        </>
      )}
      <ToastHost />
    </div>
  );
}
