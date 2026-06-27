import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Table2, Check } from 'lucide-react';
import { ModalBase } from './Modals';
import { exportToCSV, exportToExcel, ExportColumn } from '../../utils/exportHelper';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  availableColumns: ExportColumn[];
  defaultSelectedColumns?: string[];
  filename?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  availableColumns,
  defaultSelectedColumns,
  filename = 'export'
}) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    defaultSelectedColumns || availableColumns.map(col => col.key)
  );
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!defaultSelectedColumns) {
      setSelectedColumns(availableColumns.map(col => col.key));
    }
  }, [availableColumns, defaultSelectedColumns]);

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelectedColumns(availableColumns.map(col => col.key));
  };

  const deselectAll = () => {
    setSelectedColumns([]);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      alert('Vui lòng chọn ít nhất một cột để xuất');
      return;
    }

    setIsExporting(true);
    try {
      const columnsToExport = availableColumns.filter(col =>
        selectedColumns.includes(col.key)
      );

      if (exportFormat === 'csv') {
        exportToCSV(data, columnsToExport, filename);
      } else {
        exportToExcel(data, columnsToExport, filename);
      }

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Export error:', error);
      alert('Lỗi khi xuất dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Cấu Hình Xuất Dữ Liệu"
      subtitle={`${title} - Lựa chọn định dạng và cấu trúc tệp dữ liệu tải về`}
      width="max-w-2xl"
    >
      <div className="space-y-6 font-sans text-[#1e2a3a]">
        {/* Format Selection Card Grid */}
        <div>
          <h3 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-widest mb-3">
            1. Định Dạng Tệp Xuất
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* CSV Format Card */}
            <div
              onClick={() => setExportFormat('csv')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative flex items-start gap-4 select-none group ${
                exportFormat === 'csv'
                  ? 'bg-white border-[#2c5ea0] shadow-[4px_4px_0px_#e8eef6] md:scale-[1.01]'
                  : 'bg-[#f0f4fa] border-[#b8c6d9] hover:bg-white hover:border-[#7b8a9e]'
              }`}
            >
              <div className={`p-3 rounded-xl shrink-0 ${
                exportFormat === 'csv' ? 'bg-[#2c5ea0]/10 text-[#2c5ea0]' : 'bg-[#dce4ee] text-[#7b8a9e] group-hover:text-[#4a5568]'
              }`}>
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1e2a3a]">Định dạng CSV</p>
                <p className="text-[10px] text-[#7b8a9e] leading-relaxed">Phù hợp tải dữ liệu thô, dung lượng cực nhẹ, tương thích tốt với mọi hệ thống phân tích dữ liệu.</p>
              </div>
              {exportFormat === 'csv' && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-[#2c5ea0] text-white rounded-full flex items-center justify-center shadow-inner">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* XLSX Format Card */}
            <div
              onClick={() => setExportFormat('xlsx')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative flex items-start gap-4 select-none group ${
                exportFormat === 'xlsx'
                  ? 'bg-white border-[#2c5ea0] shadow-[4px_4px_0px_#e8eef6] md:scale-[1.01]'
                  : 'bg-[#f0f4fa] border-[#b8c6d9] hover:bg-white hover:border-[#7b8a9e]'
              }`}
            >
              <div className={`p-3 rounded-xl shrink-0 ${
                exportFormat === 'xlsx' ? 'bg-[#2c5ea0]/10 text-[#2c5ea0]' : 'bg-[#dce4ee] text-[#7b8a9e] group-hover:text-[#4a5568]'
              }`}>
                <Table2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1e2a3a]">Định dạng Excel (XLSX)</p>
                <p className="text-[10px] text-[#7b8a9e] leading-relaxed">Định dạng bảng tính chính thức, hỗ trợ đầy đủ font chữ tiếng Việt có dấu, định dạng cột và kẻ bảng chuyên nghiệp.</p>
              </div>
              {exportFormat === 'xlsx' && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-[#2c5ea0] text-white rounded-full flex items-center justify-center shadow-inner">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column Selection Grid with Checkbox Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-widest">
              2. Chọn Cột Cần Xuất ({selectedColumns.length}/{availableColumns.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-[9px] px-3 py-1 bg-white hover:bg-[#e8eef6] border border-[#b8c6d9] rounded-full text-[#2c5ea0] font-bold transition-colors uppercase tracking-wider shadow-sm"
              >
                Chọn Tất Cả
              </button>
              <button
                onClick={deselectAll}
                className="text-[9px] px-3 py-1 bg-white hover:bg-[#e8eef6] border border-[#b8c6d9] rounded-full text-[#2c5ea0] font-bold transition-colors uppercase tracking-wider shadow-sm"
              >
                Bỏ Chọn
              </button>
            </div>
          </div>

          <div className="bg-[#f0f4fa] border border-[#b8c6d9] rounded-2xl p-4 max-h-64 overflow-y-auto shadow-inner">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableColumns.map(col => {
                const isSelected = selectedColumns.includes(col.key);
                return (
                  <div
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-white border-[#2c5ea0] shadow-sm font-bold'
                        : 'bg-white/40 border-transparent hover:bg-white hover:border-[#b8c6d9]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                      isSelected
                        ? 'bg-[#2c5ea0] border-[#2c5ea0] text-white'
                        : 'border-[#b8c6d9] bg-white text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-xs text-[#1e2a3a] truncate">{col.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Decorative Premium Info Box */}
        <div className="bg-[#e8eef6] border border-[#b8c6d9] rounded-2xl p-4 text-xs text-[#4a5568] space-y-2">
          <p className="font-bold text-[#2c5ea0] uppercase tracking-wider flex items-center gap-2 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2c5ea0] animate-pulse"></span>
            Thông Tin Tệp Xuất Dự Kiến
          </p>
          <ul className="space-y-1.5 text-[11px] font-sans">
            <li className="flex items-center gap-1.5">
              <span className="text-[#7b8a9e]">Tên file:</span> 
              <span className="font-mono bg-white px-2 py-0.5 border border-[#b8c6d9] text-[#1e2a3a] rounded font-bold">{filename}_[timestamp].{exportFormat}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-[#7b8a9e]">Mã hóa ký tự:</span> 
              <span className="font-bold text-[#1e2a3a]">UTF-8 Unicode (Hỗ trợ tiếng Việt đầy đủ)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-[#7b8a9e]">Quy mô:</span> 
              <span className="font-bold text-[#1e2a3a]">{data.length} bản ghi</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t-[3px] border-double border-[#b8c6d9]">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-6 py-2.5 bg-white hover:bg-[#f0f4fa] border border-[#b8c6d9] text-[#4a5568] text-xs font-bold uppercase tracking-widest rounded-full transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedColumns.length === 0}
            className="px-6 py-2.5 bg-[#2c5ea0] hover:bg-[#663030] text-white border border-[#5c2525] text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-[2px_2px_0px_#153460] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Đang xuất tệp...' : 'Bắt Đầu Tải Về'}
          </button>
        </div>
      </div>
    </ModalBase>
  );
};
