/* ข้อมูลจำลองของต้นแบบแผนตรวจ ปจ.2 — ยานพาหนะประเภท 09 (กระเช้า/เครน) · ผู้รับจ้าง · แผนตัวอย่าง
   ชุดตัวอย่างอิงจาก UI ตัวอย่างของเจ้าของงาน (63-4569 ยะลา · MRZ7000010 …) */

export const TODAY = "2026-11-19";

/* ---------- เดือน (YYYY-MM) ↔ ข้อความไทย ---------- */
export const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
export const monthText = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return TH_MONTHS[m - 1] + " " + (y + 543);
};
export const rangeText = (from: string, to: string) => (from === to ? monthText(from) : monthText(from) + " – " + monthText(to));
/** เดือนที่เลือกได้: เดือนนี้ไปอีก 24 เดือน */
export const MONTH_OPTIONS: string[] = (() => {
  const out: string[] = [];
  const [y0, m0] = TODAY.split("-").map(Number);
  for (let i = 0; i < 24; i++) {
    const t = (m0 - 1) + i;
    out.push(String(y0 + Math.floor(t / 12)) + "-" + String((t % 12) + 1).padStart(2, "0"));
  }
  return out;
})();
/** ปีงบประมาณ (พ.ศ.) ของเดือน — ต.ค. ขึ้นปีงบใหม่ */
export const fiscalYearOf = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return String(y + 543 + (m >= 10 ? 1 : 0));
};
export const dateText = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return String(d).padStart(2, "0") + "/" + String(m).padStart(2, "0") + "/" + (y + 543);
};
export const daysFromToday = (iso: string) => Math.round((Date.parse(iso) - Date.parse(TODAY)) / 86400000);
export const dueSub = (iso: string) => {
  const d = daysFromToday(iso);
  return d < 0 ? "เกินกำหนด " + -d + " วัน" : d === 0 ? "ครบกำหนดวันนี้" : "อีก " + d + " วัน";
};

/* ---------- ยานพาหนะ ---------- */
export type VehicleStatus = "พร้อมใช้งาน" | "อยู่ระหว่างซ่อม" | "ระงับใช้งาน";
export interface Vehicle {
  id: string;
  plate: string;
  code: string;
  type: string;
  org: string;
  owner: string;
  tel: string;
  status: VehicleStatus;
  /** วาระการตรวจ (เดือน) */
  cycle: 6 | 12;
  /** ครบกำหนดตรวจ (ISO) */
  due: string;
}

export const VEHICLE_TYPES = ["กระเช้าฮอทไลน์", "กระเช้าแก้ไฟ", "เครน 3 ตัน", "เครน 6 ตัน"];
export const ORGS = ["กฟต.3 ยะลา", "กฟน.1 เชียงใหม่", "กฟก.1 สระบุรี", "กปส.", "กฟฉ.1 อุดรธานี", "กฟฉ.2 ขอนแก่น", "กฟก.3 ชลบุรี", "กฟต.1 เพชรบุรี"];

const V = (id: string, plate: string, code: string, type: string, org: string, owner: string, tel: string, status: VehicleStatus, cycle: 6 | 12, due: string): Vehicle =>
  ({ id, plate, code, type, org, owner, tel, status, cycle, due });

export const VEHICLES: Vehicle[] = [
  V("v01", "63-4569 ยะลา", "ต.3-09-4569", "กระเช้าฮอทไลน์", "กฟต.3 ยะลา", "นายสมชาย ใจดี", "081-234-5601", "พร้อมใช้งาน", 12, "2026-11-05"),
  V("v02", "70-1053 เชียงใหม่", "น.1-09-1053", "กระเช้าแก้ไฟ", "กฟน.1 เชียงใหม่", "นายวิชัย แก้วมา", "081-234-5602", "พร้อมใช้งาน", 12, "2026-12-15"),
  V("v03", "72-6079 สระบุรี", "ก.1-09-6079", "กระเช้าแก้ไฟ", "กฟก.1 สระบุรี", "นายประเสริฐ สุขใจ", "081-234-5603", "อยู่ระหว่างซ่อม", 6, "2026-12-20"),
  V("v04", "74-1974 กรุงเทพมหานคร", "กปส.-09-1974", "เครน 6 ตัน", "กปส.", "นายธนา รุ่งเรือง", "081-234-5604", "พร้อมใช้งาน", 6, "2027-01-10"),
  V("v05", "82-6789 ขอนแก่น", "ฉ.2-09-6789", "กระเช้าแก้ไฟ", "กฟฉ.2 ขอนแก่น", "นายอนุชา ศรีสุข", "081-234-5605", "พร้อมใช้งาน", 12, "2027-01-25"),
  V("v06", "81-2210 อุดรธานี", "ฉ.1-09-2210", "กระเช้าฮอทไลน์", "กฟฉ.1 อุดรธานี", "นายสุรชัย บุญมา", "081-234-5606", "พร้อมใช้งาน", 12, "2027-02-03"),
  V("v07", "75-3381 ชลบุรี", "ก.3-09-3381", "เครน 3 ตัน", "กฟก.3 ชลบุรี", "นายพงษ์ศักดิ์ มีชัย", "081-234-5607", "ระงับใช้งาน", 6, "2026-10-28"),
  V("v08", "76-9012 เพชรบุรี", "ต.1-09-9012", "กระเช้าแก้ไฟ", "กฟต.1 เพชรบุรี", "นายกิตติ ทองดี", "081-234-5608", "พร้อมใช้งาน", 12, "2027-02-18"),
  V("v09", "63-7710 ยะลา", "ต.3-09-7710", "เครน 6 ตัน", "กฟต.3 ยะลา", "นายอับดุล สาและ", "081-234-5609", "พร้อมใช้งาน", 6, "2027-03-01"),
  V("v10", "70-4432 เชียงใหม่", "น.1-09-4432", "กระเช้าฮอทไลน์", "กฟน.1 เชียงใหม่", "นายศรัณย์ ปัญญา", "081-234-5610", "พร้อมใช้งาน", 12, "2027-03-12"),
  V("v11", "72-1188 สระบุรี", "ก.1-09-1188", "เครน 3 ตัน", "กฟก.1 สระบุรี", "นายเอกชัย พึ่งบุญ", "081-234-5611", "พร้อมใช้งาน", 12, "2027-03-20"),
  V("v12", "74-5521 กรุงเทพมหานคร", "กปส.-09-5521", "กระเช้าแก้ไฟ", "กปส.", "นายวรวุฒิ แสงทอง", "081-234-5612", "อยู่ระหว่างซ่อม", 12, "2027-04-02"),
  V("v13", "82-3345 ขอนแก่น", "ฉ.2-09-3345", "เครน 6 ตัน", "กฟฉ.2 ขอนแก่น", "นายจักรพันธ์ ภูผา", "081-234-5613", "พร้อมใช้งาน", 6, "2027-04-15"),
  V("v14", "81-6678 อุดรธานี", "ฉ.1-09-6678", "กระเช้าแก้ไฟ", "กฟฉ.1 อุดรธานี", "นายณัฐพล ชัยวงศ์", "081-234-5614", "พร้อมใช้งาน", 12, "2027-05-05"),
  V("v15", "75-8890 ชลบุรี", "ก.3-09-8890", "กระเช้าฮอทไลน์", "กฟก.3 ชลบุรี", "นายปิยะ รักษ์ดี", "081-234-5615", "พร้อมใช้งาน", 12, "2027-05-22"),
  V("v16", "76-2234 เพชรบุรี", "ต.1-09-2234", "เครน 3 ตัน", "กฟต.1 เพชรบุรี", "นายมนตรี สายสุข", "081-234-5616", "พร้อมใช้งาน", 6, "2027-06-08"),
  /* อยู่ในแผนตัวอย่าง */
  V("v17", "70-8801 เชียงใหม่", "น.1-09-8801", "กระเช้าแก้ไฟ", "กฟน.1 เชียงใหม่", "นายเกียรติ อินทร์แก้ว", "081-234-5617", "พร้อมใช้งาน", 12, "2026-12-05"),
  V("v18", "72-3302 สระบุรี", "ก.1-09-3302", "กระเช้าฮอทไลน์", "กฟก.1 สระบุรี", "นายชาตรี มั่นคง", "081-234-5618", "พร้อมใช้งาน", 12, "2026-12-12"),
  V("v19", "74-7745 กรุงเทพมหานคร", "กปส.-09-7745", "เครน 6 ตัน", "กปส.", "นายสมพงษ์ เรืองศรี", "081-234-5619", "พร้อมใช้งาน", 6, "2027-01-03"),
  V("v20", "82-9956 ขอนแก่น", "ฉ.2-09-9956", "กระเช้าแก้ไฟ", "กฟฉ.2 ขอนแก่น", "นายทวีศักดิ์ คำดี", "081-234-5620", "พร้อมใช้งาน", 12, "2027-01-18"),
  V("v21", "81-4401 อุดรธานี", "ฉ.1-09-4401", "เครน 3 ตัน", "กฟฉ.1 อุดรธานี", "นายบุญเลิศ ศรีวงศ์", "081-234-5621", "พร้อมใช้งาน", 6, "2027-02-10"),
  V("v22", "75-1123 ชลบุรี", "ก.3-09-1123", "กระเช้าแก้ไฟ", "กฟก.3 ชลบุรี", "นายวีระ ทองคำ", "081-234-5622", "พร้อมใช้งาน", 12, "2027-02-25"),
  V("v23", "63-2208 ยะลา", "ต.3-09-2208", "กระเช้าแก้ไฟ", "กฟต.3 ยะลา", "นายรอซาลี ยูโซะ", "081-234-5623", "พร้อมใช้งาน", 12, "2026-12-28"),
  V("v24", "76-6650 เพชรบุรี", "ต.1-09-6650", "กระเช้าฮอทไลน์", "กฟต.1 เพชรบุรี", "นายสุเมธ ใจกล้า", "081-234-5624", "พร้อมใช้งาน", 12, "2027-01-30"),
];
export const VEHICLE_BY_ID: Record<string, Vehicle> = Object.fromEntries(VEHICLES.map((v) => [v.id, v]));

/* ตัวกรองครบกำหนดตรวจ */
export const DUE_FILTERS = ["เกินกำหนด", "ครบกำหนดในรอบนี้", "ภายใน 30 วัน", "ภายใน 90 วัน", "มากกว่า 90 วัน"] as const;
/** ครบกำหนดตรวจอยู่ในช่วงเดือนของแผน (YYYY-MM) */
export const dueInRange = (iso: string, from: string, to: string) => !!from && !!to && iso.slice(0, 7) >= from && iso.slice(0, 7) <= to;
export const dueBucket = (iso: string): Exclude<(typeof DUE_FILTERS)[number], "ครบกำหนดในรอบนี้"> => {
  const d = daysFromToday(iso);
  return d < 0 ? "เกินกำหนด" : d <= 30 ? "ภายใน 30 วัน" : d <= 90 ? "ภายใน 90 วัน" : "มากกว่า 90 วัน";
};
export const CYCLE_FILTERS = ["6 เดือน", "12 เดือน"];

/* ---------- ผู้รับจ้าง ---------- */
export interface Vendor { id: string; name: string; tel: string }
export const VENDORS: Vendor[] = [
  { id: "ven1", name: "บจก. เซฟตี้ เอ็นจิเนียริ่ง", tel: "02-555-0101" },
  { id: "ven2", name: "หจก. ช่างกลตรวจสอบ", tel: "02-555-0202" },
  { id: "ven3", name: "บจก. ไทยเครน เซอร์วิส", tel: "02-555-0303" },
];
/* ช่องเงิน (เจ้าของงาน 20 พ.ย. 2569): พิมพ์ได้เฉพาะตัวเลขและจุดเดียว · ออกจากช่อง = ใส่ , หลักพัน + ทศนิยม 2 ตำแหน่งเสมอ
   ไม่ใส่ทศนิยม = .00 · ทศนิยมขาด = เติม 0 · เกิน 2 ตำแหน่ง = ปัดเป็น 2 ตำแหน่ง */
/** ข้อความที่พิมพ์ → เหลือเฉพาะตัวเลขกับจุดแรก (ลบ , ที่จัดรูปไว้) */
export const moneyInput = (raw: string) => {
  const t = raw.replace(/[^\d.]/g, "");
  const i = t.indexOf(".");
  return i < 0 ? t : t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, "");
};
/** ตัวเลขจากข้อความ ปัดทศนิยม 2 ตำแหน่ง · ว่าง/ไม่ใช่ตัวเลข = 0 */
export const moneyValue = (raw: string) => { const n = Number(moneyInput(raw)); return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; };
/** แสดงในช่อง: 9000 → "9,000.00" · 0/ว่าง = "" */
export const moneyText = (n: number | undefined) => (n && n > 0 ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
export const bahtText = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " บาท";
/** วันที่ + n เดือน (ISO) */
export const addMonths = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, d));
  return t.toISOString().slice(0, 10);
};
/* หัวหน้า กบค. — ผู้มีสิทธิ์อนุมัติแผนและปิดงาน (ยังไม่รู้ว่ามีใครบ้าง/กี่คน · ข้อมูลจำลอง) */
export interface Head { id: string; name: string }
export const HEADS: Head[] = [
  { id: "head1", name: "นายสมศักดิ์ วงศ์ไทย" },
  { id: "head2", name: "นางสาวพิมพ์ชนก แสงดาว" },
];
export const HEAD_BY_ID: Record<string, Head> = Object.fromEntries(HEADS.map((h) => [h.id, h]));
export const VENDOR_BY_ID: Record<string, Vendor> = Object.fromEntries(VENDORS.map((v) => [v.id, v]));

/* ---------- แผน ---------- */
/** review = รออนุมัติ · returned = ส่งกลับแก้ไข · approved = อนุมัติแล้ว (ผู้รับจ้างเห็น) · closed = ปิดงานแล้ว */
/** ปิดงาน 3 ขั้น (เจ้าของงาน 20 พ.ย. 2569): ผู้รับจ้างขอปิด (closing) → กบค. ขออนุมัติปิดงาน (closeReview) → หัวหน้า กบค. อนุมัติ (closed)
    review = รอหัวหน้า กบค. อนุมัติแผน · returned = ส่งกลับแก้ไข · approved = อนุมัติแล้ว (ผู้รับจ้างเห็น) */
export type PlanStatus = "review" | "returned" | "approved" | "closing" | "closeReview" | "closed";
export const STATUS_TEXT: Record<PlanStatus, [string, "Warning" | "Error" | "Info" | "Gray" | "Purple"]> = {
  review: ["รออนุมัติ", "Warning"],
  returned: ["ส่งกลับแก้ไข", "Error"],
  approved: ["อนุมัติแล้ว", "Info"],
  closing: ["ผู้รับจ้างขอปิดงาน", "Warning"],
  closeReview: ["รออนุมัติปิดงาน", "Purple"],
  closed: ["ปิดงานแล้ว", "Gray"],
};
export interface Plan {
  mr: string;
  name: string;
  fy: string;
  from: string;
  to: string;
  vendor: string;
  /** เบอร์โทรผู้รับจ้าง (ตั้งต้นจากข้อมูลผู้รับจ้าง แก้ได้) */
  vendorTel: string;
  /** เลขที่สัญญา/ใบสั่งจ้าง (ถ้ามี) */
  contract: string;
  /** ค่าจ้างตรวจตามสัญญารายคัน (บาท) — กบค. กำหนดทีละคันตอนสร้างแผน · คีย์ = รหัสยานพาหนะ */
  costs: Record<string, number>;
  cars: string[];
  status: PlanStatus;
  /** วันที่ส่งให้หัวหน้า กบค. อนุมัติแผน (ISO) */
  submittedAt?: string;
  /** หัวหน้า กบค. ส่งกลับแก้ไขแผน: เหตุผล */
  returnReason?: string;
  /** หัวหน้า กบค. ที่อนุมัติแผน + วันที่ */
  approvedBy?: string;
  approvedAt?: string;
  /** ขอปิดงาน: หัวหน้า กบค. ที่ กบค. เลือก · หมายเหตุ · วันที่ขอ */
  closeApprover?: string;
  closeNote?: string;
  closeRequestedAt?: string;
  /** กบค. ส่งกลับคำขอปิดงานของผู้รับจ้าง: เหตุผล (แผนกลับเป็นอนุมัติแล้ว) */
  closeReturnReason?: string;
  /** หัวหน้า กบค. ไม่อนุมัติปิดงาน: เหตุผล (กลับไปให้ กบค. ตรวจสอบ) */
  headReturnReason?: string;
  closedAt?: string;
}

export const PLANS: Plan[] = [
  { mr: "MRZ7000010", name: "ตรวจ ปจ.2 รอบ ธ.ค. 2569 – ก.พ. 2570", fy: "2570", from: "2026-12", to: "2027-02", vendor: "ven1", vendorTel: "02-555-0101", contract: "PO-2570-0112", costs: { v17: 9000, v18: 9000, v19: 9500, v20: 9000, v23: 9000 }, cars: ["v17", "v18", "v19", "v20", "v23"], status: "approved", approvedBy: "head1", approvedAt: "2026-11-10" },
  { mr: "MRZ7000011", name: "ตรวจ ปจ.2 ภาคตะวันออก รอบ ม.ค. – มี.ค. 2570", fy: "2570", from: "2027-01", to: "2027-03", vendor: "ven2", vendorTel: "02-555-0202", contract: "", costs: { v21: 8500, v22: 9200 }, cars: ["v21", "v22"], status: "approved", approvedBy: "head2", approvedAt: "2026-11-12" },
  { mr: "MRZ7000012", name: "ตรวจ ปจ.2 กระเช้าฮอทไลน์ ก.พ. 2570", fy: "2570", from: "2027-02", to: "2027-02", vendor: "ven1", vendorTel: "02-555-0101", contract: "", costs: { v24: 9000 }, cars: ["v24"], status: "review", submittedAt: "2026-11-18" },
  { mr: "MRZ7000008", name: "ตรวจ ปจ.2 เครน ภาคใต้ มี.ค. 2570", fy: "2570", from: "2027-03", to: "2027-03", vendor: "ven3", vendorTel: "02-555-0303", contract: "", costs: { v09: 9800 }, cars: ["v09"], status: "review", submittedAt: "2026-11-19" },
  { mr: "MRZ7000009", name: "ตรวจ ปจ.2 หลัง Overhaul รอบ ม.ค. 2570", fy: "2570", from: "2027-01", to: "2027-01", vendor: "ven1", vendorTel: "02-555-0101", contract: "PO-2570-0098", costs: { v16: 12000 }, cars: ["v16"], status: "closing", approvedBy: "head1", approvedAt: "2026-11-05" },
  { mr: "MRZ6900020", name: "ตรวจ ปจ.2 รอบ ก.ค. – ก.ย. 2569", fy: "2569", from: "2026-07", to: "2026-09", vendor: "ven1", vendorTel: "02-555-0101", contract: "", costs: {  }, cars: [], status: "closed" },
];

/* ---------- เอกสาร ปจ.2 ที่ผู้รับจ้างแนบ (รายคัน) ---------- */
export interface DocFile { name: string; size: string }
/* ผลการตรวจ ปจ.2 (prototype พี่มิก P5-Record) */
export const RESULTS = ["ผ่าน", "ไม่ผ่าน", "ระงับ", "ตรวจไม่ได้"] as const;
export type InspectResult = (typeof RESULTS)[number];
export const RESULT_COLOR: Record<InspectResult, "Success" | "Error" | "Warning" | "Gray"> = { ผ่าน: "Success", ไม่ผ่าน: "Error", ระงับ: "Warning", ตรวจไม่ได้: "Gray" };
/** ผลการตรวจรายคันที่ผู้รับจ้างกรอก + เอกสาร + สถานะการส่ง */
export interface CarDocs {
  /** วันที่ตรวจ (ISO) */
  date?: string;
  /** ค่าจ้างตรวจคันนี้ (บาท) — ไม่มีค่า = ตามสัญญาของคันนั้น (costs ของแผน) */
  cost?: number;
  /** เหตุผลที่ค่าจ้างต่างจากสัญญา (ต้องระบุเมื่อ cost ≠ ค่าตามสัญญาของคันนั้น) */
  costReason?: string;
  result?: InspectResult;
  /** เหตุผลที่ตรวจไม่ได้ (ต้องระบุเมื่อผล = ตรวจไม่ได้) */
  reason?: string;
  /** เอกสารการตรวจ ปจ.2 · ผลตรวจไม่ได้ = หนังสือรับรองจากผู้แทนหน่วยงาน */
  files: DocFile[];
  /** วันที่ส่งอนุมัติ (ISO) — มีค่า = รอ กบค. อนุมัติ · ล็อก แก้ไข/ลบไม่ได้ */
  sentAt?: string;
  /** กบค. อนุมัติแล้ว (ISO) — ล็อกถาวร */
  approvedAt?: string;
  /** กบค. ส่งกลับแก้ไข: เหตุผล — ผู้รับจ้างแก้ไฟล์แล้วส่งอนุมัติใหม่ได้ */
  returnReason?: string;
}
/** คีย์ = เลขที่ MR → รหัสยานพาหนะ */
export type DocsState = Record<string, Record<string, CarDocs>>;

export const DOCS: DocsState = {
  MRZ7000009: {
    v16: { date: "2026-11-08", result: "ผ่าน", files: [{ name: "ปจ2-76-2234.pdf", size: "1.0 MB" }], sentAt: "2026-11-09", approvedAt: "2026-11-10" },
  },
  MRZ7000010: {
    v17: { date: "2026-11-12", cost: 9000, result: "ผ่าน", files: [{ name: "ปจ2-70-8801.pdf", size: "1.4 MB" }], sentAt: "2026-11-15", approvedAt: "2026-11-16" },
    v19: { date: "2026-11-14", cost: 10500, costReason: "ต้องใช้เครื่องยกเสริมเพราะพื้นที่ลาดชัน", result: "ไม่ผ่าน", files: [{ name: "ปจ2-74-7745.pdf", size: "980 KB" }], sentAt: "2026-11-18" },
    v20: { date: "2026-11-13", cost: 9000, result: "ผ่าน", files: [{ name: "ปจ2-82-9956.jpg", size: "3.1 MB" }], returnReason: "เอกสารไม่ชัด อ่านเลขตัวถังไม่ได้ กรุณาสแกนใหม่" },
    v18: { date: "2026-11-17", cost: 9000, result: "ตรวจไม่ได้", reason: "ยานพาหนะอยู่ระหว่างซ่อมระบบไฮดรอลิก ไม่สามารถยกกระเช้าทดสอบได้", files: [{ name: "หนังสือรับรอง-72-3302.pdf", size: "1.1 MB" }] },
    v23: { date: "2026-11-18", cost: 9000, files: [] },
  },
};

/* ---------- เงื่อนไขอัปโหลด (ตามงาน Overhaul BR-01 / บำรุงรักษา) ---------- */
export const UPLOAD_ACCEPT = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";
export const UPLOAD_MAX_FILES = 10;
export const UPLOAD_MAX_MB = 10;
export const UPLOAD_HINT = "PDF, PNG, JPG · ไฟล์ละไม่เกิน " + UPLOAD_MAX_MB + " MB · สูงสุด " + UPLOAD_MAX_FILES + " ไฟล์";
export const fileOk = (f: File) => /\.(pdf|png|jpe?g)$/i.test(f.name) && f.size <= UPLOAD_MAX_MB * 1024 * 1024;
export const sizeText = (bytes: number) => (bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB");
