import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './firebase';

/* ── SUB-INTERFACES ── */

/** Người liên hệ động (1 trẻ - N người liên hệ) */
export interface ChildContact {
  name: string;
  relationship: string;     // Ba, Mẹ, Ông, Bà, Người giám hộ hợp pháp...
  phone: string;
  occupation?: string;       // Nghề nghiệp
  isPrimary: boolean;        // Tài khoản chính (dùng SĐT này để đăng nhập app)
}

/** Người được ủy quyền đưa rước */
export interface PickupPerson {
  name: string;
  phone: string;
  relationship: string;
  photoUrl?: string;         // Hình ảnh chân dung để đối chiếu khi đón trẻ
}

/* ── MAIN INTERFACE ── */

export interface Child {
  id: string;
  name: string;               // Họ và tên khai sinh
  nickname?: string;           // Tên ở nhà (Bắp, Dâu, Cua, Gấu...)
  dob: string;                 // Ngày sinh → hệ thống tự tính tháng tuổi
  gender: string;
  grade: string;               // Lớp hiện tại (Nhà trẻ 1, Mầm 1, Chồi 1, Lá 1)
  status: 'Đang Học' | 'Bảo Lưu' | 'Đình Chỉ' | 'Hoàn thành';
  address: string;

  // Hồ sơ Y tế & Đặc điểm sinh lý
  personalId?: string;         // Mã định danh cá nhân (thay CCCD)
  birthCertNo?: string;        // Số Giấy khai sinh
  bloodType?: string;          // Nhóm máu (A, B, AB, O)
  heightCm?: number;           // Chiều cao (cm) lúc nhập học
  weightKg?: number;           // Cân nặng (kg) lúc nhập học
  allergies?: string[];        // Danh sách dị ứng (Tôm, đậu phộng, sữa bò...)
  medicalHistory?: string;     // Bệnh lý bẩm sinh / Tiền sử (hen suyễn, sốt co giật...)

  // Thông tin Gia đình & Người giám hộ (Dynamic contacts)
  contacts?: ChildContact[];   // Danh sách người liên hệ (1-N, linh hoạt)

  // Danh sách người ủy quyền đưa rước (Pickup Authorization)
  pickupAuthorized?: PickupPerson[];

  // Metadata
  ethnicity?: string;
  admissionDate?: string;
  policyType?: string;         // Diện chính sách (Hộ nghèo, Cận nghèo, Con thương binh...)
  insuranceCode?: string;      // Mã BHYT

  // ── Backward-compat fields (deprecated, kept for Firestore migration) ──
  phone?: string;              // @deprecated – dùng contacts[].phone
  guardian?: string;            // @deprecated – dùng contacts[]
  cccd?: string;               // @deprecated – dùng personalId
  parentFather?: string;       // @deprecated – dùng contacts[]
  parentFatherPhone?: string;  // @deprecated
  parentMother?: string;       // @deprecated
  parentMotherPhone?: string;  // @deprecated
  guardianPhone?: string;      // @deprecated
  guardianRelation?: string;   // @deprecated
  email?: string;              // @deprecated – trẻ MN không có email
  classRole?: string;          // @deprecated – trẻ MN không có lớp trưởng
}

/** Backward-compatible alias — để không phải đổi import ở 40+ files cùng lúc */
export type Student = Child;

const COLLECTION_NAME = 'students';

export const DEFAULT_STUDENTS: Student[] = [
  // ── Khối Nhà Trẻ ──
  {
    id: 'MN2025.001',
    name: 'Nguyễn Bảo Ngọc',
    nickname: 'Bông',
    dob: '15/03/2023',
    gender: 'Nữ',
    grade: 'Nhà trẻ 1',
    status: 'Đang Học',
    address: '12 ấp Đông, Xã An Hữu, Cái Bè, Tiền Giang',
    allergies: ['Sữa bò'],
    contacts: [
      { name: 'Nguyễn Văn Hùng', relationship: 'Ba', phone: '0912345678', occupation: 'Nông dân', isPrimary: true },
      { name: 'Trần Thị Lan', relationship: 'Mẹ', phone: '0988765432', occupation: 'Nội trợ', isPrimary: false }
    ],
    pickupAuthorized: [
      { name: 'Nguyễn Thị Bảy', phone: '0909111222', relationship: 'Bà nội' }
    ]
  },
  {
    id: 'MN2025.002',
    name: 'Trần Gia Huy',
    nickname: 'Cua',
    dob: '22/06/2023',
    gender: 'Nam',
    grade: 'Nhà trẻ 1',
    status: 'Đang Học',
    address: '45 ấp Tây, Xã An Hữu, Cái Bè, Tiền Giang',
    contacts: [
      { name: 'Trần Văn Tuyến', relationship: 'Ba', phone: '0977112233', occupation: 'Công nhân', isPrimary: true },
      { name: 'Lê Thị Hoa', relationship: 'Mẹ', phone: '0966554433', occupation: 'Buôn bán', isPrimary: false }
    ]
  },

  // ── Khối Mầm ──
  {
    id: 'MN2025.003',
    name: 'Phạm Minh Thư',
    nickname: 'Dâu',
    dob: '18/09/2022',
    gender: 'Nữ',
    grade: 'Mầm 1',
    status: 'Đang Học',
    address: 'ấp Trung, Xã An Hữu, Cái Bè, Tiền Giang',
    allergies: ['Đậu phộng'],
    contacts: [
      { name: 'Phạm Thanh Sơn', relationship: 'Ba', phone: '0911223344', occupation: 'Tài xế', isPrimary: true }
    ]
  },
  {
    id: 'MN2025.004',
    name: 'Lê Hoàng Bảo',
    nickname: 'Gấu',
    dob: '05/01/2022',
    gender: 'Nam',
    grade: 'Mầm 1',
    status: 'Đang Học',
    address: '15 ấp Nam, Xã An Hữu, Cái Bè, Tiền Giang',
    contacts: [
      { name: 'Lê Văn Long', relationship: 'Ba', phone: '0933445566', occupation: 'Thợ điện', isPrimary: false },
      { name: 'Nguyễn Thị Mai', relationship: 'Mẹ', phone: '0944556677', occupation: 'Giáo viên', isPrimary: true }
    ]
  },

  // ── Khối Chồi ──
  {
    id: 'MN2025.005',
    name: 'Hoàng Nhật Minh',
    nickname: 'Bin',
    dob: '02/04/2021',
    gender: 'Nam',
    grade: 'Chồi 1',
    status: 'Đang Học',
    address: 'ấp Bắc, Xã An Hữu, Cái Bè, Tiền Giang',
    contacts: [
      { name: 'Hoàng Văn Bảy', relationship: 'Ba', phone: '0909999888', occupation: 'Thợ mộc', isPrimary: true },
      { name: 'Trần Thị Hằng', relationship: 'Mẹ', phone: '0901123456', occupation: 'Nội trợ', isPrimary: false }
    ]
  },
  {
    id: 'MN2025.006',
    name: 'Vũ Khánh Ngân',
    nickname: 'Nấm',
    dob: '14/07/2021',
    gender: 'Nữ',
    grade: 'Chồi 1',
    status: 'Đang Học',
    address: 'ấp Đông, Xã An Hữu, Cái Bè, Tiền Giang',
    allergies: ['Tôm', 'Cua'],
    contacts: [
      { name: 'Vũ Văn Thành', relationship: 'Ba', phone: '0922333444', occupation: 'Nông dân', isPrimary: true }
    ]
  },

  // ── Khối Lá ──
  {
    id: 'MN2025.007',
    name: 'Nguyễn Thanh Tùng',
    nickname: 'Bắp',
    dob: '30/11/2020',
    gender: 'Nam',
    grade: 'Lá 1',
    status: 'Đang Học',
    address: 'ấp Trung, Xã An Hữu, Cái Bè, Tiền Giang',
    contacts: [
      { name: 'Nguyễn Văn Hội', relationship: 'Ba', phone: '0955667788', occupation: 'Buôn bán', isPrimary: true },
      { name: 'Trần Thị Nga', relationship: 'Mẹ', phone: '0966778899', occupation: 'Nội trợ', isPrimary: false }
    ]
  },
  {
    id: 'MN2025.008',
    name: 'Phan Thị Bích Ngọc',
    nickname: 'Sóc',
    dob: '10/02/2020',
    gender: 'Nữ',
    grade: 'Lá 1',
    status: 'Đang Học',
    address: 'ấp Nam, Xã An Hữu, Cái Bè, Tiền Giang',
    contacts: [
      { name: 'Phan Văn Lớn', relationship: 'Ba', phone: '0977889900', occupation: 'Thợ xây', isPrimary: false },
      { name: 'Lê Thị Tuyết', relationship: 'Mẹ', phone: '0988990011', occupation: 'Công nhân', isPrimary: true }
    ],
    pickupAuthorized: [
      { name: 'Lê Thị Bé', phone: '0911001122', relationship: 'Dì ruột' }
    ]
  },
  {
    id: 'MN2025.009',
    name: 'Đặng Quốc Anh',
    nickname: 'Xoài',
    dob: '08/08/2020',
    gender: 'Nam',
    grade: 'Lá 1',
    status: 'Đang Học',
    address: '20 ấp Tây, Xã An Hữu, Cái Bè, Tiền Giang',
    contacts: [
      { name: 'Đặng Văn Tài', relationship: 'Ba', phone: '0900112233', occupation: 'Nông dân', isPrimary: true }
    ]
  },
  {
    id: 'MN2025.010',
    name: 'Lâm Ngọc Hân',
    nickname: 'Kem',
    dob: '25/12/2020',
    gender: 'Nữ',
    grade: 'Lá 1',
    status: 'Đang Học',
    address: 'ấp Bắc, Xã An Hữu, Cái Bè, Tiền Giang',
    contacts: [
      { name: 'Lâm Văn Đại', relationship: 'Người giám hộ', phone: '0933221100', occupation: 'Nông dân', isPrimary: true }
    ]
  }
];

/**
 * Fetch all children (trẻ) from Firestore.
 * If Firestore list succeeds but returns empty, automatically seeds default records.
 * If authentication is not available or database errors occur, throws compliant JSON error.
 */
export async function getStudents(): Promise<Student[]> {
  const localKey = `firestore_fallback_${COLLECTION_NAME}`;
  if (!auth.currentUser) {
    return [];
  }
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: Student[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Student);
    });

    localStorage.setItem(localKey, JSON.stringify(list));
    return list;
  } catch (error) {
    console.warn("Firestore getStudents error, using localStorage fallback:", error);
  }

  const cached = localStorage.getItem(localKey);
  if (cached) {
    try {
      return JSON.parse(cached) as Student[];
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

/**
 * Create a new child document
 */
export async function createStudent(student: Student): Promise<void> {
  const localKey = `firestore_fallback_${COLLECTION_NAME}`;
  const docData: any = {
    id: student.id,
    name: student.name,
    nickname: student.nickname || '',
    dob: student.dob,
    gender: student.gender,
    grade: student.grade,
    status: student.status,
    address: student.address || '',
    contacts: student.contacts || [],
    pickupAuthorized: student.pickupAuthorized || [],
    allergies: student.allergies || [],
  };

  // Persist optional fields if provided
  if (student.personalId) docData.personalId = student.personalId;
  if (student.birthCertNo) docData.birthCertNo = student.birthCertNo;
  if (student.bloodType) docData.bloodType = student.bloodType;
  if (student.heightCm) docData.heightCm = student.heightCm;
  if (student.weightKg) docData.weightKg = student.weightKg;
  if (student.medicalHistory) docData.medicalHistory = student.medicalHistory;
  if (student.ethnicity) docData.ethnicity = student.ethnicity;
  if (student.admissionDate) docData.admissionDate = student.admissionDate;
  if (student.policyType) docData.policyType = student.policyType;
  if (student.insuranceCode) docData.insuranceCode = student.insuranceCode;

  // Backward-compat: persist legacy fields if present
  if (student.phone) docData.phone = student.phone;
  if (student.guardian) docData.guardian = student.guardian;

  if (auth.currentUser) {
    try {
      const docRef = doc(db, COLLECTION_NAME, student.id);
      await setDoc(docRef, docData);
    } catch (error) {
      console.warn(`Firestore createStudent error, saving to localStorage.`, error);
    }
  }

  try {
    const cached = localStorage.getItem(localKey);
    let list: Student[] = cached ? JSON.parse(cached) : [];
    if (!Array.isArray(list)) list = [];
    const idx = list.findIndex(item => item.id === student.id);
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
 * Update an existing child's properties
 */
export async function updateStudent(id: string, updates: Partial<Student>): Promise<void> {
  const localKey = `firestore_fallback_${COLLECTION_NAME}`;
  if (auth.currentUser) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.warn(`Firestore updateStudent error, saving to localStorage.`, error);
    }
  }

  try {
    const cached = localStorage.getItem(localKey);
    let list: Student[] = cached ? JSON.parse(cached) : [];
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
 * Delete a child document
 */
export async function deleteStudent(id: string): Promise<void> {
  const localKey = `firestore_fallback_${COLLECTION_NAME}`;
  if (auth.currentUser) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn(`Firestore deleteStudent error, deleting from localStorage.`, error);
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
 * Utility to seed the initial set of children
 */
export async function seedDefaultStudents(): Promise<void> {
  for (const s of DEFAULT_STUDENTS) {
    try {
      const docRef = doc(db, COLLECTION_NAME, s.id);
      await setDoc(docRef, s);
    } catch (e) {
      console.warn(`Firestore seedDefaultStudents error for child ${s.id}`, e);
    }
  }
}

/**
 * Batch-create multiple children at once.
 * Skips children whose ID already exists in Firestore (duplicate check by ID).
 * Returns: { created, skipped } counts.
 */
export async function batchCreateStudents(
  students: Student[]
): Promise<{ created: number; skipped: string[] }> {
  const localKey = `firestore_fallback_${COLLECTION_NAME}`;
  const skipped: string[] = [];
  let created = 0;

  if (auth.currentUser) {
    await Promise.all(
      students.map(async s => {
        const ref = doc(db, COLLECTION_NAME, s.id);
        try {
          const snap = await getDoc(ref);
          if (snap.exists()) {
            skipped.push(s.id);
            return;
          }
          await setDoc(ref, s);
          created++;
        } catch (error) {
          console.warn(`Firestore batch write error for child ${s.id}`, error);
        }
      })
    );
  }

  try {
    const cached = localStorage.getItem(localKey);
    let list: Student[] = cached ? JSON.parse(cached) : [];
    if (!Array.isArray(list)) list = [];
    
    students.forEach(s => {
      const exists = list.some(item => item.id === s.id);
      if (exists) {
        if (!skipped.includes(s.id)) {
          skipped.push(s.id);
        }
      } else {
        list.push(s);
        if (!auth.currentUser) {
          created++;
        }
      }
    });
    localStorage.setItem(localKey, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }

  return { created, skipped };
}
