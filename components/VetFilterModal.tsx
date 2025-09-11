import React, { useState, useEffect } from 'react';

export interface VetFilters {
  sortBy: 'distance' | 'rating';
  filterBy: ('emergency' | 'teleconsult')[];
}

interface VetFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: VetFilters) => void;
  initialFilters: VetFilters;
}

const VetFilterModal: React.FC<VetFilterModalProps> = ({ isOpen, onClose, onApplyFilters, initialFilters }) => {
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);
  const [filterBy, setFilterBy] = useState<('emergency' | 'teleconsult')[]>(initialFilters.filterBy);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setSortBy(initialFilters.sortBy);
    setFilterBy(initialFilters.filterBy);
  }, [initialFilters]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  const handleFilterChange = (filter: 'emergency' | 'teleconsult') => {
    setFilterBy(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleApply = () => {
    onApplyFilters({ sortBy, filterBy });
    handleClose();
  };

  const handleReset = () => {
    setSortBy('distance');
    setFilterBy([]);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-heading"
    >
      <div
        className={`w-full bg-gray-50 rounded-t-2xl p-4 pt-2 max-h-[80vh] flex flex-col ${isExiting ? 'exiting' : ''} bottom-sheet-content`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto my-2 flex-shrink-0"></div>
        <h2 id="filter-heading" className="text-xl font-bold text-center mb-4 flex-shrink-0">
          Sort & Filter
        </h2>
        
        <div className="overflow-y-auto space-y-6 flex-grow">
          {/* Sort by Section */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-800 mb-2">Sort by</legend>
            <div className="space-y-2">
              <label className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                <input
                  type="radio"
                  name="sort"
                  value="distance"
                  checked={sortBy === 'distance'}
                  onChange={() => setSortBy('distance')}
                  className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300"
                />
                <span className="ml-3 font-medium text-gray-700">Distance</span>
              </label>
              <label className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                <input
                  type="radio"
                  name="sort"
                  value="rating"
                  checked={sortBy === 'rating'}
                  onChange={() => setSortBy('rating')}
                  className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300"
                />
                <span className="ml-3 font-medium text-gray-700">Rating</span>
              </label>
            </div>
          </fieldset>

          {/* Filter by Section */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-800 mb-2">Filter by</legend>
            <div className="space-y-2">
              <label className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                <input
                  type="checkbox"
                  checked={filterBy.includes('emergency')}
                  onChange={() => handleFilterChange('emergency')}
                  className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <span className="ml-3 font-medium text-gray-700">24/7 Emergency</span>
              </label>
              <label className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                <input
                  type="checkbox"
                  checked={filterBy.includes('teleconsult')}
                  onChange={() => handleFilterChange('teleconsult')}
                  className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <span className="ml-3 font-medium text-gray-700">Tele-consult Available</span>
              </label>
            </div>
          </fieldset>
        </div>
        
        <footer className="mt-6 border-t pt-4 flex-shrink-0 flex gap-4">
          <button onClick={handleReset} className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors">
            Reset
          </button>
          <button onClick={handleApply} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg hover:bg-teal-600 transition-colors">
            Apply Filters
          </button>
        </footer>
      </div>
    </div>
  );
};

export default VetFilterModal;
