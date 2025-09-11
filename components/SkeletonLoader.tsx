
import React from 'react';

/**
 * A reusable skeleton loader component with a pulse animation.
 * It serves as a placeholder for content that is loading.
 * @param {string} [className='h-24'] - Additional Tailwind CSS classes to apply, primarily for sizing.
 */
const SkeletonLoader: React.FC<{ className?: string }> = ({ className = 'h-24' }) => {
  return (
    <div
      className={`bg-gray-200 rounded-lg animate-pulse ${className}`}
      aria-live="polite"
      aria-busy="true"
    ></div>
  );
};

export default SkeletonLoader;
