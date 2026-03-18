import React, { useState, memo, useMemo } from 'react';
import { Property } from '../types/Property';
import { MapPin, Home, Maximize, Building, Phone, FileText, Star, Car, TreePine, Heart, ChevronUp, ChevronDown, ExternalLink, Award, TrendingDown, Flame, Calendar, Calculator as Elevator, Package } from 'lucide-react';
import { calculatePricePerEquivalentSqm, calculateNeighborhoodAverage, formatPricePerSqm } from '../utils/priceCalculations';

interface PropertyTableProps {
  properties: Property[];
  onToggleFeatured?: (id: string) => void;
  onToggleSelectedForClient?: (id: string) => void;
  isAdmin?: boolean;
  onViewDetails?: (property: Property) => void;
}

const PropertyTable: React.FC<PropertyTableProps> = memo(({ 
  properties, 
  onToggleFeatured, 
  onToggleSelectedForClient,
  isAdmin = false,
  onViewDetails
}) => {
  const [compactView, setCompactView] = useState(false);
  const [stickyColumns, setStickyColumns] = useState(true);

  // Optimized sorting with memoization
  const sortedProperties = useMemo(() => {
    const startTime = performance.now();
    
    return [...properties].sort((a, b) => {
      // Featured properties first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      // Sort by price per equivalent sqm (cheapest first)
      const pricePerSqmA = calculatePricePerEquivalentSqm(a);
      const pricePerSqmB = calculatePricePerEquivalentSqm(b);
      
      // If one is 0 (no price or area), put it at the end
      if (pricePerSqmA === 0 && pricePerSqmB === 0) {
        // If both are 0, sort by update time
        if (a.lastUpdated && b.lastUpdated) {
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        }
        return 0;
      }
      if (pricePerSqmA === 0) return 1;
      if (pricePerSqmB === 0) return -1;
      
      // Sort by price per sqm - cheapest first
      return pricePerSqmA - pricePerSqmB;
    });
    
    const endTime = performance.now();
    console.log(`⚡ Sort time: ${Math.round(endTime - startTime)}ms`);
    return sortedProperties;
  }, [properties]);

  // Memoized formatters for better performance
  const formatPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return (price: number) => formatter.format(price);
  }, []);

  const getStatusColor = useMemo(() => {
    const colorMap = {
      'זמין': 'bg-green-100 text-green-800 border-green-200',
      'נמכר': 'bg-red-100 text-red-800 border-red-200',
      'שמור': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'בבנייה': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return (status: string) => colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  const getDealTypeColor = useMemo(() => {
    const colorMap = {
      'מכירה': 'bg-blue-100 text-blue-800 border-blue-200',
      'השכרה': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return (dealType: string) => colorMap[dealType] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  // Virtualization for large datasets
  const visibleProperties = useMemo(() => {
    // Only render first 100 properties for initial load, then load more on scroll
    return sortedProperties.slice(0, 100);
  }, [sortedProperties]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Table Controls */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#222222]">טבלת נכסים</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setStickyColumns(!stickyColumns)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              stickyColumns 
                ? 'bg-[#3366FF] text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {stickyColumns ? 'בטל עמודות קבועות' : 'עמודות קבועות'}
          </button>
          <button
            onClick={() => setCompactView(!compactView)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              compactView 
                ? 'bg-[#3366FF] text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {compactView ? 'תצוגה מלאה' : 'תצוגה קומפקטית'}
          </button>
          <span className="text-sm text-gray-500">
            {properties.length} נכסים
          </span>
        </div>
      </div>

      {/* Table Container with improved scrolling */}
      <div className="relative">
        <div className="overflow-x-auto overflow-y-visible" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <div className="min-w-full" style={{ minWidth: compactView ? '1200px' : '1800px' }}>
        <table className={`w-full ${compactView ? 'text-xs' : 'text-sm'}`}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {isAdmin && (
                <th className={`${stickyColumns ? 'sticky right-0 bg-gray-50 z-10' : ''} px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${compactView ? 'w-8' : 'px-4'}`}>
                  מומלץ
                </th>
              )}
              <th className={`${stickyColumns ? 'sticky right-0 bg-gray-50 z-10' : ''} px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${compactView ? 'w-8' : 'px-4'} ${isAdmin ? 'right-12' : 'right-0'}`}>
                ללקוח
              </th>
              <th className={`${stickyColumns ? 'sticky bg-gray-50 z-10' : ''} px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${compactView ? 'w-16' : 'px-4'} ${isAdmin ? 'right-20' : 'right-8'}`} style={{ right: stickyColumns ? (isAdmin ? '80px' : '40px') : 'auto' }}>
                תמונה
              </th>
              <th className={`${stickyColumns ? 'sticky bg-gray-50 z-10' : ''} px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${compactView ? 'w-32 max-w-[150px]' : 'w-48 max-w-[200px]'}`} style={{ right: stickyColumns ? (isAdmin ? '144px' : '104px') : 'auto' }}>
                מיקום
              </th>
              <th className={`px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${compactView ? 'w-20' : 'px-4'}`}>
                מחיר
              </th>
              <th className={`px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${compactView ? 'w-12' : 'px-4'}`}>
                חדרים
              </th>
              <th className={`px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${compactView ? 'w-16' : 'px-4'}`}>
                שטח
              </th>
              <th className={`px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${compactView ? 'w-20' : 'px-4'}`}>
                מחיר/מ"ר אקווי
              </th>
              {!compactView && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  מרפסת
                </th>
              )}
              <th className={`px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${compactView ? 'w-12' : 'px-4'}`}>
                קומה
              </th>
              {!compactView && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  חניות
                </th>
              )}
              {!compactView && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  נוספים
                </th>
              )}
              <th className={`px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${compactView ? 'w-20' : 'px-4'}`}>
                מגייס
              </th>
              <th className={`${stickyColumns ? 'sticky left-0 bg-gray-50 z-10' : ''} px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${compactView ? 'w-24' : 'px-4'}`}>
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleProperties.map((property) => (
              <tr key={property.id} className={`hover:bg-gray-50 ${property.featured ? 'bg-yellow-50' : ''}`}>
                {isAdmin && (
                  <td className={`${stickyColumns ? 'sticky right-0 bg-white z-10' : ''} px-2 py-2 whitespace-nowrap ${compactView ? 'py-1' : 'py-4'}`}>
                    <button
                      onClick={() => onToggleFeatured?.(property.id)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Star className={`${compactView ? 'w-3 h-3' : 'w-4 h-4'} ${property.featured ? 'text-[#F4E851] fill-current' : 'text-gray-400'}`} />
                    </button>
                  </td>
                )}
                <td className={`${stickyColumns ? 'sticky bg-white z-10' : ''} px-2 py-2 whitespace-nowrap ${compactView ? 'py-1' : 'py-4'}`} style={{ right: stickyColumns ? (isAdmin ? '48px' : '0px') : 'auto' }}>
                  <button
                    onClick={() => onToggleSelectedForClient?.(property.id)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    title={property.selectedForClient ? 'הסר מרשימת הלקוח' : 'הוסף לרשימת הלקוח'}
                  >
                    <Heart className={`${compactView ? 'w-3 h-3' : 'w-4 h-4'} ${property.selectedForClient ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                  </button>
                </td>
                <td className={`${stickyColumns ? 'sticky bg-white z-10' : ''} px-2 py-2 whitespace-nowrap ${compactView ? 'py-1' : 'py-4'}`} style={{ right: stickyColumns ? (isAdmin ? '96px' : '48px') : 'auto' }}>
                  <div className={`${compactView ? 'w-12 h-8' : 'w-16 h-12'} bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center`}>
                    <img
                      src={property.תמונה_נכס_ראשית}
                      alt={property.שם_הנכס_שיוצג_באתר || 'תמונת נכס'}
                      className="w-full h-full object-cover"
                      style={{ display: 'block' }}
                      loading="lazy"
                      onLoad={() => {
                        if (property.id === '2') {
                          console.log(`✅ תמונה בטבלה נטענה לנכס ${property.id}: ${property.תמונה_נכס_ראשית}`);
                        }
                      }}
                      onError={(e) => {
                        if (property.id === '2') {
                          console.log(`❌ שגיאה בטעינת תמונה בטבלה לנכס ${property.id}: ${property.תמונה_נכס_ראשית}`);
                        }
                        const target = e.target as HTMLImageElement;
                        const fallbackImages = [
                          'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800',
                          'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
                          'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
                          'https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg?auto=compress&cs=tinysrgb&w=800'
                        ];
                        
                        const currentIndex = fallbackImages.findIndex(url => url === target.src);
                        const nextIndex = currentIndex + 1;
                        
                        if (nextIndex < fallbackImages.length) {
                          target.src = fallbackImages[nextIndex];
                        } else {
                          target.style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.className = 'w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs';
                          placeholder.textContent = '🏠';
                          target.parentNode?.appendChild(placeholder);
                        }
                      }}
                    />
                  </div>
                </td>
                <td className={`${stickyColumns ? 'sticky bg-white z-10' : ''} px-2 py-2 ${compactView ? 'py-1' : 'py-4'}`} style={{ right: stickyColumns ? (isAdmin ? '160px' : '112px') : 'auto' }}>
                  <div className={`text-[#222222] ${compactView ? 'max-w-[120px] text-xs' : 'max-w-[180px] text-sm'}`}>
                    <div className={`font-medium ${compactView ? 'truncate' : ''}`}>
                      {property.רחוב} {property.מספר_בניין}
                      {property.מספר_דירה && `, דירה ${property.מספר_דירה}`}
                    </div>
                    <div className={`text-gray-500 ${compactView ? 'text-xs truncate' : 'text-xs'}`}>
                      {property.עיר}, {property.שכונה}
                    </div>
                    {!compactView && (
                      <div className="text-xs text-gray-400">{property.סוג_נכס} • {property.פרויקט}</div>
                    )}
                  </div>
                </td>
                <td className={`px-2 py-2 whitespace-nowrap ${compactView ? 'py-1' : 'py-4'}`}>
                  <div className={`font-semibold text-[#3366FF] ${compactView ? 'text-xs' : 'text-sm'}`}>
                    {formatPrice(property.מחיר_מבוקש)}
                  </div>
                </td>
                <td className={`px-2 py-2 whitespace-nowrap ${compactView ? 'py-1' : 'py-4'}`}>
                  <div className={`flex items-center text-[#222222] ${compactView ? 'text-xs' : 'text-sm'}`}>
                    <Home className={`${compactView ? 'w-3 h-3 ml-1' : 'w-4 h-4 ml-1'} text-[#3366FF]`} />
                    {property.מספר_חדרים}
                  </div>
                </td>
                <td className={`px-2 py-2 whitespace-nowrap ${compactView ? 'py-1' : 'py-4'}`}>
                  <div className={`text-[#222222] ${compactView ? 'text-xs' : 'text-sm'}`}>
                    <div className="flex items-center">
                      <Maximize className={`${compactView ? 'w-3 h-3 ml-1' : 'w-4 h-4 ml-1'} text-[#3366FF]`} />
                      {property.שטח_דירה} מ"ר
                    </div>
                    {property.שטח_גינה > 0 && !compactView && (
                      <div className={`text-gray-500 ${compactView ? 'text-xs' : 'text-xs'}`}>
                        גינה: {property.שטח_גינה} מ"ר
                      </div>
                    )}
                    {/* Market Days Badge */}
                    {property.ימים_במרקט !== undefined && property.ימים_במרקט >= 0 && (
                      <div className={`mt-1 ${compactView ? 'text-xs' : 'text-xs'}`}>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-medium ${
                          property.ימים_במרקט <= 3 
                            ? 'bg-green-100 text-green-800 animate-pulse' 
                            : property.ימים_במרקט <= 7
                            ? 'bg-blue-100 text-blue-800'
                            : property.ימים_במרקט <= 30
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {property.ימים_במרקט <= 3 && '🆕'}
                          {property.ימים_במרקט > 3 && property.ימים_במרקט <= 7 && '📅'}
                          {property.ימים_במרקט > 7 && property.ימים_במרקט <= 30 && '📆'}
                          {property.ימים_במרקט > 30 && '⏰'}
                          {property.ימים_במרקט === 0 ? 'חדש!' : `${property.ימים_במרקט} ימים`}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className={`px-2 py-2 whitespace-nowrap ${compactView ? 'py-1' : 'py-4'}`}>
                  <div className={`text-[#3366FF] font-medium ${compactView ? 'text-xs' : 'text-sm'}`}>
                    <div className="flex items-center gap-1">
                      {formatPricePerSqm(calculatePricePerEquivalentSqm(property))}
                      {(() => {
                        const pricePerSqm = calculatePricePerEquivalentSqm(property);
                        if (pricePerSqm === 0) return null;
                        
                        const neighborhoodAvg = calculateNeighborhoodAverage(sortedProperties, property.שכונה);
                        if (neighborhoodAvg === 0) return null;
                        
                        const percentageDiff = ((pricePerSqm - neighborhoodAvg) / neighborhoodAvg) * 100;
                        
                        // Fire icon for properties 5% or more below average
                        if (percentageDiff <= -5) {
                          return (
                            <Flame 
                              className={`${compactView ? 'w-3 h-3' : 'w-4 h-4'} text-orange-500 animate-pulse`}
                              title={`${Math.abs(percentageDiff).toFixed(0)}% cheaper than neighborhood average`}
                            />
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </td>
                {!compactView && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#222222]">
                      {property.שטח_מרפסת > 0 ? (
                        <div className="flex items-center">
                          <Building className="w-4 h-4 ml-1 text-[#3366FF]" />
                          {property.שטח_מרפסת} מ"ר
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">אין</span>
                      )}
                    </div>
                  </td>
                )}
                <td className={`px-2 py-2 whitespace-nowrap ${compactView ? 'py-1' : 'py-4'}`}>
                  <div className={`flex items-center text-[#222222] ${compactView ? 'text-xs' : 'text-sm'}`}>
                    <Building className={`${compactView ? 'w-3 h-3 ml-1' : 'w-4 h-4 ml-1'} text-[#3366FF]`} />
                    {property.קומה}
                  </div>
                </td>
                {!compactView && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#222222]">
                      {property.כמות_חניות > 0 && (
                        <div className="flex items-center">
                          <Car className="w-4 h-4 ml-1 text-[#3366FF]" />
                          {property.כמות_חניות}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">{property.סוג_חניה}</div>
                    </div>
                  </td>
                )}
                {!compactView && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-sm">
                      {property.מעלית === true && (
                        <div className="flex items-center text-blue-600">
                          <Elevator className="w-3 h-3 ml-1" />
                          <span className="text-xs">מעלית</span>
                        </div>
                      )}
                      {property.מחסן === true && (
                        <div className="flex items-center text-green-600">
                          <Package className="w-3 h-3 ml-1" />
                          <span className="text-xs">מחסן</span>
                        </div>
                      )}
                    </div>
                  </td>
                )}
                <td className={`px-2 py-2 whitespace-nowrap ${compactView ? 'py-1' : 'py-4'}`}>
                  <div className="flex items-center">
                    <div className={`${compactView ? 'w-5 h-5 text-xs ml-1' : 'w-6 h-6 text-xs ml-2'} bg-[#3366FF] rounded-full flex items-center justify-center text-white font-medium`}>
                      {property.מגייס.charAt(0)}
                    </div>
                    <div className={`text-[#222222] ${compactView ? 'text-xs' : 'text-sm'}`}>
                        {property.סוג_עסקה && (
                          <span className={`mr-2 px-2 py-1 rounded-full text-xs font-medium border ${getDealTypeColor(property.סוג_עסקה)}`}>
                            {property.סוג_עסקה}
                          </span>
                        )}
                      <div className={compactView ? 'truncate max-w-[60px]' : ''}>{property.מגייס}</div>
                      {!compactView && (
                        <div className={`text-xs ${getStatusColor(property.סטטוס)}`}>{property.סטטוס}</div>
                      )}
                      {!compactView && property.ימים_במרקט !== undefined && property.ימים_במרקט > 0 && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3 ml-1" />
                          {property.ימים_במרקט} ימים
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className={`${stickyColumns ? 'sticky left-0 bg-white z-10' : ''} px-2 py-2 whitespace-nowrap ${compactView ? 'py-1' : 'py-4'}`}>
                  <div className={`flex ${compactView ? 'gap-1 flex-col' : 'gap-2'}`}>
                    <button
                      onClick={() => onViewDetails?.(property)}
                      className={`${compactView ? 'p-1' : 'p-2'} bg-[#3366FF] text-white rounded-lg hover:bg-[#2952CC] transition-colors shadow-md`}
                      title="צפה בפרטים מלאים"
                    >
                      <ExternalLink className={compactView ? 'w-3 h-3' : 'w-4 h-4'} />
                    </button>
                    {property.fireberryId && property.fireberryId.trim() && (
                      <a
                        href={`https://app.fireberry.com/app/record/14/${property.fireberryId.trim()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${compactView ? 'p-1' : 'p-2'} bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md`}
                        title="כרטיס נכס Fireberry"
                      >
                        <ExternalLink className={compactView ? 'w-3 h-3' : 'w-4 h-4'} />
                      </a>
                    )}
                    {property.pdfLink && property.pdfLink !== '#' && (
                    <a
                      href={property.pdfLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${compactView ? 'p-1' : 'p-2'} bg-[#F4E851] text-[#222222] rounded-lg hover:bg-[#E8D149] transition-colors`}
                      title="תכנית דירה"
                    >
                      <FileText className={compactView ? 'w-3 h-3' : 'w-4 h-4'} />
                    </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </div>
        
        {/* Scroll indicators */}
        <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-transparent to-gray-200 opacity-50 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-l from-transparent to-gray-200 opacity-50 pointer-events-none"></div>
      </div>
      
      {properties.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-[#222222] mb-2">לא נמצאו נכסים</h3>
          <p className="text-gray-600">נסה לשנות את המסננים כדי לראות יותר תוצאות</p>
        </div>
      )}
    </div>
  );
});

export default PropertyTable;