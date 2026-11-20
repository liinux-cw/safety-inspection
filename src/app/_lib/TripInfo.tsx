"use client";
/* กล่องข้อมูลแผนเดินทาง + ผู้รับจ้าง (DisplayBox 2 กล่อง) — หน้าแผนเดินทางของ กบค. และของผู้รับจ้าง
   + แถบสถานะของแผนเดินทาง (Alert) */
import { DisplayBox } from "@/components/patterns/DisplayBox";
import { Alert } from "@/components/vms/Alert";
import { PillOutline } from "@/components/vms/PillOutline";
import { HEAD_BY_ID, TRIP_STATUS_TEXT, VENDOR_BY_ID, bahtText, dateText, dayRange, type Trip } from "@/lib/mock/data";
import { budget, costTotal } from "@/lib/mock/plan";
import { useMock } from "@/lib/mock/store";

export function TripInfo({ trip, planName }: { trip: Trip; planName?: string }) {
  const mock = useMock();
  const ven = VENDOR_BY_ID[trip.vendor];
  return (
    <div className="flex flex-col gap-6">
      <DisplayBox Title="ข้อมูลแผนเดินทาง" pairs={[
        ["ชื่อแผนเดินทาง", trip.name],
        ["แผนตรวจ ปจ.2", trip.mr + (planName ? " · " + planName : "")],
        ["ช่วงวันทำงาน", dayRange(trip.d1, trip.d2)],
        ["จำนวนยานพาหนะ", trip.cars.length + " คัน"],
        ["สถานะ", <PillOutline key="s" Text={TRIP_STATUS_TEXT[trip.status][0]} Color={TRIP_STATUS_TEXT[trip.status][1]} />],
        ["อนุมัติโดย", trip.approvedBy ? (HEAD_BY_ID[trip.approvedBy]?.name ?? trip.approvedBy) + (trip.approvedAt ? " · " + dateText(trip.approvedAt) : "") : "-"],
      ]} />
      <DisplayBox Title="ข้อมูลผู้รับจ้าง" pairs={[
        ["ผู้รับจ้าง", ven ? ven.name : "-"],
        ["เบอร์โทรผู้รับจ้าง", trip.vendorTel || "-"],
        ["เลขที่สัญญา/ใบสั่งจ้าง", trip.contract || "-"],
        ["งบรวมตามสัญญา", bahtText(budget(trip))],
        ["ค่าจ้างตรวจรวม (ที่ส่งแล้ว)", bahtText(costTotal(mock, trip))],
      ]} />
    </div>
  );
}

/** vendor = มุมมองผู้รับจ้าง (ข้อความบอกว่าต้องทำอะไรต่อ) */
export function TripStatusAlert({ trip, vendor }: { trip: Trip; vendor?: boolean }) {
  if (trip.status === "review") return <Alert Color="Warning" Text="รอหัวหน้า กบค. อนุมัติแผนเดินทาง" SupportingText={"ส่งเมื่อ " + (trip.submittedAt ? dateText(trip.submittedAt) : "-") + " · ผู้รับจ้างจะเห็นแผนเดินทางหลังอนุมัติ"} />;
  if (trip.status === "returned") return <Alert Color="Error" Text="หัวหน้า กบค. ส่งกลับให้แก้ไข" SupportingText={(trip.returnReason ?? "") + " · กดแก้ไขแล้วส่งอนุมัติอีกครั้ง"} />;
  if (trip.status === "closing") return <Alert Color="Warning" Text={"ผู้รับจ้างขอปิดงานเมื่อ " + (trip.closeRequestedAt ? dateText(trip.closeRequestedAt) : "-")}
    SupportingText={vendor ? "รอ กบค. อนุมัติปิดงาน" : "ตรวจสอบสรุปผล แล้วอนุมัติปิดงาน หรือส่งกลับให้ผู้รับจ้างแก้ไข"} />;
  if (trip.status === "closed") return <Alert Color="Success" Text={"ปิดงานแล้วเมื่อ " + (trip.closedAt ? dateText(trip.closedAt) : "-")} SupportingText={vendor ? "ดูและดาวน์โหลดเอกสารที่ส่งไปแล้วได้อย่างเดียว" : undefined} />;
  if (trip.closeReturnReason) return <Alert Color={vendor ? "Error" : "Gray"} Text={vendor ? "กบค. ส่งกลับคำขอปิดงาน" : "ส่งกลับคำขอปิดงานให้ผู้รับจ้างแล้ว"} SupportingText={trip.closeReturnReason} />;
  return null;
}
