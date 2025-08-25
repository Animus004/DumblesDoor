import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
  onClick: () => void;
  disabled?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, color, textColor, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group p-6 rounded-2xl shadow-sm flex flex-col items-start justify-between transform transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 text-left ${color} ${textColor} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}`}
      aria-label={`Open ${title}`}
    >
      <div className="mb-4 transform transition-transform duration-300 group-hover:scale-110">{icon}</div>
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </button>
  );
};

export default FeatureCard;