import { Property } from '../types/Property';

/**
 * חישוב שקלול שטח לפי כללי השקלול
 * @param area השטח במ"ר
 * @returns אחוז השקלול (0-1)
 */
export const calculateAreaWeighting = (area: number): number => {
  if (area <= 0) return 0;
  if (area <= 30) return 0.5;  // 50%
  if (area <= 90) return 0.35; // 35%
  return 0.25; // 25% למעל 90 מ"ר
};

/**
 * חישוב שטח אקווי כולל
 * @param property נתוני הנכס
 * @returns השטח האקווי במ"ר
 */
export const calculateEquivalentArea = (property: Property): number => {
  const baseArea = property.שטח_דירה || 0;
  
  // חישוב שטח מרפסת משוקלל
  const balconyArea = property.שטח_מרפסת || 0;
  const balconyWeighted = balconyArea * calculateAreaWeighting(balconyArea);
  
  // חישוב שטח גינה משוקלל
  const gardenArea = property.שטח_גינה || 0;
  const gardenWeighted = gardenArea * calculateAreaWeighting(gardenArea);
  
  // חישוב שטח מרתף משוקלל (תמיד 50%)
  const basementArea = property.שטח_מרתף || 0;
  const basementWeighted = basementArea * 0.5;
  
  return baseArea + balconyWeighted + gardenWeighted + basementWeighted;
};

/**
 * חישוב מחיר למ"ר אקווי
 * @param property נתוני הנכס
 * @returns מחיר למ"ר אקווי מעוגל
 */
export const calculatePricePerEquivalentSqm = (property: Property): number => {
  const price = property.מחיר_מבוקש || 0;
  const equivalentArea = calculateEquivalentArea(property);
  
  if (equivalentArea <= 0 || price <= 0) return 0;
  
  return Math.round(price / equivalentArea);
};

/**
 * פורמט מחיר למ"ר אקווי לתצוגה
 * @param pricePerSqm מחיר למ"ר
 * @returns מחרוזת מפורמטת
 */
export const formatPricePerSqm = (pricePerSqm: number): string => {
  if (pricePerSqm <= 0) return '-';
  
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pricePerSqm) + '/מ"ר';
};

/**
 * חישוב ממוצע מחיר למ"ר אקווי לשכונה
 * @param properties רשימת כל הנכסים
 * @param neighborhood שם השכונה
 * @returns ממוצע מחיר למ"ר אקווי בשכונה
 */
export const calculateNeighborhoodAverage = (properties: Property[], neighborhood: string): number => {
  if (!neighborhood || !properties.length) return 0;
  
  // סינון נכסים באותה שכונה עם מחיר תקין
  const neighborhoodProperties = properties.filter(property => 
    property.שכונה === neighborhood && 
    calculatePricePerEquivalentSqm(property) > 0
  );
  
  if (neighborhoodProperties.length === 0) return 0;
  
  // חישוב ממוצע
  const totalPrice = neighborhoodProperties.reduce((sum, property) => 
    sum + calculatePricePerEquivalentSqm(property), 0
  );
  
  return Math.round(totalPrice / neighborhoodProperties.length);
};