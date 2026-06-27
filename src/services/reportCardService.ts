import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';

/**
 * ReportCardService - Lưu trữ bảng điểm học bạ trên Firestore
 * 
 * Collection: 'reportCards'
 * Document ID format: `${studentId}_${semester}` (e.g. "HS2025.101_Học Kỳ I")
 * 
 * Each document stores the full ReportCardData for a student + semester.
 */

export interface ReportCardScore {
  subject: string;
  multiplier1: (number | string)[];
  multiplier2: (number | string)[];
  multiplier3: number | string;
  average: number | string;
  teacherComment: string;
}

export interface ReportCardSummary {
  gpa: number;
  academicConduct: 'Xuất Sắc' | 'Giỏi' | 'Khá' | 'Trung Bình' | 'Yếu';
  moralConduct: 'Tốt' | 'Khá' | 'Trung Bình' | 'Yếu';
  daysAbsent: number;
  daysAbsentExcused: number;
  generalComment: string;
}

export interface ReportCardDocument {
  id: string; // format: `${studentId}_${semester}`
  studentId: string;
  semester: string;
  name: string;
  dob: string;
  gender: string;
  grade: string;
  gvcn: string;
  academicYear: string;
  scores: ReportCardScore[];
  summary: ReportCardSummary;
}

const COLLECTION_NAME = 'reportCards';

function makeDocId(studentId: string, semester: string): string {
  return `${studentId}_${semester}`;
}

/**
 * Get a single report card for a student + semester from Firestore.
 * Returns null if not found.
 */
export async function getReportCard(studentId: string, semester: string): Promise<ReportCardDocument | null> {
  const docId = makeDocId(studentId, semester);

  if (!auth.currentUser) {
    return null;
  }

  try {
    const { getDoc } = await import('firebase/firestore');
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, docId));
    if (docSnap.exists()) {
      return docSnap.data() as ReportCardDocument;
    }
  } catch (error) {
    console.warn(`Firestore read error for reportCard ${docId}:`, error);
  }

  return null;
}

/**
 * Save (create or update) a report card to Firestore.
 */
export async function saveReportCard(data: ReportCardDocument): Promise<void> {
  if (!auth.currentUser) {
    console.warn('Cannot save report card: user not authenticated');
    return;
  }

  try {
    await setDoc(doc(db, COLLECTION_NAME, data.id), data);
  } catch (error) {
    console.error(`Firestore save error for reportCard ${data.id}:`, error);
    throw error;
  }
}

/**
 * Delete a report card from Firestore.
 */
export async function deleteReportCard(studentId: string, semester: string): Promise<void> {
  const docId = makeDocId(studentId, semester);

  if (!auth.currentUser) {
    return;
  }

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
  } catch (error) {
    console.error(`Firestore delete error for reportCard ${docId}:`, error);
  }
}

/**
 * Get all report cards for a specific student (all semesters).
 */
export async function getStudentReportCards(studentId: string): Promise<ReportCardDocument[]> {
  if (!auth.currentUser) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const results: ReportCardDocument[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as ReportCardDocument;
      if (data.studentId === studentId) {
        results.push(data);
      }
    });
    return results;
  } catch (error) {
    console.warn(`Firestore query error for student ${studentId} report cards:`, error);
    return [];
  }
}

/**
 * Get all report cards in the system.
 */
export async function getAllReportCards(): Promise<ReportCardDocument[]> {
  if (!auth.currentUser) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const results: ReportCardDocument[] = [];
    snapshot.forEach((docSnap) => {
      results.push(docSnap.data() as ReportCardDocument);
    });
    return results;
  } catch (error) {
    console.warn('Firestore query error for all report cards:', error);
    return [];
  }
}
