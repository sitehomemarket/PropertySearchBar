import React, { useState, useRef, useEffect } from 'react';
import { useMemo } from 'react';
import { FilterState } from '../types/Property';
import { Property } from '../types/Property';
import { Search, X, ChevronDown, Check, Filter } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  cities: string[];
  neighborhoods: string[];
  propertyTypes: string[];
  agents: string[];
  projects: string[];
  statuses: string[];
  properties: Property[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  icon?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  placeholder,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const toggleOption = (option: string) => {
    // Clear existing timer
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    // Update selection
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }

    // Keep dropdown open and set auto-close timer
    setIsOpen(true);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 3000);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues.length} נבחרו`;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#3366FF] focus:border-transparent bg-white text-right flex items-center justify-between transition-all hover:shadow-sm ${
          selectedValues.length > 0 ? 'border-[#3366FF] bg-blue-50' : 'border-gray-300'
        }`}
      >
        <span className={`flex items-center gap-2 ${selectedValues.length === 0 ? 'text-gray-500' : 'text-[#3366FF] font-medium'}`}>
          {icon && <span className="text-sm">{icon}</span>}
          <span className="truncate">{getDisplayText()}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className="w-full px-3 py-2 text-sm text-right hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="truncate">{option}</span>
              {selectedValues.includes(option) && (
                <Check className="w-4 h-4 text-[#3366FF]" />
              )}
            </button>
          ))}
          {selectedValues.length > 0 && (
            <div className="border-t border-gray-200">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-right"
              >
                נקה הכל
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SingleSelectDropdownProps {
  label: string;
  options: string[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: string;
}

const SingleSelectDropdown: React.FC<SingleSelectDropdownProps> = ({
  options,
  selectedValue,
  onChange,
  placeholder,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const selectOption = (option: string) => {
    // Clear existing timer
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    // Update selection
    onChange(selectedValue === option ? '' : option);

    // Keep dropdown open and set auto-close timer
    setIsOpen(true);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 3000);
  };

  const getDisplayText = () => {
    return selectedValue || placeholder;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#3366FF] focus:border-transparent bg-white text-right flex items-center justify-between transition-all hover:shadow-sm ${
          selectedValue ? 'border-[#3366FF] bg-blue-50' : 'border-gray-300'
        }`}
      >
        <span className={`flex items-center gap-2 ${!selectedValue ? 'text-gray-500' : 'text-[#3366FF] font-medium'}`}>
          {icon && <span className="text-sm">{icon}</span>}
          <span className="truncate">{getDisplayText()}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={() => selectOption('')}
            className="w-full px-3 py-2 text-sm text-right hover:bg-gray-50 text-gray-500"
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => selectOption(option)}
              className="w-full px-3 py-2 text-sm text-right hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="truncate">{option}</span>
              {selectedValue === option && (
                <Check className="w-4 h-4 text-[#3366FF]" />
              )}
            </button>
          ))}
          {selectedValue && (
            <div className="border-t border-gray-200">
              <button
                type="button"
                onClick={() => onChange('')}
                className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-right"
              >
                נקה
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  cities,
  neighborhoods,
  propertyTypes,
  agents,
  projects,
  statuses,
  properties = [],
  onToggleCollapse
}) => {
  const handleInputChange = (field: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchText: '',
      עיר: [],
      שכונה: [],
      מספר_חדרים: [],
      סוג_נכס: [],
      סטטוס: '',
      מגייס: '',
      פרויקט: [],
      סוג_חניה: [],
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.עיר.length > 0) count++;
    if (filters.שכונה.length > 0) count++;
    if (filters.סוג_נכס.length > 0) count++;
    if (filters.מספר_חדרים.length > 0) count++;
    if (filters.פרויקט.length > 0) count++;
    if (filters.סטטוס) count++;
    if (filters.מגייס) count++;
    return count;
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
    <div className="space-y-3 bg-white relative z-20">
      {/* Main Filters Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 bg-white p-4 rounded-lg shadow-sm border">
        {/* Cities */}
        <MultiSelectDropdown
          label="עיר"
          options={cities}
          selectedValues={filters.עיר}
          onChange={(values) => handleInputChange('עיר', values)}
          placeholder="בחר עיר"
          icon="🏙️"
        />

        {/* Neighborhoods */}
        <MultiSelectDropdown
          label="שכונה"
          options={neighborhoods}
          selectedValues={filters.שכונה}
          onChange={(values) => handleInputChange('שכונה', values)}
          placeholder="בחר שכונה"
          icon="🏘️"
        />

        {/* Property Types */}
        <MultiSelectDropdown
          label="סוג נכס"
          options={propertyTypes}
          selectedValues={filters.סוג_נכס}
          onChange={(values) => handleInputChange('סוג_נכס', values)}
          placeholder="בחר סוג נכס"
          icon="🏠"
        />

        {/* Rooms */}
        <MultiSelectDropdown
          label="חדרים"
          options={roomOptions}
          selectedValues={filters.מספר_חדרים}
          onChange={(values) => handleInputChange('מספר_חדרים', values)}
          placeholder="בחר חדרים"
          icon="🛏️"
        />

        {/* Status */}
        <SingleSelectDropdown
          label="סטטוס"
          options={statuses}
          selectedValue={filters.סטטוס}
          onChange={(value) => handleInputChange('סטטוס', value)}
          placeholder="בחר סטטוס"
          icon="📊"
        />

        {/* Projects */}
        <MultiSelectDropdown
          label="פרויקט"
          options={projects}
          selectedValues={filters.פרויקט}
          onChange={(values) => handleInputChange('פרויקט', values)}
          placeholder="בחר פרויקט"
          icon="🏢"
        />

        {/* Agents */}
        <SingleSelectDropdown
          label="מגייס"
          options={agents}
          selectedValue={filters.מגייס}
          onChange={(value) => handleInputChange('מגייס', value)}
          placeholder="בחר מגייס"
          icon="👤"
        />

        {/* Parking Types */}
      </div>

      {/* Active Filters and Clear */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-800">
              {getActiveFiltersCount()} פילטרים פעילים
            </span>
          </div>
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 transition-colors rounded-lg text-sm font-medium"
          >
            <X className="w-4 h-4" />
            נקה הכל
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;