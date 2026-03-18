import React, { useState, useEffect, useRef } from 'react';
import { useMemo, useCallback, memo } from 'react';
import { Search, X, MapPin, Home, Building, User, Star } from 'lucide-react';
import { Property } from '../types/Property';

interface SearchBoxProps {
  properties: Property[];
  onSearchResults: (results: Property[]) => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

interface SearchResult {
  property: Property;
  matchedFields: string[];
  score: number;
}

const SearchBox: React.FC<SearchBoxProps> = memo(({
  properties,
  onSearchResults,
  onSearchChange,
  searchQuery
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Optimized search index with better performance
  const searchIndex = useMemo(() => {
    const startTime = performance.now();
    
    return properties.map(property => ({
      property,
      searchableFields: {
        'שם הנכס': property.שם_הנכס_שיוצג_באתר,
        'תיאור': property.description,
        'עיר': property.עיר,
        'שכונה': property.שכונה,
        'רחוב': property.רחוב,
        'מספר בניין': property.מספר_בניין,
        'מספר דירה': property.מספר_דירה,
        'פרויקט': property.פרויקט,
        'סוג נכס': property.סוג_נכס,
        'מגייס': property.מגייס,
        'סטטוס': property.סטטוס,
        'סוג חניה': property.סוג_חניה,
        'מחיר': property.מחיר_מבוקש.toString(),
        'חדרים': property.מספר_חדרים.toString(),
        'שטח': property.שטח_דירה.toString(),
        'קומה': property.קומה.toString(),
      }
    }));
    
    const endTime = performance.now();
    console.log(`⚡ Search index: ${Math.round(endTime - startTime)}ms`);
  }, [properties]);

  // Optimized search function with debouncing
  const performSearch = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    if (searchTerms.length === 0) return [];
    
    const results: SearchResult[] = [];

    searchIndex.forEach(({ property, searchableFields }) => {
      let score = 0;
      const matchedFields: string[] = [];

      // Search in each field
      const fieldEntries = Object.entries(searchableFields);
      
      for (let i = 0; i < fieldEntries.length && score < 50; i++) { // Early exit for performance
        const [fieldName, fieldValue] = fieldEntries[i];
        const fieldValueLower = fieldValue.toLowerCase();
        
        searchTerms.forEach(term => {
          if (fieldValueLower.includes(term)) {
            // Higher score for exact matches
            if (fieldValueLower === term) {
              score += 10;
            }
            // Medium score for word start matches
            else if (fieldValueLower.startsWith(term)) {
              score += 5;
            }
            // Lower score for partial matches
            else {
              score += 2;
            }
            
            if (!matchedFields.includes(fieldName)) {
              matchedFields.push(fieldName);
            }
          }
        });
      }

      // Bonus points for featured properties
      if (property.featured) {
        score += 3;
      }

      // Bonus points for available properties
      if (property.סטטוס === 'זמין') {
        score += 2;
      }

      if (score > 0) {
        results.push({
          property,
          matchedFields,
          score
        });
      }
    });

    // Sort by score (highest first) and limit results
    return results.sort((a, b) => b.score - a.score).slice(0, 10);
  }, [searchIndex]);

  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (query.trim()) {
        const results = performSearch(query);
        setSearchResults(results);
        setShowResults(true);
        onSearchResults(results.map(r => r.property));
      } else {
        setSearchResults([]);
        setShowResults(false);
        onSearchResults(properties);
      }
    }, 300); // 300ms debounce for better performance

    setSearchTimeout(timeout);
  }, [performSearch, onSearchResults, properties, searchTimeout]);

  const handleSearch = useCallback((query: string) => {
    onSearchChange(query);
    debouncedSearch(query);
  }, [onSearchChange, debouncedSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Old search function - removed
  /*
  const createSearchIndex = (property: Property) => {
    const searchableFields = {
      'שם הנכס': property.שם_הנכס_שיוצג_באתר,
      'תיאור': property.description,
      'עיר': property.עיר,
      'שכונה': property.שכונה,
      'רחוב': property.רחוב,
      'מספר בניין': property.מספר_בניין,
      'מספר דירה': property.מספר_דירה,
      'פרויקט': property.פרויקט,
      'סוג נכס': property.סוג_נכס,
      'מגייס': property.מגייס,
      'סטטוס': property.סטטוס,
      'סוג חניה': property.סוג_חניה,
      'מחיר': property.מחיר_מבוקש.toString(),
      'חדרים': property.מספר_חדרים.toString(),
      'שטח': property.שטח_דירה.toString(),
      'קומה': property.קומה.toString(),
    };
  };
  */
  
  const handleResultClick = (property: Property) => {
    setShowResults(false);
    setIsExpanded(false);
    // Scroll to property or highlight it
    const element = document.getElementById(`property-${property.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-[#3366FF]', 'ring-opacity-50');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-[#3366FF]', 'ring-opacity-50');
      }, 3000);
    }
  };

  const clearSearch = () => {
    handleSearch('');
    setIsExpanded(false);
    inputRef.current?.blur();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto mb-6">
      <div className={`bg-white rounded-xl shadow-lg transition-all duration-300 ${
        isExpanded ? 'shadow-xl ring-2 ring-[#3366FF] ring-opacity-20' : ''
      }`}>
        <div className="relative">
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="חפש נכסים... (לדוגמה: 'דירת 3 חדרים בתל אביב', 'פנטהאוס עם מרפסת', 'מחיר עד 2 מיליון')"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="w-full pr-12 pl-12 py-4 text-lg border-0 rounded-xl focus:ring-0 focus:outline-none placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  נמצאו {searchResults.length} תוצאות
                </span>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  סגור
                </button>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {searchResults.slice(0, 10).map((result, index) => (
                <div
                  key={result.property.id}
                  onClick={() => handleResultClick(result.property)}
                  className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={result.property.תמונה_נכס_ראשית}
                      alt={result.property.שם_הנכס_שיוצג_באתר}
                      className="w-16 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-[#222222] truncate">
                          {result.property.שם_הנכס_שיוצג_באתר}
                        </h4>
                        {result.property.featured && (
                          <Star className="w-4 h-4 text-[#F4E851] fill-current flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{result.property.עיר}, {result.property.שכונה}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          <span>{result.property.מספר_חדרים} חדרים</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          <span>{result.property.שטח_דירה} מ"ר</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-[#3366FF]">
                          {formatPrice(result.property.מחיר_מבוקש)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>{result.property.מגייס}</span>
                        </div>
                      </div>
                      
                      {/* Matched fields */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {result.matchedFields.slice(0, 3).map((field) => (
                          <span
                            key={field}
                            className="px-2 py-1 bg-[#3366FF] bg-opacity-10 text-[#3366FF] text-xs rounded-full"
                          >
                            {field}
                          </span>
                        ))}
                        {result.matchedFields.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{result.matchedFields.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {searchResults.length > 10 && (
              <div className="p-3 text-center border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  ועוד {searchResults.length - 10} תוצאות נוספות...
                </span>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {showResults && searchResults.length === 0 && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-6 text-center z-50">
            <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="font-medium text-gray-600 mb-1">לא נמצאו תוצאות</h3>
            <p className="text-sm text-gray-500">
              נסה לחפש במילים אחרות או בדוק את האיות
            </p>
          </div>
        )}
      </div>

      {/* Search suggestions when focused but no query */}
      {isExpanded && !searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
          <h4 className="font-medium text-gray-700 mb-3">דוגמאות לחיפוש:</h4>
          <div className="space-y-2">
            {[
              'דירת 3 חדרים בתל אביב',
              'פנטהאוס עם מרפסת',
              'מחיר עד 2 מיליון',
              'דירה בקומה גבוהה',
              'וילה עם גינה',
              'חניה תת קרקעית'
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSearch(suggestion)}
                className="block w-full text-right px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default SearchBox;