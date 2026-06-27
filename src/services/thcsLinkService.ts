import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration for THCS An Hữu
const thcsFirebaseConfig = {
  projectId: "sprout-10a66",
  appId: "1:1059416100754:web:3b0cc35f0aba01ddc37b4b",
  apiKey: "AIzaSyB7kPWIhqjcxK3dznSjoWKEO-0WsBS-qUg",
  authDomain: "sprout-10a66.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-46a3d34e-89ca-4dc9-9ee7-9356a887128d",
  storageBucket: "sprout-10a66.firebasestorage.app",
  messagingSenderId: "1059416100754",
  measurementId: ""
};

// Initialize THCS App lazily to avoid double initialization issues
const getTHCSApp = () => {
  const apps = getApps();
  const existing = apps.find(app => app.name === 'thcs');
  if (existing) return existing;
  return initializeApp(thcsFirebaseConfig, 'thcs');
};

export const getTHCSDb = () => {
  return getFirestore(getTHCSApp(), thcsFirebaseConfig.firestoreDatabaseId);
};

export const getTHCSAuth = () => {
  return getAuth(getTHCSApp());
};

// Formatter matching THCS student code logic
export const formatStudentCodeForDB = (code: string): string => {
  const clean = code.trim().replace(/\./g, '').toUpperCase();
  let numericPart = clean;
  if (numericPart.startsWith('HS')) {
    numericPart = numericPart.substring(2);
  }
  if (numericPart.length === 5 && /^\d+$/.test(numericPart)) {
    return numericPart.substring(0, 2) + '.' + numericPart.substring(2);
  }
  return code.trim();
};

const isNumericSubject = (subjectName: string, subjectCode: string): boolean => {
  const name = subjectName.toLowerCase();
  const code = subjectCode.toLowerCase();
  return !(
    code === 'gddp' ||
    code === 'hđtn' ||
    code === 'hdtn' ||
    code === 'nhac' ||
    code === 'my thuật' ||
    code === 'mĩ thuật' ||
    code === 'the duc' ||
    code === 'td' ||
    code === 'gdtc' ||
    name.includes('địa phương') ||
    name.includes('trải nghiệm') ||
    name.includes('thể chất') ||
    name.includes('thể dục') ||
    name.includes('âm nhạc') ||
    name.includes('mỹ thuật') ||
    name.includes('mĩ thuật')
  );
};

export interface THCSStudentLinkData {
  fullName: string;
  dob: string;
  gender: 'Nam' | 'Nữ';
  hometown?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  thcsStudentCode: string;
  secondarySchool: string;
  gpa6: number;
  gpa7: number;
  gpa8: number;
  gpa9: number;
  academicClass9: 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu';
  conductClass9: 'Tốt' | 'Khá' | 'Trung bình';
  detailedGrades9: Array<{
    subjectName: string;
    term1?: number;
    term2?: number;
    annual?: number;
    comment?: string;
  }>;
  gpa3Subjects9?: number;
}

export async function fetchTHCSStudentData(studentCodeRaw: string): Promise<THCSStudentLinkData | null> {
  const db = getTHCSDb();
  const auth = getTHCSAuth();

  // 1. Sign in using administrative credentials to avoid auth/admin-restricted-operation error
  if (!auth.currentUser) {
    await signInWithEmailAndPassword(auth, 'admin@lecturer.anhuu.edu.vn', '123456');
  }

  // 2. Format the student code
  const dbCode = formatStudentCodeForDB(studentCodeRaw);

  // 3. Find the student document
  const studentQuery = query(collection(db, 'students'), where('studentCode', '==', dbCode));
  const studentSnap = await getDocs(studentQuery);

  if (studentSnap.empty) {
    return null;
  }

  const studentDoc = studentSnap.docs[0];
  const studentId = studentDoc.id;
  const studentData = studentDoc.data();

  // 4. Fetch all classes and build maps
  const classesSnap = await getDocs(collection(db, 'classes'));
  const classesMap = new Map<string, number>(); // classId -> gradeLevel
  classesSnap.forEach(docSnap => {
    const cData = docSnap.data();
    if (cData.id && cData.gradeLevel !== undefined) {
      classesMap.set(cData.id, Number(cData.gradeLevel));
    } else if (docSnap.id && cData.gradeLevel !== undefined) {
      classesMap.set(docSnap.id, Number(cData.gradeLevel));
    }
  });

  // Resolve academic years corresponding to grade levels for this student
  // classEnrollments is Record<academicYearId, { classId: string }>
  const enrollments = studentData.classEnrollments || {};
  const yearToGradeMap = new Map<string, number>(); // academicYearId -> gradeLevel
  const gradeToYearMap = new Map<number, string>(); // gradeLevel -> academicYearId

  Object.entries(enrollments).forEach(([yearId, enrollData]: [string, any]) => {
    const classId = enrollData?.classId;
    if (classId && classesMap.has(classId)) {
      const grade = classesMap.get(classId)!;
      yearToGradeMap.set(yearId, grade);
      gradeToYearMap.set(grade, yearId);
    }
  });

  // 5. Fetch subjects to know which ones are numeric
  const subjectsSnap = await getDocs(collection(db, 'subjects'));
  const subjectsMap = new Map<string, { name: string; code: string; isNumeric: boolean }>();
  subjectsSnap.forEach(docSnap => {
    const sData = docSnap.data();
    const sId = docSnap.id;
    const name = sData.name || '';
    const code = sData.code || '';
    subjectsMap.set(sId, {
      name,
      code,
      isNumeric: isNumericSubject(name, code)
    });
  });

  // 6. Fetch academic records for the student
  const recordsQuery = query(collection(db, 'academicRecords'), where('studentId', '==', studentId));
  const recordsSnap = await getDocs(recordsQuery);
  const records: any[] = [];
  recordsSnap.forEach(docSnap => {
    records.push({ id: docSnap.id, ...docSnap.data() });
  });

  // 7. Calculate GPA for each grade level (6, 7, 8, 9)
  const calculateGPAForGrade = (grade: number): number => {
    const targetYearId = gradeToYearMap.get(grade);
    if (!targetYearId) return 0;

    // Filter academic records for this year
    const yearRecords = records.filter(r => r.academicYearId === targetYearId);

    // Group by subjectId to calculate annual average for each subject
    const subjectScores = new Map<string, { term1?: number; term2?: number }>();
    yearRecords.forEach(r => {
      const subId = r.subjectId;
      if (!subId) return;

      const subMeta = subjectsMap.get(subId);
      if (!subMeta || !subMeta.isNumeric) return; // Skip non-numeric subjects

      const current = subjectScores.get(subId) || {};
      if (r.term === 1) current.term1 = r.averageScore;
      if (r.term === 2) current.term2 = r.averageScore;
      subjectScores.set(subId, current);
    });

    let sumOfAnnualScores = 0;
    let countOfSubjects = 0;

    subjectScores.forEach((scores) => {
      const t1 = scores.term1;
      const t2 = scores.term2;
      let annual: number | undefined = undefined;

      if (t1 !== undefined && t1 !== null && t2 !== undefined && t2 !== null) {
        annual = (t1 + t2 * 2) / 3;
      } else if (t2 !== undefined && t2 !== null) {
        annual = t2;
      } else if (t1 !== undefined && t1 !== null) {
        annual = t1;
      }

      if (annual !== undefined && !isNaN(annual)) {
        sumOfAnnualScores += annual;
        countOfSubjects++;
      }
    });

    if (countOfSubjects > 0) {
      return Number((sumOfAnnualScores / countOfSubjects).toFixed(1));
    }
    return 0;
  };

  const gpa6 = calculateGPAForGrade(6);
  const gpa7 = calculateGPAForGrade(7);
  const gpa8 = calculateGPAForGrade(8);
  const gpa9 = calculateGPAForGrade(9);

  // 8. Determine Grade 9 Academic and Conduct
  let academicClass9: 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu' = 'Tốt';
  if (gpa9 >= 8.0) academicClass9 = 'Tốt';
  else if (gpa9 >= 6.5) academicClass9 = 'Khá';
  else if (gpa9 >= 5.0) academicClass9 = 'Trung bình';
  else academicClass9 = 'Yếu';

  // Conduct Class 9 mapping
  const grade9YearId = gradeToYearMap.get(9);
  const conductKeyAnnual = `conduct_${grade9YearId}_annual`;
  const conductKeyHK2 = `conduct_${grade9YearId}_2`;
  const conductKeyHK1 = `conduct_${grade9YearId}_1`;

  const rawConduct = (studentData.trainingResults?.[conductKeyAnnual] ||
                     studentData.trainingResults?.[conductKeyHK2] ||
                     studentData.trainingResults?.[conductKeyHK1] ||
                     'Tốt');

  let conductClass9: 'Tốt' | 'Khá' | 'Trung bình' = 'Tốt';
  if (rawConduct === 'Tốt' || rawConduct === 'Khá' || rawConduct === 'Trung bình') {
    conductClass9 = rawConduct;
  }

  // 9. Build detailed subject grades for Grade 9
  const detailedGrades9: THCSStudentLinkData['detailedGrades9'] = [];
  if (grade9YearId) {
    const grade9Records = records.filter(r => r.academicYearId === grade9YearId);
    
    // Group Grade 9 records by subjectId
    const g9SubjectMap = new Map<string, { term1?: number; term2?: number; comment?: string }>();
    grade9Records.forEach(r => {
      const subId = r.subjectId;
      if (!subId) return;

      const current = g9SubjectMap.get(subId) || {};
      if (r.term === 1) current.term1 = r.averageScore;
      if (r.term === 2) {
        current.term2 = r.averageScore;
        current.comment = r.comment;
      }
      if (!current.comment && r.comment) {
        current.comment = r.comment;
      }
      g9SubjectMap.set(subId, current);
    });

    g9SubjectMap.forEach((scores, subId) => {
      const subMeta = subjectsMap.get(subId);
      if (!subMeta) return;

      const t1 = scores.term1;
      const t2 = scores.term2;
      let annual: number | undefined = undefined;

      if (t1 !== undefined && t1 !== null && t2 !== undefined && t2 !== null) {
        annual = Number(((t1 + t2 * 2) / 3).toFixed(1));
      } else if (t2 !== undefined && t2 !== null) {
        annual = t2;
      } else if (t1 !== undefined && t1 !== null) {
        annual = t1;
      }

      detailedGrades9.push({
        subjectName: subMeta.name,
        term1: t1,
        term2: t2,
        annual: annual,
        comment: scores.comment
      });
    });
  }

  // Map gender
  let gender: 'Nam' | 'Nữ' = 'Nam';
  if (studentData.gender === 'FEMALE') {
    gender = 'Nữ';
  }

  // Calculate average of Literature (Ngữ văn), Math (Toán), and English (Tiếng Anh) for Grade 9
  let mathScore: number | undefined;
  let litScore: number | undefined;
  let engScore: number | undefined;

  detailedGrades9.forEach(g => {
    const name = g.subjectName.toLowerCase().trim();
    if (name === 'toán' || name === 'toán học') {
      mathScore = g.annual;
    } else if (name === 'ngữ văn' || name === 'văn') {
      litScore = g.annual;
    } else if (name === 'tiếng anh' || name === 'anh') {
      engScore = g.annual;
    }
  });

  let gpa3Subjects9: number | undefined = undefined;
  const scores3 = [mathScore, litScore, engScore].filter((s): s is number => s !== undefined && s !== null);
  if (scores3.length > 0) {
    gpa3Subjects9 = Number((scores3.reduce((sum, s) => sum + s, 0) / scores3.length).toFixed(2));
  }

  return {
    fullName: studentData.fullName || '',
    dob: studentData.dateOfBirth || '',
    gender,
    hometown: studentData.hometown || '',
    address: studentData.currentAddress || studentData.permanentAddress || '',
    parentName: studentData.familyInfo?.father?.name || studentData.familyInfo?.mother?.name || '',
    parentPhone: studentData.familyInfo?.father?.phone || studentData.familyInfo?.mother?.phone || '',
    thcsStudentCode: dbCode,
    secondarySchool: 'THCS An Hữu',
    gpa6,
    gpa7,
    gpa8,
    gpa9,
    academicClass9,
    conductClass9,
    detailedGrades9,
    gpa3Subjects9
  };
}
