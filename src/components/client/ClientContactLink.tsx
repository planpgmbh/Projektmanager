import React from 'react';
import { Contact } from '../../types';

interface ClientContactLinkProps {
  contact: Contact;
  onContactClick: (contact: Contact) => void;
}

const ClientContactLink: React.FC<ClientContactLinkProps> = ({ contact, onContactClick }) => {
  return (
    <button 
      onClick={() => onContactClick(contact)} 
      className="text-gray-700 hover:text-gray-900 text-left"
    >
      {contact.surename || ''} {contact.familyname || ''}
    </button>
  );
};

export default ClientContactLink;