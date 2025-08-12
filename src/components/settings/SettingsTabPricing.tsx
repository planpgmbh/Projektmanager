import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PriceItem } from './SettingsTabPricing_Types';
import { PricingContext } from './SettingsTabPricing_Context';
import PricelistItem from './PricelistItem';
import { SearchBar } from '../ui/SearchBar';
import { CustomScrollbar } from '../ui/CustomScrollbar';

function SettingsTabPricing() {
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingHourlyRateId, setEditingHourlyRateId] = useState<string | null>(null);
  const [editingDailyRateId, setEditingDailyRateId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [editingHourlyRate, setEditingHourlyRate] = useState('');
  const [editingDailyRate, setEditingDailyRate] = useState('');

  useEffect(() => {
    const priceItemsQuery = query(
      collection(db, 'settings/basicpricelist/priceitems'),
      orderBy('ordernum')
    );

    const unsubscribe = onSnapshot(priceItemsQuery, (snapshot) => {
      const priceItemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PriceItem[];
      setPriceItems(priceItemsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddPriceItem = async () => {
    try {
      const priceItemsRef = collection(db, 'settings/basicpricelist/priceitems');
      const maxOrdernum = priceItems.reduce((max, item) => 
        Math.max(max, item.ordernum || 0), 0);

      await addDoc(priceItemsRef, {
        name: 'Neue Preisposition',
        hourlyRate: 0,
        dailyRate: 0,
        ordernum: maxOrdernum + 1000
      });
    } catch (err) {
      console.error('Fehler beim Hinzufügen der Preisposition:', err);
      setError('Fehler beim Hinzufügen der Preisposition');
    }
  };

  const handleDuplicatePriceItem = async (item: PriceItem) => {
    try {
      const priceItemsRef = collection(db, 'settings/basicpricelist/priceitems');
      const maxOrdernum = priceItems.reduce((max, item) => 
        Math.max(max, item.ordernum || 0), 0);

      const newItem = {
        name: `${item.name} (Kopie)`,
        hourlyRate: item.hourlyRate,
        dailyRate: item.dailyRate,
        ordernum: maxOrdernum + 1000
      };

      await addDoc(priceItemsRef, newItem);
    } catch (err) {
      console.error('Fehler beim Duplizieren der Preisposition:', err);
      setError('Fehler beim Duplizieren der Preisposition');
    }
  };

  const handleDeletePriceItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'settings/basicpricelist/priceitems', itemId));
    } catch (err) {
      console.error('Fehler beim Löschen der Preisposition:', err);
      setError('Fehler beim Löschen der Preisposition');
    }
  };

  const handleItemNameEdit = async (itemId: string, newName: string) => {
    try {
      const itemRef = doc(db, 'settings/basicpricelist/priceitems', itemId);
      await updateDoc(itemRef, { name: newName });
      setEditingNameId(null);
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Namens:', err);
      setError('Fehler beim Aktualisieren des Namens');
    }
  };

  const handleHourlyRateEdit = async (itemId: string, newRate: string) => {
    try {
      const rate = parseFloat(newRate);
      if (isNaN(rate)) return;

      const itemRef = doc(db, 'settings/basicpricelist/priceitems', itemId);
      await updateDoc(itemRef, { hourlyRate: rate });
      setEditingHourlyRateId(null);
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Stundensatzes:', err);
      setError('Fehler beim Aktualisieren des Stundensatzes');
    }
  };

  const handleDailyRateEdit = async (itemId: string, newRate: string) => {
    try {
      const rate = parseFloat(newRate);
      if (isNaN(rate)) return;

      const itemRef = doc(db, 'settings/basicpricelist/priceitems', itemId);
      await updateDoc(itemRef, { dailyRate: rate });
      setEditingDailyRateId(null);
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Tagessatzes:', err);
      setError('Fehler beim Aktualisieren des Tagessatzes');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination || source.index === destination.index) return;

    try {
      const items = Array.from(filteredPriceItems);
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);

      const updates = items.map((item, index) => {
        const ordernum = (index + 1) * 1000;
        return updateDoc(
          doc(db, 'settings/basicpricelist/priceitems', item.id),
          { ordernum }
        );
      });

      await Promise.all(updates);
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Reihenfolge:', err);
      setError('Fehler beim Aktualisieren der Reihenfolge');
    }
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Filter price items based on search term
  const filteredPriceItems = searchTerm
    ? priceItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hourlyRate.toString().includes(searchTerm) ||
        item.dailyRate.toString().includes(searchTerm)
      )
    : priceItems;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <PricingContext.Provider value={{
      users: [],
      editingNameId,
      editingHourlyRateId,
      editingDailyRateId,
      editingItemName,
      editingHourlyRate,
      editingDailyRate,
      handleItemNameEdit,
      handleHourlyRateEdit,
      handleDailyRateEdit,
      setEditingNameId,
      setEditingHourlyRateId,
      setEditingDailyRateId,
      setEditingItemName,
      setEditingHourlyRate,
      setEditingDailyRate,
      formatCurrency
    }}>
      <div className="bg-white rounded-lg shadow min-h-[400px]">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Preisliste
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Verwalten Sie hier Ihre Preisliste
            </p>
          </div>
          <SearchBar
            placeholder="Suche nach Preispositionen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 max-w-md"
          />
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <CustomScrollbar maxHeight="max-h-[600px]">
            {/* Header - Entfernte die 50px Spalte */}
            <div className="grid grid-cols-[1fr_200px_200px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase">Name</div>
              <div className="text-xs font-medium text-gray-500 uppercase text-right">Stundensatz</div>
              <div className="text-xs font-medium text-gray-500 uppercase text-right">Tagessatz</div>
            </div>

            <Droppable droppableId="priceitems">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-h-[50px]"
                >
                  {filteredPriceItems.map((item, index) => (
                    <PricelistItem
                      key={item.id}
                      item={item}
                      index={index}
                      onDuplicate={() => handleDuplicatePriceItem(item)}
                      onDelete={() => handleDeletePriceItem(item.id)}
                    />
                  ))}
                  {provided.placeholder}
                  
                  {filteredPriceItems.length === 0 && searchTerm && (
                    <div className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50">
                      Keine Preispositionen gefunden
                    </div>
                  )}
                </div>
              )}
            </Droppable>

            <div 
              className="px-6 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={handleAddPriceItem}
            >
              <div className="flex items-center gap-2 text-gray-500">
                <Plus size={16} />
                <span>Neue Preisposition hinzufügen</span>
              </div>
            </div>
          </CustomScrollbar>
        </DragDropContext>
      </div>
    </PricingContext.Provider>
  );
}

export default SettingsTabPricing;