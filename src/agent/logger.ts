import { db } from '../db/schema';

export interface TraceEntry {
    experimentId: string;
    stepNumber: number;
    thought: string;
    action?: string;
    observation?: string;
}

export class ReasoningLogger {
    constructor() { }

    public logTrace(entry: TraceEntry) {
        const stmt = db.prepare(`
      INSERT INTO reasoning_traces (experiment_id, step_number, thought, action, observation)
      VALUES (@experimentId, @stepNumber, @thought, @action, @observation)
    `);

        stmt.run({
            experimentId: entry.experimentId,
            stepNumber: entry.stepNumber,
            thought: entry.thought,
            action: entry.action || null,
            observation: entry.observation || null
        });
        console.log(`[Logger] Saved trace step ${entry.stepNumber} for experiment ${entry.experimentId}`);
    }
}
