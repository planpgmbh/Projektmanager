import { Express } from 'express';

export function setupOrderRoutes(app: Express, SEVDESK_API: string, AUTH_HEADER: any) {
  app.get('/api/orders', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Order`, { headers: AUTH_HEADER });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen der Aufträge' });
    }
  });

  app.get('/api/orders/:id', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Order/${req.params.id}`, { headers: AUTH_HEADER });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen des Auftrags' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Order`, {
        method: 'POST',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Erstellen des Auftrags' });
    }
  });

  app.put('/api/orders/:id', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Order/${req.params.id}`, {
        method: 'PUT',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Auftrags' });
    }
  });

  app.delete('/api/orders/:id', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Order/${req.params.id}`, {
        method: 'DELETE',
        headers: AUTH_HEADER
      });
      if (!response.ok) throw new Error(`${response.status}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Löschen des Auftrags' });
    }
  });
}