import React, { useState, useEffect, useRef } from 'react';
import {
  School, Star, Users, Award, BookOpen, Shield, Clock, ChevronDown,
  ArrowRight, CheckCircle2, BarChart2, Calendar, FileText, Heart,
  Cpu, Globe, Lock, Phone, Mail, MapPin, ChevronRight,
  GraduationCap, Building2, ClipboardList, Activity, TrendingUp,
  Play, X, Menu, Target, Compass, Newspaper, Check, Info, FileSpreadsheet,
  Calculator, Atom, Palette, Briefcase, Sun, Moon, User, UserCheck
} from 'lucide-react';
import SystemLogo from '../ui/SystemLogo';
import { getStaffList, Staff } from '../../services/hrService';
import { auth } from '../../services/firebase';
import { getDepartments, Department as DbDepartment, saveAdmission, AdmissionRecord } from '../../services/dbService';


interface LandingPageProps {
  onEnterSystem: () => void;
}

type SubPage = 'home' | 'about' | 'staff' | 'activities' | 'admissions' | 'contact';

interface FacultyMember {
  name: string;
  role: 'head' | 'deputy' | 'member';
  roleLabel: string;
  subject: string;
}

interface Department {
  id: string;
  name: string;
  desc: string;
  members: FacultyMember[];
  logo?: string;
  type?: 'Tổ khối lớp' | 'Tổ chuyên biệt';
}

export const getDepartmentIcon = (logoKey: string = '') => {
  switch (logoKey.toLowerCase()) {
    case 'math':
    case 'calculator':
      return Calculator;
    case 'literature':
    case 'book':
    case 'bookopen':
      return BookOpen;
    case 'languages':
    case 'globe':
      return Globe;
    case 'science':
    case 'atom':
      return Atom;
    case 'social':
    case 'compass':
      return Compass;
    case 'art':
    case 'palette':
      return Palette;
    case 'sport':
    case 'activity':
      return Activity;
    case 'office':
    case 'briefcase':
      return Briefcase;
    default:
      return School;
  }
};

export const isImageUrl = (url: string = '') => {
  return url.startsWith('http://') || 
         url.startsWith('https://') || 
         url.startsWith('/') || 
         url.startsWith('data:image/') ||
         /\.(jpeg|jpg|gif|png|svg|webp)($|\?)/i.test(url);
};


const DEFAULT_DEPT_CONFIGS = [
  {
    id: 'nha-tre',
    name: 'Tổ Khối Nhà Trẻ',
    desc: 'Phụ trách nuôi dưỡng, giáo dục trẻ từ 18 đến 36 tháng tuổi, rèn luyện thói quen tự lập và chăm sóc bữa ăn giấc ngủ chu đáo.',
    keywords: ['nhà trẻ', 'toddler']
  },
  {
    id: 'khoi-mam',
    name: 'Tổ Khối Mầm (3 tuổi)',
    desc: 'Phát triển ngôn ngữ, khả năng nhận thức thế giới xung quanh và hướng dẫn bé làm quen bạn bè thông qua các trò chơi tập thể.',
    keywords: ['mầm', 'lớp mầm', '3 tuổi']
  },
  {
    id: 'khoi-choi',
    name: 'Tổ Khối Chồi (4 tuổi)',
    desc: 'Bồi dưỡng khả năng tư duy sáng tạo, kể chuyện, vẽ tranh và các vận động thể chất khéo léo cho trẻ 4 tuổi.',
    keywords: ['chồi', 'lớp chồi', '4 tuổi']
  },
  {
    id: 'khoi-la',
    name: 'Tổ Khối Lá (5 tuổi)',
    desc: 'Chuẩn bị tâm thế, rèn chữ cái, chữ số cơ bản và rèn luyện kỹ năng tự lập vững vàng để trẻ sẵn sàng bước vào lớp 1 Tiểu học.',
    keywords: ['lá', 'lớp lá', '5 tuổi']
  },
  {
    id: 'dinh-duong',
    name: 'Tổ Dinh Dưỡng & Bếp Ăn',
    desc: 'Phụ trách tính toán khẩu phần ăn khoa học, chế biến suất ăn vệ sinh, giàu dinh dưỡng cho sự phát triển khỏe mạnh của trẻ.',
    keywords: ['dinh dưỡng', 'nhà bếp', 'bếp ăn', 'boarding']
  }
];

const FALLBACK_DB_DEPARTMENTS: DbDepartment[] = [
  { id: 'nha-tre', name: 'Tổ Khối Nhà Trẻ', description: 'Phụ trách nuôi dưỡng, giáo dục trẻ từ 18 đến 36 tháng tuổi, rèn luyện thói quen tự lập và chăm sóc bữa ăn giấc ngủ chu đáo.', head: 'Cô Lê Thị Thảo', deputyHead: 'Cô Nguyễn Thanh Vy', staffCount: 6, status: 'Hoạt Động', logo: 'school' },
  { id: 'khoi-mam', name: 'Tổ Khối Mầm (3 tuổi)', description: 'Phát triển ngôn ngữ, khả năng nhận thức thế giới xung quanh và hướng dẫn bé làm quen bạn bè thông qua các trò chơi tập thể.', head: 'Cô Nguyễn Thị Hoa', deputyHead: 'Cô Phạm Hồng Đào', staffCount: 5, status: 'Hoạt Động', logo: 'school' },
  { id: 'khoi-choi', name: 'Tổ Khối Chồi (4 tuổi)', description: 'Bồi dưỡng khả năng tư duy sáng tạo, kể chuyện, vẽ tranh và các vận động thể chất khéo léo cho trẻ 4 tuổi.', head: 'Cô Hoàng Thị Hương', deputyHead: 'Cô Nguyễn Thu Trang', staffCount: 5, status: 'Hoạt Động', logo: 'art' },
  { id: 'khoi-la', name: 'Tổ Khối Lá (5 tuổi)', description: 'Chuẩn bị tâm thế, rèn chữ cái, chữ số cơ bản và rèn luyện kỹ năng tự lập vững vàng để trẻ sẵn sàng bước vào lớp 1 Tiểu học.', head: 'Cô Trần Thị Hồng', deputyHead: 'Cô Lê Thu Hà', staffCount: 5, status: 'Hoạt Động', logo: 'school' },
  { id: 'dinh-duong', name: 'Tổ Dinh Dưỡng & Bếp Ăn', description: 'Phụ trách tính toán khẩu phần ăn khoa học, chế biến suất ăn vệ sinh, giàu dinh dưỡng cho sự phát triển khỏe mạnh của trẻ.', head: 'Cô Đặng Thị Quỳnh', deputyHead: 'Cô Lê Thu Thủy', staffCount: 5, status: 'Hoạt Động', logo: 'sport' }
];

const FALLBACK_STAFF: Staff[] = [
  // Ban Giám hiệu
  { id: 'CB_BGH01', name: 'Cô Nguyễn Thị Lan', dob: '15/04/1972', gender: 'Nữ', role: 'Hiệu trưởng', department: 'Ban Giám hiệu', phone: '0901234567', email: 'ntlan@admin.mnah.edu.vn', status: 'Đang Công Tác' },
  { id: 'CB_BGH02', name: 'Cô Trần Thị Huệ', dob: '22/09/1976', gender: 'Nữ', role: 'Phó Hiệu trưởng Chuyên môn', department: 'Ban Giám hiệu', phone: '0907654321', email: 'tthue@admin.mnah.edu.vn', status: 'Đang Công Tác' },
  { id: 'CB_BGH03', name: 'Cô Lê Minh Đức', dob: '05/11/1978', gender: 'Nữ', role: 'Phó Hiệu trưởng Nuôi dưỡng', department: 'Ban Giám hiệu', phone: '0912345678', email: 'lmduc@admin.mnah.edu.vn', status: 'Đang Công Tác' },

  // Tổ Khối Nhà Trẻ
  { id: 'CB_NT01', name: 'Cô Lê Thị Thảo', dob: '12/03/1980', gender: 'Nữ', role: 'Tổ trưởng chuyên môn', department: 'Tổ Khối Nhà Trẻ', phone: '0901112223', email: 'ltthao@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Chăm sóc trẻ' },
  { id: 'CB_NT02', name: 'Cô Nguyễn Thanh Vy', dob: '18/07/1984', gender: 'Nữ', role: 'Tổ phó chuyên môn', department: 'Tổ Khối Nhà Trẻ', phone: '0902223334', email: 'ntvy@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Giáo dục mầm non' },
  { id: 'CB_NT03', name: 'Cô Lê Thu Hà', dob: '25/08/1988', gender: 'Nữ', role: 'Giáo viên bộ môn', department: 'Tổ Khối Nhà Trẻ', phone: '', email: 'ltha@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Chăm sóc trẻ' },

  // Tổ Khối Mầm
  { id: 'CB_KM01', name: 'Cô Nguyễn Thị Hoa', dob: '10/10/1982', gender: 'Nữ', role: 'Tổ trưởng chuyên môn', department: 'Tổ Khối Mầm (3 tuổi)', phone: '', email: 'nthoa@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Giáo dục mầm non' },
  { id: 'CB_KM02', name: 'Cô Phạm Hồng Đào', dob: '15/06/1986', gender: 'Nữ', role: 'Tổ phó chuyên môn', department: 'Tổ Khối Mầm (3 tuổi)', phone: '', email: 'phdao@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Giáo dục mầm non' },
  { id: 'CB_KM03', name: 'Cô Vũ Khánh Huyền', dob: '20/12/1989', gender: 'Nữ', role: 'Giáo viên bộ môn', department: 'Tổ Khối Mầm (3 tuổi)', phone: '', email: 'vkhuyen@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Giáo dục mầm non' },

  // Tổ Khối Chồi
  { id: 'CB_KC01', name: 'Cô Hoàng Thị Hương', dob: '11/02/1981', gender: 'Nữ', role: 'Tổ trưởng chuyên môn', department: 'Tổ Khối Chồi (4 tuổi)', phone: '', email: 'hthuong@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Năng khiếu' },
  { id: 'CB_KC02', name: 'Cô Nguyễn Thu Trang', dob: '17/04/1983', gender: 'Nữ', role: 'Tổ phó chuyên môn', department: 'Tổ Khối Chồi (4 tuổi)', phone: '', email: 'nttrang@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Giáo dục mầm non' },
  { id: 'CB_KC03', name: 'Cô Trịnh Thu Thảo', dob: '23/07/1987', gender: 'Nữ', role: 'Giáo viên bộ môn', department: 'Tổ Khối Chồi (4 tuổi)', phone: '', email: 'tthao@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Giáo dục mầm non' },

  // Tổ Khối Lá
  { id: 'CB_KL01', name: 'Cô Trần Thị Hồng', dob: '08/08/1980', gender: 'Nữ', role: 'Tổ trưởng chuyên môn', department: 'Tổ Khối Lá (5 tuổi)', phone: '', email: 'tthong@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Chuẩn bị vào lớp 1' },
  { id: 'CB_KL02', name: 'Cô Lê Thu Hà', dob: '14/10/1984', gender: 'Nữ', role: 'Tổ phó chuyên môn', department: 'Tổ Khối Lá (5 tuổi)', phone: '', email: 'ltha5@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Giáo dục mầm non' },
  { id: 'CB_KL03', name: 'Cô Trần Thị Mai', dob: '22/01/1988', gender: 'Nữ', role: 'Giáo viên bộ môn', department: 'Tổ Khối Lá (5 tuổi)', phone: '', email: 'ttmai@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Giáo dục mầm non' },

  // Tổ Dinh Dưỡng
  { id: 'CB_DD01', name: 'Cô Đặng Thị Quỳnh', dob: '06/06/1983', gender: 'Nữ', role: 'Tổ trưởng dinh dưỡng', department: 'Tổ Dinh Dưỡng & Bếp Ăn', phone: '', email: 'dtquynh@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Chế biến dinh dưỡng' },
  { id: 'CB_DD02', name: 'Cô Lê Thu Thủy', dob: '12/12/1982', gender: 'Nữ', role: 'Tổ phó dinh dưỡng', department: 'Tổ Dinh Dưỡng & Bếp Ăn', phone: '', email: 'ltthuy@teacher.mnah.edu.vn', status: 'Đang Công Tác', mainSubject: 'Chế biến dinh dưỡng' }
];

/* ── Animated Counter ──────────────────────────────────────── */
function useCounter(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

/* ── Intersection Observer Hook ────────────────────────────── */
function useIntersection(threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── Stat Card ─────────────────────────────────────────────── */
function StatCard({ value, suffix, label, icon: Icon, visible }: {
  value: number; suffix: string; label: string; icon: React.ElementType; visible: boolean;
}) {
  const count = useCounter(value, 2000, visible);
  return (
    <div className="lp-stat-card">
      <div className="lp-stat-icon"><Icon size={22} /></div>
      <div className="lp-stat-number">{count.toLocaleString('vi-VN')}{suffix}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

/* ── Feature Card ──────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc, color }: {
  icon: React.ElementType; title: string; desc: string; color: string;
}) {
  return (
    <div className="lp-feature-card group">
      <div className="lp-feature-icon" style={{ background: color }}>
        <Icon size={20} className="text-white" />
      </div>
      <h3 className="lp-feature-title">{title}</h3>
      <p className="lp-feature-desc">{desc}</p>
      <div className="lp-feature-arrow">
        <ChevronRight size={16} />
      </div>
    </div>
  );
}

/* ── Testimonial Card ──────────────────────────────────────── */
function TestimonialCard({ name, role, content, avatar }: {
  name: string; role: string; content: string; avatar: string; key?: React.Key;
}) {
  return (
    <div className="lp-testimonial-card">
      <div className="lp-testimonial-stars">
        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
      </div>
      <p className="lp-testimonial-content">"{content}"</p>
      <div className="lp-testimonial-author">
        <div className="lp-testimonial-avatar">{avatar}</div>
        <div>
          <div className="lp-testimonial-name">{name}</div>
          <div className="lp-testimonial-role">{role}</div>
        </div>
      </div>
    </div>
  );
}

/* ── FAQ Accordion ──────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`lp-faq-item ${open ? 'open' : ''}`}>
      <button className="lp-faq-q" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <ChevronDown size={18} className={`lp-faq-chevron ${open ? 'rotated' : ''}`} />
      </button>
      {open && <div className="lp-faq-a">{a}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN LANDING PAGE (SCHOOL PORTAL & INTRODUCTION)
   ═══════════════════════════════════════════════════════════════ */
export const LandingPage: React.FC<LandingPageProps> = ({ onEnterSystem }) => {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [videoModal, setVideoModal] = useState(false);
  const [activePage, setActivePage] = useState<SubPage>('home');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [activeDeptFilter, setActiveDeptFilter] = useState<'all' | 'pedagogy' | 'operational'>('all');

  useEffect(() => {
    const pageTitleMap: Record<SubPage, string> = {
      home: 'Trường Mầm non An Hữu - Khởi Đầu Vững Chắc',
      about: 'Giới thiệu | Mầm non An Hữu - Khởi Đầu Vững Chắc',
      staff: 'Đội ngũ giáo viên | Mầm non An Hữu - Khởi Đầu Vững Chắc',
      activities: 'Hoạt động học tập | Mầm non An Hữu - Khởi Đầu Vững Chắc',
      admissions: 'Tuyển sinh trực tuyến | Mầm non An Hữu - Khởi Đầu Vững Chắc',
      contact: 'Liên hệ | Mầm non An Hữu - Khởi Đầu Vững Chắc'
    };
    document.title = pageTitleMap[activePage] || 'Trường Mầm non An Hữu - Khởi Đầu Vững Chắc';
  }, [activePage]);

  // Admissions Form State
  const [admForm, setAdmForm] = useState({
    fullName: '',
    dob: '',
    gender: 'Nam',
    phone: '',
    email: '',
    hometown: '',
    parentName: '',
    parentPhone: '',
    address: '',
    secondarySchool: '',
    gpa6: '',
    gpa7: '',
    gpa8: '',
    gpa9: '',
    academicClass9: 'Tốt',
    conductClass9: 'Tốt',
    notes: '',
    isFromAnHuu: false,
    thcsStudentCode: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Mầm non Linkage states
  const [mnLoading, setMnLoading] = useState(false);
  const [mnError, setMnError] = useState<string | null>(null);
  const [mnSuccess, setMnSuccess] = useState(false);

  const handleVerifyMNStudent = async () => {
    if (!admForm.thcsStudentCode) {
      setMnError('Vui lòng nhập mã học sinh.');
      return;
    }
    setMnLoading(true);
    setMnError(null);
    setMnSuccess(false);
    try {
      const { fetchMamNonStudentData } = await import('../../services/mamNonLinkService');
      const data = await fetchMamNonStudentData(admForm.thcsStudentCode);
      if (data) {
        setAdmForm(prev => ({
          ...prev,
          fullName: data.fullName,
          dob: data.dob,
          gender: data.gender,
          hometown: data.hometown || prev.hometown,
          address: data.address || prev.address,
          parentName: data.parentName || prev.parentName,
          parentPhone: data.parentPhone || prev.parentPhone,
          secondarySchool: 'Mầm non An Hữu',
          gpa6: '1', // Bản sao Giấy khai sinh (Đã xác thực)
          gpa7: '1', // Đơn xin nhập học (Miễn nộp - đã liên kết)
          gpa8: '1', // Giấy xác nhận cư trú / CCCD phụ huynh (Miễn nộp - đã liên kết)
          gpa9: '1', // Giấy chứng nhận hoàn thành mầm non (Đã xác thực)
          isFromAnHuu: true
        }));
        setMnSuccess(true);
      } else {
        setMnError('Không tìm thấy thông tin học sinh với mã số này tại Mầm non An Hữu. Vui lòng kiểm tra lại.');
      }
    } catch (err) {
      setMnError('Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại.');
    } finally {
      setMnLoading(false);
    }
  };

  const handleDisconnectMN = () => {
    setMnSuccess(false);
    setAdmForm(prev => ({
      ...prev,
      thcsStudentCode: '',
      fullName: '',
      dob: '',
      gender: 'Nam',
      hometown: '',
      address: '',
      parentName: '',
      parentPhone: '',
      secondarySchool: '',
      gpa6: '',
      gpa7: '',
      gpa8: '',
      gpa9: '',
      isFromAnHuu: false
    }));
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setFormLoading(true);
    try {
      const recordId = `TS-${Date.now().toString().slice(-4)}`;
      const record: AdmissionRecord = {
        id: recordId,
        fullName: admForm.fullName,
        dob: admForm.dob,
        gender: admForm.gender,
        phone: admForm.phone,
        email: admForm.email,
        hometown: admForm.hometown,
        parentName: admForm.parentName,
        parentPhone: admForm.parentPhone,
        address: admForm.address,
        secondarySchool: admForm.secondarySchool,
        gpa6: parseFloat(admForm.gpa6) || 0,
        gpa7: parseFloat(admForm.gpa7) || 0,
        gpa8: parseFloat(admForm.gpa8) || 0,
        gpa9: parseFloat(admForm.gpa9) || 0,
        academicClass9: 'Tốt',
        conductClass9: 'Tốt',
        notes: admForm.notes,
        status: 'Chờ Duyệt',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        isFromAnHuu: admForm.isFromAnHuu,
        thcsStudentCode: admForm.isFromAnHuu ? admForm.thcsStudentCode : undefined
      };
      await saveAdmission(record);
      setFormSubmitted(true);
      setAdmForm({
        fullName: '',
        dob: '',
        gender: 'Nam',
        phone: '',
        email: '',
        hometown: '',
        parentName: '',
        parentPhone: '',
        address: '',
        secondarySchool: '',
        gpa6: '',
        gpa7: '',
        gpa8: '',
        gpa9: '',
        academicClass9: 'Tốt',
        conductClass9: 'Tốt',
        notes: '',
        isFromAnHuu: false,
        thcsStudentCode: ''
      });
      setMnSuccess(false);
    } catch (error) {
      alert("Đã xảy ra lỗi trong quá trình nộp hồ sơ. Vui lòng thử lại!");
    } finally {
      setFormLoading(false);
    }
  };



  const statsSection = useIntersection(0.2);
  const featuresSection = useIntersection(0.1);

  // Database personnel state & loading
  const [staffList, setStaffList] = useState<Staff[]>(FALLBACK_STAFF);
  const [dbDepartments, setDbDepartments] = useState<DbDepartment[]>(FALLBACK_DB_DEPARTMENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchStaff = async () => {
      try {
        const [staffData, deptsData] = await Promise.all([
          getStaffList(),
          getDepartments()
        ]);
        if (active) {
          if (staffData && staffData.length > 0) {
            setStaffList(staffData);
          } else {
            setStaffList(FALLBACK_STAFF);
          }
          if (deptsData && deptsData.length > 0) {
            setDbDepartments(deptsData);
          } else {
            setDbDepartments(FALLBACK_DB_DEPARTMENTS);
          }
        }
      } catch (error) {
        console.warn("Failed to fetch staff or departments from Firestore, falling back to mock data", error);
        if (active) {
          setStaffList(FALLBACK_STAFF);
          setDbDepartments(FALLBACK_DB_DEPARTMENTS);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    // Subscribing to auth changes ensures that once a user signs in,
    // the security-ruled collection can be successfully retrieved.
    const unsubscribe = auth.onAuthStateChanged((user) => {
      fetchStaff();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Filter active staff members (excluding disabled/blocked ones)
  const activeStaff = staffList.filter(s => s.status !== 'Bình Chỉ / Khóa');

  // Derive BGH List
  const bghList = activeStaff
    .filter(s => s.role && (s.role.toLowerCase().includes('hiệu trưởng') || s.role.toLowerCase().includes('phó hiệu trưởng')))
    .map(s => {
      let icon = Users;
      let desc = '';
      const roleLower = s.role.toLowerCase();
      if (roleLower.includes('phó')) {
        icon = GraduationCap;
        if (roleLower.includes('chuyên môn')) {
          desc = 'Phụ trách kế hoạch giảng dạy học tập, sắp xếp thời khóa biểu, thi học sinh giỏi và quản lý chuyên môn dạy học.';
        } else if (roleLower.includes('csvc') || roleLower.includes('cơ sở vật chất')) {
          desc = 'Phụ trách cơ sở vật chất, thiết bị thí nghiệm thực hành, an toàn học đường, y tế và bếp ăn bán trú học sinh.';
        } else {
          desc = 'Phụ trách và hỗ trợ quản lý các hoạt động học đường, cơ sở vật chất và phong trào thi đua dạy học.';
        }
      } else {
        icon = Users;
        desc = 'Chỉ đạo toàn diện hoạt động sư phạm, tuyển sinh, tài chính và định hướng chiến lược xây dựng trường học hạnh phúc.';
      }
      return {
        name: s.name,
        title: s.role,
        desc: desc,
        icon: icon
      };
    });

  // Sort BGH list: Hiệu trưởng first, then Phó Hiệu trưởng
  const sortedBghList = [...bghList].sort((a, b) => {
    const aIsHead = a.title.toLowerCase() === 'hiệu trưởng';
    const bIsHead = b.title.toLowerCase() === 'hiệu trưởng';
    if (aIsHead && !bIsHead) return -1;
    if (!aIsHead && bIsHead) return 1;
    return 0;
  });

  // Derive Department Data dynamically based on database departments list
  const departmentsData: Department[] = dbDepartments
    .filter(d => d.status === 'Hoạt Động')
    .map(d => {
      // Filter staff members belonging to this department
      const deptStaff = activeStaff.filter(s => {
        // Exclude BGH members from department org charts
        const isBgh = s.role && (s.role.toLowerCase().includes('hiệu trưởng') || s.role.toLowerCase().includes('phó hiệu trưởng'));
        if (isBgh) return false;
        
        const staffDept = (s.department || '').trim().toLowerCase();
        const dbDeptName = (d.name || '').trim().toLowerCase();
        
        // Direct name match or contains check
        return staffDept === dbDeptName || staffDept.includes(dbDeptName) || dbDeptName.includes(staffDept);
      });

      let hasHead = false;
      let hasDeputy = false;

      // Map staff to FacultyMember structure
      const members: FacultyMember[] = deptStaff.map(s => {
        let mRole: 'head' | 'deputy' | 'member' = 'member';
        let roleLabel = 'Tổ viên';
        const rLower = (s.role || '').toLowerCase();

        if (rLower.includes('tổ trưởng') || rLower.includes('trưởng tổ') || rLower.includes('tổ trưởng chuyên môn')) {
          if (!hasHead) {
            mRole = 'head';
            roleLabel = 'Tổ trưởng';
            hasHead = true;
          } else {
            mRole = 'member';
            roleLabel = 'Tổ viên';
          }
        } else if (rLower.includes('tổ phó') || rLower.includes('phó tổ') || rLower.includes('tổ phó chuyên môn')) {
          if (!hasDeputy) {
            mRole = 'deputy';
            roleLabel = 'Tổ phó';
            hasDeputy = true;
          } else {
            mRole = 'member';
            roleLabel = 'Tổ viên';
          }
        }

        return {
          name: s.name,
          role: mRole,
          roleLabel: s.role || roleLabel,
          subject: s.mainSubject || s.major || 'Chuyên môn'
        };
      });

      // Sort the members array: head -> deputy -> member.
      const sortedMembers = [...members].sort((a, b) => {
        const roleOrder = { head: 0, deputy: 1, member: 2 };
        return roleOrder[a.role] - roleOrder[b.role];
      });

      // Nominate head/deputy if missing but members are present
      const finalMembers = [...sortedMembers];
      let headIndex = finalMembers.findIndex(m => m.role === 'head');
      if (headIndex === -1 && finalMembers.length > 0) {
        // Nominate matching head from database config if exists
        const matchedHeadIdx = finalMembers.findIndex(m => m.name === d.head);
        if (matchedHeadIdx !== -1) {
          finalMembers[matchedHeadIdx].role = 'head';
          finalMembers[matchedHeadIdx].roleLabel = 'Tổ trưởng';
        } else {
          finalMembers[0].role = 'head';
          finalMembers[0].roleLabel = 'Tổ trưởng';
        }
      }

      return {
        id: d.id,
        name: d.name,
        desc: d.description || '',
        members: finalMembers,
        logo: d.logo,
        type: d.type
      };
    });

  const homeKeyStaff = [
    ...sortedBghList,
    ...departmentsData.map(dept => {
      const head = dept.members.find(m => m.role === 'head');
      if (!head) return null;
      return {
        name: head.name,
        title: `${head.roleLabel} ${dept.name}`,
        desc: `Tổ trưởng tổ chuyên môn ${dept.name}, phụ trách định hướng chuyên môn giảng dạy môn ${head.subject}.`,
        icon: BookOpen
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null)
  ].slice(0, 6);

  const navigateToPage = (page: SubPage) => {
    setActivePage(page);
    setSelectedDeptId(null);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks: { label: string; id: SubPage }[] = [
    { label: 'Trang chủ', id: 'home' },
    { label: 'Giới thiệu', id: 'about' },
    { label: 'Đội ngũ', id: 'staff' },
    { label: 'Hoạt động & Học vụ', id: 'activities' },
    { label: 'Tuyển sinh', id: 'admissions' },
    { label: 'Liên hệ', id: 'contact' },
  ];

  const features = [
    { icon: GraduationCap, title: 'Chương trình học chuẩn hóa', desc: 'Đào tạo bám sát chương trình giáo dục mầm non của Bộ GD&ĐT, kết hợp phương pháp học thông qua chơi, kích thích trí tò mò của trẻ.', color: '#f59e0b' },
    { icon: Users, title: 'Đội ngũ cô giáo tâm huyết', desc: 'Các cô giáo đạt chuẩn và trên chuẩn, tận tụy, giàu tình yêu thương trẻ, chăm chút từng bước trưởng thành của học sinh.', color: '#10b981' },
    { icon: Activity, title: 'Hoạt động trải nghiệm sáng tạo', desc: 'Tổ chức các hội thi bé khỏe bé ngoan, làm bánh dân gian, trồng rau sạch nhằm rèn luyện kỹ năng tự lập và tình yêu thiên nhiên.', color: '#f43f5e' },
    { icon: Compass, title: 'Rèn luyện kỹ năng sống nhí', desc: 'Hỗ trợ trẻ làm quen môi trường lớp học mầm non, hướng dẫn nề nếp tự phục vụ bản thân (cất ba lô, xếp nệm gối, rửa tay).', color: '#2d251e' },
    { icon: Building2, title: 'Lớp học hiện đại, an toàn', desc: 'Phòng học trang trí sinh động, trang bị đồ chơi Montessori chất lượng, camera trực tuyến và máy lạnh mát mẻ.', color: '#c2b5a5' },
    { icon: Heart, title: 'Y tế & Chăm sóc sức khỏe', desc: 'Theo dõi chỉ số chiều cao, cân nặng (vẽ biểu đồ BMI), khám nha học đường định kỳ và tủ thuốc y tế đạt chuẩn.', color: '#f59e0b' },
    { icon: Shield, title: 'Dinh dưỡng học đường đạt chuẩn', desc: 'Bếp ăn một chiều vệ sinh, chế độ dinh dưỡng cân đối đạm - đường - béo phù hợp từng độ tuổi của trẻ.', color: '#10b981' },
    { icon: BookOpen, title: 'Góc đọc sách sắc màu', desc: 'Không gian thư viện tranh vẽ đa dạng, kích thích trẻ làm quen với các chữ cái và hình ảnh sinh động thú vị.', color: '#f43f5e' },
    { icon: Award, title: 'Phát triển năng khiếu đa dạng', desc: 'Các câu lạc bộ phụ trợ bổ ích như Aerobic nhí, vẽ tranh cát sáng tạo và học tiếng Anh qua bài hát.', color: '#2d251e' },
  ];

  const testimonials = [
    { name: 'Nguyễn Nam Khánh', role: 'Phụ huynh bé Trần Nam Khánh (lớp Lá 1)', content: 'Gia đình rất yên tâm khi gửi gắm con tại trường. Chế độ dinh dưỡng khoa học, bữa ăn phong phú giúp bé tăng cân khỏe mạnh, phòng học và khu vui chơi rất sạch sẽ, an toàn.', avatar: 'K' },
    { name: 'Trần Thu Thảo', role: 'Phụ huynh bé Lê Minh Trí (nhóm Nhà trẻ)', content: 'Bé đi học không bị khóc nhè, các cô giáo vô cùng kiên nhẫn, dỗ dành bé ăn ngủ đúng giờ. Sổ liên lạc điện tử cập nhật ảnh hoạt động hàng ngày rất tiện lợi.', avatar: 'T' },
    { name: 'Cô Lê Thị Thảo', role: 'Tổ trưởng chuyên môn Khối Nhà trẻ', content: 'Chúng tôi luôn xem mỗi bé như con của mình, không ngừng nâng niu, chăm chút từng bữa ăn, giấc ngủ và giúp các bé thích nghi nhanh với môi trường lớp học.', avatar: 'T' },
    { name: 'Cô Nguyễn Thị Lan', role: 'Hiệu trưởng nhà trường', content: 'Nhà trường hướng tới xây dựng một trường học hạnh phúc, an toàn, giúp trẻ tự do khám phá và phát huy tối đa tiềm năng tự nhiên thông qua vui chơi.', avatar: 'L' },
  ];

  const faqs = [
    { q: 'Độ tuổi tiếp nhận trẻ của trường mầm non là bao nhiêu?', a: 'Trường nhận các bé thuộc lứa tuổi từ 18 tháng đến 72 tháng tuổi (từ Nhóm nhà trẻ đến Khối lớp Lá chuẩn bị vào lớp 1).' },
    { q: 'Hồ sơ nhập học cấp mầm non cần chuẩn bị những gì?', a: 'Hồ sơ gồm: Bản sao Giấy khai sinh (hợp lệ), Đơn xin nhập học (theo mẫu), bản sao Sổ tiêm chủng của bé và Xác nhận thông tin cư trú / CCCD của cha/mẹ (thay thế sổ hộ khẩu giấy).' },
    { q: 'Thực đơn dinh dưỡng của trường được xây dựng thế nào?', a: 'Thực đơn được xây dựng theo tuần, bảo đảm cân đối 4 nhóm dưỡng chất (Đạm, Béo, Đường, Vitamin). Suất ăn được phân chia hợp lý theo độ tuổi: cháo mềm cho nhóm nhà trẻ và cơm dẻo cho mẫu giáo.' },
    { q: 'Nhà trường có camera trực tuyến để phụ huynh theo dõi không?', a: 'Có. Hệ thống camera an ninh được lắp đặt tại toàn bộ khu vực phòng học, khu vui chơi ngoài trời và nhà ăn để Ban giám hiệu giám sát chuyên môn và chia sẻ kết nối định kỳ cho phụ huynh theo dõi bé.' },
  ];


  /* ── 1. RENDER HOME PAGE ── */
  const renderHomePage = () => {
    return (
      <>
        {/* Hero Section */}
        <section className="lp-hero">
          <div className="lp-hero-bg-1" />
          <div className="lp-hero-bg-2" />
          <div className="lp-hero-grid" />

          <div className="lp-hero-inner">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
              <div className="lg:col-span-7 lp-hero-content">
                <div className="lp-hero-badge">
                  <Star size={12} fill="currentColor" />
                  Trường Mầm non Đạt chuẩn quốc gia
                </div>
                <h1 className="lp-hero-title">
                  Trường <span className="lp-hero-title-highlight">Mầm non An Hữu</span>
                </h1>
                <p className="lp-hero-subtitle">Ươm mầm tài năng — Chắp cánh ước mơ</p>
                <p className="lp-hero-desc">
                  Chào mừng bạn đến với cổng thông tin chính thức của Trường Mầm non An Hữu, tỉnh Đồng Tháp. Nơi giáo dục toàn diện, 
                  nuôi dưỡng yêu thương, rèn luyện thói quen tự lập và ươm mầm những bé yêu phát triển khỏe mạnh, tự tin vững vàng.
                </p>
                <div className="lp-hero-actions">
                  <button className="lp-btn-primary" onClick={() => navigateToPage('about')}>
                    Khám phá ngôi trường <ArrowRight size={16} />
                  </button>
                  <button className="lp-btn-secondary" onClick={onEnterSystem}>
                    Cổng thông tin EduCore
                  </button>
                </div>
                <div className="lp-hero-trust">
                  <div className="lp-hero-trust-item">
                    <Award size={14} />
                    <span>Kỷ cương - Tình thương - Trách nhiệm</span>
                  </div>
                  <div className="lp-hero-trust-item">
                    <GraduationCap size={14} />
                    <span>Đội ngũ cô giáo chuẩn & trên chuẩn</span>
                  </div>
                  <div className="lp-hero-trust-item">
                    <Building2 size={14} />
                    <span>Môi trường thân thiện, an toàn</span>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-5 flex justify-center lg:justify-end items-center mt-8 lg:mt-0">
                <div className="relative group select-none">
                  {/* Outer glowing background */}
                  <div className="absolute inset-0 bg-[#2c5ea0]/10 rounded-full blur-3xl group-hover:bg-[#2c5ea0]/20 transition-all duration-700 transform scale-110 pointer-events-none" />
                  
                  {/* Dynamic spinning rings */}
                  <div className="absolute -inset-4 rounded-full border border-dashed border-[#b8c6d9]/20 animate-[spin_45s_linear_infinite] pointer-events-none" />
                  <div className="absolute -inset-8 rounded-full border border-[#2c5ea0]/5 animate-[spin_60s_linear_infinite] pointer-events-none" />
                  
                  {/* Logo Image */}
                  <img 
                    src="/MNAH_Logo.png" 
                    alt="Trường Mầm non An Hữu" 
                    className="w-44 h-44 sm:w-56 sm:h-56 lg:w-72 lg:h-72 object-contain rounded-full shadow-2xl relative z-10 transform transition-all duration-700 group-hover:scale-[1.04] group-hover:rotate-2"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lp-hero-scroll" onClick={() => {
            const el = document.getElementById('home-stats');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <ChevronDown size={28} />
          </div>
        </section>

        {/* Stats Strip */}
        <div id="home-stats" ref={statsSection.ref}>
          <section className="lp-stats-section">
            <div className="lp-section-inner">
              <div className="lp-stats-grid">
                <StatCard value={1200} suffix="+" label="Bé ngoan" icon={Users} visible={statsSection.visible} />
                <StatCard value={80} suffix="+" label="Cán bộ GV" icon={GraduationCap} visible={statsSection.visible} />
                <StatCard value={30} suffix="" label="Lớp học" icon={Building2} visible={statsSection.visible} />
                <StatCard value={100} suffix="%" label="Hoàn thành CTMN" icon={TrendingUp} visible={statsSection.visible} />
                <StatCard value={10} suffix="+" label="Năm truyền thống" icon={Calendar} visible={statsSection.visible} />
              </div>
            </div>
          </section>
        </div>

        {/* Core Values */}
        <section className="lp-section lp-problem-section">
          <div className="lp-section-inner">
            <div className="lp-problem-grid">
              <div>
                <div className="lp-section-badge">Giá trị cốt lõi</div>
                <h2 className="lp-section-title">Nền tảng phát triển bền vững</h2>
                <div className="lp-divider" />
                <div className="lp-problem-list">
                  {[
                    { icon: Target, t: 'Chăm ngoan - Dạy tốt', d: 'Lấy trẻ làm trung tâm, nuôi dưỡng lòng tự tin và phát triển tư duy sáng tạo tự nhiên ở bé.' },
                    { icon: Shield, t: 'An toàn & Yêu thương', d: 'Đảm bảo môi trường học đường an toàn tuyệt đối, bồi dưỡng lòng nhân ái và tình yêu bạn bè.' },
                    { icon: Heart, t: 'Tôn trọng & Lắng nghe', d: 'Mỗi bé đều là một cá thể độc lập, luôn được các cô tôn trọng, lắng nghe và đồng hành phát triển.' },
                    { icon: Compass, t: 'Khám phá & Kỹ năng', d: 'Rèn luyện kỹ năng tự phục vụ bản thân, làm quen tiếng Anh và tự tin khám phá thế giới xung quanh.' },
                  ].map(({ icon: Icon, t, d }) => (
                    <div className="lp-problem-item" key={t}>
                      <div className="lp-problem-icon"><Icon size={18} /></div>
                      <div className="lp-problem-text"><h4>{t}</h4><p>{d}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lp-solution-box">
                <div className="lp-section-badge" style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                  Sứ mệnh & Tầm nhìn
                </div>
                <h3>Ươm mầm thế hệ tương lai toàn diện</h3>
                <p>Trường Mầm non An Hữu hướng đến mục tiêu xây dựng một ngôi trường hạnh phúc, an toàn và thân thiện, giúp các bé phát triển tốt nhất cả về thể chất, trí tuệ lẫn tâm hồn để tự tin vững vàng bước tiếp hành trình mới.</p>
                <div className="lp-solution-check">
                  {['Đội ngũ cô giáo tâm huyết, giàu kinh nghiệm nuôi dạy trẻ', 'Ứng dụng các phương pháp giáo dục tiên tiến, học qua chơi', 'Cơ sở vật chất hiện đại, đồ chơi an toàn, lớp học sạch sẽ', 'Đẩy mạnh các hoạt động kỹ năng tự lập và vận động thể chất', 'Chế độ dinh dưỡng bán trú cân đối, theo dõi sức khỏe thường xuyên'].map(t => (
                    <div className="lp-check-item" key={t}><CheckCircle2 size={16} /><span>{t}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Announcement Board (Bảng Tin Trường) */}
        <section className="lp-section bg-white">
          <div className="lp-section-inner">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="lp-section-badge">Bảng tin nhà trường</div>
              <h2 className="lp-section-title">Tin tức & Hoạt động nổi bật</h2>
              <div className="lp-divider" style={{ margin: '0 auto' }} />
            </div>
            
            <div className="lp-news-grid">
              {[
                {
                  title: 'Kế hoạch Khai giảng Năm học mới 2026 - 2027',
                  date: '15/08/2026',
                  tag: 'Thông báo',
                  desc: 'Trường Mầm non An Hữu thông báo lịch đón trẻ tựu trường, chuẩn bị vật dụng cá nhân và kế hoạch tổ chức lễ khai giảng năm học mới cho toàn thể các bé khối Nhà trẻ, Mầm, Chồi, Lá.',
                  icon: Calendar
                },
                {
                  title: 'Chúc mừng Ngày hội Bé khỏe Bé ngoan cấp Huyện đạt thành tích cao',
                  date: '12/05/2026',
                  tag: 'Thành tích',
                  desc: 'Trong ngày hội vừa qua, trường Mầm non An Hữu tự hào đạt thành tích xuất sắc với 10 bé đạt danh hiệu Bé khỏe Bé ngoan cấp Huyện và giải Nhất toàn đoàn về chuyên môn nuôi dạy trẻ.',
                  icon: Award
                },
                {
                  title: 'Hoạt động trải nghiệm ngoại khóa "Vườn rau xanh của bé"',
                  date: '28/06/2026',
                  tag: 'Trải nghiệm nhí',
                  desc: 'Nhà trường phối hợp cùng Đoàn Thanh niên tổ chức buổi trải nghiệm thực tế cho bé gieo hạt, tưới rau và thu hoạch rau sạch hữu cơ tại khuôn viên vườn trường.',
                  icon: Activity
                }
              ].map((n, i) => (
                <div key={i} className="lp-news-card">
                  <div className="lp-news-badge">
                    <n.icon size={14} className="mr-1 inline" />
                    <span>{n.tag}</span>
                  </div>
                  <h3 className="lp-news-title">{n.title}</h3>
                  <div className="lp-news-date">
                    <Clock size={12} className="inline mr-1" /> {n.date}
                  </div>
                  <p className="lp-news-desc">{n.desc}</p>
                  <button className="lp-news-more" onClick={() => navigateToPage('activities')}>
                    Xem chi tiết <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Daily Schedule Section (Thời Gian Biểu Hàng Ngày) */}
        <section className="lp-section bg-[#fdfbf7] border-t border-b border-[#e7e3d4]">
          <div className="lp-section-inner">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="lp-section-badge">Khung giờ hoạt động</div>
              <h2 className="lp-section-title">Thời Gian Biểu Hàng Ngày</h2>
              <p className="text-xs text-[#7b8a9e] mt-2 font-medium">Quy trình đón trả khoa học giúp bé nề nếp và bảo đảm an toàn tuyệt đối</p>
              <div className="lp-divider" style={{ margin: '0.75rem auto 0 auto' }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 1. Đón Trẻ */}
              <div className="bg-white border-2 border-[#b8c6d9] rounded-3xl p-6 shadow-[4px_4px_0px_#b8c6d9] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#d8e0da] flex items-center justify-center text-[#2e6b8a] mb-4 shadow-inner">
                    <Sun className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#1e2a3a] mb-1">Khung Giờ Đón Trẻ</h3>
                  <span className="inline-block text-[11px] font-bold text-[#2c5ea0] bg-[#e8eef6] px-2.5 py-1 rounded-full uppercase tracking-wider mb-4">
                    07:00 - 08:00
                  </span>
                  <p className="text-xs text-[#4a5568] leading-relaxed">
                    Giáo viên trực sáng đón bé tại cổng trường. Phụ huynh bàn giao bé trực tiếp cho các cô và ký sổ ký nhận/báo suất ăn trong ngày nếu có.
                  </p>
                </div>
                <div className="border-t border-[#e8eef6] pt-4 mt-6 text-[10px] text-[#7b8a9e] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2e6b8a]" /> Giáo viên trực sáng đón bé
                </div>
              </div>

              {/* 2. Hoạt Động Học Tập & Bán Trú */}
              <div className="bg-white border-2 border-[#2c5ea0] rounded-3xl p-6 shadow-[4px_4px_0px_#2c5ea0] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#2c5ea0] text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                  Quan quan trọng
                </div>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#e8eef6] flex items-center justify-center text-[#2c5ea0] mb-4 shadow-inner">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#1e2a3a] mb-1">Hoạt Động Hàng Ngày</h3>
                  <span className="inline-block text-[11px] font-bold text-white bg-[#2c5ea0] px-2.5 py-1 rounded-full uppercase tracking-wider mb-4">
                    08:00 - 16:00
                  </span>
                  <p className="text-xs text-[#4a5568] leading-relaxed">
                    Các hoạt động học tập tích cực phát triển toàn diện 5 lĩnh vực (thể chất, nhận thức, ngôn ngữ, thẩm mỹ, KN xã hội), kết hợp vui chơi trong lớp/ngoài trời và sinh hoạt bán trú (ăn trưa, ngủ trưa, ăn xế).
                  </p>
                </div>
                <div className="border-t border-[#e8eef6] pt-4 mt-6 text-[10px] text-[#2c5ea0] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2c5ea0]" /> Chế độ nuôi dạy toàn diện
                </div>
              </div>

              {/* 3. Trả Trẻ */}
              <div className="bg-white border-2 border-[#b8c6d9] rounded-3xl p-6 shadow-[4px_4px_0px_#b8c6d9] transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-[#d97706] mb-4 shadow-inner">
                    <Moon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#1e2a3a] mb-1">Khung Giờ Trả Trẻ</h3>
                  <span className="inline-block text-[11px] font-bold text-[#d97706] bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider mb-4">
                    16:00 - 17:30
                  </span>
                  <p className="text-xs text-[#4a5568] leading-relaxed">
                    Giáo viên trực chiều bàn giao bé tại cổng hoặc phòng sinh hoạt lớp. Nhà trường chỉ bàn giao bé trực tiếp cho người thân đã đăng ký trong danh sách ủy quyền đưa đón.
                  </p>
                </div>
                <div className="border-t border-[#e8eef6] pt-4 mt-6 text-[10px] text-[#7b8a9e] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#d97706]" /> Xác thực người đưa rước
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Introduction Banner */}
        <section className="lp-cta-section" style={{ background: 'linear-gradient(135deg, #1e2a3a 0%, #131a25 100%)' }}>
          <div className="lp-section-inner">
            <div className="lp-cta-inner">
              <div className="lp-section-badge" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: '#f5f8fc', marginBottom: '1.5rem' }}>
                Video giới thiệu
              </div>
              <h2>Khám phá không gian học đường Mầm non An Hữu</h2>
              <p>Xem video ngắn để tìm hiểu về cơ sở vật chất, hoạt động dạy học tích cực và cuộc sống sinh hoạt bán trú đầy niềm vui của các bạn học sinh dưới mái trường An Hữu.</p>
              <div style={{ marginTop: '2.5rem' }}>
                <button className="lp-btn-white" onClick={() => setVideoModal(true)}>
                  <Play size={16} className="mr-2" /> Phát Video giới thiệu
                </button>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  };

  /* ── 2. RENDER ABOUT PAGE ── */
  const renderAboutPage = () => {
    return (
      <div className="lp-section" style={{ paddingTop: '8rem' }}>
        <div className="lp-section-inner">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="lp-section-badge">Giới thiệu</div>
            <h1 className="lp-section-title">Lịch sử & Truyền thống Nhà trường</h1>
            <div className="lp-divider" style={{ margin: '0 auto' }} />
            <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
              Hành trình hơn một thập kỷ kiến tạo tri thức, phát triển nhân cách và định hình tương lai cho các thế hệ học sinh.
            </p>
          </div>

          <div className="lp-about-grid" style={{ marginBottom: '5rem' }}>
            <div className="lp-about-image">
              <div className="lp-about-img-main">
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <School size={80} color="#a8c4e0" style={{ margin: '0 auto 1rem', display: 'block' }} />
                  <p style={{ color: '#a8c4e0', fontSize: '1.2rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mầm non An Hữu</p>
                  <p style={{ color: '#7b8a9e', fontSize: '0.8rem', marginTop: '0.5rem' }}>Thành lập năm 2015</p>
                </div>
              </div>
              <div className="lp-about-img-badge">
                <span className="num">10+</span>
                <span className="label">Năm truyền thống</span>
              </div>
            </div>
            <div>
              <h2 className="lp-sub-title">1. Quá trình hình thành & phát triển</h2>
              <p className="lp-page-text">
                Trường Mầm non An Hữu được thành lập vào năm 2015, tọa lạc tại xã An Hữu, tỉnh Đồng Tháp. Sự ra đời của nhà trường đáp ứng lòng mong mỏi và nhu cầu học tập của con em nhân dân xã An Hữu cùng các khu vực lân cận.
              </p>
              <p className="lp-page-text">
                Vượt qua những khó khăn ban đầu về cơ sở vật chất, tập thể Hội đồng Sư phạm nhà trường đã không ngừng cố gắng, đoàn kết xây dựng trường lớp ngày càng khang trang và hiện đại. Đến nay, nhà trường tự hào đã đạt chuẩn Quốc gia, trở thành điểm sáng giáo dục tại khu vực phía Tây của tỉnh Đồng Tháp.
              </p>
              <p className="lp-page-text">
                Mỗi năm học trôi qua, trường Mầm non An Hữu luôn đón nhận và chắp cánh cho hàng nghìn học sinh, đào tạo ra những thế hệ đội viên, cháu ngoan Bác Hồ có tri thức, đạo đức tốt và có tinh thần trách nhiệm với quê hương, đất nước.
              </p>
            </div>
          </div>

          {/* Sơ đồ tổ chức */}
          <div style={{ marginBottom: '5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="lp-section-badge">Cơ cấu</div>
              <h2 className="lp-section-title">Sơ đồ Tổ chức Bộ máy Nhà trường</h2>
              <div className="lp-divider" style={{ margin: '0 auto' }} />
            </div>

            <div className="lp-org-chart">
              {/* Cấp 1: Ban Giám hiệu */}
              <div className="lp-org-level">
                <div className="lp-org-node primary">
                  <h4>Ban Giám hiệu</h4>
                  <p>Điều hành chung & Định hướng chiến lược</p>
                </div>
              </div>

              {/* Line connector */}
              <div className="lp-org-connector-vertical" />

              {/* Cấp 2: Các Tổ bộ môn & Đoàn thể */}
              <div className="lp-org-grid">
                <div className="lp-org-node secondary">
                  <h5>Tổ Chuyên môn</h5>
                  <p className="text-[11px] text-[#7b8a9e] mt-1">Gồm 5 tổ khối chuyên môn và dinh dưỡng bám sát chương trình nuôi dạy trẻ.</p>
                </div>
                <div className="lp-org-node secondary">
                  <h5>Ban Phong Trào & Đoàn Thanh Niên</h5>
                  <p className="text-[11px] text-[#7b8a9e] mt-1">Phụ trách văn nghệ, ngày hội thể chất nhí, tổ chức hoạt động vui chơi trải nghiệm ngoài trời.</p>
                </div>
                <div className="lp-org-node secondary">
                  <h5>Hội đồng Sư phạm</h5>
                  <p className="text-[11px] text-[#7b8a9e] mt-1">Quyết định các kế hoạch chăm sóc, giáo dục và phương hướng của trường.</p>
                </div>
                <div className="lp-org-node secondary">
                  <h5>Công đoàn Cơ sở</h5>
                  <p className="text-[11px] text-[#7b8a9e] mt-1">Chăm lo đời sống cho đội ngũ giáo viên, bảo mẫu và nhân viên nhà trường.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách giáo viên chủ chốt */}
          <div>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="lp-section-badge">Đội ngũ</div>
              <h2 className="lp-section-title">Ban Giám hiệu & Tổ trưởng Tổ chuyên môn</h2>
              <div className="lp-divider" style={{ margin: '0 auto' }} />
            </div>

            <div className="lp-tech-grid">
              {homeKeyStaff.map((t, idx) => (
                <div className="lp-tech-card" key={idx} style={{ textAlign: 'left', padding: '1.5rem' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#2c5ea0] flex items-center justify-center border border-[#8fa8c4]">
                      <t.icon size={18} color="#f5f8fc" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#1e2a3a] leading-tight">{t.name}</h4>
                      <p className="text-[10px] text-[#2c5ea0] uppercase tracking-wider font-bold mt-0.5">{t.title}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#4a5568] leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── 3. RENDER ACTIVITIES PAGE ── */
  const renderActivitiesPage = () => {
    return (
      <div className="lp-section" style={{ paddingTop: '8rem' }}>
        <div className="lp-section-inner">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="lp-section-badge">Hoạt động & Học vụ</div>
            <h1 className="lp-section-title">Chương trình Học tập & Hoạt động Giáo dục</h1>
            <div className="lp-divider" style={{ margin: '0 auto' }} />
            <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
              Ươm mầm tư duy toàn diện, trang bị kỹ năng sống và phát triển thể chất lành mạnh cho học sinh mầm non.
            </p>
          </div>

          {/* Chương trình học tập GDPT 2018 */}
          <div className="lp-about-grid" style={{ marginBottom: '5rem', alignItems: 'stretch' }}>
            <div className="lp-solution-box" style={{ borderRadius: 0, padding: '3rem' }}>
              <div className="lp-section-badge" style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                Chương trình nuôi dạy
              </div>
              <h3 className="font-serif text-xl text-[#f59e0b] mb-4">Chương trình Giáo dục Mầm non chuẩn</h3>
              <p className="text-sm text-[#8e9eb4] leading-relaxed mb-6">
                Nhà trường triển khai chương trình Giáo dục Mầm non quốc gia của Bộ GD&ĐT, tập trung phát triển toàn diện 5 lĩnh vực cốt lõi cho sự phát triển đầu đời của trẻ:
              </p>
              <div className="lp-solution-check" style={{ gap: '1rem' }}>
                <div className="lp-check-item">
                  <CheckCircle2 size={16} />
                  <div>
                    <strong className="text-white block text-sm">Làm quen Toán &amp; Chữ cái</strong>
                    <span className="text-[11px] text-[#7b8a9e]">Nền tảng phát triển nhận thức, làm quen mặt số, hình khối và nhận biết bảng chữ cái tiếng Việt.</span>
                  </div>
                </div>
                <div className="lp-check-item">
                  <CheckCircle2 size={16} />
                  <div>
                    <strong className="text-white block text-sm">Làm quen Tiếng Anh sớm</strong>
                    <span className="text-[11px] text-[#7b8a9e]">Tiếp cận ngoại ngữ tự nhiên qua các trò chơi tương tác, bài hát và câu chuyện ngắn vui nhộn.</span>
                  </div>
                </div>
                <div className="lp-check-item">
                  <CheckCircle2 size={16} />
                  <div>
                    <strong className="text-white block text-sm">Kỹ năng sống &amp; Tự lập nhí</strong>
                    <span className="text-[11px] text-[#7b8a9e]">Rèn luyện nề nếp tự phục vụ bản thân: tự cất ba lô, xếp nệm gối, rửa tay và chào hỏi lễ phép.</span>
                  </div>
                </div>
                <div className="lp-check-item">
                  <CheckCircle2 size={16} />
                  <div>
                    <strong className="text-white block text-sm">Phát triển Thể chất &amp; Thẩm mỹ</strong>
                    <span className="text-[11px] text-[#7b8a9e]">Rèn luyện thể lực qua trò chơi vận động liên hoàn và phát triển khiếu thẩm mỹ qua vẽ tranh, nặn đất sét.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <h2 className="lp-sub-title">1. Môi trường giáo dục thân thiện &amp; an toàn</h2>
              <p className="lp-page-text">
                Nhà trường thực hiện chế độ sinh hoạt một ngày của bé khoa học và linh hoạt, đan xen hợp lý giữa học tập, vui chơi, ăn uống và nghỉ ngơi (thể dục sáng, học thông qua chơi, ăn trưa dinh dưỡng, ngủ trưa mát mẻ, ăn xế nhẹ nhàng), giúp bé phát triển thể lực và trí tuệ tốt nhất.
              </p>
              <p className="lp-page-text">
                Với phương châm "Mỗi ngày đến trường là một ngày vui", các bé được nuôi dạy trong môi trường tràn ngập yêu thương, khuyến khích sáng tạo cá nhân, đọc sách tranh sinh động tại thư viện đạt chuẩn và tham gia các trò chơi vận động lý thú.
              </p>
              <p className="lp-page-text">
                Đặc biệt, các bé khối Lá (5 tuổi) được chú trọng rèn luyện kỹ năng làm quen chữ cái, làm quen chữ số, tư thế ngồi học và chuẩn bị tâm thế tự tin vững vàng để sẵn sàng bước vào lớp 1 Tiểu học.
              </p>
            </div>
          </div>

          {/* Câu lạc bộ học sinh */}
          <div style={{ marginBottom: '5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="lp-section-badge">Ngoại khóa</div>
              <h2 className="lp-section-title">Hệ thống Câu lạc bộ Ngoại khóa Nhí</h2>
              <div className="lp-divider" style={{ margin: '0 auto' }} />
              <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
                Phát triển năng khiếu tự nhiên, rèn luyện kỹ năng mềm và bồi đắp đam mê cho học sinh ngoài giờ học.
              </p>
            </div>

            <div className="lp-features-grid">
              {[
                { icon: BookOpen, title: 'CLB Đọc thơ & Kể chuyện nhí', desc: 'Khơi dậy tình yêu sách, rèn kỹ năng phát âm tròn vành rõ chữ và giao tiếp tự tin qua các câu chuyện tranh sinh động.', color: '#f59e0b' },
                { icon: Palette, title: 'CLB Tạo hình & Mỹ thuật nhí', desc: 'Nuôi dưỡng sáng tạo nghệ thuật qua vẽ tranh cát, tạo hình đất nặn và trang trí thủ công từ chất liệu an toàn.', color: '#10b981' },
                { icon: Activity, title: 'CLB Aerobic & Vận động nhí', desc: 'Tăng cường thể chất dẻo dai, sự nhanh nhẹn qua các bài múa hát, Aerobic sôi động và trò chơi liên hoàn.', color: '#f43f5e' },
                { icon: Cpu, title: 'CLB Bé khám phá khoa học vui', desc: 'Trải nghiệm các thí nghiệm khoa học đơn giản, an toàn giúp kích thích trí tò mò về thế giới tự nhiên xung quanh bé.', color: '#2d251e' }
              ].map((club, i) => (
                <div key={club.title} className="lp-feature-card">
                  <div className="lp-feature-icon" style={{ background: club.color }}>
                    <club.icon size={20} className="text-white" />
                  </div>
                  <h3 className="lp-feature-title">{club.title}</h3>
                  <p className="lp-feature-desc">{club.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cơ sở vật chất */}
          <div>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="lp-section-badge">Cơ sở vật chất</div>
              <h2 className="lp-section-title">Tham quan Khuôn viên Học đường</h2>
              <div className="lp-divider" style={{ margin: '0 auto' }} />
            </div>

            <div className="lp-news-grid">
              {[
                { title: 'Dãy phòng học thân thiện', desc: 'Hệ thống các phòng học khang trang được trang bị tivi tương tác hiện đại, thảm trải sạch sẽ, bàn ghế phù hợp lứa tuổi mầm non và góc sáng tạo Montessori sinh động.', icon: School },
                { title: 'Thư viện xanh sắc màu', desc: 'Không gian thư viện ngập tràn tranh vẽ đáng yêu, rải thảm êm ái với hàng ngàn đầu sách truyện thiếu nhi hấp dẫn và các giáo cụ học tập trực quan đa dạng.', icon: BookOpen },
                { title: 'Khu Bán trú tiện nghi', desc: 'Nhà ăn sạch sẽ, bếp ăn một chiều đạt chuẩn vệ sinh an toàn thực phẩm. Phòng nghỉ trưa bán trú trang bị nệm gối riêng biệt và điều hòa mát mẻ, chăm sóc chu đáo.', icon: Heart },
                { title: 'Sân chơi & Sân thể chất nhí', desc: 'Khu vui chơi ngoài trời rợp bóng mát cây xanh với cầu trượt, xích đu và các thiết bị vận động an toàn giúp bé rèn luyện thể chất năng động.', icon: Building2 }
              ].map((svc, idx) => (
                <div key={idx} className="lp-news-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="w-12 h-12 bg-[#f59e0b]/10 flex items-center justify-center mb-4 text-[#d97706]">
                      <svc.icon size={24} />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-[#2d251e] mb-2">{svc.title}</h3>
                    <p className="text-[11px] text-[#4a5568] leading-relaxed">{svc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── 4. RENDER ADMISSIONS PAGE ── */
  const renderAdmissionsPage = () => {
    return (
      <div className="lp-section" style={{ paddingTop: '8rem' }}>
        <div className="lp-section-inner">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="lp-section-badge">Tuyển sinh</div>
            <h1 className="lp-section-title">Thông tin Tuyển sinh Mầm non Năm học 2026 - 2027</h1>
            <div className="lp-divider" style={{ margin: '0 auto' }} />
            <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
              Kế hoạch tuyển sinh các độ tuổi, chỉ tiêu tuyển sinh, hướng dẫn chuẩn bị hồ sơ và các chính sách ưu đãi.
            </p>
          </div>

          {/* Chỉ tiêu & Quy định */}
          <div className="lp-about-grid" style={{ marginBottom: '5rem' }}>
            <div>
              <h2 className="lp-sub-title">1. Chỉ tiêu tuyển sinh &amp; Phương thức xét tuyển</h2>
              <p className="lp-page-text">
                Năm học 2026-2027, trường Mầm non An Hữu thông báo chỉ tiêu tuyển sinh chính thức đối với các khối lớp như sau:
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
                <li className="flex items-center gap-2 text-xs font-bold text-[#4a5568] mb-2">
                  <Check size={14} className="text-[#d97706]" /> Chỉ tiêu: <strong>120 bé (Nhà trẻ: 30, Mầm: 30, Chồi: 30, Lá: 30)</strong>
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-[#4a5568] mb-2">
                  <Check size={14} className="text-[#d97706]" /> Đối tượng: Trẻ em từ 18 tháng đến 72 tháng tuổi (sinh năm 2020 đến 2024), cư trú trên địa bàn xã An Hữu, Cái Bè, Đồng Tháp.
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-[#4a5568] mb-2">
                  <Check size={14} className="text-[#d97706]" /> Phương thức xét tuyển: Tiếp nhận đăng ký theo thứ tự nộp hồ sơ trực tuyến hoặc nộp trực tiếp tại trường cho đến khi đủ chỉ tiêu.
                </li>
              </ul>
              <p className="lp-page-text">
                Phụ huynh có thể nộp đăng ký trực tuyến tại cổng thông tin này hoặc nộp trực tiếp tại văn phòng trường để nhà trường kiểm tra đối chiếu độ tuổi của bé.
              </p>
            </div>
            
            <div className="lp-contact-form" style={{ padding: '2rem', background: '#fcf8f2' }}>
              <div className="flex items-center gap-2 mb-3 text-[#d97706]">
                <ClipboardList size={20} />
                <h4 className="font-serif font-bold text-sm">Hồ sơ tuyển sinh yêu cầu</h4>
              </div>
              <ul className="text-xs text-[#4a5568] space-y-2" style={{ listStyleType: 'decimal', paddingLeft: '1.2rem' }}>
                <li>Bản sao Giấy khai sinh (hợp lệ).</li>
                <li>Đơn xin nhập học mầm non (theo mẫu).</li>
                <li>Giấy xác nhận thông tin cư trú / CCCD của cha hoặc mẹ.</li>
                <li>Bản sao Sổ tiêm chủng của bé (ghi nhận đầy đủ các mũi tiêm).</li>
                <li>2 ảnh thẻ của bé kích thước 3x4 (chụp không quá 6 tháng).</li>
              </ul>
              <div className="mt-4 p-3 bg-white border border-[#c2b5a5] text-[10px] text-[#7b8a9e] leading-relaxed">
                <Info size={12} className="inline mr-1 text-[#d97706]" /> <strong>Lưu ý:</strong> Sổ tiêm chủng của bé là bắt buộc để nhân viên y tế nhà trường theo dõi định kỳ lịch tiêm chủng, đảm bảo an toàn phòng chống dịch bệnh học đường.
              </div>
            </div>
          </div>

          {/* Lịch trình các mốc thời gian */}
          <div style={{ marginBottom: '5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="lp-section-badge">Mốc thời gian</div>
              <h2 className="lp-section-title">Lịch trình tuyển sinh chi tiết</h2>
              <div className="lp-divider" style={{ margin: '0 auto' }} />
            </div>

            <div className="lp-hiw-steps">
              {[
                { n: '01', t: 'Nộp hồ sơ trực tuyến', d: 'Từ 15/05 đến 15/06/2026. Phụ huynh khai thông tin và đính kèm hồ sơ trực tuyến hoặc nộp trực tiếp tại văn phòng trường.' },
                { n: '02', t: 'Xét duyệt hồ sơ', d: 'Từ 16/06 đến 30/06/2026. Hội đồng tuyển sinh đối chiếu thông tin cư trú, độ tuổi và kiểm tra tính hợp lệ của giấy tờ mầm non.' },
                { n: '03', t: 'Công bố danh sách', d: 'Dự kiến 05/07/2026. Trường công bố danh sách học sinh trúng tuyển vào lớp 1 chính thức tại bảng tin và website.' },
                { n: '04', t: 'Làm thủ tục nhập học', d: 'Từ 10/07 đến 25/07/2026. Phụ huynh đến đối chiếu hồ sơ giấy tờ gốc, nhận lớp, nhận giáo viên chủ nhiệm và sách giáo khoa.' }
              ].map(s => (
                <div className="lp-hiw-step" key={s.n}>
                  <div className="lp-hiw-num">{s.n}</div>
                  <h3 className="lp-hiw-title">{s.t}</h3>
                  <p className="lp-hiw-desc">{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chế độ chính sách & Quỹ học bổng */}
          <div className="lp-about-grid" style={{ marginBottom: '5rem', alignItems: 'stretch' }}>
            <div className="lp-problem-item" style={{ flexDirection: 'column', gap: '0.5rem', background: '#f5f8fc' }}>
              <div className="flex items-center gap-2 text-[#2c5ea0]">
                <Award size={18} />
                <h4 className="font-serif font-bold text-sm">Chính sách ưu đãi học đường</h4>
              </div>
              <p className="text-[11px] text-[#4a5568] leading-relaxed">
                Nhà trường thực hiện chế độ khuyến khích học tập, tặng sách giáo khoa và đồ dùng học tập đầu năm học cho các bé có hoàn cảnh khó khăn:
              </p>
              <ul className="text-[11px] text-[#4a5568] list-disc pl-4 space-y-1 mt-1">
                <li>Miễn phí 100% học phí chính khóa cho toàn bộ học sinh mầm non công lập theo chính sách của Nhà nước.</li>
                <li>Hỗ trợ chi phí học tập và tặng đồng phục đầu năm cho các bé thuộc hộ nghèo, cận nghèo.</li>
                <li>Trao tặng các suất học bổng "Khuyến học An Hữu" tại lễ khai giảng cho trẻ em khuyết tật, mồ côi vượt khó.</li>
              </ul>
            </div>

            <div className="lp-problem-item" style={{ flexDirection: 'column', gap: '0.5rem', background: '#f5f8fc' }}>
              <div className="flex items-center gap-2 text-[#2c5ea0]">
                <FileSpreadsheet size={18} />
                <h4 className="font-serif font-bold text-sm">Chương trình bán trú &amp; Ngoại khóa</h4>
              </div>
              <p className="text-[11px] text-[#4a5568] leading-relaxed">
                Hệ thống bán trú chất lượng cao hỗ trợ phụ huynh yên tâm công tác, rèn luyện kỹ năng tự lập cho bé ngay từ lớp 1:
              </p>
              <ul className="text-[11px] text-[#4a5568] list-disc pl-4 space-y-1 mt-1">
                <li>Miễn 100% học phí cho học sinh là con của thương binh, liệt sĩ, người có công với cách mạng.</li>
                <li>Giảm 50% - 70% học phí cho học sinh thuộc hộ nghèo, hộ cận nghèo theo sổ chứng nhận địa phương.</li>
                <li>Cấp phát thẻ BHYT học sinh miễn phí và hỗ trợ sách giáo khoa đầu năm học cho gia đình khó khăn.</li>
              </ul>
            </div>
          </div>

          {/* Form Tuyển Sinh Online */}
          <div style={{ marginBottom: '5rem', background: '#fcf8f2', border: '2px solid #c2b5a5', padding: '3rem 2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div className="lp-section-badge">Nộp hồ sơ trực tuyến</div>
              <h2 className="lp-section-title">Cổng Đăng Ký Tuyển Sinh Mầm Non Online</h2>
              <div className="lp-divider" style={{ margin: '0 auto' }} />
              <p className="text-xs text-[#7b8a9e] max-w-lg mx-auto leading-relaxed mt-2">
                Phụ huynh vui lòng hoàn thành đầy đủ thông tin lý lịch của bé, thông tin liên hệ của gia đình và lựa chọn hồ sơ đã chuẩn bị sẵn dưới đây để đăng ký tuyển sinh chính thức.
              </p>
            </div>

            {formSubmitted ? (
              <div className="bg-[#fdfbf7] border border-[#c2b5a5] p-8 text-center max-w-xl mx-auto rounded-2xl">
                <CheckCircle2 size={48} className="text-[#d97706] mx-auto mb-4" />
                <h3 className="font-serif font-bold text-lg text-[#2d251e] mb-2">Gửi hồ sơ tuyển sinh thành công!</h3>
                <p className="text-xs text-[#4a5568] leading-relaxed mb-6">
                  Cảm ơn phụ huynh đã đăng ký tuyển sinh vào trường Mầm non An Hữu. Hệ thống đã tiếp nhận hồ sơ của bé dưới trạng thái <strong>Chờ Duyệt</strong>. Hội đồng tuyển sinh sẽ thẩm định độ tuổi, hồ sơ và phản hồi sớm nhất qua số điện thoại đăng ký.
                </p>
                <button 
                  onClick={() => setFormSubmitted(false)}
                  className="lp-cta-btn"
                  style={{ padding: '0.6rem 1.5rem', fontSize: '0.7rem' }}
                >
                  Nộp hồ sơ mới
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdmissionSubmit} className="max-w-4xl mx-auto space-y-8">
                
                {/* Section 1: Sơ yếu lý lịch */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#d97706] border-b border-[#c2b5a5] pb-2 mb-4 flex items-center">
                    <ClipboardList size={16} className="mr-2" /> 1. Sơ yếu lý lịch của bé &amp; gia đình
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="lp-form-group col-span-2">
                      <label className="lp-form-label">Họ và tên học sinh *</label>
                      <input 
                        className={`lp-form-input bg-white ${mnSuccess ? 'disabled:bg-neutral-50 disabled:text-neutral-500 font-bold' : ''}`} 
                        type="text" 
                        required 
                        disabled={mnSuccess}
                        placeholder="Họ tên đầy đủ của bé" 
                        value={admForm.fullName}
                        onChange={e => setAdmForm(prev => ({ ...prev, fullName: e.target.value }))}
                      />
                    </div>
                    <div className="lp-form-group">
                      <label className="lp-form-label">Giới tính *</label>
                      <select 
                        className={`lp-form-input bg-white ${mnSuccess ? 'disabled:bg-neutral-50 disabled:text-neutral-500 font-bold' : ''}`}
                        value={admForm.gender}
                        required
                        disabled={mnSuccess}
                        onChange={e => setAdmForm(prev => ({ ...prev, gender: e.target.value }))}
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                    <div className="lp-form-group">
                      <label className="lp-form-label">Ngày sinh *</label>
                      <input 
                        className={`lp-form-input bg-white ${mnSuccess ? 'disabled:bg-neutral-50 disabled:text-neutral-500 font-bold' : ''}`} 
                        type="date" 
                        required 
                        disabled={mnSuccess}
                        value={admForm.dob}
                        onChange={e => setAdmForm(prev => ({ ...prev, dob: e.target.value }))}
                      />
                    </div>
                    <div className="lp-form-group">
                      <label className="lp-form-label">Quê quán (Nơi sinh) *</label>
                      <input 
                        className="lp-form-input bg-white" 
                        type="text" 
                        required 
                        placeholder="Nơi sinh trên giấy khai sinh"
                        value={admForm.hometown}
                        onChange={e => setAdmForm(prev => ({ ...prev, hometown: e.target.value }))}
                      />
                    </div>
                    <div className="lp-form-group">
                      <label className="lp-form-label">Email phụ huynh (nếu có)</label>
                      <input 
                        className="lp-form-input bg-white" 
                        type="email" 
                        placeholder="phuhuynh@example.com"
                        value={admForm.email}
                        onChange={e => setAdmForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="lp-form-group">
                      <label className="lp-form-label">Họ tên cha hoặc mẹ *</label>
                      <input 
                        className="lp-form-input bg-white" 
                        type="text" 
                        required 
                        placeholder="Họ tên người giám hộ"
                        value={admForm.parentName}
                        onChange={e => setAdmForm(prev => ({ ...prev, parentName: e.target.value }))}
                      />
                    </div>
                    <div className="lp-form-group">
                      <label className="lp-form-label">Số điện thoại phụ huynh *</label>
                      <input 
                        className="lp-form-input bg-white" 
                        type="tel" 
                        required 
                        placeholder="Số điện thoại liên hệ chính"
                        value={admForm.parentPhone}
                        onChange={e => setAdmForm(prev => ({ ...prev, parentPhone: e.target.value }))}
                      />
                    </div>
                    <div className="lp-form-group">
                      <label className="lp-form-label">Điện thoại dự phòng (nếu có)</label>
                      <input 
                        className="lp-form-input bg-white" 
                        type="tel" 
                        placeholder="Số điện thoại dự phòng"
                        value={admForm.phone}
                        onChange={e => setAdmForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="lp-form-group col-span-3">
                      <label className="lp-form-label">Địa chỉ thường trú / Nơi ở hiện tại *</label>
                      <input 
                        className="lp-form-input bg-white" 
                        type="text" 
                        required 
                        placeholder="Ấp/Khu phố, Xã An Hữu, Tỉnh Đồng Tháp..."
                        value={admForm.address}
                        onChange={e => setAdmForm(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Hồ sơ đính kèm & thông tin liên kết */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#d97706] border-b border-[#c2b5a5] pb-2 mb-4 flex items-center">
                    <GraduationCap size={16} className="mr-2" /> 2. Hồ sơ đính kèm &amp; thông tin liên kết
                  </h3>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Kết nối hồ sơ Mầm non An Hữu */}
                    <div className="mb-2 bg-[#fdfbf7] p-4 border border-[#c2b5a5] rounded-2xl flex flex-col gap-3">
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-[#d97706] cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          id="isFromAnHuuCheckbox"
                          className="w-4 h-4 text-[#f59e0b] border-[#c2b5a5] rounded focus:ring-[#f59e0b] cursor-pointer"
                          checked={admForm.isFromAnHuu}
                          onChange={e => {
                            const checked = e.target.checked;
                            setAdmForm(prev => ({ 
                              ...prev, 
                              isFromAnHuu: checked,
                              thcsStudentCode: '',
                              secondarySchool: checked ? 'Mầm non An Hữu' : ''
                            }));
                            if (!checked) {
                              handleDisconnectMN();
                            }
                          }}
                        />
                        Bé đã học nhóm trẻ / phân hiệu trước của trường (Liên kết hồ sơ tự động)
                      </label>
                      
                      {admForm.isFromAnHuu && (
                        <div className="mt-2 space-y-3">
                          <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-wider mb-1.5">Mã số học sinh trước đây *</label>
                              <input 
                                className="w-full px-4 py-3 bg-white border border-[#c2b5a5] rounded-xl text-xs font-bold text-[#2d251e] focus:outline-none focus:border-[#f59e0b] disabled:bg-neutral-100 placeholder:text-neutral-400" 
                                type="text" 
                                placeholder="Ví dụ: MN-20001 hoặc MN20001"
                                disabled={mnSuccess || mnLoading}
                                value={admForm.thcsStudentCode}
                                onChange={e => setAdmForm(prev => ({ ...prev, thcsStudentCode: e.target.value }))}
                              />
                            </div>
                            <button
                              type="button"
                              disabled={mnLoading || !admForm.thcsStudentCode}
                              onClick={handleVerifyMNStudent}
                              className="px-6 py-3 bg-[#f59e0b] text-white border border-[#d97706] rounded-xl text-xs uppercase tracking-widest font-bold shadow-[2px_2px_0px_#2d251e] hover:bg-[#d97706] active:translate-y-[1px] disabled:opacity-50 transition-all cursor-pointer h-[42px] shrink-0"
                            >
                              {mnLoading ? 'Đang kiểm tra...' : mnSuccess ? 'Đã kết nối hồ sơ' : 'Kết nối hồ sơ'}
                            </button>
                            {mnSuccess && (
                              <button
                                type="button"
                                onClick={handleDisconnectMN}
                                className="px-4 py-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer h-[42px] shrink-0"
                              >
                                Hủy kết nối
                              </button>
                            )}
                          </div>
                          
                          {mnError && (
                            <p className="text-[10px] text-rose-600 font-bold">{mnError}</p>
                          )}
                          {mnSuccess && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-[11px] text-green-800 font-medium leading-relaxed">
                              ✓ <strong>Đồng bộ thành công!</strong> Thông tin lý lịch của bé <strong>{admForm.fullName}</strong> đã được nạp tự động. Bản sao Giấy khai sinh và Sổ tiêm chủng được xác thực là đã có sẵn trên hệ thống liên kết.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="lp-form-group col-span-1">
                      <label className="lp-form-label">Trường/Nhóm mầm non cũ (nếu có, ghi 'Không' nếu học lần đầu) *</label>
                      <input 
                        className="lp-form-input bg-white disabled:bg-neutral-50 disabled:text-neutral-500" 
                        type="text" 
                        required 
                        disabled={mnSuccess}
                        placeholder="Ví dụ: Trường Mẫu giáo An Hữu hoặc Gửi tại nhà"
                        value={admForm.secondarySchool}
                        onChange={e => setAdmForm(prev => ({ ...prev, secondarySchool: e.target.value }))}
                      />
                    </div>

                    <div className="bg-[#fcf8f2] border border-[#c2b5a5] p-5 rounded-2xl space-y-4">
                      <span className="block text-xs font-bold text-[#d97706] uppercase tracking-wider mb-2">
                        {mnSuccess 
                          ? 'Hồ sơ tuyển sinh đã được đồng bộ trực tuyến tự động:' 
                          : 'Hồ sơ tuyển sinh chuẩn bị kèm theo (Tích chọn nếu đã chuẩn bị sẵn):'
                        }
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className={`flex items-center gap-2.5 text-xs font-bold text-[#4a5568] bg-white p-3 border rounded-xl select-none transition-all ${mnSuccess ? 'border-green-300 bg-green-50/25' : 'border-[#c2b5a5] hover:bg-neutral-50 cursor-pointer'}`}>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-[#f59e0b] border-[#c2b5a5] rounded cursor-pointer disabled:opacity-80"
                            checked={admForm.gpa6 === '1'}
                            disabled={mnSuccess}
                            onChange={e => setAdmForm(prev => ({ ...prev, gpa6: e.target.checked ? '1' : '0' }))}
                          />
                          <span className="flex-1">Bản sao Giấy khai sinh (hợp lệ)</span>
                          {mnSuccess && (
                            <span className="px-1.5 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[9px] font-bold rounded uppercase tracking-wider">Đã đồng bộ</span>
                          )}
                        </label>
                        <label className={`flex items-center gap-2.5 text-xs font-bold text-[#4a5568] bg-white p-3 border rounded-xl select-none transition-all ${mnSuccess ? 'border-green-300 bg-green-50/25' : 'border-[#c2b5a5] hover:bg-neutral-50 cursor-pointer'}`}>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-[#f59e0b] border-[#c2b5a5] rounded cursor-pointer disabled:opacity-80"
                            checked={admForm.gpa7 === '1'}
                            disabled={mnSuccess}
                            onChange={e => setAdmForm(prev => ({ ...prev, gpa7: e.target.checked ? '1' : '0' }))}
                          />
                          <span className="flex-1">Đơn xin nhập học (theo mẫu)</span>
                          {mnSuccess && (
                            <span className="px-1.5 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[9px] font-bold rounded uppercase tracking-wider">Đã đồng bộ</span>
                          )}
                        </label>
                        <label className={`flex items-center gap-2.5 text-xs font-bold text-[#4a5568] bg-white p-3 border rounded-xl select-none transition-all ${mnSuccess ? 'border-green-300 bg-green-50/25' : 'border-[#c2b5a5] hover:bg-neutral-50 cursor-pointer'}`}>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-[#f59e0b] border-[#c2b5a5] rounded cursor-pointer disabled:opacity-80"
                            checked={admForm.gpa8 === '1'}
                            disabled={mnSuccess}
                            onChange={e => setAdmForm(prev => ({ ...prev, gpa8: e.target.checked ? '1' : '0' }))}
                          />
                          <span className="flex-1">CCCD / Xác nhận cư trú phụ huynh</span>
                          {mnSuccess && (
                            <span className="px-1.5 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[9px] font-bold rounded uppercase tracking-wider">Đã đồng bộ</span>
                          )}
                        </label>
                        <label className={`flex items-center gap-2.5 text-xs font-bold text-[#4a5568] bg-white p-3 border rounded-xl select-none transition-all ${mnSuccess ? 'border-green-300 bg-green-50/25' : 'border-[#c2b5a5] hover:bg-neutral-50 cursor-pointer'}`}>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-[#f59e0b] border-[#c2b5a5] rounded cursor-pointer disabled:opacity-80"
                            checked={admForm.gpa9 === '1'}
                            disabled={mnSuccess}
                            onChange={e => setAdmForm(prev => ({ ...prev, gpa9: e.target.checked ? '1' : '0' }))}
                          />
                          <span className="flex-1">Bản sao Sổ tiêm chủng của bé</span>
                          {mnSuccess && (
                            <span className="px-1.5 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[9px] font-bold rounded uppercase tracking-wider">Đã đồng bộ</span>
                          )}
                        </label>
                      </div>
                      
                      {mnSuccess ? (
                        <div className="text-[10px] text-green-800 font-semibold leading-relaxed p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          <span>Bé được <strong>miễn nộp bản giấy</strong> khi làm thủ tục nhập học trực tiếp do hồ sơ đã được đồng bộ trực tuyến.</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#7b8a9e] leading-relaxed mt-2 p-3 bg-white border border-[#c2b5a5] rounded-xl">
                          ℹ️ <strong>Lưu ý về Sổ tiêm chủng:</strong> Sổ tiêm chủng rất quan trọng để bộ phận y tế nhà trường theo dõi lịch tiêm phòng, đảm bảo sức khỏe học đường cho bé. Phụ huynh vui lòng mang theo bản gốc khi hoàn tất thủ tục nhập học trực tiếp.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lp-form-group">
                  <label className="lp-form-label">Ghi chú / Đề xuất nguyện vọng học tập</label>
                  <textarea 
                    className="lp-form-input bg-white" 
                    rows={3} 
                    placeholder="Nguyện vọng đăng ký học bán trú, đưa đón hoặc thông tin đặc biệt về sức khỏe của bé..." 
                    style={{ resize: 'vertical' }}
                    value={admForm.notes}
                    onChange={e => setAdmForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-center">
                  <button 
                    type="submit" 
                    disabled={formLoading}
                    className="lp-cta-btn" 
                    style={{ width: '100%', maxWidth: '300px', padding: '0.9rem', fontSize: '0.8rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {formLoading ? 'Đang gửi hồ sơ...' : 'Nộp Hồ Sơ Đăng Ký'} <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Cảm nhận từ học sinh & phụ huynh */}
          <div style={{ marginBottom: '5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="lp-section-badge">Cảm nhận</div>
              <h2 className="lp-section-title">Chia sẻ từ Thầy cô, Học sinh & Phụ huynh</h2>
              <div className="lp-divider" style={{ margin: '0 auto' }} />
            </div>
            <div className="lp-testimonials-grid">
              {testimonials.map((t, i) => (
                <TestimonialCard key={i} {...t} />
              ))}
            </div>
          </div>

          {/* Câu hỏi tuyển sinh FAQ */}
          <div>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="lp-section-badge">Hỏi đáp</div>
              <h2 className="lp-section-title">Câu hỏi thường gặp về tuyển sinh</h2>
              <div className="lp-divider" style={{ margin: '0 auto' }} />
            </div>
            <div className="lp-faq-list">
              {faqs.map((f, i) => <React.Fragment key={i}><FAQItem q={f.q} a={f.a} /></React.Fragment>)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── 5. RENDER CONTACT PAGE ── */
  const renderContactPage = () => {
    return (
      <div className="lp-section" style={{ paddingTop: '8rem' }}>
        <div className="lp-section-inner">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="lp-section-badge">Liên hệ</div>
            <h1 className="lp-section-title">Kết nối với Trường Mầm non An Hữu</h1>
            <div className="lp-divider" style={{ margin: '0 auto' }} />
            <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
              Mọi ý kiến đóng góp, thắc mắc về tuyển sinh, hoặc yêu cầu hỗ trợ hệ thống quản lý, vui lòng liên hệ với nhà trường.
            </p>
          </div>

          <div className="lp-contact-grid" style={{ marginBottom: '4rem' }}>
            <div className="lp-contact-info">
              <h2 className="lp-sub-title">Thông tin liên lạc chính thức</h2>
              <p className="lp-section-desc" style={{ marginBottom: '2rem' }}>
                Văn phòng Ban Giám hiệu làm việc vào giờ hành chính tất cả các ngày trong tuần (trừ Chủ nhật và ngày lễ).
              </p>
              {[
                { icon: MapPin, t: 'Địa chỉ trường', d: 'Xã An Hữu, Cái Bè, Đồng Tháp, Việt Nam' },
                { icon: Phone, t: 'Văn phòng hành chính', d: '(0273) 3 829 123 · Tiếp nhận hồ sơ & tư vấn tuyển sinh' },
                { icon: Mail, t: 'Hòm thư điện tử', d: 'admin@admin.mnah.edu.vn' },
                { icon: Clock, t: 'Thời gian làm việc', d: 'Sáng: 7:00 – 11:30 · Chiều: 13:00 – 17:00\nTừ Thứ Hai đến Thứ Bảy hàng tuần' },
              ].map(({ icon: Icon, t, d }) => (
                <div className="lp-contact-item" key={t}>
                  <div className="lp-contact-icon"><Icon size={18} /></div>
                  <div className="lp-contact-text">
                    <h4>{t}</h4>
                    <p style={{ whiteSpace: 'pre-line' }}>{d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="lp-contact-form">
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', color: '#1e2a3a', marginBottom: '0.5rem' }}>Gửi tin nhắn liên hệ</h3>
              <p style={{ fontSize: '0.82rem', color: '#7b8a9e', marginBottom: '1.5rem' }}>Nếu có thắc mắc về tuyển sinh hoặc các hoạt động giáo dục, vui lòng gửi phản hồi tại đây.</p>
              <div className="lp-form-group">
                <label className="lp-form-label">Họ và tên</label>
                <input className="lp-form-input" type="text" placeholder="Nguyễn Văn A" />
              </div>
              <div className="lp-form-group">
                <label className="lp-form-label">Địa chỉ Email / Số điện thoại</label>
                <input className="lp-form-input" type="text" placeholder="email@gmail.com hoặc 090xxxxxxx" />
              </div>
              <div className="lp-form-group">
                <label className="lp-form-label">Nội dung câu hỏi</label>
                <textarea className="lp-form-input" rows={4} placeholder="Nhập nội dung cần giải đáp..." style={{ resize: 'vertical' }} />
              </div>
              <button className="lp-cta-btn" style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem', fontSize: '0.78rem', textDecoration: 'none' }}>
                Gửi Thông Tin <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Google Map Mockup */}
          <div>
            <h3 className="font-serif text-lg text-[#1e2a3a] mb-4 text-center">Bản đồ vị trí Trường Mầm non An Hữu</h3>
            <div style={{
              width: '100%',
              height: '350px',
              background: '#e8eef6',
              border: '2px solid #b8c6d9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7b8a9e',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <MapPin size={48} className="text-[#2c5ea0] mb-3 animate-bounce" />
              <h4 className="font-serif font-bold text-sm text-[#1e2a3a] mb-1">Trường Mầm non An Hữu - Cái Bè - Đồng Tháp</h4>
              <p className="text-xs text-[#7b8a9e]">Bản đồ định vị vệ tinh GPS học đường</p>
              <p className="text-[10px] text-[#8e9eb4] mt-2 max-w-md">Khu vực nằm sát Quốc lộ 1A thuận tiện giao thông cho phụ huynh học sinh đưa đón và xe đưa đón nội trú hoạt động an toàn.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── 6. RENDER STAFF PAGE ── */
  const renderStaffPage = () => {
    if (selectedDeptId) {
      return renderDepartmentDetail(selectedDeptId);
    }

    const gradeLevelDepts = departmentsData.filter(
      dept => dept.type === 'Tổ khối lớp' || dept.name.toLowerCase().includes('khối')
    );
    const specializedDepts = departmentsData.filter(
      dept => dept.type === 'Tổ chuyên biệt' || (!dept.type && !dept.name.toLowerCase().includes('khối'))
    );

    const filteredDepts = departmentsData.filter(dept => {
      const isPedagogy = dept.type === 'Tổ khối lớp' || dept.name.toLowerCase().includes('khối');
      if (activeDeptFilter === 'pedagogy') return isPedagogy;
      if (activeDeptFilter === 'operational') return !isPedagogy;
      return true; // 'all'
    });

    const renderDeptCard = (dept: Department) => {
      const LogoIcon = getDepartmentIcon(dept.logo);
      const isPedagogy = dept.type === 'Tổ khối lớp' || dept.name.toLowerCase().includes('khối');
      
      const head = dept.members.find(m => m.role === 'head');
      const deputy = dept.members.find(m => m.role === 'deputy');
      const memberCount = dept.members.filter(m => m.role === 'member').length;
      
      const lowerName = dept.name.toLowerCase();
      
      let themeColor = '#f59e0b'; // Amber
      let themeBg = 'rgba(245, 158, 11, 0.05)';
      let themeBorder = 'rgba(245, 158, 11, 0.15)';
      
      if (dept.id === 'nha-tre' || dept.id === 'T001' || lowerName.includes('nhà trẻ')) {
        themeColor = '#f43f5e'; // Rose
        themeBg = 'rgba(244, 63, 94, 0.05)';
        themeBorder = 'rgba(244, 63, 94, 0.15)';
      } else if (dept.id === 'khoi-mam' || dept.id === 'T002' || lowerName.includes('mầm')) {
        themeColor = '#10b981'; // Emerald
        themeBg = 'rgba(16, 185, 129, 0.05)';
        themeBorder = 'rgba(16, 185, 129, 0.15)';
      } else if (dept.id === 'khoi-choi' || dept.id === 'T003' || lowerName.includes('chồi')) {
        themeColor = '#06b6d4'; // Cyan
        themeBg = 'rgba(6, 182, 212, 0.05)';
        themeBorder = 'rgba(6, 182, 212, 0.15)';
      } else if (dept.id === 'khoi-la' || dept.id === 'T004' || lowerName.includes('lá')) {
        themeColor = '#8b5cf6'; // Purple
        themeBg = 'rgba(139, 92, 246, 0.05)';
        themeBorder = 'rgba(139, 92, 246, 0.15)';
      } else if (dept.id === 'dinh-duong' || dept.id === 'T005' || lowerName.includes('dinh dưỡng') || lowerName.includes('bếp')) {
        themeColor = '#e11d48'; // Red/Rose
        themeBg = 'rgba(225, 29, 72, 0.05)';
        themeBorder = 'rgba(225, 29, 72, 0.15)';
      }

      return (
        <div
          key={dept.id}
          onClick={() => {
            setSelectedDeptId(dept.id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="lp-dept-card group cursor-pointer"
          style={{ 
            '--dept-accent': themeColor,
            '--dept-accent-bg': themeBg,
            '--dept-accent-border': themeBorder 
          } as React.CSSProperties}
        >
          {/* Top colored background header wave */}
          <div className="lp-dept-card-header-bg" />
          
          <div className="lp-dept-card-inner pt-6 relative z-10">
            {/* Logo Badge (Prominent circular shape at the top center) */}
            <div className="lp-dept-card-logo-container">
              {dept.logo && isImageUrl(dept.logo) ? (
                <img src={dept.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--dept-accent)] bg-[var(--dept-accent-bg)]">
                  <LogoIcon size={32} />
                </div>
              )}
            </div>

            {/* Category tag */}
            <span 
              className="lp-dept-card-badge mx-auto"
              style={{ color: themeColor, backgroundColor: themeBg, borderColor: themeBorder }}
            >
              {isPedagogy ? 'Khối Sư Phạm' : 'Nghiệp Vụ & Hỗ Trợ'}
            </span>
            
            {/* Title & ID */}
            <div className="text-center mt-3 mb-2">
              <h3 className="font-serif font-bold text-[#1e2a3a] text-sm sm:text-base leading-tight group-hover:text-[var(--dept-accent)] transition-colors duration-300">
                {dept.name}
              </h3>
              <p className="text-[9px] text-[#7b8a9e] font-bold tracking-wider uppercase mt-1">
                Mã tổ: {dept.id}
              </p>
            </div>
            
            {/* Description */}
            <p className="text-xs text-[#4a5568] leading-relaxed text-center mb-4 line-clamp-3 min-h-[54px] px-2">
              {dept.desc}
            </p>
            
            {/* Separator line */}
            <div className="w-16 h-[2px] bg-[var(--dept-accent)] opacity-30 mx-auto mb-4" />
            
            {/* Personnel Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-5 px-1">
              {head && (
                <div className="lp-dept-card-pill">
                  <User size={11} className="text-[#f59e0b] flex-shrink-0" />
                  <span><strong>Tổ trưởng:</strong> {head.name}</span>
                </div>
              )}
              {deputy && (
                <div className="lp-dept-card-pill">
                  <UserCheck size={11} className="text-[#7b8a9e] flex-shrink-0" />
                  <span><strong>Tổ phó:</strong> {deputy.name}</span>
                </div>
              )}
              <div className="lp-dept-card-pill">
                <Users size={11} className="text-[#2c5ea0] flex-shrink-0" />
                <span>{dept.members.length} nhân sự</span>
              </div>
            </div>
            
            {/* Action link */}
            <div className="lp-dept-card-footer mt-auto flex items-center justify-between text-xs font-bold text-[#2d251e] group-hover:text-[var(--dept-accent)] transition-colors duration-300">
              <span>Xem sơ đồ & chi tiết</span>
              <div className="w-7 h-7 rounded-full bg-[#fcf8f2] border border-[#e7e3d4] flex items-center justify-center text-[#2d251e] group-hover:bg-[var(--dept-accent)] group-hover:text-white group-hover:border-[var(--dept-accent)] transition-all duration-300 shadow-sm transform group-hover:translate-x-1">
                <ArrowRight size={13} />
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="lp-section" style={{ paddingTop: '8rem' }}>
        <div className="lp-section-inner">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="lp-section-badge">Đội ngũ</div>
            <h1 className="lp-section-title">Cán bộ Quản lý & Tổ Chuyên môn</h1>
            <div className="lp-divider" style={{ margin: '0 auto' }} />
            <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
              Đội ngũ nhà giáo tâm huyết, giỏi chuyên môn, giàu kinh nghiệm, đồng hành cùng sự phát triển toàn diện của học sinh Mầm non An Hữu.
            </p>
          </div>

          {/* Ban Giám hiệu */}
          <div style={{ marginBottom: '5rem' }}>
            <h2 className="lp-sub-title text-center">Ban Giám hiệu Nhà trường</h2>
            <div className="lp-divider" style={{ margin: '0.5rem auto 2.5rem' }} />
            
            <div className="lp-news-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', justifyContent: 'center' }}>
              {sortedBghList.map((bgh, idx) => (
                <div className="lp-news-card" key={idx} style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
                  <div className="w-16 h-16 bg-[#2c5ea0]/10 flex items-center justify-center rounded-full mb-4 mx-auto text-[#2c5ea0] border border-[#2c5ea0]/20">
                    <bgh.icon size={28} />
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1e2a3a] mb-1">{bgh.name}</h3>
                  <p className="text-[10px] text-[#2c5ea0] uppercase tracking-widest font-bold mb-3">{bgh.title}</p>
                  <p className="text-xs text-[#4a5568] leading-relaxed">{bgh.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Các Tổ chuyên môn */}
          <div>
            <h2 className="lp-sub-title text-center">Các Tổ Chuyên môn & Nghiệp vụ</h2>
            <div className="lp-divider" style={{ margin: '0.5rem auto 2rem' }} />
            
            {/* Filter Tabs/Chips */}
            <div className="flex justify-center gap-3 mb-10 flex-wrap">
              {[
                { id: 'all', label: 'Tất cả các tổ', count: departmentsData.length },
                { id: 'pedagogy', label: 'Khối Sư Phạm', count: gradeLevelDepts.length },
                { id: 'operational', label: 'Nghiệp Vụ & Hỗ Trợ', count: specializedDepts.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDeptFilter(tab.id as any)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-sm cursor-pointer border ${
                    activeDeptFilter === tab.id
                      ? 'bg-[#2d251e] text-[#f59e0b] border-[#2d251e] shadow-md scale-105'
                      : 'bg-[#fdfbf7] text-[#4a3f35] border-[#e7e3d4] hover:bg-[#fcf8f2] hover:border-[#f59e0b]'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="lp-dept-grid mb-12">
              {filteredDepts.map((dept) => renderDeptCard(dept))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── 7. RENDER DEPARTMENT DETAIL ── */
  const renderDepartmentDetail = (deptId: string) => {
    const dept = departmentsData.find(d => d.id === deptId);
    if (!dept) return null;

    const head = dept.members.find(m => m.role === 'head');
    const deputy = dept.members.find(m => m.role === 'deputy');
    const members = dept.members.filter(m => m.role === 'member');
    const LogoIcon = getDepartmentIcon(dept.logo);

    return (
      <div className="lp-section" style={{ paddingTop: '8rem' }}>
        <div className="lp-section-inner">
          {/* Back button */}
          <div style={{ marginBottom: '2rem' }}>
            <button 
              onClick={() => setSelectedDeptId(null)}
              className="lp-cta-btn"
              style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ArrowRight size={14} className="rotate-180" /> Quay lại danh sách
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="w-36 h-36 bg-[#2c5ea0]/10 border border-[#2c5ea0]/20 text-[#2c5ea0] flex items-center justify-center rounded-full mx-auto mb-4 overflow-hidden shadow-md">
              {dept.logo && isImageUrl(dept.logo) ? (
                <img src={dept.logo} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <LogoIcon size={64} />
              )}
            </div>
            <div className="lp-section-badge">Tổ bộ môn</div>
            <h1 className="lp-section-title">Chi tiết {dept.name}</h1>
            <div className="lp-divider" style={{ margin: '0 auto' }} />
            <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center', maxWidth: '700px' }}>
              {dept.desc}
            </p>
          </div>

          {/* Sơ đồ cơ cấu tổ chuyên môn */}
          <div style={{ marginBottom: '5rem', background: '#e8eef6', padding: '3rem 2rem', border: '1px solid #b8c6d9' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="lp-section-badge" style={{ background: 'rgba(122,62,62,0.1)', borderColor: 'rgba(122,62,62,0.2)' }}>Sơ đồ nhân sự</div>
              <h3 className="font-serif text-lg text-[#1e2a3a] font-bold text-center">Sơ đồ cơ cấu tổ bộ môn</h3>
              <div className="lp-divider" style={{ width: '40px', height: '2px', margin: '0.5rem auto' }} />
            </div>

            <div className="lp-dept-org-chart">
              {/* Cấp 1: Tổ trưởng */}
              {head && (
                <div className="lp-dept-org-level">
                  <div className="lp-dept-org-node head">
                    <div className="badge">Tổ Trưởng</div>
                    <h4>{head.name}</h4>
                    <p>Môn dạy: {head.subject}</p>
                  </div>
                </div>
              )}

              {/* Line connector */}
              <div className="lp-dept-org-line-vertical" />

              {/* Cấp 2: Tổ phó */}
              {deputy && (
                <div className="lp-dept-org-level">
                  <div className="lp-dept-org-node deputy">
                    <div className="badge">Tổ Phó</div>
                    <h4>{deputy.name}</h4>
                    <p>Môn dạy: {deputy.subject}</p>
                  </div>
                </div>
              )}

              {/* Line connector vertical & split horizontal */}
              <div className="lp-dept-org-line-vertical" />
              <div className="lp-dept-org-line-horizontal-container">
                <div 
                  className="lp-dept-org-line-horizontal" 
                  style={{ width: members.length > 1 ? `calc(100% - ${100 / members.length}%)` : '0px' }} 
                />
              </div>

              {/* Cấp 3: Tổ viên */}
              <div className="lp-dept-org-members-row">
                {members.map((m, idx) => (
                  <div className="lp-dept-org-member-container" key={idx} style={{ width: `${100 / members.length}%`, minWidth: '150px' }}>
                    <div className="lp-dept-org-member-connector" />
                    <div className="lp-dept-org-node member">
                      <div className="badge" style={{ background: '#6e6356' }}>Tổ viên</div>
                      <h4>{m.name}</h4>
                      <p>Bộ môn: {m.subject}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bảng danh sách thành viên */}
          <div>
            <h3 className="lp-sub-title">Danh sách chi tiết thành viên tổ</h3>
            <div className="lp-divider" />
            
            <div style={{ overflowX: 'auto', border: '1px solid #c2b5a5', background: 'white' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#fcf8f2', borderBottom: '2px solid #c2b5a5', color: '#d97706' }}>
                    <th style={{ padding: '1rem', fontWeight: 'bold' }}>Họ và tên</th>
                    <th style={{ padding: '1rem', fontWeight: 'bold' }}>Chức vụ tổ bộ môn</th>
                    <th style={{ padding: '1rem', fontWeight: 'bold' }}>Chuyên môn phụ trách</th>
                    <th style={{ padding: '1rem', fontWeight: 'bold' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {dept.members.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e7e3d4', background: idx % 2 === 0 ? '#fdfbf7' : 'white' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: '#2d251e' }}>{m.name}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          padding: '0.2rem 0.5rem',
                          background: m.role === 'head' ? 'rgba(245,158,11,0.1)' : m.role === 'deputy' ? 'rgba(16,185,129,0.1)' : 'rgba(110,99,86,0.1)',
                          color: m.role === 'head' ? '#d97706' : m.role === 'deputy' ? '#10b981' : '#6e6356',
                          border: '1px solid currentColor'
                        }}>
                          {m.roleLabel}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#4a5568' }}>{m.subject}</td>
                      <td style={{ padding: '1rem', color: '#10b981', fontWeight: '600' }}>✓ Đang công tác</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
        return renderHomePage();
      case 'about':
        return renderAboutPage();
      case 'staff':
        return renderStaffPage();
      case 'activities':
        return renderActivitiesPage();
      case 'admissions':
        return renderAdmissionsPage();
      case 'contact':
        return renderContactPage();
      default:
        return renderHomePage();
    }
  };

  return (
    <>
      {/* ── STYLES ────────────────────────────────────────── */}
      <style>{`
        /* Base */
        .lp-page { font-family: 'Lora', serif; color: #2d251e; background: #fdfbf7; overflow-x: hidden; min-height: 100vh; display: flex; flex-direction: column; }
        .lp-main-content { flex: 1; }

        /* ── HEADER ── */
        .lp-header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          transition: all 0.3s ease;
          padding: 1rem 0;
          background: #fdfbf7;
          border-bottom: 1px solid #e7e3d4;
        }
        .lp-header.scrolled {
          background: rgba(253,251,247,0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e7e3d4;
          box-shadow: 0 2px 20px rgba(44,40,37,0.08);
          padding: 0.65rem 0;
        }
        .lp-header-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; }
        .lp-logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
        .lp-logo-icon { width: 40px; height: 40px; background: #f59e0b; display: flex; align-items: center; justify-content: center; border: 2px solid #2d251e; }
        .lp-logo-text { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.1rem; color: #d97706; letter-spacing: 0.05em; }
        .lp-logo-sub { font-size: 0.6rem; color: #c2b5a5; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; }
        .lp-nav { display: flex; align-items: center; gap: 2rem; }
        .lp-nav-link { font-size: 0.8rem; font-weight: 700; color: #4a3f35; text-decoration: none; letter-spacing: 0.05em; transition: color 0.2s; cursor: pointer; position: relative; padding: 0.25rem 0; }
        .lp-nav-link:hover, .lp-nav-link.active { color: #f59e0b; }
        .lp-nav-link.active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #f59e0b; }
        
        .lp-cta-btn { padding: 0.6rem 1.4rem; background: #f59e0b; color: #fdfbf7; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border: 2px solid #2d251e; box-shadow: 2px 2px 0 #2d251e; transition: all 0.2s; cursor: pointer; text-decoration: none; }
        .lp-cta-btn:hover { background: #d97706; transform: translateY(-1px); box-shadow: 3px 3px 0 #2d251e; }
        .lp-cta-btn:active { transform: translateY(0); box-shadow: 1px 1px 0 #2d251e; }
        .lp-menu-btn { display: none; background: none; border: none; cursor: pointer; color: #2d251e; padding: 0.4rem; }
        @media (max-width: 768px) {
          .lp-nav { display: none; }
          .lp-menu-btn { display: flex; }
        }
        
        /* ── MOBILE MENU ── */
        .lp-mobile-menu { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(253,251,247,0.98); z-index: 999; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2rem; }
        .lp-mobile-link { font-size: 1.5rem; font-weight: 700; color: #2d251e; cursor: pointer; font-family: 'Playfair Display', serif; }
        .lp-mobile-close { position: absolute; top: 1.5rem; right: 1.5rem; background: none; border: none; cursor: pointer; color: #2d251e; }

        /* ── HERO ── */
        .lp-hero {
          min-height: 100vh;
          background: linear-gradient(135deg, #2d251e 0%, #4a3f35 60%, #1a1511 100%);
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
        }
        .lp-hero-bg-1 { position: absolute; top: -20%; right: -10%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%); }
        .lp-hero-bg-2 { position: absolute; bottom: -10%; left: -10%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%); }
        .lp-hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 60px 60px; }
        .lp-hero-inner { flex: 1; display: flex; align-items: center; max-width: 1200px; margin: 0 auto; padding: 8rem 2rem 4rem; width: 100%; }
        .lp-hero-content { max-width: 720px; }
        .lp-hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 1rem; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); color: #f59e0b; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 1.5rem; }
        .lp-hero-title { font-family: 'Playfair Display', serif; font-size: clamp(2.5rem, 5vw, 4.2rem); font-weight: 800; color: #fdfbf7; line-height: 1.1; margin-bottom: 0.5rem; }
        .lp-hero-title-highlight { color: #f59e0b; }
        .lp-hero-subtitle { font-family: 'Playfair Display', serif; font-size: clamp(1.2rem, 2.5vw, 1.8rem); color: #c2b5a5; font-weight: 400; font-style: italic; margin-bottom: 1.5rem; }
        .lp-hero-desc { font-size: 1rem; color: #e7e3d4; line-height: 1.8; margin-bottom: 2.5rem; max-width: 580px; }
        .lp-hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 3rem; }
        .lp-btn-primary { padding: 0.9rem 2rem; background: #f59e0b; color: #fdfbf7; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border: 2px solid #2d251e; box-shadow: 3px 3px 0 #2d251e; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; }
        .lp-btn-primary:hover { background: #d97706; transform: translateY(-2px); box-shadow: 4px 4px 0 #2d251e; }
        .lp-btn-secondary { padding: 0.9rem 2rem; background: transparent; color: #c2b5a5; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border: 2px solid rgba(194,181,165,0.3); cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; }
        .lp-btn-secondary:hover { border-color: #f59e0b; color: #f59e0b; transform: translateY(-1px); }
        .lp-hero-trust { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
        .lp-hero-trust-item { display: flex; align-items: center; gap: 0.5rem; color: #c2b5a5; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; }
        .lp-hero-trust-item svg { color: #f59e0b; }
        .lp-hero-scroll { display: flex; align-items: center; justify-content: center; padding: 2rem 0; animation: bounce 2s infinite; cursor: pointer; }
        .lp-hero-scroll svg { color: #c2b5a5; }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        
        /* ── SECTION BASE ── */
        .lp-section { padding: 5rem 0; }
        .lp-section-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        .lp-section-badge { display: inline-block; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #d97706; background: rgba(245,158,11,0.08); padding: 0.3rem 0.8rem; margin-bottom: 1rem; border: 1px solid rgba(245,158,11,0.15); }
        .lp-section-title { font-family: 'Playfair Display', serif; font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 700; color: #2d251e; margin-bottom: 1rem; line-height: 1.2; }
        .lp-section-desc { font-size: 1rem; color: #4a3f35; line-height: 1.8; max-width: 600px; margin-bottom: 3rem; }
        .lp-sub-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: #2d251e; margin-bottom: 1.25rem; }
        .lp-divider { width: 60px; height: 3px; background: #f59e0b; margin-bottom: 1.5rem; }
        .lp-page-text { font-size: 0.92rem; color: #4a3f35; line-height: 1.8; margin-bottom: 1.25rem; }

        /* ── STATS ── */
        .lp-stats-section { background: #2d251e; padding: 4rem 0; }
        .lp-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0; }
        .lp-stat-card { padding: 2rem 1.5rem; text-align: center; border-right: 1px solid rgba(255,255,255,0.06); transition: background 0.2s; }
        .lp-stat-card:last-child { border-right: none; }
        .lp-stat-card:hover { background: rgba(245,158,11,0.08); }
        .lp-stat-icon { color: #f59e0b; display: flex; justify-content: center; margin-bottom: 0.75rem; }
        .lp-stat-number { font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 800; color: #f59e0b; line-height: 1; margin-bottom: 0.5rem; }
        .lp-stat-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #c2b5a5; }
        
        /* ── CORE VALUES ── */
        .lp-problem-section { background: #fcf8f2; }
        .lp-problem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
        .lp-problem-list { display: flex; flex-direction: column; gap: 1rem; }
        .lp-problem-item { display: flex; gap: 1rem; padding: 1.25rem; background: white; border: 1px solid #e7e3d4; transition: all 0.2s; }
        .lp-problem-item:hover { border-color: #f59e0b; transform: translateX(4px); }
        .lp-problem-icon { width: 36px; height: 36px; background: rgba(245,158,11,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #d97706; }
        .lp-problem-text h4 { font-size: 0.85rem; font-weight: 700; color: #2d251e; margin-bottom: 0.25rem; }
        .lp-problem-text p { font-size: 0.8rem; color: #4a3f35; line-height: 1.5; }
        .lp-solution-box { background: #2d251e; padding: 2.5rem; position: relative; overflow: hidden; }
        .lp-solution-box::before { content: ''; position: absolute; top: -50%; right: -30%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%); }
        .lp-solution-box h3 { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #f59e0b; margin-bottom: 1rem; }
        .lp-solution-box p { color: #c2b5a5; font-size: 0.9rem; line-height: 1.8; margin-bottom: 1.5rem; }
        .lp-solution-check { display: flex; flex-direction: column; gap: 0.75rem; }
        .lp-check-item { display: flex; align-items: center; gap: 0.75rem; color: #e7e3d4; font-size: 0.82rem; font-weight: 600; }
        .lp-check-item svg { color: #10b981; flex-shrink: 0; }
        @media (max-width: 768px) { .lp-problem-grid { grid-template-columns: 1fr; } }
        
        /* ── BẢNG TIN TRƯỜNG ── */
        .lp-news-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .lp-news-card { padding: 2rem; border: 1px solid #e7e3d4; background: #fdfbf7; transition: all 0.25s; }
        .lp-news-card:hover { border-color: #f59e0b; transform: translateY(-4px); box-shadow: 0 10px 30px rgba(44,40,37,0.04); }
        .lp-news-badge { display: inline-flex; align-items: center; font-size: 0.65rem; font-weight: 700; color: #d97706; background: rgba(245,158,11,0.06); padding: 0.25rem 0.65rem; margin-bottom: 1rem; border: 1px solid rgba(245,158,11,0.1); text-transform: uppercase; letter-spacing: 0.05em; }
        .lp-news-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: #2d251e; margin-bottom: 0.5rem; line-height: 1.4; }
        .lp-news-date { font-size: 0.75rem; color: #4a3f35; margin-bottom: 1rem; }
        .lp-news-desc { font-size: 0.82rem; color: #4a3f35; line-height: 1.6; margin-bottom: 1.25rem; }
        .lp-news-more { background: none; border: none; font-size: 0.8rem; font-weight: 700; color: #f59e0b; cursor: pointer; padding: 0; display: inline-flex; align-items: center; gap: 0.25rem; }
        .lp-news-more:hover { color: #d97706; }

        /* ── ORGANIZATIONAL CHART ── */
        .lp-org-chart { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; }
        .lp-org-level { display: flex; justify-content: center; width: 100%; }
        .lp-org-node { padding: 1.25rem 2rem; border: 2px solid #c2b5a5; background: #fdfbf7; text-align: center; min-width: 200px; transition: all 0.2s; }
        .lp-org-node:hover { border-color: #f59e0b; box-shadow: 0 4px 20px rgba(44,40,37,0.04); }
        .lp-org-node.primary { border-color: #d97706; background: #2d251e; color: #fdfbf7; }
        .lp-org-node.primary h4 { font-family: 'Quicksand', sans-serif; font-size: 1.1rem; font-weight: 700; color: #f59e0b; }
        .lp-org-node.primary p { font-size: 0.75rem; color: #c2b5a5; margin-top: 0.25rem; }
        .lp-org-node.secondary { border-color: #c2b5a5; background: #fcf8f2; }
        .lp-org-node.secondary h5 { font-family: 'Quicksand', sans-serif; font-size: 0.95rem; font-weight: 700; color: #2d251e; }
        .lp-org-connector-vertical { width: 2px; height: 30px; background: #c2b5a5; }
        .lp-org-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; width: 100%; position: relative; margin-top: 1rem; }
        .lp-org-grid::before { content: ''; position: absolute; top: -15px; left: 10%; right: 10%; height: 2px; background: #c2b5a5; }

        /* ── FEATURES ── */
        .lp-features-section { background: white; }
        .lp-features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .lp-feature-card { padding: 1.75rem; border: 1px solid #e7e3d4; background: #fdfbf7; transition: all 0.25s; position: relative; cursor: default; }
        .lp-feature-card:hover { border-color: #f59e0b; transform: translateY(-4px); box-shadow: 0 12px 40px rgba(44,40,37,0.06); }
        .lp-feature-icon { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
        .lp-feature-title { font-size: 0.95rem; font-weight: 700; color: #2d251e; margin-bottom: 0.5rem; }
        .lp-feature-desc { font-size: 0.82rem; color: #4a3f35; line-height: 1.6; }
        .lp-feature-arrow { position: absolute; bottom: 1.5rem; right: 1.5rem; color: #c2b5a5; transition: all 0.2s; }
        .lp-feature-card:hover .lp-feature-arrow { color: #f59e0b; transform: translateX(3px); }
        
        /* ── HOW IT WORKS / ADMISSIONS ── */
        .lp-hiw-section { background: #fcf8f2; }
        .lp-hiw-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0; position: relative; }
        .lp-hiw-step { padding: 2.5rem 2rem; text-align: center; position: relative; }
        .lp-hiw-step:not(:last-child)::after { content: ''; position: absolute; top: 3rem; right: -1px; width: 2px; height: 50px; background: linear-gradient(to bottom, #c2b5a5, transparent); }
        .lp-hiw-num { width: 56px; height: 56px; background: #f59e0b; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 800; color: #fdfbf7; margin: 0 auto 1.25rem; border: 3px solid #2d251e; }
        .lp-hiw-title { font-size: 0.9rem; font-weight: 700; color: #2d251e; margin-bottom: 0.5rem; }
        .lp-hiw-desc { font-size: 0.8rem; color: #4a3f35; line-height: 1.6; }
        @media (max-width: 768px) { .lp-hiw-step:not(:last-child)::after { display: none; } }
        
        /* ── TESTIMONIALS ── */
        .lp-testimonials-section { background: #2d251e; }
        .lp-testimonials-section .lp-section-title { color: #f59e0b; }
        .lp-testimonials-section .lp-section-desc { color: #c2b5a5; }
        .lp-testimonials-section .lp-section-badge { color: #f59e0b; background: rgba(245,158,11,0.04); border-color: rgba(245,158,11,0.08); }
        .lp-testimonials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .lp-testimonial-card { padding: 2rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); transition: all 0.25s; }
        .lp-testimonial-card:hover { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.2); transform: translateY(-3px); }
        .lp-testimonial-stars { display: flex; gap: 0.2rem; color: #f59e0b; margin-bottom: 1rem; }
        .lp-testimonial-content { font-size: 0.88rem; color: #e7e3d4; line-height: 1.8; margin-bottom: 1.25rem; font-style: italic; }
        .lp-testimonial-author { display: flex; align-items: center; gap: 0.75rem; }
        .lp-testimonial-avatar { width: 40px; height: 40px; background: #f59e0b; border: 2px solid #2d251e; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1rem; color: #fdfbf7; flex-shrink: 0; }
        .lp-testimonial-name { font-size: 0.82rem; font-weight: 700; color: #f59e0b; }
        .lp-testimonial-role { font-size: 0.72rem; color: #c2b5a5; font-weight: 600; }
        
        /* ── ABOUT ── */
        .lp-about-section { background: white; }
        .lp-about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
        .lp-about-image { position: relative; }
        .lp-about-img-main { width: 100%; aspect-ratio: 4/3; background: linear-gradient(135deg, #2d251e, #4a3f35); display: flex; align-items: center; justify-content: center; border: 3px solid #4a3f35; overflow: hidden; }
        .lp-about-img-badge { position: absolute; bottom: -1.5rem; right: -1.5rem; background: #f59e0b; padding: 1.5rem; border: 3px solid #2d251e; text-align: center; }
        .lp-about-img-badge .num { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 800; color: #fdfbf7; line-height: 1; display: block; }
        .lp-about-img-badge .label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #2d251e; }
        .lp-about-values { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem; }
        .lp-about-value { padding: 1.25rem; border: 1px solid #e7e3d4; }
        .lp-about-value svg { color: #f59e0b; margin-bottom: 0.5rem; }
        .lp-about-value h4 { font-size: 0.82rem; font-weight: 700; color: #2d251e; margin-bottom: 0.25rem; }
        .lp-about-value p { font-size: 0.75rem; color: #4a3f35; line-height: 1.5; }
        @media (max-width: 900px) { .lp-about-grid { grid-template-columns: 1fr; } .lp-about-image { display: none; } }
        
        /* ── PERSONNEL / TECH ── */
        .lp-tech-section { background: #fcf8f2; }
        .lp-tech-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
        .lp-tech-card { padding: 2rem; text-align: center; background: white; border: 1px solid #e7e3d4; transition: all 0.2s; }
        .lp-tech-card:hover { border-color: #f59e0b; box-shadow: 0 8px 24px rgba(44,40,37,0.04); }
        .lp-tech-card svg { color: #f59e0b; margin-bottom: 0.75rem; }
        .lp-tech-card h4 { font-size: 0.85rem; font-weight: 700; color: #2d251e; margin-bottom: 0.4rem; }
        .lp-tech-card p { font-size: 0.75rem; color: #4a3f35; line-height: 1.5; }
        
        /* ── FAQ ── */
        .lp-faq-section { background: white; }
        .lp-faq-list { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 0; }
        .lp-faq-item { border-bottom: 1px solid #e7e3d4; }
        .lp-faq-item.open { border-color: #f59e0b; }
        .lp-faq-q { width: 100%; padding: 1.25rem 0; display: flex; justify-content: space-between; align-items: center; background: none; border: none; cursor: pointer; text-align: left; font-size: 0.9rem; font-weight: 700; color: #2d251e; gap: 1rem; font-family: 'Lora', serif; }
        .lp-faq-q:hover { color: #f59e0b; }
        .lp-faq-chevron { transition: transform 0.3s; flex-shrink: 0; color: #4a3f35; }
        .lp-faq-chevron.rotated { transform: rotate(180deg); color: #f59e0b; }
        .lp-faq-a { padding: 0 0 1.25rem; font-size: 0.85rem; color: #4a3f35; line-height: 1.8; }
        
        /* ── CTA ── */
        .lp-cta-section { background: #f59e0b; padding: 5rem 0; position: relative; overflow: hidden; }
        .lp-cta-section::before { content: ''; position: absolute; top: -50%; left: -20%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(253,251,247,0.15) 0%, transparent 70%); }
        .lp-cta-section::after { content: ''; position: absolute; bottom: -50%; right: -10%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%); }
        .lp-cta-inner { text-align: center; position: relative; z-index: 1; }
        .lp-cta-inner h2 { font-family: 'Playfair Display', serif; font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 800; color: #fdfbf7; margin-bottom: 1rem; }
        .lp-cta-inner p { font-size: 1rem; color: #2d251e; max-width: 500px; margin: 0 auto 2.5rem; line-height: 1.7; }
        .lp-cta-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .lp-btn-white { padding: 1rem 2.5rem; background: #fdfbf7; color: #2d251e; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border: 2px solid #2d251e; box-shadow: 3px 3px 0 rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; }
        .lp-btn-white:hover { transform: translateY(-2px); box-shadow: 4px 4px 0 rgba(0,0,0,0.2); }
        .lp-btn-outline-white { padding: 1rem 2.5rem; background: transparent; color: #2d251e; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border: 2px solid rgba(45,37,30,0.4); cursor: pointer; transition: all 0.2s; }
        .lp-btn-outline-white:hover { border-color: #2d251e; transform: translateY(-1px); }
        
        /* ── CONTACT ── */
        .lp-contact-section { background: #fcf8f2; }
        .lp-contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; }
        .lp-contact-info { display: flex; flex-direction: column; gap: 1.5rem; }
        .lp-contact-item { display: flex; gap: 1rem; }
        .lp-contact-icon { width: 44px; height: 44px; background: #f59e0b; display: flex; align-items: center; justify-content: center; color: #fdfbf7; flex-shrink: 0; }
        .lp-contact-text h4 { font-size: 0.8rem; font-weight: 700; color: #2d251e; margin-bottom: 0.3rem; text-transform: uppercase; letter-spacing: 0.08em; }
        .lp-contact-text p { font-size: 0.85rem; color: #4a3f35; line-height: 1.6; }
        .lp-contact-form { background: white; padding: 2.5rem; border: 1px solid #e7e3d4; }
        .lp-form-group { margin-bottom: 1.25rem; }
        .lp-form-label { display: block; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #4a3f35; margin-bottom: 0.5rem; }
        .lp-form-input { width: 100%; padding: 0.85rem 1rem; border: 1px solid #c2b5a5; background: #fdfbf7; font-size: 0.85rem; font-weight: 600; color: #2d251e; font-family: 'Lora', serif; transition: all 0.2s; box-sizing: border-box; border-radius: 0; }
        .lp-form-input:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.08); }
        .lp-form-input::placeholder { color: #8e9eb4; font-weight: 400; }
        @media (max-width: 768px) { .lp-contact-grid { grid-template-columns: 1fr; } }
        
        /* ── FOOTER ── */
        .lp-footer { background: #1a1511; padding: 4rem 0 2rem; }
        .lp-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem; margin-bottom: 3rem; }
        .lp-footer-brand p { font-size: 0.82rem; color: #c2b5a5; line-height: 1.8; margin-top: 1rem; max-width: 280px; }
        .lp-footer-col h5 { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #f59e0b; margin-bottom: 1rem; }
        .lp-footer-col a, .lp-footer-col span { display: block; font-size: 0.82rem; color: #c2b5a5; text-decoration: none; margin-bottom: 0.6rem; cursor: pointer; transition: color 0.2s; }
        .lp-footer-col a:hover, .lp-footer-col span:hover { color: #fdfbf7; }
        .lp-footer-bottom { border-top: 1px solid rgba(255,255,255,0.03); padding-top: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .lp-footer-copy { font-size: 0.72rem; color: #4a3f35; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
        .lp-footer-powered { font-size: 0.7rem; color: #4a3f35; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; }
        .lp-footer-powered span { color: #f59e0b; }
        @media (max-width: 900px) { .lp-footer-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .lp-footer-grid { grid-template-columns: 1fr; } }
        
        /* ── FADE IN ANIMATION ── */
        .lp-fade-up { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .lp-fade-up.visible { opacity: 1; transform: translateY(0); }
        .lp-fade-up.delay-1 { transition-delay: 0.1s; }
        .lp-fade-up.delay-2 { transition-delay: 0.2s; }
        .lp-fade-up.delay-3 { transition-delay: 0.3s; }
        .lp-fade-up.delay-4 { transition-delay: 0.4s; }
        
        /* ── VIDEO MODAL ── */
        .lp-video-overlay { position: fixed; inset: 0; background: rgba(12,10,8,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 2rem; backdrop-filter: blur(8px); }
        .lp-video-box { width: 100%; max-width: 800px; background: #2d251e; padding: 2rem; position: relative; border: 2px solid #4a3f35; }
        .lp-video-close { position: absolute; top: -1rem; right: -1rem; width: 36px; height: 36px; background: #f59e0b; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; z-index: 1; }
        .lp-video-placeholder { aspect-ratio: 16/9; background: #1a1511; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; }
        .lp-video-placeholder p { color: #c2b5a5; font-size: 0.85rem; }

        /* ── DEPARTMENT ORG CHART & DEPT CARDS REDESIGN ── */
        .lp-dept-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2.5rem;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 1.5rem 1rem;
        }
        .lp-dept-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #e7e3d4;
          border-radius: 24px 60px 24px 60px;
          padding: 2rem 1.75rem 1.75rem;
          transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(44, 40, 37, 0.02);
          display: flex;
          flex-direction: column;
          min-height: 380px;
        }
        .lp-dept-card-header-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(to bottom, var(--dept-accent-bg), transparent);
          z-index: 1;
          transition: all 0.3s ease;
        }
        .lp-dept-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: var(--dept-accent, #f59e0b);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s ease;
          z-index: 12;
        }
        .lp-dept-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 25px 45px rgba(44, 40, 37, 0.08), 0 5px 15px rgba(0, 0, 0, 0.02);
          border-color: var(--dept-accent, #f59e0b);
          border-radius: 60px 24px 60px 24px;
        }
        .lp-dept-card:hover::before {
          transform: scaleX(1);
        }
        .lp-dept-card-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
          flex: 1;
        }
        .lp-dept-card-logo-container {
          width: 88px;
          height: 88px;
          border-radius: 9999px;
          border: 4px solid #ffffff;
          box-shadow: 0 4px 15px rgba(44, 40, 37, 0.06);
          margin: 0 auto 1rem;
          overflow: hidden;
          background: #ffffff;
          position: relative;
          z-index: 10;
          transition: all 0.35s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-dept-card-logo-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .lp-dept-card:hover .lp-dept-card-logo-container {
          transform: scale(1.08) rotate(3deg);
          box-shadow: 0 10px 25px rgba(44, 40, 37, 0.12);
          border-color: var(--dept-accent-bg);
        }
        .lp-dept-card-badge {
          align-self: center;
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          border: 1px solid transparent;
          margin-bottom: 0.5rem;
          z-index: 10;
        }
        .lp-dept-card-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.75rem;
          background: #fdfbf7;
          border: 1px solid #e7e3d4;
          border-radius: 9999px;
          font-size: 10px;
          color: #4a3f35;
          transition: all 0.3s ease;
        }
        .lp-dept-card:hover .lp-dept-card-pill {
          background: #ffffff;
          border-color: var(--dept-accent-border);
        }
        .lp-dept-card-footer {
          border-top: 1px dashed #e7e3d4;
          padding-top: 1rem;
        }
        
        /* Detail View & Org Container */
        .lp-dept-org-container {
          background: #ffffff; 
          border: 1px solid #e7e3d4;
          border-radius: 24px;
          padding: 3rem 2rem;
          box-shadow: 0 4px 20px rgba(44, 40, 37, 0.02);
        }
        .lp-table-wrapper {
          border: 1px solid #e7e3d4;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(44, 40, 37, 0.02);
        }

        .lp-dept-org-chart { display: flex; flex-direction: column; align-items: center; width: 100%; margin-top: 2rem; }
        .lp-dept-org-level { display: flex; justify-content: center; width: 100%; }
        .lp-dept-org-node { 
          padding: 1.2rem 1.8rem; 
          border: 1.5px solid #e7e3d4; 
          border-radius: 16px;
          text-align: center; 
          min-width: 200px; 
          box-shadow: 0 4px 12px rgba(44,40,37,0.03); 
          position: relative; 
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .lp-dept-org-node:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(44,40,37,0.08);
        }
        .lp-dept-org-node h4 { 
          font-family: 'Playfair Display', serif; 
          font-size: 1rem; 
          font-weight: 700; 
          margin-bottom: 0.25rem; 
        }
        .lp-dept-org-node p { 
          font-size: 0.75rem; 
          color: #7b8a9e; 
          margin: 0; 
        }
        .lp-dept-org-node .badge { 
          font-size: 7px; 
          font-weight: 700; 
          text-transform: uppercase; 
          color: #2d251e; 
          background: #f59e0b; 
          padding: 0.25rem 0.75rem; 
          border-radius: 9999px; 
          margin-bottom: 0.5rem; 
          display: inline-block; 
          letter-spacing: 0.1em; 
        }
        .lp-dept-org-node.head { 
          border-color: #f59e0b; 
          background: #2d251e; 
        }
        .lp-dept-org-node.head h4 { 
          color: #f59e0b; 
        }
        .lp-dept-org-node.head p { 
          color: #c2b5a5; 
        }
        .lp-dept-org-node.deputy { 
          border-color: #f59e0b; 
          background: #fdfbf7; 
        }
        .lp-dept-org-node.deputy h4 { 
          color: #d97706; 
        }
        .lp-dept-org-node.member { 
          border-color: #e7e3d4; 
          background: #ffffff; 
        }
        .lp-dept-org-node.member h4 { 
          color: #2d251e; 
        }
        .lp-dept-org-line-vertical { width: 2px; height: 32px; background: #c2b5a5; }
        .lp-dept-org-line-horizontal-container { width: 100%; flex: 1; display: flex; justify-content: center; position: relative; height: 32px; }
        .lp-dept-org-line-horizontal { height: 2px; background: #c2b5a5; position: absolute; top: 0; }
        .lp-dept-org-members-row { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; width: 100%; }
        .lp-dept-org-member-container { display: flex; flex-direction: column; align-items: center; }
        .lp-dept-org-member-connector { width: 2px; height: 32px; background: #c2b5a5; }
        
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .85; }
        }
      `}</style>

      <div className="lp-page">
        {/* ── SECTION 1: HEADER ─────────────────────────────── */}
        <header className={`lp-header ${scrollY > 60 ? 'scrolled' : ''}`}>
          <div className="lp-header-inner">
            <div className="lp-logo cursor-pointer" onClick={() => navigateToPage('home')}>
              <SystemLogo size={40} color="#f5f8fc" />
              <div>
                <div className="lp-logo-text">Mầm non An Hữu</div>
                <div className="lp-logo-sub">Đồng Tháp</div>
              </div>
            </div>

            <nav className="lp-nav">
              {navLinks.map(l => (
                <span 
                  key={l.id} 
                  className={`lp-nav-link ${activePage === l.id ? 'active' : ''}`} 
                  onClick={() => navigateToPage(l.id)}
                >
                  {l.label}
                </span>
              ))}
              <button className="lp-cta-btn" onClick={onEnterSystem}>
                Cổng EduCore
              </button>
            </nav>

            <button className="lp-menu-btn" onClick={() => setMobileMenu(true)}>
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* ── MOBILE MENU ── */}
        {mobileMenu && (
          <div className="lp-mobile-menu">
            <button className="lp-mobile-close" onClick={() => setMobileMenu(false)}>
              <X size={28} />
            </button>
            {navLinks.map(l => (
              <span 
                key={l.id} 
                className="lp-mobile-link" 
                onClick={() => navigateToPage(l.id)}
              >
                {l.label}
              </span>
            ))}
            <button className="lp-cta-btn" style={{ fontSize: '1rem', padding: '0.8rem 2rem' }} onClick={() => { setMobileMenu(false); onEnterSystem(); }}>
              Cổng quản lý EduCore
            </button>
          </div>
        )}

        {/* ── SUB-PAGE DYNAMIC CONTAINER ────────────────────── */}
        <main className="lp-main-content">
          {renderActivePage()}
        </main>

        {/* ── SECTION 13: FOOTER ────────────────────────────── */}
        <footer className="lp-footer">
          <div className="lp-section-inner">
            <div className="lp-footer-grid">
              <div className="lp-footer-brand">
                <div className="lp-logo cursor-pointer" onClick={() => navigateToPage('home')}>
                  <SystemLogo size={40} color="#f5f8fc" />
                  <div>
                    <div className="lp-logo-text" style={{ color: '#f59e0b' }}>Mầm non An Hữu</div>
                    <div className="lp-logo-sub">Nâng Bước Tương Lai</div>
                  </div>
                </div>
                <p>Nơi ươm mầm yêu thương, rèn luyện thói quen tự lập và nâng bước tương lai cho các bé tại An Hữu, Cái Bè, Đồng Tháp.</p>
              </div>
              <div className="lp-footer-col">
                <h5>Học vụ</h5>
                <span onClick={() => navigateToPage('activities')}>Chương trình nuôi dạy</span>
                <span onClick={() => navigateToPage('activities')}>Cơ sở vật chất</span>
                <span onClick={() => navigateToPage('admissions')}>Lịch tuyển sinh</span>
                <span onClick={onEnterSystem}>Thời khóa biểu</span>
              </div>
              <div className="lp-footer-col">
                <h5>Điều hướng</h5>
                {navLinks.map(l => (
                  <span key={l.id} onClick={() => navigateToPage(l.id)}>{l.label}</span>
                ))}
              </div>
              <div className="lp-footer-col">
                <h5>Liên kết</h5>
                <a href="http://sgddt.tiengiang.gov.vn/" target="_blank" rel="noreferrer">Sở GD&ĐT Đồng Tháp</a>
                <a href="https://moet.gov.vn/" target="_blank" rel="noreferrer">Bộ Giáo dục & Đào tạo</a>
                <span onClick={onEnterSystem}>Cổng EduCore</span>
                <span onClick={() => navigateToPage('contact')}>Liên hệ</span>
              </div>
            </div>
            <div className="lp-footer-bottom">
              <div className="lp-footer-copy">© 2026 TRƯỜNG MẦM NON AN HỮU · Đồng Tháp · ALL RIGHTS RESERVED</div>
              <div className="lp-footer-powered">
                Hệ thống quản lý tích hợp <span>EduCore</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ── VIDEO MODAL ── */}
      {videoModal && (
        <div className="lp-video-overlay" onClick={() => setVideoModal(false)}>
          <div className="lp-video-box" onClick={e => e.stopPropagation()}>
            <button className="lp-video-close" onClick={() => setVideoModal(false)}>
              <X size={18} />
            </button>
            <div className="lp-video-placeholder">
              <Play size={48} color="#283548" />
              <p>Video giới thiệu Trường Mầm non An Hữu · Đồng Tháp</p>
              <p style={{ fontSize: '0.75rem', color: '#4a4238' }}>Video sẽ được cập nhật sớm</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
