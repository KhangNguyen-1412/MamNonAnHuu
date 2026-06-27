export interface MamNonStudentData {
  studentCode: string;
  fullName: string;
  dob: string; // born in 2020 for Grade 1 in 2026
  gender: 'Nam' | 'Nữ';
  hometown: string;
  address: string;
  parentName: string;
  parentPhone: string;
  kindergartenName: string;
  hasBirthCert: boolean;
  hasKindergartenCert: boolean;
}

const MOCK_MAM_NON_STUDENTS: Record<string, MamNonStudentData> = {
  'MN-20001': {
    studentCode: 'MN-20001',
    fullName: 'Nguyễn Minh Anh',
    dob: '2020-05-15',
    gender: 'Nam',
    hometown: 'Tiền Giang',
    address: 'Ấp 1, Xã An Hữu, Huyện Cái Bè, Tỉnh Tiền Giang',
    parentName: 'Nguyễn Văn Hùng',
    parentPhone: '0912345678',
    kindergartenName: 'Mầm non An Hữu',
    hasBirthCert: true,
    hasKindergartenCert: true
  },
  'MN-20002': {
    studentCode: 'MN-20002',
    fullName: 'Lê Ngọc Mai',
    dob: '2020-10-22',
    gender: 'Nữ',
    hometown: 'Bến Tre',
    address: 'Ấp 3, Xã An Hữu, Huyện Cái Bè, Tỉnh Tiền Giang',
    parentName: 'Lê Văn Tám',
    parentPhone: '0987654321',
    kindergartenName: 'Mầm non An Hữu',
    hasBirthCert: true,
    hasKindergartenCert: true
  },
  'MN-20003': {
    studentCode: 'MN-20003',
    fullName: 'Trần Quốc Bảo',
    dob: '2020-02-08',
    gender: 'Nam',
    hometown: 'Tiền Giang',
    address: 'Ấp Rạch Kè, Xã An Hữu, Huyện Cái Bè, Tỉnh Tiền Giang',
    parentName: 'Trần Minh Triết',
    parentPhone: '0905123456',
    kindergartenName: 'Mầm non An Hữu',
    hasBirthCert: true,
    hasKindergartenCert: true
  },
  'MN-20004': {
    studentCode: 'MN-20004',
    fullName: 'Phạm Thùy Chi',
    dob: '2020-12-14',
    gender: 'Nữ',
    hometown: 'Tiền Giang',
    address: 'Ấp 4, Xã An Hữu, Huyện Cái Bè, Tỉnh Tiền Giang',
    parentName: 'Phạm Văn Đồng',
    parentPhone: '0933456789',
    kindergartenName: 'Mầm non An Hữu',
    hasBirthCert: true,
    hasKindergartenCert: true
  },
  'MN-20005': {
    studentCode: 'MN-20005',
    fullName: 'Đỗ Đăng Khoa',
    dob: '2020-07-30',
    gender: 'Nam',
    hometown: 'Hà Nội',
    address: 'Ấp Hậu Mỹ, Xã An Hữu, Huyện Cái Bè, Tỉnh Tiền Giang',
    parentName: 'Đỗ Quốc Khánh',
    parentPhone: '0977889900',
    kindergartenName: 'Mầm non An Hữu',
    hasBirthCert: true,
    hasKindergartenCert: true
  }
};

export const formatMamNonStudentCode = (code: string): string => {
  const clean = code.trim().replace(/\s/g, '').toUpperCase();
  if (clean.startsWith('MN') && !clean.includes('-')) {
    return 'MN-' + clean.substring(2);
  }
  return clean;
};

export async function fetchMamNonStudentData(studentCodeRaw: string): Promise<MamNonStudentData | null> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const formattedCode = formatMamNonStudentCode(studentCodeRaw);
  const student = MOCK_MAM_NON_STUDENTS[formattedCode];
  
  if (student) {
    return { ...student };
  }
  return null;
}
