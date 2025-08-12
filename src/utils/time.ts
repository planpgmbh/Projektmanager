export const parseTimeInput = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  // Handle different formats: "1:30", "1,5", "1.5"
  if (timeStr.includes(':')) {
    const [hours, minutes] = timeStr.split(':').map(s => parseInt(s.trim(), 10));
    if (isNaN(hours)) return 0;
    const mins = isNaN(minutes) ? 0 : Math.min(59, Math.max(0, minutes));
    return hours + (mins / 60);
  }
  
  // Handle decimal formats with comma or dot
  const normalizedStr = timeStr.replace(',', '.');
  return parseFloat(normalizedStr) || 0;
};

export const formatTimeDisplay = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Rundet Stunden auf das nächste 15-Minuten-Intervall auf
 * @param hours - Stunden als Dezimalzahl
 * @returns Aufgerundete Stunden in 15-Minuten-Schritten
 */
export const roundToNext15Minutes = (hours: number): number => {
  if (hours <= 0) return 0;
  
  // Konvertiere zu Minuten
  const totalMinutes = hours * 60;
  
  // Runde auf das nächste 15-Minuten-Intervall auf
  const roundedMinutes = Math.ceil(totalMinutes / 15) * 15;
  
  // Konvertiere zurück zu Stunden
  return roundedMinutes / 60;
};

/**
 * Parst Zeiteingabe und rundet automatisch auf 15-Minuten-Schritte auf
 * @param timeStr - Zeiteingabe als String
 * @returns Aufgerundete Stunden in 15-Minuten-Schritten
 */
export const parseAndRoundTimeInput = (timeStr: string): number => {
  const parsedHours = parseTimeInput(timeStr);
  return roundToNext15Minutes(parsedHours);
};