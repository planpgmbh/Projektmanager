import React, { createContext, useContext, useState, useCallback } from 'react';
import { Customer, Contact } from '../types';

interface CustomerContextType {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  addContact: (customerId: string, contact: Omit<Contact, 'id'>) => void;
  updateContact: (customerId: string, contactId: string, data: Partial<Contact>) => void;
  deleteContact: (customerId: string, contactId: string) => void;
}

const CustomerContext = createContext<CustomerContextType | null>(null);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const addCustomer = useCallback((customerData: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Math.random().toString(),
      contacts: []
    };
    setCustomers(prev => [...prev, newCustomer]);
  }, []);

  const updateCustomer = useCallback((id: string, data: Partial<Customer>) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === id ? { ...customer, ...data } : customer
      )
    );
  }, []);

  const addContact = useCallback((customerId: string, contactData: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      ...contactData,
      id: Math.random().toString()
    };
    
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === customerId
          ? { ...customer, contacts: [...(customer.contacts || []), newContact] }
          : customer
      )
    );
  }, []);

  const updateContact = useCallback((customerId: string, contactId: string, data: Partial<Contact>) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === customerId
          ? {
              ...customer,
              contacts: customer.contacts?.map(contact =>
                contact.id === contactId ? { ...contact, ...data } : contact
              )
            }
          : customer
      )
    );
  }, []);

  const deleteContact = useCallback((customerId: string, contactId: string) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === customerId
          ? {
              ...customer,
              contacts: customer.contacts?.filter(contact => contact.id !== contactId)
            }
          : customer
      )
    );
  }, []);

  return (
    <CustomerContext.Provider value={{
      customers,
      setCustomers,
      addCustomer,
      updateCustomer,
      addContact,
      updateContact,
      deleteContact
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
}