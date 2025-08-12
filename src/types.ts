export interface Contact {
  id: string;
  salutation: string;
  title: string;
  firstName: string;
  lastName: string;
  customerNumber: string;
  organization: string;
  additionalName: string;
  email?: string;
  phone?: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
    type: string;
  };
}

export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  location: string;
  contacts?: Contact[];
  addressStreet?: string;
  addressZip?: string;
  addressCity?: string;
  addressCountry?: string;
  email?: string;
}

export interface SevDeskContact {
  id: string;
  objectName: string;
  additionalInformation: null | string;
  create: string;
  update: string;
  name: string;
  status: string;
  customerNumber: string;
  surename: null | string;
  familyname: null | string;
  titel: null | string;
  category: {
    id: string;
    objectName: string;
  };
  description: null | string;
  academicTitle: null | string;
  gender: null | string;
  sevClient: {
    id: string;
    objectName: string;
  };
  name2: null | string;
  birthday: null | string;
  vatNumber: null | string;
  bankAccount: null | string;
  bankNumber: null | string;
  defaultCashbackTime: null | string;
  defaultCashbackPercent: null | string;
  defaultTimeToPay: null | string;
  taxNumber: null | string;
  taxOffice: null | string;
  exemptVat: string;
  taxType: null | string;
  defaultDiscountAmount: null | string;
  defaultDiscountPercentage: string;
  buyerReference: null | string;
  governmentAgency: string;
  defaultShowVat: string;
}

export interface SevDeskResponse {
  objects: SevDeskContact[];
}