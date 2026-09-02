import React from 'react';

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  iconBgColor: string;
  iconColor: string;
  value: number;
  label: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  iconBgColor,
  iconColor,
  value,
  label,
  onClick,
  isSelected = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-100'
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgColor} ${iconColor}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {value}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};

