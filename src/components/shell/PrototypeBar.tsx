"use client";
/* แถบต้นแบบบนสุด (ไม่ใช่หน้าจอของระบบ — มีเฉพาะต้นแบบ)
   สลับบทบาท (กบค. · ผู้รับจ้าง) · จำลองอนุมัติแผน (ขั้นอนุมัติเป็นงานอีกส่วน) · กรอกข้อมูลตัวอย่าง / ล้างค่า (หน้าที่มีฟอร์ม) · ล้างข้อมูลจำลอง */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/patterns/ConfirmDialog";
import { DropdownList } from "@/components/vms/DropdownList";
import { DropdownListItem } from "@/components/vms/DropdownListItem";
import { InputDropdown } from "@/components/vms/InputDropdown";
import { Ms } from "@/components/vms/Ms";
import { TertiaryButton } from "@/components/vms/TertiaryButton";
import { approveAll } from "@/lib/mock/plan";
import { notify, resetMock, ROLES, setRole, useMock, useRole, vendorOf } from "@/lib/mock/store";
import { useProtoFormTools } from "@/lib/protoForm";

export function PrototypeBar() {
  const router = useRouter();
  const role = useRole();
  const mock = useMock();
  const [open, setOpen] = useState(false);
  const form = useProtoFormTools();
  const [ask, setAsk] = useState(false);
  const nReview = mock.plans.filter((p) => p.status === "review").length;
  const clear = () => { form?.ref.current?.clear(); setAsk(false); notify("ล้างค่าในฟอร์มนี้แล้ว"); };
  const pick = (r: string) => { setRole(r); setOpen(false); router.push(vendorOf(r) ? "/docs/" : "/"); };
  return (
    <div data-proto-bar className="relative z-[55] flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-200 bg-gray-50 px-4 py-1">
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-900"><Ms name="science-20-300-round" size={16} />ต้นแบบแผนตรวจ ปจ.2</span>
      <span className="text-xs text-gray-600">บทบาท</span>
      <InputDropdown Label={false} LabelText="บทบาท" Text={role} open={open} onOpenChange={setOpen} className="w-72">
        <DropdownList>
          {ROLES.map((r) => <DropdownListItem key={r} Text={r} State={r === role ? "Selected" : "Default"} onClick={() => pick(r)} />)}
        </DropdownList>
      </InputDropdown>
      {nReview > 0 && (
        <TertiaryButton Text={"จำลองอนุมัติแผน (" + nReview + ")"} LeadingIconSwap="check_circle-24-300-round" onClick={() => { approveAll(); notify("จำลองอนุมัติแผนแล้ว ผู้รับจ้างเห็นแผนในเมนูเอกสาร ปจ.2"); }} />
      )}
      {form && (
        <span data-proto-form className="flex items-center gap-1 border-l border-gray-200 pl-3">
          <TertiaryButton Text="กรอกข้อมูลตัวอย่าง" LeadingIconSwap="edit_note-24-300-round" onClick={() => { form.ref.current?.fill(); notify("กรอกข้อมูลตัวอย่างแล้ว"); }} />
          <TertiaryButton Text="ล้างค่า" LeadingIconSwap="ink_eraser-24-300-round" onClick={() => (form.ref.current?.dirty ? setAsk(true) : clear())} />
        </span>
      )}
      <TertiaryButton className="ml-auto" Text="ล้างข้อมูลจำลอง" LeadingIconSwap="restart_alt-24-300-round" onClick={() => { resetMock(); notify("ล้างข้อมูลจำลองแล้ว"); }} />
      <ConfirmDialog spec={ask ? { danger: true, title: "ล้างค่าในฟอร์มนี้", sub: "ค่าที่กรอกไว้ในฟอร์มของหน้านี้จะกลับเป็นค่าเริ่มต้น", cancel: "ยกเลิก", ok: "ล้างค่า" } : null}
        onCancel={() => setAsk(false)} onOk={clear} />
    </div>
  );
}
