import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface StudentPromotion {
  id: string;
  name: string;
  grade: string; // current class name, e.g. "1A1"
  gpa: number;
  academicClass: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
  conductClass: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
  absentDays: number;
  recommendStatus: 'Được lên lớp thẳng' | 'Kiểm tra lại trong hè' | 'Rèn luyện lại trong hè' | 'Ở lại lớp (Lưu ban)';
  decisionStatus: 'Chờ duyệt' | 'Được lên lớp' | 'Ở lại lớp';
  approved: boolean; // approved by academic department
  reTestSubject?: string;
  reTestScore?: number;
  reTrainTask?: string;
  reTrainEval?: 'Chưa đánh giá' | 'Đạt' | 'Chưa đạt';
  combinationChangeRequested?: boolean;
  targetClass?: string; // new class for next year
}

const COLLECTION_NAME = 'promotionEvaluations';

export async function getPromotionEvaluations(): Promise<StudentPromotion[]> {
  if (!auth.currentUser) {
    return [];
  }
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const list: StudentPromotion[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as StudentPromotion);
    });
    return list;
  } catch (error) {
    console.error('Failed to get promotion evaluations from Firestore:', error);
    return [];
  }
}

export async function savePromotionEvaluation(item: StudentPromotion): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  try {
    await setDoc(doc(db, COLLECTION_NAME, item.id), item);
  } catch (error) {
    console.error(`Failed to save promotion evaluation for ${item.id}:`, error);
    throw error;
  }
}

export async function savePromotionEvaluationsBulk(items: StudentPromotion[]): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  try {
    const promises = items.map(item => setDoc(doc(db, COLLECTION_NAME, item.id), item));
    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to bulk save promotion evaluations:', error);
    throw error;
  }
}

export async function deletePromotionEvaluation(id: string): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error(`Failed to delete promotion evaluation for ${id}:`, error);
  }
}
