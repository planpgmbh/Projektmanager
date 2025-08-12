import { Express } from 'express';

export function setupContactRoutes(app: Express, SEVDESK_API: string, AUTH_HEADER: any) {
  app.get('/api/contact/:id', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Contact/${req.params.id}`, {
        headers: AUTH_HEADER
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen des Kontakts' });
    }
  });

  app.put('/api/contact/:id', async (req, res) => {
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
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Kontakts' });
    }
  });

  app.delete('/api/contact/:id', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Contact/${req.params.id}`, {
        method: 'DELETE',
        headers: AUTH_HEADER
      });
      if (!response.ok) throw new Error(`${response.status}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Löschen des Kontakts' });
    }
  });

  app.get('/api/contactAddress/:contactId', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/ContactAddress?contact[id]=${req.params.contactId}&contact[objectName]=Contact`, {
        headers: AUTH_HEADER
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen der Adresse' });
    }
  });

  app.put('/api/contactAddress/:id', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/ContactAddress/${req.params.id}`, {
        method: 'PUT',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Aktualisieren der Adresse' });
    }
  });

  app.get('/api/communicationWay/:contactId', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/CommunicationWay?contact[id]=${req.params.contactId}&contact[objectName]=Contact`, {
        headers: AUTH_HEADER
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen der Kommunikationswege' });
    }
  });

  app.put('/api/communicationWay/:id', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/CommunicationWay/${req.params.id}`, {
        method: 'PUT',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Kommunikationswegs' });
    }
  });
}