import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Property } from '../types/Property';
import { useDebounce } from '../hooks/useDebounce';

// Mapbox access token from environment variables
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

// Global flags to prevent multiple script loads
let mapboxScriptsLoaded = false;
let mapboxLoadPromise: Promise<void> | null = null;

interface MapViewProps {
  properties: Property[];
  onToggleFeatured?: (id: string) => void;
  onToggleSelectedForClient?: (id: string) => void;
  isAdmin?: boolean;
  onViewDetails?: (property: Property) => void;
  onMapBoundsChange?: (properties: Property[]) => void;
  onClearPolygonFilter?: () => void;
}

const MapView: React.FC<MapViewProps> = ({
  properties,
  onToggleFeatured,
  onToggleSelectedForClient,
  isAdmin = false,
  onViewDetails,
  onMapBoundsChange,
  onClearPolygonFilter
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const draw = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [filteredByPolygon, setFilteredByPolygon] = useState<Property[]>([]);
  const [polygonActive, setPolygonActive] = useState(false);
  const [clusterMode, setClusterMode] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState<{current: number, total: number} | null>(null);
  const [currentMapState, setCurrentMapState] = useState<{center: [number, number], zoom: number} | null>(null);

  // Save map state when user interacts with map (debounced)
  const saveMapState = useDebounce(() => {
    if (map.current) {
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      setCurrentMapState({
        center: [center.lng, center.lat],
        zoom: zoom
      });
    }
  }, 500);

  // Map bounds change listener for zoom/pan (only for polygon filtering)
  const handleBoundsChange = useDebounce(() => {
    if (!onMapBoundsChange || polygonActive) return; // Don't trigger if polygon is active
    
    const bounds = map.current.getBounds();
    const visibleProperties = properties.filter(property => {
      if (!property.latitude || !property.longitude) return false;
      
      const lat = property.latitude;
      const lng = property.longitude;
      
      return lat >= bounds.getSouth() && 
             lat <= bounds.getNorth() && 
             lng >= bounds.getWest() && 
             lng <= bounds.getEast();
    });
    
    console.log(`🗺️ Map bounds changed: ${visibleProperties.length} properties visible`);
    // Only call if significantly different from current properties
    if (Math.abs(visibleProperties.length - properties.length) > 5) {
      onMapBoundsChange(visibleProperties);
    }
  }, 1000);

  // Load Mapbox scripts and styles
  const loadMapboxScripts = useCallback(async (): Promise<void> => {
    if (mapboxScriptsLoaded) {
      console.log('🗺️ Mapbox already loaded globally');
      return Promise.resolve();
    }

    if (mapboxLoadPromise) {
      console.log('🗺️ Mapbox loading in progress, waiting...');
      return mapboxLoadPromise;
    }

    console.log('🗺️ Starting Mapbox script loading...');
    setLoadingStage('טוען ספריות מפה...');

    mapboxLoadPromise = new Promise((resolve, reject) => {
      // Check if already loaded in window
      if ((window as any).mapboxgl) {
        console.log('🗺️ Mapbox found in window');
        mapboxScriptsLoaded = true;
        resolve();
        return;
      }

      let cssLoaded = false;
      let jsLoaded = false;
      let drawCssLoaded = false;
      let drawJsLoaded = false;

      const checkComplete = () => {
        if (cssLoaded && jsLoaded && drawCssLoaded && drawJsLoaded) {
          console.log('✅ All Mapbox resources loaded');
          mapboxScriptsLoaded = true;
          resolve();
        }
      };

      // Load Mapbox CSS
      const existingCSS = document.querySelector('link[href*="mapbox-gl.css"]');
      if (!existingCSS) {
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        link.onload = () => {
          console.log('🎨 Mapbox CSS loaded');
          cssLoaded = true;
          checkComplete();
        };
        link.onerror = () => {
          console.error('❌ Failed to load Mapbox CSS');
          reject(new Error('Failed to load Mapbox CSS'));
        };
        document.head.appendChild(link);
      } else {
        console.log('🎨 Mapbox CSS already exists');
        cssLoaded = true;
        checkComplete();
      }

      // Load Mapbox Draw CSS
      const existingDrawCSS = document.querySelector('link[href*="mapbox-gl-draw.css"]');
      if (!existingDrawCSS) {
        const drawLink = document.createElement('link');
        drawLink.href = 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.css';
        drawLink.rel = 'stylesheet';
        drawLink.onload = () => {
          console.log('🎨 Mapbox Draw CSS loaded');
          drawCssLoaded = true;
          checkComplete();
        };
        drawLink.onerror = () => {
          console.error('❌ Failed to load Mapbox Draw CSS');
          reject(new Error('Failed to load Mapbox Draw CSS'));
        };
        document.head.appendChild(drawLink);
      } else {
        console.log('🎨 Mapbox Draw CSS already exists');
        drawCssLoaded = true;
        checkComplete();
      }

      // Load Mapbox JavaScript
      const existingJS = document.querySelector('script[src*="mapbox-gl.js"]');
      if (!existingJS) {
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.async = true;
        script.onload = () => {
          console.log('📦 Mapbox JS loaded');
          if ((window as any).mapboxgl) {
            jsLoaded = true;
            checkComplete();
          } else {
            reject(new Error('Mapbox GL not found after script load'));
          }
        };
        script.onerror = () => {
          console.error('❌ Failed to load Mapbox JS');
          reject(new Error('Failed to load Mapbox JS'));
        };
        document.head.appendChild(script);
      } else {
        console.log('📦 Mapbox JS already exists');
        if ((window as any).mapboxgl) {
          jsLoaded = true;
          checkComplete();
        } else {
          reject(new Error('Mapbox script exists but GL not available'));
        }
      }

      // Load Mapbox Draw JavaScript
      const existingDrawJS = document.querySelector('script[src*="mapbox-gl-draw.js"]');
      if (!existingDrawJS) {
        const drawScript = document.createElement('script');
        drawScript.src = 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.js';
        drawScript.async = true;
        drawScript.onload = () => {
          console.log('📦 Mapbox Draw JS loaded');
          if ((window as any).MapboxDraw) {
            drawJsLoaded = true;
            checkComplete();
          } else {
            reject(new Error('MapboxDraw not found after script load'));
          }
        };
        drawScript.onerror = () => {
          console.error('❌ Failed to load Mapbox Draw JS');
          reject(new Error('Failed to load Mapbox Draw JS'));
        };
        document.head.appendChild(drawScript);
      } else {
        console.log('📦 Mapbox Draw JS already exists');
        if ((window as any).MapboxDraw) {
          drawJsLoaded = true;
          checkComplete();
        } else {
          reject(new Error('MapboxDraw script exists but not available'));
        }
      }
    });

    return mapboxLoadPromise;
  }, []);

  // Initialize scripts
  useEffect(() => {
    let mounted = true;

    const initializeScripts = async () => {
      try {
        await loadMapboxScripts();
        if (mounted) {
          setScriptsLoaded(true);
          setLoadingStage('');
        }
      } catch (error) {
        console.error('❌ Script loading failed:', error);
        if (mounted) {
          setMapError(`שגיאה בטעינת ספריות המפה: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setLoadingStage('');
        }
      }
    };

    initializeScripts();

    return () => {
      mounted = false;
    };
  }, [loadMapboxScripts]);

  // Properties with location for display
  const propertiesWithLocation = useMemo(() => {
    return properties.filter(p => p.latitude && p.longitude).length;
  }, [properties]);

  // Check if point is inside polygon using ray casting algorithm
  const isPointInPolygon = useCallback((point: [number, number], polygon: number[][]): boolean => {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }, []);

  // Filter properties by polygon
  const filterPropertiesByPolygon = useCallback((polygonCoords: number[][]) => {
    const filtered = properties.filter(property => {
      if (!property.latitude || !property.longitude) return false;
      return isPointInPolygon([property.longitude, property.latitude], polygonCoords);
    });
    
    setFilteredByPolygon(filtered);
    if (onMapBoundsChange) {
      onMapBoundsChange(filtered);
    }
    
    console.log(`🔍 Filtered ${filtered.length} properties inside polygon`);
  }, [properties, isPointInPolygon, onMapBoundsChange]);

  // Geocoding function for properties without coordinates
  const geocodePropertiesWithoutCoords = useCallback(async (propertiesArray: Property[]): Promise<Property[]> => {
    const propertiesWithoutCoords = propertiesArray.filter(p => !p.latitude || !p.longitude);
    
    if (propertiesWithoutCoords.length === 0) {
      return propertiesArray;
    }

    console.log(`🌍 Starting geocoding for ${propertiesWithoutCoords.length} properties...`);
    setGeocodingProgress({ current: 0, total: propertiesWithoutCoords.length });

    const geocodedProperties = [...propertiesArray];
    let geocodedCount = 0;

    for (const property of propertiesWithoutCoords) {
      try {
        const address = `${property.כתובת}, ${property.עיר}, Israel`;
        const encodedAddress = encodeURIComponent(address);
        
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=il&limit=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const [longitude, latitude] = data.features[0].center;
            
            // Update the property in the array
            const propertyIndex = geocodedProperties.findIndex(p => p.id === property.id);
            if (propertyIndex !== -1) {
              geocodedProperties[propertyIndex] = {
                ...geocodedProperties[propertyIndex],
                latitude,
                longitude
              };
              geocodedCount++;
              console.log(`✅ Geocoded ${property.שם_הנכס_שיוצג_באתר}: ${latitude}, ${longitude}`);
            }
          }
        }
        
        // Update progress
        setGeocodingProgress({ current: geocodedCount, total: propertiesWithoutCoords.length });
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.warn(`⚠️ Failed to geocode ${property.שם_הנכס_שיוצג_באתר}:`, error);
      }
    }

    setGeocodingProgress(null);
    console.log(`🌍 Geocoding completed: ${geocodedCount}/${propertiesWithoutCoords.length} properties geocoded`);
    
    return geocodedProperties;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!scriptsLoaded || !mapContainer.current || map.current || mapError) return;

    let mounted = true;

    const initializeMap = async () => {
      try {
        setLoadingStage('מאתחל מפה...');
        console.log('🗺️ Starting map initialization...');

        if (!mounted) return;

        // Set access token
        (window as any).mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
        
        setLoadingStage('יוצר מפה...');

        // Create map instance
        map.current = new (window as any).mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [34.7818, 32.0853], // Tel Aviv center
          zoom: 10,
          attributionControl: false,
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: true,
          antialias: true
        });

        // Load event handler
        map.current.on('load', () => {
          if (!mounted) return;
          
          console.log('✅ Map loaded successfully');
          setMapLoaded(true);
          setLoadingStage('');
          
          // Initialize drawing tools
          draw.current = new (window as any).MapboxDraw({
            displayControlsDefault: false,
            controls: {
              polygon: true,
              trash: true
            },
            defaultMode: 'simple_select',
            styles: [
              // Polygon fill
              {
                'id': 'gl-draw-polygon-fill-inactive',
                'type': 'fill',
                'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                'paint': {
                  'fill-color': '#3366FF',
                  'fill-outline-color': '#3366FF',
                  'fill-opacity': 0.1
                }
              },
              // Polygon fill active
              {
                'id': 'gl-draw-polygon-fill-active',
                'type': 'fill',
                'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
                'paint': {
                  'fill-color': '#F4E851',
                  'fill-outline-color': '#F4E851',
                  'fill-opacity': 0.2
                }
              },
              // Polygon outline
              {
                'id': 'gl-draw-polygon-stroke-inactive',
                'type': 'line',
                'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                'layout': {
                  'line-cap': 'round',
                  'line-join': 'round'
                },
                'paint': {
                  'line-color': '#3366FF',
                  'line-width': 3
                }
              },
              // Polygon outline active
              {
                'id': 'gl-draw-polygon-stroke-active',
                'type': 'line',
                'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
                'layout': {
                  'line-cap': 'round',
                  'line-join': 'round'
                },
                'paint': {
                  'line-color': '#F4E851',
                  'line-width': 4
                }
              },
              // Vertex points
              {
                'id': 'gl-draw-polygon-and-line-vertex-halo-active',
                'type': 'circle',
                'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
                'paint': {
                  'circle-radius': 8,
                  'circle-color': '#FFF'
                }
              },
              {
                'id': 'gl-draw-polygon-and-line-vertex-active',
                'type': 'circle',
                'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
                'paint': {
                  'circle-radius': 5,
                  'circle-color': '#F4E851'
                }
              }
            ]
          });

          // Add drawing controls to map
          map.current.addControl(draw.current, 'top-right');

          // Add navigation controls
          map.current.addControl(new (window as any).mapboxgl.NavigationControl(), 'top-left');

          map.current.on('moveend', saveMapState);

          // Only listen to bounds changes if no polygon is active
          map.current.on('moveend', handleBoundsChange);

          // Drawing event listeners
          map.current.on('draw.create', (e: any) => {
            console.log('🎨 Draw create event:', e);
            const polygon = e.features[0];
            if (polygon.geometry.type === 'Polygon') {
              const coords = polygon.geometry.coordinates[0];
              filterPropertiesByPolygon(coords);
              setPolygonActive(true);
            }
          });

          map.current.on('draw.update', (e: any) => {
            console.log('🎨 Draw update event:', e);
            const polygon = e.features[0];
            if (polygon.geometry.type === 'Polygon') {
              const coords = polygon.geometry.coordinates[0];
              filterPropertiesByPolygon(coords);
            }
          });

          map.current.on('draw.delete', (e: any) => {
            console.log('🗑️ Draw delete event:', e);
            setFilteredByPolygon([]);
            setPolygonActive(false);
            // Clear polygon filter completely in parent component
            if (onClearPolygonFilter) {
              onClearPolygonFilter();
            }
          });

          map.current.on('draw.modechange', (e: any) => {
            console.log('🎨 Draw mode changed:', e.mode);
            setIsDrawingMode(e.mode === 'draw_polygon');
          });
        });
        
        // Error handling
        map.current.on('error', (e: any) => {
          if (!mounted) return;
          
          console.error('❌ Map error:', e);
          
          let errorMessage = 'שגיאה בטעינת המפה';
          
          if (e.error && e.error.message) {
            const msg = e.error.message.toLowerCase();
            if (msg.includes('401') || msg.includes('unauthorized')) {
              errorMessage = 'שגיאת הרשאה - בדוק את ה-Access Token של Mapbox';
            } else if (msg.includes('style') || msg.includes('404')) {
              errorMessage = 'שגיאה בטעינת עיצוב המפה';
            } else if (msg.includes('network') || msg.includes('fetch')) {
              errorMessage = 'שגיאת רשת - בדוק את החיבור לאינטרנט';
            } else {
              errorMessage = `שגיאת מפה: ${e.error.message}`;
            }
          }
          
          setMapError(errorMessage);
          setLoadingStage('');
        });
        
        console.log('✅ Map ready with drawing tools');
        
      } catch (error) {
        if (!mounted) return;
        
        console.error('❌ Map initialization error:', error);
        let errorMessage = 'שגיאה באתחול המפה';
        
        if (error instanceof Error) {
          if (error.message.includes('token') || error.message.includes('401')) {
            errorMessage = 'שגיאת הרשאה - נדרש Mapbox Access Token תקין';
          } else {
            errorMessage = `שגיאה באתחול המפה: ${error.message}`;
          }
        }
        
        setMapError(errorMessage);
        setLoadingStage('');
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (map.current) {
        console.log('🧹 Cleaning up map...');
        try {
          map.current.remove();
        } catch (error) {
          console.warn('Warning cleaning up map:', error);
        }
        map.current = null;
        draw.current = null;
        setMapLoaded(false);
      }
    };
  }, [scriptsLoaded, mapError, filterPropertiesByPolygon, properties, onMapBoundsChange]);

  // Update markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const updateMarkersWithGeocoding = async () => {
      const displayProperties = properties; // Always show all properties
      
      console.log(`🎯 Updating ${displayProperties.length} markers on map...`);
      console.log('Properties with coordinates:', displayProperties.filter(p => p.latitude && p.longitude).length);
      
      // Debug: Log first few properties with their coordinates
      displayProperties.slice(0, 5).forEach((prop, index) => {
        console.log(`Property ${index + 1} (${prop.id}):`, {
          name: prop.שם_הנכס_שיוצג_באתר,
          lat: prop.latitude,
          lng: prop.longitude,
          hasCoords: !!(prop.latitude && prop.longitude)
        });
      });

      // Clear existing markers
      markers.forEach(marker => {
        try {
          if (marker && marker.remove) {
            marker.remove();
          }
        } catch (error) {
          console.warn('Warning removing marker:', error);
        }
      });
      setMarkers([]);


      const newMarkers: any[] = [];

      // Create individual markers for each property
      displayProperties.forEach(property => {
        // Validate coordinates are valid numbers
        if (!property.latitude || !property.longitude || 
            typeof property.latitude !== 'number' || typeof property.longitude !== 'number' ||
            isNaN(property.latitude) || isNaN(property.longitude)) {
          console.warn(`⚠️ Skipping property ${property.id} - invalid coordinates:`, {
            lat: property.latitude,
            lng: property.longitude
          });
          return;
        }
        
        console.log(`✅ Creating marker for property ${property.id} at ${property.latitude}, ${property.longitude}`);

        try {
          // Create marker element
          const markerEl = document.createElement('div');
          markerEl.className = 'custom-marker';
          
          // Single property marker styling
          markerEl.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${property.featured ? '#F4E851' : property.selectedForClient ? '#ef4444' : '#3366FF'};
            border: 4px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            color: ${property.featured ? '#222222' : 'white'};
            cursor: pointer;
            transition: transform 0.2s ease;
            z-index: 1;
          `;
          markerEl.textContent = property.מספר_חדרים.toString();

          // Format price
          const formatPrice = (price: number) => {
            return new Intl.NumberFormat('he-IL', {
              style: 'currency',
              currency: 'ILS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(price);
          };

          // Single property popup
          const popupContent = `
            <div style="padding: 16px; max-width: 300px; direction: rtl; text-align: right; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #222222; flex: 1;">
                  ${property.שם_הנכס_שיוצג_באתר}
                </h3>
                ${property.featured ? '<span style="background: #F4E851; color: #222222; padding: 2px 8px; border-radius: 12px; font-size: 12px; white-space: nowrap;">⭐ מומלץ</span>' : ''}
              </div>
            
              <div style="margin-bottom: 12px;">
                <img src="${property.תמונה_נכס_ראשית}" alt="${property.שם_הנכס_שיוצג_באתר}" 
                     style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;" 
                     onerror="this.src='https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800'"/>
              </div>
            
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; font-size: 14px;">
                <div><strong>📍 מיקום:</strong><br>${property.עיר}, ${property.שכונה}</div>
                <div><strong>🏠 חדרים:</strong><br>${property.מספר_חדרים}</div>
                <div><strong>📐 שטח:</strong><br>${property.שטח_דירה} מ"ר</div>
                <div><strong>🏢 קומה:</strong><br>${property.קומה}</div>
              </div>
            
              <div style="font-size: 18px; font-weight: bold; color: #3366FF; margin-bottom: 12px;">
                ${formatPrice(property.מחיר_מבוקש)}
              </div>
            
              <div style="display: flex; gap: 8px;">
                <button onclick="window.viewPropertyDetails('${property.id}')" 
                        style="flex: 1; padding: 8px 12px; background: #3366FF; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">
                  צפה בפרטים
                </button>
                ${property.fireberryId ? `
                  <a href="https://app.fireberry.com/app/record/14/${property.fireberryId}" target="_blank"
                     style="flex: 1; padding: 8px 12px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; text-align: center; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center;">
                    כרטיס נכס
                  </a>
                ` : ''}
              </div>
            </div>
          `;

          // Create popup
          const popup = new (window as any).mapboxgl.Popup({
            offset: 25,
            className: 'property-popup',
            maxWidth: '320px',
            closeButton: true,
            closeOnClick: false
          }).setHTML(popupContent);

          // Create marker
          const marker = new (window as any).mapboxgl.Marker({
            element: markerEl,
            draggable: false
          })
            .setLngLat([property.longitude, property.latitude])
            .setPopup(popup)
            .addTo(map.current);

          console.log(`✅ Created marker for property ${property.id}`);
          newMarkers.push(marker);

        } catch (error) {
          console.error(`❌ Error creating marker for property ${property.id}:`, error);
        }
      });

      setMarkers(newMarkers);
      console.log(`✅ Total markers created: ${newMarkers.length} out of ${displayProperties.length} properties`);

      // Set up global function for popup buttons
      (window as any).viewPropertyDetails = (propertyId: string) => {
        const property = properties.find(p => p.id === propertyId);
        if (property && onViewDetails) {
          onViewDetails(property);
        }
      };
    };
    
    updateMarkersWithGeocoding();

  }, [mapLoaded, properties, onViewDetails]);

  // Toggle drawing mode
  const toggleDrawingMode = useCallback(() => {
    if (!draw.current || !map.current) return;
    
    if (isDrawingMode) {
      draw.current.changeMode('simple_select');
    } else {
      draw.current.changeMode('draw_polygon');
    }
  }, [isDrawingMode]);

  // Clear all polygons
  const clearPolygons = useCallback(() => {
    if (!draw.current) return;
    
    draw.current.deleteAll();
    setFilteredByPolygon([]);
    setPolygonActive(false);
    // Clear polygon filter completely in parent component
    if (onClearPolygonFilter) {
      onClearPolygonFilter();
    }
  }, [onClearPolygonFilter]);

  // Show error state with retry
  if (mapError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-500 text-4xl mb-4">🗺️❌</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">שגיאה בטעינת המפה</h3>
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">{mapError}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setMapError(null);
                setScriptsLoaded(false);
                setMapLoaded(false);
                setLoadingStage('');
                mapboxScriptsLoaded = false;
                mapboxLoadPromise = null;
              }}
              className="w-full px-4 py-2 bg-[#3366FF] text-white rounded-lg hover:bg-[#2952CC] transition-colors font-medium"
            >
              🔄 נסה שוב
            </button>
            <p className="text-xs text-gray-500">
              אם הבעיה נמשכת, בדוק את החיבור לאינטרנט או פנה לתמיכה
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" style={{ minHeight: '600px', height: '80vh' }}>
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: '600px', minWidth: '300px', height: '80vh' }}
      />
      
      {/* Loading state with stages */}
      {(!mapLoaded && !mapError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3366FF] mx-auto mb-3"></div>
            <p className="text-gray-700 font-medium">
              {loadingStage || 'מכין מפה...'}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              {!scriptsLoaded ? '⏳ טוען ספריות...' : 
               !mapLoaded ? '🗺️ מאתחל מפה...' : '✅ מוכן!'}
            </div>
            {geocodingProgress && (
              <div className="mt-2 text-xs text-blue-600">
                🌍 מאתר כתובות: {geocodingProgress.current}/{geocodingProgress.total}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Drawing Controls */}
      {mapLoaded && (
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-10">
          <div className="flex flex-col gap-2">
            <button
              onClick={toggleDrawingMode}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDrawingMode 
                  ? 'bg-[#F4E851] text-[#222222] shadow-md' 
                  : 'bg-[#3366FF] text-white hover:bg-[#2952CC]'
              }`}
            >
              {isDrawingMode ? '🎨 מצב ציור פעיל' : '🎨 צייר אזור'}
            </button>
            
            {polygonActive && (
              <button
                onClick={clearPolygons}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                🗑️ נקה אזור
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Properties counter */}
      {mapLoaded && properties.length > 0 && (
        <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border-l-4 border-green-400 z-10">
          <p className="text-sm text-gray-700 font-medium">
            🗺️ {properties.length} נכסים במפה
          </p>
          <p className="text-xs text-gray-500">
            {propertiesWithLocation} נכסים עם מיקום
          </p>
          {polygonActive && (
            <p className="text-xs text-blue-600 font-medium mt-1">
              🎯 מסונן לפי אזור שצוייר
            </p>
          )}
        </div>
      )}

      {/* Drawing instructions */}
      {isDrawingMode && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#F4E851] text-[#222222] p-4 rounded-lg shadow-lg z-10 max-w-sm text-center">
          <p className="font-medium mb-2">🎨 מצב ציור פעיל</p>
          <p className="text-sm">
            לחץ על המפה כדי להתחיל לצייר פוליגון. לחץ על הנקודה הראשונה כדי לסגור את הצורה.
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;