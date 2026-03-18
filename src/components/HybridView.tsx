import React, { useState, useEffect, useRef } from 'react';
import { Property } from '../types/Property';
import PropertyCard from './PropertyCard';
import MapView from './MapView';
import { ChevronLeft, ChevronRight, Map, Grid3X3, Layout, Target } from 'lucide-react';

interface HybridViewProps {
  properties: Property[];
  onToggleFeatured?: (id: string) => void;
  onToggleSelectedForClient?: (id: string) => void;
  isAdmin?: boolean;
  onViewDetails?: (property: Property) => void;
  onMapBoundsChange?: (properties: Property[]) => void;
  onClearPolygonFilter?: () => void;
}

const HybridView: React.FC<HybridViewProps> = ({
  properties,
  onToggleFeatured,
  onToggleSelectedForClient,
  isAdmin = false,
  onViewDetails,
  onMapBoundsChange,
  onClearPolygonFilter
}) => {
  const [mapWidth, setMapWidth] = useState(50); // אחוז רוחב המפה
  const [isDragging, setIsDragging] = useState(false);
  const [isMapCollapsed, setIsMapCollapsed] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [mapFilteredProperties, setMapFilteredProperties] = useState<Property[]>([]);
  const [hasMapFilter, setHasMapFilter] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);

  // Handle resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newMapWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // הגבל את הרוחב בין 20% ל-80%
    const clampedWidth = Math.max(20, Math.min(80, newMapWidth));
    setMapWidth(clampedWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
  }, [isDragging]);

  // Quick resize presets
  const setMapSize = (width: number) => {
    setMapWidth(width);
    setIsMapCollapsed(false);
  };

  const toggleMapCollapse = () => {
    setIsMapCollapsed(!isMapCollapsed);
  };

  // Handle map bounds change for sync
  const handleMapBoundsChange = (filteredProps: Property[]) => {
    if (syncEnabled) {
      setMapFilteredProperties(filteredProps);
      setHasMapFilter(filteredProps.length !== properties.length);
      console.log(`🔄 Map sync: ${filteredProps.length}/${properties.length} properties visible`);
    }
    onMapBoundsChange?.(filteredProps);
  };

  // Handle clear polygon filter
  const handleClearPolygonFilter = () => {
    setMapFilteredProperties([]);
    setHasMapFilter(false);
    onClearPolygonFilter?.();
  };

  // Determine which properties to show in grid
  const displayedProperties = syncEnabled && hasMapFilter ? mapFilteredProperties : properties;

  return (
    <div className="h-full bg-gray-50">
      {/* Control Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
            <Layout className="w-5 h-5 text-[#3366FF]" />
            תצוגה משולבת
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {displayedProperties.length} נכסים
              {hasMapFilter && syncEnabled && (
                <span className="text-blue-600 font-medium"> (מסונן לפי מפה)</span>
              )}
            </span>
            {hasMapFilter && syncEnabled && (
              <button
                onClick={handleClearPolygonFilter}
                className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 transition-colors"
              >
                נקה פילטר מפה
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Sync toggle */}
          <button
            onClick={() => setSyncEnabled(!syncEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              syncEnabled 
                ? 'bg-[#3366FF] text-white hover:bg-[#2952CC]' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={syncEnabled ? 'בטל סנכרון מפה-קוביות' : 'הפעל סנכרון מפה-קוביות'}
          >
            <Target className="w-4 h-4" />
            {syncEnabled ? 'מסונכרן' : 'לא מסונכרן'}
          </button>
          
          {/* Quick resize buttons */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMapSize(25)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                Math.abs(mapWidth - 25) < 5 ? 'bg-[#3366FF] text-white' : 'text-gray-600 hover:bg-white'
              }`}
            >
              מפה קטנה
            </button>
            <button
              onClick={() => setMapSize(50)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                Math.abs(mapWidth - 50) < 5 ? 'bg-[#3366FF] text-white' : 'text-gray-600 hover:bg-white'
              }`}
            >
              שווה
            </button>
            <button
              onClick={() => setMapSize(75)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                Math.abs(mapWidth - 75) < 5 ? 'bg-[#3366FF] text-white' : 'text-gray-600 hover:bg-white'
              }`}
            >
              מפה גדולה
            </button>
          </div>
          
          <button
            onClick={toggleMapCollapse}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            {isMapCollapsed ? (
              <>
                <Map className="w-4 h-4" />
                הצג מפה
              </>
            ) : (
              <>
                <Grid3X3 className="w-4 h-4" />
                הסתר מפה
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div 
        ref={containerRef}
        className="h-[calc(100%-64px)] flex relative"
      >
        {/* Properties Section - עכשיו משמאל */}
        <div 
          className="bg-gray-50 overflow-y-auto transition-all duration-300 ease-in-out"
          style={{ width: isMapCollapsed ? '100%' : `${100 - mapWidth}%` }}
        >
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {displayedProperties.map((property) => (
                <div key={property.id}>
                  <PropertyCard
                    property={property}
                    onToggleFeatured={onToggleFeatured}
                    onToggleSelectedForClient={onToggleSelectedForClient}
                    isAdmin={isAdmin}
                    onViewDetails={() => onViewDetails?.(property)}
                  />
                </div>
              ))}
            </div>

            {displayedProperties.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-[#222222] mb-2">
                  {hasMapFilter ? 'לא נמצאו נכסים באזור שצוירת' : 'לא נמצאו נכסים'}
                </h3>
                <p className="text-gray-600">
                  {hasMapFilter 
                    ? 'נסה לצייר אזור גדול יותר במפה או לנקות את הפילטר' 
                    : 'נסה לשנות את המסננים כדי לראות יותר תוצאות'
                  }
                </p>
                {hasMapFilter && (
                  <button
                    onClick={handleClearPolygonFilter}
                    className="mt-4 px-4 py-2 bg-[#3366FF] text-white rounded-lg hover:bg-[#2952CC] transition-colors"
                  >
                    נקה פילטר מפה
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resizer */}
        {!isMapCollapsed && (
          <div
            ref={resizerRef}
            className={`w-1 bg-gray-300 hover:bg-[#3366FF] cursor-col-resize transition-colors relative group ${
              isDragging ? 'bg-[#3366FF]' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-4 bg-gray-400 rounded"></div>
                <div className="w-0.5 h-4 bg-gray-400 rounded"></div>
              </div>
            </div>
          </div>
        )}

        {/* Map Section - עכשיו מימין */}
        {!isMapCollapsed && (
          <div 
            className="bg-white border-r border-gray-200 transition-all duration-300 ease-in-out"
            style={{ width: `${mapWidth}%` }}
          >
            <MapView
              properties={properties}
              onToggleFeatured={onToggleFeatured}
              onToggleSelectedForClient={onToggleSelectedForClient}
              isAdmin={isAdmin}
              onViewDetails={onViewDetails}
              onMapBoundsChange={handleMapBoundsChange}
              onClearPolygonFilter={handleClearPolygonFilter}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HybridView;