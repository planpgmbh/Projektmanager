import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PriceItem {
  id: string;
  name: string;
  hourlyRate: number;
  dailyRate: number;
  ordernum: number;
}

export function usePriceItemsData() {
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    }, (error) => {
      console.error('Error fetching price items:', error);
      setError('Fehler beim Laden der Preispositionen');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    priceItems,
    isLoading,
    error
  };
}