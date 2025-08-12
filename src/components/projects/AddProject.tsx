import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { Customer } from '../../types';
import { Dropdown } from '../ui/Dropdown';

interface AddProjectProps {
  onClose: () => void;
  onSave: () => void;
}

function AddProject({ onClose, onSave }: AddProjectProps) {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', response.status, errorText);
          throw new Error(`Failed to fetch customers: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data || !data.objects) {
          console.warn('Unexpected response format:', data);
          throw new Error('Invalid response format from server');
        }

        const organizations = data.objects.filter((contact: any) => 
          contact.category?.id === '3' || contact.category?.id === 3
        );
        setCustomers(organizations);
        setError(null);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers. Please try again.');
        setCustomers([]);
      }
    };

    fetchCustomers();
  }, []);

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomer(customerId);
    setIsCustomerDropdownOpen(false);
  };

  const getSelectedCustomerName = () => {
    const customer = customers.find(c => c.id === selectedCustomer);
    return customer ? customer.name : 'Kunden auswählen';
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!projectName || !selectedCustomer) {
        setError('Please enter a project name and select a customer.');
        setIsLoading(false);
        return;
      }

      const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
      
      // Create the project
      const projectsCollection = collection(db, 'projects');
      const projectDoc = await addDoc(projectsCollection, {
        name: projectName,
        customerId: selectedCustomer,
        customerName: selectedCustomerData?.name || '',
        customerNumber: selectedCustomerData?.customerNumber || '',
        createdAt: new Date(),
        status: 'active'
      });

      // Create default section
      const sectionsCollection = collection(db, `projects/${projectDoc.id}/sections`);
      const sectionDoc = await addDoc(sectionsCollection, {
        name: 'Beispiel Abschnitt',
        ordernum: 1000
      });

      // Create default task
      const tasksCollection = collection(db, `projects/${projectDoc.id}/tasks`);
      await addDoc(tasksCollection, {
        name: 'Beispiel Aufgabe',
        statusdone: false,
        ordernum: 1000,
        assignto: '',
        date: '',
        effort_total: 0,
        budget_total: 0,
        services: [],
        sectionId: sectionDoc.id
      });

      // Call onSave callback
      onSave();
      
      // Navigate to the project detail page
      navigate(`/projects/${projectDoc.id}`);
      
      // Close the popup
      onClose();
    } catch (err) {
      console.error('Error saving project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Projekt erstellen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projektname <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kunden wählen <span className="text-red-500">*</span>
              </label>
              <Dropdown
                trigger={
                  <div className="w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:border-gray-400 bg-white">
                    {getSelectedCustomerName()}
                  </div>
                }
                isOpen={isCustomerDropdownOpen}
                onOpenChange={setIsCustomerDropdownOpen}
              >
                <div className="py-1">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                        customer.id === selectedCustomer ? 'font-semibold text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {customer.name}
                    </button>
                  ))}
                </div>
              </Dropdown>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !projectName || !selectedCustomer}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Wird erstellt...
              </>
            ) : (
              'Projekt anlegen'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddProject;