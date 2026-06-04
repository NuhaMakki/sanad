import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const PASSWORD_HASH = await bcrypt.hash("password123", 10);
  console.log("🌱 Starting seed...");

  // ─── Colleges ────────────────────────────────────────────
  const colleges = await Promise.all([
    prisma.college.create({ data: { name: "كلية الشريعة", code: "SHARIA" } }),
    prisma.college.create({ data: { name: "كلية أصول الدين", code: "USOOL" } }),
    prisma.college.create({ data: { name: "كلية علوم الحاسب والمعلومات", code: "CS" } }),
    prisma.college.create({ data: { name: "كلية إدارة الأعمال", code: "BUS" } }),
    prisma.college.create({ data: { name: "كلية اللغة العربية", code: "ARABIC" } }),
  ]);

  const [sharia, usool, cs, bus, arabic] = colleges;

  // ─── Departments ─────────────────────────────────────────
  const depts = await Promise.all([
    // CS departments
    prisma.department.create({ data: { name: "قسم علوم الحاسب", code: "CS-CS", collegeId: cs.id } }),
    prisma.department.create({ data: { name: "قسم نظم المعلومات", code: "CS-IS", collegeId: cs.id } }),
    prisma.department.create({ data: { name: "قسم هندسة البرمجيات", code: "CS-SE", collegeId: cs.id } }),
    // Business departments
    prisma.department.create({ data: { name: "قسم إدارة الأعمال", code: "BUS-BA", collegeId: bus.id } }),
    prisma.department.create({ data: { name: "قسم المحاسبة", code: "BUS-ACC", collegeId: bus.id } }),
    prisma.department.create({ data: { name: "قسم التسويق", code: "BUS-MKT", collegeId: bus.id } }),
    // Sharia departments
    prisma.department.create({ data: { name: "قسم الفقه", code: "SH-FQ", collegeId: sharia.id } }),
    prisma.department.create({ data: { name: "قسم أصول الفقه", code: "SH-AF", collegeId: sharia.id } }),
    // Usool departments
    prisma.department.create({ data: { name: "قسم العقيدة", code: "US-AQ", collegeId: usool.id } }),
    prisma.department.create({ data: { name: "قسم التفسير والحديث", code: "US-TH", collegeId: usool.id } }),
    // Arabic departments
    prisma.department.create({ data: { name: "قسم اللغة العربية وآدابها", code: "AR-LG", collegeId: arabic.id } }),
    prisma.department.create({ data: { name: "قسم البلاغة والنقد", code: "AR-BL", collegeId: arabic.id } }),
  ]);

  const [csCs, csIs, csSe, busBa, busAcc, busMkt, shFq, shAf, usAq, usTh, arLg, arBl] = depts;

  // ─── Service Units ────────────────────────────────────────
  const officeHours = JSON.stringify({ sat: "8-12", sun: "8-12", mon: "8-12", tue: "8-12", wed: "8-12" });

  const units = await Promise.all([
    prisma.serviceUnit.create({ data: { name: "مكتب التسجيل والقبول", type: "REGISTRATION", isAvailable: true, officeHours, description: "إضافة وحذف المواد وكل ما يتعلق بالتسجيل" } }),
    prisma.serviceUnit.create({ data: { name: "وحدة الإرشاد الأكاديمي", type: "ADVISING", isAvailable: true, officeHours, description: "الإرشاد الأكاديمي ومتابعة المسيرة التعليمية" } }),
    prisma.serviceUnit.create({ data: { name: "إدارة الشؤون المالية", type: "FINANCE", isAvailable: true, officeHours, description: "المسائل المالية والرسوم والمنح" } }),
    prisma.serviceUnit.create({ data: { name: "شؤون الطلاب", type: "STUDENT_AFFAIRS", isAvailable: true, officeHours, description: "الأنشطة الطلابية والخدمات العامة" } }),
    prisma.serviceUnit.create({ data: { name: "إدارة شؤون الخريجين", type: "GRADUATES", isAvailable: true, officeHours, description: "إنهاء متطلبات التخرج ووثائق التخرج" } }),
    prisma.serviceUnit.create({ data: { name: "وحدة الدعم النفسي والاجتماعي", type: "SUPPORT", isAvailable: true, officeHours, description: "الدعم النفسي والاجتماعي للطلاب" } }),
    prisma.serviceUnit.create({ data: { name: "مكتب الجداول الدراسية", type: "SCHEDULES", isAvailable: true, officeHours, description: "الجداول والشعب الدراسية والتعارضات" } }),
    prisma.serviceUnit.create({ data: { name: "مكتب التدريب الميداني", type: "TRAINING", isAvailable: false, officeHours, description: "التدريب الصيفي والميداني" } }),
  ]);

  const [regUnit, advUnit, finUnit, affUnit, gradUnit, supUnit, schedUnit, trainUnit] = units;

  // ─── Issue Types ──────────────────────────────────────────
  await prisma.issueType.createMany({
    data: [
      // Registration
      { name: "إضافة مادة", serviceUnitId: regUnit.id, priority: "NORMAL", description: "طلب إضافة مادة دراسية" },
      { name: "حذف مادة", serviceUnitId: regUnit.id, priority: "NORMAL", description: "طلب حذف مادة دراسية" },
      { name: "شعبة مغلقة", serviceUnitId: regUnit.id, priority: "HIGH", description: "المادة أو الشعبة المطلوبة مغلقة" },
      { name: "مشكلة في الجدول", serviceUnitId: regUnit.id, priority: "NORMAL", description: "تعارض أو مشكلة في الجدول الدراسي" },
      { name: "تسجيل متأخر", serviceUnitId: regUnit.id, priority: "HIGH", description: "لم يتم التسجيل في الوقت المحدد" },
      { name: "استفسار عام عن التسجيل", serviceUnitId: regUnit.id, priority: "LOW", description: "" },
      // Advising
      { name: "إرشاد أكاديمي عام", serviceUnitId: advUnit.id, priority: "NORMAL", description: "استشارة أكاديمية عامة" },
      { name: "انخفاض المعدل", serviceUnitId: advUnit.id, priority: "HIGH", description: "تراجع في المعدل التراكمي" },
      { name: "إنذار أكاديمي", serviceUnitId: advUnit.id, priority: "HIGH", description: "متابعة إنذار أكاديمي" },
      { name: "خطة دراسية", serviceUnitId: advUnit.id, priority: "NORMAL", description: "مراجعة أو تعديل الخطة الدراسية" },
      { name: "تحويل تخصص", serviceUnitId: advUnit.id, priority: "NORMAL", description: "طلب تغيير التخصص" },
      { name: "استفسار عن التخرج", serviceUnitId: advUnit.id, priority: "HIGH", description: "" },
      // Finance
      { name: "استفسار عن الرسوم", serviceUnitId: finUnit.id, priority: "NORMAL", description: "" },
      { name: "منحة دراسية", serviceUnitId: finUnit.id, priority: "NORMAL", description: "استفسار عن المنح" },
      { name: "إعفاء من رسوم", serviceUnitId: finUnit.id, priority: "HIGH", description: "" },
      { name: "مشكلة في الدفع", serviceUnitId: finUnit.id, priority: "HIGH", description: "" },
      { name: "طباعة كشف حساب", serviceUnitId: finUnit.id, priority: "LOW", description: "" },
      { name: "استفسار مالي عام", serviceUnitId: finUnit.id, priority: "LOW", description: "" },
      // Student Affairs
      { name: "نشاط طلابي", serviceUnitId: affUnit.id, priority: "LOW", description: "" },
      { name: "شكوى", serviceUnitId: affUnit.id, priority: "HIGH", description: "" },
      { name: "وثيقة إدارية", serviceUnitId: affUnit.id, priority: "NORMAL", description: "طلب وثيقة أو شهادة" },
      { name: "غياب وعذر", serviceUnitId: affUnit.id, priority: "NORMAL", description: "تقديم عذر للغياب" },
      { name: "استفسار عام", serviceUnitId: affUnit.id, priority: "LOW", description: "" },
      { name: "مشكلة سكن", serviceUnitId: affUnit.id, priority: "HIGH", description: "" },
      // Graduates
      { name: "متطلبات التخرج", serviceUnitId: gradUnit.id, priority: "HIGH", description: "" },
      { name: "شهادة التخرج", serviceUnitId: gradUnit.id, priority: "HIGH", description: "" },
      { name: "السجل الأكاديمي", serviceUnitId: gradUnit.id, priority: "NORMAL", description: "" },
      { name: "توثيق الشهادات", serviceUnitId: gradUnit.id, priority: "NORMAL", description: "" },
      { name: "الدراسات العليا", serviceUnitId: gradUnit.id, priority: "NORMAL", description: "" },
      { name: "استفسار عن التخرج", serviceUnitId: gradUnit.id, priority: "HIGH", description: "" },
      // Support
      { name: "دعم نفسي", serviceUnitId: supUnit.id, priority: "HIGH", description: "" },
      { name: "ضغط وتوتر دراسي", serviceUnitId: supUnit.id, priority: "NORMAL", description: "" },
      { name: "صعوبة في التكيف", serviceUnitId: supUnit.id, priority: "NORMAL", description: "" },
      { name: "مشكلة شخصية تؤثر على الدراسة", serviceUnitId: supUnit.id, priority: "HIGH", description: "" },
      { name: "إرشاد نفسي", serviceUnitId: supUnit.id, priority: "HIGH", description: "" },
      { name: "استشارة اجتماعية", serviceUnitId: supUnit.id, priority: "NORMAL", description: "" },
      // Schedules
      { name: "تعارض جدول", serviceUnitId: schedUnit.id, priority: "HIGH", description: "" },
      { name: "تغيير شعبة", serviceUnitId: schedUnit.id, priority: "NORMAL", description: "" },
      { name: "جدول مفقود", serviceUnitId: schedUnit.id, priority: "NORMAL", description: "" },
      { name: "استفسار عن الجدول", serviceUnitId: schedUnit.id, priority: "LOW", description: "" },
      // Training
      { name: "تسجيل في التدريب", serviceUnitId: trainUnit.id, priority: "NORMAL", description: "" },
      { name: "مكان التدريب", serviceUnitId: trainUnit.id, priority: "NORMAL", description: "" },
      { name: "تقرير التدريب", serviceUnitId: trainUnit.id, priority: "NORMAL", description: "" },
    ],
  });

  // ─── Admin User ───────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: { username: "admin", passwordHash: PASSWORD_HASH, role: "ADMIN", name: "مدير النظام" },
  });

  // ─── Advisors ─────────────────────────────────────────────
  const advisorUsers = await Promise.all([
    prisma.user.create({ data: { username: "advisor1", passwordHash: PASSWORD_HASH, role: "ADVISOR", name: "د. محمد العمري" } }),
    prisma.user.create({ data: { username: "advisor2", passwordHash: PASSWORD_HASH, role: "ADVISOR", name: "د. فهد الزهراني" } }),
    prisma.user.create({ data: { username: "advisor3", passwordHash: PASSWORD_HASH, role: "ADVISOR", name: "د. أحمد القحطاني" } }),
    prisma.user.create({ data: { username: "advisor4", passwordHash: PASSWORD_HASH, role: "ADVISOR", name: "د. خالد المالكي" } }),
  ]);

  const advisors = await Promise.all([
    prisma.advisor.create({ data: { userId: advisorUsers[0].id, collegeId: cs.id, departmentId: csCs.id } }),
    prisma.advisor.create({ data: { userId: advisorUsers[1].id, collegeId: bus.id, departmentId: busBa.id } }),
    prisma.advisor.create({ data: { userId: advisorUsers[2].id, collegeId: sharia.id, departmentId: shFq.id } }),
    prisma.advisor.create({ data: { userId: advisorUsers[3].id, collegeId: arabic.id, departmentId: arLg.id } }),
  ]);

  // ─── Staff Users ──────────────────────────────────────────
  const staffUsers = await Promise.all([
    prisma.user.create({ data: { username: "staff1", passwordHash: PASSWORD_HASH, role: "STAFF", name: "أ. سارة الحربي" } }),
    prisma.user.create({ data: { username: "staff2", passwordHash: PASSWORD_HASH, role: "STAFF", name: "أ. ريم العتيبي" } }),
    prisma.user.create({ data: { username: "staff3", passwordHash: PASSWORD_HASH, role: "STAFF", name: "أ. نورة السبيعي" } }),
    prisma.user.create({ data: { username: "staff4", passwordHash: PASSWORD_HASH, role: "STAFF", name: "أ. هند الشهري" } }),
    prisma.user.create({ data: { username: "staff5", passwordHash: PASSWORD_HASH, role: "STAFF", name: "أ. لطيفة الغامدي" } }),
    prisma.user.create({ data: { username: "staff6", passwordHash: PASSWORD_HASH, role: "STAFF", name: "أ. منيرة الدوسري" } }),
    prisma.user.create({ data: { username: "staff7", passwordHash: PASSWORD_HASH, role: "STAFF", name: "أ. وفاء الرشيدي" } }),
    prisma.user.create({ data: { username: "staff8", passwordHash: PASSWORD_HASH, role: "STAFF", name: "أ. عهود الصاعدي" } }),
  ]);

  await Promise.all([
    prisma.staff.create({ data: { userId: staffUsers[0].id, serviceUnitId: regUnit.id, isAvailable: true, officeHours } }),
    prisma.staff.create({ data: { userId: staffUsers[1].id, serviceUnitId: regUnit.id, isAvailable: true, officeHours } }),
    prisma.staff.create({ data: { userId: staffUsers[2].id, serviceUnitId: advUnit.id, isAvailable: true, officeHours } }),
    prisma.staff.create({ data: { userId: staffUsers[3].id, serviceUnitId: finUnit.id, isAvailable: true, officeHours } }),
    prisma.staff.create({ data: { userId: staffUsers[4].id, serviceUnitId: affUnit.id, isAvailable: true, officeHours } }),
    prisma.staff.create({ data: { userId: staffUsers[5].id, serviceUnitId: gradUnit.id, isAvailable: true, officeHours } }),
    prisma.staff.create({ data: { userId: staffUsers[6].id, serviceUnitId: supUnit.id, isAvailable: true, officeHours } }),
    prisma.staff.create({ data: { userId: staffUsers[7].id, serviceUnitId: schedUnit.id, isAvailable: true, officeHours } }),
  ]);

  // ─── Courses ──────────────────────────────────────────────
  const courses = await Promise.all([
    prisma.course.create({ data: { name: "هياكل البيانات", code: "CS201", departmentId: csCs.id, credits: 3 } }),
    prisma.course.create({ data: { name: "قواعد البيانات", code: "CS301", departmentId: csCs.id, credits: 3 } }),
    prisma.course.create({ data: { name: "الخوارزميات", code: "CS302", departmentId: csCs.id, credits: 3 } }),
    prisma.course.create({ data: { name: "نظم التشغيل", code: "CS401", departmentId: csCs.id, credits: 3 } }),
    prisma.course.create({ data: { name: "الشبكات الحاسوبية", code: "CS402", departmentId: csCs.id, credits: 3 } }),
    prisma.course.create({ data: { name: "نظم المعلومات الإدارية", code: "IS301", departmentId: csIs.id, credits: 3 } }),
    prisma.course.create({ data: { name: "مبادئ الإدارة", code: "BUS101", departmentId: busBa.id, credits: 3 } }),
    prisma.course.create({ data: { name: "المحاسبة المالية", code: "ACC201", departmentId: busAcc.id, credits: 3 } }),
    prisma.course.create({ data: { name: "مبادئ التسويق", code: "MKT201", departmentId: busMkt.id, credits: 3 } }),
    prisma.course.create({ data: { name: "الفقه العبادات", code: "FQ101", departmentId: shFq.id, credits: 3 } }),
    prisma.course.create({ data: { name: "أصول الفقه", code: "AF201", departmentId: shAf.id, credits: 3 } }),
    prisma.course.create({ data: { name: "علم العقيدة", code: "AQ101", departmentId: usAq.id, credits: 3 } }),
    prisma.course.create({ data: { name: "النحو والصرف", code: "AR201", departmentId: arLg.id, credits: 3 } }),
    prisma.course.create({ data: { name: "البلاغة العربية", code: "AR301", departmentId: arBl.id, credits: 3 } }),
  ]);

  // ─── Students (50+) ───────────────────────────────────────
  type StudentProfile = {
    username: string;
    name: string;
    studentNumber: string;
    collegeId: string;
    departmentId: string;
    advisorId: string;
    year: number;
    gpa: number;
    isGraduating: boolean;
    warningCount: number;
    academicStatus: string;
    riskCategory: "SAFE" | "NORMAL" | "EARLY_RISK" | "PROBABLE_RISK" | "HIGH_RISK";
  };

  const studentProfiles: StudentProfile[] = [
    // ── SAFE (10 students) ──
    { username: "student1", name: "أحمد محمد الغامدي", studentNumber: "443110001", collegeId: cs.id, departmentId: csCs.id, advisorId: advisors[0].id, year: 3, gpa: 4.2, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "SAFE" },
    { username: "s443110002", name: "سارة عبدالله العتيبي", studentNumber: "443110002", collegeId: cs.id, departmentId: csIs.id, advisorId: advisors[0].id, year: 2, gpa: 4.5, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "SAFE" },
    { username: "s443110003", name: "عمر علي الزهراني", studentNumber: "443110003", collegeId: bus.id, departmentId: busBa.id, advisorId: advisors[1].id, year: 4, gpa: 3.8, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "SAFE" },
    { username: "s443110004", name: "ريم سالم الحربي", studentNumber: "443110004", collegeId: bus.id, departmentId: busAcc.id, advisorId: advisors[1].id, year: 1, gpa: 4.1, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "SAFE" },
    { username: "s443110005", name: "عبدالله فهد القحطاني", studentNumber: "443110005", collegeId: sharia.id, departmentId: shFq.id, advisorId: advisors[2].id, year: 2, gpa: 3.9, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "SAFE" },
    { username: "s443110006", name: "نورة محمد الشهري", studentNumber: "443110006", collegeId: sharia.id, departmentId: shAf.id, advisorId: advisors[2].id, year: 3, gpa: 4.3, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "SAFE" },
    { username: "s443110007", name: "يوسف إبراهيم المالكي", studentNumber: "443110007", collegeId: arabic.id, departmentId: arLg.id, advisorId: advisors[3].id, year: 1, gpa: 4.0, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "SAFE" },
    { username: "s443110008", name: "لطيفة أحمد الدوسري", studentNumber: "443110008", collegeId: arabic.id, departmentId: arBl.id, advisorId: advisors[3].id, year: 2, gpa: 4.4, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "SAFE" },
    { username: "s443110009", name: "بدر خالد الرشيدي", studentNumber: "443110009", collegeId: cs.id, departmentId: csSe.id, advisorId: advisors[0].id, year: 3, gpa: 3.7, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "SAFE" },
    { username: "s443110010", name: "هند علي السبيعي", studentNumber: "443110010", collegeId: bus.id, departmentId: busMkt.id, advisorId: advisors[1].id, year: 2, gpa: 4.1, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "SAFE" },
    // ── NORMAL (15 students) ──
    { username: "s443120001", name: "منصور سعد الغامدي", studentNumber: "443120001", collegeId: cs.id, departmentId: csCs.id, advisorId: advisors[0].id, year: 2, gpa: 3.2, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120002", name: "أمل ناصر العمري", studentNumber: "443120002", collegeId: cs.id, departmentId: csIs.id, advisorId: advisors[0].id, year: 3, gpa: 3.0, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120003", name: "تركي عبدالرحمن الشهراني", studentNumber: "443120003", collegeId: bus.id, departmentId: busBa.id, advisorId: advisors[1].id, year: 2, gpa: 2.8, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120004", name: "رشا محمد الوادعي", studentNumber: "443120004", collegeId: bus.id, departmentId: busAcc.id, advisorId: advisors[1].id, year: 3, gpa: 3.1, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120005", name: "ماجد سليم القرني", studentNumber: "443120005", collegeId: sharia.id, departmentId: shFq.id, advisorId: advisors[2].id, year: 3, gpa: 2.9, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120006", name: "وفاء حسن البقمي", studentNumber: "443120006", collegeId: sharia.id, departmentId: shAf.id, advisorId: advisors[2].id, year: 1, gpa: 3.3, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120007", name: "فيصل مساعد الحربي", studentNumber: "443120007", collegeId: arabic.id, departmentId: arLg.id, advisorId: advisors[3].id, year: 2, gpa: 3.0, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120008", name: "أسماء جابر الزهراني", studentNumber: "443120008", collegeId: arabic.id, departmentId: arBl.id, advisorId: advisors[3].id, year: 3, gpa: 2.7, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120009", name: "حمد عيد الشمري", studentNumber: "443120009", collegeId: cs.id, departmentId: csSe.id, advisorId: advisors[0].id, year: 1, gpa: 3.2, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120010", name: "غادة سعيد المطيري", studentNumber: "443120010", collegeId: bus.id, departmentId: busMkt.id, advisorId: advisors[1].id, year: 4, gpa: 2.9, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120011", name: "أنور محمد الربيعي", studentNumber: "443120011", collegeId: cs.id, departmentId: csCs.id, advisorId: advisors[0].id, year: 3, gpa: 3.1, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120012", name: "شيماء عبدالله الرفاعي", studentNumber: "443120012", collegeId: sharia.id, departmentId: shFq.id, advisorId: advisors[2].id, year: 2, gpa: 2.8, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120013", name: "يحيى سعد الأسمري", studentNumber: "443120013", collegeId: usool.id, departmentId: usAq.id, advisorId: advisors[2].id, year: 2, gpa: 3.0, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120014", name: "هالة فؤاد الغامدي", studentNumber: "443120014", collegeId: usool.id, departmentId: usTh.id, advisorId: advisors[2].id, year: 3, gpa: 3.2, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    { username: "s443120015", name: "ناصر طاهر الحازمي", studentNumber: "443120015", collegeId: bus.id, departmentId: busBa.id, advisorId: advisors[1].id, year: 1, gpa: 2.9, isGraduating: false, warningCount: 0, academicStatus: "ACTIVE", riskCategory: "NORMAL" },
    // ── EARLY_RISK (10 students) ──
    { username: "s443130001", name: "سلطان مشعل البقيعي", studentNumber: "443130001", collegeId: cs.id, departmentId: csCs.id, advisorId: advisors[0].id, year: 3, gpa: 2.3, isGraduating: false, warningCount: 1, academicStatus: "ACTIVE", riskCategory: "EARLY_RISK" },
    { username: "s443130002", name: "شروق حمد الدهاس", studentNumber: "443130002", collegeId: bus.id, departmentId: busBa.id, advisorId: advisors[1].id, year: 2, gpa: 2.2, isGraduating: false, warningCount: 1, academicStatus: "ACTIVE", riskCategory: "EARLY_RISK" },
    { username: "s443130003", name: "فارس جبر العنزي", studentNumber: "443130003", collegeId: cs.id, departmentId: csIs.id, advisorId: advisors[0].id, year: 4, gpa: 2.4, isGraduating: false, warningCount: 1, academicStatus: "ACTIVE", riskCategory: "EARLY_RISK" },
    { username: "s443130004", name: "دانة ثامر الشمراني", studentNumber: "443130004", collegeId: sharia.id, departmentId: shFq.id, advisorId: advisors[2].id, year: 2, gpa: 2.5, isGraduating: false, warningCount: 1, academicStatus: "ACTIVE", riskCategory: "EARLY_RISK" },
    { username: "s443130005", name: "عزيز صالح القثامي", studentNumber: "443130005", collegeId: arabic.id, departmentId: arLg.id, advisorId: advisors[3].id, year: 3, gpa: 2.3, isGraduating: false, warningCount: 1, academicStatus: "ACTIVE", riskCategory: "EARLY_RISK" },
    { username: "s443130006", name: "مريم تركي الحربي", studentNumber: "443130006", collegeId: bus.id, departmentId: busAcc.id, advisorId: advisors[1].id, year: 3, gpa: 2.4, isGraduating: false, warningCount: 1, academicStatus: "ACTIVE", riskCategory: "EARLY_RISK" },
    { username: "s443130007", name: "صالح ربيع المرواني", studentNumber: "443130007", collegeId: cs.id, departmentId: csSe.id, advisorId: advisors[0].id, year: 2, gpa: 2.2, isGraduating: false, warningCount: 1, academicStatus: "ACTIVE", riskCategory: "EARLY_RISK" },
    { username: "s443130008", name: "ندى سليمان العتيبي", studentNumber: "443130008", collegeId: arabic.id, departmentId: arBl.id, advisorId: advisors[3].id, year: 2, gpa: 2.3, isGraduating: false, warningCount: 1, academicStatus: "ACTIVE", riskCategory: "EARLY_RISK" },
    { username: "s443130009", name: "لؤي أحمد البلوي", studentNumber: "443130009", collegeId: usool.id, departmentId: usAq.id, advisorId: advisors[2].id, year: 3, gpa: 2.4, isGraduating: false, warningCount: 1, academicStatus: "ACTIVE", riskCategory: "EARLY_RISK" },
    { username: "s443130010", name: "نجود يوسف الغامدي", studentNumber: "443130010", collegeId: bus.id, departmentId: busMkt.id, advisorId: advisors[1].id, year: 2, gpa: 2.2, isGraduating: false, warningCount: 1, academicStatus: "ACTIVE", riskCategory: "EARLY_RISK" },
    // ── PROBABLE_RISK (10 students) ──
    { username: "s443140001", name: "حسين رابع الشهري", studentNumber: "443140001", collegeId: cs.id, departmentId: csCs.id, advisorId: advisors[0].id, year: 3, gpa: 1.8, isGraduating: false, warningCount: 2, academicStatus: "ACTIVE", riskCategory: "PROBABLE_RISK" },
    { username: "s443140002", name: "هيفاء طلال الدوسري", studentNumber: "443140002", collegeId: bus.id, departmentId: busBa.id, advisorId: advisors[1].id, year: 4, gpa: 1.9, isGraduating: false, warningCount: 2, academicStatus: "ACTIVE", riskCategory: "PROBABLE_RISK" },
    { username: "s443140003", name: "خالد زياد المطيري", studentNumber: "443140003", collegeId: cs.id, departmentId: csIs.id, advisorId: advisors[0].id, year: 3, gpa: 1.7, isGraduating: false, warningCount: 2, academicStatus: "ACTIVE", riskCategory: "PROBABLE_RISK" },
    { username: "s443140004", name: "سوسن عوض الحازمي", studentNumber: "443140004", collegeId: sharia.id, departmentId: shAf.id, advisorId: advisors[2].id, year: 3, gpa: 1.8, isGraduating: false, warningCount: 2, academicStatus: "ACTIVE", riskCategory: "PROBABLE_RISK" },
    { username: "s443140005", name: "مصطفى طارق السلمي", studentNumber: "443140005", collegeId: arabic.id, departmentId: arLg.id, advisorId: advisors[3].id, year: 4, gpa: 1.9, isGraduating: false, warningCount: 2, academicStatus: "ACTIVE", riskCategory: "PROBABLE_RISK" },
    { username: "s443140006", name: "أروى ماهر القرشي", studentNumber: "443140006", collegeId: bus.id, departmentId: busAcc.id, advisorId: advisors[1].id, year: 3, gpa: 1.7, isGraduating: false, warningCount: 2, academicStatus: "ACTIVE", riskCategory: "PROBABLE_RISK" },
    { username: "s443140007", name: "عماد بدر الرفاعي", studentNumber: "443140007", collegeId: cs.id, departmentId: csSe.id, advisorId: advisors[0].id, year: 4, gpa: 1.8, isGraduating: false, warningCount: 2, academicStatus: "ACTIVE", riskCategory: "PROBABLE_RISK" },
    { username: "s443140008", name: "لمياء سعود الزهراني", studentNumber: "443140008", collegeId: arabic.id, departmentId: arBl.id, advisorId: advisors[3].id, year: 3, gpa: 1.9, isGraduating: false, warningCount: 2, academicStatus: "ACTIVE", riskCategory: "PROBABLE_RISK" },
    { username: "s443140009", name: "بشير جمال العمري", studentNumber: "443140009", collegeId: usool.id, departmentId: usTh.id, advisorId: advisors[2].id, year: 3, gpa: 1.7, isGraduating: false, warningCount: 2, academicStatus: "ACTIVE", riskCategory: "PROBABLE_RISK" },
    { username: "s443140010", name: "رغد حمود القحطاني", studentNumber: "443140010", collegeId: bus.id, departmentId: busMkt.id, advisorId: advisors[1].id, year: 4, gpa: 1.9, isGraduating: false, warningCount: 2, academicStatus: "ACTIVE", riskCategory: "PROBABLE_RISK" },
    // ── HIGH_RISK (7 students) ──
    { username: "student_risk", name: "وليد عادل الحربي", studentNumber: "443150001", collegeId: cs.id, departmentId: csCs.id, advisorId: advisors[0].id, year: 5, gpa: 1.3, isGraduating: true, warningCount: 3, academicStatus: "ACTIVE", riskCategory: "HIGH_RISK" },
    { username: "s443150002", name: "منى حسين البيشي", studentNumber: "443150002", collegeId: bus.id, departmentId: busBa.id, advisorId: advisors[1].id, year: 5, gpa: 1.2, isGraduating: true, warningCount: 3, academicStatus: "ACTIVE", riskCategory: "HIGH_RISK" },
    { username: "s443150003", name: "راشد سليم السهلي", studentNumber: "443150003", collegeId: cs.id, departmentId: csIs.id, advisorId: advisors[0].id, year: 4, gpa: 1.4, isGraduating: false, warningCount: 3, academicStatus: "ACTIVE", riskCategory: "HIGH_RISK" },
    { username: "s443150004", name: "حنان وليد السعدي", studentNumber: "443150004", collegeId: sharia.id, departmentId: shFq.id, advisorId: advisors[2].id, year: 5, gpa: 1.3, isGraduating: true, warningCount: 3, academicStatus: "ACTIVE", riskCategory: "HIGH_RISK" },
    { username: "s443150005", name: "أيمن قاسم الردادي", studentNumber: "443150005", collegeId: arabic.id, departmentId: arLg.id, advisorId: advisors[3].id, year: 4, gpa: 1.2, isGraduating: false, warningCount: 3, academicStatus: "ACTIVE", riskCategory: "HIGH_RISK" },
    { username: "s443150006", name: "مروة جلال الشهراني", studentNumber: "443150006", collegeId: bus.id, departmentId: busAcc.id, advisorId: advisors[1].id, year: 5, gpa: 1.4, isGraduating: true, warningCount: 3, academicStatus: "ACTIVE", riskCategory: "HIGH_RISK" },
    { username: "s443150007", name: "كريم عثمان الغامدي", studentNumber: "443150007", collegeId: usool.id, departmentId: usAq.id, advisorId: advisors[2].id, year: 4, gpa: 1.3, isGraduating: false, warningCount: 3, academicStatus: "ACTIVE", riskCategory: "HIGH_RISK" },
  ];

  // Create student users and student records
  const studentMap = new Map<string, { student: { id: string; riskCategory: string } }>();

  for (const profile of studentProfiles) {
    const user = await prisma.user.create({
      data: {
        username: profile.username,
        passwordHash: PASSWORD_HASH,
        role: "STUDENT",
        name: profile.name,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        studentNumber: profile.studentNumber,
        collegeId: profile.collegeId,
        departmentId: profile.departmentId,
        advisorId: profile.advisorId,
        year: profile.year,
        gpa: profile.gpa,
        isGraduating: profile.isGraduating,
        warningCount: profile.warningCount,
        academicStatus: profile.academicStatus,
        lastActivityAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });

    studentMap.set(profile.username, { student: { id: student.id, riskCategory: profile.riskCategory } });
  }

  // ─── Academic & Attendance Records ───────────────────────
  const sem1 = "1445-2";
  const sem2 = "1446-1";

  for (const [username, { student }] of studentMap) {
    const rc = student.riskCategory;

    // Pick 3-4 courses for CS students, different for others
    const profile = studentProfiles.find((p) => p.username === username)!;
    let studentCourses: typeof courses[0][] = [];

    if (profile.collegeId === cs.id) {
      studentCourses = courses.slice(0, 4);
    } else if (profile.collegeId === bus.id) {
      studentCourses = courses.slice(6, 10);
    } else if (profile.collegeId === sharia.id) {
      studentCourses = courses.slice(9, 12);
    } else if (profile.collegeId === arabic.id) {
      studentCourses = courses.slice(12, 14);
    } else {
      studentCourses = courses.slice(11, 13);
    }

    for (const course of studentCourses) {
      // Grade factors by risk
      let midterm1: number, midterm2: number, attendance1: number, attendance2: number;

      if (rc === "SAFE") {
        midterm1 = 75 + Math.random() * 25;
        midterm2 = 70 + Math.random() * 30;
        attendance1 = 90 + Math.random() * 10;
        attendance2 = 85 + Math.random() * 15;
      } else if (rc === "NORMAL") {
        midterm1 = 60 + Math.random() * 25;
        midterm2 = 55 + Math.random() * 30;
        attendance1 = 80 + Math.random() * 15;
        attendance2 = 75 + Math.random() * 20;
      } else if (rc === "EARLY_RISK") {
        midterm1 = 45 + Math.random() * 25;
        midterm2 = 40 + Math.random() * 20;
        attendance1 = 65 + Math.random() * 20;
        attendance2 = 60 + Math.random() * 20;
      } else if (rc === "PROBABLE_RISK") {
        midterm1 = 30 + Math.random() * 25;
        midterm2 = 25 + Math.random() * 25;
        attendance1 = 45 + Math.random() * 20;
        attendance2 = 40 + Math.random() * 20;
      } else {
        // HIGH_RISK
        midterm1 = 15 + Math.random() * 25;
        midterm2 = 10 + Math.random() * 25;
        attendance1 = 20 + Math.random() * 20;
        attendance2 = 15 + Math.random() * 20;
      }

      midterm1 = Math.max(0, Math.min(100, midterm1));
      midterm2 = Math.max(0, Math.min(100, midterm2));
      attendance1 = Math.max(0, Math.min(100, attendance1));
      attendance2 = Math.max(0, Math.min(100, attendance2));

      const total1 = Math.random() * 100 > 50 ? midterm1 + Math.random() * 20 : null;
      const total2 = midterm2 + Math.random() * 20;

      await prisma.academicRecord.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          semester: sem1,
          midtermGrade: Math.round(midterm1 * 100) / 100,
          finalGrade: total1 ? Math.round(total1 * 100) / 100 : null,
          totalGrade: total1 ? Math.round(total1 * 100) / 100 : null,
          gradePercentage: Math.round(midterm1 * 100) / 100,
        },
      });

      await prisma.academicRecord.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          semester: sem2,
          midtermGrade: Math.round(midterm2 * 100) / 100,
          finalGrade: null,
          totalGrade: Math.round(total2 * 100) / 100,
          gradePercentage: Math.round(midterm2 * 100) / 100,
        },
      });

      const totalClasses = 28;
      const attended1 = Math.round((attendance1 / 100) * totalClasses);
      const attended2 = Math.round((attendance2 / 100) * totalClasses);

      await prisma.attendanceRecord.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          semester: sem1,
          totalClasses,
          attendedClasses: attended1,
          percentage: Math.round((attended1 / totalClasses) * 100 * 10) / 10,
        },
      });

      await prisma.attendanceRecord.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          semester: sem2,
          totalClasses,
          attendedClasses: attended2,
          percentage: Math.round((attended2 / totalClasses) * 100 * 10) / 10,
        },
      });
    }
  }

  // ─── Risk Scores ──────────────────────────────────────────
  const riskLevelMap: Record<string, { score: number; level: string; reasons: string[]; recommendations: string[] }> = {
    SAFE: { score: 10, level: "SAFE", reasons: ["أداء أكاديمي ممتاز", "حضور منتظم"], recommendations: ["استمر في التميز الأكاديمي"] },
    NORMAL: { score: 38, level: "NORMAL", reasons: ["أداء أكاديمي مقبول"], recommendations: ["متابعة دورية للحضور والدرجات"] },
    EARLY_RISK: { score: 62, level: "EARLY_RISK", reasons: ["غياب متوسط في بعض المواد", "أداء أقل من المتوقع"], recommendations: ["التواصل مع المرشد الأكاديمي", "الاهتمام بالحضور"] },
    PROBABLE_RISK: { score: 78, level: "PROBABLE_RISK", reasons: ["غياب مرتفع", "انخفاض في المعدل", "إنذارات أكاديمية"], recommendations: ["تدخل عاجل من المرشد الأكاديمي", "وضع خطة تحسين"] },
    HIGH_RISK: { score: 92, level: "HIGH_RISK", reasons: ["غياب شديد", "معدل منخفض جداً", "إنذارات متعددة", "خطر من الرسوب"], recommendations: ["تدخل فوري", "اجتماع عاجل مع المرشد", "مراجعة القسم الأكاديمي"] },
  };

  for (const [, { student }] of studentMap) {
    const riskData = riskLevelMap[student.riskCategory];
    const variance = (Math.random() - 0.5) * 10;
    const finalScore = Math.max(0, Math.min(100, Math.round(riskData.score + variance)));

    await prisma.riskScore.create({
      data: {
        studentId: student.id,
        score: finalScore,
        level: riskData.level,
        reasons: JSON.stringify(riskData.reasons),
        recommendations: JSON.stringify(riskData.recommendations),
        needsUrgentAction: riskData.level === "HIGH_RISK" || riskData.level === "PROBABLE_RISK",
        calculatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ─── Queue Tickets ────────────────────────────────────────
  const issueTypes = await prisma.issueType.findMany();
  const getIssueType = (unitId: string, name: string) =>
    issueTypes.find((it) => it.serviceUnitId === unitId && it.name.includes(name.split(" ")[0])) ?? issueTypes[0];

  // Get student IDs
  const student1 = studentMap.get("student1")!.student;
  const studentRisk = studentMap.get("student_risk")!.student;
  const s443130001 = studentMap.get("s443130001")!.student;
  const s443140001 = studentMap.get("s443140001")!.student;
  const s443150002 = studentMap.get("s443150002")!.student;
  const s443130002 = studentMap.get("s443130002")!.student;

  const regIssue = getIssueType(regUnit.id, "إضافة");
  const gradIssue = getIssueType(gradUnit.id, "متطلبات");
  const advIssue = getIssueType(advUnit.id, "انخفاض");
  const affIssue = getIssueType(affUnit.id, "غياب");

  await Promise.all([
    // Active tickets
    prisma.queueTicket.create({ data: { studentId: student1.id, serviceUnitId: regUnit.id, issueTypeId: regIssue.id, status: "WAITING", priorityScore: 55, locationType: "ONCAMPUS", notes: "أريد إضافة مادة هياكل البيانات", chatSummary: "الطالب يريد إضافة مادة CS201 لأنه لم يتمكن من التسجيل إلكترونياً" } }),
    prisma.queueTicket.create({ data: { studentId: studentRisk.id, serviceUnitId: gradUnit.id, issueTypeId: gradIssue.id, status: "WAITING", priorityScore: 95, locationType: "ONCAMPUS", notes: "أحتاج إنهاء متطلبات التخرج عاجل", chatSummary: "طالب خريج يحتاج إنهاء إجراءات التخرج في أقرب وقت" } }),
    prisma.queueTicket.create({ data: { studentId: s443130001.id, serviceUnitId: advUnit.id, issueTypeId: advIssue.id, status: "SERVING", priorityScore: 65, locationType: "ONCAMPUS", notes: "معدلي انخفض هذا الفصل", chatSummary: "الطالب يعاني من انخفاض في المعدل بسبب ضغوط دراسية" } }),
    prisma.queueTicket.create({ data: { studentId: s443140001.id, serviceUnitId: regUnit.id, issueTypeId: regIssue.id, status: "WAITING", priorityScore: 75, locationType: "OFFCAMPUS", notes: "شعبة المادة مغلقة", chatSummary: "الطالب خارج الحرم ويريد فتح شعبة مغلقة" } }),
    prisma.queueTicket.create({ data: { studentId: s443150002.id, serviceUnitId: gradUnit.id, issueTypeId: gradIssue.id, status: "WAITING", priorityScore: 90, locationType: "ONCAMPUS", notes: "متطلبات التخرج متأخرة", chatSummary: "طالبة خريجة متأخرة في استيفاء متطلبات التخرج" } }),
    // Resolved tickets
    prisma.queueTicket.create({ data: { studentId: student1.id, serviceUnitId: finUnit.id, issueTypeId: issueTypes.find(it => it.serviceUnitId === finUnit.id)!.id, status: "RESOLVED", priorityScore: 55, locationType: "ONCAMPUS", notes: "", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000) } }),
    prisma.queueTicket.create({ data: { studentId: s443130002.id, serviceUnitId: affUnit.id, issueTypeId: affIssue.id, status: "RESOLVED", priorityScore: 62, locationType: "ONCAMPUS", notes: "تقديم عذر غياب", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000) } }),
  ]);

  // ─── Knowledge Sources ────────────────────────────────────
  await prisma.knowledgeSource.createMany({
    data: [
      { title: "آلية إضافة وحذف المواد الدراسية", content: "يمكن للطالب إضافة وحذف المواد خلال فترة الإضافة والحذف المحددة في التقويم الأكاديمي. الإضافة تتم إلكترونياً عبر البوابة أو بتقديم طلب لمكتب التسجيل.", category: "تسجيل" },
      { title: "شروط التخرج والمتطلبات", content: "يجب على الطالب إكمال 132 ساعة معتمدة بحد أدنى معدل 2.0 من 5.0 لاستيفاء متطلبات التخرج. يجب تقديم طلب التخرج قبل بداية الفصل الأخير.", category: "تخرج" },
      { title: "نظام الغياب واللوائح الأكاديمية", content: "الطالب الذي تتجاوز نسبة غيابه 25% يُحرم من الاختبار ويحسب له رسوب بدرجة صفر. يحق للطالب تقديم أعذار موثقة.", category: "لوائح" },
      { title: "آلية الاعتراض على الدرجات", content: "يحق للطالب الاعتراض على درجاته خلال أسبوعين من إعلان النتائج. يُقدّم الاعتراض لأستاذ المادة ثم رئيس القسم.", category: "درجات" },
      { title: "الإرشاد الأكاديمي ودوره", content: "المرشد الأكاديمي يساعد الطالب في تخطيط مساره الدراسي واختيار المواد المناسبة وحل المشكلات الأكاديمية. التواصل مع المرشد ضروري خاصة عند ظهور أي مشكلة.", category: "إرشاد" },
      { title: "خدمات وحدة الدعم النفسي", content: "توفر الجامعة دعماً نفسياً واجتماعياً للطلاب الذين يمرون بضغوط أو صعوبات. الخدمة سرية ومجانية. يمكن التواصل مباشرة أو من خلال المرشد الأكاديمي.", category: "دعم" },
      { title: "آلية التدريب الصيفي الميداني", content: "التدريب الصيفي إلزامي لكثير من التخصصات. يُقدّم الطالب طلب التدريب قبل الفصل الصيفي. يجب أن تكون المنشأة معتمدة من قبل الجامعة.", category: "تدريب" },
      { title: "نظام الإنذارات الأكاديمية", content: "يُصدر الإنذار الأكاديمي عند انخفاض المعدل لأقل من 2.0. الإنذار الأول تحذيري، الثاني يستلزم تدخل المرشد، الثالث يُحال للجنة الشؤون الأكاديمية.", category: "لوائح" },
      { title: "المنح الدراسية والدعم المالي", content: "تقدم الجامعة منحاً للطلاب المتميزين والمحتاجين. شروط المنح متاحة في إدارة الشؤون المالية. يُقدّم الطلب في بداية كل فصل دراسي.", category: "مالية" },
      { title: "إجراءات تحويل التخصص", content: "يمكن تحويل التخصص بعد إتمام الفصل الأول وبموافقة الكلية. هناك شروط محددة لكل كلية. يُقدّم الطلب لمكتب الشؤون الأكاديمية.", category: "تحويل" },
      { title: "الخدمات الإلكترونية للطالب", content: "تتيح البوابة الإلكترونية التسجيل في المواد، مشاهدة الجداول والدرجات، دفع الرسوم، والتواصل مع الإدارة.", category: "تقنية" },
      { title: "آلية طلب الوثائق الرسمية", content: "يُقدّم طلب الوثيقة إلكترونياً أو في مكتب شؤون الطلاب. وثائق مثل بيان درجات أو شهادة قيد تستغرق 3-5 أيام عمل.", category: "وثائق" },
    ],
  });

  // ─── Priority Rules ───────────────────────────────────────
  await prisma.priorityRule.createMany({
    data: [
      { name: "الطلاب الخريجون", condition: "isGraduating === true", scoreAdjustment: 20, isActive: true, description: "يُمنح الطالب الخريج أولوية أعلى في الطابور" },
      { name: "خطر مرتفع", condition: "riskLevel === 'HIGH_RISK'", scoreAdjustment: 25, isActive: true, description: "الطلاب ذوو الخطر الأكاديمي المرتفع" },
      { name: "خطر محتمل", condition: "riskLevel === 'PROBABLE_RISK'", scoreAdjustment: 15, isActive: true, description: "الطلاب ذوو الخطر الأكاديمي المحتمل" },
      { name: "ثلاثة إنذارات أو أكثر", condition: "warningCount >= 3", scoreAdjustment: 10, isActive: true, description: "الطلاب الذين لديهم ثلاثة إنذارات أكاديمية أو أكثر" },
      { name: "داخل الحرم الجامعي", condition: "locationType === 'ONCAMPUS'", scoreAdjustment: 5, isActive: true, description: "الطالب حاضر فعلياً في الحرم الجامعي" },
      { name: "مشكلة ذات أولوية عالية", condition: "issueTypePriority === 'HIGH'", scoreAdjustment: 10, isActive: true, description: "نوع المشكلة يتطلب معالجة عاجلة" },
    ],
  });

  // ─── Report Templates ─────────────────────────────────────
  await prisma.reportTemplate.createMany({
    data: [
      { name: "تقرير متابعة الحالة الأكاديمية", type: "ACADEMIC_FOLLOWUP", content: "الطالب: {studentName}\nالرقم الجامعي: {studentNumber}\nالكلية: {college}\nالقسم: {department}\nالمعدل الحالي: {gpa}\n\nملاحظات المرشد:\n{notes}\n\nالإجراءات المتخذة:\n{actions}\n\nالخطوات المقترحة:\n{recommendations}", createdBy: adminUser.id },
      { name: "تقرير التدخل المبكر", type: "EARLY_INTERVENTION", content: "الطالب: {studentName}\nسبب التدخل: {riskReasons}\n\nالوضع الحالي:\n{currentStatus}\n\nالإجراءات العاجلة المطلوبة:\n{urgentActions}\n\nخطة المتابعة:\n{followupPlan}", createdBy: adminUser.id },
      { name: "تقرير أسباب الغياب", type: "ABSENCE_REPORT", content: "الطالب: {studentName}\nnسبة الغياب: {absenceRate}\nالمواد المتأثرة: {affectedCourses}\n\nأسباب الغياب (حسب إفادة الطالب):\n{absenceReasons}\n\nتوصية المرشد:\n{recommendation}", createdBy: adminUser.id },
      { name: "تقرير متابعة طالب خريج", type: "GRADUATE_FOLLOWUP", content: "الطالب الخريج: {studentName}\nالفصل الدراسي الأخير: {lastSemester}\nالمتطلبات المتبقية: {remainingRequirements}\n\nالخطوات الإجرائية:\n{steps}\n\nملاحظات:\n{notes}", createdBy: adminUser.id },
    ],
  });

  // ─── Audit Logs ───────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: adminUser.id, action: "SYSTEM_SEED", targetType: "SYSTEM", targetId: "system", details: JSON.stringify({ message: "تهيئة البيانات الأولية" }), isAutomated: true },
      { userId: adminUser.id, action: "RISK_SCORE_CALCULATED", targetType: "STUDENT", targetId: studentRisk.id, details: JSON.stringify({ score: 92, level: "HIGH_RISK" }), isAutomated: true },
      { userId: advisorUsers[0].id, action: "STUDENT_REVIEWED", targetType: "STUDENT", targetId: student1.id, details: JSON.stringify({ note: "مراجعة أكاديمية دورية" }), isAutomated: false },
    ],
  });

  // ─── Notifications ────────────────────────────────────────
  // Get advisor user IDs for notifications
  const adv0UserId = advisorUsers[0].id;
  const adv1UserId = advisorUsers[1].id;

  await prisma.notification.createMany({
    data: [
      { userId: adv0UserId, type: "RISK_ALERT", title: "تنبيه: طالب في خطر مرتفع", body: "الطالب وليد الحربي وصل لمستوى خطر مرتفع - يرجى المتابعة العاجلة", isRead: false, relatedEntityType: "STUDENT", relatedEntityId: studentRisk.id },
      { userId: adv1UserId, type: "RISK_ALERT", title: "تنبيه: طالبة في خطر مرتفع", body: "الطالبة منى البيشي تحتاج متابعة عاجلة لاستيفاء متطلبات التخرج", isRead: false, relatedEntityType: "STUDENT", relatedEntityId: s443150002.id },
    ],
  });

  // Get student user IDs for notifications
  const student1User = await prisma.user.findUnique({ where: { username: "student1" } });
  const studentRiskUser = await prisma.user.findUnique({ where: { username: "student_risk" } });

  if (student1User && studentRiskUser) {
    await prisma.notification.createMany({
      data: [
        { userId: student1User.id, type: "TICKET_STATUS_CHANGE", title: "تم استلام طلبك", body: "طلبك في مكتب التسجيل قيد المعالجة - أنت في الطابور", isRead: false },
        { userId: studentRiskUser.id, type: "QUEUE_TURN", title: "اقترب دورك!", body: "أنت الثالث في طابور إدارة الخريجين - يرجى الاستعداد", isRead: false },
      ],
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log(`📊 Created: ${studentProfiles.length} students, 5 colleges, 12 departments, 8 service units`);
  console.log("🔑 Demo accounts: admin/advisor1/advisor2/advisor3/advisor4/staff1-8/student1/student_risk");
  console.log("🔒 Password for all accounts: password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
