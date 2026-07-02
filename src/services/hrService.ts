import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './firebase';

export interface StaffEvaluation {
  c1Self: string;
  c1Group: string;
  c1Bgh: string;
  c2Self: string;
  c2Group: string;
  c2Bgh: string;
  c3Self: string;
  c3Group: string;
  c3Bgh: string;
  c5Self: string;
  c5Group: string;
  c5Bgh: string;
  initiative: string;
  ratingText: string;
  generalRating: string;
  comment: string;
  status: string;
}

export interface Staff {
  id: string; // Số hiệu viên chức / Mã cán bộ
  name: string; // Họ và tên
  dob: string; // Ngày sinh
  gender: string; // Giới tính
  role: string; // Chức vụ / chức danh hiện tại
  department: string; // Tổ chuyên môn
  phone: string; // Số điện thoại
  email: string; // Hộp thư công vụ
  status: 'Đang Công Tác' | 'Nghỉ Phép' | 'Bình Chỉ / Khóa';
  cccd?: string; // Số CCCD
  address?: string; // Địa chỉ thường trú
  partyJoinDateReserved?: string; // Ngày vào đảng (dự bị)
  partyJoinDateOfficial?: string; // Ngày vào đảng (chính thức)
  politicalTheory?: 'Không' | 'Sơ cấp' | 'Trung cấp' | 'Cao cấp' | string; // Trình độ lý luận chính trị
  educationLevel?: string; // Trình độ đào tạo cao nhất
  major?: string; // Chuyên ngành đào tạo chính
  jobRole?: string; // Vị trí việc làm
  contractType?: string; // Hình thức hợp đồng
  workStatus?: string; // Trạng thái công tác
  professionalTitle?: string; // Chức danh nghề nghiệp
  salaryGrade?: string; // Bậc lương
  salaryFactor?: number | string; // Hệ số lương
  seniorityAllowance?: number | string; // % phụ cấp thâm niên
  preferentialAllowance?: number | string; // % phụ cấp ưu đãi nghề
  assignedClass?: string; // Lớp chủ nhiệm
  mainSubject?: string; // Chuyên môn/Môn học chính phụ trách
  evaluation?: StaffEvaluation; // Kết quả đánh giá chuẩn nghề nghiệp
  personalEmail?: string; // Email cá nhân (Khôi phục)
}

const COLLECTION_NAME = 'staff';

export const DEFAULT_STAFF: Staff[] = [];

/**
 * Fetch all staff members from Firestore.
 * Auto-seeds default records if the database is read successfully but is empty.
 * If authentication is not available or database errors occur, throws compliant JSON error.
 */
export async function getStaffList(): Promise<Staff[]> {
  const localKey = `firestore_fallback_${COLLECTION_NAME}`;
  if (!auth.currentUser) {
    return [];
  }
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: Staff[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Staff);
    });

    localStorage.setItem(localKey, JSON.stringify(list));
    return list;
  } catch (error) {
    console.warn("Firestore getStaffList error, using localStorage fallback:", error);
  }

  const cached = localStorage.getItem(localKey);
  if (cached) {
    try {
      return JSON.parse(cached) as Staff[];
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem(localKey, JSON.stringify(DEFAULT_STAFF));
  return DEFAULT_STAFF;
}

/**
 * Create a new staff document
 */
export async function createStaff(staff: Staff): Promise<void> {
  const localKey = `firestore_fallback_${COLLECTION_NAME}`;
  const docData: any = {
    id: staff.id,
    name: staff.name,
    dob: staff.dob,
    gender: staff.gender,
    role: staff.role,
    department: staff.department,
    phone: staff.phone || '',
    email: staff.email,
    status: staff.status
  };

  if (staff.cccd !== undefined) docData.cccd = staff.cccd;
  if (staff.address !== undefined) docData.address = staff.address;
  if (staff.partyJoinDateReserved !== undefined) docData.partyJoinDateReserved = staff.partyJoinDateReserved;
  if (staff.partyJoinDateOfficial !== undefined) docData.partyJoinDateOfficial = staff.partyJoinDateOfficial;
  if (staff.politicalTheory !== undefined) docData.politicalTheory = staff.politicalTheory;
  if (staff.educationLevel !== undefined) docData.educationLevel = staff.educationLevel;
  if (staff.major !== undefined) docData.major = staff.major;
  if (staff.jobRole !== undefined) docData.jobRole = staff.jobRole;
  if (staff.contractType !== undefined) docData.contractType = staff.contractType;
  if (staff.workStatus !== undefined) docData.workStatus = staff.workStatus;
  if (staff.professionalTitle !== undefined) docData.professionalTitle = staff.professionalTitle;
  if (staff.salaryGrade !== undefined) docData.salaryGrade = staff.salaryGrade;
  if (staff.salaryFactor !== undefined) docData.salaryFactor = staff.salaryFactor;
  if (staff.seniorityAllowance !== undefined) docData.seniorityAllowance = staff.seniorityAllowance;
  if (staff.preferentialAllowance !== undefined) docData.preferentialAllowance = staff.preferentialAllowance;
  if (staff.assignedClass !== undefined) docData.assignedClass = staff.assignedClass;
  if (staff.personalEmail !== undefined) docData.personalEmail = staff.personalEmail;

  if (auth.currentUser) {
    try {
      const docRef = doc(db, COLLECTION_NAME, staff.id);
      await setDoc(docRef, docData);
    } catch (error) {
      console.warn(`Firestore createStaff error, saving to localStorage.`, error);
    }
  }

  try {
    const cached = localStorage.getItem(localKey);
    let list: Staff[] = cached ? JSON.parse(cached) : [];
    if (!Array.isArray(list)) list = [];
    const idx = list.findIndex(item => item.id === staff.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...docData };
    } else {
      list.push(docData);
    }
    localStorage.setItem(localKey, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Update an existing staff's properties
 */
export async function updateStaff(id: string, updates: Partial<Staff>): Promise<void> {
  const localKey = `firestore_fallback_${COLLECTION_NAME}`;
  if (auth.currentUser) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.warn(`Firestore updateStaff error, saving to localStorage.`, error);
    }
  }

  try {
    const cached = localStorage.getItem(localKey);
    let list: Staff[] = cached ? JSON.parse(cached) : [];
    if (!Array.isArray(list)) list = [];
    const idx = list.findIndex(item => item.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem(localKey, JSON.stringify(list));
    }
  } catch (e) {
    console.error(e);
  }
}

/**
 * Delete a staff document
 */
export async function deleteStaff(id: string): Promise<void> {
  const localKey = `firestore_fallback_${COLLECTION_NAME}`;
  if (auth.currentUser) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn(`Firestore deleteStaff error, deleting from localStorage.`, error);
    }
  }

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
    console.error(e);
  }
}

/**
 * Utility to seed the initial set of staff
 */
export async function seedDefaultStaff(): Promise<void> {
  for (const s of DEFAULT_STAFF) {
    try {
      const docRef = doc(db, COLLECTION_NAME, s.id);
      await setDoc(docRef, s);
    } catch (e) {
      console.warn(`Firestore seedDefaultStaff error for staff ${s.id}`, e);
    }
  }
}

/**
 * Validate role limits based on school configuration
 */
export function checkRoleQuota(role: string, currentStaffList: Staff[], addingCount = 1): string | null {
  const count = currentStaffList.filter(s => s.role === role && s.status !== 'Bình Chỉ / Khóa').length;
  
  if (role === 'Hiệu trưởng' && count + addingCount > 1) {
    return `Vai trò Hiệu trưởng đã đạt giới hạn (tối đa 1 người). Hiện có ${count} người.`;
  }
  if ((role === 'Phó Hiệu trưởng' || role === 'Phó hiệu trưởng') && count + addingCount > 2) {
    return `Vai trò Phó Hiệu trưởng đã đạt giới hạn (tối đa 2 người). Hiện có ${count} người.`;
  }
  if ((role === 'Tổng phụ trách' || role === 'Tổng phụ trách Đội/Đoàn') && count + addingCount > 1) {
    return `Vai trò Tổng phụ trách đã đạt giới hạn (tối đa 1 người). Hiện có ${count} người.`;
  }
  if (role === 'Kế toán trưởng' && count + addingCount > 1) {
    return `Vai trò Kế toán trưởng đã đạt giới hạn (tối đa 1 người). Hiện có ${count} người.`;
  }
  if (role === 'Tổ trưởng bảo vệ' && count + addingCount > 1) {
    return `Vai trò Tổ trưởng bảo vệ đã đạt giới hạn (tối đa 1 người). Hiện có ${count} người.`;
  }
  return null;
}
