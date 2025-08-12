import React, { useState, useEffect, useMemo } from 'react';
import Table from '../ui/Table';
import { Customer, Contact } from '../../types';
import ClientDetails from '../client/ClientDetails';
import AddCustomer from '../client/AddCustomer';
import ItemActionsMenu from '../ui/ItemActionsMenu';
import ClientContact from '../client/ClientContact';
import EditProject from '../projects/EditProject';
import ClientContactLink from '../client/ClientContactLink';
import ClientProjectLink from '../client/ClientProjectLink';
import AddContact from '../client/AddContact';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

function CustomersTabOverview() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerContacts, setCustomerContacts] = useState<{ [customerId: string]: Contact[] }>({});
  const [customerProjects, setCustomerProjects] = useState<{ [customerId: string]: any[] }>({});
  const [addingContactForCustomer, setAddingContactForCustomer] = useState<{id: string, name: string} | null>(null);
  const [newlyCreatedCustomerId, setNewlyCreatedCustomerId] = useState<string | null>(null);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (!response.ok) {
          throw new Error(`Fehler beim Laden der Kunden: ${response.status}`);
        }

        const data = await response.json();
        const organizations = data.objects.filter((contact: any) => 
          contact.category?.id === '3' || contact.category?.id === 3
        );
        setCustomers(organizations);
        setError(null);
      } catch (err) {
        console.error('Fehler beim Laden der Kunden:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Kunden');
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch contacts and projects for each customer
  useEffect(() => {
    if (!customers.length) return;

    const unsubscribers: (() => void)[] = [];

    customers.forEach(customer => {
      // Fetch contacts
      fetch(`/api/organization/${customer.id}/persons`)
        .then(response => response.json())
        .then(data => {
          setCustomerContacts(prev => ({
            ...prev,
            [customer.id]: data.objects || []
          }));
        })
        .catch(error => {
          console.error(`Error fetching contacts for customer ${customer.id}:`, error);
        });

      // Subscribe to projects
      const projectsQuery = query(
        collection(db, 'projects'),
        where('customerId', '==', customer.id)
      );

      const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
        const projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomerProjects(prev => ({
          ...prev,
          [customer.id]: projects
        }));
      });

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [customers]);

  // Auto-open ClientDetails for newly created customer
  useEffect(() => {
    if (newlyCreatedCustomerId && customers.length > 0) {
      const newCustomer = customers.find(c => c.id === newlyCreatedCustomerId);
      if (newCustomer) {
        setSelectedCustomer(newCustomer);
        setNewlyCreatedCustomerId(null);
      }
    }
  }, [newlyCreatedCustomerId, customers]);

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Kunden');
      }

      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
      setError(null);
    } catch (err) {
      console.error('Fehler beim Löschen des Kunden:', err);
      setError('Fehler beim Löschen des Kunden');
    }
  };

  const columns = useMemo(() => [
    {
      header: 'Name',
      accessor: (customer: Customer) => (
        <div 
          className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCustomer(customer);
          }}
        >
          {customer.name}
        </div>
      )
    },
    {
      header: 'Kontakte',
      accessor: (customer: Customer) => (
        <div className="space-y-1">
          {customerContacts[customer.id]?.map((contact) => (
            <div key={contact.id}>
              <ClientContactLink
                contact={contact}
                onContactClick={(contact) => {
                  setSelectedContact(contact);
                  return false;
                }}
              />
            </div>
          ))}
        </div>
      )
    },
    {
      header: 'Projekte',
      accessor: (customer: Customer) => (
        <div className="space-y-1">
          {customerProjects[customer.id]?.filter(project => project.status === 'active').map((project) => (
            <div key={project.id}>
              <ClientProjectLink
                project={project}
                onProjectClick={(project) => {
                  setSelectedProject(project);
                  return false;
                }}
              />
            </div>
          ))}
        </div>
      )
    },
    {
      header: 'Aktionen',
      accessor: (customer: Customer) => (
        <ItemActionsMenu
          onEdit={() => setSelectedCustomer(customer)}
          onDelete={() => handleDeleteCustomer(customer.id)}
          onAddPerson={() => setAddingContactForCustomer({ id: customer.id, name: customer.name })}
          deleteMessage={`Möchten Sie den Kunden "${customer.name}" wirklich löschen?`}
        />
      ),
      className: 'text-right'
    }
  ], [customerContacts, customerProjects]);

  const handleCustomerSaved = async () => {
    setSelectedCustomer(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Kundenliste');
      }
      const data = await response.json();
      const organizations = data.objects.filter((contact: any) => 
        contact.category?.id === '3' || contact.category?.id === 3
      );
      setCustomers(organizations);
      setError(null);
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Kundenliste:', err);
      setError('Fehler beim Aktualisieren der Kundenliste');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewCustomerSaved = async (createdCustomerId?: string) => {
    setIsAddingCustomer(false);
    
    // Store the ID of the newly created customer
    if (createdCustomerId) {
      setNewlyCreatedCustomerId(createdCustomerId);
    }
    
    await handleCustomerSaved();
  };

  const handleContactAdded = async () => {
    setAddingContactForCustomer(null);
    await handleCustomerSaved();
  };

  const searchInContacts = (customer: Customer, searchTerm: string) => {
    const contacts = customerContacts[customer.id] || [];
    return contacts.some(contact => 
      (contact.surename?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (contact.familyname?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <Table
          data={customers}
          columns={columns}
          searchPlaceholder="Suche nach Kunden oder Kontakten..."
          onAddClick={() => setIsAddingCustomer(true)}
          addButtonLabel="Kunde hinzufügen"
          customFilter={(customer, searchTerm) => 
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            searchInContacts(customer, searchTerm)
          }
        />
      </div>

      {isAddingCustomer && (
        <AddCustomer
          onClose={() => setIsAddingCustomer(false)}
          onSave={handleNewCustomerSaved}
        />
      )}

      {selectedCustomer && (
        <ClientDetails
          customer={selectedCustomer}
          onClose={handleCustomerSaved}
        />
      )}

      {selectedContact && (
        <ClientContact
          contactId={selectedContact.id}
          initialData={{ contact: selectedContact }}
          onClose={() => setSelectedContact(null)}
          onSaved={handleCustomerSaved}
        />
      )}

      {selectedProject && (
        <EditProject
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {addingContactForCustomer && (
        <AddContact
          orgId={addingContactForCustomer.id}
          orgName={addingContactForCustomer.name}
          onClose={() => setAddingContactForCustomer(null)}
          onSaved={handleContactAdded}
        />
      )}
    </div>
  );
}

export default CustomersTabOverview;