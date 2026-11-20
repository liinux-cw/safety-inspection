# ส่วนที่ต้องประกอบเอง

กติกาใน `CLAUDE.md` หัวข้อ Design rules: ของที่ไลบรารีไม่มีให้ประกอบจากชิ้นของไลบรารีเท่านั้น แล้วจดไว้ที่นี่ว่าประกอบจากอะไร และอิงหน้าไหนของระบบ dev

## ก. ชุดที่คัดลอกมาจากต้นแบบบำรุงรักษา

ใช้ตามที่ต้นแบบบำรุงรักษาจดไว้ (`figma-spec/COMPOSED.md` ของรีโป maintenance-utility-vehicle)

| ส่วน | ประกอบจาก | เหตุผล |
|---|---|---|
| `BottomSheet` | Background overlay + แผ่นพื้น white มุมบน 24 + Bottom sheet header + เนื้อหา + Bottom sheet footer | component Bottom sheet ของไลบรารีล็อกเนื้อหาตายตัว · ทำแบบเดียวกับ `sheet()` / `menuAt()` ใน `figma-export/plugin-lib/core.js` (และแผงตัวกรองของ UI Release#2) |
| แถบต้นแบบ (`shell/PrototypeBar`) | Input dropdown + Dropdown list (บทบาท) · Tertiary button (ล้างข้อมูลจำลอง) | ไม่ใช่จอของระบบ มีเฉพาะต้นแบบ (CLAUDE.md ข้อ 5, 7) · พื้น gray-50 เส้นล่าง gray-200 |
| `MobileCards` (ใน `MobileTable.tsx`) | Mobile table + Mobile table item | แปลงตารางเป็นการ์ดตาม `mobileCards()` ใน core.js |
| `patterns/ConfirmDialog` | Modal (Centered image / Destructive centered image with input) + Modal header Center + Modal footer · มือถือ Bottom sheet + Modal header + Bottom sheet footer | popup ยืนยันตาม `confirm()` ใน core.js ใช้ซ้ำทุก scenario |
| `patterns/RowMenu` | Dropdown menu ลอยใต้ปุ่ม "…" · มือถือ Bottom sheet + Dropdown menu | เมนูท้ายแถวตาม `menuAt()` / `planMenu()` ใน core.js |
| `patterns/FormModal` | Modal Type=Form + Modal header Left (ไม่มี Featured icon) + Card form row (Text input / Text area) + Modal footer Horizontal right · มือถือ Bottom sheet + Bottom sheet footer | formModal() ใน core.js ใช้ซ้ำหลาย scenario (S2 S7 ส่งกลับ · S6 แก้ไขเบอร์/สถานที่ · S21 รายการเพิ่มเติม) |
| `patterns/PopupModal` | Background overlay + กล่อง white รัศมี 12 กว้าง 640/800/1140 (1140 = Modal Size=xl · popup เลือกยานพาหนะ BACKLOG ข้อ 89) + Modal header Left + เนื้อหาอิสระ + Modal footer Horizontal right · มือถือ Bottom sheet | popupModal() ใน screens.js — Modal ของไลบรารีมีแค่ md/lg/xl และเนื้อหาตายตัว ใช้กับตาราง/อัปโหลดใน popup (S6 เพิ่มรถ · S10 ฯลฯ) |
| `patterns/NotificationPanel` | Notification card + _Notification item base + Status ลอยใต้ Header navigation (ขวา 24 · ใต้หัว 8) · มือถือ Bottom sheet "แจ้งเตือน (n)" + การ์ดไม่มีหัว/ท้าย + ปุ่ม "ลบข้อความแจ้งเตือนทั้งหมด" | notiPanel() ใน screens.js (S8) — Notification card ไม่มี variant มือถือ · desktop ไม่มีพื้นทึบ (คลิกนอกแผง = ปิด) |
| `patterns/DisplayBox` | Section label + กล่อง gray-50 รัศมี 8 ขอบใน 24 ช่องไฟ 24 + Content item row (Text with label) แถวละ 4 / มือถือ 2 | kv() + displayBox() ใน core.js (กล่องแสดงข้อมูลหน้า Detail) · desktop ใช้ VehicleAndReporterInfo ของไฟล์ Maintain-D ได้ (ช่องไฟ 16) |
| `patterns/PhotoGallery` | Section label + Images Size=sm × สูงสุด 4 (มือถือ 2) ช่องไฟ 16 | photoGallery() fallback ใน screens.js · desktop ใช้ IncidentPhotoGallery ของไฟล์ Maintain-D |
| `FilterShell` (กรอบแผง · 5 พ.ย. 2569) | กรอบของ `FilterPanel` ทั้ง desktop (Background overlay + Side panel header/footer) และมือถือ (Bottom sheet + footer) แยกเป็น `FilterShell` ใน `src/app/vehicles/_lib/ui.tsx` รับเนื้อหาช่องเป็น children · ใช้ร่วม 2 ที่: S24 `FilterPanel` (Input dropdown ×4) และฟอร์มแผน S1/S19 `src/app/new/PlanForm.tsx` (ภาค · เขต · ประเภทรถ = Input dropdown with badges (Optional) ×3 หลายค่า) | ฟอร์มแผนย้าย 3 ช่องจากหัวส่วนเลือกรถเข้าแผนเข้าแผงตัวกรอง (เจ้าของงาน 5 พ.ย. 2569 · e0137d7) ⇒ ใช้กรอบเดียวกันไม่ประกอบซ้ำ · ช่องหลายค่าในแผงตัวกรองอิง "PEA Car Cost Filter" ของ UI Release#2 (ช่อง "ปี" เป็น Input dropdown with badges) |
| `patterns/CheckTable` (ตาราง "รายการตรวจสภาพ") | Section header (Title + Badge) + Table header cell + Table cell วางเป็นคอลัมน์ (ค่าเดียวกับ `_checklist` ของ ReceiptChecklist/InspectionChecklist) · คอลัมน์ รายการ (ยืด) · ปกติ 100 · แก้ไข 100 (Radio button) · หมายเหตุ 448 (Text input ไม่มีป้าย) · แถวท้าย Secondary button md "เพิ่มรายการ" · มือถือ การ์ดรายข้อ (กรอบ/พื้นของ Mobile table มุม 12) + Section label + Radio text card 2 ใบ + ปุ่ม lg เต็มกว้าง | InspectionChecklist ของไฟล์ Maintain-D มี 25 แถวตายตัว + ส่วนสาเหตุส่งซ่อม (เพิ่มแถวไม่ได้) จอ Figma จึงประกอบเองด้วย checkTable/checkCard · การ์ดมือถือไม่มีช่องหมายเหตุตามจอ |
| ลิงก์เลขทะเบียน (`patterns/PlateLink` · 6 พ.ย. 2569) | ค่าลิงก์ใน _Content item base ของ UI Release#2 หน้า Replacement Vehicle ("BRD005678") #444CE7 ขีดเส้นใต้ · Variable Color/text/info | `info-700` (#3538CD ใกล้สุด) + `underline` — ต้นทาง design-system tokens.css ยังไม่มี token #444CE7 (BACKLOG ค.) |

## ข. หน้าของ Safety Inspection (ตรวจกับไลบรารีแล้ว 20 พ.ย. 2569)

ทุกหน้าใช้ component ของไลบรารีและ pattern ในหัวข้อ ก ไม่มีสี hex ไม่มี `style=` ไม่มีข้อความลอยนอก component (ยกเว้นบรรทัดสรุปยานพาหนะบนมือถือของ popup ผลตรวจ ซึ่งทำแบบเดียวกับ popup การตรวจ ปจ.2 ของต้นแบบบำรุงรักษา)

| ส่วน | ประกอบจาก | หมายเหตุ |
|---|---|---|
| เมนู "แผนตรวจ ปจ.2" · "เอกสาร ปจ.2" ใน Sidebar navigation | Nav list item ต่อท้ายกลุ่ม "งานซ่อมและบำรุงรักษา" ของเมนูจริง (หน้า "Sidebar Navigation" 277:230639 ของ UI Release#2) · เมนูอื่นแสดงแต่ไม่พาไปไหน | แบบเดียวกับต้นแบบบำรุงรักษา (เดิมเป็นกลุ่ม "Safety Inspection" ที่ตั้งเอง) · กบค. เห็นแผนตรวจ ผู้รับจ้างเห็นเอกสาร · **รอเคาะตำแหน่งและชื่อเมนู** |
| Breadcrumb หน้าแรก | "งานซ่อมและบำรุงรักษา" | ตามกลุ่มเมนูและหน้าการตรวจ ปจ.2 ของต้นแบบบำรุงรักษา (เดิม "Safety Inspection" ภาษาอังกฤษ) |
| ฟอร์มแผนตรวจ (`src/app/_lib/PlanForm.tsx`) | Section header + Text input / Input dropdown 2 คอลัมน์ (มือถือ 1) + Table header + CheckTable + Table pagination + ปุ่มล่าง Secondary/Primary lg · popup ค่าจ้าง = FormModal · ออกจากหน้า = ConfirmDialog | โครงเดียวกับฟอร์มสร้างแผนของต้นแบบบำรุงรักษา |
| ข้อมูลแผน (`src/app/_lib/PlanInfo.tsx`) | DisplayBox 2 กล่อง + Pill outline | |
| popup เลือกยานพาหนะ (`src/app/_lib/VehiclePicker.tsx`) | PopupModal 1140 + Table header + CheckTable + Table pagination + FilterShell | แบบเดียวกับ popup เพิ่มยานพาหนะเข้าแผนเดินทางของต้นแบบบำรุงรักษา |
| ตารางและ popup ผลตรวจ (`src/app/_lib/DocsTable.tsx`) | Table / CheckTable / Mobile table + PopupModal 640 + Alert + DisplayBox + Text input + Date picker + Radio text card + File upload + Text area + Section label | "ยังขาด…" และ "ข้อมูลครบ" เป็น Alert (เดิมข้อความลอย) · ยังไม่มีเอกสาร = แถวใน DisplayBox |
| ปุ่มหัวหน้ารายละเอียดแผน | Secondary danger button + Secondary button ใน Page header (มือถือ lg ใต้หัวข้อ) | เดิมห่อด้วยกล่องของตัวเองทำให้ปุ่มบนมือถือไม่เต็มแถว |
| แถบต้นแบบ (`src/components/shell/PrototypeBar.tsx`) | Input dropdown + Dropdown list (บทบาท กบค./ผู้รับจ้าง) · Tertiary button "จำลองอนุมัติแผน" | ของต้นแบบเท่านั้น |
