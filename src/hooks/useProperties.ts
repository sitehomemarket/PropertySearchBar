import { useState, useEffect, useCallback, useMemo } from 'react';
import { Property, FilterState } from '../types/Property';

// Google Sheets API integration
const GOOGLE_SHEETS_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SPREADSHEET_ID = '1KpiIIWdnlie0shj-lbon8Q-myustamW7gDqnrblnaHY'; // forsalehomemarekt (4).xlsx
const SHEET_RANGE = 'Sheet1!A1:AF10000';

// Response cache for better performance
let responseCache: any = null;
let lastCacheTime = 0;
const RESPONSE_CACHE_DURATION = 120000; // 2 minutes - longer cache for better performance

// Cache for column mapping
let columnMapping: { [key: string]: number } = {};
let columnMappingCached = false;

// פונקציה לחיפוש עמודות בכותרת
function findColumnMapping(headers: string[]): { [key: string]: number } {
  const mapping: { [key: string]: number } = {};
  
  console.log('🔍 === מיפוי עמודות מהגיליון ===');
  console.log('📊 כותרות הגיליון (סה"כ ' + headers.length + ' עמודות):', headers);
  
  // הדפסת כל כותרת עם המספר שלה
  headers.forEach((header, index) => {
    console.log(`עמודה ${index + 1}: "${header}"`);
  });
  
  // ✅ מיפוי קבוע לפי מספור העמודות בגיליון (שמות באנגלית)
  mapping['פרויקט'] = 0; // עמודה 1
  mapping['סטטוס'] = 1; // עמודה 2 - סטטוס הנכס
  mapping['עיר'] = 2; // עמודה 3
  mapping['מספר_חדרים'] = 3; // עמודה 4 - Rooms
  mapping['שטח_דירה'] = 4; // עמודה 5 - Apartment Size
  mapping['שטח_מרפסת'] = 5; // עמודה 6 - Balcony Size
  mapping['מחיר_מבוקש'] = 6; // עמודה 7 - Asking Price
  mapping['שכונה'] = 7; // עמודה 8
  mapping['סוג_חניה'] = 8; // עמודה 9 - Parking Type
  mapping['כמות_חניות'] = 9; // עמודה 10 - Parking Spots
  mapping['שטח_גינה'] = 10; // עמודה 11 - Garden Size
  mapping['תמונה_נכס_ראשית'] = 11; // עמודה 12 - Main Property Image
  mapping['שם_הנכס_שיוצג_באתר'] = 12; // עמודה 13 - Property Name (Website)
  mapping['סוג_נכס'] = 13; // עמודה 14 - Property Type
  mapping['מגייס'] = 14; // עמודה 15 - Recruiter
  mapping['קומה'] = 15; // עמודה 16
  mapping['מספר_דירה'] = 16; // עמודה 17 - Apartment Number
  mapping['תכנית_דירה'] = 17; // עמודה 18 - Floorplan (Image)
  mapping['רחוב'] = 18; // עמודה 19
  mapping['מספר_בניין'] = 19; // עמודה 20 - Building Number
  mapping['id_column'] = 20; // עמודה 21
  mapping['כתובת_למפה'] = 21; // עמודה 22 - Map Address
  mapping['תמונה_אפליקציה'] = 22; // עמודה 23 - Main Image App Search 2025 Dekel
  mapping['latitude'] = 23; // עמודה 24
  mapping['longitude'] = 24; // עמודה 25
  mapping['נוצר_בתאריך'] = 25; // עמודה 26 - Created At
  mapping['עודכן_בתאריך'] = 26; // עמודה 27 - Updated At
  mapping['סוג_עסקה'] = 27; // עמודה 28 - For Sale/Rent
  mapping['אודות_הנכס'] = 28; // עמודה 29 - About Property
  mapping['מעלית'] = 29; // עמודה 30
  mapping['מחסן'] = 30; // עמודה 31
  mapping['תיאור_הנכס'] = 31; // עמודה 32 - Property Description
  
  console.log('✅ מיפוי עמודות קבוע הוגדר לפי מספור הגיליון (שמות באנגלית)');
  
  return mapping;
};

// פונקציה לחילוץ ערך מהשורה לפי מיפוי פיזי
function getValueFromRow(row: any[], field: string, defaultValue: any = ''): any {
  const columnIndex = columnMapping[field];
  if (columnIndex !== undefined && row && row.length > columnIndex) {
    let value = String(row[columnIndex]).trim();
    
    // דיבוג מיוחד לשכונות
    if (field === 'שכונה' && value) {
      console.log(`🏘️ שכונה גולמית מעמודה ${columnIndex + 1}: "${value}" (אורך: ${value.length})`);
    }
    
    // Clean invalid values - treat as null/empty
    if (value === '' || 
        value === 'undefined' || 
        value === 'null' || 
        value.toLowerCase() === 'nan' || 
        value === '#N/A' || 
        value === '#REF!' || 
        value === '#VALUE!' ||
        value === '0' && (field === 'עיר' || field === 'שכונה' || field === 'סטטוס' || field === 'סוג_נכס') ||
        value.length > 200) { // שכונות לא אמורות להיות ארוכות מדי
      return defaultValue;
    }
    
    return value;
  }
  return defaultValue;
}

// פונקציה להמרת ערכי בוליאן
function convertToBoolean(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const lowerValue = value.toLowerCase().trim();
  return lowerValue === 'כן' || lowerValue === 'yes' || lowerValue === 'true' || lowerValue === '✓' || lowerValue === '✔️';
}

// פונקציה לחישוב ימים במרקט
function calculateDaysInMarket(createdDate: string): number {
  if (!createdDate || createdDate.trim() === '') return 0;
  
  try {
    let date: Date;
    
    // תמיכה בפורמטים שונים של תאריכים
    if (createdDate.includes('/')) {
      // פורמט DD/MM/YYYY או MM/DD/YYYY
      const parts = createdDate.split('/');
      if (parts.length === 3) {
        // נניח שהפורמט הוא DD/MM/YYYY (פורמט ישראלי)
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // חודשים מתחילים מ-0
        let year = parseInt(parts[2]);
        
        // אם השנה היא דו-ספרתית, הוסף 2000
        if (year < 100) {
          year += 2000;
        }
        
        date = new Date(year, month, day);
      } else {
        date = new Date(createdDate);
      }
    } else if (createdDate.includes('-')) {
      // פורמט YYYY-MM-DD או DD-MM-YYYY
      const parts = createdDate.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // פורמט YYYY-MM-DD
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const day = parseInt(parts[2]);
          date = new Date(year, month, day);
        } else {
          // פורמט DD-MM-YYYY
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          let year = parseInt(parts[2]);
          
          if (year < 100) {
            year += 2000;
          }
          
          date = new Date(year, month, day);
        }
      } else {
        date = new Date(createdDate);
      }
    } else if (createdDate.includes('.')) {
      // פורמט DD.MM.YYYY
      const parts = createdDate.split('.');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        let year = parseInt(parts[2]);
        
        if (year < 100) {
          year += 2000;
        }
        
        date = new Date(year, month, day);
      } else {
        date = new Date(createdDate);
      }
    } else {
      // נסה לפרסר ישירות
      date = new Date(createdDate);
    }
    
    // בדיקה שהתאריך תקין
    if (isNaN(date.getTime())) return 0;
    
    // חישוב ההפרש בימים
    const today = new Date();
    // איפוס השעות כדי לחשב ימים מלאים
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    console.log(`📅 חישוב ימים במרקט: תאריך="${createdDate}" -> parsed="${date.toLocaleDateString('he-IL')}" -> ימים=${diffDays}`);
    
    return Math.max(0, diffDays);
  } catch (error) {
    console.warn(`שגיאה בחישוב ימים במרקט עבור "${createdDate}":`, error);
    return 0;
  }
}

// Function to get distinct values from a specific column
function distinctValues(rows: any[][], columnIndex: number): string[] {
  const s = new Set<string>();
  for (const r of rows) {
    if (r && r.length > columnIndex) {
      const v = (r[columnIndex] ?? "").toString().trim();
      if (v && v.toLowerCase() !== "nan" && v !== '' && v !== 'undefined' && v !== 'null') {
        s.add(v);
      }
    }
  }
  return Array.from(s).sort();
}

export async function fetchPropertiesFromGoogleSheets(): Promise<any[]> {
  try {
    console.log('🔄 Fetching properties from Google Sheets...');
    
    // Check response cache first
    const now = Date.now();
    if (responseCache && (now - lastCacheTime) < RESPONSE_CACHE_DURATION) {
      console.log('📦 Using cached response');
      return processPropertiesData(responseCache);
    }
    
    console.log('📡 Connecting to Google Sheets...');
    
    // Try to fetch from Google Sheets first
    if (GOOGLE_SHEETS_API_KEY) {
      console.log('🔑 Using API Key for fast access');
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_RANGE}?key=${GOOGLE_SHEETS_API_KEY}`,
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'max-age=120'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('✅ API response received, rows:', data.values?.length || 0);
        
        // Cache the response
        responseCache = data;
        lastCacheTime = now;
        
        return processPropertiesData(data);
      }
    }
    
    // Fallback to public CSV if API key is not available
    console.log('🌐 Trying to load data directly from public sheet...');
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0&range=A1:AF10000`;
    const csvResponse = await fetch(csvUrl, {
      headers: {
        'Accept': 'text/csv',
        'Cache-Control': 'max-age=120'
      }
    });
    
    if (csvResponse.ok) {
      const csvText = await csvResponse.text();
      console.log('✅ CSV response received, length:', csvText.length);
      
      // Cache the CSV response
      responseCache = { csvText };
      lastCacheTime = now;
      
      return processCSVData(csvText);
    }
    
    throw new Error('Cannot load data from sheet');
  } catch (error) {
    console.error('❌ Error loading data from Google Sheets:', error);
    console.log('❌ No fallback data - throwing error');
    throw new Error(`Failed to load data from Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Separate function to process API response data
function processPropertiesData(data: any): any[] {
  console.log('🔍 Processing API data...');
  
  const rows = data.values;
  
  if (!rows || rows.length <= 1) {
    console.log('❌ אין נתונים בגיליון או רק כותרות');
    return [];
  }
  
  // Log fetched data details
  console.log('📊 Rows fetched:', rows.length);
  
  // יצירת מיפוי עמודות מהכותרת
  const headers = rows[0];
  columnMapping = findColumnMapping(headers);
  columnMappingCached = true;
  
  console.log(`📊 סה"כ שורות בגיליון: ${rows.length} (כולל כותרת)`);
  
  const properties = rows.slice(1)
    .map((row: any[], index: number) => createPropertyObject(row, index))
    .filter(property => property !== null && isValidProperty(property));
  
  console.log(`✅ נטענו ${properties.length} נכסים תקינים מתוך ${rows.length - 1} שורות`);
  
  return properties;
}

// Separate function to process CSV data
function processCSVData(csvText: string): any[] {
  console.log('🔍 Processing CSV data, length:', csvText.length);
  
  const allRows = csvText.split('\n').map(row => {
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    const len = row.length;
    for (let i = 0; i < len; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  });
  
  const rows = allRows.filter(row => row.length > 1 && row.some(cell => cell && cell.trim() !== ''));
  
  if (rows.length > 1) {
    // Log fetched data details
    console.log('📊 CSV Rows fetched:', rows.length);
    console.log('📊 CSV Headers:', rows[0]);
    
    // Validate and log distinct values for filter columns
    console.log('🔍 === CSV FILTER VALIDATION ===');
    console.log('Status options (Column 2):', distinctValues(rows.slice(1), 1));
    console.log('City options (Column 3):', distinctValues(rows.slice(1), 2));
    console.log('Neighborhood options (Column 8):', distinctValues(rows.slice(1), 7));
    console.log('Property Type options (Column 14):', distinctValues(rows.slice(1), 13));
    console.log('Rooms options (Column 4):', distinctValues(rows.slice(1), 3));
    console.log('🔍 === END CSV VALIDATION ===');
    
    // יצירת מיפוי עמודות מהכותרת
    const headers = rows[0];
    columnMapping = findColumnMapping(headers);
    columnMappingCached = true;
    
    console.log(`📊 CSV: סה"כ שורות ${rows.length} (כולל כותרת)`);
    
    const properties = rows.slice(1)
      .map((row: string[], index: number) => createPropertyObject(row, index))
      .filter(property => property !== null && isValidProperty(property));
    
    console.log(`✅ CSV: נטענו ${properties.length} נכסים תקינים`);
    
    // Log first few properties for debugging
    if (properties.length > 0) {
      console.log('🔍 First CSV property sample:', {
        id: properties[0].id,
        status: properties[0].סטטוס,
        city: properties[0].עיר,
        project: properties[0].פרויקט
      });
    }
    
    return properties;
  }
  
  return [];
}

// Optimized property object creation with physical column mapping
function createPropertyObject(row: any[], index: number): any {
  // ✅ בדיקה בסיסית שהשורה קיימת ויש לה מספיק עמודות
  if (!row || row.length < 10) {
    console.log(`⚠️ שורה ${index + 2}: לא מספיק עמודות (${row ? row.length : 0})`);
    return null;
  }
  
  // דיבוג מיוחד לשורות הראשונות
  if (index < 3) {
    console.log(`🔍 === דיבוג שורה ${index + 2} ===`);
    console.log(`📊 אורך השורה: ${row.length} עמודות`);
    console.log(`🏙️ עמודה 3 (עיר): "${row[2]}"`);
    console.log(`🏘️ עמודה 8 (שכונה): "${row[7]}"`);
    console.log(`📊 עמודה 2 (סטטוס): "${row[1]}"`);
    console.log(`🏠 עמודה 14 (סוג נכס): "${row[13]}"`);
  }
  
  // פונקציה לגיאוקודינג כתובת (fallback)
  const geocodeAddress = async (address: string): Promise<{lat: number | null, lng: number | null}> => {
    if (!address || address.trim() === '') return { lat: null, lng: null };
    
    try {
      // נסה עם Nominatim (חינמי)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Israel')}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        
        // בדיקת טווח לישראל
        if (lat >= 29.5 && lat <= 33.5 && lng >= 34.0 && lng <= 36.0) {
          console.log(`🌍 Geocoded "${address}": ${lat}, ${lng}`);
          return { lat, lng };
        }
      }
    } catch (error) {
      console.warn(`⚠️ Geocoding failed for "${address}":`, error);
    }
    
    return { lat: null, lng: null };
  };
  
  // פונקציה לטיפול בקואורדינטות עם ניקוי וולידציה
  const parseCoordinate = (value: any, type: 'latitude' | 'longitude'): number | null => {
    if (!value || value === '' || value === 'undefined' || value === 'null' || value === 'NaN') {
      return null;
    }
    
    let cleanValue = String(value).trim();
    
    // ניקוי תווים מיוחדים
    cleanValue = cleanValue.replace(/[^\d.-]/g, '');
    
    // אם אין ערך אחרי הניקוי
    if (!cleanValue) return null;
    
    const parsed = parseFloat(cleanValue);
    
    // בדיקה שהפרסור הצליח
    if (isNaN(parsed)) return null;
    
    // בדיקת טווח לישראל
    if (type === 'latitude') {
      return (parsed >= 29.5 && parsed <= 33.5) ? parsed : null;
    } else {
      return (parsed >= 34.0 && parsed <= 36.0) ? parsed : null;
    }
  };
  
  // ✅ קריאת קואורדינטות - קודם X,Y ואז כתובת
  let latitude = parseCoordinate(getValueFromRow(row, 'latitude', null), 'latitude');
  let longitude = parseCoordinate(getValueFromRow(row, 'longitude', null), 'longitude');
  
  // אם לא נמצאו קואורדינטות, נסה לחלץ מכתובת
  if ((latitude === null || longitude === null)) {
    const addressValue = getValueFromRow(row, 'כתובת_למפה', '');
    if (addressValue && addressValue.trim() !== '') {
      console.log(`🔍 נכס ${index + 2}: לא נמצאו קואורדינטות, יש כתובת: "${addressValue}"`);
      // נשמור את הכתובת לשימוש במפה
    }
  }
  
  // ✅ קריאה ישירה מהעמודות הפיזיות עם המיפוי החדש
  const property = {
    id: getValueFromRow(row, 'id_column', '') || (index + 1).toString(),
    פרויקט: getValueFromRow(row, 'פרויקט', ''),
    סטטוס: getValueFromRow(row, 'סטטוס', ''),
    עיר: getValueFromRow(row, 'עיר', ''),
    מספר_חדרים: parseFloat(getValueFromRow(row, 'מספר_חדרים', '0')) || 0,
    שטח_דירה: parseFloat(getValueFromRow(row, 'שטח_דירה', '0')) || 0,
    שטח_מרפסת: parseFloat(getValueFromRow(row, 'שטח_מרפסת', '0')) || 0,
    מחיר_מבוקש: parseFloat(getValueFromRow(row, 'מחיר_מבוקש', '0')) || 0,
    שכונה: getValueFromRow(row, 'שכונה', ''),
    סוג_חניה: getValueFromRow(row, 'סוג_חניה', ''),
    כמות_חניות: parseInt(getValueFromRow(row, 'כמות_חניות', '0')) || 0,
    שטח_גינה: parseFloat(getValueFromRow(row, 'שטח_גינה', '0')) || 0,
    
    // ✅ תמונה ראשית
    תמונה_נכס_ראשית: getValueFromRow(row, 'תמונה_אפליקציה', '') || 
                       getValueFromRow(row, 'תמונה_נכס_ראשית', '') ||
                       'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800',
    
    שם_הנכס_שיוצג_באתר: getValueFromRow(row, 'שם_הנכס_שיוצג_באתר', `נכס ${index + 1}`),
    סוג_נכס: getValueFromRow(row, 'סוג_נכס', ''),
    מגייס: getValueFromRow(row, 'מגייס', ''),
    קומה: parseInt(getValueFromRow(row, 'קומה', '0')) || 0,
    מספר_דירה: getValueFromRow(row, 'מספר_דירה', ''),
    תכנית_דירה: getValueFromRow(row, 'תכנית_דירה', ''),
    רחוב: getValueFromRow(row, 'רחוב', ''),
    מספר_בניין: getValueFromRow(row, 'מספר_בניין', ''),
    
    // ✅ קואורדינטות מעמודות X,Y או מכתובת W
    latitude: latitude,
    longitude: longitude,
    
    // ✅ תאריכים ומידע נוסף
    נוצר_בתאריך: getValueFromRow(row, 'נוצר_בתאריך', ''),
    עודכן_בתאריך: getValueFromRow(row, 'עודכן_בתאריך', ''),
    ימים_במרקט: calculateDaysInMarket(getValueFromRow(row, 'נוצר_בתאריך', '')),
    
    // ✅ סוג עסקה
    סוג_עסקה: getValueFromRow(row, 'סוג_עסקה', ''),
    
    // ✅ תיאורים
    אודות_הנכס: getValueFromRow(row, 'אודות_הנכס', ''),
    תיאור_הנכס: getValueFromRow(row, 'תיאור_הנכס', ''),
    
    // ✅ שדות בוליאניים
    מעלית: convertToBoolean(getValueFromRow(row, 'מעלית', '')),
    מחסן: convertToBoolean(getValueFromRow(row, 'מחסן', '')),
    
    // Default values
    description: getValueFromRow(row, 'תיאור_הנכס', '') || 
                getValueFromRow(row, 'אודות_הנכס', '') ||
                getValueFromRow(row, 'שם_הנכס_שיוצג_באתר', `נכס ${index + 1}`),
    gallery: [
      getValueFromRow(row, 'תמונה_אפליקציה', ''),
      getValueFromRow(row, 'תמונה_נכס_ראשית', '')
    ].filter(img => img && img.trim() !== ''),
    phone: '+972-50-000-0000',
    pdfLink: getValueFromRow(row, 'תכנית_דירה', '#'),
    fireberryId: getValueFromRow(row, 'id_column', '') || (index + 1).toString(),
    fireberryCardUrl: '',
    lastUpdated: new Date(),
    rowIndex: index + 2,
    כתובת_למפה: getValueFromRow(row, 'כתובת_למפה', '') || 
                 `${getValueFromRow(row, 'רחוב', '')} ${getValueFromRow(row, 'מספר_בניין', '')}, ${getValueFromRow(row, 'שכונה', '')}, ${getValueFromRow(row, 'עיר', '')}`.trim(),
    
    // דגל לציון שצריך geocoding
    needsGeocoding: (latitude === null || longitude === null) && 
                   (getValueFromRow(row, 'כתובת_למפה', '') || 
                    getValueFromRow(row, 'רחוב', ''))
  };
  
  // 🔍 דיבוג מיוחד לשורה 3
  if (index === 1) { // שורה 3 בגיליון = index 1
    console.log(`🔍 === דיבוג שורה 3 (index ${index}) ===`);
    console.log(`📊 אורך השורה: ${row.length} עמודות`);
    console.log(`📊 עמודה 2 (Status) ערך גולמי: "${row[1]}" (type: ${typeof row[1]})`);
    console.log(`📊 עמודה 2 אחרי String(): "${String(row[1])}"`);
    console.log(`📊 עמודה 2 אחרי trim(): "${String(row[1]).trim()}"`);
    console.log(`📊 סטטוס parsed: "${getValueFromRow(row, 'סטטוס', 'לא נמצא')}"`);
    console.log(`📊 סטטוס סופי בנכס: "${property.סטטוס}"`);
    console.log(`🏠 עמודה 5 (Apartment Size) ערך גולמי: "${row[4]}"`);
    console.log(`🏠 שטח דירה parsed: ${parseFloat(getValueFromRow(row, 'שטח_דירה', '0'))}`);
    console.log(`🏠 שטח דירה סופי: ${property.שטח_דירה}`);
    console.log(`📍 עמודת 24/Latitude: "${getValueFromRow(row, 'latitude', 'לא נמצא')}"`);
    console.log(`📍 עמודת 25/Longitude: "${getValueFromRow(row, 'longitude', 'לא נמצא')}"`);
    console.log(`📍 עמודת 22/Map Address: "${getValueFromRow(row, 'כתובת_למפה', 'לא נמצא')}"`);
    console.log(`📍 קואורדינטות מפורסרות: lat=${property.latitude}, lng=${property.longitude}`);
    console.log(`📍 תוצג במפה: ${property.latitude !== null && property.longitude !== null ? 'כן' : 'לא'}`);
    console.log(`🔍 === סיום דיבוג שורה 3 ===`);
  }
  
  // ✅ לוג לשורות הראשונות לבדיקה
  if (index < 5) {
    console.log(`📊 שורה ${index + 2}:`, {
      'Project': property.פרויקט,
      'Status': `"${property.סטטוס}" (מעמודה 2/Status: "${row[1]}")`,
      'City': property.עיר,
      'Neighborhood': property.שכונה,
      'Apartment Size': property.שטח_דירה,
      'Recruiter': property.מגייס,
      latitude: property.latitude,
      longitude: property.longitude,
      'Map Address': property.כתובת_למפה,
      יוצג_במפה: property.latitude !== null && property.longitude !== null
    });
  }
  
  return property;
}

// Optimized property validation
function isValidProperty(property: any): boolean {
  // ✅ בדיקה בסיסית - רק שהשורה לא ריקה לגמרי
  const hasAnyData = property.שם_הנכס_שיוצג_באתר ||
                     property.עיר ||
                     property.פרויקט ||
                     property.מחיר_מבוקש > 0;

  return hasAnyData;
}

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPropertiesFromGoogleSheets();
      setProperties(data);
      setLastSyncTime(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (!autoSyncEnabled) return;
    const interval = setInterval(fetchProperties, 120000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, fetchProperties]);

  const toggleFeatured = useCallback((propertyId: string) => {
    setProperties(prev => prev.map(p =>
      p.id === propertyId ? { ...p, featured: !p.featured } : p
    ));
  }, []);

  const toggleSelectedForClient = useCallback((propertyId: string) => {
    setSelectedProperties(prev => {
      const property = properties.find(p => p.id === propertyId);
      if (!property) return prev;

      const isSelected = prev.some(p => p.id === propertyId);
      if (isSelected) {
        return prev.filter(p => p.id !== propertyId);
      } else {
        return [...prev, property];
      }
    });
  }, [properties]);

  const clearClientSelections = useCallback(() => {
    setSelectedProperties([]);
  }, []);

  const toggleAutoSync = useCallback(() => {
    setAutoSyncEnabled(prev => !prev);
  }, []);

  const filterOptions = useMemo(() => {
    const cities = [...new Set(properties.map(p => p.עיר).filter(Boolean))].sort();
    const neighborhoods = [...new Set(properties.map(p => p.שכונה).filter(Boolean))].sort();
    const propertyTypes = [...new Set(properties.map(p => p.סוג_נכס).filter(Boolean))].sort();
    const agents = [...new Set(properties.map(p => p.מגייס).filter(Boolean))].sort();
    const projects = [...new Set(properties.map(p => p.פרויקט).filter(Boolean))].sort();
    const statuses = [...new Set(properties.map(p => p.סטטוס).filter(Boolean))].sort();

    return { cities, neighborhoods, propertyTypes, agents, projects, statuses };
  }, [properties]);

  const filteredProperties = useCallback((filters: FilterState) => {
    return properties.filter(property => {
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const searchableText = `${property.שם_הנכס_שיוצג_באתר} ${property.עיר} ${property.שכונה} ${property.רחוב}`.toLowerCase();
        if (!searchableText.includes(searchLower)) return false;
      }

      if (filters.עיר?.length && !filters.עיר.includes(property.עיר)) return false;
      if (filters.שכונה?.length && !filters.שכונה.includes(property.שכונה)) return false;
      if (filters.מספר_חדרים?.length && !filters.מספר_חדרים.includes(property.מספר_חדרים?.toString())) return false;
      if (filters.סוג_נכס?.length && !filters.סוג_נכס.includes(property.סוג_נכס)) return false;
      if (filters.סטטוס && property.סטטוס !== filters.סטטוס) return false;
      if (filters.מגייס && property.מגייס !== filters.מגייס) return false;
      if (filters.פרויקט?.length && !filters.פרויקט.includes(property.פרויקט)) return false;

      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        if (property.מחיר_מבוקש < min || property.מחיר_מבוקש > max) return false;
      }

      if (filters.roomsRange) {
        const [min, max] = filters.roomsRange;
        if (property.מספר_חדרים < min || property.מספר_חדרים > max) return false;
      }

      if (filters.floorRange) {
        const [min, max] = filters.floorRange;
        if (property.קומה < min || property.קומה > max) return false;
      }

      if (filters.areaRange) {
        const [min, max] = filters.areaRange;
        if (property.שטח_דירה < min || property.שטח_דירה > max) return false;
      }

      return true;
    });
  }, [properties]);

  return {
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
  };
}