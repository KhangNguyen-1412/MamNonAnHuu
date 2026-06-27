import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './firebase';
import { getStaffList, updateStaff, Staff } from './hrService';
import { getStudents } from './studentService';

/* --- TYPES & INTERFACES --- */

export interface ClassData {
  id: string;
  name: string;
  grade: number;
  academicYear: string;
  status: string;
  topic: string;
  room: string;
  teacher: string;
  capacity: number;
  currentCount: number;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  head: string;
  deputyHead?: string;
  staffCount: number;
  status: 'Hoạt Động' | 'Ngừng Hoạt Động';
  logo?: string;
  type?: 'Tổ khối lớp'; // Mầm non chỉ có tổ khối lớp
  applicableGrades?: string[];
}

export interface Subject {
  id: string;
  name: string;
  type: 'Lĩnh vực' | 'Năng khiếu' | 'Hoạt động' | 'Bắt buộc' | 'Chuyên biệt' | 'Trải nghiệm'; // MN dùng 3 loại đầu
  hoursPerWeek: number;
  status: 'Đang Giảng Dạy' | 'Ngưng Giảng Dạy';
  applicableClasses?: string[];
  hoursPerGrade?: Record<string, number>;
}



export interface Room {
  id: string;
  building: string;
  name: string;
  type: string;
  capacity: number;
  status: 'Đang Sử Dụng' | 'Bảo Trì Định Kỳ' | 'Ngừng Sử Dụng';
  block?: 'sinh_hoat_chung' | 'phuc_vu_hoc_tap' | 'to_chuc_an' | 'hanh_chinh_ho_tro';
  assignedClassId?: string;
  hasRestroom?: boolean;
  hasPlayground?: boolean;
  functionType?: string;
  kitchenZone?: string;
  adminType?: string;
  bookings?: RoomBooking[];
}

export interface RoomBooking {
  id: string;
  classId: string;
  date: string;
  timeSlot: string;
  purpose: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'Tốt' | 'Hư Hỏng' | 'Mới Nhập' | 'Ngưng Sử Dụng';
}

export interface Maintenance {
  id: string;
  detail: string;
  location: string;
  severity: 'Nghiêm Trọng' | 'Trung Bình' | 'Thấp';
  status: 'Chờ Xếp Lịch' | 'Đang Sửa Chữa' | 'Đã Hoàn Thành' | 'Hủy Bỏ';
}

export interface CurriculumPlan {
  id: string;
  grade: string;
  subject: string;
  intensity: number;
  total: number;
  status: 'Bản Nháp' | 'Chờ Duyệt' | 'Đã Phê Duyệt' | 'Từ Chối';
  lastComment?: string;
  approver?: string;
}

export interface DocumentAttachment {
  name: string;
  size: string;
  type: string;
}

export interface RevisionLog {
  date: string;
  author: string;
  action: string;
}

export interface ComplexDocument {
  id: string;
  title: string;
  category: 'party' | 'tradeUnion' | 'parents';
  date: string;
  author: string;
  content: string;
  status: 'Bản Nháp' | 'Đại diện Ký' | 'Đã Ban Hành';
  attachments: DocumentAttachment[];
  signer: string;
  views: number;
  revisions: RevisionLog[];
}

export interface InboundReceipt {
  id: string;
  date: string;
  supplier: string;
  category: string;
  items: string;
  sensoryInspection: string;
  inspector: string;
  status: string;
  voidReason?: string;
  certExpiry: string;
}

export interface AdminDocument {
  id: string;
  symbol: string;
  issueDate: string;
  trichYeu: string;
  issuingBody: string;
  docType: string;
  urgency: string;
  security: string;
  status: string;
  voidReason?: string;
}

/* --- NEW INTERFACES FOR PHASE 2 --- */

export interface HealthRecord {
  id: string;
  name: string;
  class: string;
  height: number;
  weight: number;
  bmi: number;
  bg: string;
  eyes: string;
  history: string;
  allergy: string;
  insurance: string;
  insStatus: string;
}

export interface HealthInventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  expDate: string;
  status: string;
}

export interface HealthIncident {
  id: string;
  date: string;
  patient: string;
  idCode: string;
  class: string;
  bg: string;
  reason: string;
  temp: number;
  bp: string;
  treatment: string;
  outcome: string;
  staff: string;
  status: string;
  parentNotified: boolean;
  parentNote: string;
}

export interface TuitionReceipt {
  id: string;
  name: string;
  className: string;
  amount: number;
  status: 'Đã Nộp' | 'Chờ Duyệt KH' | 'Chưa Nộp' | 'Đã Hủy';
  voidReason?: string;
  date: string;
  cashier?: string;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  title: string;
  amount: number;
  type: 'Phiếu Thu' | 'Phiếu Chi' | 'Đã Hủy';
  voidReason?: string;
}

export interface CounselingAppointment {
  id: string;
  name: string;
  class: string;
  topic: string;
  level: string;
  time: string;
  method: string;
  status: string;
}

export interface Major {
  code: string;
  name: string;
  combine: string;
  method: string;
  score: number;
}

export interface UniversityMajors {
  id: string;
  name: string;
  url: string;
  majors: Major[];
}

export interface YouthUnionMember {
  id: string;
  name: string;
  class: string;
  dob: string;
  date: string;
  role: string;
  status: string;
}

export interface YouthUnionCampaign {
  id: string;
  name: string;
  type: string;
  time: string;
  status: string;
  scale: string;
  hours: number;
}

export interface YouthUnionEmulation {
  id: string;
  name: string;
  diem: number;
  status: string;
  week?: number;
  baseScore?: number;
  violations?: { type: string; count: number; points: number }[];
  rewards?: { type: string; count: number; points: number }[];
  grader?: string;
  date?: string;
  rank?: string;
}

export interface TeacherAssignment {
  id: string;
  name: string;
  dept: string;
  role: string;
  quota: number;
  assigned: number;
  classes: string[];
}

export interface TimetableSlot {
  id: string;
  classId: string;
  day: number;
  period: number;           // Giữ lại để backward-compat với logic cũ
  timeBlock?: string;       // Khung giờ: '07:00-08:00', '08:30-09:15'
  blockName?: string;       // Tên khung: 'Đón trẻ', 'Hoạt động học'
  subject: string;
  teacher: string;
  semester?: number;        // 1 hoặc 2
  room?: string;
}

export interface ExamSlot {
  id: string;
  semester: number;
  classId: string;
  day: number;
  session: 'Sáng' | 'Chiều';
  subject: string;          // Lĩnh vực / chủ đề đánh giá
  room: string;
  examiner: string;         // Giáo viên đánh giá
  candidates?: string[];
  assessmentType?: 'Cuối chủ đề' | 'Cuối giai đoạn' | 'Cuối năm'; // Loại đánh giá MN
}

export interface QAInspection {
  id: string;
  plan: string;
  time: string;
  target: string;
  team: string;
  observation: string;
  records: string;
}

export interface QAEvidence {
  id: string;
  standard: string;
  criteria: string;
  code: string;
  name: string;
  issuer: string;
  date: string;
  location: string;
  status: string;
}

export interface ExamPlan {
  id: string;
  name: string;
  time: string;
  scope: string;
  form: string;
  progress: number;
}

export interface Meal {
  id: string;
  date: string;
  meal: string;
  items: string;
  sampleStatus: string;
  qty: number;
}

export interface BoardingRoom {
  id: string;
  name: string;
  capacity: number;
  current: number;
  supervisor: string;
  present: number;
  absent: number;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  certStatus: string;
  expDate: string;
}

export interface Schedule {
  id: string;
  time: string;
  title: string;
  leader: string;
  location: string;
  status: string;
}

export interface StorageItem {
  id: string;
  name: string;
  type: string;
  date: string;
  access: string;
}

export interface YouthUnionStat {
  id: string;
  data: any[];
}

/* --- DEFAULT DATASETS (FALLBACKS & SEEDS) --- */

export const DEFAULT_CLASSES: ClassData[] = [];
export const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: 'T001',
    name: 'Tổ Khối Nhà Trẻ',
    description: 'Chăm sóc và giáo dục trẻ từ 12 đến 36 tháng tuổi',
    head: 'Cô Lê Thị Thảo',
    staffCount: 3,
    status: 'Hoạt Động',
    logo: 'school',
    applicableGrades: ['Nhà trẻ']
  },
  {
    id: 'T002',
    name: 'Tổ Khối Mầm',
    description: 'Chăm sóc và giáo dục trẻ 3 tuổi (Mầm)',
    head: 'Cô Nguyễn Thị Hoa',
    staffCount: 3,
    status: 'Hoạt Động',
    logo: 'school',
    applicableGrades: ['Mầm']
  },
  {
    id: 'T003',
    name: 'Tổ Khối Chồi',
    description: 'Chăm sóc và giáo dục trẻ 4 tuổi (Chồi)',
    head: 'Cô Hoàng Thị Hương',
    staffCount: 3,
    status: 'Hoạt Động',
    logo: 'school',
    applicableGrades: ['Chồi']
  },
  {
    id: 'T004',
    name: 'Tổ Khối Lá',
    description: 'Chăm sóc và giáo dục trẻ 5 tuổi (Lá)',
    head: 'Cô Trần Thị Hồng',
    staffCount: 3,
    status: 'Hoạt Động',
    logo: 'school',
    applicableGrades: ['Lá']
  }
];
export const DEFAULT_SUBJECTS: Subject[] = [];
export const DEFAULT_ROOMS: Room[] = [
  { id: 'Room-101', building: 'Dãy nhà A', name: 'Phòng 101', type: 'Phòng sinh hoạt chung', capacity: 25, status: 'Đang Sử Dụng', block: 'sinh_hoat_chung', assignedClassId: 'Nhà trẻ 1', hasRestroom: true, hasPlayground: true },
  { id: 'Room-102', building: 'Dãy nhà A', name: 'Phòng 102', type: 'Phòng sinh hoạt chung', capacity: 30, status: 'Đang Sử Dụng', block: 'sinh_hoat_chung', assignedClassId: 'Mầm 1', hasRestroom: true, hasPlayground: true },
  { id: 'Room-103', building: 'Dãy nhà A', name: 'Phòng 103', type: 'Phòng sinh hoạt chung', capacity: 35, status: 'Đang Sử Dụng', block: 'sinh_hoat_chung', assignedClassId: 'Chồi 1', hasRestroom: true, hasPlayground: true },
  { id: 'Room-104', building: 'Dãy nhà B', name: 'Phòng 104', type: 'Phòng sinh hoạt chung', capacity: 35, status: 'Đang Sử Dụng', block: 'sinh_hoat_chung', assignedClassId: 'Lá 1', hasRestroom: true, hasPlayground: true },
  { id: 'Room-GYM', building: 'Dãy nhà B', name: 'Phòng Thể chất (Gym/Aerobic)', type: 'Phòng Chức năng', capacity: 40, status: 'Đang Sử Dụng', block: 'phuc_vu_hoc_tap', functionType: 'Phòng Giáo dục Thể chất (Gym/Aerobic)', bookings: [] },
  { id: 'Room-MUSIC', building: 'Dãy nhà B', name: 'Phòng Nghệ thuật / Âm nhạc', type: 'Phòng Chức năng', capacity: 35, status: 'Đang Sử Dụng', block: 'phuc_vu_hoc_tap', functionType: 'Phòng Nghệ thuật / Âm nhạc', bookings: [] },
  { id: 'Room-LAB', building: 'Dãy nhà B', name: 'Phòng Ngoại ngữ / Tin học', type: 'Phòng Chức năng', capacity: 30, status: 'Đang Sử Dụng', block: 'phuc_vu_hoc_tap', functionType: 'Phòng Ngoại ngữ / Tin học', bookings: [] },
  { id: 'Room-HALL', building: 'Khối Đa Năng', name: 'Phòng Đa năng (Hội trường)', type: 'Phòng Chức năng', capacity: 100, status: 'Đang Sử Dụng', block: 'phuc_vu_hoc_tap', functionType: 'Phòng Đa năng (Hội trường lớn)', bookings: [] },
  { id: 'Room-KITCHEN', building: 'Khu Bếp Bán Trú', name: 'Nhà bếp một chiều', type: 'Khu vực Bếp', capacity: 10, status: 'Đang Sử Dụng', block: 'to_chuc_an', kitchenZone: 'Khu chế biến' },
  { id: 'Room-DRYSTORE', building: 'Khu Bếp Bán Trú', name: 'Kho thực phẩm khô', type: 'Khu vực Bếp', capacity: 5, status: 'Đang Sử Dụng', block: 'to_chuc_an', kitchenZone: 'Kho thực phẩm khô' },
  { id: 'Room-COLDSTORE', building: 'Khu Bếp Bán Trú', name: 'Kho thực phẩm lạnh', type: 'Khu vực Bếp', capacity: 5, status: 'Đang Sử Dụng', block: 'to_chuc_an', kitchenZone: 'Kho thực phẩm lạnh' },
  { id: 'Room-HEALTH', building: 'Dãy nhà A', name: 'Phòng Y tế học đường', type: 'Hành chính & Hỗ trợ', capacity: 10, status: 'Đang Sử Dụng', block: 'hanh_chinh_ho_tro', adminType: 'Phòng Y tế' },
  { id: 'Room-MEETING', building: 'Dãy nhà A', name: 'Phòng họp Ban Giám Hiệu', type: 'Hành chính & Hỗ trợ', capacity: 20, status: 'Đang Sử Dụng', block: 'hanh_chinh_ho_tro', adminType: 'Phòng BGH & Họp chuyên môn' },
  { id: 'Room-SECURITY', building: 'Cổng Trường', name: 'Phòng Bảo vệ & Lễ tân', type: 'Hành chính & Hỗ trợ', capacity: 5, status: 'Đang Sử Dụng', block: 'hanh_chinh_ho_tro', adminType: 'Phòng Bảo vệ & Lễ tân' }
];
export const DEFAULT_EQUIPMENTS: Equipment[] = [];
export const DEFAULT_MAINTENANCES: Maintenance[] = [];
export const DEFAULT_PLANS: CurriculumPlan[] = [];
export const DEFAULT_UNION_DOCS: ComplexDocument[] = [];
export const DEFAULT_INBOUND_RECEIPTS: InboundReceipt[] = [];
export const DEFAULT_ADMIN_DOCUMENTS: AdminDocument[] = [];

/* --- GENERIC FIRESTORE HELPERS --- */

async function getCollectionData<T>(collName: string, defaultData: T[], seedFunc: () => Promise<void>): Promise<T[]> {
  const localKey = `firestore_fallback_${collName}`;
  const seededKey = `firestore_seeded_${collName}`;
  if (!auth.currentUser) {
    return [];
  }
  try {
    const querySnapshot = await getDocs(collection(db, collName));
    const list: T[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as T);
    });

    if (list.length === 0 && defaultData.length > 0) {
      const isAlreadySeeded = localStorage.getItem(seededKey) === 'true';
      if (!isAlreadySeeded) {
        try {
          await seedFunc();
          localStorage.setItem(seededKey, 'true');
        } catch (seedErr) {
          console.warn(`Seeding Firestore failed for ${collName}, falling back to localStorage seed:`, seedErr);
        }
        const refSnapshot = await getDocs(collection(db, collName));
        const refList: T[] = [];
        refSnapshot.forEach((docSnap) => {
          refList.push(docSnap.data() as T);
        });
        if (refList.length > 0) {
          localStorage.setItem(localKey, JSON.stringify(refList));
          return refList;
        }
      } else {
        localStorage.setItem(localKey, JSON.stringify([]));
        return [];
      }
    } else if (list.length > 0) {
      localStorage.setItem(seededKey, 'true');
      localStorage.setItem(localKey, JSON.stringify(list));
      return list;
    } else if (list.length === 0 && defaultData.length === 0) {
      localStorage.setItem(localKey, JSON.stringify([]));
      return [];
    }
  } catch (error) {
    console.warn(`Firestore list error for ${collName}, using localStorage fallback.`, error);
  }

  // Fallback to localStorage
  const cached = localStorage.getItem(localKey);
  if (cached) {
    try {
      return JSON.parse(cached) as T[];
    } catch (e) {
      console.error(`Failed to parse localStorage cache for ${collName}:`, e);
    }
  }
  
  // Initialize with defaultData if no cached data exists
  try {
    localStorage.setItem(localKey, JSON.stringify(defaultData));
  } catch (e) {
    console.error(`Failed to initialize localStorage fallback for ${collName}:`, e);
  }
  return defaultData;
}

async function saveDocument<T extends { id: string }>(collName: string, docData: T): Promise<void> {
  const localKey = `firestore_fallback_${collName}`;
  if (auth.currentUser) {
    try {
      await setDoc(doc(db, collName, docData.id), docData);
    } catch (error) {
      console.warn(`Firestore save error for ${collName}/${docData.id}, updating localStorage fallback.`, error);
    }
  }
  
  // Update localStorage fallback
  try {
    const cached = localStorage.getItem(localKey);
    let list: T[] = cached ? JSON.parse(cached) : [];
    if (!Array.isArray(list)) list = [];
    const idx = list.findIndex(item => item.id === docData.id);
    if (idx >= 0) {
      list[idx] = docData;
    } else {
      list.push(docData);
    }
    localStorage.setItem(localKey, JSON.stringify(list));
  } catch (e) {
    console.error(`Failed to update localStorage for saveDocument on ${collName}:`, e);
  }
}

async function deleteDocument(collName: string, id: string): Promise<void> {
  const localKey = `firestore_fallback_${collName}`;
  if (auth.currentUser) {
    try {
      await deleteDoc(doc(db, collName, id));
    } catch (error) {
      console.warn(`Firestore delete error for ${collName}/${id}, updating localStorage fallback.`, error);
    }
  }
  
  // Update localStorage fallback
  try {
    const cached = localStorage.getItem(localKey);
    if (cached) {
      let list = JSON.parse(cached);
      if (Array.isArray(list)) {
        list = list.filter((item: any) => item.id !== id);
        localStorage.setItem(localKey, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.error(`Failed to update localStorage for deleteDocument on ${collName}:`, e);
  }
}

/* --- SERVICE INTERFACE IMPLEMENTATIONS --- */

// Classes CRUD
export async function getClasses(): Promise<ClassData[]> {
  const list = await getCollectionData<ClassData>('classes', DEFAULT_CLASSES, seedClasses);
  return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}
export async function saveClass(classData: ClassData): Promise<void> {
  await saveDocument<ClassData>('classes', classData);
  await syncAllStaffRoles();
}
export async function saveClassOnly(classData: ClassData): Promise<void> {
  await saveDocument<ClassData>('classes', classData);
}
export async function deleteClass(id: string): Promise<void> {
  await deleteDocument('classes', id);
  await syncAllStaffRoles();
}
export async function seedClasses(): Promise<void> {
  for (const item of DEFAULT_CLASSES) {
    await setDoc(doc(db, 'classes', item.id), item);
  }
}

// Departments CRUD
export async function getDepartments(): Promise<Department[]> {
  return getCollectionData<Department>('departments', DEFAULT_DEPARTMENTS, seedDepartments);
}
export async function saveDepartment(dept: Department): Promise<void> {
  await saveDocument<Department>('departments', dept);
  await syncAllStaffRoles();
}
export async function deleteDepartment(id: string): Promise<void> {
  await deleteDocument('departments', id);
  await syncAllStaffRoles();
}

export async function syncAllStaffRoles(): Promise<void> {
  try {
    const staffList = await getStaffList();
    const classes = await getClasses();
    const departments = await getDepartments();

    // Map class name to teacher name
    const classTeacherMap = new Map<string, string>();
    classes.forEach(c => {
      if (c.teacher) {
        classTeacherMap.set(c.name, c.teacher);
      }
    });

    // Two-way sync: if staff has assignedClass (e.g. from creation/edit/import),
    // make sure the corresponding class document in Firestore is updated with this staff as the teacher.
    // Xử lý xung đột thông tin GVCN thông minh:
    for (const c of classes) {
      const claimants = staffList.filter(s => s.assignedClass === c.name);
      if (claimants.length > 1) {
        // Nhiều giáo viên cùng nhận lớp này -> Có sự thay đổi từ Personnel Modal.
        // Giáo viên mới gán (không trùng với GVCN hiện tại trong DB) sẽ thắng.
        const newClaimant = claimants.find(s => s.name !== c.teacher);
        if (newClaimant) {
          c.teacher = newClaimant.name;
          await saveDocument<ClassData>('classes', c);
          classTeacherMap.set(c.name, newClaimant.name);
        }
      }
      // Nếu chỉ có 1 giáo viên nhận lớp này (claimants.length === 1) nhưng giáo viên đó khác c.teacher,
      // điều đó có nghĩa là c.teacher vừa được cập nhật từ Class Modal (GV cũ vẫn còn giữ assignedClass trong DB).
      // Trong trường hợp này, Class record thắng. Chúng ta không ghi đè c.teacher ở đây.
      // Vòng lặp thứ hai phía dưới sẽ tự động xóa assignedClass của GV cũ và cập nhật cho GV mới.
    }

    // Now, update staff roles and assignedClass values in DB
    for (const staff of staffList) {
      const isHeadOf = departments.find(d => d.head === staff.name);
      const isDeputyOf = departments.find(d => d.deputyHead === staff.name);
      
      let assignedClassName = '';
      for (const [clsName, tName] of classTeacherMap.entries()) {
        if (tName === staff.name) {
          assignedClassName = clsName;
          break;
        }
      }

      let targetRole = staff.role || '';
      let targetClass = assignedClassName || '';

      const jobRoleClean = (staff.jobRole || '').toLowerCase().trim();
      if (jobRoleClean === 'giáo viên bộ môn' || jobRoleClean.includes('giáo viên')) {
        if (isHeadOf) {
          targetRole = 'Tổ trưởng chuyên môn';
          targetClass = '';
        } else if (isDeputyOf) {
          targetRole = 'Tổ phó chuyên môn';
          targetClass = '';
        } else if (assignedClassName) {
          targetRole = `Chủ nhiệm ${assignedClassName}`;
          targetClass = assignedClassName;
        } else {
          targetRole = 'Giáo viên bộ môn';
          targetClass = '';
        }
      } else {
        // Non-teaching or BGH roles: retain their selected role, but clear any assignedClass since they cannot be advisors
        targetClass = '';
      }

      if (targetRole !== staff.role || targetClass !== staff.assignedClass) {
        await updateStaff(staff.id, {
          role: targetRole,
          assignedClass: targetClass
        });
      }
    }
  } catch (err) {
    console.error("Failed to sync staff roles:", err);
  }
}
export async function seedDepartments(): Promise<void> {
  for (const item of DEFAULT_DEPARTMENTS) {
    await setDoc(doc(db, 'departments', item.id), item);
  }
}

// Subjects CRUD
export async function getSubjects(): Promise<Subject[]> {
  return getCollectionData<Subject>('subjects', DEFAULT_SUBJECTS, seedSubjects);
}
export async function saveSubject(sub: Subject): Promise<void> {
  return saveDocument<Subject>('subjects', sub);
}
export async function deleteSubject(id: string): Promise<void> {
  return deleteDocument('subjects', id);
}
export async function seedSubjects(): Promise<void> {
  for (const item of DEFAULT_SUBJECTS) {
    await setDoc(doc(db, 'subjects', item.id), item);
  }
}



// Rooms CRUD
export async function getRooms(): Promise<Room[]> {
  return getCollectionData<Room>('rooms', DEFAULT_ROOMS, seedRooms);
}
export async function saveRoom(room: Room): Promise<void> {
  return saveDocument<Room>('rooms', room);
}
export async function deleteRoom(id: string): Promise<void> {
  return deleteDocument('rooms', id);
}
export async function seedRooms(): Promise<void> {
  const existingRoomsSnapshot = await getDocs(collection(db, 'rooms'));
  for (const docSnap of existingRoomsSnapshot.docs) {
    await deleteDoc(docSnap.ref);
  }
  for (const item of DEFAULT_ROOMS) {
    await setDoc(doc(db, 'rooms', item.id), item);
  }
}

// Equipments CRUD
export async function getEquipments(): Promise<Equipment[]> {
  return getCollectionData<Equipment>('equipments', DEFAULT_EQUIPMENTS, seedEquipments);
}
export async function saveEquipment(eq: Equipment): Promise<void> {
  return saveDocument<Equipment>('equipments', eq);
}
export async function deleteEquipment(id: string): Promise<void> {
  return deleteDocument('equipments', id);
}
export async function seedEquipments(): Promise<void> {
  const existing = await getDocs(collection(db, 'equipments'));
  for (const docSnap of existing.docs) {
    await deleteDoc(docSnap.ref);
  }
  for (const item of DEFAULT_EQUIPMENTS) {
    await setDoc(doc(db, 'equipments', item.id), item);
  }
}

// Maintenances CRUD
export async function getMaintenances(): Promise<Maintenance[]> {
  return getCollectionData<Maintenance>('maintenances', DEFAULT_MAINTENANCES, seedMaintenances);
}
export async function saveMaintenance(maint: Maintenance): Promise<void> {
  return saveDocument<Maintenance>('maintenances', maint);
}
export async function deleteMaintenance(id: string): Promise<void> {
  return deleteDocument('maintenances', id);
}
export async function seedMaintenances(): Promise<void> {
  const existing = await getDocs(collection(db, 'maintenances'));
  for (const docSnap of existing.docs) {
    await deleteDoc(docSnap.ref);
  }
  for (const item of DEFAULT_MAINTENANCES) {
    await setDoc(doc(db, 'maintenances', item.id), item);
  }
}

// Curriculum plans CRUD
export async function getPlans(): Promise<CurriculumPlan[]> {
  return getCollectionData<CurriculumPlan>('plans', DEFAULT_PLANS, seedPlans);
}
export async function savePlan(plan: CurriculumPlan): Promise<void> {
  return saveDocument<CurriculumPlan>('plans', plan);
}
export async function deletePlan(id: string): Promise<void> {
  return deleteDocument('plans', id);
}
export async function seedPlans(): Promise<void> {
  for (const item of DEFAULT_PLANS) {
    await setDoc(doc(db, 'plans', item.id), item);
  }
}

// Party Union Documents CRUD
export async function getPartyUnionDocs(): Promise<ComplexDocument[]> {
  return getCollectionData<ComplexDocument>('partyUnionDocs', DEFAULT_UNION_DOCS, seedPartyUnionDocs);
}
export async function savePartyUnionDoc(docData: ComplexDocument): Promise<void> {
  return saveDocument<ComplexDocument>('partyUnionDocs', docData);
}
export async function deletePartyUnionDoc(id: string): Promise<void> {
  return deleteDocument('partyUnionDocs', id);
}
export async function seedPartyUnionDocs(): Promise<void> {
  for (const item of DEFAULT_UNION_DOCS) {
    await setDoc(doc(db, 'partyUnionDocs', item.id), item);
  }
}

// Inbound Receipts CRUD
export async function getInboundReceipts(): Promise<InboundReceipt[]> {
  return getCollectionData<InboundReceipt>('inboundReceipts', DEFAULT_INBOUND_RECEIPTS, seedInboundReceipts);
}
export async function saveInboundReceipt(receipt: InboundReceipt): Promise<void> {
  return saveDocument<InboundReceipt>('inboundReceipts', receipt);
}
export async function deleteInboundReceipt(id: string): Promise<void> {
  return deleteDocument('inboundReceipts', id);
}
export async function seedInboundReceipts(): Promise<void> {
  for (const item of DEFAULT_INBOUND_RECEIPTS) {
    await setDoc(doc(db, 'inboundReceipts', item.id), item);
  }
}

// Admin Documents CRUD
export async function getAdminDocuments(): Promise<AdminDocument[]> {
  return getCollectionData<AdminDocument>('adminDocuments', DEFAULT_ADMIN_DOCUMENTS, seedAdminDocuments);
}
export async function saveAdminDocument(docData: AdminDocument): Promise<void> {
  return saveDocument<AdminDocument>('adminDocuments', docData);
}
export async function deleteAdminDocument(id: string): Promise<void> {
  return deleteDocument('adminDocuments', id);
}
export async function seedAdminDocuments(): Promise<void> {
  for (const item of DEFAULT_ADMIN_DOCUMENTS) {
    await setDoc(doc(db, 'adminDocuments', item.id), item);
  }
}

/* --- NEW DEFAULT DATASETS (PHASE 2) --- */

export const DEFAULT_HEALTH_RECORDS: HealthRecord[] = [
  {
    id: 'HS-21-0001',
    name: 'Nguyễn Hoàng Nam',
    class: '1A1',
    height: 118,
    weight: 22,
    bmi: 15.8,
    bg: 'O+',
    eyes: 'Mắt trái: 10/10, Mắt phải: 10/10',
    history: 'Bình thường',
    allergy: 'Không',
    insurance: 'GD4790019283',
    insStatus: 'Còn hạn'
  },
  {
    id: 'HS-21-0002',
    name: 'Lê Thảo Vy',
    class: '1A1',
    height: 112,
    weight: 17,
    bmi: 13.6,
    bg: 'A+',
    eyes: 'Cận thị nhẹ: T -0.5, P -0.75',
    history: 'Hen suyễn nhẹ',
    allergy: 'Dị ứng phấn hoa',
    insurance: 'GD4790019284',
    insStatus: 'Còn hạn'
  },
  {
    id: 'HS-21-0003',
    name: 'Trần Quốc Bảo',
    class: '1A2',
    height: 116,
    weight: 24,
    bmi: 17.8,
    bg: 'B+',
    eyes: 'Mắt trái: 9/10, Mắt phải: 10/10',
    history: 'Tim bẩm sinh (đã phẫu thuật)',
    allergy: 'Dị ứng kháng sinh Penicillin',
    insurance: 'GD4790019285',
    insStatus: 'Còn hạn'
  },
  {
    id: 'HS-21-0004',
    name: 'Phạm Minh Kha',
    class: '5A1',
    height: 142,
    weight: 45,
    bmi: 22.3,
    bg: 'O+',
    eyes: 'Cận thị: T -2.0, P -2.5',
    history: 'Bình thường',
    allergy: 'Dị ứng hải sản',
    insurance: 'GD4790019286',
    insStatus: 'Còn hạn'
  },
  {
    id: 'HS-21-0005',
    name: 'Vũ Hoàng Bách',
    class: '5A1',
    height: 145,
    weight: 32,
    bmi: 15.2,
    bg: 'AB+',
    eyes: 'Mắt trái: 10/10, Mắt phải: 10/10',
    history: 'Động kinh (đang uống thuốc kiểm soát)',
    allergy: 'Không',
    insurance: 'GD4790019287',
    insStatus: 'Hết hạn'
  },
  {
    id: 'HS-21-0006',
    name: 'Hoàng Thùy Chi',
    class: '5A1',
    height: 138,
    weight: 28,
    bmi: 14.7,
    bg: 'O+',
    eyes: 'Mắt trái: 10/10, Mắt phải: 8/10',
    history: 'Bình thường',
    allergy: 'Dị ứng đậu phộng',
    insurance: 'GD4790019288',
    insStatus: 'Còn hạn'
  },
  {
    id: 'HS-21-0007',
    name: 'Đỗ Anh Tuấn',
    class: '10C2',
    height: 168,
    weight: 54,
    bmi: 19.1,
    bg: 'A+',
    eyes: 'Cận thị nặng: T -4.5, P -4.0',
    history: 'Bình thường',
    allergy: 'Không',
    insurance: 'GD4790019289',
    insStatus: 'Còn hạn'
  },
  {
    id: 'HS-21-0008',
    name: 'Phan Thị Mai',
    class: '11B3',
    height: 158,
    weight: 42,
    bmi: 16.8,
    bg: 'B+',
    eyes: 'Mắt trái: 10/10, Mắt phải: 10/10',
    history: 'Bình thường',
    allergy: 'Không',
    insurance: 'GD4790019290',
    insStatus: 'Còn hạn'
  }
];

export const DEFAULT_HEALTH_INVENTORY: HealthInventoryItem[] = [
  {
    id: 'MED-001',
    name: 'Paracetamol 250mg (Hạ sốt trẻ em)',
    category: 'Thuốc hạ sốt',
    unit: 'Hộp',
    stock: 15,
    minStock: 5,
    expDate: '15/10/2027',
    status: 'Bình thường'
  },
  {
    id: 'MED-002',
    name: 'Paracetamol 500mg (Hạ sốt người lớn)',
    category: 'Thuốc hạ sốt',
    unit: 'Hộp',
    stock: 2,
    minStock: 5,
    expDate: '01/09/2026',
    status: 'Sắp hết'
  },
  {
    id: 'MED-003',
    name: 'Berberin 50mg (Tiêu hóa)',
    category: 'Thuốc tiêu hóa',
    unit: 'Lọ',
    stock: 20,
    minStock: 8,
    expDate: '12/12/2027',
    status: 'Bình thường'
  },
  {
    id: 'MED-004',
    name: 'Smecta (Thuốc tiêu chảy)',
    category: 'Thuốc tiêu hóa',
    unit: 'Hộp',
    stock: 8,
    minStock: 10,
    expDate: '20/07/2026',
    status: 'Sắp hết'
  },
  {
    id: 'MED-005',
    name: 'Salbutamol Xịt (Cắt cơn hen)',
    category: 'Thuốc đặc trị',
    unit: 'Chai',
    stock: 5,
    minStock: 2,
    expDate: '10/06/2026',
    status: 'Sắp hết hạn'
  },
  {
    id: 'MED-006',
    name: 'Băng cá nhân Urgo',
    category: 'Dụng cụ sơ cứu',
    unit: 'Hộp',
    stock: 45,
    minStock: 10,
    expDate: '30/12/2028',
    status: 'Bình thường'
  },
  {
    id: 'MED-007',
    name: 'Cồn đỏ sát trùng Povidine 10%',
    category: 'Dụng cụ sơ cứu',
    unit: 'Chai',
    stock: 3,
    minStock: 5,
    expDate: '10/01/2027',
    status: 'Sắp hết'
  },
  {
    id: 'MED-008',
    name: 'Bông y tế vô trùng',
    category: 'Dụng cụ sơ cứu',
    unit: 'Cuộn',
    stock: 12,
    minStock: 5,
    expDate: '15/05/2029',
    status: 'Bình thường'
  },
  {
    id: 'MED-009',
    name: 'Nước muối sinh lý NaCl 0.9%',
    category: 'Dung dịch rửa',
    unit: 'Lốc',
    stock: 25,
    minStock: 10,
    expDate: '05/03/2027',
    status: 'Bình thường'
  }
];

export const DEFAULT_HEALTH_INCIDENTS: HealthIncident[] = [
  {
    id: 'INC-1001',
    date: '26/06/2026 • 08:15',
    patient: 'Nguyễn Hoàng Nam',
    idCode: 'HS-21-0001',
    class: '1A1',
    bg: 'O+',
    reason: 'Ngã trầy xước gối phải khi chơi đu quay',
    temp: 37.0,
    bp: '110/70',
    treatment: 'Rửa vết thương bằng nước muối sinh lý, sát trùng bằng Povidine và dán băng Urgo',
    outcome: 'Đã ổn định, quay lại lớp học',
    staff: 'Cô Lê Hải Yến',
    status: 'Ký nhận',
    parentNotified: true,
    parentNote: 'Phụ huynh đã ghi nhận và cảm ơn cô y tế.'
  },
  {
    id: 'INC-1002',
    date: '25/06/2026 • 14:30',
    patient: 'Phạm Minh Kha',
    idCode: 'HS-21-0004',
    class: '5A1',
    bg: 'O+',
    reason: 'Sốt cao, đau đầu, mệt mỏi',
    temp: 38.9,
    bp: '115/75',
    treatment: 'Cho uống 1 viên Paracetamol 250mg, dán miếng hạ sốt trán, nằm nghỉ tại phòng y tế',
    outcome: 'Nằm nghỉ tại phòng y tế, chờ phụ huynh đón',
    staff: 'Cô Lê Hải Yến',
    status: 'Ký nhận',
    parentNotified: true,
    parentNote: 'Gia đình đã đến đón học sinh về đi khám bệnh.'
  },
  {
    id: 'INC-1003',
    date: '24/06/2026 • 09:45',
    patient: 'Lê Thảo Vy',
    idCode: 'HS-21-0002',
    class: '1A1',
    bg: 'A+',
    reason: 'Lên cơn hen suyễn nhẹ, khó thở sau giờ thể dục',
    temp: 36.8,
    bp: '105/65',
    treatment: 'Nằm nghỉ tư thế cao, hỗ trợ xịt 2 nhát Salbutamol cắt cơn hen, xoa bóp lồng ngực',
    outcome: 'Đã cắt cơn, thở bình thường, tiếp tục theo dõi',
    staff: 'Cô Lê Hải Yến',
    status: 'Ký nhận',
    parentNotified: true,
    parentNote: 'Phụ huynh đã liên hệ và nhờ theo dõi thêm trong ngày.'
  }
];
export const DEFAULT_FINANCE_RECEIPTS: TuitionReceipt[] = [];
export const DEFAULT_FINANCE_TRANSACTIONS: FinanceTransaction[] = [];
export const DEFAULT_COUNSELING_APPOINTMENTS: CounselingAppointment[] = [];
export const DEFAULT_COUNSELING_UNIVERSITIES: UniversityMajors[] = [];
export const DEFAULT_YOUTH_UNION_MEMBERS: YouthUnionMember[] = [];
export const DEFAULT_YOUTH_UNION_CAMPAIGNS: YouthUnionCampaign[] = [];
export const DEFAULT_YOUTH_UNION_EMULATIONS: YouthUnionEmulation[] = [];
export const DEFAULT_TEACHER_ASSIGNMENTS: TeacherAssignment[] = [];
export const DEFAULT_TIMETABLE: TimetableSlot[] = [];
export const DEFAULT_QA_INSPECTIONS: QAInspection[] = [];
export const DEFAULT_QA_EVIDENCE: QAEvidence[] = [];
export const DEFAULT_EXAM_PLANS: ExamPlan[] = [];
export const DEFAULT_MEALS: Meal[] = [];
export const DEFAULT_BOARDING_ROOMS: BoardingRoom[] = [];
export const DEFAULT_SUPPLIERS: Supplier[] = [];
export const DEFAULT_SCHEDULES: Schedule[] = [];
export const DEFAULT_STORAGES: StorageItem[] = [];
export const DEFAULT_YOUTH_UNION_STATS: YouthUnionStat[] = [];

/* --- NEW SERVICE INTERFACE IMPLEMENTATIONS (PHASE 2) --- */

// Health Records CRUD
export async function getHealthRecords(): Promise<HealthRecord[]> {
  return getCollectionData<HealthRecord>('healthRecords', DEFAULT_HEALTH_RECORDS, seedHealthRecords);
}
export async function saveHealthRecord(record: HealthRecord): Promise<void> {
  return saveDocument<HealthRecord>('healthRecords', record);
}
export async function deleteHealthRecord(id: string): Promise<void> {
  return deleteDocument('healthRecords', id);
}
export async function seedHealthRecords(): Promise<void> {
  for (const item of DEFAULT_HEALTH_RECORDS) {
    await setDoc(doc(db, 'healthRecords', item.id), item);
  }
}

// Health Inventory CRUD
export async function getHealthInventory(): Promise<HealthInventoryItem[]> {
  return getCollectionData<HealthInventoryItem>('healthInventory', DEFAULT_HEALTH_INVENTORY, seedHealthInventory);
}
export async function saveHealthInventoryItem(item: HealthInventoryItem): Promise<void> {
  return saveDocument<HealthInventoryItem>('healthInventory', item);
}
export async function deleteHealthInventoryItem(id: string): Promise<void> {
  return deleteDocument('healthInventory', id);
}
export async function seedHealthInventory(): Promise<void> {
  for (const item of DEFAULT_HEALTH_INVENTORY) {
    await setDoc(doc(db, 'healthInventory', item.id), item);
  }
}

// Health Incidents CRUD
export async function getHealthIncidents(): Promise<HealthIncident[]> {
  return getCollectionData<HealthIncident>('healthIncidents', DEFAULT_HEALTH_INCIDENTS, seedHealthIncidents);
}
export async function saveHealthIncident(incident: HealthIncident): Promise<void> {
  return saveDocument<HealthIncident>('healthIncidents', incident);
}
export async function deleteHealthIncident(id: string): Promise<void> {
  return deleteDocument('healthIncidents', id);
}
export async function seedHealthIncidents(): Promise<void> {
  for (const item of DEFAULT_HEALTH_INCIDENTS) {
    await setDoc(doc(db, 'healthIncidents', item.id), item);
  }
}

// Finance Receipts CRUD
export async function getFinanceReceipts(): Promise<TuitionReceipt[]> {
  return getCollectionData<TuitionReceipt>('financeReceipts', DEFAULT_FINANCE_RECEIPTS, seedFinanceReceipts);
}
export async function saveFinanceReceipt(receipt: TuitionReceipt): Promise<void> {
  return saveDocument<TuitionReceipt>('financeReceipts', receipt);
}
export async function deleteFinanceReceipt(id: string): Promise<void> {
  return deleteDocument('financeReceipts', id);
}
export async function seedFinanceReceipts(): Promise<void> {
  for (const item of DEFAULT_FINANCE_RECEIPTS) {
    await setDoc(doc(db, 'financeReceipts', item.id), item);
  }
}

// Finance Transactions CRUD
export async function getFinanceTransactions(): Promise<FinanceTransaction[]> {
  return getCollectionData<FinanceTransaction>('financeTransactions', DEFAULT_FINANCE_TRANSACTIONS, seedFinanceTransactions);
}
export async function saveFinanceTransaction(tx: FinanceTransaction): Promise<void> {
  return saveDocument<FinanceTransaction>('financeTransactions', tx);
}
export async function deleteFinanceTransaction(id: string): Promise<void> {
  return deleteDocument('financeTransactions', id);
}
export async function seedFinanceTransactions(): Promise<void> {
  for (const item of DEFAULT_FINANCE_TRANSACTIONS) {
    await setDoc(doc(db, 'financeTransactions', item.id), item);
  }
}

// Counseling Appointments CRUD
export async function getCounselingAppointments(): Promise<CounselingAppointment[]> {
  return getCollectionData<CounselingAppointment>('counselingAppointments', DEFAULT_COUNSELING_APPOINTMENTS, seedCounselingAppointments);
}
export async function saveCounselingAppointment(app: CounselingAppointment): Promise<void> {
  return saveDocument<CounselingAppointment>('counselingAppointments', app);
}
export async function deleteCounselingAppointment(id: string): Promise<void> {
  return deleteDocument('counselingAppointments', id);
}
export async function seedCounselingAppointments(): Promise<void> {
  for (const item of DEFAULT_COUNSELING_APPOINTMENTS) {
    await setDoc(doc(db, 'counselingAppointments', item.id), item);
  }
}

// Counseling Universities CRUD
export async function getCounselingUniversities(): Promise<UniversityMajors[]> {
  return getCollectionData<UniversityMajors>('counselingUniversities', DEFAULT_COUNSELING_UNIVERSITIES, seedCounselingUniversities);
}
export async function saveCounselingUniversity(univ: UniversityMajors): Promise<void> {
  return saveDocument<UniversityMajors>('counselingUniversities', univ);
}
export async function deleteCounselingUniversity(id: string): Promise<void> {
  return deleteDocument('counselingUniversities', id);
}
export async function seedCounselingUniversities(): Promise<void> {
  for (const item of DEFAULT_COUNSELING_UNIVERSITIES) {
    await setDoc(doc(db, 'counselingUniversities', item.id), item);
  }
}

// Youth Union Members CRUD
export async function getYouthUnionMembers(): Promise<YouthUnionMember[]> {
  return getCollectionData<YouthUnionMember>('youthUnionMembers', DEFAULT_YOUTH_UNION_MEMBERS, seedYouthUnionMembers);
}
export async function saveYouthUnionMember(member: YouthUnionMember): Promise<void> {
  return saveDocument<YouthUnionMember>('youthUnionMembers', member);
}
export async function deleteYouthUnionMember(id: string): Promise<void> {
  return deleteDocument('youthUnionMembers', id);
}
export async function seedYouthUnionMembers(): Promise<void> {
  for (const item of DEFAULT_YOUTH_UNION_MEMBERS) {
    await setDoc(doc(db, 'youthUnionMembers', item.id), item);
  }
}

// Youth Union Campaigns CRUD
export async function getYouthUnionCampaigns(): Promise<YouthUnionCampaign[]> {
  return getCollectionData<YouthUnionCampaign>('youthUnionCampaigns', DEFAULT_YOUTH_UNION_CAMPAIGNS, seedYouthUnionCampaigns);
}
export async function saveYouthUnionCampaign(camp: YouthUnionCampaign): Promise<void> {
  return saveDocument<YouthUnionCampaign>('youthUnionCampaigns', camp);
}
export async function deleteYouthUnionCampaign(id: string): Promise<void> {
  return deleteDocument('youthUnionCampaigns', id);
}
export async function seedYouthUnionCampaigns(): Promise<void> {
  for (const item of DEFAULT_YOUTH_UNION_CAMPAIGNS) {
    await setDoc(doc(db, 'youthUnionCampaigns', item.id), item);
  }
}

// Youth Union Emulations CRUD
export async function getYouthUnionEmulations(): Promise<YouthUnionEmulation[]> {
  return getCollectionData<YouthUnionEmulation>('youthUnionEmulations', DEFAULT_YOUTH_UNION_EMULATIONS, seedYouthUnionEmulations);
}
export async function saveYouthUnionEmulation(emu: YouthUnionEmulation): Promise<void> {
  return saveDocument<YouthUnionEmulation>('youthUnionEmulations', emu);
}
export async function deleteYouthUnionEmulation(id: string): Promise<void> {
  return deleteDocument('youthUnionEmulations', id);
}
export async function seedYouthUnionEmulations(): Promise<void> {
  for (const item of DEFAULT_YOUTH_UNION_EMULATIONS) {
    await setDoc(doc(db, 'youthUnionEmulations', item.id), item);
  }
}

// Teacher Assignments CRUD
export async function getTeacherAssignments(): Promise<TeacherAssignment[]> {
  return getCollectionData<TeacherAssignment>('teacherAssignments', DEFAULT_TEACHER_ASSIGNMENTS, seedTeacherAssignments);
}
export async function saveTeacherAssignment(assign: TeacherAssignment): Promise<void> {
  return saveDocument<TeacherAssignment>('teacherAssignments', assign);
}
export async function deleteTeacherAssignment(id: string): Promise<void> {
  return deleteDocument('teacherAssignments', id);
}
export async function seedTeacherAssignments(): Promise<void> {
  for (const item of DEFAULT_TEACHER_ASSIGNMENTS) {
    await setDoc(doc(db, 'teacherAssignments', item.id), item);
  }
}

// Timetables CRUD
export async function getTimetable(): Promise<TimetableSlot[]> {
  return getCollectionData<TimetableSlot>('timetables', DEFAULT_TIMETABLE, seedTimetables);
}
export async function saveTimetableSlot(slot: TimetableSlot): Promise<void> {
  return saveDocument<TimetableSlot>('timetables', slot);
}
export async function deleteTimetableSlot(id: string): Promise<void> {
  return deleteDocument('timetables', id);
}
export async function seedTimetables(): Promise<void> {
  for (const item of DEFAULT_TIMETABLE) {
    await setDoc(doc(db, 'timetables', item.id), item);
  }
}

export async function generateTimetable(): Promise<void> {
  if (!auth.currentUser) return;
  
  // 1. Fetch current database entities
  const classes = await getClasses();
  let subjects = await getSubjects();
  const staff = await getStaffList();
  const assignments = await getTeacherAssignments();
  const rooms = await getRooms();

  // Auto-seed missing standard subjects if Firestore subjects are incomplete (e.g. under 6 subjects)
  if (subjects.length < 6) {
    for (const item of DEFAULT_SUBJECTS) {
      if (!subjects.some(s => s.id === item.id || s.name.toLowerCase() === item.name.toLowerCase())) {
        await saveSubject(item);
      }
    }
    // Re-fetch subjects
    subjects = await getSubjects();
  }


  // Tạo TKB cho tất cả lớp đang hoạt động
  // Đã xóa bỏ logic lọc theo học sinh vì gây ra TKB trống khi student.grade không khớp c.name
  const classesToSchedule = classes.length > 0 ? classes : [];

  if (classesToSchedule.length === 0) {
    console.warn('generateTimetable: Không có lớp nào để tạo TKB. Kiểm tra dữ liệu lớp học trong Firestore.');
    return;
  }

  // 2. Clear old timetables
  // Get all slots first
  const existingSlotsSnapshot = await getDocs(collection(db, 'timetables'));
  for (const docSnap of existingSlotsSnapshot.docs) {
    await deleteDoc(docSnap.ref);
  }

  // 3. Define helper for matching assigned teacher
  const normalize = (str: string) => {
    return str.toLowerCase()
      .replace(/đ/g, 'd')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/\s+/g, '');
  };

  // 4. Generate timetables for both semesters (Học kỳ 1 & Học kỳ 2)
  const generateForSemester = async (semesterNum: number) => {
    const teacherHours: Record<string, number> = {};
    const teacherClassesMap: Record<string, Set<string>> = {};

    const getTeacherLoadLimit = (teacherName: string): number => {
      const teacherObj = staff.find(s => s.name === teacherName);
      if (!teacherObj) return 17; // default
      
      const role = teacherObj.role || '';
      let limit = 17;
      if (role.toLowerCase().includes('hiệu trưởng') && !role.toLowerCase().includes('phó')) {
        limit = 2;
      } else if (role.toLowerCase().includes('phó hiệu trưởng')) {
        limit = 4;
      }
      
      // Homeroom teacher: reduce by 4
      const isHomeroom = classes.some(c => c.teacher === teacherName);
      if (isHomeroom) {
        limit -= 4;
      }
      
      return limit;
    };

    const checkAndAssignTeacher = (classId: string, subjectName: string, hours: number): string => {
      const normSubj = normalize(subjectName);
      
      // Find all potential candidate teachers who match this subject
      const candidates: string[] = [];
      
      // Helper: kiểm tra staff có dạy đúng môn này không
      // Ưu tiên: mainSubject (môn giảng dạy chính) -> major (chuyên ngành đào tạo)
      // KHÔNG dùng department vì một tổ có nhiều môn, GV chỉ dạy môn của mình
      const staffMatchesSubject = (s: Staff): boolean => {
        // 1. Ưu tiên mainSubject (môn giảng dạy chính đã khai báo)
        const normMainSub = s.mainSubject ? normalize(s.mainSubject) : '';
        if (normMainSub && (normMainSub.includes(normSubj) || normSubj.includes(normMainSub))) {
          return true;
        }
        // 2. Fallback: dùng major (chuyên ngành đào tạo) khi mainSubject chưa được nhập
        if (!normMainSub && s.major) {
          const normMajor = normalize(s.major);
          return normMajor.includes(normSubj) || normSubj.includes(normMajor);
        }
        return false;
      };

      // 1. Homeroom teacher of this class if they teach this subject
      const targetClassObj = classes.find(c => c.name === classId);
      if (targetClassObj && targetClassObj.teacher) {
        const hrStaff = staff.find(s => s.name === targetClassObj.teacher);
        if (hrStaff && staffMatchesSubject(hrStaff)) {
          candidates.push(targetClassObj.teacher);
        }
      }
      
      // 2. Specific teacher assignments first
      for (const assign of assignments) {
        if (!assign.classes) continue;
        for (const clsStr of assign.classes) {
          const normClsStr = normalize(clsStr);
          const normClassId = normalize(classId);
          
          if (normClsStr.includes(normClassId)) {
            if (clsStr.includes('(')) {
              const subPart = clsStr.substring(clsStr.indexOf('(') + 1, clsStr.indexOf(')'));
              if (normalize(subPart).includes(normSubj) || normSubj.includes(normalize(subPart))) {
                if (!candidates.includes(assign.name)) candidates.push(assign.name);
              }
            } else {
              const matchingStaff = staff.find(s => s.name === assign.name);
              if (matchingStaff && staffMatchesSubject(matchingStaff)) {
                if (!candidates.includes(assign.name)) candidates.push(assign.name);
              }
            }
          }
        }
      }

      // 3. General teachers matching mainSubject OR department
      const generalMatching = staff.filter(s => {
        if (s.status !== 'Đang Công Tác') return false;
        return staffMatchesSubject(s);
      }).map(s => s.name);
      
      for (const t of generalMatching) {
        if (!candidates.includes(t)) candidates.push(t);
      }

      // Filter candidates by capacity and select the best one
      let bestTeacher = 'GV Bộ môn';

      // Ưu tiên số 1: Giáo viên chủ nhiệm dạy chính lớp mình nếu đủ điều kiện
      const hrTeacherName = targetClassObj?.teacher;
      if (hrTeacherName && candidates.includes(hrTeacherName)) {
        const currentHours = teacherHours[hrTeacherName] || 0;
        const limit = getTeacherLoadLimit(hrTeacherName);
        if (currentHours + hours <= limit) {
          bestTeacher = hrTeacherName;
        }
      }

      if (bestTeacher === 'GV Bộ môn') {
        let minHours = Infinity;
        for (const teacher of candidates) {
          const currentHours = teacherHours[teacher] || 0;
          const limit = getTeacherLoadLimit(teacher);
          if (currentHours + hours <= limit) {
            if (currentHours < minHours) {
              minHours = currentHours;
              bestTeacher = teacher;
            }
          }
        }
      }

      // Fallback: find the one who exceeds their limit the least
      if (bestTeacher === 'GV Bộ môn' && candidates.length > 0) {
        let minExcess = Infinity;
        for (const teacher of candidates) {
          const currentHours = teacherHours[teacher] || 0;
          const limit = getTeacherLoadLimit(teacher);
          const excess = currentHours + hours - limit;
          if (excess < minExcess) {
            minExcess = excess;
            bestTeacher = teacher;
          }
        }
      }

      // Increment assigned hours for the selected teacher
      if (bestTeacher !== 'GV Bộ môn') {
        teacherHours[bestTeacher] = (teacherHours[bestTeacher] || 0) + hours;
        if (!teacherClassesMap[bestTeacher]) {
          teacherClassesMap[bestTeacher] = new Set();
        }
        teacherClassesMap[bestTeacher].add(`${classId} (${subjectName})`);
      }

      return bestTeacher;
    };

    const shuffleArray = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const activeSubjects = subjects.filter(s => s.status === 'Đang Giảng Dạy');
    const hasExperiential = activeSubjects.some(s => normalize(s.name).includes('trainghiem'));
    const finalSubjects = [...activeSubjects];
    if (!hasExperiential) {
      finalSubjects.push({
        id: 'M-HDTN',
        name: 'Hoạt động trải nghiệm',
        type: 'Bắt buộc',
        hoursPerWeek: 3,
        status: 'Đang Giảng Dạy'
      });
    }

    interface ScheduleBlock {
      classId: string;
      subject: string;
      teacher: string;
      duration: number; // 1 or 2
    }
    const blocksToPlace: ScheduleBlock[] = [];

    for (const cls of classesToSchedule) {
      const classBlocks: ScheduleBlock[] = [];
      for (const sub of finalSubjects) {
        const normSub = normalize(sub.name);
        if (normSub.includes('chaoco') || normSub.includes('sinhhoatduoico')) {
          continue;
        }
        
        // Lấy số tiết học mỗi tuần cho khối tương ứng từ cấu hình môn học
        const gradeKey = cls.grade.toString();
        const hours = sub.hoursPerGrade?.[gradeKey] ?? sub.hoursPerWeek ?? 2;
        
        // Nếu số tiết bằng 0 (khối này không học môn này), bỏ qua không xếp lịch
        if (hours === 0) {
          continue;
        }
        
        let teacher = '';
        if (normSub.includes('trainghiem')) {
          teacher = cls.teacher && cls.teacher !== 'Chưa phân công' ? cls.teacher : 'GV Chủ nhiệm';
          // Tăng giờ dạy cho giáo viên chủ nhiệm khi phụ trách Hoạt động trải nghiệm
          if (cls.teacher && cls.teacher !== 'Chưa phân công') {
            teacherHours[cls.teacher] = (teacherHours[cls.teacher] || 0) + hours;
            if (!teacherClassesMap[cls.teacher]) {
              teacherClassesMap[cls.teacher] = new Set();
            }
            teacherClassesMap[cls.teacher].add(`${cls.name} (${sub.name})`);
          }
        } else {
          teacher = checkAndAssignTeacher(cls.name, sub.name, hours);
        }

        // Split hours into blocks of 2 and 1
        let remaining = hours;
        while (remaining > 0) {
          if (remaining >= 2) {
            classBlocks.push({
              classId: cls.name,
              subject: sub.name,
              teacher: teacher,
              duration: 2
            });
            remaining -= 2;
          } else {
            classBlocks.push({
              classId: cls.name,
              subject: sub.name,
              teacher: teacher,
              duration: 1
            });
            remaining -= 1;
          }
        }
      }
      // Heuristic: Place double blocks first, shuffle within groups to maintain variety
      const doubleBlocks = shuffleArray(classBlocks.filter(b => b.duration === 2));
      const singleBlocks = shuffleArray(classBlocks.filter(b => b.duration === 1));
      blocksToPlace.push(...doubleBlocks, ...singleBlocks);
    }

    // Tính toán số lượng tiết học phân bổ cân đối cho mỗi ngày của mỗi lớp
    const classTargetPeriods: Record<string, number[]> = {};
    for (const cls of classesToSchedule) {
      let totalHours = 1; // 1 tiết Chào cờ mặc định
      for (const sub of finalSubjects) {
        const normSub = normalize(sub.name);
        if (normSub.includes('chaoco') || normSub.includes('sinhhoatduoico')) {
          continue;
        }
        const gradeKey = cls.grade.toString();
        const hours = sub.hoursPerGrade?.[gradeKey] ?? sub.hoursPerWeek ?? 2;
        if (hours > 0) {
          totalHours += hours;
        }
      }

      const targets = Array(5).fill(0);
      let tempN = totalHours;
      let dIdx = 0;
      while (tempN > 0) {
        targets[dIdx]++;
        tempN--;
        dIdx = (dIdx + 1) % 5;
      }
      classTargetPeriods[cls.name] = targets;
    }

    // Initialize grid
    const grid: Record<string, Record<number, Record<number, { subject: string; teacher: string; room?: string } | null>>> = {};
    const classRoomMap = new Map<string, string>();
    for (const cls of classesToSchedule) {
      classRoomMap.set(cls.name, cls.room || 'Lớp Học');
      grid[cls.name] = {};
      for (let day = 1; day <= 5; day++) {
        grid[cls.name][day] = {};
        for (let period = 1; period <= 7; period++) {
          grid[cls.name][day][period] = null;
        }
      }
      grid[cls.name][1][1] = { subject: 'Sinh hoạt dưới cờ', teacher: 'BGH', room: 'Sân Trường' };
    }

    const getSubjectCountOnDay = (classId: string, day: number, subjectName: string): number => {
      let count = 0;
      for (let period = 1; period <= 7; period++) {
        if (grid[classId][day][period]?.subject === subjectName) {
          count++;
        }
      }
      return count;
    };

    const getPeriodCountOnDay = (classId: string, day: number): number => {
      let count = 0;
      for (let period = 1; period <= 7; period++) {
        if (grid[classId][day]?.[period] !== null) {
          count++;
        }
      }
      return count;
    };

    const isTeacherBusy = (teacher: string, day: number, period: number): boolean => {
      if (teacher === 'BGH' || teacher === 'GV Bộ môn (Thay phiên)' || teacher === 'GV Bộ môn' || !teacher || teacher === 'GV Chủ nhiệm' || teacher === 'Chưa phân công') {
        return false;
      }
      for (const clsName in grid) {
        if (grid[clsName][day]?.[period]?.teacher === teacher) {
          return true;
        }
      }
      return false;
    };

    const isTeacherBusyForBlock = (teacher: string, day: number, period: number, duration: number): boolean => {
      for (let d = 0; d < duration; d++) {
        if (isTeacherBusy(teacher, day, period + d)) {
          return true;
        }
      }
      return false;
    };

    const isRoomBusy = (room: string, day: number, period: number): boolean => {
      const isSpecialized = room.includes('Máy Tính') || room.includes('Thí Nghiệm') || room.includes('Hội Trường') || room.includes('Thư Viện');
      if (!isSpecialized) return false;

      for (const clsName in grid) {
        if (grid[clsName][day]?.[period]?.room === room) {
          return true;
        }
      }
      return false;
    };

    const isRoomBusyForBlock = (room: string, day: number, period: number, duration: number): boolean => {
      for (let d = 0; d < duration; d++) {
        if (isRoomBusy(room, day, period + d)) {
          return true;
        }
      }
      return false;
    };

    const getCandidateRoomsForSubject = (subjectName: string, classDefaultRoom: string): string[] => {
      const normSub = normalize(subjectName);
      
      // Môn Tin học -> Phòng Máy Tính
      if (normSub.includes('tinhoc') || normSub.includes('tin')) {
        const compRooms = rooms.filter(r => 
          normalize(r.type).includes('maytinh') || 
          normalize(r.name).includes('maytinh') || 
          normalize(r.name).includes('ndn.1')
        );
        if (compRooms.length > 0) return compRooms.map(r => r.name);
        return ['Phòng NĐN.101', 'Phòng NĐN.102'];
      }
      
      // Các môn Vật lý, Hóa học, Sinh học -> Phòng TB Lý/Hóa/Sinh
      if (
        ((normSub.includes('vatly') || normSub.includes('ly')) && !normSub.includes('dia')) ||
        ((normSub.includes('hoahoc') || normSub.includes('hoa')) && !normSub.includes('hoat')) ||
        (normSub.includes('sinh') && !normSub.includes('sinhhoat'))
      ) {
        const scienceRooms = rooms.filter(r => 
          normalize(r.type).includes('thinghiem') || 
          normalize(r.type).includes('tb') || 
          normalize(r.name).includes('thinghiem') ||
          normalize(r.name).includes('ndn.2')
        );
        if (scienceRooms.length > 0) return scienceRooms.map(r => r.name);
        return ['Phòng NĐN.201', 'Phòng NĐN.202', 'Phòng NĐN.203'];
      }
      
      // Môn mặc định khác: phòng học thông thường của lớp
      return [classDefaultRoom || 'Lớp Học'];
    };

    let iterations = 0;
    const maxIterations = 20000; // Increase max iterations for more complex constraints
    let relaxedMode = false;

    const solve = (index: number): boolean => {
      iterations++;
      if (iterations > maxIterations) {
        relaxedMode = true;
        return false;
      }
      if (index === blocksToPlace.length) {
        return true;
      }
      const item = blocksToPlace[index];
      const classId = item.classId;
      const clsDefaultRoom = classRoomMap.get(classId) || 'Lớp Học';

      for (let day = 1; day <= 5; day++) {
        const maxPeriods = 7;
        for (let period = 1; period <= maxPeriods; period++) {
          if (day === 1 && period === 1) continue;

          if (item.duration === 2) {
            // Check double period session boundary rules:
            // Morning: 1, 2, 3 are valid starting positions (occupying 1-2, 2-3, 3-4)
            // Afternoon: 5, 6 are valid starting positions (occupying 5-6, 6-7)
            const isValidDoubleStart = (period === 1 || period === 2 || period === 3 || period === 5 || period === 6);
            if (!isValidDoubleStart) continue;

            if (grid[classId][day][period] !== null || grid[classId][day][period + 1] !== null) continue;

            // Phân bổ đều: Không vượt quá số tiết tối đa trong ngày
            if (!relaxedMode) {
              const currentCount = getPeriodCountOnDay(classId, day);
              if (currentCount + 2 > classTargetPeriods[classId][day - 1]) continue;
            }

            if (!relaxedMode && isTeacherBusyForBlock(item.teacher, day, period, 2)) continue;
            if (!relaxedMode && getSubjectCountOnDay(classId, day, item.subject) > 0) continue;

            // Find an available room
            const candidateRooms = getCandidateRoomsForSubject(item.subject, clsDefaultRoom);
            let assignedRoom = '';
            for (const r of candidateRooms) {
              if (relaxedMode || !isRoomBusyForBlock(r, day, period, 2)) {
                assignedRoom = r;
                break;
              }
            }
            if (!assignedRoom) continue;

            // Place double block
            grid[classId][day][period] = { subject: item.subject, teacher: item.teacher, room: assignedRoom };
            grid[classId][day][period + 1] = { subject: item.subject, teacher: item.teacher, room: assignedRoom };

            if (solve(index + 1)) return true;

            // Backtrack
            grid[classId][day][period] = null;
            grid[classId][day][period + 1] = null;
          } else {
            // item.duration === 1
            if (grid[classId][day][period] !== null) continue;

            // Phân bổ đều: Không vượt quá số tiết tối đa trong ngày
            if (!relaxedMode) {
              const currentCount = getPeriodCountOnDay(classId, day);
              if (currentCount + 1 > classTargetPeriods[classId][day - 1]) continue;
            }

            if (!relaxedMode && isTeacherBusy(item.teacher, day, period)) continue;
            if (!relaxedMode && getSubjectCountOnDay(classId, day, item.subject) > 0) continue;

            // Find an available room
            const candidateRooms = getCandidateRoomsForSubject(item.subject, clsDefaultRoom);
            let assignedRoom = '';
            for (const r of candidateRooms) {
              if (relaxedMode || !isRoomBusy(r, day, period)) {
                assignedRoom = r;
                break;
              }
            }
            if (!assignedRoom) continue;

            // Place single block
            grid[classId][day][period] = { subject: item.subject, teacher: item.teacher, room: assignedRoom };

            if (solve(index + 1)) return true;

            // Backtrack
            grid[classId][day][period] = null;
          }
        }
      }
      return false;
    };

    const success = solve(0);

    if (!success) {
      console.warn(`Semester ${semesterNum} timetable generation failed with strict/relaxed CSP solver. Running greedy fallback.`);
      // Reset grid to pre-filled slots
      for (const cls of classesToSchedule) {
        for (let day = 1; day <= 5; day++) {
          for (let period = 1; period <= 7; period++) {
            grid[cls.name][day][period] = null;
          }
        }
        grid[cls.name][1][1] = { subject: 'Sinh hoạt dưới cờ', teacher: 'BGH', room: 'Sân Trường' };
      }

      // Fallback: Flatten blocks into single period items and place them in any empty slot evenly across 5 days
      for (const cls of classesToSchedule) {
        const classBlocks = blocksToPlace.filter(x => x.classId === cls.name);
        const flatItems: { subject: string; teacher: string }[] = [];
        for (const block of classBlocks) {
          for (let d = 0; d < block.duration; d++) {
            flatItems.push({ subject: block.subject, teacher: block.teacher });
          }
        }

        let itemPtr = 0;
        const clsDefaultRoom = classRoomMap.get(cls.name) || 'Lớp Học';
        const targetPeriods = classTargetPeriods[cls.name];

        for (let day = 1; day <= 5; day++) {
          const targetForDay = targetPeriods[day - 1];
          let placedOnDay = (day === 1) ? 1 : 0; // Monday starts with Chào cờ (1)
          
          const maxPeriods = 7;
          for (let period = 1; period <= maxPeriods; period++) {
            if (day === 1 && period === 1) continue; // Skip Chào cờ
            
            if (grid[cls.name][day][period] === null && itemPtr < flatItems.length && placedOnDay < targetForDay) {
              const item = flatItems[itemPtr++];
              const candidateRooms = getCandidateRoomsForSubject(item.subject, clsDefaultRoom);
              grid[cls.name][day][period] = {
                subject: item.subject,
                teacher: item.teacher,
                room: candidateRooms[0]
              };
              placedOnDay++;
            }
          }
        }
      }
    } else if (relaxedMode) {
      console.warn(`Semester ${semesterNum} timetable generation succeeded but had to relax teacher, subject-on-day, or room constraints.`);
    }

    // Save generated grid to Firestore
    for (const classId in grid) {
      for (let day = 1; day <= 5; day++) {
        const maxPeriods = 7;
        for (let period = 1; period <= maxPeriods; period++) {
          const cell = grid[classId][day][period];
          if (cell) {
            const slotId = `TS-${semesterNum}-${classId}-${day}-${period}`;
            const slot: TimetableSlot = {
              id: slotId,
              classId: classId,
              day: day,
              period: period,
              subject: cell.subject,
              teacher: cell.teacher,
              semester: semesterNum,
              room: cell.room
            };
            await saveTimetableSlot(slot);
          }
        }
      }
    }
    return { teacherHours, teacherClassesMap };
  };

  const sem1Data = await generateForSemester(1);
  await generateForSemester(2);

  // 5. Update teacherAssignments in Firestore
  const existingAssignSnapshot = await getDocs(collection(db, 'teacherAssignments'));
  for (const docSnap of existingAssignSnapshot.docs) {
    await deleteDoc(docSnap.ref);
  }

  for (const s of staff) {
    const isHomeroom = classes.some(c => c.teacher === s.name);
    let quota = 17;
    const roleLower = (s.role || '').toLowerCase();
    if (roleLower.includes('hiệu trưởng') && !roleLower.includes('phó')) {
      quota = 2;
    } else if (roleLower.includes('phó hiệu trưởng')) {
      quota = 4;
    }
    if (isHomeroom) {
      quota -= 4;
    }

    const assignedHours = sem1Data.teacherHours[s.name] || 0;
    const assignedClasses = Array.from(sem1Data.teacherClassesMap[s.name] || []);

    const assignment: TeacherAssignment = {
      id: s.id,
      name: s.name,
      dept: s.department || 'Chưa phân phối',
      role: s.role || 'Giáo viên',
      quota: quota,
      assigned: assignedHours,
      classes: assignedClasses
    };
    await saveTeacherAssignment(assignment);
  }
}

// Exam Schedule CRUD
export async function getExamSchedule(): Promise<ExamSlot[]> {
  return getCollectionData<ExamSlot>('exams_schedule', [], async () => {});
}
export async function saveExamSlot(slot: ExamSlot): Promise<void> {
  return saveDocument<ExamSlot>('exams_schedule', slot);
}
export async function deleteExamSlot(id: string): Promise<void> {
  return deleteDocument('exams_schedule', id);
}

export async function generateExamSchedule(semester: number): Promise<void> {
  if (!auth.currentUser) return;

  // 1. Fetch dependencies
  const classes = await getClasses();
  const subjects = await getSubjects();
  const staff = await getStaffList();
  const students = await getStudents();
  const rooms = await getRooms();

  // 2. Clear existing exam slots for this semester
  const existing = await getExamSchedule();
  const semesterSlots = existing.filter(s => s.semester === semester);
  for (const slot of semesterSlots) {
    await deleteExamSlot(slot.id);
  }

  // Helper to normalize strings for comparison
  const normalizeStr = (str: string) => {
    return str.toLowerCase()
      .replace(/đ/g, 'd')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  };

  // 3. Filter subjects that take centralized exams
  const excludedSubjects = [
    'giaoducthechat', 'theduc', 'amnhac', 'mythuat', 'mithuat', 'hoatdongtrainghiem', 'trainghiem', 
    'giaoducdiaphuong', 'diaphuong', 'giaoducquocphong', 'quocphong', 'gdqp', 'chaoco', 'sinhhoat',
    'tinhoc', 'tin'
  ];
  const examSubjects = subjects.filter(s => {
    const norm = normalizeStr(s.name);
    return s.status === 'Đang Giảng Dạy' && !excludedSubjects.some(ex => norm.includes(ex));
  });

  // Filter classrooms (Lớp Học Chuẩn hoặc Phòng học lý thuyết / chuẩn)
  const classrooms = rooms.filter(r => 
    r.type === 'Lớp Học Chuẩn' || 
    r.type === 'Phòng học chuẩn' || 
    r.type === 'Phòng học lý thuyết' || 
    r.type === 'Phòng học lý thuyết (Phòng học cơ bản)'
  );
  const activeClassrooms = classrooms.length > 0 ? classrooms : rooms.slice(0, 3);

  // Track proctors assigned to each room to ensure different proctors each day
  const roomProctorsHistory: Record<string, Set<string>> = {};

  const proctorsList = staff.filter(t => 
    t.status === 'Đang Công Tác' &&
    t.role !== 'Nhân viên hành chính' && 
    t.department !== 'Hành chính'
  );

  // 4. Generate slots across 10 days of the exam period
  // Sáng / Chiều. Max 2 exams/day. 
  for (let day = 1; day <= 10; day++) {
    for (const session of ['Sáng', 'Chiều'] as const) {
      const proctorsInSession = new Set<string>();
      const roomsUsedInSession = new Set<string>();

      for (const gradeNum of [1, 2, 3, 4, 5]) {
        // Constraints: Grades 1, 2, 5 exam in the morning, Grades 3, 4 exams in the afternoon
        if (session === 'Sáng' && (gradeNum === 3 || gradeNum === 4)) continue;
        if (session === 'Chiều' && (gradeNum === 1 || gradeNum === 2 || gradeNum === 5)) continue;

        // Get all students of this grade
        const gradeStudents = students.filter(s => 
          s.grade.startsWith(gradeNum.toString()) && 
          s.status === 'Đang Học'
        );

        if (gradeStudents.length === 0) continue;

        // Sort students alphabetically by name
        gradeStudents.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

        // Since each grade exams once a day, the subject index is day - 1
        const subIdx = day - 1;
        if (subIdx >= examSubjects.length) continue;

        const sub = examSubjects[subIdx];

        // Partition students into rooms
        const candidatesPerRoom = 25;
        const roomsNeeded = Math.max(1, Math.ceil(gradeStudents.length / candidatesPerRoom));

        // Get standard classrooms not yet used in this session
        const availableClassrooms = activeClassrooms.filter(r => !roomsUsedInSession.has(r.name));

        for (let rIdx = 0; rIdx < roomsNeeded; rIdx++) {
          // Select room (fallback to cycling if all standard rooms are used)
          const roomObj = availableClassrooms[rIdx] || activeClassrooms[rIdx % activeClassrooms.length];
          roomsUsedInSession.add(roomObj.name);

          // Get candidate list for this room
          const roomCandidates = gradeStudents.slice(rIdx * candidatesPerRoom, (rIdx + 1) * candidatesPerRoom);
          const candidateIds = roomCandidates.map(c => c.id);

          // Initialize history for this room if not present
          if (!roomProctorsHistory[roomObj.name]) {
            roomProctorsHistory[roomObj.name] = new Set<string>();
          }

          // Find an available proctor who has not proctored this room before
          let examiner = proctorsList.find(t => 
            !proctorsInSession.has(t.name) && 
            !roomProctorsHistory[roomObj.name].has(t.name)
          );

          // Fallback if no such proctor is available
          if (!examiner) {
            examiner = proctorsList.find(t => !proctorsInSession.has(t.name));
          }

          const examinerName = examiner ? examiner.name : 'GV Coi Thi';
          proctorsInSession.add(examinerName);
          roomProctorsHistory[roomObj.name].add(examinerName);

          const slotId = `EX-${semester}-${gradeNum}-${roomObj.name.replace(/\s+/g, '')}-${day}-${session}`;
          const examSlot: ExamSlot = {
            id: slotId,
            semester,
            classId: `Khối ${gradeNum}`,
            day,
            session,
            subject: sub.name,
            room: roomObj.name,
            examiner: examinerName,
            candidates: candidateIds
          };

          await saveExamSlot(examSlot);
        }
      }
    }
  }
}


// QA Inspections CRUD
export async function getQAInspections(): Promise<QAInspection[]> {
  return getCollectionData<QAInspection>('qaInspections', DEFAULT_QA_INSPECTIONS, seedQAInspections);
}
export async function saveQAInspection(insp: QAInspection): Promise<void> {
  return saveDocument<QAInspection>('qaInspections', insp);
}
export async function deleteQAInspection(id: string): Promise<void> {
  return deleteDocument('qaInspections', id);
}
export async function seedQAInspections(): Promise<void> {
  for (const item of DEFAULT_QA_INSPECTIONS) {
    await setDoc(doc(db, 'qaInspections', item.id), item);
  }
}

// QA Evidence CRUD
export async function getQAEvidence(): Promise<QAEvidence[]> {
  return getCollectionData<QAEvidence>('qaEvidence', DEFAULT_QA_EVIDENCE, seedQAEvidence);
}
export async function saveQAEvidenceItem(ev: QAEvidence): Promise<void> {
  return saveDocument<QAEvidence>('qaEvidence', ev);
}
export async function deleteQAEvidenceItem(id: string): Promise<void> {
  return deleteDocument('qaEvidence', id);
}
export async function seedQAEvidence(): Promise<void> {
  for (const item of DEFAULT_QA_EVIDENCE) {
    await setDoc(doc(db, 'qaEvidence', item.id), item);
  }
}

// Exam Plans CRUD
export async function getExamPlans(): Promise<ExamPlan[]> {
  return getCollectionData<ExamPlan>('examPlans', DEFAULT_EXAM_PLANS, seedExamPlans);
}
export async function saveExamPlan(item: ExamPlan): Promise<void> {
  return saveDocument<ExamPlan>('examPlans', item);
}
export async function deleteExamPlan(id: string): Promise<void> {
  return deleteDocument('examPlans', id);
}
export async function seedExamPlans(): Promise<void> {
  for (const item of DEFAULT_EXAM_PLANS) {
    await setDoc(doc(db, 'examPlans', item.id), item);
  }
}

// Meals CRUD
export async function getMeals(): Promise<Meal[]> {
  return getCollectionData<Meal>('meals', DEFAULT_MEALS, seedMeals);
}
export async function saveMeal(item: Meal): Promise<void> {
  return saveDocument<Meal>('meals', item);
}
export async function deleteMeal(id: string): Promise<void> {
  return deleteDocument('meals', id);
}
export async function seedMeals(): Promise<void> {
  for (const item of DEFAULT_MEALS) {
    await setDoc(doc(db, 'meals', item.id), item);
  }
}

// Boarding Rooms CRUD
export async function getBoardingRooms(): Promise<BoardingRoom[]> {
  return getCollectionData<BoardingRoom>('boardingRooms', DEFAULT_BOARDING_ROOMS, seedBoardingRooms);
}
export async function saveBoardingRoom(item: BoardingRoom): Promise<void> {
  return saveDocument<BoardingRoom>('boardingRooms', item);
}
export async function deleteBoardingRoom(id: string): Promise<void> {
  return deleteDocument('boardingRooms', id);
}
export async function seedBoardingRooms(): Promise<void> {
  for (const item of DEFAULT_BOARDING_ROOMS) {
    await setDoc(doc(db, 'boardingRooms', item.id), item);
  }
}

// Suppliers CRUD
export async function getSuppliers(): Promise<Supplier[]> {
  return getCollectionData<Supplier>('suppliers', DEFAULT_SUPPLIERS, seedSuppliers);
}
export async function saveSupplier(item: Supplier): Promise<void> {
  return saveDocument<Supplier>('suppliers', item);
}
export async function deleteSupplier(id: string): Promise<void> {
  return deleteDocument('suppliers', id);
}
export async function seedSuppliers(): Promise<void> {
  for (const item of DEFAULT_SUPPLIERS) {
    await setDoc(doc(db, 'suppliers', item.id), item);
  }
}

// Schedules CRUD
export async function getSchedules(): Promise<Schedule[]> {
  return getCollectionData<Schedule>('schedules', DEFAULT_SCHEDULES, seedSchedules);
}
export async function saveSchedule(item: Schedule): Promise<void> {
  return saveDocument<Schedule>('schedules', item);
}
export async function deleteSchedule(id: string): Promise<void> {
  return deleteDocument('schedules', id);
}
export async function seedSchedules(): Promise<void> {
  for (const item of DEFAULT_SCHEDULES) {
    await setDoc(doc(db, 'schedules', item.id), item);
  }
}

// Storages CRUD
export async function getStorages(): Promise<StorageItem[]> {
  return getCollectionData<StorageItem>('storages', DEFAULT_STORAGES, seedStorages);
}
export async function saveStorageItem(item: StorageItem): Promise<void> {
  return saveDocument<StorageItem>('storages', item);
}
export async function deleteStorageItem(id: string): Promise<void> {
  return deleteDocument('storages', id);
}
export async function seedStorages(): Promise<void> {
  for (const item of DEFAULT_STORAGES) {
    await setDoc(doc(db, 'storages', item.id), item);
  }
}

// Youth Union Stats CRUD
export async function getYouthUnionStats(): Promise<YouthUnionStat[]> {
  return getCollectionData<YouthUnionStat>('youthUnionStats', DEFAULT_YOUTH_UNION_STATS, seedYouthUnionStats);
}
export async function saveYouthUnionStat(item: YouthUnionStat): Promise<void> {
  return saveDocument<YouthUnionStat>('youthUnionStats', item);
}
export async function seedYouthUnionStats(): Promise<void> {
  for (const item of DEFAULT_YOUTH_UNION_STATS) {
    await setDoc(doc(db, 'youthUnionStats', item.id), item);
  }
}

export interface AdmissionRecord {
  id: string;
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  hometown: string;
  parentName: string;
  parentPhone: string;
  address: string;
  secondarySchool: string;
  gpa6: number;
  gpa7: number;
  gpa8: number;
  gpa9: number;
  academicClass9: 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu';
  conductClass9: 'Tốt' | 'Khá' | 'Trung bình';
  notes?: string;
  status: 'Chờ Duyệt' | 'Đã Tiếp Nhận' | 'Cần Bổ Sung' | 'Từ Chối';
  createdAt: string;
  isFromAnHuu?: boolean;
  thcsStudentCode?: string;
  detailedGrades9?: Array<{
    subjectName: string;
    term1?: number;
    term2?: number;
    annual?: number;
    comment?: string;
  }>;
  gpa3Subjects9?: number;
}


export const DEFAULT_ADMISSIONS: AdmissionRecord[] = [];

// Admissions CRUD
export async function getAdmissions(): Promise<AdmissionRecord[]> {
  return getCollectionData<AdmissionRecord>('admissions', DEFAULT_ADMISSIONS, seedAdmissions);
}
export async function saveAdmission(item: AdmissionRecord): Promise<void> {
  return saveDocument<AdmissionRecord>('admissions', item);
}
export async function deleteAdmission(id: string): Promise<void> {
  return deleteDocument('admissions', id);
}
export async function seedAdmissions(): Promise<void> {
  for (const item of DEFAULT_ADMISSIONS) {
    await setDoc(doc(db, 'admissions', item.id), item);
  }
}

// Global seeding function to seed ALL collections
export async function seedAllDatabase(): Promise<void> {
  await seedClasses();
  await seedDepartments();
  await seedSubjects();

  await seedRooms();
  await seedEquipments();
  await seedMaintenances();
  await seedPlans();
  await seedPartyUnionDocs();
  await seedInboundReceipts();
  await seedAdminDocuments();
  await seedHealthRecords();
  await seedHealthInventory();
  await seedHealthIncidents();
  await seedFinanceReceipts();
  await seedFinanceTransactions();
  await seedCounselingAppointments();
  await seedCounselingUniversities();
  await seedYouthUnionMembers();
  await seedYouthUnionCampaigns();
  await seedYouthUnionEmulations();
  await seedTeacherAssignments();
  await seedTimetables();
  await seedQAInspections();
  await seedQAEvidence();
  await seedExamPlans();
  await seedMeals();
  await seedBoardingRooms();
  await seedSuppliers();
  await seedSchedules();
  await seedStorages();
  await seedYouthUnionStats();
  await seedAdmissions();
  await seedLessonDiaries();

  // Seed new clerical collections
  await seedClericalRequests();
  await seedClericalDegreeStocks();
  await seedClericalDegreeAllocations();
  await seedClericalAnnouncements();
  await seedClericalTravelPapers();

  // Seed new library collections
  await seedLibraryBooks();
  await seedLibraryTransactions();
  await seedLibraryReaders();
  await seedLibraryInventoryReports();
  await seedLibraryPurchaseRequests();
}

// Lesson Diary CRUD
export interface LessonDiary {
  id: string;
  classId: string;
  date: string;
  period: number;
  subject: string;
  teacher: string;
  content: string;
  comment: string;
  rating: 'Tốt' | 'Khá' | 'TB' | 'Yếu';
}

export const DEFAULT_LESSON_DIARIES: LessonDiary[] = [
  {
    id: 'LD-01',
    classId: '1A1',
    date: '19/06/2026',
    period: 1,
    subject: 'Tin học',
    teacher: 'Cô Trần Thị Kim Oanh',
    content: 'Cấu trúc lặp và vòng lặp for',
    comment: 'Lớp học hăng hái phát biểu, thực hành tốt.',
    rating: 'Tốt'
  },
  {
    id: 'LD-02',
    classId: '1A1',
    date: '19/06/2026',
    period: 2,
    subject: 'Toán học',
    teacher: 'Thầy Nguyễn Trung Nghĩa',
    content: 'Ôn tập phương trình lượng giác',
    comment: 'Một số học sinh chưa làm bài tập về nhà.',
    rating: 'Khá'
  }
];

export async function getLessonDiaries(): Promise<LessonDiary[]> {
  return getCollectionData<LessonDiary>('lessonDiaries', DEFAULT_LESSON_DIARIES, seedLessonDiaries);
}

export async function saveLessonDiary(diary: LessonDiary): Promise<void> {
  return saveDocument<LessonDiary>('lessonDiaries', diary);
}

export async function deleteLessonDiary(id: string): Promise<void> {
  return deleteDocument('lessonDiaries', id);
}

export async function seedLessonDiaries(): Promise<void> {
  for (const item of DEFAULT_LESSON_DIARIES) {
    await setDoc(doc(db, 'lessonDiaries', item.id), item);
  }
}

/* --- CLERICAL REAL DATA WORKFLOWS --- */

export interface AdminRequest {
  id: string;
  studentName: string;
  className: string;
  type: 'Bản sao Học bạ' | 'Thẻ học sinh cấp lại' | 'Giấy xác nhận học sinh';
  date: string;
  reason: string;
  status: 'Chờ xử lý' | 'Đã cấp' | 'Từ chối';
  rejectReason?: string;
  processedDate?: string;
}

export interface DegreeStock {
  id: string;
  year: string;
  total: number;
  issued: number;
  damaged: number;
  remaining: number;
}

export interface DegreeAllocation {
  id: string;
  studentName: string;
  dob: string;
  gradYear: string;
  serial: string;
  recipient: string;
  date: string;
  status: 'Đã nhận' | 'Chưa nhận';
}

export interface SchoolAnnouncement {
  id: string;
  title: string;
  content: string;
  scope: 'Tất cả' | 'Giáo viên' | 'Học sinh & Phụ huynh';
  priority: 'Khẩn' | 'Thường';
  date: string;
  author: string;
}

export interface TravelPaper {
  id: string;
  type: 'Giấy Đi Đường' | 'Giấy Giới Thiệu';
  name: string;
  role: string;
  purpose: string;
  destination: string;
  vehicle?: string;
  startDate: string;
  endDate: string;
  dateCreated: string;
  status: 'Đã ký' | 'Chờ duyệt';
}

export const DEFAULT_REQUESTS: AdminRequest[] = [
  { id: 'REQ-001', studentName: 'Nguyễn Văn An', className: '1A1', type: 'Bản sao Học bạ', date: '21/06/2026', reason: 'Phụ huynh cần bản sao để nộp hồ sơ chuyển trường.', status: 'Chờ xử lý' },
  { id: 'REQ-002', studentName: 'Trần Thị Bé', className: '11A2', type: 'Giấy xác nhận học sinh', date: '20/06/2026', reason: 'Học sinh cần giấy xác nhận để làm thủ tục xin visa du lịch.', status: 'Chờ xử lý' },
  { id: 'REQ-003', studentName: 'Phạm Minh Hoàng', className: '12A3', type: 'Thẻ học sinh cấp lại', date: '18/06/2026', reason: 'Bị mất thẻ khi tham gia hội trại hè.', status: 'Đã cấp', processedDate: '19/06/2026' }
];

export const DEFAULT_DEGREE_STOCKS: DegreeStock[] = [
  { id: 'STK-2026', year: '2026', total: 350, issued: 342, damaged: 2, remaining: 6 },
  { id: 'STK-2025', year: '2025', total: 320, issued: 320, damaged: 0, remaining: 0 }
];

export const DEFAULT_DEGREE_ALLOCATIONS: DegreeAllocation[] = [
  { id: 'DG-2026-001', studentName: 'Lê Văn Cường', dob: '15/06/2018', gradYear: '2026', serial: 'A-2026-9871', recipient: 'Bố đẻ Lê Văn Dũng', date: '20/06/2026', status: 'Đã nhận' },
  { id: 'DG-2026-002', studentName: 'Nguyễn Thu Hà', dob: '22/09/2018', gradYear: '2026', serial: 'A-2026-9872', recipient: 'Học sinh tự nhận', date: '21/06/2026', status: 'Đã nhận' }
];

export const DEFAULT_ANNOUNCEMENTS: SchoolAnnouncement[] = [
  { id: 'ANN-001', title: 'Thông báo kế hoạch ôn tập hè và tổ chức thi khảo sát đầu năm', content: 'Ban Giám hiệu thông báo toàn thể học sinh các khối lớp tập trung ôn tập chuẩn bị cho kỳ khảo sát chất lượng đầu năm học 2026-2027.', scope: 'Tất cả', priority: 'Khẩn', date: '21/06/2026', author: 'Thư ký Hội đồng' },
  { id: 'ANN-002', title: 'Kế hoạch tổ chức Lễ Khai giảng Năm học mới 2026 - 2027', content: 'Kế hoạch tổ chức Lễ Khai giảng chính thức vào lúc 7h30 sáng ngày 05/09/2026. Yêu cầu toàn thể giáo viên và cán bộ nhân viên phối hợp chuẩn bị khánh tiết.', scope: 'Giáo viên', priority: 'Thường', date: '20/06/2026', author: 'Văn phòng Nhà trường' }
];

export const DEFAULT_TRAVEL_PAPERS: TravelPaper[] = [
  { id: 'GT-001', type: 'Giấy Giới Thiệu', name: 'Nguyễn Văn Thành', role: 'Giáo viên Vật lý', purpose: 'Đưa đội tuyển học sinh giỏi đi thi cấp tỉnh tại Mỹ Tho', destination: 'Sở Giáo dục và Đào tạo Tiền Giang', dateCreated: '20/06/2026', startDate: '22/06/2026', endDate: '23/06/2026', status: 'Đã ký' }
];

export async function getClericalRequests(): Promise<AdminRequest[]> {
  return getCollectionData<AdminRequest>('clericalRequests', DEFAULT_REQUESTS, seedClericalRequests);
}
export async function saveClericalRequest(item: AdminRequest): Promise<void> {
  return saveDocument<AdminRequest>('clericalRequests', item);
}
export async function deleteClericalRequest(id: string): Promise<void> {
  return deleteDocument('clericalRequests', id);
}
export async function seedClericalRequests(): Promise<void> {
  for (const item of DEFAULT_REQUESTS) {
    await setDoc(doc(db, 'clericalRequests', item.id), item);
  }
}

export async function getClericalDegreeStocks(): Promise<DegreeStock[]> {
  return getCollectionData<DegreeStock>('clericalDegreeStocks', DEFAULT_DEGREE_STOCKS, seedClericalDegreeStocks);
}
export async function saveClericalDegreeStock(item: DegreeStock): Promise<void> {
  return saveDocument<DegreeStock>('clericalDegreeStocks', item);
}
export async function deleteClericalDegreeStock(id: string): Promise<void> {
  return deleteDocument('clericalDegreeStocks', id);
}
export async function seedClericalDegreeStocks(): Promise<void> {
  for (const item of DEFAULT_DEGREE_STOCKS) {
    await setDoc(doc(db, 'clericalDegreeStocks', item.id), item);
  }
}

export async function getClericalDegreeAllocations(): Promise<DegreeAllocation[]> {
  return getCollectionData<DegreeAllocation>('clericalDegreeAllocations', DEFAULT_DEGREE_ALLOCATIONS, seedClericalDegreeAllocations);
}
export async function saveClericalDegreeAllocation(item: DegreeAllocation): Promise<void> {
  return saveDocument<DegreeAllocation>('clericalDegreeAllocations', item);
}
export async function deleteClericalDegreeAllocation(id: string): Promise<void> {
  return deleteDocument('clericalDegreeAllocations', id);
}
export async function seedClericalDegreeAllocations(): Promise<void> {
  for (const item of DEFAULT_DEGREE_ALLOCATIONS) {
    await setDoc(doc(db, 'clericalDegreeAllocations', item.id), item);
  }
}

export async function getClericalAnnouncements(): Promise<SchoolAnnouncement[]> {
  return getCollectionData<SchoolAnnouncement>('clericalAnnouncements', DEFAULT_ANNOUNCEMENTS, seedClericalAnnouncements);
}
export async function saveClericalAnnouncement(item: SchoolAnnouncement): Promise<void> {
  return saveDocument<SchoolAnnouncement>('clericalAnnouncements', item);
}
export async function deleteClericalAnnouncement(id: string): Promise<void> {
  return deleteDocument('clericalAnnouncements', id);
}
export async function seedClericalAnnouncements(): Promise<void> {
  for (const item of DEFAULT_ANNOUNCEMENTS) {
    await setDoc(doc(db, 'clericalAnnouncements', item.id), item);
  }
}

export async function getClericalTravelPapers(): Promise<TravelPaper[]> {
  return getCollectionData<TravelPaper>('clericalTravelPapers', DEFAULT_TRAVEL_PAPERS, seedClericalTravelPapers);
}
export async function saveClericalTravelPaper(item: TravelPaper): Promise<void> {
  return saveDocument<TravelPaper>('clericalTravelPapers', item);
}
export async function deleteClericalTravelPaper(id: string): Promise<void> {
  return deleteDocument('clericalTravelPapers', id);
}
export async function seedClericalTravelPapers(): Promise<void> {
  for (const item of DEFAULT_TRAVEL_PAPERS) {
    await setDoc(doc(db, 'clericalTravelPapers', item.id), item);
  }
}

/* --- LIBRARY REAL DATA WORKFLOWS --- */

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: 'Sách giáo khoa' | 'Sách tham khảo' | 'Văn học' | 'Truyện tranh' | 'Báo & Tạp chí';
  shelf: string;
  totalCopies: number;
  availableCopies: number;
  status: 'Sẵn sàng mượn' | 'Đã cho mượn' | 'Đang sửa chữa' | 'Đã thanh lý';
}

export interface LibraryTransaction {
  id: string;
  readerId: string;
  readerName: string;
  readerClass: string;
  bookId: string;
  bookTitle: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  type: 'Mang về' | 'Đọc tại chỗ';
  status: 'Đang mượn' | 'Đã trả' | 'Quá hạn' | 'Mất hỏng';
  compensationFee?: number;
  compensationPaid?: boolean;
}

export interface LibraryReader {
  id: string;
  name: string;
  role: 'Học sinh' | 'Giáo viên';
  classOrDept: string;
  activeLoansCount: number;
  totalLoansCount: number;
}

export interface LibraryInventoryReport {
  id: string;
  date: string;
  operator: string;
  totalSystem: number;
  totalActual: number;
  discrepancy: number;
  notes: string;
}

export interface LibraryPurchaseRequest {
  id: string;
  title: string;
  date: string;
  items: string;
  reason: string;
  budget: number;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';
}

export const DEFAULT_LIBRARY_BOOKS: LibraryBook[] = [
  { id: 'BK-001', isbn: '9786040188981', title: 'Sách giáo khoa Toán 10 - Tập 1', author: 'Nhiều tác giả', category: 'Sách giáo khoa', shelf: 'Kệ A - Tầng 1', totalCopies: 25, availableCopies: 22, status: 'Sẵn sàng mượn' },
  { id: 'BK-002', isbn: '9786040188998', title: 'Sách giáo khoa Ngữ văn 10 - Tập 1', author: 'Nhiều tác giả', category: 'Sách giáo khoa', shelf: 'Kệ A - Tầng 2', totalCopies: 20, availableCopies: 18, status: 'Sẵn sàng mượn' },
  { id: 'BK-003', isbn: '9786043152003', title: 'Truyện Kiều (Tái bản)', author: 'Nguyễn Du', category: 'Văn học', shelf: 'Kệ B - Tầng 1', totalCopies: 5, availableCopies: 3, status: 'Sẵn sàng mượn' },
  { id: 'BK-004', isbn: '9786042123456', title: 'Dế Mèn Phiêu Lưu Ký', author: 'Tô Hoài', category: 'Văn học', shelf: 'Kệ B - Tầng 3', totalCopies: 10, availableCopies: 10, status: 'Sẵn sàng mượn' },
  { id: 'BK-005', isbn: '9786046152011', title: 'Vật lí đại cương & Ứng dụng', author: 'Nguyễn Văn A', category: 'Sách tham khảo', shelf: 'Kệ C - Tầng 1', totalCopies: 8, availableCopies: 5, status: 'Sẵn sàng mượn' }
];

export const DEFAULT_LIBRARY_TRANSACTIONS: LibraryTransaction[] = [
  { id: 'TX-LIB-001', readerId: 'HS-2026-001', readerName: 'Nguyễn Văn An', readerClass: '1A1', bookId: 'BK-001', bookTitle: 'Sách giáo khoa Toán 10 - Tập 1', borrowDate: '10/06/2026', dueDate: '17/06/2026', returnDate: '16/06/2026', type: 'Mang về', status: 'Đã trả' },
  { id: 'TX-LIB-002', readerId: 'HS-2026-002', readerName: 'Trần Thị Bé', readerClass: '11A2', bookId: 'BK-003', bookTitle: 'Truyện Kiều (Tái bản)', borrowDate: '12/06/2026', dueDate: '19/06/2026', returnDate: undefined, type: 'Mang về', status: 'Quá hạn' },
  { id: 'TX-LIB-003', readerId: 'GV-001', readerName: 'Thầy Trần Minh Triết', readerClass: 'Tổ Toán - Tin', bookId: 'BK-005', bookTitle: 'Vật lí đại cương & Ứng dụng', borrowDate: '20/06/2026', dueDate: '04/07/2026', returnDate: undefined, type: 'Mang về', status: 'Đang mượn' }
];

export const DEFAULT_LIBRARY_READERS: LibraryReader[] = [
  { id: 'HS-2026-001', name: 'Nguyễn Văn An', role: 'Học sinh', classOrDept: '1A1', activeLoansCount: 0, totalLoansCount: 5 },
  { id: 'HS-2026-002', name: 'Trần Thị Bé', role: 'Học sinh', classOrDept: '11A2', activeLoansCount: 1, totalLoansCount: 3 },
  { id: 'GV-001', name: 'Thầy Trần Minh Triết', role: 'Giáo viên', classOrDept: 'Tổ Toán - Tin', activeLoansCount: 1, totalLoansCount: 8 }
];

export const DEFAULT_LIBRARY_INVENTORY: LibraryInventoryReport[] = [
  { id: 'INV-001', date: '01/06/2026', operator: 'Trịnh Thị Thư', totalSystem: 68, totalActual: 68, discrepancy: 0, notes: 'Kiểm kê đầu tháng 6, khớp số lượng.' }
];

export const DEFAULT_LIBRARY_PURCHASE_REQUESTS: LibraryPurchaseRequest[] = [
  { id: 'REQ-LIB-001', title: 'Đề xuất bổ sung Sách tham khảo Bồi dưỡng học sinh giỏi 2026', date: '15/06/2026', items: '20 cuốn Sách bồi dưỡng học sinh giỏi Toán/Lý/Hóa của NXB Giáo Dục', reason: 'Phục vụ cho nhu cầu ôn tập của học sinh khối 5 trong hè.', budget: 1500000, status: 'Chờ duyệt' }
];

export async function getLibraryBooks(): Promise<LibraryBook[]> {
  return getCollectionData<LibraryBook>('libraryBooks', DEFAULT_LIBRARY_BOOKS, seedLibraryBooks);
}
export async function saveLibraryBook(item: LibraryBook): Promise<void> {
  return saveDocument<LibraryBook>('libraryBooks', item);
}
export async function deleteLibraryBook(id: string): Promise<void> {
  return deleteDocument('libraryBooks', id);
}
export async function seedLibraryBooks(): Promise<void> {
  for (const item of DEFAULT_LIBRARY_BOOKS) {
    await setDoc(doc(db, 'libraryBooks', item.id), item);
  }
}

export async function getLibraryTransactions(): Promise<LibraryTransaction[]> {
  return getCollectionData<LibraryTransaction>('libraryTransactions', DEFAULT_LIBRARY_TRANSACTIONS, seedLibraryTransactions);
}
export async function saveLibraryTransaction(item: LibraryTransaction): Promise<void> {
  return saveDocument<LibraryTransaction>('libraryTransactions', item);
}
export async function deleteLibraryTransaction(id: string): Promise<void> {
  return deleteDocument('libraryTransactions', id);
}
export async function seedLibraryTransactions(): Promise<void> {
  for (const item of DEFAULT_LIBRARY_TRANSACTIONS) {
    await setDoc(doc(db, 'libraryTransactions', item.id), item);
  }
}

export async function getLibraryReaders(): Promise<LibraryReader[]> {
  return getCollectionData<LibraryReader>('libraryReaders', DEFAULT_LIBRARY_READERS, seedLibraryReaders);
}
export async function saveLibraryReader(item: LibraryReader): Promise<void> {
  return saveDocument<LibraryReader>('libraryReaders', item);
}
export async function deleteLibraryReader(id: string): Promise<void> {
  return deleteDocument('libraryReaders', id);
}
export async function seedLibraryReaders(): Promise<void> {
  for (const item of DEFAULT_LIBRARY_READERS) {
    await setDoc(doc(db, 'libraryReaders', item.id), item);
  }
}

export async function getLibraryInventoryReports(): Promise<LibraryInventoryReport[]> {
  return getCollectionData<LibraryInventoryReport>('libraryInventory', DEFAULT_LIBRARY_INVENTORY, seedLibraryInventoryReports);
}
export async function saveLibraryInventoryReport(item: LibraryInventoryReport): Promise<void> {
  return saveDocument<LibraryInventoryReport>('libraryInventory', item);
}
export async function deleteLibraryInventoryReport(id: string): Promise<void> {
  return deleteDocument('libraryInventory', id);
}
export async function seedLibraryInventoryReports(): Promise<void> {
  for (const item of DEFAULT_LIBRARY_INVENTORY) {
    await setDoc(doc(db, 'libraryInventory', item.id), item);
  }
}

export async function getLibraryPurchaseRequests(): Promise<LibraryPurchaseRequest[]> {
  return getCollectionData<LibraryPurchaseRequest>('libraryPurchaseRequests', DEFAULT_LIBRARY_PURCHASE_REQUESTS, seedLibraryPurchaseRequests);
}
export async function saveLibraryPurchaseRequest(item: LibraryPurchaseRequest): Promise<void> {
  return saveDocument<LibraryPurchaseRequest>('libraryPurchaseRequests', item);
}
export async function deleteLibraryPurchaseRequest(id: string): Promise<void> {
  return deleteDocument('libraryPurchaseRequests', id);
}
export async function seedLibraryPurchaseRequests(): Promise<void> {
  for (const item of DEFAULT_LIBRARY_PURCHASE_REQUESTS) {
    await setDoc(doc(db, 'libraryPurchaseRequests', item.id), item);
  }
}


/* --- SECURITY WORKSPACE INTERFACES --- */

export interface SecurityVisitor {
  id: string;
  name: string;
  cccd: string;
  hostName: string; // Gặp ai
  purpose: string; // Lý do
  checkInTime: string;
  checkOutTime?: string;
  status: 'Đang ở trường' | 'Đã rời trường';
}

export interface SecurityEarlyDismissal {
  id: string;
  studentName: string;
  className: string;
  allowedTime: string;
  reason: string;
  status: 'Chờ ra cổng' | 'Đã ra cổng' | 'Không được phép';
  approvedBy: string; // GVCN/Giám thị duyệt
  dismissedTime?: string;
}

export interface SecurityAssetPass {
  id: string;
  itemName: string;
  quantity: number;
  approvedBy: string; // Kế toán/BGH duyệt
  reason: string;
  carrierName: string; // Người mang ra
  dateApproved: string;
  status: 'Chờ kiểm tra' | 'Đã cho qua' | 'Bị giữ lại';
  dismissedTime?: string;
}

export interface SecurityPatrol {
  id: string;
  patrolTime: string;
  officerName: string;
  statusDetails: string;
  status: 'Bình thường' | 'Có sự cố' | 'Giao ca thành công';
}

export interface SecurityIncident {
  id: string;
  time: string;
  reporter: string;
  type: 'Ẩu đả' | 'Mất cắp' | 'Cháy nổ' | 'Hỏng hóc CSVC' | 'Khác';
  description: string;
  status: 'Đã báo cáo BGH' | 'Đang xử lý' | 'Đã giải quyết';
  severity: 'Nghiêm trọng' | 'Trung bình' | 'Thấp';
}

export interface SystemShift {
  id: string;
  weekId: string; // e.g. "2026-W26"
  date: string; // "22/06/2026"
  dayOfWeek: number; // 2 -> 8 (Monday -> Sunday)
  roleType: 'security' | 'cleaner' | 'librarian';
  shiftType: string; // "Ca 1", "Ca Sáng", "Hành chính", "Ca Trực trưa", etc.
  staffEmail: string;
  staffName: string;
  locationOrArea: string; // Vị trí trực / khu vực dọn dẹp
  status: 'draft' | 'published';
  notes?: string;
}

export interface SystemAbsence {
  id: string;
  staffEmail: string;
  staffName: string;
  roleType: 'security' | 'cleaner' | 'librarian';
  date: string; // "22/06/2026"
  reason: string;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';
  backupStaffEmail?: string;
  backupStaffName?: string;
  approvedBy?: string;
}

export interface SecurityShift {
  id: string;
  date: string;
  shiftName: 'Ca Sáng (06:00 - 14:00)' | 'Ca Chiều (14:00 - 22:00)' | 'Ca Đêm (22:00 - 06:00)';
  officers: string[];
  status: 'Đã nhận ca' | 'Đang trực' | 'Đã giao ca';
}

export interface SecurityLeave {
  id: string;
  officerName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';
}

export const DEFAULT_SECURITY_VISITORS: SecurityVisitor[] = [
  { id: 'VIS-001', name: 'Nguyễn Văn Hùng', cccd: '079185000123', hostName: 'Cô Lê Thị Thảo (GVCN 1A1)', purpose: 'Phụ huynh gặp trao đổi học tập', checkInTime: '21/06/2026 08:00', checkOutTime: '21/06/2026 09:15', status: 'Đã rời trường' },
  { id: 'VIS-002', name: 'Trần Minh Hải', cccd: '079185000456', hostName: 'Thầy Trần Minh Triết (Tổ Toán)', purpose: 'Bàn giao tài liệu chuyên môn', checkInTime: '21/06/2026 14:30', status: 'Đang ở trường' }
];

export const DEFAULT_SECURITY_EARLY_DISMISSALS: SecurityEarlyDismissal[] = [
  { id: 'ED-001', studentName: 'Lê Văn Cường', className: '1A1', allowedTime: '10:30', reason: 'Bị sốt cao đột xuất, phụ huynh đón', status: 'Đã ra cổng', approvedBy: 'Cô Lê Thị Thảo (GVCN)', dismissedTime: '10:35' },
  { id: 'ED-002', studentName: 'Nguyễn Thu Hà', className: '11A2', allowedTime: '15:30', reason: 'Đại diện trường đi thi học sinh giỏi cấp thị xã', status: 'Chờ ra cổng', approvedBy: 'Thầy Nguyễn Văn Hiệu (Hiệu trưởng)' }
];

export const DEFAULT_SECURITY_ASSET_PASSES: SecurityAssetPass[] = [
  { id: 'PASS-001', itemName: 'Tivi Sony 55 inch (Hỏng nguồn)', quantity: 1, approvedBy: 'Thầy Phan Văn F (Kế toán trưởng)', reason: 'Mang đi bảo hành chính hãng', carrierName: 'Trung tâm sửa chữa Điện máy Xanh', dateApproved: '21/06/2026', status: 'Đã cho qua', dismissedTime: '09:00' },
  { id: 'PASS-002', itemName: 'Máy chiếu Epson (Mượn sự kiện)', quantity: 2, approvedBy: 'Thầy Vũ Văn Hành (Thư ký)', reason: 'Trả thiết bị thuê ngoài', carrierName: 'Anh Vũ Văn Nam (Đơn vị sự kiện)', dateApproved: '21/06/2026', status: 'Chờ kiểm tra' }
];

export const DEFAULT_SECURITY_PATROLS: SecurityPatrol[] = [
  { id: 'PAT-001', patrolTime: '20/06/2026 22:30', officerName: 'Nguyễn Văn Bảo', statusDetails: 'Kiểm tra dãy A, B. Đã ngắt điện toàn bộ phòng học. Khóa cửa cổng chính.', status: 'Bình thường' },
  { id: 'PAT-002', patrolTime: '21/06/2026 06:00', officerName: 'Vũ Văn Hành', statusDetails: 'Giao ca sáng. Nhận bàn giao nguyên trạng thiết bị phòng trực cổng, bàn giao khóa các lớp.', status: 'Giao ca thành công' }
];

export const DEFAULT_SECURITY_INCIDENTS: SecurityIncident[] = [
  { id: 'INC-001', time: '21/06/2026 09:30', reporter: 'Nguyễn Văn Bảo', type: 'Hỏng hóc CSVC', description: 'Phát hiện vỡ kính cửa sổ phòng học lớp 1A1 do gió lớn đập mạnh.', status: 'Đang xử lý', severity: 'Trung bình' }
];

export const DEFAULT_SECURITY_SHIFTS: SecurityShift[] = [
  { id: 'SH-001', date: '21/06/2026', shiftName: 'Ca Sáng (06:00 - 14:00)', officers: ['Bác Nguyễn Văn Bảo', 'Chú Nguyễn Văn B'], status: 'Đã giao ca' },
  { id: 'SH-002', date: '21/06/2026', shiftName: 'Ca Chiều (14:00 - 22:00)', officers: ['Chú Nguyễn Văn B', 'Anh Lê Văn C'], status: 'Đang trực' },
  { id: 'SH-003', date: '21/06/2026', shiftName: 'Ca Đêm (22:00 - 06:00)', officers: ['Bác Nguyễn Văn Bảo'], status: 'Đã nhận ca' }
];

export const DEFAULT_SECURITY_LEAVES: SecurityLeave[] = [
  { id: 'LV-001', officerName: 'Lê Văn C', startDate: '25/06/2026', endDate: '26/06/2026', reason: 'Về quê có đám giỗ gia đình', status: 'Chờ duyệt' }
];

/* --- SECURITY WORKSPACE CRUD FUNCTIONS --- */

export async function getSecurityVisitors(): Promise<SecurityVisitor[]> {
  return getCollectionData<SecurityVisitor>('securityVisitors', DEFAULT_SECURITY_VISITORS, seedSecurityVisitors);
}
export async function saveSecurityVisitor(item: SecurityVisitor): Promise<void> {
  return saveDocument<SecurityVisitor>('securityVisitors', item);
}
export async function deleteSecurityVisitor(id: string): Promise<void> {
  return deleteDocument('securityVisitors', id);
}
export async function seedSecurityVisitors(): Promise<void> {
  for (const item of DEFAULT_SECURITY_VISITORS) {
    await setDoc(doc(db, 'securityVisitors', item.id), item);
  }
}

export async function getSecurityEarlyDismissals(): Promise<SecurityEarlyDismissal[]> {
  return getCollectionData<SecurityEarlyDismissal>('securityEarlyDismissals', DEFAULT_SECURITY_EARLY_DISMISSALS, seedSecurityEarlyDismissals);
}
export async function saveSecurityEarlyDismissal(item: SecurityEarlyDismissal): Promise<void> {
  return saveDocument<SecurityEarlyDismissal>('securityEarlyDismissals', item);
}
export async function deleteSecurityEarlyDismissal(id: string): Promise<void> {
  return deleteDocument('securityEarlyDismissals', id);
}
export async function seedSecurityEarlyDismissals(): Promise<void> {
  for (const item of DEFAULT_SECURITY_EARLY_DISMISSALS) {
    await setDoc(doc(db, 'securityEarlyDismissals', item.id), item);
  }
}

export async function getSecurityAssetPasses(): Promise<SecurityAssetPass[]> {
  return getCollectionData<SecurityAssetPass>('securityAssetPasses', DEFAULT_SECURITY_ASSET_PASSES, seedSecurityAssetPasses);
}
export async function saveSecurityAssetPass(item: SecurityAssetPass): Promise<void> {
  return saveDocument<SecurityAssetPass>('securityAssetPasses', item);
}
export async function deleteSecurityAssetPass(id: string): Promise<void> {
  return deleteDocument('securityAssetPasses', id);
}
export async function seedSecurityAssetPasses(): Promise<void> {
  for (const item of DEFAULT_SECURITY_ASSET_PASSES) {
    await setDoc(doc(db, 'securityAssetPasses', item.id), item);
  }
}

export async function getSecurityPatrols(): Promise<SecurityPatrol[]> {
  return getCollectionData<SecurityPatrol>('securityPatrols', DEFAULT_SECURITY_PATROLS, seedSecurityPatrols);
}
export async function saveSecurityPatrol(item: SecurityPatrol): Promise<void> {
  return saveDocument<SecurityPatrol>('securityPatrols', item);
}
export async function deleteSecurityPatrol(id: string): Promise<void> {
  return deleteDocument('securityPatrols', id);
}
export async function seedSecurityPatrols(): Promise<void> {
  for (const item of DEFAULT_SECURITY_PATROLS) {
    await setDoc(doc(db, 'securityPatrols', item.id), item);
  }
}

export async function getSecurityIncidents(): Promise<SecurityIncident[]> {
  return getCollectionData<SecurityIncident>('securityIncidents', DEFAULT_SECURITY_INCIDENTS, seedSecurityIncidents);
}
export async function saveSecurityIncident(item: SecurityIncident): Promise<void> {
  return saveDocument<SecurityIncident>('securityIncidents', item);
}
export async function deleteSecurityIncident(id: string): Promise<void> {
  return deleteDocument('securityIncidents', id);
}
export async function seedSecurityIncidents(): Promise<void> {
  for (const item of DEFAULT_SECURITY_INCIDENTS) {
    await setDoc(doc(db, 'securityIncidents', item.id), item);
  }
}

export async function getSecurityShifts(): Promise<SecurityShift[]> {
  return getCollectionData<SecurityShift>('securityShifts', DEFAULT_SECURITY_SHIFTS, seedSecurityShifts);
}
export async function saveSecurityShift(item: SecurityShift): Promise<void> {
  return saveDocument<SecurityShift>('securityShifts', item);
}
export async function deleteSecurityShift(id: string): Promise<void> {
  return deleteDocument('securityShifts', id);
}
export async function seedSecurityShifts(): Promise<void> {
  for (const item of DEFAULT_SECURITY_SHIFTS) {
    await setDoc(doc(db, 'securityShifts', item.id), item);
  }
}

export async function getSecurityLeaves(): Promise<SecurityLeave[]> {
  return getCollectionData<SecurityLeave>('securityLeaves', DEFAULT_SECURITY_LEAVES, seedSecurityLeaves);
}
export async function saveSecurityLeave(item: SecurityLeave): Promise<void> {
  return saveDocument<SecurityLeave>('securityLeaves', item);
}
export async function deleteSecurityLeave(id: string): Promise<void> {
  return deleteDocument('securityLeaves', id);
}
export async function seedSecurityLeaves(): Promise<void> {
  for (const item of DEFAULT_SECURITY_LEAVES) {
    await setDoc(doc(db, 'securityLeaves', item.id), item);
  }
}

// --- Cleaner / Janitor Module Types & Services ---

export interface CleanerTask {
  id: string;
  title: string;
  location: string;
  timeSlot: 'Sáng' | 'Trưa' | 'Chiều' | 'Đột xuất';
  status: 'Chưa bắt đầu' | 'Đang thực hiện' | 'Hoàn thành' | 'Đã nghiệm thu';
  assignedTo: string; // email
  createdAt: string;
  updatedAt: string;
  notes?: string;
  photoUrl?: string;
  isUrgent: boolean;
  reportedBy?: string;
}

export interface CleanerSupplyRequest {
  id: string;
  supplyName: string;
  quantityRequested: number;
  quantityApproved?: number;
  requestedBy: string; // email
  requestedAt: string;
  status: 'Chờ phê duyệt' | 'Đã phê duyệt' | 'Đã từ chối' | 'Đã cấp phát';
  approvedBy?: string; // name of approver
  approvedAt?: string;
  notes?: string;
}

export interface CleanerIncident {
  id: string;
  title: string;
  location: string;
  description: string;
  reportedBy: string; // email
  reportedAt: string;
  status: 'Mới' | 'Đã tiếp nhận' | 'Đang sửa chữa' | 'Đã khắc phục';
  photoUrl?: string;
}

export const DEFAULT_CLEANER_TASKS: CleanerTask[] = [
  { id: 'CLT-001', title: 'Dọn nhà vệ sinh nam tầng 1', location: 'Khu vệ sinh tầng 1 dãy A', timeSlot: 'Sáng', status: 'Hoàn thành', assignedTo: 'tapvu@cleaner.mnah.edu.vn', createdAt: '21/06/2026 07:00', updatedAt: '21/06/2026 08:00', isUrgent: false },
  { id: 'CLT-002', title: 'Đổ rác các lớp học Khối 1', location: 'Hành lang Khối 1 dãy B', timeSlot: 'Sáng', status: 'Hoàn thành', assignedTo: 'tapvu@cleaner.mnah.edu.vn', createdAt: '21/06/2026 07:30', updatedAt: '21/06/2026 08:45', isUrgent: false },
  { id: 'CLT-003', title: 'Lau sàn hành lang tầng 2 dãy A', location: 'Hành lang Tầng 2 dãy A', timeSlot: 'Chiều', status: 'Chưa bắt đầu', assignedTo: 'tapvu@cleaner.mnah.edu.vn', createdAt: '21/06/2026 08:00', updatedAt: '21/06/2026 08:00', isUrgent: false },
  { id: 'CLT-004', title: 'Khẩn cấp: Lau dọn nước tràn tại Lớp 1A2 (Tiết 3)', location: 'Phòng học 10A2', timeSlot: 'Đột xuất', status: 'Chưa bắt đầu', assignedTo: '', createdAt: '21/06/2026 09:15', updatedAt: '21/06/2026 09:15', isUrgent: true, reportedBy: 'Cô Lê Thị Thảo (GVCN 1A1)', notes: 'Học sinh làm đổ nước ngọt ra sàn trong giờ ra chơi' },
  { id: 'CLT-005', title: 'Chuẩn bị nước suối & khăn bàn Phòng họp Hội đồng', location: 'Phòng họp Hội đồng (Tầng 2)', timeSlot: 'Chiều', status: 'Chưa bắt đầu', assignedTo: 'tapvu@cleaner.mnah.edu.vn', createdAt: '21/06/2026 09:00', updatedAt: '21/06/2026 09:00', isUrgent: false, notes: 'Họp Hội đồng sư phạm lúc 13:30' },
  { id: 'CLT-006', title: 'Dọn dẹp sân trường sau giờ ra chơi', location: 'Sân trường chính', timeSlot: 'Trưa', status: 'Đang thực hiện', assignedTo: 'co.can@cleaner.mnah.edu.vn', createdAt: '21/06/2026 08:30', updatedAt: '21/06/2026 09:40', isUrgent: false }
];

export const DEFAULT_CLEANER_SUPPLY_REQUESTS: CleanerSupplyRequest[] = [
  { id: 'CSR-001', supplyName: 'Nước lau sàn Sunlight 5L', quantityRequested: 2, requestedBy: 'tapvu@cleaner.mnah.edu.vn', requestedAt: '18/06/2026 08:30', status: 'Đã cấp phát', approvedBy: 'Cô Trần Thị B (Tổ trưởng)', approvedAt: '18/06/2026 09:00' },
  { id: 'CSR-002', supplyName: 'Giấy vệ sinh cuộn lớn', quantityRequested: 10, requestedBy: 'co.can@cleaner.mnah.edu.vn', requestedAt: '20/06/2026 07:15', status: 'Chờ phê duyệt' },
  { id: 'CSR-003', supplyName: 'Nước tẩy bồn cầu Vim 1L', quantityRequested: 5, requestedBy: 'tapvu@cleaner.mnah.edu.vn', requestedAt: '21/06/2026 09:30', status: 'Chờ phê duyệt' },
  { id: 'CSR-004', supplyName: 'Chổi lau nhà sợi san hô', quantityRequested: 3, requestedBy: 'co.can@cleaner.mnah.edu.vn', requestedAt: '19/06/2026 14:00', status: 'Đã phê duyệt', approvedBy: 'Cô Trần Thị B (Tổ trưởng)', approvedAt: '19/06/2026 14:30' }
];

export const DEFAULT_CLEANER_INCIDENTS: CleanerIncident[] = [
  { id: 'CLI-001', title: 'Bóng đèn tuýp bị cháy', location: 'Phòng học 11A1', description: 'Bóng đèn góc phải bục giảng bị nhấp nháy liên tục rồi cháy hẳn.', reportedBy: 'tapvu@cleaner.mnah.edu.vn', reportedAt: '20/06/2026 10:15', status: 'Đang sửa chữa' },
  { id: 'CLI-002', title: 'Vòi nước rửa tay bị rò rỉ', location: 'Nhà vệ sinh nữ tầng 2 dãy B', description: 'Vòi nước số 2 bị nứt thân ren gây rò rỉ nước liên tục xuống sàn.', reportedBy: 'co.can@cleaner.mnah.edu.vn', reportedAt: '21/06/2026 08:00', status: 'Mới' },
  { id: 'CLI-003', title: 'Hỏng chốt cửa sổ', location: 'Phòng thiết bị Lý', description: 'Chốt cửa sổ hướng nam bị gãy tai sắt không khóa được.', reportedBy: 'tapvu@cleaner.mnah.edu.vn', reportedAt: '19/06/2026 16:30', status: 'Đã khắc phục' }
];

export async function getCleanerTasks(): Promise<CleanerTask[]> {
  return getCollectionData<CleanerTask>('cleanerTasks', DEFAULT_CLEANER_TASKS, seedCleanerTasks);
}
export async function saveCleanerTask(item: CleanerTask): Promise<void> {
  return saveDocument<CleanerTask>('cleanerTasks', item);
}
export async function deleteCleanerTask(id: string): Promise<void> {
  return deleteDocument('cleanerTasks', id);
}
export async function seedCleanerTasks(): Promise<void> {
  for (const item of DEFAULT_CLEANER_TASKS) {
    await setDoc(doc(db, 'cleanerTasks', item.id), item);
  }
}

export async function getCleanerSupplyRequests(): Promise<CleanerSupplyRequest[]> {
  return getCollectionData<CleanerSupplyRequest>('cleanerSupplyRequests', DEFAULT_CLEANER_SUPPLY_REQUESTS, seedCleanerSupplyRequests);
}
export async function saveCleanerSupplyRequest(item: CleanerSupplyRequest): Promise<void> {
  return saveDocument<CleanerSupplyRequest>('cleanerSupplyRequests', item);
}
export async function deleteCleanerSupplyRequest(id: string): Promise<void> {
  return deleteDocument('cleanerSupplyRequests', id);
}
export async function seedCleanerSupplyRequests(): Promise<void> {
  for (const item of DEFAULT_CLEANER_SUPPLY_REQUESTS) {
    await setDoc(doc(db, 'cleanerSupplyRequests', item.id), item);
  }
}

export async function getCleanerIncidents(): Promise<CleanerIncident[]> {
  return getCollectionData<CleanerIncident>('cleanerIncidents', DEFAULT_CLEANER_INCIDENTS, seedCleanerIncidents);
}
export async function saveCleanerIncident(item: CleanerIncident): Promise<void> {
  return saveDocument<CleanerIncident>('cleanerIncidents', item);
}
export async function deleteCleanerIncident(id: string): Promise<void> {
  return deleteDocument('cleanerIncidents', id);
}
export async function seedCleanerIncidents(): Promise<void> {
  for (const item of DEFAULT_CLEANER_INCIDENTS) {
    await setDoc(doc(db, 'cleanerIncidents', item.id), item);
  }
}

export const DEFAULT_SYSTEM_SHIFTS: SystemShift[] = [
  // --- WEEK 26 (22/06/2026 - 28/06/2026) ---
  // Security shifts (Monday)
  { id: 'SYS-SH-001', weekId: '2026-W26', date: '22/06/2026', dayOfWeek: 2, roleType: 'security', shiftType: 'Ca 1 (06:00 - 14:00)', staffEmail: 'security@security.mnah.edu.vn', staffName: 'Bác Nguyễn Văn Bảo', locationOrArea: 'Chốt Cổng chính', status: 'published' },
  { id: 'SYS-SH-002', weekId: '2026-W26', date: '22/06/2026', dayOfWeek: 2, roleType: 'security', shiftType: 'Ca 2 (14:00 - 22:00)', staffEmail: 'hung.baove@security.mnah.edu.vn', staffName: 'Chú Hùng', locationOrArea: 'Tuần tra Dãy phòng học', status: 'published' },
  { id: 'SYS-SH-003', weekId: '2026-W26', date: '22/06/2026', dayOfWeek: 2, roleType: 'security', shiftType: 'Ca 3 (22:00 - 06:00)', staffEmail: 'binh.baove@security.mnah.edu.vn', staffName: 'Chú Bình', locationOrArea: 'Trực Bãi xe', status: 'published' },
  // Cleaners shifts (Monday)
  { id: 'SYS-SH-004', weekId: '2026-W26', date: '22/06/2026', dayOfWeek: 2, roleType: 'cleaner', shiftType: 'Ca Sáng (06:00 - 11:30)', staffEmail: 'tapvu@cleaner.mnah.edu.vn', staffName: 'Cô Phạm Thị Cần', locationOrArea: 'Dãy Khối 1', status: 'published' },
  { id: 'SYS-SH-005', weekId: '2026-W26', date: '22/06/2026', dayOfWeek: 2, roleType: 'cleaner', shiftType: 'Ca Chiều (12:30 - 17:00)', staffEmail: 'binh.tapvu@cleaner.mnah.edu.vn', staffName: 'Cô Bình', locationOrArea: 'Khu Vệ sinh chung', status: 'published' },
  // Librarians shifts (Monday)
  { id: 'SYS-SH-006', weekId: '2026-W26', date: '22/06/2026', dayOfWeek: 2, roleType: 'librarian', shiftType: 'Ca Hành chính (07:00 - 17:00)', staffEmail: 'thuvien@library.mnah.edu.vn', staffName: 'Cô Trịnh Thị Thư', locationOrArea: 'Trực Quầy Mượn/Trả', status: 'published' },
  { id: 'SYS-SH-007', weekId: '2026-W26', date: '22/06/2026', dayOfWeek: 2, roleType: 'librarian', shiftType: 'Ca Trực trưa (11:30 - 13:00)', staffEmail: 'an.thuvien@library.mnah.edu.vn', staffName: 'Cô An', locationOrArea: 'Kiểm kê Kho sách', status: 'published' },

  // Security shifts (Tuesday)
  { id: 'SYS-SH-008', weekId: '2026-W26', date: '23/06/2026', dayOfWeek: 3, roleType: 'security', shiftType: 'Ca 1 (06:00 - 14:00)', staffEmail: 'binh.baove@security.mnah.edu.vn', staffName: 'Chú Bình', locationOrArea: 'Chốt Cổng chính', status: 'published' },
  { id: 'SYS-SH-009', weekId: '2026-W26', date: '23/06/2026', dayOfWeek: 3, roleType: 'security', shiftType: 'Ca 2 (14:00 - 22:00)', staffEmail: 'security@security.mnah.edu.vn', staffName: 'Bác Nguyễn Văn Bảo', locationOrArea: 'Trực Bãi xe', status: 'published' },
  // Cleaner shifts (Tuesday)
  { id: 'SYS-SH-010', weekId: '2026-W26', date: '23/06/2026', dayOfWeek: 3, roleType: 'cleaner', shiftType: 'Ca Sáng (06:00 - 11:30)', staffEmail: 'hoa.tapvu@cleaner.mnah.edu.vn', staffName: 'Cô Hoa', locationOrArea: 'Dãy Khối 2 & 12', status: 'published' }
];

export const DEFAULT_SYSTEM_ABSENCES: SystemAbsence[] = [
  { id: 'SYS-AB-001', staffEmail: 'binh.baove@security.mnah.edu.vn', staffName: 'Chú Bình', roleType: 'security', date: '24/06/2026', reason: 'Đi khám bệnh định kỳ tại bệnh viện huyện', status: 'Chờ duyệt', backupStaffEmail: 'hung.baove@security.mnah.edu.vn', backupStaffName: 'Chú Hùng' },
  { id: 'SYS-AB-002', staffEmail: 'tapvu@cleaner.mnah.edu.vn', staffName: 'Cô Phạm Thị Cần', roleType: 'cleaner', date: '25/06/2026', reason: 'Có việc gia đình ở quê', status: 'Đã duyệt', backupStaffEmail: 'binh.tapvu@cleaner.mnah.edu.vn', backupStaffName: 'Cô Bình', approvedBy: 'Thầy Nguyễn Văn Hiệu' }
];

export async function getSystemShifts(): Promise<SystemShift[]> {
  return getCollectionData<SystemShift>('systemShifts', DEFAULT_SYSTEM_SHIFTS, seedSystemShifts);
}

export async function saveSystemShift(item: SystemShift): Promise<void> {
  return saveDocument<SystemShift>('systemShifts', item);
}

export async function deleteSystemShift(id: string): Promise<void> {
  return deleteDocument('systemShifts', id);
}

export async function seedSystemShifts(): Promise<void> {
  for (const item of DEFAULT_SYSTEM_SHIFTS) {
    await setDoc(doc(db, 'systemShifts', item.id), item);
  }
}

export async function getSystemAbsences(): Promise<SystemAbsence[]> {
  return getCollectionData<SystemAbsence>('systemAbsences', DEFAULT_SYSTEM_ABSENCES, seedSystemAbsences);
}

export async function saveSystemAbsence(item: SystemAbsence): Promise<void> {
  return saveDocument<SystemAbsence>('systemAbsences', item);
}

export async function deleteSystemAbsence(id: string): Promise<void> {
  return deleteDocument('systemAbsences', id);
}

export async function seedSystemAbsences(): Promise<void> {
  for (const item of DEFAULT_SYSTEM_ABSENCES) {
    await setDoc(doc(db, 'systemAbsences', item.id), item);
  }
}




