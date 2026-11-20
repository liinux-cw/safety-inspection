"use client";
/* ผู้รับจ้าง · แผนเดินทาง — /docs/trip/?id=
   บันทึกและส่งอนุมัติผลตรวจรายคันใน popup ของแต่ละคัน (ไม่มี stepper แบบงานบำรุงรักษา · เจ้าของงาน 20 พ.ย. 2569) · ส่งแล้ว = ล็อก รอ กบค. อนุมัติ
   กบค. ส่งกลับแก้ไข = แก้แล้วส่งใหม่ได้ · อนุมัติแล้ว = ล็อกถาวร · ทุกคันเสร็จสิ้น → "ส่งอนุมัติปิดงาน" → กบค. อนุมัติปิดงานแผนเดินทาง หรือส่งกลับ */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CloseSummary } from "@/app/_lib/CloseSummary";
import { DocsTable } from "@/app/_lib/DocsTable";
import { RoleGate } from "@/app/_lib/RoleGate";
import { TripInfo, TripStatusAlert } from "@/app/_lib/TripInfo";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { AppFrame } from "@/components/shell/AppFrame";
import { Alert } from "@/components/vms/Alert";
import { EmptyStateDataEmpty } from "@/components/vms/EmptyStateDataEmpty";
import { PageHeader } from "@/components/vms/PageHeader";
import { PrimaryButton } from "@/components/vms/PrimaryButton";
import { SecondaryButton } from "@/components/vms/SecondaryButton";
import { SectionHeader } from "@/components/vms/SectionHeader";
import { cx } from "@/lib/cx";
import { TODAY, VEHICLE_BY_ID } from "@/lib/mock/data";
import { addFiles, allApproved, approvedCount, carDocs, missing, removeFile, requestCloseTrip, returnedCount, tripById, tripOpen, updateResult, vendorCanEdit, vendorSeesTrip } from "@/lib/mock/plan";
import { useProtoForm } from "@/lib/protoForm";
import { notify, useHydrated, useMock, useQuery, useRole, vendorOf } from "@/lib/mock/store";
import { useBreakpoint } from "@/lib/useBreakpoint";

export default function VendorTrip() {
  const router = useRouter();
  const mob = useBreakpoint() === "Mobile";
  const mock = useMock();
  const vendor = vendorOf(useRole());
  const found = tripById(mock, useQuery("id"));
  const trip = found && found.vendor === vendor && vendorSeesTrip(found) ? found : undefined;
  const hydrated = useHydrated();
  const [ask, setAsk] = useState(false);
  const done = !!trip && allApproved(mock, trip);
  const open = !!trip && tripOpen(trip);
  /* ต้นแบบ: กรอกข้อมูลตัวอย่าง = กรอกผลผ่าน + ไฟล์ตัวอย่างให้ทุกคันที่ยังแก้ได้และยังไม่ครบ · ล้างค่า = ล้างผลและไฟล์ของคันที่ยังแก้ได้ */
  const editableCars = trip && open ? trip.cars.filter((c) => vendorCanEdit(carDocs(mock, trip.mr, c))) : [];
  useProtoForm(trip && open ? {
    dirty: editableCars.some((c) => { const d = carDocs(mock, trip.mr, c); return !!(d.files.length || d.result || d.date || d.cost); }),
    fill: () => editableCars.forEach((c) => {
      const d = carDocs(mock, trip.mr, c);
      if (!missing(d, trip, c).length) return;
      updateResult(trip.mr, c, { date: d.date ?? TODAY, result: d.result ?? "ผ่าน", reason: d.result === "ตรวจไม่ได้" ? d.reason || "ยานพาหนะอยู่ระหว่างซ่อม ไม่สามารถทดสอบได้" : d.reason });
      if (!d.files.length) addFiles(trip.mr, c, [{ name: "ปจ2-" + VEHICLE_BY_ID[c].plate.split(" ")[0] + ".pdf", size: "1.2 MB" }]);
    }),
    clear: () => editableCars.forEach((c) => {
      updateResult(trip.mr, c, { date: undefined, cost: undefined, costReason: undefined, result: undefined, reason: undefined });
      for (let i = carDocs(mock, trip.mr, c).files.length - 1; i >= 0; i--) removeFile(trip.mr, c, i);
    }),
  } : null);
  return (
    <AppFrame>
      <RoleGate vendor>
        {!hydrated ? null : !trip ? <EmptyStateDataEmpty Text="ไม่พบแผนเดินทางนี้" SupportingText="แผนเดินทางนี้ไม่ได้ระบุคุณเป็นผู้รับจ้าง หรือถูกลบไปแล้ว" /> : <>
          <PageHeader Title={trip.name} SupportingText={"แผนเดินทาง · " + trip.mr} onBack={() => router.push("/docs/")}
            crumbs={[{ Text: "Safety Inspection" }, { Text: "เอกสาร ปจ.2", href: "/docs/" }, { Text: trip.name }]} />
          <div className="flex flex-col gap-8">
            <TripStatusAlert trip={trip} vendor />
            {open && returnedCount(mock, trip) > 0 && <Alert Color="Error" Text={"กบค. ส่งกลับแก้ไข " + returnedCount(mock, trip) + " คัน"} SupportingText="เปิดคันที่ถูกส่งกลับเพื่อดูเหตุผล แก้ไขผลหรือเอกสาร แล้วกดส่งอนุมัติอีกครั้ง" />}
            <TripInfo trip={trip} />
            {(trip.status === "closing" || trip.status === "closed") && <CloseSummary trip={trip} />}
            <section className="flex flex-col gap-4">
              <SectionHeader Title="ผลการตรวจ ปจ.2 รายคัน" Badge={"อนุมัติแล้ว " + approvedCount(mock, trip) + "/" + trip.cars.length + " คัน"} />
              <DocsTable trip={trip} canEdit={trip.status !== "closed"} />
            </section>
            {open && (
              <div className={cx("flex", mob ? "gap-4 [&>*]:flex-1 [&>*]:basis-0" : "justify-between gap-3")}>
                <SecondaryButton Text="ย้อนกลับ" Size="lg" onClick={() => router.push("/docs/")} />
                <PrimaryButton Text="ส่งอนุมัติปิดงาน" Size="lg" State={done ? "Default" : "Disabled"} onClick={() => done && setAsk(true)} />
              </div>
            )}
          </div>
          <ConfirmDialog spec={ask ? { title: "ยืนยันส่งอนุมัติปิดงาน", sub: "ผลการตรวจ ปจ.2 อนุมัติครบ " + trip.cars.length + " คัน ส่งให้ กบค. อนุมัติปิดงานแผนเดินทาง " + trip.name, cancel: "ยกเลิก", ok: "ส่งอนุมัติปิดงาน" } : null}
            onCancel={() => setAsk(false)} onOk={() => { setAsk(false); requestCloseTrip(trip.id); notify("ส่งอนุมัติปิดงานแผนเดินทาง " + trip.name + " สำเร็จ"); }} />
        </>}
      </RoleGate>
    </AppFrame>
  );
}
