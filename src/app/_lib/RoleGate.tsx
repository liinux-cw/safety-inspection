"use client";
/* จำกัดหน้าตามบทบาท — kbk = เฉพาะ กบค. · vendor = เฉพาะผู้รับจ้าง · บทบาทไม่ตรง = บอกว่าไม่มีสิทธิ์ */
import type { ReactNode } from "react";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { KBK, headOf, useHydrated, useRole, vendorOf } from "@/lib/mock/store";

export function RoleGate({ kbk, head, vendor, children }: { kbk?: boolean; head?: boolean; vendor?: boolean; children: ReactNode }) {
  const role = useRole();
  const hydrated = useHydrated();
  if (!hydrated) return null;
  const ok = (kbk && role === KBK) || (head && !!headOf(role)) || (vendor && !!vendorOf(role));
  if (!ok) return <EmptyStateDataEmpty Text="ไม่มีสิทธิ์เข้าถึงหน้านี้" SupportingText="สลับบทบาทที่แถบต้นแบบด้านบน" />;
  return <>{children}</>;
}
