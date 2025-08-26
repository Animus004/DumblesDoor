import React from 'react';

interface ServiceCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  iconBgColor: string; // Kept for compatibility, but not used.
  disabled?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, subtitle, icon, onClick, disabled = false }) => {
  
  const handleCardClick = () => {
    if (disabled) return;
    onClick();
  };

  return (
    <button
      onClick={handleCardClick}
      disabled={disabled}
      style={{ 
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
      }}
      className="relative group backdrop-blur-lg rounded-2xl border shadow-3d text-center flex flex-col items-center justify-start p-4 space-y-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed h-full w-full interactive-scale"
      aria-label={`${title}, ${subtitle}`}
    >
      <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 transition-transform duration-300">
        {React.cloneElement(icon as React.ReactElement<any>, { className: "h-14 w-14" })}
      </div>
      
      <div className="flex flex-col">
        <h4 className="font-poppins font-bold tracking-wide" style={{ color: 'var(--color-text-primary)' }}>{title}</h4>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>
      </div>
    </button>
  );
};

export default ServiceCard;