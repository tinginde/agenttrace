import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../data/traces.db');
export const db = new Database(dbPath);

export function initializeDatabase() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS reasoning_traces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      experiment_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      thought TEXT NOT NULL,
      action TEXT,
      observation TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
