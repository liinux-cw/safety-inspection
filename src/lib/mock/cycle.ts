/* เกณฑ์วาระการตรวจ ปจ.2 — ตาม Excel "ตาราง วาระการตรวจ ปจ.2 แยก ตามประเภทรถ v3" (เจ้าของงาน 20 พ.ย. 2569 · docs/spec-inspection-cycle.md)
   กติกา (ใช้ข้อแรกที่เจอ): ประเภทย่อย + ยี่ห้อ + รุ่นเครน → แถว "ทุกยี่ห้อ ทุกรุ่น" ของประเภทย่อย → พิกัดยก → ไม่พบ
   แถวทุกยี่ห้อของกลุ่มกระเช้าที่ช่องวาระว่างใน v3 ใช้ 12 ตามหัวตาราง "รถกระเช้า = ทุก 1 ปี" (รอยืนยัน spec ข้อ 12) */

export type CycleMonths = 3 | 6 | 12;
export type CycleSource = "model" | "subtype" | "lift_limit";
export interface InspectionCycle { months: CycleMonths; source: CycleSource; label: string }

/** [ประเภทย่อย, ยี่ห้อเครน, รุ่นเครน, วาระ (เดือน), พิกัดยกของรุ่น (ตัน)] · ยี่ห้อ/รุ่นว่าง = ทุกยี่ห้อ ทุกรุ่น */
export const CYCLE_RULES: [string, string, string, CycleMonths, number | null][] = [
  ["รถกระเช้า", "", "", 12, null],
  ["รถกระเช้าแก้กระแสไฟฟ้าขัดข้อง", "", "", 12, null],
  ["รถกระเช้าแก้กระแสไฟฟ้าขัดข้อง", "ALTEC", "AT35G", 6, null],
  ["รถกระเช้าแก้กระแสไฟฟ้าขัดข้อง", "ALTEC", "AT37G", 12, null],
  ["รถกระเช้าแก้กระแสไฟฟ้าขัดข้อง", "ETI PALFINGER", "ETC-37-IH", 12, null],
  ["รถกระเช้าแก้กระแสไฟฟ้าขัดข้อง", "VERSALIFT", "SST37EIH", 12, null],
  ["รถกระเช้าแก้กระแสไฟฟ้าขัดข้อง", "VERSALIFT", "SST37EIH-01", 12, null],
  ["รถกระเช้าแก้กระแสไฟฟ้าขัดข้อง", "VERSALIFT", "SST37EIH-02", 12, null],
  ["รถกระเช้าฮอทไลน์", "", "", 12, null],
  ["รถกระเช้าฮอทไลน์", "ALTEC", "AM55", 12, null],
  ["รถกระเช้าฮอทไลน์", "ALTEC", "AM600", 12, null],
  ["รถกระเช้าฮอทไลน์", "ALTEC", "AM855", 6, null],
  ["รถกระเช้าฮอทไลน์", "SIMON", "57 OM", 12, null],
  ["รถกระเช้าฮอทไลน์", "TEREX", "TCX-55", 12, null],
  ["รถกระเช้าฮอทไลน์", "VERSALIFT", "VO355MHI", 12, null],
  ["รถกระเช้าฮอทไลน์ (CAT. A)", "ALTEC", "AM855-E81", 12, null],
  ["รถกระเช้าฮอทไลน์ (CAT. A)", "ALTEC", "AN50EOC-E80", 12, null],
  ["รถกระเช้าฮอทไลน์ (CAT. A)", "SIMON", "T5055-80", 12, null],
  ["รถกระเช้าฮอทไลน์ (CAT. A)", "TEREX", "55 OMD-80", 12, null],
  ["รถเครนพิกัด 3-50 ตัน", "", "", 6, null],
  ["รถเครนพิกัด 3-50 ตัน", "GROVE", "GMK2035", 6, 35],
  ["รถเครนพิกัด 3-50 ตัน", "GROVE", "GMK2035E", 6, 35],
  ["รถเครนพิกัด 3-50 ตัน", "KATO", "CR-200RF", 6, 20],
  ["รถเครนพิกัด 3-50 ตัน", "KATO", "CR-200RI", 6, 20],
  ["รถเครนพิกัด 3-50 ตัน", "KATO", "NK250M-III", 6, 25],
  ["รถเครนพิกัด 3-50 ตัน", "KATO", "NK350", 6, 35],
  ["รถเครนพิกัด 3-50 ตัน", "KATO", "NK400E-III", 6, 40],
  ["รถเครนพิกัด 3-50 ตัน", "LIEBHERR", "LTM1030-2.1", 6, 35],
  ["รถเครนพิกัด 3-50 ตัน", "LOCATELLI", "GRIL9225", 6, 25],
  ["รถเครนพิกัด 3-50 ตัน", "TADANO", "AR-250E", 6, 25],
  ["รถเครนพิกัด 3-50 ตัน", "TADANO", "ATF40G-2", 6, 40],
  ["รถเครนพิกัด 3-50 ตัน", "TADANO", "GT-300ER", 6, 30],
  ["รถเครนพิกัด 3-50 ตัน", "TADANO", "GT300ER-3", 6, 30],
  ["รถเครนพิกัด 3-50 ตัน", "TADANO", "TL-250E", 6, 25],
  ["รถเครนพิกัด 3-50 ตัน", "TADANO", "TS-75ML", 6, 7.5],
  ["รถเครนพิกัด 3-50 ตัน", "UNIC", "K160C", 6, null],
  ["รถเครนพิกัดมากกว่า 50 ตัน", "", "", 3, null],
  ["รถเครนพิกัดมากกว่า 50 ตัน", "LIEBHERR", "LTM1060-3.1", 3, 60],
  ["รถเครนพิกัดมากกว่า 50 ตัน", "MARCHETTI", "MG60.3/1", 3, 60],
  ["รถเครนพับ", "", "", 6, null],
  ["รถเครนพับ", "ATLAS", "145.2-A2", 6, 3.25],
  ["รถเครนพับ", "HIAB", "105AW", 6, null],
  ["รถเครนพับ", "HIAB", "140AW", 6, 6],
  ["รถเครนพับ", "HIAB", "145-2", 6, null],
  ["รถเครนพับ", "HIAB", "215", 6, null],
  ["รถเครนพับ", "HIAB", "300", 6, null],
  ["รถเครนพับ", "HIAB", "45", 6, null],
  ["รถเครนพับ", "PALFINGER", "PK10500", 6, 4.15],
  ["รถเครนพับ", "PALFINGER", "PK10500BV", 6, null],
  ["รถเครนพับ", "PALFINGER", "PK12500", 6, null],
  ["รถเครนพับ", "PALFINGER", "PK14080", 6, 5.87],
  ["รถเครนพับ", "PALFINGER", "PK15500", 6, null],
  ["รถเครนพับ", "PALFINGER", "PK15500A", 6, 6.1],
  ["รถเครนพับ", "PALFINGER", "PK8000V", 6, null],
  ["รถเครนตีนตะขาบ", "", "", 6, null],
  ["รถเครนตีนตะขาบ", "MANTIS", "3612", 6, null],
  ["รถเครนตีนตะขาบ", "TADANO", "GTC300EX-LP", 6, null],
  ["รถเครนจับเสา", "", "", 6, null],
  ["รถเครนจับเสา", "JONSERED", "2190", 6, null],
  ["รถเครน/สว่าน/ขุดเจาะ", "", "", 6, null],
  ["รถเครน/สว่าน/ขุดเจาะ", "ALTEC", "DM45B-TR", 6, 12.72],
  ["รถเครน/สว่าน/ขุดเจาะ", "ALTEC", "DM45TB", 6, 12.72],
  ["รถเครน/สว่าน/ขุดเจาะ", "TADANO", "DT-700P", 6, null],
  ["รถเครน/สว่าน/ขุดเจาะ", "TEREX", "CMDR 4047", 6, 11.23],
  ["กระบะบรรทุก 6 ตัน ติดเครน", "", "", 6, null],
  ["บรรทุก 6 ตันติดบูมสามขา", "", "", 6, null],
];

const norm = (s: string) => s.replace(/[\s-]/g, "").toUpperCase();

/** วาระตามพิกัดยก (กฎกระทรวงฯ พ.ศ. 2564 งานอื่น ๆ) · น้อยกว่า 1 ตัน = ไม่พบ */
const byLift = (ton: number): CycleMonths | null => (ton < 1 ? null : ton <= 3 ? 12 : ton <= 50 ? 6 : 3);

export function inspectionCycle(subtype: string, brand: string, model: string, liftTon: number | null): InspectionCycle | null {
  const hit = CYCLE_RULES.find(([s, b, m]) => s === subtype && b && norm(b) === norm(brand) && norm(m) === norm(model));
  const all = CYCLE_RULES.find(([s, b]) => s === subtype && !b);
  /* รุ่นที่วาระเท่าประเภทย่อย = ตามประเภท · ต่างจากประเภทย่อย (เช่น AT35G AM855 รถอายุมาก) = ตามรุ่น */
  if (hit && hit[3] !== all?.[3]) return { months: hit[3], source: "model", label: "ตามรุ่น " + hit[1] + " " + hit[2] };
  if (hit || all) return { months: (all ?? hit)![3], source: "subtype", label: "ตามประเภทยานพาหนะ" };
  const lift = liftTon == null ? null : byLift(liftTon);
  return lift ? { months: lift, source: "lift_limit", label: "ตามพิกัดยก " + liftTon + " ตัน" } : null;
}
