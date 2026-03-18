import React, { memo, useMemo } from 'react';
import { Property } from '../types/Property';
import { MapPin, Home, Maximize, Building, FileText, Star, Car, TreePine, Heart, ExternalLink, Calendar, Calculator as Elevator, Package, Layers } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onToggleFeatured?: (id: string) => void;
  onToggleSelectedForClient?: (id: string) => void;
  isAdmin?: boolean;
  onViewDetails?: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = memo(({ 
  property, 
  onToggleFeatured, 
  onToggleSelectedForClient,
  isAdmin = false,
  onViewDetails
}) => {
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

  return (
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${property.featured ? 'ring-2 ring-[#F4E851]' : ''} hover:scale-[1.02] group`}>
      {/* Image Section - 70% of card */}
      <div className="relative h-64">
        <img
          src={property.תמונה_נכס_ראשית}
          alt={property.שם_הנכס_שיוצג_באתר}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
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
              placeholder.className = 'w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-4xl';
              placeholder.textContent = '🏠';
              target.parentNode?.appendChild(placeholder);
            }
          }}
        />
        
        {/* Top badges */}
        <div className="absolute top-3 right-3 flex gap-2">
          {property.featured && (
            <div className="bg-[#F4E851] text-[#222222] px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs font-bold">מומלץ</span>
            </div>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.סטטוס)}`}>
            {property.סטטוס}
          </span>
        </div>
        
        {/* Control buttons */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isAdmin && (
            <button
              onClick={() => onToggleFeatured?.(property.id)}
              className="p-2 bg-white/90 hover:bg-white rounded-full transition-all duration-200 shadow-lg hover:scale-110"
            >
              <Star className={`w-4 h-4 ${property.featured ? 'text-[#F4E851] fill-current' : 'text-gray-500'}`} />
            </button>
          )}
          
          <button
            onClick={() => onToggleSelectedForClient?.(property.id)}
            className="p-2 bg-white/90 hover:bg-white rounded-full transition-all duration-200 shadow-lg hover:scale-110"
            title={property.selectedForClient ? 'הסר מרשימת הלקוח' : 'הוסף לרשימת הלקוח'}
          >
            <Heart className={`w-4 h-4 ${property.selectedForClient ? 'text-red-500 fill-current' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Market days badge */}
        {property.ימים_במרקט !== undefined && property.ימים_במרקט >= 0 && (
          <div className="absolute bottom-3 right-3">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
              property.ימים_במרקט <= 3 
                ? 'bg-green-500 text-white animate-pulse' 
                : property.ימים_במרקט <= 7
                ? 'bg-blue-500 text-white'
                : property.ימים_במרקט <= 30
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-500 text-white'
            }`}>
              {property.ימים_במרקט <= 3 && '🆕'}
              {property.ימים_במרקט > 3 && property.ימים_במרקט <= 7 && '📅'}
              {property.ימים_במרקט > 7 && property.ימים_במרקט <= 30 && '📆'}
              {property.ימים_במרקט > 30 && '⏰'}
              <span>
                {property.ימים_במרקט === 0 ? 'חדש!' : 
                 property.ימים_במרקט === 1 ? 'יום' :
                 `${property.ימים_במרקט}י'`}
              </span>
            </div>
          </div>
        )}

        {/* Price overlay on image */}
        <div className="absolute bottom-3 left-3">
          <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
            <div className="text-lg font-bold">
              {formatPrice(property.מחיר_מבוקש)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Section - 30% of card */}
      <div className="p-4 space-y-3">
        {/* Location */}
        <div className="flex items-center text-gray-600 text-sm">
          <MapPin className="w-3 h-3 ml-1 flex-shrink-0" />
          <span className="truncate">
            {property.רחוב} {property.מספר_בניין}, {property.שכונה}, {property.עיר}
          </span>
        </div>
        
        {/* Property Type */}
        <div className="flex items-center text-gray-600 text-sm">
          <Home className="w-3 h-3 ml-1 flex-shrink-0" />
          <span className="truncate">
            {property.סוג_נכס}
          </span>
        </div>
        
        {/* Key features in one clean row */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Building className="w-3 h-3 text-[#3366FF]" />
              <span className="font-medium">{property.מספר_חדרים}</span>
            </div>
            <div className="flex items-center gap-1">
              <Maximize className="w-3 h-3 text-[#3366FF]" />
              <span className="font-medium">{property.שטח_דירה}מ"ר</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#3366FF]" />
              <span className="font-medium">ק'{property.קומה}</span>
            </div>
          </div>
          
          {/* Agent initial */}
          <div className="w-6 h-6 bg-[#3366FF] rounded-full flex items-center justify-center text-white font-bold text-xs">
            {property.מגייס.charAt(0)}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onViewDetails}
            className="flex-1 bg-[#3366FF] text-white py-2 px-3 rounded-lg hover:bg-[#2952CC] transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3 h-3" />
            פרטים
          </button>
          
          {property.fireberryId && property.fireberryId.trim() && (
            <a
              href={`https://app.fireberry.com/app/record/14/${property.fireberryId.trim()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center"
              title="כרטיס נכס"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          
          {property.pdfLink && property.pdfLink !== '#' && (
            <a
              href={property.pdfLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#F4E851] text-[#222222] py-2 px-3 rounded-lg hover:bg-[#E8D149] transition-colors text-sm font-medium flex items-center justify-center"
              title="תכנית דירה"
            >
              <FileText className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
});

PropertyCard.displayName = 'PropertyCard';

export default PropertyCard;