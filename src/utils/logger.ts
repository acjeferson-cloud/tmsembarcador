type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      enabled: import.meta.env.DEV,
      minLevel: import.meta.env.DEV ? 'debug' : 'error',
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled && level !== 'error') {
      return false;
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${contextStr} ${message}`;
  }

  debug(message: string, context?: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context), ...args);
    }
  }

  info(message: string, context?: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context), ...args);
    }
  }

  warn(message: string, context?: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context), ...args);
    }
  }

  error(message: string, error?: Error | unknown, context?: string): void {
    if (this.shouldLog('error')) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(this.formatMessage('error', `${message} - ${errorMsg}`, context));

      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
  }
}

export const logger = new Logger();
