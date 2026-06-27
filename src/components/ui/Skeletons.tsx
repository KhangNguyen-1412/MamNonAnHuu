import React from 'react';

interface SkeletonBaseProps {
  className?: string;
}

// Warm parchment shimmer primitives
export const SkeletonPulse: React.FC<SkeletonBaseProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#dce4ee] rounded ${className}`} />
);

export const SkeletonText: React.FC<{ widthClass?: string; heightClass?: string; className?: string }> = ({
  widthClass = 'w-2/3',
  heightClass = 'h-4',
  className = ''
}) => (
  <SkeletonPulse className={`${widthClass} ${heightClass} ${className}`} />
);

export const SkeletonPill: React.FC<SkeletonBaseProps> = ({ className = '' }) => (
  <SkeletonPulse className={`h-6 w-20 rounded-full ${className}`} />
);

export const SkeletonCircle: React.FC<SkeletonBaseProps> = ({ className = '' }) => (
  <SkeletonPulse className={`h-8 w-8 rounded-full ${className}`} />
);

/**
 * Skeleton Loader matching the exact table structure of StudentsPanel.tsx
 */
interface TableSkeletonProps {
  rows?: number;
  activeTab: 'profiles' | 'attendance' | 'grades' | 'conduct';
  currentRole?: string;
}

export const StudentTableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 3, activeTab, currentRole }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => {
        // Vary certain widths per row for a more authentic, asymmetrical layout
        const nameWidth = rowIndex === 0 ? 'w-40' : rowIndex === 1 ? 'w-48' : 'w-36';
        const secTextWidth = rowIndex === 0 ? 'w-28' : rowIndex === 1 ? 'w-36' : 'w-24';
        const idTextWidth = rowIndex === 0 ? 'w-16' : rowIndex === 1 ? 'w-20' : 'w-14';

        return (
          <tr key={`stud-skel-${rowIndex}`} className="border-b border-[#b8c6d9] bg-[#f5f8fc]">
            {activeTab === 'profiles' && (
              <>
                {/* Mã HS */}
                <td className="px-4 py-2.5">
                  <SkeletonText widthClass={idTextWidth} className="font-mono h-3.5" />
                </td>
                {/* Họ và Tên */}
                <td className="px-4 py-2.5">
                  <SkeletonText widthClass={nameWidth} className="font-bold mb-1 h-4" />
                  <SkeletonText widthClass={secTextWidth} className="h-3 opacity-60" />
                </td>
                {/* Lớp H.Tại */}
                <td className="px-4 py-2.5">
                  <SkeletonText widthClass="w-12" className="h-4" />
                </td>
                {/* Phụ huynh & SĐT (homeroom_teacher) */}
                {currentRole === 'homeroom_teacher' && (
                  <td className="px-4 py-2.5">
                    <SkeletonText widthClass="w-24" className="font-bold mb-1 h-4" />
                    <SkeletonText widthClass="w-20" className="h-3 opacity-60" />
                  </td>
                )}
                {/* GV Chủ Nhiệm (subject_teacher) */}
                {currentRole === 'subject_teacher' && (
                  <td className="px-4 py-2.5">
                    <SkeletonText widthClass="w-24" className="font-bold mb-1 h-4" />
                    <SkeletonText widthClass="w-20" className="h-3 opacity-60" />
                  </td>
                )}
                {/* Trạng Thái */}
                <td className="px-4 py-2.5">
                  <SkeletonPill className="opacity-80" />
                </td>
                {/* Tác Vụ */}
                <td className="px-4 py-2.5 text-center flex justify-center items-center">
                  <SkeletonCircle className="w-8 h-8 opacity-70" />
                </td>
              </>
            )}

            {activeTab === 'attendance' && (
              <>
                {/* Họ và Tên */}
                <td className="px-4 py-2.5">
                  <SkeletonText widthClass={nameWidth} className="font-bold mb-1 h-4" />
                  <SkeletonText widthClass={idTextWidth} className="font-mono h-3 opacity-60" />
                </td>
                {/* Lớp */}
                <td className="px-4 py-2.5">
                  <SkeletonText widthClass="w-12" className="h-4" />
                </td>
                {/* Có Phép */}
                <td className="px-4 py-2.5 text-center">
                  <SkeletonText widthClass="w-8 mx-auto" className="h-5" />
                </td>
                {/* Không Phép */}
                <td className="px-4 py-2.5 text-center">
                  <SkeletonText widthClass="w-8 mx-auto" className="h-5" />
                </td>
                {/* Đánh Giá Tuần */}
                <td className="px-4 py-2.5">
                  <SkeletonText widthClass="w-24" className="h-4" />
                </td>
                {/* Tác Vụ */}
                <td className="px-4 py-2.5 text-center flex justify-center items-center">
                  <SkeletonCircle className="w-8 h-8 opacity-70" />
                </td>
              </>
            )}

            {activeTab === 'grades' && (
              <>
                {/* Họ và Tên */}
                <td className="px-4 py-2.5 sticky left-0 bg-[#f5f8fc] z-10">
                  <SkeletonText widthClass={nameWidth} className="font-bold mb-1 h-4" />
                  <SkeletonText widthClass={idTextWidth} className="font-mono h-3 opacity-60" />
                </td>
                {/* Lớp */}
                <td className="px-3 py-2.5">
                  <SkeletonText widthClass="w-12" className="h-4" />
                </td>
                {/* Toán */}
                <td className="px-2 py-2.5 text-center">
                  <SkeletonText widthClass="w-8 mx-auto" className="h-5 font-bold" />
                </td>
                {/* Ngữ Văn */}
                <td className="px-2 py-2.5 text-center">
                  <SkeletonText widthClass="w-8 mx-auto" className="h-5 font-bold" />
                </td>
                {/* TBHK */}
                <td className="px-3 py-2.5 text-center">
                  <SkeletonText widthClass="w-10 mx-auto" className="h-5 font-bold" />
                </td>
                {/* Tác Vụ */}
                <td className="px-3 py-2.5 text-center flex justify-center items-center">
                  <SkeletonCircle className="w-8 h-8 opacity-70" />
                </td>
              </>
            )}

            {activeTab === 'conduct' && (
              <>
                {/* Họ và Tên */}
                <td className="px-4 py-2.5">
                  <SkeletonText widthClass={nameWidth} className="font-bold mb-1 h-4" />
                  <SkeletonText widthClass={idTextWidth} className="font-mono h-3 opacity-60" />
                </td>
                {/* Lớp */}
                <td className="px-4 py-2.5">
                  <SkeletonText widthClass="w-12" className="h-4" />
                </td>
                {/* Vi Phạm */}
                <td className="px-4 py-2.5">
                  <SkeletonText widthClass="w-32" className="h-3.5 italic" />
                </td>
                {/* Khen Thưởng */}
                <td className="px-4 py-2.5">
                  <SkeletonText widthClass="w-32" className="h-3.5 italic" />
                </td>
                {/* Hạnh Kiểm HK */}
                <td className="px-4 py-2.5 text-center">
                  <SkeletonText widthClass="w-12 mx-auto" className="h-4 font-bold" />
                </td>
                {/* Tác Vụ */}
                <td className="px-4 py-2.5 text-center flex justify-center items-center">
                  <SkeletonCircle className="w-8 h-8 opacity-70" />
                </td>
              </>
            )}
          </tr>
        );
      })}
    </>
  );
};


/**
 * Skeleton Loader matching the exact table structure of PersonnelPanel.tsx
 */
interface PersonnelSkeletonProps {
  rows?: number;
  activeTab: 'profiles' | 'evaluation' | 'rewards';
}

export const PersonnelTableSkeleton: React.FC<PersonnelSkeletonProps> = ({ rows = 3, activeTab }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => {
        // Vary certain widths per row for asymmetrical realistic look
        const nameWidth = rowIndex === 0 ? 'w-44' : rowIndex === 1 ? 'w-36' : 'w-48';
        const secTextWidth = rowIndex === 0 ? 'w-32' : rowIndex === 1 ? 'w-24' : 'w-36';
        const idTextWidth = rowIndex === 0 ? 'w-14' : rowIndex === 1 ? 'w-16' : 'w-12';
        
        return (
          <tr key={`staff-skel-${rowIndex}`} className="border-b border-[#b8c6d9] bg-[#f5f8fc]">
            {activeTab === 'profiles' && (
              <>
                {/* Mã CB */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass={idTextWidth} className="font-mono h-3.5" />
                </td>
                {/* Họ và Tên */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass={nameWidth} className="font-bold mb-2 h-4" />
                  <SkeletonText widthClass={secTextWidth} className="h-3 opacity-60" />
                </td>
                {/* Chức vụ / Vị trí */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass="w-32" className="h-4" />
                </td>
                {/* Tổ Chuyên môn */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass="w-24" className="h-4" />
                </td>
                {/* Môn Dạy Chính */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass="w-20" className="h-4" />
                </td>
                {/* Trạng Thái */}
                <td className="px-6 py-5">
                  <SkeletonPill className="opacity-80" />
                </td>
                {/* Tác Vụ */}
                <td className="px-6 py-5 text-center flex justify-center items-center">
                  <SkeletonCircle className="w-8 h-8 opacity-70" />
                </td>
              </>
            )}

            {activeTab === 'evaluation' && (
              <>
                {/* Họ và Tên */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass={nameWidth} className="font-bold h-4" />
                </td>
                {/* Tiêu chí 1 */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass="w-12" className="h-4" />
                </td>
                {/* Tiêu chí 2 */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass="w-12" className="h-4" />
                </td>
                {/* Sáng kiến KN */}
                <td className="px-6 py-5">
                  <div className="flex items-center">
                    <SkeletonCircle className="w-4 h-4 mr-2 opacity-50" />
                    <SkeletonText widthClass="w-28" className="h-3.5" />
                  </div>
                </td>
                {/* Xếp Loại Chung */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass="w-36" className="h-4 uppercase tracking-wider" />
                </td>
                {/* Tác Vụ */}
                <td className="px-6 py-5 text-center flex justify-center items-center">
                  <SkeletonCircle className="w-8 h-8 opacity-70" />
                </td>
              </>
            )}

            {activeTab === 'rewards' && (
              <>
                {/* Họ và Tên */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass={nameWidth} className="font-bold h-4" />
                </td>
                {/* Hình thức */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass="w-24" className="h-4" />
                </td>
                {/* Lý do / Thành tích */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass="w-64" className="h-3.5" />
                </td>
                {/* Cấp QĐ */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass="w-16" className="h-4" />
                </td>
                {/* Năm Học */}
                <td className="px-6 py-5">
                  <SkeletonText widthClass="w-16" className="h-4 font-mono" />
                </td>
                {/* Tác Vụ */}
                <td className="px-6 py-5 text-center flex justify-center items-center">
                  <SkeletonCircle className="w-8 h-8 opacity-70" />
                </td>
              </>
            )}
          </tr>
        );
      })}
    </>
  );
};


/**
 * Sidebar Mini Stat Card Skeleton for Personnel Panel
 */
export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#e8eef6] p-4 rounded-2xl border border-[#b8c6d9] animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonText widthClass="w-20" className="h-3" />
        <SkeletonText widthClass="w-8" className="h-5" />
      </div>
      <div className="flex items-center justify-between">
        <SkeletonText widthClass="w-16" className="h-3" />
        <SkeletonText widthClass="w-6" className="h-4" />
      </div>
    </div>
  );
};
