import React, { useState, useRef, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

interface BudgetSliderProps {
  minValue: number;
  maxValue: number;
  currentMin: number;
  currentMax: number;
  onChange: (min: number, max: number) => void;
  step?: number;
}

const BudgetSlider: React.FC<BudgetSliderProps> = ({
  minValue,
  maxValue,
  currentMin,
  currentMax,
  onChange,
  step = 50000
}) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M ₪`;
    }
    return `${(price / 1000).toFixed(0)}K ₪`;
  };

  const getPercentage = (value: number) => {
    return ((value - minValue) / (maxValue - minValue)) * 100;
  };

  const getValueFromPercentage = (percentage: number) => {
    const value = minValue + (percentage / 100) * (maxValue - minValue);
    return Math.round(value / step) * step;
  };

  const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newValue = getValueFromPercentage(percentage);

    if (isDragging === 'min') {
      const newMin = Math.min(newValue, currentMax - step);
      onChange(Math.max(minValue, newMin), currentMax);
    } else {
      const newMax = Math.max(newValue, currentMin + step);
      onChange(currentMin, Math.min(maxValue, newMax));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, currentMin, currentMax]);

  const minPercentage = getPercentage(currentMin);
  const maxPercentage = getPercentage(currentMax);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#3366FF]" />
          <span className="text-lg font-semibold text-[#222222]">טווח תקציב</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-[#3366FF] bg-blue-50 px-3 py-2 rounded-full">
          <span>{formatPrice(currentMin)}</span>
          <span>-</span>
          <span>{formatPrice(currentMax)}</span>
        </div>
      </div>

      <div className="relative mb-4">
        {/* Track */}
        <div
          ref={sliderRef}
          className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
        >
          {/* Active range */}
          <div
            className="absolute h-2 bg-gradient-to-r from-[#3366FF] to-[#2952CC] rounded-full"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`
            }}
          />

          {/* Min handle */}
          <div
            className={`absolute w-5 h-5 bg-white border-3 border-[#3366FF] rounded-full cursor-grab transform -translate-x-1/2 -translate-y-1/2 top-1/2 shadow-lg transition-all duration-200 ${
              isDragging === 'min' ? 'scale-125 cursor-grabbing shadow-xl' : 'hover:scale-110'
            }`}
            style={{ left: `${minPercentage}%` }}
            onMouseDown={handleMouseDown('min')}
          >
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
              <div className="bg-[#222222] text-white px-2 py-1 rounded text-sm font-medium whitespace-nowrap">
                {formatPrice(currentMin)}
              </div>
              <div className="w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-[#222222] mx-auto"></div>
            </div>
          </div>

          {/* Max handle */}
          <div
            className={`absolute w-5 h-5 bg-white border-3 border-[#3366FF] rounded-full cursor-grab transform -translate-x-1/2 -translate-y-1/2 top-1/2 shadow-lg transition-all duration-200 ${
              isDragging === 'max' ? 'scale-125 cursor-grabbing shadow-xl' : 'hover:scale-110'
            }`}
            style={{ left: `${maxPercentage}%` }}
            onMouseDown={handleMouseDown('max')}
          >
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
              <div className="bg-[#222222] text-white px-2 py-1 rounded text-sm font-medium whitespace-nowrap">
                {formatPrice(currentMax)}
              </div>
              <div className="w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-[#222222] mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Price markers */}
        <div className="flex justify-between mt-2 text-sm text-gray-600 font-medium">
          <span>{formatPrice(minValue)}</span>
          <span>{formatPrice(minValue + (maxValue - minValue) * 0.25)}</span>
          <span>{formatPrice(minValue + (maxValue - minValue) * 0.5)}</span>
          <span>{formatPrice(minValue + (maxValue - minValue) * 0.75)}</span>
          <span>{formatPrice(maxValue)}</span>
        </div>
      </div>

      {/* Quick preset buttons */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        {[
          { label: '3-4M', min: 3000000, max: 4000000 },
          { label: '4-5M', min: 4000000, max: 5000000 },
          { label: '5-7M', min: 5000000, max: 7000000 },
          { label: '7M+', min: 7000000, max: maxValue }
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => onChange(preset.min, preset.max)}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
              currentMin === preset.min && currentMax === preset.max
                ? 'bg-[#3366FF] text-white border-[#3366FF] shadow-lg transform scale-105'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#3366FF] hover:text-[#3366FF] hover:shadow-md hover:transform hover:scale-105'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BudgetSlider;