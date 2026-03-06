import express from 'express';
import { db } from '../db/schema';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/logs', (req, res) => {
    const defaultLimit = 100;
    try {
        const stmt = db.prepare(`SELECT * FROM reasoning_traces ORDER BY timestamp DESC LIMIT ?`);
        const traces = stmt.all(defaultLimit);
        res.json({ success: true, count: traces.length, data: traces });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/logs/:experimentId', (req, res) => {
    try {
        const stmt = db.prepare(`SELECT * FROM reasoning_traces WHERE experiment_id = ? ORDER BY step_number ASC`);
        const traces = stmt.all(req.params.experimentId);
        res.json({ success: true, count: traces.length, data: traces });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
