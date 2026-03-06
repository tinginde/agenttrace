# LLM Agent Explainability Platform

## Research Goal
The primary research goal of this platform is to facilitate LLM interpretability and reasoning trace analysis. As LLMs are increasingly deployed as autonomous agents, understanding their internal step-by-step reasoning processes and verifying their consistency becomes critical. This platform provides tools to probe agent states, log detailed reasoning traces, store them in a structured database, and systematically analyze them for consistency and intermediate reasoning breakdowns.

## Components
- **Agent Logger**: Captures internal reasoning traces and actions during agent execution (`src/agent`).
- **SQLite Database**: Structured storage for agent logs and experiment results (`src/db`).
- **Probing Experiment Runner**: Executes specific prompts against the agent to trigger reasoning, capturing the process (`src/probes`).
- **Reasoning Consistency Analyzer**: Analyzes reasoning traces to detect logical inconsistencies or hallucinations in the intermediate steps (`src/analysis`).
- **Express API**: A simple interface for retrieving reasoning logs for visualization or external analysis (`src/api`).

## Project Structure
```text
src/
  agent/     # Reasoning trace logger
  probes/    # Probing experiment runner
  analysis/  # Reasoning consistency analyzer
  db/        # SQLite database setup and schema
  api/       # Simple Express API for retrieving logs
scripts/     # Example scripts for running experiments
data/        # SQLite database file storage
```

## Getting Started
1. Run `npm install` to install dependencies.
2. Run an experiment using `npm run experiment:run`
3. Start the API server using `npm run start:api`
4. Visit `http://localhost:3000/api/logs` to see the results.
