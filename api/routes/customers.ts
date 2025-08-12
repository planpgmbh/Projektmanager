import { Express } from 'express';

export function setupCustomerRoutes(app: Express, SEVDESK_API: string, AUTH_HEADER: any) {
  app.get('/api/customers', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Contact`, { headers: AUTH_HEADER });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen der Kunden' });
    }
  });

  app.get('/api/nextCustomerNumber', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Contact/Factory/getNextCustomerNumber`, {
        headers: AUTH_HEADER
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.json({ value: data.objects });
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen der nächsten Kundennummer' });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Contact`, {
        method: 'POST',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Erstellen des Kunden' });
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Contact/${req.params.id}`, {
        method: 'PUT',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Kunden' });
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Contact/${req.params.id}`, {
        method: 'DELETE',
        headers: AUTH_HEADER
      });
      if (!response.ok) throw new Error(`${response.status}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Löschen des Kunden' });
    }
  });
}