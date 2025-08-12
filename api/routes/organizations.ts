import { Express } from 'express';

export function setupOrganizationRoutes(app: Express, SEVDESK_API: string, AUTH_HEADER: any) {
  app.get('/api/organization/:orgId/persons', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/Contact?parent[id]=${req.params.orgId}&parent[objectName]=Contact&depth=1`, {
        headers: AUTH_HEADER
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen der Personen' });
    }
  });

  app.post('/api/contact', async (req, res) => {
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
      res.status(500).json({ error: 'Fehler beim Erstellen des Kontakts' });
    }
  });

  app.post('/api/contactAddress', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/ContactAddress`, {
        method: 'POST',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Anlegen der Adresse' });
    }
  });

  app.post('/api/communicationWay', async (req, res) => {
    try {
      const response = await fetch(`${SEVDESK_API}/CommunicationWay`, {
        method: 'POST',
        headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Speichern der Kommunikationsdaten' });
    }
  });
}