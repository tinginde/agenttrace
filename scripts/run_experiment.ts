import { initializeDatabase } from '../src/db/schema';
import { ExperimentRunner } from '../src/probes/experiment_runner';
import { ConsistencyAnalyzer } from '../src/analysis/analyzer';

async function main() {
    // 1. Initialize
    console.log("Initializing database...");
    initializeDatabase();

    // 2. Run Experiment
    const runner = new ExperimentRunner();
    const experimentId = await runner.runProbingExperiment("What is the capital of France?");

    // 3. Analyze Reasoning
    const analyzer = new ConsistencyAnalyzer();
    analyzer.analyzeExperiment(experimentId);

    console.log("\nExperiment flow complete! You can start the API with 'npm run start:api' to view logs.");
}

main().catch(console.error);
