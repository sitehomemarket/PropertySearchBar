import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Property } from './types/Property';
import { FilterState } from './types/Property';
import { useProperties } from './hooks/useProperties';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import FilterButtons from './components/FilterButtons';
import PropertyCard from './components/PropertyCard';
import PropertyTable from './components/PropertyTable';
import MapView from './components/MapView';
import HybridView from './components/HybridView';
import ViewToggle from './components/ViewToggle';
import ClientSelectionPanel from './components/ClientSelectionPanel';
import AdminPanel from './components/AdminPanel';
import PropertyDetailPage from './components/PropertyDetailPage';
import { Loader, Filter } from 'lucide-react';

const initialFilters: FilterState = {
  searchText: '',
  עיר: [],
  שכונה: [],
  מספר_חדרים: [],
  סוג_נכס: [],
  סטטוס: '',
  מגייס: '',
  פרויקט: [],
};

const App: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [filtersEnabled, setFiltersEnabled] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map' | 'hybrid'>('hybrid');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [polygonFilteredProperties, setPolygonFilteredProperties] = useState<Property[]>([]);
  const [hasPolygonFilter, setHasPolygonFilter] = useState(false);

  // Debug state for showing neighborhood values
  const [showNeighborhoodDebug, setShowNeighborhoodDebug] = useState(false);

  const {
    properties,
    loading,
    error,
    fetchProperties,
    toggleFeatured,
    toggleSelectedForClient,
    clearClientSelections,
    selectedProperties,
    filterOptions,
    filteredProperties,
    lastSyncTime,
    autoSyncEnabled,
    toggleAutoSync
  } = useProperties();

  // Manual sync event listener
  useEffect(() => {
    const handleManualSync = () => {
      console.log('🔄 Manual sync triggered');
      fetchProperties();
    };

    window.addEventListener('manualSync', handleManualSync);
    return () => window.removeEventListener('manualSync', handleManualSync);
  }, [fetchProperties]);

  // Optimized displayed properties calculation
  const displayedProperties = useMemo(() => {
    // If there's an active polygon filter, use those properties, otherwise use regular filtered properties
    const baseProperties = hasPolygonFilter ? polygonFilteredProperties : filteredProperties(filters);
    
    // Optimized sorting
    return [...baseProperties].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      if (a.lastUpdated && b.lastUpdated) {
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      }
      
      if (a.rowIndex && b.rowIndex) {
        return a.rowIndex - b.rowIndex;
      }
      
      return 0;
    });
  }, [filteredProperties, filters, polygonFilteredProperties, hasPolygonFilter]);

  // Handle polygon filter changes from map
  const handleMapBoundsChange = useCallback((filteredProps: Property[]) => {
    setPolygonFilteredProperties(filteredProps);
    setHasPolygonFilter(filteredProps.length !== properties.length);
  }, [properties.length]);

  // Clear polygon filter completely
  const handleClearPolygonFilter = useCallback(() => {
    setPolygonFilteredProperties([]);
    setHasPolygonFilter(false);
  }, []);

  // Memoized featured count
  const featuredCount = useMemo(() => {
    return properties.filter(p => p.featured).length;
  }, [properties]);

  // Optimized neighborhoods calculation
  const availableNeighborhoods = useMemo(() => {
    if (!Array.isArray(filters.עיר) || filters.עיר.length === 0) return filterOptions.neighborhoods;
    
    const neighborhoodSet = new Set();
    properties.forEach(p => {
      if (filters.עיר.includes(p.עיר)) {
        neighborhoodSet.add(p.שכונה);
      }
    });
    
    return Array.from(neighborhoodSet).sort();
  }, [filters.עיר, filterOptions.neighborhoods, properties]);

  // Optimized filter change handler
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    // Reset neighborhood if city changed
    if (Array.isArray(newFilters.עיר) && Array.isArray(filters.עיר) && 
        JSON.stringify(newFilters.עיר) !== JSON.stringify(filters.עיר)) {
      newFilters.שכונה = [];
    }
    console.log('🔄 Filters changed:', newFilters);
    setFilters(newFilters);
  }, [filters.עיר]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">שגיאה בטעינת הנכסים</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="text-sm text-gray-500 mb-4">
            <p>נסה לבדוק:</p>
            <ul className="list-disc list-inside mt-2">
              <li>החיבור לאינטרנט</li>
              <li>שהגיליון זמין לצפייה ציבורית</li>
              <li>שמפתח ה-API תקין (אם מוגדר)</li>
            </ul>
          </div>
          <button
            onClick={fetchProperties}
            className="px-4 py-2 bg-[#3366FF] text-white rounded-lg hover:bg-[#2952CC] transition-colors"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header autoSyncEnabled={autoSyncEnabled} lastSyncTime={lastSyncTime} />
      
      <main className="h-[calc(100vh-64px)] flex flex-col">
        {/* Filters Section */}
        {filtersEnabled && (
          <div className="bg-white border-b border-gray-200 px-4 py-1 flex-shrink-0 relative z-20" style={{ maxHeight: '15vh' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <h2 className="text-xs font-bold text-[#222222]">
                  נמצאו {displayedProperties.length} נכסים
                </h2>
              </div>
              
              <div className="flex items-center gap-4">
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                
              </div>
            </div>

            {!filtersCollapsed && (
              <FilterPanel
                filters={filters}
                onFiltersChange={handleFiltersChange}
                cities={filterOptions.cities}
                neighborhoods={availableNeighborhoods}
                propertyTypes={filterOptions.propertyTypes}
                agents={filterOptions.agents}
                projects={filterOptions.projects}
                statuses={filterOptions.statuses}
                properties={properties}
                isCollapsed={false}
                onToggleCollapse={() => {}}
              />
            )}
          </div>
        )}

        {/* Main Content Area */}
        {/* Debug Panel for Neighborhoods */}
        {showNeighborhoodDebug && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">
              🏘️ כל ערכי השכונות בפילטר ({filterOptions.neighborhoods.length} שכונות)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {filterOptions.neighborhoods.map((neighborhood, index) => (
                <div
                  key={index}
                  className="bg-white p-2 rounded border text-sm"
                >
                  <span className="text-gray-500 text-xs">{index + 1}.</span> {neighborhood}
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-yellow-700">
              💡 לחץ על "הסתר שכונות" כדי לסגור את הרשימה
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative">
          <div className="h-full">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-[#3366FF]" />
                <span className="mr-2 text-[#222222]">טוען נכסים...</span>
              </div>
            ) : (
              <div className="h-full">
                {viewMode === 'grid' && (
                  <div className="h-full overflow-y-auto p-6 pt-4 bg-gray-50">
                    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                      {displayedProperties.map((property) => (
                        <div key={property.id} id={`property-${property.id}`} className="break-inside-avoid mb-6">
                          <PropertyCard
                            property={property}
                            onToggleFeatured={toggleFeatured}
                            onToggleSelectedForClient={toggleSelectedForClient}
                            isAdmin={isAdmin}
                            onViewDetails={() => setSelectedProperty(property)}
                          />
                        </div>
                      ))}
                    </div>

                    {displayedProperties.length === 0 && (
                      <div className="text-center py-12">
                        <h3 className="text-xl font-semibold text-[#222222] mb-2">לא נמצאו נכסים</h3>
                        <p className="text-gray-600 mb-4">נסה לשנות את המסננים כדי לראות יותר תוצאות</p>
                        <button
                          onClick={() => setFilters(initialFilters)}
                          className="px-4 py-2 bg-[#3366FF] text-white rounded-lg hover:bg-[#2952CC] transition-colors"
                        >
                          נקה את כל המסננים
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {viewMode === 'table' && (
                  <div className="h-full overflow-hidden pt-2">
                    <PropertyTable
                      properties={displayedProperties}
                      onToggleFeatured={toggleFeatured}
                      onToggleSelectedForClient={toggleSelectedForClient}
                      isAdmin={isAdmin}
                      onViewDetails={setSelectedProperty}
                    />
                  </div>
                )}

                {viewMode === 'hybrid' && (
                  <div className="h-full">
                    <HybridView
                      properties={displayedProperties}
                      onToggleFeatured={toggleFeatured}
                      onToggleSelectedForClient={toggleSelectedForClient}
                      isAdmin={isAdmin}
                      onViewDetails={setSelectedProperty}
                      onMapBoundsChange={handleMapBoundsChange}
                      onClearPolygonFilter={handleClearPolygonFilter}
                    />
                  </div>
                )}
                {viewMode === 'map' && (
                  <div className="h-full pt-2">
                    <MapView
                      properties={displayedProperties}
                      onToggleFeatured={toggleFeatured}
                      onToggleSelectedForClient={toggleSelectedForClient}
                      isAdmin={isAdmin}
                      onViewDetails={setSelectedProperty}
                      onMapBoundsChange={handleMapBoundsChange}
                      onClearPolygonFilter={handleClearPolygonFilter}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {isAdmin && (
        <AdminPanel
          onRefreshData={fetchProperties}
          isLoading={loading}
          filtersEnabled={filtersEnabled}
          onToggleFilters={() => setFiltersEnabled(!filtersEnabled)}
          featuredCount={featuredCount}
          lastSyncTime={lastSyncTime}
          autoSyncEnabled={autoSyncEnabled}
          onToggleAutoSync={toggleAutoSync}
        />
      )}

      <ClientSelectionPanel
        selectedProperties={selectedProperties}
        onClearSelections={clearClientSelections}
      />

      {selectedProperty && (
        <PropertyDetailPage
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onToggleFeatured={toggleFeatured}
          onToggleSelectedForClient={toggleSelectedForClient}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default App;