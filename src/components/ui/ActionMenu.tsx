import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, ShieldAlert } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useUserRole, UserRole } from '../../utils/role';

export interface ActionMenuItem {
  label: string;
  icon: string; // Lucide icon name
  onClick: () => void;
  roles?: UserRole[]; // If specified, only visible to these roles
  danger?: boolean;
}

interface ActionProps {
  primaryAction: {
    label: string;
    icon: string;
    onClick: () => void;
    roles?: UserRole[];
  };
  actions: ActionMenuItem[];
  align?: 'left' | 'right';
}

export const ActionMenu: React.FC<ActionProps> = ({ primaryAction, actions, align = 'right' }) => {
  const currentRole = useUserRole();
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If space below the button is less than 180px, open upwards to avoid page layout stretch/scrollbar shift
      if (spaceBelow < 180) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Filter actions based on role
  const isPrimaryVisible = !primaryAction.roles || primaryAction.roles.includes(currentRole);
  const visibleActions = actions.filter(act => !act.roles || act.roles.includes(currentRole));

  const renderIcon = (name: string, className = "w-3.5 h-3.5 mr-2") => {
    const IconComponent = (LucideIcons as any)[name];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return null;
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-1">
      {/* Primary action displayed directly */}
      {isPrimaryVisible && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            primaryAction.onClick();
          }}
          className="inline-flex items-center px-3 py-1 bg-[#e8eef6] hover:bg-[#d4dde9] text-[#2c5ea0] border border-[#b8c6d9] text-xs font-bold uppercase tracking-wider rounded-full transition-colors duration-150 shadow-sm"
        >
          {renderIcon(primaryAction.icon, "w-3 h-3 mr-1.5")}
          {primaryAction.label}
        </button>
      )}

      {/* Dropdown triggers if there are secondary actions */}
      {visibleActions.length > 0 && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-1.5 text-[#7b8a9e] hover:bg-[#d4dde9] hover:text-[#1e2a3a] border border-transparent hover:border-[#b8c6d9] rounded-full transition-all duration-150"
            title="Thao tác khác"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isOpen && (
            <div
              className={`absolute w-52 bg-[#f5f8fc] border-2 border-[#b8c6d9] rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-[#dce4ee] py-1 ${
                openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
              } ${
                align === 'right' ? 'right-0' : 'left-0'
              }`}
            >
              <div className="px-3 py-1 text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider bg-[#e8eef6] flex items-center justify-between">
                <span>Danh mục Tác vụ</span>
                <span className="text-[8px] bg-[#b8c6d9] text-[#4a5568] rounded px-1 lowercase">role: {currentRole}</span>
              </div>
              
              <div className="py-1">
                {visibleActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      action.onClick();
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors flex items-center ${
                      action.danger
                        ? 'text-red-700 hover:bg-red-50 hover:text-red-900 bg-red-50/10'
                        : 'text-[#4a5568] hover:bg-[#e8eef6] hover:text-[#2c5ea0]'
                    }`}
                  >
                    {renderIcon(action.icon, `w-3.5 h-3.5 mr-2 ${action.danger ? 'text-red-600' : 'text-[#7b8a9e]'}`)}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
