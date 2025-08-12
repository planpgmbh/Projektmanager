import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import EditUser from '../users/EditUser';
import { UserRole } from '../../hooks/useUserRole';
import ItemActionsMenu from '../ui/ItemActionsMenu';
import Table from '../ui/Table';

interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

function TeamTabOverview() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      setUsers(usersData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setDeleteError(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setDeleteError('Fehler beim Löschen des Benutzers');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      projektmanager: 'bg-blue-100 text-blue-800',
      nutzer: 'bg-green-100 text-green-800',
      buchhaltung: 'bg-yellow-100 text-yellow-800',
      inaktiv: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.inaktiv;
  };

  const columns = [
    {
      header: 'Name',
      accessor: (user: User) => (
        <div 
          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUser(user);
          }}
        >
          {user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : '-'}
        </div>
      )
    },
    {
      header: 'E-Mail',
      accessor: (user: User) => (
        <div className="text-sm text-gray-900">{user.email}</div>
      )
    },
    {
      header: 'Rolle',
      accessor: (user: User) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
          {user.role}
        </span>
      )
    },
    {
      header: 'Aktionen',
      accessor: (user: User) => (
        <ItemActionsMenu
          onEdit={() => setSelectedUser(user)}
          onDelete={() => handleDeleteUser(user.id)}
          deleteMessage="Möchten Sie diesen Benutzer wirklich löschen?"
        />
      ),
      className: 'text-right'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {deleteError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {deleteError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <Table
          data={users}
          columns={columns}
          searchPlaceholder="Suche nach Namen oder E-Mail..."
          searchKeys={['firstName', 'lastName', 'email', 'role']}
          onAddClick={() => setSelectedUser({ id: '', email: '', role: 'nutzer' })}
          addButtonLabel="Benutzer hinzufügen"
          onRowClick={(user) => setSelectedUser(user)}
        />
      </div>

      {selectedUser && (
        <EditUser
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

export default TeamTabOverview;