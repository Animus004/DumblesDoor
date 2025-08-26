
import React from 'react';

interface ServiceCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  iconBgColor: string;
  disabled?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, subtitle, icon, onClick, iconBgColor, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="bg-white p-4 rounded-2xl shadow-sm text-center flex flex-col items-center justify-start space-y-2 transition-shadow hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed h-full"
  >
    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <h4 className="font-bold text-gray-800">{title}</h4>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  </button>
);

export default ServiceCard;
