export interface Property {
  id: string;
  שם_הנכס_שיוצג_באתר: string;
  description: string;
  תמונה_נכס_ראשית: string;
  gallery: string[];
  מחיר_מבוקש: number;
  עיר: string;
  שכונה: string;
  פרויקט: string;
  מספר_חדרים: number;
  שטח_דירה: number;
  שטח_מרפסת: number;
  שטח_גינה: number;
  שטח_מרתף?: number;
  סוג_נכס: string;
  סטטוס: 'זמין' | 'נמכר' | 'שמור' | 'בבנייה';
  מגייס: string;
  phone: string;
  pdfLink: string;
  סוג_חניה: string;
  כמות_חניות: number;
  קומה: number;
  מספר_דירה: string;
  תכנית_דירה: string;
  רחוב: string;
  מספר_בניין: string;
  כתובת_למפה: string;
  latitude?: number | null;
  longitude?: number | null;
  featured?: boolean;
  selectedForClient?: boolean;
  fireberryId?: string;
  fireberryCardUrl?: string;
  lastUpdated?: Date;
  rowIndex?: number;
  // עמודות חדשות
  נוצר_בתאריך?: string;
  ימים_במרקט?: number;
  סוג_עסקה?: string; // מכירה / השכרה
  אודות_הנכס?: string;
  מעלית?: string;
  מחסן?: string;
  תיאור_הנכס?: string;
  עודכן_בתאריך?: string;
}

export interface SearchResult {
  property: Property;
  matchedFields: string[];
  score: number;
}

export interface FilterState {
  searchText: string;
  עיר: string[];
  שכונה: string[];
  מספר_חדרים: string[];
  סוג_נכס: string[];
  סטטוס: string;
  מגייס: string;
  פרויקט: string[];
  priceRange: [number, number];
  roomsRange: [number, number];
  floorRange: [number, number];
  areaRange: [number, number];
}

export type SortField = 'מחיר_מבוקש' | 'שכונה' | 'שטח_דירה' | 'מספר_חדרים' | 'עיר' | 'קומה';
export type SortDirection = 'asc' | 'desc';