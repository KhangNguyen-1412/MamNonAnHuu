import React, { useEffect } from 'react';
import { Bell, Search, Settings } from 'lucide-react';
import { ModuleId, UserRole } from '../../types';
import { NAVIGATION } from '../../data/navigation';
import { TermSelector } from '../ui/TermSelector';
import { ROLE_THEMES } from '../../utils/role';

interface HeaderProps {
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeModule, onSelectModule, currentRole, onChangeRole }) => {
  const moduleInfo = NAVIGATION.find((n) => n.id === activeModule) || NAVIGATION[0];
  const [language, setLanguage] = React.useState<'vi' | 'en'>(() => (localStorage.getItem('language') as any) || 'vi');

  React.useEffect(() => {
    const handleLangChange = () => {
      setLanguage((localStorage.getItem('language') as any) || 'vi');
    };
    window.addEventListener('language-changed', handleLangChange);
    return () => window.removeEventListener('language-changed', handleLangChange);
  }, []);

  return (
    <header className={`h-20 bg-[#f5f8fc] border-b-[3px] border-double ${ROLE_THEMES[currentRole].headerBorder} px-4 md:px-8 flex items-center justify-between shrink-0 shadow-[0_4px_10px_rgba(43,38,32,0.03)] z-30 relative`}>
      <div className="pr-2 lg:pr-4 flex-1">
        <h1 className={`text-sm sm:text-xl md:text-2xl font-bold ${ROLE_THEMES[currentRole].primaryText} font-serif tracking-wide uppercase leading-tight line-clamp-2 sm:whitespace-nowrap`}>Trường Mầm non An Hữu</h1>
        <p className="text-[8px] sm:text-[9px] md:text-[10px] text-[#7b8a9e] uppercase tracking-wider md:tracking-[0.2em] font-bold mt-0.5 md:mt-1 line-clamp-1 sm:whitespace-nowrap">
          {language === 'en' ? 'Educational Management System' : 'Hệ Thống Quản Lý Giáo Dục'}
        </p>
      </div>
      
      <div className="flex items-center gap-2 md:gap-6 flex-shrink-0 pl-2">
        <div className="hidden md:flex items-center gap-3">
          <span className="w-2 h-2 bg-[#10b981] rounded-full shadow-[0_0_8px_#10b981] animate-pulse ml-2"></span>
          <TermSelector />
        </div>
        
        <div className="relative ml-2 hidden lg:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8e9eb4]" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search menu...' : 'Tìm kiếm danh mục...'}
            className="pl-9 pr-4 py-1.5 border-b-2 border-[#b8c6d9] bg-transparent text-sm font-medium focus:outline-none focus:border-[#2c5ea0] focus:bg-[#e8eef6] w-48 xl:w-56 transition-all text-[#1e2a3a] placeholder:text-[#8e9eb4] rounded-full"
          />
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-2 border-l border-[#b8c6d9] pl-2 md:pl-4">
          <button className="p-2 text-[#4a5568] hover:bg-[#e8eef6] hover:text-[#2c5ea0] relative transition-colors border border-transparent hover:border-[#b8c6d9] rounded-full">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2c5ea0] border border-[#f5f8fc] rounded-full"></span>
          </button>
          
          <button 
            onClick={() => onSelectModule('settings')}
            className={`p-2 transition-colors border rounded-full ${activeModule === 'settings' ? 'bg-[#e8eef6] text-[#2c5ea0] border-[#b8c6d9]' : 'text-[#4a5568] hover:bg-[#e8eef6] hover:text-[#2c5ea0] border-transparent hover:border-[#b8c6d9]'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

