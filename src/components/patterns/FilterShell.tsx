"use client";
/* แผงตัวกรองเลื่อนจากขวา (desktop) · Bottom sheet (มือถือ) — ยกจาก FilterShell ของต้นแบบบำรุงรักษาตามวาระ (app/vehicles/_lib/ui.tsx)
   ประกอบจากชิ้นไลบรารี: Background overlay · Featured icon · Tertiary button · Tertiary brand button · Secondary/Primary button · Bottom sheet */
import { useEffect, type ReactNode } from "react";
import { BackgroundOverlay } from "@/components/vms/BackgroundOverlay";
import { BottomSheet } from "@/components/vms/BottomSheet";
import { BottomSheetFooter } from "@/components/vms/BottomSheetFooter";
import { FeaturedIcon } from "@/components/vms/FeaturedIcon";
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { TertiaryBrandButton } from "@/components/vms/TertiaryBrandButton";
import { TertiaryButton } from "@/components/vms/TertiaryButton";
import { useBreakpoint } from "@/lib/useBreakpoint";

export function FilterShell({ open, onClose, onClear, onApply, children }: { open: boolean; onClose: () => void; onClear: () => void; onApply: () => void; children: ReactNode }) {
  const mob = useBreakpoint() === "Mobile";
  useEffect(() => {
    if (!open || mob) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, mob, onClose]);
  if (!open) return null;
  if (mob) {
    return (
      <BottomSheet open onClose={onClose} Title="ตัวกรอง" ActionText="ล้างตัวกรอง" onAction={onClear}
        Footer={<BottomSheetFooter SecondaryAction={<SecondaryButton Text="ยกเลิก" Size="lg" onClick={onClose} />} PrimaryAction={<PrimaryButton Text="ตกลง" Size="lg" onClick={onApply} />} />}>
        {children}
      </BottomSheet>
    );
  }
  return (
    <>
      <div className="relative z-[51]"><BackgroundOverlay onClick={onClose} /></div>
      <div role="dialog" aria-modal="true" aria-labelledby="si-filter-title" className="fixed inset-y-0 right-0 z-[52] flex w-[480px] max-w-full flex-col gap-6 bg-white">
        <div className="relative flex flex-col gap-4 border-b border-gray-300 p-6">
          <div className="flex items-center gap-4 pr-10">
            <FeaturedIcon Color="Gray" IconSwap="filter_list-24-400-round" />
            <div className="flex min-w-0 flex-col">
              <h2 id="si-filter-title" className="text-lg font-semibold text-black">ตัวกรอง</h2>
              <p className="text-sm text-gray-600">กรองข้อมูลให้แสดงเฉพาะข้อมูลที่ต้องการ</p>
            </div>
          </div>
          <div className="absolute top-4 right-4"><TertiaryButton LeadingIconSwap="close-24-300-round" ButtonText={false} aria-label="ปิด" onClick={onClose} /></div>
        </div>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6">{children}</div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-300 px-6 py-4">
          <TertiaryBrandButton Text="ล้างตัวกรอง" onClick={onClear} />
          <div className="flex gap-3">
            <SecondaryButton Text="ยกเลิก" onClick={onClose} />
            <PrimaryButton Text="ตกลง" onClick={onApply} />
          </div>
        </div>
      </div>
    </>
  );
}
