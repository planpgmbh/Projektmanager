import { createContext } from 'react';
import { User } from './SettingsTabPricing_Types';

interface PricingContextType {
  users: User[];
  editingNameId: string | null;
  editingHourlyRateId: string | null;
  editingDailyRateId: string | null;
  editingItemName: string;
  editingHourlyRate: string;
  editingDailyRate: string;
  handleItemNameEdit: (itemId: string, newName: string) => void;
  handleHourlyRateEdit: (itemId: string, newRate: string) => void;
  handleDailyRateEdit: (itemId: string, newRate: string) => void;
  setEditingNameId: (id: string | null) => void;
  setEditingHourlyRateId: (id: string | null) => void;
  setEditingDailyRateId: (id: string | null) => void;
  setEditingItemName: (name: string) => void;
  setEditingHourlyRate: (rate: string) => void;
  setEditingDailyRate: (rate: string) => void;
  formatCurrency: (amount: number) => string;
}

export const PricingContext = createContext<PricingContextType>({
  users: [],
  editingNameId: null,
  editingHourlyRateId: null,
  editingDailyRateId: null,
  editingItemName: '',
  editingHourlyRate: '',
  editingDailyRate: '',
  handleItemNameEdit: () => {},
  handleHourlyRateEdit: () => {},
  handleDailyRateEdit: () => {},
  setEditingNameId: () => {},
  setEditingHourlyRateId: () => {},
  setEditingDailyRateId: () => {},
  setEditingItemName: () => {},
  setEditingHourlyRate: () => {},
  setEditingDailyRate: () => {},
  formatCurrency: () => ''
});