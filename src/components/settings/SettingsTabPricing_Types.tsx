export interface PriceItem {
  id: string;
  ordernum: number;
  name: string;
  hourlyRate: number;
  dailyRate: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}