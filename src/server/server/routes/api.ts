import express from 'express';
import { getSensorData } from '../services/sheets';

export function setupRoutes(app: express.Application, sheetsInstance: any) {
    app.get('/api/data', async (req, res) => {
        try {
            const data = await getSensorData(sheetsInstance);
            res.json(data);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Failed to fetch data' });
        }
    });

    // Endpoint to get available plants
    app.get('/api/plants', (req, res) => {
        res.json([
            { id: 'plant1', name: 'Plant 1' },
            { id: 'plant2', name: 'Plant 2' },
            { id: 'plant3', name: 'Plant 3' },
            { id: 'plant4', name: 'Plant 4' }
        ]);
    });
}