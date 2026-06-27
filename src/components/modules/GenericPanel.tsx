import React from 'react';
import { motion } from 'framer-motion';
import { Panel } from '../layout/Panel';
import { ModuleId } from '../../types';
import { NAVIGATION, ICONS } from '../../data/navigation';
import { Construction } from 'lucide-react';
import { fadeScaleVariants, hoverScaleVariants } from '../../utils/animations';

interface GenericPanelProps {
  moduleId: ModuleId;
}

export const GenericPanel: React.FC<GenericPanelProps> = ({ moduleId }) => {
  const moduleInfo = NAVIGATION.find((n) => n.id === moduleId) || NAVIGATION[0];
  const Icon = ICONS[moduleInfo.icon];

  return (
    <Panel>
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={fadeScaleVariants}
        className="flex flex-col items-center justify-center py-24 bg-[#f5f8fc] border-4 border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] h-full"
      >
        <motion.div
          className="w-24 h-24 bg-[#e8eef6] border border-[#b8c6d9] flex items-center justify-center mb-8 shadow-inner"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          {Icon ? <Icon className="w-10 h-10 text-[#7b8a9e]" /> : <Construction className="w-10 h-10 text-[#7b8a9e]" />}
        </motion.div>
        <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-4 text-center">Phân hệ {moduleInfo.label}</h2>
        <div className="w-16 h-1 bg-[#b8c6d9] mb-6"></div>
        <p className="text-[#4a5568] max-w-lg text-center leading-relaxed text-sm font-medium px-6">
          Sổ sách và nghiệp vụ cho phân hệ này đang được biên soạn. Quý đồng nghiệp vui lòng quay lại sau hoặc làm việc với văn phòng Ban Giám Hiệu để biết thêm chi tiết.
        </p>
        <motion.button
          className="mt-10 px-8 py-3 bg-[#1e2a3a] text-[#f5f8fc] font-bold text-xs uppercase tracking-widest border border-[#131a25] hover:bg-[#131a25] transition-colors shadow-[4px_4px_0px_rgba(43,38,32,0.2)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 active:scale-95 rounded-full"
          whileHover={{ y: 2, x: 2 }}
          whileTap={{ scale: 0.95 }}
        >
          Đệ Trình Yêu Cầu
        </motion.button>
      </motion.div>
    </Panel>
  );
};
