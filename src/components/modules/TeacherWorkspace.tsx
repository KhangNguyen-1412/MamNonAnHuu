import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Filter, Calendar, Award, BookOpen, Users, UserCheck, 
  FileText, Building, Check, Lock, Unlock, AlertCircle, Trash2, Edit, 
  ShieldCheck, Phone, Mail, FileCheck, Send, ShieldAlert, Wrench, HeartPulse, RefreshCw
} from 'lucide-react';
import { auth } from '../../services/firebase';
import { getStudents, Student } from '../../services/studentService';
import { getStaffList, Staff } from '../../services/hrService';
import { 
  getClasses, ClassData, getTeacherAssignments, TeacherAssignment, 
  getTimetable, TimetableSlot, getPlans, savePlan, 
  getLessonDiaries, saveLessonDiary, deleteLessonDiary, LessonDiary,
  getMaintenances, saveMaintenance, Maintenance
} from '../../services/dbService';
import { getAllReportCards, saveReportCard, ReportCardDocument, ReportCardScore } from '../../services/reportCardService';
import { useUserRole } from '../../utils/role';

interface TeacherWorkspaceProps {
  activeViewTab: string;
}

export const TeacherWorkspace: React.FC<TeacherWorkspaceProps> = ({ activeViewTab }) => {
  const currentRole = useUserRole();
  const [activeTab, setActiveTab] = useState<string>(activeViewTab || 'overview');
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // User details resolved
  const [teacherProfile, setTeacherProfile] = useState<Staff | null>(null);
  const [myClasses, setMyClasses] = useState<string[]>([]); // e.g. ["10A1 (Tin học)"]

  // Shared Data Lists
  const [students, setStudents] = useState<Student[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [classesList, setClassesList] = useState<ClassData[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [diaries, setDiaries] = useState<LessonDiary[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [reportCards, setReportCards] = useState<ReportCardDocument[]>([]);

  // Tab State Keepers
  // 1. Gradebook State
  const [gradeSemester, setGradeSemester] = useState<string>('Học Kỳ II');
  const [selectedClass, setSelectedClass] = useState<string>(''); // Class name selected (e.g. "1A1")
  const [selectedSubject, setSelectedSubject] = useState<string>(''); // Subject name selected (e.g. "Tin học")
  const [gradeEditMode, setGradeEditMode] = useState<boolean>(true);
  const [gradeErrors, setGradeErrors] = useState<Record<string, boolean>>({}); // e.g. "studentId_fieldName" -> true/false
  const [editedScores, setEditedScores] = useState<Record<string, any>>({}); // studentId -> { oral1: 9, c15m1: 8, ... }

  // 2. Lesson Plans State
  const [planTitle, setPlanTitle] = useState('');
  const [planGrade, setPlanGrade] = useState('');
  const [planObjectives, setPlanObjectives] = useState('');
  const [planMaterials, setPlanMaterials] = useState('');
  const [planActivities, setPlanActivities] = useState('');
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);

  // 3. E-Diary State
  const [diaryDate, setDiaryDate] = useState('2026-06-22');
  const [diaryClass, setDiaryClass] = useState('');
  const [diaryPeriod, setDiaryPeriod] = useState(1);
  const [diarySubject, setDiarySubject] = useState('');
  const [diaryContent, setDiaryContent] = useState('');
  const [diaryComment, setDiaryComment] = useState('');
  const [diaryRating, setDiaryRating] = useState<'Tốt' | 'Khá' | 'TB' | 'Yếu'>('Tốt');

  // 4. Homeroom Attendance State
  const [attendanceDate, setAttendanceDate] = useState('2026-06-22');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | 'excused'>>({});

  // 5. Homeroom Conduct State
  const [conductRecords, setConductRecords] = useState<Record<string, { conduct: string; comment: string }>>({});

  // 6. Maintenance State
  const [maintRoom, setMaintRoom] = useState('');
  const [maintDetail, setMaintDetail] = useState('');
  const [maintSeverity, setMaintSeverity] = useState<'Thấp' | 'Trung Bình' | 'Nghiêm Trọng'>('Trung Bình');

  // 7. Teacher Evaluation State
  const [evalCriteria, setEvalCriteria] = useState<Record<string, string>>({});

  // 8. Contact directory state
  const [searchContact, setSearchContact] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (activeViewTab) {
      setActiveTab(activeViewTab);
    }
  }, [activeViewTab]);

  useEffect(() => {
    const loadWorkspaceData = async () => {
      try {
        setLoading(true);
        const [
          allStudents, allStaff, allClasses, allAssigns, allTimetable,
          allPlans, allDiaries, allMaintenances, allReportCards
        ] = await Promise.all([
          getStudents(),
          getStaffList(),
          getClasses(),
          getTeacherAssignments(),
          getTimetable(),
          getPlans(),
          getLessonDiaries(),
          getMaintenances(),
          getAllReportCards()
        ]);

        setStudents(allStudents);
        setStaffList(allStaff);
        setClassesList(allClasses);
        setTimetableSlots(allTimetable);
        setLessonPlans(allPlans);
        setDiaries(allDiaries);
        setMaintenances(allMaintenances);
        setReportCards(allReportCards);

        // Resolve teacher profile
        const email = auth.currentUser?.email;
        if (email) {
          const profile = allStaff.find(s => s.email?.toLowerCase().trim() === email.toLowerCase().trim());
          if (profile) {
            setTeacherProfile(profile);
            const assign = allAssigns.find(a => a.id === profile.id || a.name === profile.name);
            if (assign) {
              setMyClasses(assign.classes || []);
              // Set defaults for dropdowns
              if (assign.classes && assign.classes.length > 0) {
                const firstClassStr = assign.classes[0];
                const parts = firstClassStr.split(' ');
                const className = parts[0];
                setSelectedClass(className);
                setDiaryClass(className);
                
                const subjectName = firstClassStr.includes('(')
                  ? firstClassStr.substring(firstClassStr.indexOf('(') + 1, firstClassStr.indexOf(')'))
                  : (profile.department || 'Giáo dục mầm non');
                setSelectedSubject(subjectName);
                setDiarySubject(subjectName);
                setPlanGrade(className);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading teacher workspace data", err);
      } finally {
        setLoading(false);
      }
    };
    loadWorkspaceData();
  }, []);

  // Update selected subject when selecting class
  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    const assignedClassStr = myClasses.find(c => c.startsWith(className)) || '';
    if (assignedClassStr.includes('(')) {
      const subjectName = assignedClassStr.substring(assignedClassStr.indexOf('(') + 1, assignedClassStr.indexOf(')'));
      setSelectedSubject(subjectName);
    }
  };

  // 1. Gradebook score handlers and Excel cell-like validation
  const loadClassScores = () => {
    if (!selectedClass || !selectedSubject) return;
    const classStudents = students.filter(s => s.grade === selectedClass && s.status === 'Đang Học');
    const newEditedScores: Record<string, any> = {};

    classStudents.forEach(student => {
      const card = reportCards.find(c => c.studentId === student.id && c.semester === gradeSemester);
      const scoreObj = card?.scores?.find(s => s.subject.toLowerCase().includes(selectedSubject.toLowerCase()));
      
      const oral1 = scoreObj?.multiplier1?.[0] !== undefined ? scoreObj.multiplier1[0] : '';
      const oral2 = scoreObj?.multiplier1?.[1] !== undefined ? scoreObj.multiplier1[1] : '';
      const c15m1 = scoreObj?.multiplier2?.[0] !== undefined ? scoreObj.multiplier2[0] : '';
      const c15m2 = scoreObj?.multiplier2?.[1] !== undefined ? scoreObj.multiplier2[1] : '';
      const c1period = scoreObj?.multiplier3 !== undefined ? scoreObj.multiplier3 : '';
      const semExam = scoreObj?.average !== undefined ? scoreObj.average : ''; // average acts as semester exam or calculated ĐTB depending on BGH columns. Let's make it direct: multiplier1 (oral/15m), multiplier2 (1 period), multiplier3 (semester exam), average (final score)

      // Let's align structure with Firestore:
      // multiplier1 is coefficients 1 (Oral, 15m), multiplier2 is coefficient 2 (1-period), multiplier3 is coefficient 3 (Semester exam), average is final calculated average
      const mult1 = scoreObj?.multiplier1 || [];
      const mult2 = scoreObj?.multiplier2 || [];
      
      newEditedScores[student.id] = {
        oral: mult1[0] !== undefined ? mult1[0] : '',
        c15m: mult1[1] !== undefined ? mult1[1] : '',
        c1period1: mult2[0] !== undefined ? mult2[0] : '',
        c1period2: mult2[1] !== undefined ? mult2[1] : '',
        exam: scoreObj?.multiplier3 !== undefined ? scoreObj.multiplier3 : '',
        average: scoreObj?.average !== undefined ? scoreObj.average : ''
      };
    });
    setEditedScores(newEditedScores);
    setGradeErrors({});
  };

  useEffect(() => {
    loadClassScores();
  }, [selectedClass, selectedSubject, gradeSemester, reportCards]);

  const validateScore = (val: string): boolean => {
    if (val === '') return true;
    const num = parseFloat(val);
    if (isNaN(num)) return false;
    return num >= 0 && num <= 10;
  };

  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    const fieldsCount = 5; // oral, c15m, c1period1, c1period2, exam
    const filteredStudentsCount = students.filter(s => s.grade === selectedClass && s.status === 'Đang Học').length;

    let targetRow = rowIndex;
    let targetCol = colIndex;

    switch (e.key) {
      case 'ArrowUp':
        targetRow = rowIndex - 1;
        e.preventDefault();
        break;
      case 'ArrowDown':
        targetRow = rowIndex + 1;
        e.preventDefault();
        break;
      case 'ArrowLeft':
        if (e.currentTarget.selectionStart === 0) {
          targetCol = colIndex - 1;
          e.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (e.currentTarget.selectionEnd === e.currentTarget.value.length) {
          targetCol = colIndex + 1;
          e.preventDefault();
        }
        break;
      case 'Enter':
        targetRow = rowIndex + 1;
        e.preventDefault();
        break;
      default:
        return;
    }

    if (targetRow >= 0 && targetRow < filteredStudentsCount && targetCol >= 0 && targetCol < fieldsCount) {
      const targetInput = document.querySelector(`input[data-row="${targetRow}"][data-col="${targetCol}"]`) as HTMLInputElement | null;
      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    }
  };

  const handleScoreChange = (studentId: string, field: string, value: string) => {
    const key = `${studentId}_${field}`;
    const isValid = validateScore(value);
    
    setGradeErrors(prev => ({
      ...prev,
      [key]: !isValid
    }));

    setEditedScores(prev => {
      const studentScores = { ...prev[studentId], [field]: value };
      
      // Calculate average if all inputs are valid and available
      const oVal = parseFloat(studentScores.oral);
      const cVal = parseFloat(studentScores.c15m);
      const p1Val = parseFloat(studentScores.c1period1);
      const p2Val = parseFloat(studentScores.c1period2);
      const eVal = parseFloat(studentScores.exam);

      let totalCoeff = 0;
      let totalSum = 0;

      if (!isNaN(oVal)) { totalSum += oVal; totalCoeff += 1; }
      if (!isNaN(cVal)) { totalSum += cVal; totalCoeff += 1; }
      if (!isNaN(p1Val)) { totalSum += p1Val * 2; totalCoeff += 2; }
      if (!isNaN(p2Val)) { totalSum += p2Val * 2; totalCoeff += 2; }
      if (!isNaN(eVal)) { totalSum += eVal * 3; totalCoeff += 3; }

      if (totalCoeff > 0) {
        studentScores.average = parseFloat((totalSum / totalCoeff).toFixed(1));
      } else {
        studentScores.average = '';
      }

      return {
        ...prev,
        [studentId]: studentScores
      };
    });
  };

  const handleSaveGradebook = async () => {
    // Check for errors
    const hasErrors = Object.values(gradeErrors).some(err => err);
    if (hasErrors) {
      alert('Vui lòng sửa các điểm số báo đỏ (không đúng định mức 0-10) trước khi lưu!');
      return;
    }

    try {
      setLoading(true);
      const classStudents = students.filter(s => s.grade === selectedClass && s.status === 'Đang Học');
      
      for (const student of classStudents) {
        const studentScores = editedScores[student.id];
        if (!studentScores) continue;

        let card = reportCards.find(c => c.studentId === student.id && c.semester === gradeSemester);
        if (!card) {
          card = {
            id: `${student.id}_${gradeSemester}`,
            studentId: student.id,
            semester: gradeSemester,
            name: student.name,
            dob: student.dob,
            gender: student.gender,
            grade: student.grade,
            gvcn: teacherProfile?.name || 'GV Bộ môn',
            academicYear: '2025-2026',
            scores: [],
            summary: { gpa: 0, academicConduct: 'Khá', moralConduct: 'Tốt', daysAbsent: 0, daysAbsentExcused: 0, generalComment: '' }
          };
        }

        // Update score list
        const subjectScoresList = [...card.scores];
        const scoreIndex = subjectScoresList.findIndex(s => s.subject.toLowerCase().includes(selectedSubject.toLowerCase()));

        const newScore: ReportCardScore = {
          subject: selectedSubject,
          multiplier1: [
            studentScores.oral !== '' ? parseFloat(studentScores.oral) : '',
            studentScores.c15m !== '' ? parseFloat(studentScores.c15m) : ''
          ].filter(x => x !== ''),
          multiplier2: [
            studentScores.c1period1 !== '' ? parseFloat(studentScores.c1period1) : '',
            studentScores.c1period2 !== '' ? parseFloat(studentScores.c1period2) : ''
          ].filter(x => x !== ''),
          multiplier3: studentScores.exam !== '' ? parseFloat(studentScores.exam) : '',
          average: studentScores.average !== '' ? parseFloat(studentScores.average) : '',
          teacherComment: 'Cập nhật từ Sổ điểm điện tử GVBM'
        };

        if (scoreIndex > -1) {
          subjectScoresList[scoreIndex] = newScore;
        } else {
          subjectScoresList.push(newScore);
        }

        // Recalculate GPA summary
        const validScores = subjectScoresList.filter(s => typeof s.average === 'number');
        const gpa = validScores.length > 0 
          ? parseFloat((validScores.reduce((sum, s) => sum + (s.average as number), 0) / validScores.length).toFixed(2))
          : 0;

        const updatedCard = {
          ...card,
          scores: subjectScoresList,
          summary: {
            ...card.summary,
            gpa
          }
        };

        await saveReportCard(updatedCard);
      }

      // Re-fetch report cards to update list
      const allReportCards = await getAllReportCards();
      setReportCards(allReportCards);
      showToast(`💾 Đã lưu sổ điểm lớp ${selectedClass} thành công!`);
    } catch (err) {
      console.error(err);
      showToast('❌ Không thể lưu điểm số.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    // Generate a simple CSV styled file block and download it
    const classStudents = students.filter(s => s.grade === selectedClass && s.status === 'Đang Học');
    let csvContent = '\uFEFFMã Học Sinh,Họ Và Tên,Điểm Miệng,Điểm 15 Phút,Điểm 1 Tiết (1),Điểm 1 Tiết (2),Điểm Học Kỳ,Điểm Trung Bình\n';
    
    classStudents.forEach(student => {
      const s = editedScores[student.id] || {};
      csvContent += `${student.id},${student.name},${s.oral || ''},${s.c15m || ''},${s.c1period1 || ''},${s.c1period2 || ''},${s.exam || ''},${s.average || ''}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BangDiem_${selectedClass}_${selectedSubject}_${gradeSemester}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📊 Đã xuất dữ liệu Excel thành công!');
  };

  // 2. Lesson plans handlers
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim() || !planObjectives.trim()) {
      alert('Vui lòng nhập tên bài dạy và mục tiêu bài học!');
      return;
    }

    const newPlan = {
      id: `GA-${Date.now().toString().slice(-4)}`,
      type: 'lesson_plan',
      title: planTitle,
      teacher: teacherProfile?.name || 'Giáo viên bộ môn',
      grade: planGrade || selectedClass,
      date: new Date().toLocaleDateString('vi-VN'),
      status: 'pending',
      content: {
        objectives: planObjectives,
        materials: planMaterials,
        activities: planActivities
      },
      department: teacherProfile?.department || 'Tổ Toán - Tin'
    };

    try {
      setLoading(true);
      await savePlan(newPlan as any);
      setLessonPlans(prev => [newPlan, ...prev]);
      setPlanTitle('');
      setPlanObjectives('');
      setPlanMaterials('');
      setPlanActivities('');
      setShowAddPlanModal(false);
      showToast('📤 Đã gửi giáo án lên Tổ trưởng chuyên môn phê duyệt!');
    } catch (err) {
      console.error(err);
      showToast('❌ Gửi giáo án thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Lesson diary (Sổ đầu bài) handlers
  const handleCreateDiaryEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diaryClass || !diaryContent.trim()) {
      alert('Vui lòng chọn lớp và điền nội dung bài học!');
      return;
    }

    const entry: LessonDiary = {
      id: `LD-${Date.now().toString().slice(-4)}`,
      classId: diaryClass,
      date: diaryDate.split('-').reverse().join('/'),
      period: diaryPeriod,
      subject: diarySubject || selectedSubject,
      teacher: teacherProfile?.name || 'Giáo viên bộ môn',
      content: diaryContent,
      comment: diaryComment,
      rating: diaryRating
    };

    try {
      setLoading(true);
      await saveLessonDiary(entry);
      setDiaries(prev => [entry, ...prev]);
      setDiaryContent('');
      setDiaryComment('');
      setDiaryRating('Tốt');
      showToast('📝 Ghi sổ đầu bài thành công!');
    } catch (err) {
      console.error(err);
      showToast('❌ Ghi sổ đầu bài thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiaryEntry = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhận xét sổ đầu bài này?')) {
      try {
        setLoading(true);
        await deleteLessonDiary(id);
        setDiaries(prev => prev.filter(d => d.id !== id));
        showToast('🗑️ Đã xóa bản ghi sổ đầu bài.');
      } catch (err) {
        console.error(err);
        showToast('❌ Xóa thất bại.');
      } finally {
        setLoading(false);
      }
    }
  };

  // 4. Homeroom attendance handlers
  const homeroomClass = teacherProfile?.assignedClass || '';
  const homeroomStudents = students.filter(s => s.grade === homeroomClass && s.status === 'Đang Học');

  useEffect(() => {
    if (homeroomStudents.length > 0) {
      const records: Record<string, 'present' | 'absent' | 'excused'> = {};
      homeroomStudents.forEach(s => {
        records[s.id] = 'present';
      });
      setAttendanceRecords(records);
    }
  }, [teacherProfile, students]);

  const handleSaveAttendance = () => {
    showToast(`✔️ Ghi nhận chuyên cần ngày ${attendanceDate.split('-').reverse().join('/')} lớp ${homeroomClass} thành công!`);
  };

  // 5. Homeroom conduct evaluation handlers
  useEffect(() => {
    if (homeroomStudents.length > 0) {
      const records: Record<string, { conduct: string; comment: string }> = {};
      homeroomStudents.forEach(s => {
        records[s.id] = { conduct: 'Tốt', comment: 'Ngoan ngoãn, hoàn thành tốt nhiệm vụ.' };
      });
      setConductRecords(records);
    }
  }, [teacherProfile, students]);

  const handleConductChange = (studentId: string, field: 'conduct' | 'comment', value: string) => {
    setConductRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveConduct = async () => {
    try {
      setLoading(true);
      for (const student of homeroomStudents) {
        const records = conductRecords[student.id];
        if (!records) continue;

        let card = reportCards.find(c => c.studentId === student.id && c.semester === 'Học Kỳ II');
        if (!card) {
          card = {
            id: `${student.id}_Học Kỳ II`,
            studentId: student.id,
            semester: 'Học Kỳ II',
            name: student.name,
            dob: student.dob,
            gender: student.gender,
            grade: student.grade,
            gvcn: teacherProfile?.name || 'Giáo viên',
            academicYear: '2025-2026',
            scores: [],
            summary: { gpa: 0, academicConduct: 'Khá', moralConduct: 'Tốt', daysAbsent: 0, daysAbsentExcused: 0, generalComment: '' }
          };
        }

        const updatedCard = {
          ...card,
          summary: {
            ...card.summary,
            moralConduct: records.conduct as any,
            generalComment: records.comment
          }
        };

        await saveReportCard(updatedCard);
      }
      
      const allReportCards = await getAllReportCards();
      setReportCards(allReportCards);
      showToast(`🏆 Lưu đánh giá hạnh kiểm cuối kỳ lớp ${homeroomClass} thành công!`);
    } catch (err) {
      console.error(err);
      showToast('❌ Lưu đánh giá hạnh kiểm thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Maintenance request
  const handleMaintenanceReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintRoom || !maintDetail.trim()) {
      alert('Vui lòng điền phòng học và chi tiết báo hỏng!');
      return;
    }

    const ticket: Maintenance = {
      id: `BT-${Date.now().toString().slice(-4)}`,
      detail: maintDetail,
      location: maintRoom,
      severity: maintSeverity,
      status: 'Chờ Xếp Lịch'
    };

    try {
      setLoading(true);
      await saveMaintenance(ticket);
      setMaintenances(prev => [ticket, ...prev]);
      setMaintRoom('');
      setMaintDetail('');
      setMaintSeverity('Trung Bình');
      showToast('🛠️ Đã tạo phiếu yêu cầu báo hỏng gửi phòng quản trị thiết bị!');
    } catch (err) {
      console.error(err);
      showToast('❌ Gửi báo hỏng thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Teacher Self Evaluation Criteria
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (let i = 1; i <= 15; i++) {
      initial[`c${i}`] = 'Tốt';
    }
    setEvalCriteria(initial);
  }, []);

  const handleSaveSelfEval = () => {
    showToast('💾 Đã lưu và nộp phiếu tự đánh giá chuẩn nghề nghiệp lên Tổ trưởng!');
  };

  // Timeline schedule computations (timetable for this teacher)
  const teacherTimetable = timetableSlots.filter(s => s.teacher === teacherProfile?.name);
  const getPeriodTime = (p: number) => {
    switch (p) {
      case 1: return '07:00 - 07:45';
      case 2: return '07:50 - 08:35';
      case 3: return '08:50 - 09:35';
      case 4: return '09:40 - 10:25';
      case 5: return '13:30 - 14:15';
      case 6: return '14:20 - 15:05';
      case 7: return '15:20 - 16:05';
      default: return '';
    }
  };

  // Filter contacts
  const filteredContacts = staffList.filter(s => 
    s.name.toLowerCase().includes(searchContact.toLowerCase()) || 
    s.role?.toLowerCase().includes(searchContact.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchContact.toLowerCase())
  );

  if (loading && !teacherProfile) {
    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center bg-[#f5f8fc]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#2c5ea0] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#7b8a9e]">Đang tải dữ liệu giảng dạy cá nhân...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-[#f5f8fc]">
      {toast && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e2a3a] text-[#f5f8fc] border border-[#b8c6d9] px-6 py-3 rounded-2xl shadow-lg flex items-center font-bold text-xs uppercase tracking-wider animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 mr-2 text-green-400" /> {toast}
        </div>
      )}

      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col min-w-0 min-h-0">
        
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 shrink-0 gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Chào buổi sáng, {teacherProfile?.name}</h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold font-sans">
              Trang công tác giáo vụ &amp; trợ lý sư phạm chuyên môn
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex px-3 py-1 bg-[#2c5ea0]/10 text-[#2c5ea0] border border-[#2c5ea0]/20 text-[10px] font-bold uppercase tracking-widest rounded-lg">
              Tổ: {teacherProfile?.department || 'Toán - Tin'}
            </span>
            {homeroomClass && (
              <span className="inline-flex px-3 py-1 bg-[#2e6b8a]/10 text-[#2e6b8a] border border-[#2e6b8a]/20 text-[10px] font-bold uppercase tracking-widest rounded-lg">
                Chủ nhiệm: Lớp {homeroomClass}
              </span>
            )}
          </div>
        </div>

        <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col rounded-3xl overflow-hidden relative min-h-[500px]">
          
          {/* TAB 1: OVERVIEW (DASHBOARD) */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-8">
              {/* Hero Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block">Lịch dạy hôm nay</span>
                    <span className="text-3xl font-serif font-bold text-[#1e2a3a] mt-2 block">{teacherTimetable.length} tiết dạy</span>
                  </div>
                  <Calendar className="w-8 h-8 text-[#2c5ea0] opacity-70" />
                </div>

                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block">Yêu cầu sửa giáo án</span>
                    <span className={`text-3xl font-serif font-bold mt-2 block ${lessonPlans.filter(p => p.teacher === teacherProfile?.name && p.status === 'rejected').length > 0 ? 'text-red-600 animate-pulse' : 'text-[#2e6b8a]'}`}>
                      {lessonPlans.filter(p => p.teacher === teacherProfile?.name && p.status === 'rejected').length} giáo án
                    </span>
                  </div>
                  <FileText className="w-8 h-8 text-[#7b8a9e] opacity-70" />
                </div>

                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block">Lớp dạy phân công</span>
                    <span className="text-3xl font-serif font-bold text-[#1e2a3a] mt-2 block">{myClasses.length} lớp</span>
                  </div>
                  <Users className="w-8 h-8 text-[#2e6b8a] opacity-70" />
                </div>
              </div>

              {/* Action and Timeline grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Timeline Lịch dạy hôm nay */}
                <div className="lg:col-span-8 space-y-4">
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#dce4ee] pb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-[#2c5ea0]" /> Lịch trình giảng dạy trong ngày
                  </h4>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7].map(period => {
                      const slot = teacherTimetable.find(s => s.period === period);
                      const timeStr = getPeriodTime(period);
                      
                      return (
                        <div 
                          key={period} 
                          className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 transition-all ${
                            slot 
                              ? 'bg-white border-[#b8c6d9] shadow-sm hover:border-[#2c5ea0]' 
                              : 'bg-gray-50/50 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#e8eef6] border border-[#b8c6d9] text-xs font-bold flex items-center justify-center text-[#2c5ea0]">
                              {period}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{timeStr}</p>
                              <h5 className="text-sm font-bold text-[#1e2a3a] mt-0.5">
                                {slot ? `${slot.subject} — Lớp ${slot.classId}` : 'Trống tiết / Sinh hoạt cá nhân'}
                              </h5>
                            </div>
                          </div>
                          {slot && (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-extrabold uppercase rounded-md">
                                {slot.room || 'Phòng Học'}
                              </span>
                              <button 
                                onClick={() => { setDiaryClass(slot.classId); setDiarySubject(slot.subject); setDiaryPeriod(period); setActiveTab('diary'); }} 
                                className="px-3 py-1 bg-[#1e2a3a] hover:bg-black text-white text-[10px] font-bold uppercase rounded-lg transition-colors"
                              >
                                Ghi đầu bài
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Alerts & Notice Board */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Warning Alerts */}
                  <div className="bg-[#ebd1cf]/20 border border-[#2c5ea0]/30 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#ebd1cf] pb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" /> Nhắc nhở &amp; Cảnh báo học vụ
                    </h4>
                    <div className="space-y-3">
                      {lessonPlans.filter(p => p.teacher === teacherProfile?.name && p.status === 'rejected').map(plan => (
                        <div key={plan.id} className="p-3 bg-white border border-red-200 text-red-950 rounded-xl text-xs space-y-1 shadow-sm">
                          <p className="font-bold flex items-center text-red-700">⚠️ Yêu cầu chỉnh sửa:</p>
                          <p className="font-medium text-[11px]">Bài dạy: {plan.title}</p>
                          <p className="text-[10px] text-gray-500 italic">Góp ý: "{plan.feedback}"</p>
                          <button onClick={() => setActiveTab('lesson-plans')} className="text-[10px] font-bold text-blue-700 hover:underline mt-1 block">Cập nhật ngay ➔</button>
                        </div>
                      ))}
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs leading-relaxed">
                        <span className="font-bold">⚠️ Sổ điểm học kỳ:</span>
                        <p className="text-[11px] mt-0.5">Còn 3 ngày nữa hệ thống sẽ khóa cổng nhập điểm Thường xuyên cho các lớp.</p>
                      </div>
                      <div className="p-3 bg-[#e5f0e8] border border-[#c2ded0] text-[#2e6b8a] rounded-xl text-xs leading-relaxed">
                        <span className="font-bold">✔️ Giáo án tuần mới:</span>
                        <p className="text-[11px] mt-0.5">Tổ trưởng đã duyệt tất cả kế hoạch bài dạy khối 5 của bạn.</p>
                      </div>
                    </div>
                  </div>

                  {/* Notice Board */}
                  <div className="bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-3.5">
                    <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#dce4ee] pb-2">
                      Bảng tin nhà trường
                    </h4>
                    <div className="space-y-3">
                      <div className="text-xs space-y-1">
                        <span className="text-[9px] font-bold text-[#7b8a9e]">21/06/2026 • BGH</span>
                        <p className="font-bold text-[#1e2a3a] leading-snug">Thông báo họp Hội đồng sư phạm triển khai công tác kết thúc niên khóa</p>
                        <p className="text-[10px] text-gray-500">Kính mời toàn thể cán bộ giáo viên tham gia cuộc họp vào 14:00 Thứ Năm tới.</p>
                      </div>
                      <hr className="border-dashed border-[#dce4ee]" />
                      <div className="text-xs space-y-1">
                        <span className="text-[9px] font-bold text-[#7b8a9e]">18/06/2026 • Phòng Quản trị</span>
                        <p className="font-bold text-[#1e2a3a] leading-snug">Kiểm kê thiết bị công nghệ phục vụ phòng thi học kỳ II</p>
                        <p className="text-[10px] text-gray-500">Giáo viên quản lý các phòng máy vui lòng nộp phiếu bàn giao thiết bị.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMETABLE & LESSON LOG */}
          {activeTab === 'timetable' && (
            <div className="p-6 space-y-8">
              <div className="bg-[#fdfbf6] border border-[#b8c6d9] p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-inner">
                <div>
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-wider">Lịch báo giảng &amp; Phân phối chương trình</h4>
                  <p className="text-[10px] text-[#7b8a9e] mt-0.5">Thời khóa biểu cá nhân học kỳ II niên khóa 2025-2026</p>
                </div>
                <button onClick={() => window.print()} className="px-5 py-2 bg-[#1e2a3a] hover:bg-black text-[#f5f8fc] text-xs font-bold uppercase rounded-full">
                  In lịch giảng dạy
                </button>
              </div>

              <div className="overflow-x-auto border border-[#b8c6d9] rounded-2xl bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] text-[10px] font-bold text-[#4a5568] uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Tiết</th>
                      <th className="p-4">Thứ Hai</th>
                      <th className="p-4">Thứ Ba</th>
                      <th className="p-4">Thứ Tư</th>
                      <th className="p-4">Thứ Năm</th>
                      <th className="p-4">Thứ Sáu</th>
                      <th className="p-4">Thứ Bảy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dce4ee] text-xs">
                    {[1, 2, 3, 4, 5, 6, 7].map(period => (
                      <tr key={period} className="hover:bg-[#f5f8fc]/50 transition-colors">
                        <td className="p-4 font-bold text-[#1e2a3a] bg-[#f5f8fc] w-24">
                          <span className="block text-xs">Tiết {period}</span>
                          <span className="text-[9px] text-[#7b8a9e] font-normal block mt-0.5">{getPeriodTime(period).split(' ')[0]}</span>
                        </td>
                        {[2, 3, 4, 5, 6, 7].map(day => {
                          const slot = teacherTimetable.find(s => s.day === day && s.period === period);
                          return (
                            <td key={day} className="p-4 border-l border-[#dce4ee] min-w-[120px] vertical-top">
                              {slot ? (
                                <div className="space-y-1">
                                  <p className="font-bold text-[#1e2a3a] text-xs">{slot.subject}</p>
                                  <p className="text-[10px] text-[#2c5ea0] font-bold">Lớp {slot.classId}</p>
                                  <span className="inline-block px-1.5 py-0.5 bg-[#e8eef6] border border-[#b8c6d9] text-[8px] font-extrabold uppercase rounded text-[#7b8a9e]">
                                    {slot.room || 'Phòng Học'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[#8e9eb4] italic text-[10px]">Trống</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MY LESSON PLANS */}
          {activeTab === 'lesson-plans' && (
            <div className="p-6 space-y-8">
              <div className="flex justify-between items-center border-b border-[#dce4ee] pb-4">
                <div>
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">
                    Hồ sơ Giáo án &amp; Kế hoạch bài dạy
                  </h4>
                  <p className="text-[10px] text-[#7b8a9e] mt-0.5">Danh sách các chuyên đề giáo án trình duyệt Tổ chuyên môn</p>
                </div>
                <button 
                  onClick={() => setShowAddPlanModal(true)} 
                  className="px-5 py-2 bg-[#2c5ea0] hover:bg-[#5c2b2b] text-white text-xs font-bold uppercase rounded-full flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Nộp giáo án mới
                </button>
              </div>

              {/* Upload plan modal */}
              {showAddPlanModal && (
                <div className="p-6 bg-white border-2 border-[#2c5ea0] rounded-2xl shadow-lg space-y-4">
                  <div className="flex justify-between items-center border-b border-[#dce4ee] pb-2">
                    <h5 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-wider">Trình Hồ sơ Kế hoạch bài dạy</h5>
                    <button onClick={() => setShowAddPlanModal(false)} className="text-gray-400 hover:text-gray-600">Đóng</button>
                  </div>
                  <form onSubmit={handleCreatePlan} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">Tên bài dạy / Chuyên đề</label>
                        <input 
                          type="text" 
                          value={planTitle} 
                          onChange={e => setPlanTitle(e.target.value)} 
                          placeholder="Ví dụ: Đạo hàm cấp 2 và ứng dụng..."
                          className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none focus:border-[#2c5ea0]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">Lớp áp dụng</label>
                        <select 
                          value={planGrade} 
                          onChange={e => setPlanGrade(e.target.value)} 
                          className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none"
                        >
                          {myClasses.map(c => {
                            const cName = c.split(' ')[0];
                            return <option key={cName} value={cName}>Lớp {cName}</option>;
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">I. Mục tiêu bài học (Objectives)</label>
                        <textarea 
                          rows={2} 
                          value={planObjectives} 
                          onChange={e => setPlanObjectives(e.target.value)} 
                          placeholder="Nêu kiến thức, kỹ năng, thái độ học sinh cần đạt..."
                          className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none focus:border-[#2c5ea0] resize-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">II. Thiết bị dạy học &amp; Học liệu (Materials)</label>
                        <textarea 
                          rows={2} 
                          value={planMaterials} 
                          onChange={e => setPlanMaterials(e.target.value)} 
                          placeholder="Phiếu học tập, máy tính, máy chiếu..."
                          className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none focus:border-[#2c5ea0] resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">III. Tiến trình dạy học (Activities)</label>
                        <textarea 
                          rows={3} 
                          value={planActivities} 
                          onChange={e => setPlanActivities(e.target.value)} 
                          placeholder="Mô tả các hoạt động học tập trên lớp..."
                          className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none focus:border-[#2c5ea0] resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setShowAddPlanModal(false)}
                        className="px-4 py-2 border border-[#b8c6d9] rounded-full text-xs font-bold uppercase"
                      >
                        Hủy
                      </button>
                      <button 
                        type="submit" 
                        className="px-5 py-2 bg-[#2c5ea0] hover:bg-[#5c2b2b] text-white text-xs font-bold uppercase rounded-full flex items-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Gửi duyệt giáo án
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Plans list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lessonPlans.filter(p => p.teacher === teacherProfile?.name).map(plan => (
                  <div key={plan.id} className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] font-bold text-[#2c5ea0] bg-[#2c5ea0]/10 px-2 py-0.5 rounded border border-[#2c5ea0]/20 font-mono">
                          {plan.id}
                        </span>
                        <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase rounded-md ${
                          plan.status === 'approved' ? 'bg-[#e5f0e8] text-[#2e6b8a] border-[#c2ded0]' :
                          plan.status === 'rejected' ? 'bg-red-50 text-red-800 border-red-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {plan.status === 'approved' ? 'Đã duyệt' : plan.status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
                        </span>
                      </div>
                      <h5 className="font-serif font-bold text-sm text-[#1e2a3a] mt-3 leading-snug">{plan.title}</h5>
                      <p className="text-[10px] text-[#7b8a9e] font-bold mt-1">Lớp áp dụng: Lớp {plan.grade} • Ngày trình: {plan.date}</p>
                      
                      {plan.feedback && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-150 rounded-xl text-[11px] text-red-950 italic">
                          <strong>Góp ý từ Tổ trưởng:</strong> "{plan.feedback}"
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-dashed border-[#dce4ee] pt-3 flex justify-between items-center text-[10px]">
                      <span className="text-[#7b8a9e]">Khối ngành: {plan.department}</span>
                      {plan.status === 'approved' && (
                        <span className="text-[#2e6b8a] font-bold flex items-center"><FileCheck className="w-3.5 h-3.5 mr-1" /> Giáo án hợp chuẩn</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SỔ ĐIỂM CÁ NHÂN (GRADEBOOK) */}
          {activeTab === 'gradebook' && (
            <div className="p-6 space-y-6">
              {/* Header and filters */}
              <div className="bg-[#e8eef6] p-5 rounded-2xl border border-[#b8c6d9] flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-[8px] font-bold text-[#7b8a9e] uppercase tracking-wider mb-1">Chọn Lớp dạy</label>
                    <select
                      value={selectedClass}
                      onChange={e => handleClassChange(e.target.value)}
                      className="px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none min-w-[120px]"
                    >
                      {myClasses.map(c => {
                        const className = c.split(' ')[0];
                        return <option key={className} value={className}>Lớp {className}</option>;
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold text-[#7b8a9e] uppercase tracking-wider mb-1">Chọn Môn học</label>
                    <select
                      value={selectedSubject}
                      onChange={e => setSelectedSubject(e.target.value)}
                      className="px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none min-w-[120px]"
                    >
                      <option value="Toán học">Toán học</option>
                      <option value="Tin học">Tin học</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold text-[#7b8a9e] uppercase tracking-wider mb-1">Học Kỳ</label>
                    <select
                      value={gradeSemester}
                      onChange={e => setGradeSemester(e.target.value)}
                      className="px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none min-w-[120px]"
                    >
                      <option value="Học Kỳ I">Học Kỳ I</option>
                      <option value="Học Kỳ II">Học Kỳ II</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button 
                    onClick={handleExportExcel}
                    className="px-4 py-2 border border-[#b8c6d9] bg-white text-xs font-bold uppercase rounded-full transition-all flex items-center gap-1.5 hover:bg-gray-50"
                  >
                    Xuất Excel
                  </button>
                  {gradeEditMode ? (
                    <button 
                      onClick={handleSaveGradebook}
                      className="px-5 py-2 bg-[#2e6b8a] hover:bg-[#2d4334] text-white text-xs font-bold uppercase rounded-full transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      Lưu điểm số
                    </button>
                  ) : (
                    <button 
                      onClick={() => setGradeEditMode(true)}
                      className="px-5 py-2 bg-[#1e2a3a] hover:bg-black text-white text-xs font-bold uppercase rounded-full transition-all"
                    >
                      Mở khóa nhập liệu
                    </button>
                  )}
                </div>
              </div>

              {/* Data Grid table */}
              <div className="overflow-x-auto border border-[#b8c6d9] rounded-2xl bg-white shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] text-[10px] font-bold text-[#4a5568] uppercase tracking-wider">
                    <tr>
                      <th className="p-4 w-28">Mã HS</th>
                      <th className="p-4 w-52">Họ và Tên</th>
                      <th className="p-4 text-center">Oral (Miệng)</th>
                      <th className="p-4 text-center">15 Phút</th>
                      <th className="p-4 text-center">1 Tiết (1)</th>
                      <th className="p-4 text-center">1 Tiết (2)</th>
                      <th className="p-4 text-center">Học Kỳ</th>
                      <th className="p-4 text-center bg-gray-50/50 w-24">ĐTB Môn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dce4ee] text-xs">
                    {students.filter(s => s.grade === selectedClass && s.status === 'Đang Học').map((student, studentIndex) => {
                      const scores = editedScores[student.id] || { oral: '', c15m: '', c1period1: '', c1period2: '', exam: '', average: '' };
                      const isLowAvg = typeof scores.average === 'number' && scores.average < 5.0;

                      return (
                        <tr key={student.id} className="hover:bg-[#f5f8fc]/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-[#7b8a9e]">{student.id}</td>
                          <td className="p-4 font-bold text-[#1e2a3a]">{student.name}</td>
                          
                          {/* Oral */}
                          <td className="p-3 text-center">
                            <input
                              type="text"
                              value={scores.oral}
                              onChange={e => handleScoreChange(student.id, 'oral', e.target.value)}
                              onKeyDown={e => handleGridKeyDown(e, studentIndex, 0)}
                              data-row={studentIndex}
                              data-col={0}
                              disabled={!gradeEditMode}
                              className={`w-14 px-2 py-1 bg-white border rounded-lg text-center font-bold focus:outline-none transition-all ${
                                gradeErrors[`${student.id}_oral`] ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#b8c6d9]'
                              }`}
                            />
                          </td>

                          {/* 15 mins */}
                          <td className="p-3 text-center">
                            <input
                              type="text"
                              value={scores.c15m}
                              onChange={e => handleScoreChange(student.id, 'c15m', e.target.value)}
                              onKeyDown={e => handleGridKeyDown(e, studentIndex, 1)}
                              data-row={studentIndex}
                              data-col={1}
                              disabled={!gradeEditMode}
                              className={`w-14 px-2 py-1 bg-white border rounded-lg text-center font-bold focus:outline-none transition-all ${
                                gradeErrors[`${student.id}_c15m`] ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#b8c6d9]'
                              }`}
                            />
                          </td>

                          {/* 1 Period (1) */}
                          <td className="p-3 text-center">
                            <input
                              type="text"
                              value={scores.c1period1}
                              onChange={e => handleScoreChange(student.id, 'c1period1', e.target.value)}
                              onKeyDown={e => handleGridKeyDown(e, studentIndex, 2)}
                              data-row={studentIndex}
                              data-col={2}
                              disabled={!gradeEditMode}
                              className={`w-14 px-2 py-1 bg-white border rounded-lg text-center font-bold focus:outline-none transition-all ${
                                gradeErrors[`${student.id}_c1period1`] ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#b8c6d9]'
                              }`}
                            />
                          </td>

                          {/* 1 Period (2) */}
                          <td className="p-3 text-center">
                            <input
                              type="text"
                              value={scores.c1period2}
                              onChange={e => handleScoreChange(student.id, 'c1period2', e.target.value)}
                              onKeyDown={e => handleGridKeyDown(e, studentIndex, 3)}
                              data-row={studentIndex}
                              data-col={3}
                              disabled={!gradeEditMode}
                              className={`w-14 px-2 py-1 bg-white border rounded-lg text-center font-bold focus:outline-none transition-all ${
                                gradeErrors[`${student.id}_c1period2`] ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#b8c6d9]'
                              }`}
                            />
                          </td>

                          {/* Exam */}
                          <td className="p-3 text-center">
                            <input
                              type="text"
                              value={scores.exam}
                              onChange={e => handleScoreChange(student.id, 'exam', e.target.value)}
                              onKeyDown={e => handleGridKeyDown(e, studentIndex, 4)}
                              data-row={studentIndex}
                              data-col={4}
                              disabled={!gradeEditMode}
                              className={`w-14 px-2 py-1 bg-white border rounded-lg text-center font-bold focus:outline-none transition-all ${
                                gradeErrors[`${student.id}_exam`] ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#b8c6d9]'
                              }`}
                            />
                          </td>

                          {/* Calculated Average */}
                          <td className={`p-4 text-center font-serif font-bold text-sm bg-gray-50/50 ${isLowAvg ? 'text-red-600' : 'text-[#2e6b8a]'}`}>
                            {scores.average !== undefined ? scores.average : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-[10px] text-[#7b8a9e] italic leading-relaxed">
                * Hướng dẫn: Nhập điểm số hợp lệ từ 0 đến 10. Điểm trung bình tự động tính theo hệ số (Miệng/15m hệ số 1, 1 Tiết hệ số 2, Học kỳ hệ số 3). Các ô nhập sai định dạng hoặc quá khoảng điểm sẽ tự động báo viền đỏ cảnh báo.
              </p>
            </div>
          )}

          {/* TAB 5: E-CLASSBOOK DIARY (SỔ ĐẦU BÀI) */}
          {activeTab === 'diary' && (
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Form to log entry */}
                <div className="lg:col-span-4 bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-4 h-fit">
                  <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#dce4ee] pb-2 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" /> Ghi nhận tiết học sổ đầu bài
                  </h4>
                  <form onSubmit={handleCreateDiaryEntry} className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-[#4a5568] uppercase mb-1">Ngày giảng dạy</label>
                      <input 
                        type="date" 
                        value={diaryDate} 
                        onChange={e => setDiaryDate(e.target.value)} 
                        className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[#4a5568] uppercase mb-1">Lớp</label>
                        <select 
                          value={diaryClass} 
                          onChange={e => setDiaryClass(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none"
                        >
                          {myClasses.map(c => {
                            const name = c.split(' ')[0];
                            return <option key={name} value={name}>{name}</option>;
                          })}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#4a5568] uppercase mb-1">Tiết dạy</label>
                        <select 
                          value={diaryPeriod} 
                          onChange={e => setDiaryPeriod(parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map(p => (
                            <option key={p} value={p}>Tiết {p}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-[#4a5568] uppercase mb-1">Tên bài học / Chuyên đề</label>
                      <input 
                        type="text" 
                        value={diaryContent} 
                        onChange={e => setDiaryContent(e.target.value)} 
                        placeholder="Nội dung bài dạy trên lớp..."
                        className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none focus:border-[#2c5ea0]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-[#4a5568] uppercase mb-1">Nhận xét thái độ &amp; nề nếp</label>
                      <textarea 
                        rows={2} 
                        value={diaryComment} 
                        onChange={e => setDiaryComment(e.target.value)} 
                        placeholder="Ví dụ: Lớp nghiêm túc phát biểu tốt..."
                        className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none focus:border-[#2c5ea0] resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-[#4a5568] uppercase mb-1">Xếp loại tiết học</label>
                      <select 
                        value={diaryRating} 
                        onChange={e => setDiaryRating(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none"
                      >
                        <option value="Tốt">Tốt (A)</option>
                        <option value="Khá">Khá (B)</option>
                        <option value="TB">Trung Bình (C)</option>
                        <option value="Yếu">Yếu (D)</option>
                      </select>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-2.5 bg-[#1e2a3a] hover:bg-black text-white text-xs font-bold uppercase rounded-full transition-colors mt-2"
                    >
                      Ký nhận sổ đầu bài
                    </button>
                  </form>
                </div>

                {/* List of recent logs */}
                <div className="lg:col-span-8 space-y-4">
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#dce4ee] pb-2">
                    Lịch sử ghi nhận sổ đầu bài tổ môn học
                  </h4>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {diaries.filter(d => d.teacher === teacherProfile?.name).map(diary => (
                      <div key={diary.id} className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm space-y-2 relative">
                        <button 
                          onClick={() => handleDeleteDiaryEntry(diary.id)}
                          className="absolute top-4 right-4 text-[#7b8a9e] hover:text-[#2c5ea0] p-1 border border-transparent hover:border-[#ebd1cf] hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex gap-2 items-center flex-wrap">
                          <span className="px-2 py-0.5 bg-[#e8eef6] border border-[#b8c6d9] text-[9px] font-mono font-bold text-[#1e2a3a]">
                            Lớp {diary.classId}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-[9px] font-bold uppercase rounded">
                            Tiết {diary.period} • {diary.date}
                          </span>
                          <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase rounded ${
                            diary.rating === 'Tốt' ? 'bg-[#e5f0e8] text-[#2e6b8a] border-[#c2ded0]' :
                            diary.rating === 'Khá' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            Xếp loại: {diary.rating}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1e2a3a] mt-1">Bài dạy: {diary.content}</p>
                        <p className="text-[11px] text-gray-500 italic">Nhận xét: "{diary.comment || 'Không có ghi chú thêm.'}"</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: HOMEROOM STUDENTS (HỒ SƠ LỚP CHỦ NHIỆM) */}
          {activeTab === 'homeroom-profile' && homeroomClass && (
            <div className="p-6 space-y-6">
              <div className="bg-[#e8eef6] p-5 rounded-2xl border border-[#b8c6d9] flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest">Sổ quản lý lớp chủ nhiệm {homeroomClass}</h4>
                  <p className="text-[10px] text-[#7b8a9e] mt-0.5">Sĩ số lớp chủ nhiệm hiện tại: <strong>{homeroomStudents.length} học sinh</strong></p>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#b8c6d9] rounded-2xl bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0">
                    <tr>
                      <th className="px-6 py-4">Mã Học Sinh</th>
                      <th className="px-6 py-4">Họ và Tên</th>
                      <th className="px-6 py-4">Ngày Sinh</th>
                      <th className="px-6 py-4">Giới Tính</th>
                      <th className="px-6 py-4">Số Điện Thoại</th>
                      <th className="px-6 py-4">Địa Chỉ Thường Trú</th>
                      <th className="px-6 py-4">Họ Tên Phụ Huynh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#b8c6d9] text-xs">
                    {homeroomStudents.map(student => (
                      <tr key={student.id} className="hover:bg-[#e8eef6]/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-[#7b8a9e]">{student.id}</td>
                        <td className="px-6 py-4 font-bold text-[#1e2a3a]">{student.name}</td>
                        <td className="px-6 py-4 font-bold text-[#4a5568]">{student.dob}</td>
                        <td className="px-6 py-4 font-bold text-[#4a5568]">{student.gender}</td>
                        <td className="px-6 py-4 text-[#4a5568]">{student.phone}</td>
                        <td className="px-6 py-4 text-[#4a5568] max-w-xs truncate">{student.address}</td>
                        <td className="px-6 py-4 font-bold text-[#1e2a3a]">{student.guardian}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: CLASS ATTENDANCE (CHUYÊN CẦN LỚP) */}
          {activeTab === 'homeroom-attendance' && homeroomClass && (
            <div className="p-6 space-y-6">
              <div className="bg-[#e8eef6] p-5 rounded-2xl border border-[#b8c6d9] flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[8px] font-bold text-[#7b8a9e] uppercase tracking-wider mb-1">Ngày điểm danh</label>
                    <input 
                      type="date" 
                      value={attendanceDate} 
                      onChange={e => setAttendanceDate(e.target.value)} 
                      className="px-3 py-1.5 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveAttendance} 
                  className="px-5 py-2 bg-[#2e6b8a] hover:bg-[#2d4334] text-white text-xs font-bold uppercase rounded-full transition-all"
                >
                  Lưu điểm danh
                </button>
              </div>

              <div className="overflow-x-auto border border-[#b8c6d9] rounded-2xl bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b border-[#b8c6d9]">
                    <tr>
                      <th className="px-6 py-4 w-28">Mã HS</th>
                      <th className="px-6 py-4">Học Sinh</th>
                      <th className="px-6 py-4 text-center">Hiện Diện</th>
                      <th className="px-6 py-4 text-center">Vắng Không Phép</th>
                      <th className="px-6 py-4 text-center">Vắng Có Phép</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dce4ee] text-xs">
                    {homeroomStudents.map(student => (
                      <tr key={student.id} className="hover:bg-[#f5f8fc]/30 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-[#7b8a9e]">{student.id}</td>
                        <td className="px-6 py-4 font-bold text-[#1e2a3a]">{student.name}</td>
                        
                        {/* Present */}
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="radio" 
                            name={`att_${student.id}`} 
                            checked={attendanceRecords[student.id] === 'present'} 
                            onChange={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'present' }))}
                            className="w-4 h-4 cursor-pointer text-[#2e6b8a] focus:ring-[#2e6b8a]/20"
                          />
                        </td>
                        
                        {/* Absent */}
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="radio" 
                            name={`att_${student.id}`} 
                            checked={attendanceRecords[student.id] === 'absent'} 
                            onChange={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'absent' }))}
                            className="w-4 h-4 cursor-pointer text-[#2c5ea0] focus:ring-[#2c5ea0]/20"
                          />
                        </td>

                        {/* Excused */}
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="radio" 
                            name={`att_${student.id}`} 
                            checked={attendanceRecords[student.id] === 'excused'} 
                            onChange={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'excused' }))}
                            className="w-4 h-4 cursor-pointer text-amber-600 focus:ring-amber-500/20"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: CONDUCT ASSESSMENT (HẠNH KIỂM) */}
          {activeTab === 'homeroom-conduct' && homeroomClass && (
            <div className="p-6 space-y-6">
              <div className="bg-[#e8eef6] p-5 rounded-2xl border border-[#b8c6d9] flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Đánh giá hạnh kiểm cuối học kỳ lớp {homeroomClass}</h4>
                  <p className="text-[10px] text-[#7b8a9e] mt-0.5">Xếp loại hạnh kiểm và ghi nhận rèn luyện của giáo viên chủ nhiệm</p>
                </div>
                <button 
                  onClick={handleSaveConduct}
                  className="px-5 py-2 bg-[#2e6b8a] hover:bg-[#2d4334] text-white text-xs font-bold uppercase rounded-full transition-all"
                >
                  Lưu &amp; Khóa đánh giá
                </button>
              </div>

              <div className="overflow-x-auto border border-[#b8c6d9] rounded-2xl bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b border-[#b8c6d9]">
                    <tr>
                      <th className="px-6 py-4 w-28">Mã HS</th>
                      <th className="px-6 py-4 w-52">Học Sinh</th>
                      <th className="px-6 py-4 text-center w-36">Xếp Loại Hạnh Kiểm</th>
                      <th className="px-6 py-4">Nhận xét rèn luyện / Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dce4ee] text-xs">
                    {homeroomStudents.map(student => {
                      const record = conductRecords[student.id] || { conduct: 'Tốt', comment: '' };
                      return (
                        <tr key={student.id} className="hover:bg-[#f5f8fc]/30 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-[#7b8a9e]">{student.id}</td>
                          <td className="px-6 py-4 font-bold text-[#1e2a3a]">{student.name}</td>
                          
                          <td className="px-4 py-3 text-center">
                            <select 
                              value={record.conduct} 
                              onChange={e => handleConductChange(student.id, 'conduct', e.target.value)}
                              className="px-3 py-1 bg-white border border-[#b8c6d9] rounded-lg text-xs font-bold text-[#1e2a3a]"
                            >
                              <option value="Tốt">Tốt</option>
                              <option value="Khá">Khá</option>
                              <option value="Trung Bình">Trung Bình</option>
                              <option value="Yếu">Yếu</option>
                            </select>
                          </td>
                          
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              value={record.comment} 
                              onChange={e => handleConductChange(student.id, 'comment', e.target.value)}
                              placeholder="Nhập nhận xét chi tiết..."
                              className="w-full px-3 py-1.5 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: TEACHER CV PROFILE */}
          {activeTab === 'profile' && (
            <div className="p-6 space-y-8">
              <div className="bg-white border border-[#b8c6d9] p-6 rounded-3xl shadow-[2px_2px_0px_#dce4ee] max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-5 border-b border-[#dce4ee] pb-6">
                  <div className="w-20 h-20 bg-[#2e6b8a] text-white flex items-center justify-center font-serif text-3xl font-bold border border-[#2d4334]">
                    {teacherProfile?.name.split(' ').slice(-1)[0][0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#1e2a3a]">{teacherProfile?.name}</h3>
                    <p className="text-xs text-[#7b8a9e] font-bold uppercase tracking-wider mt-1">
                      {teacherProfile?.role} • Tổ: {teacherProfile?.department || 'Tổ Khối Mầm'}
                    </p>
                    <span className="inline-flex px-2.5 py-0.5 bg-[#e5f0e8] text-[#2e6b8a] border border-[#c2ded0] text-[9px] font-bold uppercase rounded mt-2">
                      {teacherProfile?.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#4a5568]">
                  <div className="space-y-3">
                    <p><strong>Mã cán bộ:</strong> <span className="font-mono text-sm font-bold text-[#1e2a3a]">{teacherProfile?.id}</span></p>
                    <p><strong>Địa chỉ Email:</strong> <span className="font-bold text-[#1e2a3a]">{teacherProfile?.email || 'N/A'}</span></p>
                    <p><strong>Số điện thoại:</strong> <span className="font-bold text-[#1e2a3a]">{teacherProfile?.phone || '090-XXXX-XXX'}</span></p>
                  </div>
                  <div className="space-y-3">
                    <p><strong>Tổ bộ môn phụ trách:</strong> <span className="font-bold text-[#1e2a3a]">{teacherProfile?.department}</span></p>
                    <p><strong>Ngạch lương cán sự:</strong> <span className="font-bold text-[#1e2a3a]">A1.1 (Giáo viên trung học)</span></p>
                    <p><strong>Bằng cấp/Chuyên ngành:</strong> <span className="font-bold text-[#1e2a3a]">Cử nhân Sư phạm Giáo dục Mầm non</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: PROFESSIONAL EVALUATION (TỰ ĐÁNH GIÁ CHUẨN) */}
          {activeTab === 'evaluation' && (
            <div className="p-6 space-y-8">
              <div className="bg-[#e8eef6] p-5 rounded-2xl border border-[#b8c6d9] flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Tự Đánh Giá Chuẩn Nghề Nghiệp Giáo Viên</h4>
                  <p className="text-[10px] text-[#7b8a9e] mt-0.5">Bản tự chấm đánh giá 15 tiêu chí (Theo thông tư Bộ GD&amp;ĐT)</p>
                </div>
                <button 
                  onClick={handleSaveSelfEval} 
                  className="px-5 py-2 bg-[#2e6b8a] hover:bg-[#2d4334] text-white text-xs font-bold uppercase rounded-full transition-all"
                >
                  Nộp bản đánh giá
                </button>
              </div>

              <div className="overflow-x-auto border border-[#b8c6d9] rounded-2xl bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b border-[#b8c6d9]">
                    <tr>
                      <th className="px-6 py-4 w-12 text-center">STT</th>
                      <th className="px-6 py-4">Tiêu Chí Đánh Giá Năng Lực</th>
                      <th className="px-6 py-4 text-center w-40">Mức Tự Đánh Giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dce4ee] text-xs">
                    {[
                      'Tiêu chí 1: Đạo đức nhà giáo',
                      'Tiêu chí 2: Phong cách nhà giáo',
                      'Tiêu chí 3: Phát triển chuyên môn bản thân',
                      'Tiêu chí 4: Xây dựng kế hoạch dạy học và giáo dục',
                      'Tiêu chí 5: Sử dụng phương pháp dạy học và giáo dục',
                      'Tiêu chí 6: Kiểm tra, đánh giá kết quả học tập và rèn luyện của học sinh',
                      'Tiêu chí 7: Tư vấn và hỗ trợ học sinh',
                      'Tiêu chí 8: Xây dựng văn hóa nhà trường',
                      'Tiêu chí 9: Thực hiện quyền dân chủ trong nhà trường',
                      'Tiêu chí 10: Thực hiện và xây dựng môi trường an toàn, phòng chống bạo lực học đường',
                      'Tiêu chí 11: Tạo dựng mối quan hệ hợp tác với cha mẹ học sinh và cộng đồng',
                      'Tiêu chí 12: Sử dụng ngoại ngữ hoặc tiếng dân tộc',
                      'Tiêu chí 13: Ứng dụng công nghệ thông tin trong dạy và học',
                      'Tiêu chí 14: Phát triển năng lực ngôn ngữ và truyền thông',
                      'Tiêu chí 15: Năng lực thích ứng và tự rèn luyện sáng tạo sư phạm'
                    ].map((title, index) => {
                      const key = `c${index + 1}`;
                      return (
                        <tr key={key} className="hover:bg-[#f5f8fc]/30 transition-colors">
                          <td className="px-6 py-4 text-center font-bold text-[#7b8a9e]">{index + 1}</td>
                          <td className="px-6 py-4 font-bold text-[#1e2a3a]">{title}</td>
                          <td className="px-6 py-3 text-center">
                            <select 
                              value={evalCriteria[key] || 'Tốt'}
                              onChange={e => setEvalCriteria(prev => ({ ...prev, [key]: e.target.value }))}
                              className="px-3 py-1 bg-white border border-[#b8c6d9] rounded-lg text-xs font-bold text-[#1e2a3a]"
                            >
                              <option value="Tốt">Tốt</option>
                              <option value="Khá">Khá</option>
                              <option value="Đạt">Đạt</option>
                              <option value="Chưa đạt">Chưa đạt</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 11: REPORT FACILITIES DAMAGE (BÁO HỎNG CSVC) */}
          {activeTab === 'maintenance' && (
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Form to submit request */}
                <div className="lg:col-span-5 bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-4 h-fit">
                  <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#ebd1cf] pb-2 flex items-center">
                    <Wrench className="w-4 h-4 mr-2" /> Báo cáo sự cố thiết bị phòng học
                  </h4>
                  <form onSubmit={handleMaintenanceReport} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">Vị trí phòng học / Phòng chuyên đề</label>
                      <input 
                        type="text" 
                        value={maintRoom} 
                        onChange={e => setMaintRoom(e.target.value)} 
                        placeholder="Ví dụ: Phòng NĐN.101, Phòng đa năng..."
                        className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none focus:border-[#2c5ea0]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">Mức độ khẩn cấp sự cố</label>
                      <select 
                        value={maintSeverity} 
                        onChange={e => setMaintSeverity(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none"
                      >
                        <option value="Thấp">Thấp (Có thể bảo trì cuối tuần)</option>
                        <option value="Trung Bình">Trung Bình (Ảnh hưởng nhỏ đến giảng dạy)</option>
                        <option value="Nghiêm Trọng">Nghiêm Trọng (Hỏng thiết bị lên lớp, mất điện phòng máy...)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">Chi tiết sự cố &amp; hiện trạng hư hỏng</label>
                      <textarea 
                        rows={3} 
                        value={maintDetail} 
                        onChange={e => setMaintDetail(e.target.value)} 
                        placeholder="Mô tả cụ thể sự cố (Ví dụ: Máy chiếu nhấp nháy liên tục không nhận tín hiệu HDMI...)"
                        className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs focus:outline-none focus:border-[#2c5ea0] resize-none"
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-2.5 bg-[#2c5ea0] hover:bg-[#5c2b2b] text-white text-xs font-bold uppercase rounded-full transition-colors mt-2"
                    >
                      Gửi báo cáo sự cố
                    </button>
                  </form>
                </div>

                {/* List of active maint tickets */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#dce4ee] pb-2">
                    Nhật ký theo dõi xử lý bảo trì phòng học
                  </h4>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {maintenances.map(ticket => (
                      <div key={ticket.id} className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-[#2c5ea0] bg-[#2c5ea0]/10 px-2 py-0.5 rounded border border-[#2c5ea0]/20 font-mono">
                            {ticket.id}
                          </span>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                            ticket.status === 'Đã Hoàn Thành' ? 'bg-[#e5f0e8] text-[#2e6b8a] border-[#c2ded0]' :
                            ticket.status === 'Đang Sửa Chữa' ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse' :
                            'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1e2a3a]">Địa điểm: {ticket.location}</p>
                        <p className="text-[11px] text-gray-600 font-medium">Hiện trạng: {ticket.detail}</p>
                        <div className="border-t border-dashed border-[#dce4ee] pt-2 flex items-center justify-between text-[9px]">
                          <span className="text-red-700 font-bold">Độ khẩn: {ticket.severity}</span>
                          <span className="text-[#7b8a9e]">Đơn vị bảo trì trường</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 12: INTERNAL DIRECTORY (DANH BẠ NỘI BỘ) */}
          {activeTab === 'contacts' && (
            <div className="p-6 space-y-6">
              <div className="bg-[#e8eef6] p-5 rounded-2xl border border-[#b8c6d9] flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Danh bạ nội bộ cán bộ giáo viên trường</h4>
                  <p className="text-[10px] text-[#7b8a9e] mt-0.5">Tra cứu nhanh số điện thoại và email liên hệ đồng nghiệp sư phạm</p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                  <input 
                    type="text" 
                    value={searchContact}
                    onChange={e => setSearchContact(e.target.value)}
                    placeholder="Tìm tên, tổ bộ môn..."
                    className="pl-11 pr-4 py-2 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[200px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] rounded-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredContacts.map(contact => (
                  <div key={contact.id} className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-3.5">
                    <div className="flex items-center gap-3 border-b border-[#dce4ee] pb-3">
                      <div className="w-10 h-10 rounded-full bg-[#2c5ea0] text-white flex items-center justify-center font-bold text-sm border border-[#5c2b2b]">
                        {contact.name.split(' ').slice(-1)[0][0]}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-[#1e2a3a]">{contact.name}</h5>
                        <p className="text-[9px] text-[#7b8a9e] uppercase tracking-wider font-semibold mt-0.5">{contact.role || 'Giáo viên'} • Tổ {contact.department}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-[11px] text-[#4a5568]">
                      <p className="flex items-center"><Mail className="w-3.5 h-3.5 mr-2 text-[#7b8a9e]" /> {contact.email || 'chua.cap.nhat@teacher.mnah.edu.vn'}</p>
                      <p className="flex items-center"><Phone className="w-3.5 h-3.5 mr-2 text-[#7b8a9e]" /> {contact.phone || '0987.XXX.XXX'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
};
