import { Express } from 'express';

export function setupInvoiceRoutes(app: Express, SEVDESK_API: string, AUTH_HEADER: any) {
  app.get('/api/invoices', async (req, res) => {
    try {
      const query = new URLSearchParams({ embed: 'contact' });

      // richtiges Mapping für den Filter
      const rawId = req.query['contact[id]'];
      if (rawId && typeof rawId === 'string') {
        query.set('search[contact][id]', rawId);
      }

      const response = await fetch(`${SEVDESK_API}/Invoice?${query.toString()}`, {
        headers: AUTH_HEADER
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Fehler beim Abrufen der Rechnungen' });
    }
  });

  app.get('/api/invoices/:id', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Invoice/${req.params.id}?embed=contact`, {
        headers: AUTH_HEADER
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invoice: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ error: 'Fehler beim Abrufen der Rechnung' });
    }
  });

  // New route to create invoice from order
  app.post('/api/invoices/createFromOrder', async (req, res) => {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const response = await fetch(`${SEVDESK_API}/Invoice/Factory/createInvoiceFromOrder`, {
        method: 'POST',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            id: orderId,
            objectName: 'Order'
          },
          partialType: 'RE'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SevDesk API error:', errorText);
        throw new Error(`Failed to create invoice from order: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error creating invoice from order:', error);
      res.status(500).json({ error: 'Fehler beim Erstellen der Rechnung aus dem Angebot' });
    }
  });
}