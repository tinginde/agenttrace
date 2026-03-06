import { db } from '../db/schema';

export class ConsistencyAnalyzer {
    public analyzeExperiment(experimentId: string): boolean {
        const stmt = db.prepare(`
      SELECT * FROM reasoning_traces 
      WHERE experiment_id = ? 
      ORDER BY step_number ASC
    `);

        const traces = stmt.all(experimentId) as any[];

        console.log(`\n[Analyzer] Analyzing consistency for ${experimentId}`);
        if (traces.length === 0) {
            console.log("No traces found.");
            return false;
        }

        let isConsistent = true;
        for (let i = 1; i < traces.length; i++) {
            const prev = traces[i - 1];
            const current = traces[i];

            // Simple mock heuristic: if previous action was finding something, there should be an observation
            if (prev.action && prev.action.startsWith("Search") && !current.observation) {
                console.warn(`Inconsistency detected at step ${current.step_number}: Missing observation after Search.`);
                isConsistent = false;
            }
        }

        if (isConsistent) {
            console.log(`[Analyzer] Experiment ${experimentId} reasoning trace appears consistent.`);
        }

        return isConsistent;
    }
}
