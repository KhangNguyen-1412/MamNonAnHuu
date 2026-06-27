import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface GraduationStudent {
  id: string;
  name: string;
  dob: string;
  classId: string;
  gpa12: number;
  academicClass12: 'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu' | 'Kém';
  conductClass12: 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu';
  absentDays: number;
  hasBirthCert: boolean;
  hasPhoto3x4: boolean;
  hasTranscript: boolean;
  
  // Tab 2: Exam registration
  registeredElectives: string[]; // 2 subjects
  foreignLanguageType: string; // e.g. 'Tiếng Anh', 'Tiếng Pháp'
  exemptLanguage: boolean;
  exemptLanguageCertificate?: string; // e.g. 'IELTS 6.5'
  
  // Tab 3: Priorities & Incentives
  policyType: 'Diện 1' | 'Diện 2' | 'Diện 3';
  incentiveVocational: 'Không' | 'Trung bình' | 'Khá' | 'Giỏi';
  incentiveAward: 'Không' | 'Khuyến khích' | 'Ba' | 'Nhì' | 'Nhất';
  isSpecialExemption: boolean;
  specialExemptionDesc?: string;
  specialExemptionStatus?: 'Chờ duyệt' | 'Sở đã duyệt';
  
  // Tab 4: Scores & Outcomes
  scores: Record<string, number>; // exam scores
  gradScore?: number;
  outcome?: 'Đỗ Tốt nghiệp' | 'Trượt' | 'Đặc cách';
  
  // Tab 5: Diploma Info
  diplomaNo?: string;
  registryNo?: string;
  decisionDate?: string;
  diplomaStatus: 'Chưa nhận' | 'Đã nhận' | 'Ủy quyền nhận';
  recipientName?: string;
  authorizationFile?: string;
}

const COLLECTION_NAME = 'graduationStudents';

export async function getGraduationStudents(): Promise<GraduationStudent[]> {
  if (!auth.currentUser) {
    return [];
  }
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: GraduationStudent[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as GraduationStudent);
    });
    return list;
  } catch (error) {
    console.error('Failed to get graduation students from Firestore:', error);
    return [];
  }
}

export async function saveGraduationStudent(item: GraduationStudent): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  try {
    await setDoc(doc(db, COLLECTION_NAME, item.id), item);
  } catch (error) {
    console.error(`Failed to save graduation student ${item.id}:`, error);
    throw error;
  }
}

export async function saveGraduationStudentsBulk(items: GraduationStudent[]): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  try {
    const promises = items.map(item => setDoc(doc(db, COLLECTION_NAME, item.id), item));
    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to bulk save graduation students:', error);
    throw error;
  }
}

export async function deleteGraduationStudent(id: string): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error(`Failed to delete graduation student ${id}:`, error);
  }
}
