import { BugBoardAgent } from './index';

// Create a new BugBoard agent
const bugboardAgent = new BugBoardAgent({
  agentName: 'ExampleAgent',
  apiUrl: 'http://localhost:3001/api' // Use your actual API URL in production
});

// Example function that might fail
async function runAgentTask() {
  try {
    // Simulate some agent work
    console.log('Agent starting task...');
    
    // Track outputs to detect loops
    bugboardAgent.trackOutput('Processing user request');
    
    // Simulate a build failure
    bugboardAgent.trackBuildFailure();
    
    // Manually report a bug if needed
    await bugboardAgent.reportBug({
      input: 'User asked: "How do I implement a neural network?"',
      logs: 'Agent attempted to generate code but failed with syntax error',
      error: 'SyntaxError: Unexpected token'
    });
    
    console.log('Bug reported successfully');
  } catch (error) {
    console.error('Error in agent task:', error);
  }
}

// Run the example
runAgentTask();
