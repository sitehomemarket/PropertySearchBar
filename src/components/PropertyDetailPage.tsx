import React, { useState, useEffect, useRef } from 'react';
import { Property } from '../types/Property';
import { X, MapPin, Home, Maximize, Building, Car, TreePine, Star, Heart, ExternalLink, FileText, Phone, Mail, Share2, Camera, ChevronLeft, ChevronRight, User, Calendar, DollarSign, Layers, Calculator as Elevator, Package } from 'lucide-react';

interface PropertyDetailPageProps {
  property: Property;
  onClose: () => void;
  onToggleFeatured?: (id: string) => void;
  onToggleSelectedForClient?: (id: string) => void;
  isAdmin?: boolean;
}

// Mapbox access token from environment variables
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

// Global flag to prevent multiple script loads in detail page
let detailMapScriptsLoaded = false;

const PropertyDetailPage: React.FC<PropertyDetailPageProps> = ({
  property,
  onClose,
  onToggleFeatured,
  onToggleSelectedForClient,
  isAdmin = false
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'זמין':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'נמכר':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'שמור':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'בבנייה':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get property coordinates
  const getPropertyCoordinates = (): [number, number] => {
    if (property.latitude && property.longitude && 
        property.latitude !== 0 && property.longitude !== 0) {
      return [property.longitude, property.latitude];
    }
    
    // Fallback to city coordinates
    const cityCoords: { [key: string]: [number, number] } = {
      'תל אביב': [34.7818, 32.0853],
      'הרצליה': [34.8443, 32.1624],
      'רמת גן': [34.8244, 32.0719],
      'פתח תקווה': [34.8878, 32.0878],
      'חולון': [34.7631, 32.0114],
      'בת ים': [34.7506, 32.0114],
      'ראשון לציון': [34.8044, 31.9730],
      'נתניה': [34.8532, 32.3215],
      'חיפה': [34.9896, 32.7940],
      'ירושלים': [35.2137, 31.7683],
    };
    
    return cityCoords[property.עיר] || [34.7818, 32.0853];
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    let mounted = true;

    const initializeDetailMap = async () => {
      try {
        // Check if Mapbox is already loaded
        if (!(window as any).mapboxgl && !detailMapScriptsLoaded) {
          console.log('🗺️ Loading Mapbox for detail page...');
          
          // Load CSS
          const existingCSS = document.querySelector('link[href*="mapbox-gl.css"]');
          if (!existingCSS) {
            const link = document.createElement('link');
            link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          }
          
          // Load JS
          const existingJS = document.querySelector('script[src*="mapbox-gl.js"]');
          if (!existingJS) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
              script.onload = () => {
                // Wait for mapboxgl to be available on window
                const checkMapboxGL = () => {
                  if ((window as any).mapboxgl) {
                    resolve(undefined);
                  } else {
                    setTimeout(checkMapboxGL, 10);
                  }
                };
                checkMapboxGL();
              };
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }
          
          // Additional safety check
          if (!(window as any).mapboxgl) {
            throw new Error('Mapbox GL JS failed to load');
          }
          
          detailMapScriptsLoaded = true;
        }

        if (!mounted) return;

        // Validate access token
        if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'your_mapbox_access_token_here') {
          throw new Error('Invalid Mapbox access token');
        }

        // Initialize map
        (window as any).mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
        
        const coords = getPropertyCoordinates();
        
        map.current = new (window as any).mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: coords,
          zoom: 16,
          attributionControl: false,
          failIfMajorPerformanceCaveat: false
        });

        map.current.on('load', () => {
          if (!mounted) return;
          setMapLoaded(true);
          
          // Add marker for the property
          const markerEl = document.createElement('div');
          markerEl.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${property.featured ? '#F4E851' : '#3366FF'};
            border: 4px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            color: ${property.featured ? '#222222' : 'white'};
          `;
          markerEl.textContent = property.מספר_חדרים.toString();

          new (window as any).mapboxgl.Marker(markerEl)
            .setLngLat(coords)
            .addTo(map.current);
        });
        
        map.current.on('error', (e: any) => {
          if (!mounted) return;
          console.error('❌ Detail map error:', e);
          
          let errorMessage = 'שגיאה בטעינת המפה';
          if (e.error && e.error.message) {
            if (e.error.message.includes('401') || e.error.message.includes('Unauthorized')) {
              errorMessage = 'שגיאת הרשאה - בדוק את ה-Access Token של Mapbox';
            } else if (e.error.message.includes('style')) {
              errorMessage = 'שגיאה בטעינת עיצוב המפה';
            } else {
              errorMessage = `שגיאת מפה: ${e.error.message}`;
            }
          }
          setMapError(errorMessage);
        });
        
      } catch (error) {
        if (!mounted) return;
        console.error('❌ Detail map initialization error:', error);
        setMapError('שגיאה באתחול המפה');
      }
    };

    initializeDetailMap();

    return () => {
      mounted = false;
      if (map.current) {
        try {
          map.current.remove();
        } catch (error) {
          console.warn('Warning cleaning up detail map:', error);
        }
        map.current = null;
        setMapLoaded(false);
      }
    };
  }, [property]);

  // Old implementation removed
  /*
  useEffect(() => {
    if (!mapContainer.current || map.current || mapError) return;

    // Check if Mapbox is already loaded
    if (!(window as any).mapboxgl) {
      console.log('🗺️ Mapbox not loaded, loading scripts...');
      
      // Load CSS
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      // Load JS
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => {
        initializeMap();
      };
      script.onerror = () => {
        setMapError('שגיאה בטעינת ספריית המפה');
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    function initializeMap() {
      try {
        (window as any).mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
        
        const coords = getPropertyCoordinates();
        
        map.current = new (window as any).mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: coords,
          zoom: 16,
          attributionControl: false
        });

        map.current.on('load', () => {
          setMapLoaded(true);
          
          // Add marker for the property
          const markerEl = document.createElement('div');
          markerEl.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${property.featured ? '#F4E851' : '#3366FF'};
            border: 4px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            color: ${property.featured ? '#222222' : 'white'};
          `;
          markerEl.textContent = property.מספר_חדרים.toString();

          new (window as any).mapboxgl.Marker(markerEl)
            .setLngLat(coords)
            .addTo(map.current);
        });
        
        map.current.on('error', (e: any) => {
          console.error('❌ Map error:', e);
          
          // Handle specific error types
          if (e.error && e.error.message) {
            if (e.error.message.includes('401') || e.error.message.includes('Unauthorized')) {
              setMapError('שגיאת הרשאה - בדוק את ה-Access Token של Mapbox');
            } else if (e.error.message.includes('style')) {
              setMapError('שגיאה בטעינת עיצוב המפה - בדוק את ה-Style URL');
            } else {
              setMapError(`שגיאת מפה: ${e.error.message}`);
            }
          } else {
            setMapError('שגיאה בטעינת המפה');
          }
        });
        
      } catch (error) {
        console.error('❌ Map initialization error:', error);
        setMapError('שגיאה באתחול המפה');
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
      }
    };
  }, [property, mapError]); */

  // Image gallery
  const images = [property.תמונה_נכס_ראשית, ...property.gallery].filter(img => img && img.trim());
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const shareProperty = () => {
    const shareData = {
      title: property.שם_הנכס_שיוצג_באתר,
      text: `${property.שם_הנכס_שיוצג_באתר} - ${formatPrice(property.מחיר_מבוקש)}`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert('פרטי הנכס הועתקו ללוח!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-[#222222]">{property.שם_הנכס_שיוצג_באתר}</h1>
            {property.featured && (
              <div className="bg-[#F4E851] text-[#222222] px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-4 h-4" />
                מומלץ
              </div>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(property.סטטוס)}`}>
              {property.סטטוס}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={shareProperty}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="שתף נכס"
            >
              <Share2 className="w-5 h-5" />
            </button>
            
            {isAdmin && (
              <button
                onClick={() => onToggleFeatured?.(property.id)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title={property.featured ? 'הסר מהמומלצים' : 'הוסף למומלצים'}
              >
                <Star className={`w-5 h-5 ${property.featured ? 'text-[#F4E851] fill-current' : 'text-gray-400'}`} />
              </button>
            )}
            
            <button
              onClick={() => onToggleSelectedForClient?.(property.id)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title={property.selectedForClient ? 'הסר מרשימת הלקוח' : 'הוסף לרשימת הלקוח'}
            >
              <Heart className={`w-5 h-5 ${property.selectedForClient ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Images and Gallery */}
            <div className="space-y-6">
              {/* Main Image */}
              <div className="relative">
                <div className="w-full h-80 bg-gray-200 rounded-xl overflow-hidden">
                  <img
                    src={images[currentImageIndex]}
                    alt={property.שם_הנכס_שיוצג_באתר}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800';
                    }}
                  />
                </div>
                
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? 'border-[#3366FF]' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`תמונה ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Map */}
              <div className="bg-gray-100 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#3366FF]" />
                    מיקום הנכס
                  </h3>
                </div>
                {mapError ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-red-500 text-2xl mb-2">❌</div>
                      <p className="text-gray-600 text-sm">{mapError}</p>
                      <button
                        onClick={() => setMapError(null)}
                        className="mt-2 px-3 py-1 bg-[#3366FF] text-white rounded text-sm hover:bg-[#2952CC]"
                      >
                        נסה שוב
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div 
                      ref={mapContainer} 
                      style={{ height: '300px' }}
                      className="w-full"
                    />
                    {!mapLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3366FF] mx-auto mb-2"></div>
                          <p className="text-gray-600 text-sm">טוען מפה...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Property Details */}
            <div className="space-y-6">
              {/* Price and Location */}
              <div className="bg-gradient-to-r from-[#3366FF] to-[#2952CC] text-white p-6 rounded-xl">
                <div className="text-3xl font-bold mb-2">{formatPrice(property.מחיר_מבוקש)}</div>
                <div className="flex items-center gap-2 text-blue-100">
                  <MapPin className="w-4 h-4" />
                  <span>{property.רחוב} {property.מספר_בניין}, {property.שכונה}, {property.עיר}</span>
                </div>
                {property.מספר_דירה && (
                  <div className="text-blue-100 text-sm mt-1">דירה מספר {property.מספר_דירה}</div>
                )}
              </div>

              {/* Property Features */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-5 h-5 text-[#3366FF]" />
                    <span className="font-medium">חדרים</span>
                  </div>
                  <div className="text-2xl font-bold text-[#222222]">{property.מספר_חדרים}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Maximize className="w-5 h-5 text-[#3366FF]" />
                    <span className="font-medium">שטח</span>
                  </div>
                  <div className="text-2xl font-bold text-[#222222]">{property.שטח_דירה} מ"ר</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-5 h-5 text-[#3366FF]" />
                    <span className="font-medium">קומה</span>
                  </div>
                  <div className="text-2xl font-bold text-[#222222]">{property.קומה}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-5 h-5 text-[#3366FF]" />
                    <span className="font-medium">חניות</span>
                  </div>
                  <div className="text-2xl font-bold text-[#222222]">{property.כמות_חניות}</div>
                </div>
              </div>

              {/* Additional Features */}
              <div className="space-y-4">
                {property.שטח_מרפסת > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">מרפסת</span>
                    </div>
                    <span className="font-bold text-blue-600">{property.שטח_מרפסת} מ"ר</span>
                  </div>
                )}

                {property.שטח_גינה > 0 && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TreePine className="w-5 h-5 text-green-600" />
                      <span className="font-medium">גינה</span>
                    </div>
                    <span className="font-bold text-green-600">{property.שטח_גינה} מ"ר</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">סוג חניה</span>
                  </div>
                  <span className="font-medium text-gray-600">{property.סוג_חניה}</span>
                </div>
              </div>

              {/* Market Days Info */}
              {property.ימים_במרקט !== undefined && property.ימים_במרקט >= 0 && (
                <div className={`bg-gray-50 p-4 rounded-lg ${
                  property.ימים_במרקט <= 3 ? 'ring-2 ring-green-200' : ''
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-[#3366FF]" />
                    <span className="font-medium">זמן במרקט</span>
                  </div>
                  <div className={`text-2xl font-bold ${
                    property.ימים_במרקט <= 3 ? 'text-green-600' :
                    property.ימים_במרקט <= 7 ? 'text-blue-600' :
                    property.ימים_במרקט <= 30 ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {property.ימים_במרקט === 0 ? 'חדש היום! 🆕' : 
                     property.ימים_במרקט === 1 ? 'יום אחד במרקט' :
                     `${property.ימים_במרקט} ימים במרקט`}
                  </div>
                  {property.נוצר_בתאריך && (
                    <div className="text-sm text-gray-500 mt-1">
                      נכנס למרקט: {property.נוצר_בתאריך}
                    </div>
                  )}
                </div>
              )}

              {/* Property Description */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-[#222222] mb-4">תיאור הנכס</h3>
                <div className="text-gray-700 leading-relaxed">
                  <p className="mb-4">
                    {property.תיאור_הנכס || property.אודות_הנכס || property.description || `נכס יוקרתי בפרויקט ${property.פרויקט} ב${property.שכונה}, ${property.עיר}. 
                    הנכס כולל ${property.מספר_חדרים} חדרים בשטח של ${property.שטח_דירה} מ"ר בקומה ${property.קומה}.`}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>פרויקט:</strong> {property.פרויקט}
                    </div>
                    <div>
                      <strong>סוג נכס:</strong> {property.סוג_נכס}
                    </div>
                    <div>
                      <strong>כתובת מלאה:</strong> {property.רחוב} {property.מספר_בניין}
                    </div>
                    <div>
                      <strong>סטטוס:</strong> {property.סטטוס}
                    </div>
                    {property.סוג_עסקה && (
                      <div>
                        <strong>סוג עסקה:</strong> {property.סוג_עסקה}
                      </div>
                    )}
                    {property.מעלית === true && (
                      <div>
                        <strong>מעלית:</strong> כן
                      </div>
                    )}
                    {property.מחסן === true && (
                      <div>
                        <strong>מחסן:</strong> כן
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Agent Info */}
              <div className="bg-[#3366FF] text-white p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  פרטי מגייס
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white text-[#3366FF] rounded-full flex items-center justify-center font-bold text-lg">
                    {property.מגייס.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{property.מגייס}</div>
                    <div className="text-blue-200 text-sm">מגייס נכסים מוסמך</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {property.fireberryId && property.fireberryId.trim() && (
                  <a
                    href={`https://app.fireberry.com/app/record/14/${property.fireberryId.trim()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    <ExternalLink className="w-5 h-5" />
                    כרטיס נכס
                  </a>
                )}
                
                {property.pdfLink && property.pdfLink !== '#' && (
                  <a
                    href={property.pdfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#F4E851] text-[#222222] rounded-lg hover:bg-[#E8D149] transition-colors font-medium"
                  >
                    <FileText className="w-5 h-5" />
                    תכנית דירה
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;