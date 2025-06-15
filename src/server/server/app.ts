import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { initializeSheets } from './services/sheets';
import { setupRoutes } from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

let sheetsInstance: any;

function openBrowser(url: string) {
    const command = process.platform === 'win32' ?
        `start ${url}` :
        process.platform === 'darwin' ?
            `open ${url}` :
            `xdg-open ${url}`;

    exec(command, (error) => {
        if (error) {
            console.error('Failed to open browser:', error);
        }
    });
}

async function initialize() {
    try {
        sheetsInstance = await initializeSheets();
        console.log('Google Sheets API initialized');
        setupRoutes(app, sheetsInstance);

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            openBrowser(`http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize Google Sheets:', error);
        process.exit(1);
    }
}

initialize().catch(error => {
    console.error('Initialization failed:', error);
    process.exit(1);
});