import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FilterState } from '../types/Property';
import { Property } from '../types/Property';
import { ChevronDown, Check, X } from 'lucide-react';

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

// Priority city order
const PRIORITY_CITIES = ['תל אביב-יפו', 'רמת גן', 'גבעתיים', 'חיפה', 'בת ים'];

// ─── Range Slider ────────────────────────────────────────────────────────────

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  values: [number, number];
  onChange: (values: [number, number]) => void;
  formatLabel: (val: number) => string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({ min, max, step, values, onChange, formatLabel }) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercent = (val: number) => ((val - min) / (max - min)) * 100;

  const getValueFromX = useCallback((clientX: number): number => {
    if (!trackRef.current) return min;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    return Math.round(raw / step) * step;
  }, [min, max, step]);

  const startDrag = (which: 'min' | 'max') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const getClientX = (ev: MouseEvent | TouchEvent) =>
      'touches' in ev ? ev.touches[0].clientX : ev.clientX;
    const onMove = (ev: MouseEvent | TouchEvent) => {
      const val = getValueFromX(getClientX(ev));
      if (which === 'min') {
        onChange([Math.min(val, values[1] - step), values[1]]);
      } else {
        onChange([values[0], Math.max(val, values[0] + step)]);
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove as EventListener);
    window.addEventListener('touchend', onUp);
  };

  const minPct = getPercent(values[0]);
  const maxPct = getPercent(values[1]);

  return (
    <div className="w-full">
      <div dir="rtl" className="flex items-center gap-2 mb-2">
        <div className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-center text-xs font-medium text-gray-700 bg-white">
          {formatLabel(values[1])}
        </div>
        <span className="text-gray-400 text-xs">—</span>
        <div className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-center text-xs font-medium text-gray-700 bg-white">
          {formatLabel(values[0])}
        </div>
      </div>
      <div dir="ltr" className="px-3">
        <div ref={trackRef} className="relative h-1 bg-gray-300 rounded-full">
          <div
            className="absolute h-1 bg-gray-800 rounded-full"
            style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
          />
          <div
            className="absolute flex items-center justify-center w-7 h-7 bg-white border border-gray-300 rounded-full shadow cursor-grab select-none"
            style={{ left: `${minPct}%`, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}
            onMouseDown={startDrag('min')}
            onTouchStart={startDrag('min')}
          >
            <div className="flex gap-0.5">
              <div className="w-0.5 h-2.5 bg-gray-400 rounded-full" />
              <div className="w-0.5 h-2.5 bg-gray-400 rounded-full" />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center w-7 h-7 bg-white border border-gray-300 rounded-full shadow cursor-grab select-none"
            style={{ left: `${maxPct}%`, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}
            onMouseDown={startDrag('max')}
            onTouchStart={startDrag('max')}
          >
            <div className="flex gap-0.5">
              <div className="w-0.5 h-2.5 bg-gray-400 rounded-full" />
              <div className="w-0.5 h-2.5 bg-gray-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Multi-Select Dropdown ───────────────────────────────────────────────────

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  icon?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const toggleOption = (option: string) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
    setIsOpen(true);
    closeTimerRef.current = setTimeout(() => setIsOpen(false), 3000);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues.length} נבחרו`;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-right flex items-center justify-between transition-all hover:shadow-sm ${
          selectedValues.length > 0 ? 'border-[#3366FF] bg-blue-50' : 'border-gray-300'
        }`}
      >
        <span className={`flex items-center gap-1.5 ${selectedValues.length === 0 ? 'text-gray-500' : 'text-[#3366FF] font-medium'}`}>
          {icon && <span className="text-sm">{icon}</span>}
          <span className="truncate">{getDisplayText()}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
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
              {selectedValues.includes(option) && <Check className="w-3.5 h-3.5 text-[#3366FF] flex-shrink-0" />}
            </button>
          ))}
          {selectedValues.length > 0 && (
            <div className="border-t border-gray-200">
              <button
                type="button"
                onClick={() => { onChange([]); setIsOpen(false); }}
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

// ─── Single Select Dropdown ──────────────────────────────────────────────────

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-right flex items-center justify-between transition-all hover:shadow-sm ${
          selectedValue ? 'border-[#3366FF] bg-blue-50' : 'border-gray-300'
        }`}
      >
        <span className={`flex items-center gap-1.5 ${!selectedValue ? 'text-gray-500' : 'text-[#3366FF] font-medium'}`}>
          {icon && <span className="text-sm">{icon}</span>}
          <span className="truncate">{selectedValue || placeholder}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(''); setIsOpen(false); }}
            className="w-full px-3 py-2 text-sm text-right hover:bg-gray-50 text-gray-500"
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => { onChange(option); setIsOpen(false); }}
              className="w-full px-3 py-2 text-sm text-right hover:bg-gray-50 flex items-center justify-between"
            >
              <span className="truncate">{option}</span>
              {selectedValue === option && <Check className="w-3.5 h-3.5 text-[#3366FF] flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Neighborhood Autocomplete ───────────────────────────────────────────────

interface NeighborhoodAutocompleteProps {
  neighborhoods: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

const NeighborhoodAutocomplete: React.FC<NeighborhoodAutocompleteProps> = ({
  neighborhoods,
  selectedValues,
  onChange
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const term = inputValue.trim();
    const available = neighborhoods.filter(n => !selectedValues.includes(n));
    if (!term) return available.slice(0, 15);
    return available.filter(n => n.includes(term)).slice(0, 15);
  }, [inputValue, neighborhoods, selectedValues]);

  const addNeighborhood = (n: string) => {
    onChange([...selectedValues, n]);
    setInputValue('');
    setIsOpen(false);
  };

  const hasSelection = selectedValues.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex flex-wrap items-center gap-1 min-h-[38px] px-2 py-1 border rounded-lg bg-white cursor-text transition-all ${
          hasSelection ? 'border-[#3366FF] bg-blue-50' : 'border-gray-300 hover:shadow-sm'
        }`}
        onClick={() => setIsOpen(true)}
      >
        {selectedValues.map(v => (
          <span key={v} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
            {v}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(selectedValues.filter(x => x !== v)); }}
              className="text-blue-600 hover:text-blue-900 leading-none"
            >×</button>
          </span>
        ))}
        <input
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={hasSelection ? '' : '🏘️ חפש שכונה...'}
          className="flex-1 min-w-[60px] outline-none bg-transparent text-sm text-right placeholder-gray-400"
          dir="rtl"
        />
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {filteredOptions.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => addNeighborhood(n)}
              className="w-full px-3 py-2 text-sm text-right hover:bg-gray-50"
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Rooms Quick Picker ──────────────────────────────────────────────────────

const ROOM_OPTIONS = [
  { label: '2', min: 2, max: 2 },
  { label: '3', min: 3, max: 3 },
  { label: '4', min: 4, max: 4 },
  { label: '5', min: 5, max: 5 },
  { label: '6+', min: 6, max: 10 },
];

const RoomsQuickPicker: React.FC<{
  roomsRange: [number, number];
  onChange: (range: [number, number]) => void;
}> = ({ roomsRange, onChange }) => {
  const isActive = (opt: typeof ROOM_OPTIONS[0]) =>
    roomsRange[0] === opt.min && roomsRange[1] === opt.max;
  const isDefault = roomsRange[0] === 1 && roomsRange[1] === 10;

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1.5">🛏️ חדרים</p>
      <div className="flex gap-1 flex-wrap items-center">
        {ROOM_OPTIONS.map(opt => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(isActive(opt) ? [1, 10] : [opt.min, opt.max])}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isActive(opt)
                ? 'bg-[#3366FF] text-white border-[#3366FF]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#3366FF] hover:text-[#3366FF]'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange([1, 10])}
            className="text-gray-400 hover:text-red-500 text-xs px-1"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Floor Quick Picker ──────────────────────────────────────────────────────

const FLOOR_OPTIONS = [
  { label: 'קרקע', min: 0, max: 0 },
  { label: '1', min: 1, max: 1 },
  { label: '2', min: 2, max: 2 },
  { label: '3+', min: 3, max: 100 },
];

const FloorFilter: React.FC<{
  floorRange: [number, number];
  onChange: (range: [number, number]) => void;
}> = ({ floorRange, onChange }) => {
  const isActive = (opt: typeof FLOOR_OPTIONS[0]) =>
    floorRange[0] === opt.min && floorRange[1] === opt.max;
  const isDefault = floorRange[0] === 0 && floorRange[1] === 100;

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1.5">🏢 קומה</p>
      <div className="flex gap-1 flex-wrap items-center">
        {FLOOR_OPTIONS.map(opt => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(isActive(opt) ? [0, 100] : [opt.min, opt.max])}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isActive(opt)
                ? 'bg-[#3366FF] text-white border-[#3366FF]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#3366FF] hover:text-[#3366FF]'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange([0, 100])}
            className="text-gray-400 hover:text-red-500 text-xs px-1"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main FilterPanel ────────────────────────────────────────────────────────

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  cities,
  neighborhoods,
  propertyTypes,
  statuses,
}) => {
  const handleInputChange = (field: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchText: '',
      עיר: [],
      שכונה: [],
      מספר_חדרים: [],
      סוג_נכס: [],
      סטטוס: 'דירה בשיווק',
      מגייס: '',
      פרויקט: [],
      priceRange: [0, 20000000],
      roomsRange: [1, 10],
      floorRange: [0, 100],
      areaRange: [0, 700],
    });
  };

  const sortedCities = useMemo(() => {
    const prioritized = PRIORITY_CITIES.filter(c => cities.includes(c));
    const rest = cities.filter(c => !PRIORITY_CITIES.includes(c));
    return [...prioritized, ...rest];
  }, [cities]);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.עיר.length > 0) count++;
    if (filters.שכונה.length > 0) count++;
    if (filters.סוג_נכס.length > 0) count++;
    if (filters.פרויקט?.length > 0) count++;
    if (filters.סטטוס && filters.סטטוס !== 'דירה בשיווק') count++;
    if (filters.מגייס) count++;
    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 20000000)) count++;
    if (filters.roomsRange && (filters.roomsRange[0] > 1 || filters.roomsRange[1] < 10)) count++;
    if (filters.floorRange && (filters.floorRange[0] > 0 || filters.floorRange[1] < 100)) count++;
    if (filters.areaRange && (filters.areaRange[0] > 0 || filters.areaRange[1] < 700)) count++;
    return count;
  };

  const priceMin = filters.priceRange?.[0] ?? 0;
  const priceMax = filters.priceRange?.[1] ?? 20000000;
  const areaMin = filters.areaRange?.[0] ?? 0;
  const areaMax = filters.areaRange?.[1] ?? 700;

  const formatPriceLabel = useCallback((val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M ₪`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K ₪`;
    return `${val} ₪`;
  }, []);

  const formatAreaLabel = useCallback((val: number) => `${val} מ"ר`, []);

  return (
    <div className="space-y-2 bg-white relative z-20" dir="rtl">
      {/* Row 1: Dropdowns */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4 pt-2">
        {/* City */}
        <MultiSelectDropdown
          label="עיר"
          options={sortedCities}
          selectedValues={filters.עיר}
          onChange={(values) => handleInputChange('עיר', values)}
          placeholder="בחר עיר"
          icon="🏙️"
        />

        {/* Neighborhood autocomplete */}
        <div className="lg:col-span-2">
          <NeighborhoodAutocomplete
            neighborhoods={neighborhoods as string[]}
            selectedValues={filters.שכונה}
            onChange={(values) => handleInputChange('שכונה', values)}
          />
        </div>

        {/* Property Type */}
        <MultiSelectDropdown
          label="סוג נכס"
          options={propertyTypes}
          selectedValues={filters.סוג_נכס}
          onChange={(values) => handleInputChange('סוג_נכס', values)}
          placeholder="סוג נכס"
          icon="🏠"
        />

        {/* Status */}
        <SingleSelectDropdown
          label="סטטוס"
          options={statuses}
          selectedValue={filters.סטטוס}
          onChange={(value) => handleInputChange('סטטוס', value)}
          placeholder="כל הסטטוסים"
          icon="📊"
        />
      </div>

      {/* Row 2: Range filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4 pb-2">
        {/* Rooms quick picker */}
        <RoomsQuickPicker
          roomsRange={filters.roomsRange ?? [1, 10]}
          onChange={(vals) => handleInputChange('roomsRange', vals)}
        />

        {/* Price range */}
        <div className="lg:col-span-2 pb-1">
          <p className="text-xs font-medium text-gray-600 mb-1.5">💰 טווח מחירים</p>
          <RangeSlider
            min={0}
            max={20000000}
            step={100000}
            values={[priceMin, priceMax]}
            onChange={(vals) => handleInputChange('priceRange', vals)}
            formatLabel={formatPriceLabel}
          />
        </div>

        {/* Floor quick picker */}
        <FloorFilter
          floorRange={filters.floorRange ?? [0, 100]}
          onChange={(vals) => handleInputChange('floorRange', vals)}
        />

        {/* Area range */}
        <div className="pb-1">
          <p className="text-xs font-medium text-gray-600 mb-1.5">📐 שטח (מ"ר)</p>
          <RangeSlider
            min={0}
            max={700}
            step={10}
            values={[areaMin, areaMax]}
            onChange={(vals) => handleInputChange('areaRange', vals)}
            formatLabel={formatAreaLabel}
          />
        </div>
      </div>

      {/* Active filters bar */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex items-center justify-between bg-blue-50 mx-4 mb-2 px-3 py-2 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-800">
            {getActiveFiltersCount()} פילטרים פעילים
          </span>
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 transition-colors rounded-lg text-sm font-medium"
          >
            <X className="w-3.5 h-3.5" />
            נקה הכל
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
