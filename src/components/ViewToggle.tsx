import React from 'react';
import { Grid3X3, List, Map, Layout } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'table' | 'map' | 'hybrid';
  onViewModeChange: (mode: 'grid' | 'table' | 'map' | 'hybrid') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1 shadow-sm">
      <button
        onClick={() => onViewModeChange('grid')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          viewMode === 'grid'
            ? 'bg-white text-[#3366FF] shadow-md transform scale-105'
            : 'text-gray-600 hover:text-[#3366FF] hover:bg-white/50'
        }`}
      >
        <Grid3X3 className="w-4 h-4" />
        קוביות
      </button>
      <button
        onClick={() => onViewModeChange('table')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          viewMode === 'table'
            ? 'bg-white text-[#3366FF] shadow-md transform scale-105'
            : 'text-gray-600 hover:text-[#3366FF] hover:bg-white/50'
        }`}
      >
        <List className="w-4 h-4" />
        טבלה
      </button>
      <button
        onClick={() => onViewModeChange('map')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          viewMode === 'map'
            ? 'bg-white text-[#3366FF] shadow-md transform scale-105'
            : 'text-gray-600 hover:text-[#3366FF] hover:bg-white/50'
        }`}
      >
        <Map className="w-4 h-4" />
        מפה
      </button>
      <button
        onClick={() => onViewModeChange('hybrid')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          viewMode === 'hybrid'
            ? 'bg-white text-[#3366FF] shadow-md transform scale-105'
            : 'text-gray-600 hover:text-[#3366FF] hover:bg-white/50'
        }`}
      >
        <Layout className="w-4 h-4" />
        משולב
      </button>
    </div>
  );
};

export default ViewToggle;