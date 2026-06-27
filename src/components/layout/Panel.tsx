import React from 'react';

interface PanelProps {
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ children }) => {
  return (
    <div className="flex-1 overflow-auto bg-[#e8eef6] p-4 lg:p-8">
      <div className="max-w-7xl mx-auto min-h-full flex flex-col gap-6 w-full min-w-0">
        {children}
      </div>
    </div>
  );
};
