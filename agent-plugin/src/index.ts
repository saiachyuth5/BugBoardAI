import axios from 'axios';

export interface BugReportOptions {
  apiUrl?: string;
  agentName: string;
}

export interface BugData {
  input: string;
  logs: string;
  error?: string;
}

export interface RetryDetectionState {
  outputs: string[];
  buildFailures: number;
  lastActivity: number;
}

export class BugBoardAgent {
  private apiUrl: string;
  private agentName: string;
  private retryState: RetryDetectionState = {
    outputs: [],
    buildFailures: 0,
    lastActivity: Date.now()
  };
  private timeoutMs: number = 300000; // 5 minutes default timeout

  constructor(options: BugReportOptions) {
    this.apiUrl = options.apiUrl || 'https://bugboard.ai/api';
    this.agentName = options.agentName;
  }

  /**
   * Manually report a bug to BugBoard AI
   */
  async reportBug(data: BugData): Promise<{ id: string; url: string }> {
    try {
      const response = await axios.post(`${this.apiUrl}/bugs`, {
        agentName: this.agentName,
        input: data.input,
        logs: data.logs,
        error: data.error,
        timestamp: new Date().toISOString()
      });
      
      return {
        id: response.data.id,
        url: `${this.apiUrl.replace('/api', '')}/bugs/${response.data.id}`
      };
    } catch (error) {
      console.error('Failed to report bug to BugBoard AI:', error);
      throw error;
    }
  }

  /**
   * Track agent output to detect repetitive patterns
   */
  trackOutput(output: string): void {
    this.retryState.outputs.push(output);
    this.retryState.lastActivity = Date.now();
    
    // Keep only the last 5 outputs
    if (this.retryState.outputs.length > 5) {
      this.retryState.outputs.shift();
    }
    
    // Check for repetitive patterns
    this.checkForStuckAgent();
  }

  /**
   * Track build failures
   */
  trackBuildFailure(): void {
    this.retryState.buildFailures += 1;
    this.retryState.lastActivity = Date.now();
    
    // Check if we've hit the threshold
    if (this.retryState.buildFailures >= 3) {
      this.autoReportBug('Multiple build failures detected');
    }
  }

  /**
   * Reset the retry detection state
   */
  resetRetryDetection(): void {
    this.retryState = {
      outputs: [],
      buildFailures: 0,
      lastActivity: Date.now()
    };
  }

  /**
   * Set a custom timeout in milliseconds
   */
  setTimeout(timeoutMs: number): void {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Check if the agent is stuck in a loop or has timed out
   */
  private checkForStuckAgent(): void {
    // Check for timeout
    const timeSinceLastActivity = Date.now() - this.retryState.lastActivity;
    if (timeSinceLastActivity > this.timeoutMs) {
      this.autoReportBug('Agent timed out');
      return;
    }
    
    // Check for repetitive outputs (3+ same outputs in a row)
    const outputs = this.retryState.outputs;
    if (outputs.length >= 3) {
      const lastThree = outputs.slice(-3);
      if (lastThree[0] === lastThree[1] && lastThree[1] === lastThree[2]) {
        this.autoReportBug('Agent stuck in output loop');
      }
    }
  }

  /**
   * Automatically report a bug when stuck detection triggers
   */
  private async autoReportBug(reason: string): Promise<void> {
    const logs = this.retryState.outputs.join('\n\n--- Next Output ---\n\n');
    
    try {
      await this.reportBug({
        input: 'Auto-detected issue',
        logs: logs,
        error: `Auto-reported: ${reason}. Build failures: ${this.retryState.buildFailures}`
      });
      
      // Reset after reporting
      this.resetRetryDetection();
    } catch (error) {
      console.error('Failed to auto-report bug:', error);
    }
  }
}

// Default export for easy importing
export default function createBugBoardAgent(options: BugReportOptions): BugBoardAgent {
  return new BugBoardAgent(options);
}

// Export the reportBug function for direct use
export function reportBug(
  data: BugData, 
  options: BugReportOptions
): Promise<{ id: string; url: string }> {
  const agent = new BugBoardAgent(options);
  return agent.reportBug(data);
}
