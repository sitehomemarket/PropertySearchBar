import React from 'react';
import { useMemo } from 'react';
import { FilterState } from '../types/Property';
import { Property } from '../types/Property';
import { X, Plus, Minus } from 'lucide-react';

import { useMemo } from 'react';

interface FilterButtonsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  neighborhoods: string[];
  propertyTypes: string[];
  cities: string[];
  agents: string[];
  statuses: string[];
  projects: string[];
  properties: Property[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({
  filters,
  onFiltersChange,
  neighborhoods,
  propertyTypes,
  cities,
  agents,
  statuses,
  projects,
  isExpanded,
  onToggleExpanded
}) => {
  const handleQuickFilter = (field: keyof FilterState, value: string) => {
    if (field === 'עיר' || field === 'שכונה' || field === 'סוג_נכס' || field === 'מספר_חדרים' || field === 'פרויקט') {
      // Handle array fields
      const currentArray = Array.isArray(filters[field]) ? filters[field] : [];
      const newArray = currentArray.includes(value) 
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      
      onFiltersChange({
        ...filters,
        [field]: newArray
      });
    } else {
      // Handle string fields
      onFiltersChange({
        ...filters,
        [field]: filters[field] === value ? '' : value
      });
    }
  };

  const clearFilter = (field: keyof FilterState) => {
    if (field === 'עיר' || field === 'שכונה' || field === 'סוג_נכס' || field === 'מספר_חדרים' || field === 'פרויקט') {
      // Handle array fields
      onFiltersChange({
        ...filters,
        [field]: []
      });
    } else {
      // Handle string fields
      onFiltersChange({
        ...filters,
        [field]: ''
      });
    }
  };

  // Generate room options from actual data in the sheet
  const roomOptions = useMemo(() => {
    const roomSet = new Set<string>();
    // Get actual room numbers from properties
    properties.forEach(property => {
      if (property.מספר_חדרים && property.מספר_חדרים > 0) {
        roomSet.add(property.מספר_חדרים.toString());
      }
    });
    return Array.from(roomSet).sort((a, b) => parseInt(a) - parseInt(b));
  }, [properties]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#222222]">פילטור מהיר</h3>
        <button
          onClick={onToggleExpanded}
          className="flex items-center gap-2 px-4 py-2 bg-[#3366FF] text-white rounded-lg hover:bg-[#2952CC] transition-all duration-200 transform hover:scale-105"
        >
          {isExpanded ? (
            <>
              <Minus className="w-4 h-4" />
              צמצם
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              הרחב פילטרים
            </>
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
          {/* Cities */}
          {cities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">🏙️ ערים:</span>
                {filters.עיר.length > 0 && (
                  <button
                    onClick={() => clearFilter('עיר')}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    נקה
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {cities.slice(0, 8).map((city) => (
                  <button
                    key={city}
                    onClick={() => handleQuickFilter('עיר', city)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      Array.isArray(filters.עיר) && filters.עיר.includes(city)
                        ? 'bg-[#3366FF] text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-[#3366FF] hover:text-white hover:shadow-md hover:transform hover:scale-105'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Neighborhoods */}
          {neighborhoods.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">🏘️ שכונות:</span>
                {filters.שכונה.length > 0 && (
                  <button
                    onClick={() => clearFilter('שכונה')}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    נקה
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {neighborhoods.slice(0, 10).map((neighborhood) => (
                  <button
                    key={neighborhood}
                    onClick={() => handleQuickFilter('שכונה', neighborhood)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      Array.isArray(filters.שכונה) && filters.שכונה.includes(neighborhood)
                        ? 'bg-[#F4E851] text-[#222222] shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-[#F4E851] hover:text-[#222222] hover:shadow-md hover:transform hover:scale-105'
                    }`}
                  >
                    {neighborhood}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Property Types */}
          {propertyTypes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">🏠 סוגי נכסים:</span>
                {filters.סוג_נכס.length > 0 && (
                  <button
                    onClick={() => clearFilter('סוג_נכס')}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    נקה
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {propertyTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleQuickFilter('סוג_נכס', type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      Array.isArray(filters.סוג_נכס) && filters.סוג_נכס.includes(type)
                        ? 'bg-gradient-to-r from-[#3366FF] to-[#2952CC] text-white shadow-lg transform scale-105'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#3366FF] hover:text-[#3366FF] hover:shadow-md hover:transform hover:scale-105'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rooms */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">🛏️ מספר חדרים:</span>
              {filters.מספר_חדרים.length > 0 && (
                <button
                  onClick={() => clearFilter('מספר_חדרים')}
                  className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  נקה
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {roomOptions.map((rooms) => (
                <button
                  key={rooms}
                  onClick={() => handleQuickFilter('מספר_חדרים', rooms)}
                  className={`w-12 h-12 rounded-full text-sm font-bold transition-all duration-200 ${
                    Array.isArray(filters.מספר_חדרים) && filters.מספר_חדרים.includes(rooms)
                      ? 'bg-[#3366FF] text-white shadow-lg transform scale-110'
                      : 'bg-gray-100 text-gray-700 hover:bg-[#3366FF] hover:text-white hover:shadow-lg hover:transform hover:scale-110'
                  }`}
                >
                  {rooms}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          {statuses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">📊 סטטוס:</span>
                {filters.סטטוס && (
                  <button
                    onClick={() => clearFilter('סטטוס')}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    נקה
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => {
                  const getStatusStyle = (status: string, isActive: boolean) => {
                    const baseStyle = "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ";
                    
                    if (isActive) {
                      return baseStyle + 'bg-[#3366FF] text-white shadow-lg transform scale-105';
                    } else {
                      return baseStyle + 'bg-gray-100 text-gray-700 hover:bg-[#3366FF] hover:text-white hover:shadow-lg hover:transform hover:scale-105';
                    }
                  };

                  return (
                    <button
                      key={status}
                      onClick={() => handleQuickFilter('סטטוס', status)}
                      className={getStatusStyle(status, filters.סטטוס === status)}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">🏢 פרויקטים:</span>
                {filters.פרויקט.length > 0 && (
                  <button
                    onClick={() => clearFilter('פרויקט')}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    נקה
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {projects.slice(0, 8).map((project) => (
                  <button
                    key={project}
                    onClick={() => handleQuickFilter('פרויקט', project)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      Array.isArray(filters.פרויקט) && filters.פרויקט.includes(project)
                        ? 'bg-[#3366FF] text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-[#3366FF] hover:text-white hover:shadow-md hover:transform hover:scale-105'
                    }`}
                  >
                    {project}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Agents */}
          {agents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">👤 מגייסים:</span>
                {filters.מגייס && (
                  <button
                    onClick={() => clearFilter('מגייס')}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    נקה
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {agents.slice(0, 8).map((agent) => (
                  <button
                    key={agent}
                    onClick={() => handleQuickFilter('מגייס', agent)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filters.מגייס === agent
                        ? 'bg-[#3366FF] text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-[#3366FF] hover:text-white hover:shadow-md hover:transform hover:scale-105'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      filters.מגייס === agent ? 'bg-white text-[#3366FF]' : 'bg-[#3366FF] text-white'
                    }`}>
                      {agent.charAt(0)}
                    </div>
                    {agent}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parking Types */}
        </div>
      )}
    </div>
  );
};

export default FilterButtons;