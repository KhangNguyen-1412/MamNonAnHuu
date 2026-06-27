/**
 * Fetch the list of all subjects taught (students study all subjects)
 */
export async function getAcademicSubjects(): Promise<string[]> {
  return [
    'Toán Học',
    'Ngữ Văn',
    'Tiếng Anh',
    'Vật Lý',
    'Hóa Học',
    'Sinh Học',
    'Lịch Sử',
    'Địa Lý',
    'Giáo Dục Kinh tế & Pháp luật',
    'Tin Học',
    'Công Nghệ',
    'Giáo Dục Thể Chất',
    'Giáo Dục Quốc Phòng & An Ninh',
  ];
}
