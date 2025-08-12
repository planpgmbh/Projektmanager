import React, { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink } from 'lucide-react';
import { Popup, PopupFooter } from '../../ui/Popup';
import { Button } from '../../ui/Button';
import AddOrder from '../../orders/AddOrder';

interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  header: string;
  addressName: string;
  sumNet: number;
  orderType: string;
  contactId: string;
}

interface SelectOrCreateOfferPopupProps {
  customerId: string;
  onClose: () => void;
  onSelectOffer: (offerId: string | null, offerNumber: string | null) => void;
  onResetStep?: () => void;
}

function SelectOrCreateOfferPopup({ customerId, onClose, onSelectOffer, onResetStep }: SelectOrCreateOfferPopupProps) {
  const [offers, setOffers] = useState<Order[]>([]);
  const [previousOffers, setPreviousOffers] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  const fetchOffers = async () => {
    try {
      // Speichere die aktuellen Angebote als vorherige Angebote
      if (isAutoRefreshing && offers.length > 0) {
        setPreviousOffers([...offers]);
      }

      const response = await fetch(`/api/orders?contact[id]=${customerId}&contact[objectName]=Contact&orderType=AN`);
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();

      const parsed: Order[] = (data.objects || []).map((o: any) => ({
        id: o.id,
        status: parseInt(o.status, 10),
        orderNumber: o.orderNumber,
        orderDate: o.orderDate,
        header: o.header,
        addressName: o.addressName,
        sumNet: parseFloat(o.sumNet),
        orderType: o.orderType,
        contactId: o.contact?.id
      }));

      // Filter for draft (status 100) and open (status 200) offers
      const filtered = parsed.filter(
        o => o.orderType === 'AN' && 
            o.contactId === customerId && 
            (o.status === 100 || o.status === 200)
      );

      // Prüfe auf neue Angebote nur wenn Auto-Refresh aktiv ist
      if (isAutoRefreshing && previousOffers.length > 0) {
        // Finde neue Angebote, die in filtered aber nicht in previousOffers sind
        const newOffers = filtered.filter(currentOffer => 
          !previousOffers.some(prevOffer => prevOffer.id === currentOffer.id)
        );

        // Wenn ein neues Angebot gefunden wurde, wähle es automatisch aus
        if (newOffers.length > 0) {
          const newestOffer = newOffers[0]; // Nimm das erste neue Angebot
          console.log('Neues Angebot automatisch ausgewählt:', newestOffer);
          
          // Stoppe Auto-Refresh
          setIsAutoRefreshing(false);
          
          // Wähle das neue Angebot aus und schließe das Popup
          onSelectOffer(newestOffer.id, newestOffer.orderNumber);
          onClose();
          return; // Beende die Funktion hier
        }
      }

      setOffers(filtered);
      setError(null);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError('Fehler beim Laden der Angebote');
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchOffers().finally(() => setIsLoading(false));
  }, [customerId]);

  // Auto-refresh when isAutoRefreshing is true
  useEffect(() => {
    if (!isAutoRefreshing) return;

    const interval = setInterval(() => {
      fetchOffers();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoRefreshing, customerId, offers, previousOffers]);

  const filteredOffers = searchTerm
    ? offers.filter(offer =>
        offer.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.header.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : offers;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusLabel = (status: number) => {
    const statusMap: Record<number, string> = {
      100: 'Entwurf',
      200: 'Offen',
      300: 'Abgelehnt',
      500: 'Angenommen',
    };
    return statusMap[status] || status.toString();
  };

  const getStatusColor = (status: number) => {
    const statusColors: Record<number, string> = {
      100: 'bg-gray-100 text-gray-800',
      200: 'bg-yellow-100 text-yellow-800',
      300: 'bg-red-100 text-red-800',
      500: 'bg-green-100 text-green-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleOfferSelect = (offer: Order) => {
    onSelectOffer(offer.id, offer.orderNumber);
    onClose();
  };

  const handleNoOffer = () => {
    onSelectOffer(null, null);
    onClose();
  };

  const handleCreateNewOffer = () => {
    // Setze previousOffers auf die aktuellen Angebote, bevor Auto-Refresh startet
    setPreviousOffers([...offers]);
    
    // Open sevDesk offer creation page in new tab
    window.open('https://my.sevdesk.de/om/edit/type/AN/id/', '_blank');
    
    // Start auto-refreshing to detect new offers
    setIsAutoRefreshing(true);
  };

  const handleOpenOfferInSevDesk = (offerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://my.sevdesk.de/om/edit/type/AN/id/${offerId}`, '_blank');
  };

  const handleCreateOrderSaved = () => {
    setShowCreateOrder(false);
    // Refresh offers list
    fetchOffers();
  };

  return (
    <>
      <Popup
        title="Angebot auswählen oder erstellen"
        onClose={onClose}
        maxWidth="3xl"
        footer={
          <PopupFooter>
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Abbrechen
            </Button>
            <Button
              variant="secondary"
              onClick={handleNoOffer}
            >
              Kein Angebot
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleCreateNewOffer}
            >
              Neues Angebot erstellen
            </Button>
          </PopupFooter>
        }
      >
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {isAutoRefreshing && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-md">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">
                Automatische Aktualisierung aktiv - Suche nach neuen Angeboten...
              </span>
              <button
                onClick={() => setIsAutoRefreshing(false)}
                className="ml-auto text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Stoppen
              </button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Nach Angebotsnummer oder Betreff suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto pr-2">
            {filteredOffers.length > 0 ? (
              <div className="space-y-2">
                {filteredOffers.map((offer) => (
                  <div
                    key={offer.id}
                    onClick={() => handleOfferSelect(offer)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{offer.orderNumber}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(offer.status)}`}>
                            {getStatusLabel(offer.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{offer.header}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(offer.orderDate)} • {formatCurrency(offer.sumNet)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleOpenOfferInSevDesk(offer.id, e)}
                        className="ml-4 px-3 py-2 text-gray-600 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                        title="In sevDesk öffnen"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Zum Angebot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Keine Entwurfs- oder offenen Angebote gefunden' : 'Keine Entwurfs- oder offenen Angebote vorhanden'}
                {isAutoRefreshing && (
                  <p className="text-sm mt-2">
                    Erstellen Sie ein neues Angebot in sevDesk - es wird automatisch hier angezeigt.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Popup>

      {showCreateOrder && (
        <AddOrder
          organizationId={customerId}
          onClose={() => setShowCreateOrder(false)}
          onSave={handleCreateOrderSaved}
        />
      )}
    </>
  );
}

export default SelectOrCreateOfferPopup;