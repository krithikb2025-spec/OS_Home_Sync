import {
  LogEntry,
  LogLevel
} from "../types";

export class Logger {
  private entries: LogEntry[] = [];
  private nextId = 1;

  log(
    level: LogLevel,
    source: string,
    message: string
  ): void {
    this.entries.unshift({
      id: this.nextId++,
      time: new Date().toLocaleTimeString(),
      level,
      source,
      message
    });

    if (this.entries.length > 500) {
      this.entries.pop();
    }
  }

  info(
    source: string,
    message: string
  ): void {
    this.log("INFO", source, message);
  }

  success(
    source: string,
    message: string
  ): void {
    this.log(
      "SUCCESS",
      source,
      message
    );
  }

  warning(
    source: string,
    message: string
  ): void {
    this.log(
      "WARNING",
      source,
      message
    );
  }

  error(
    source: string,
    message: string
  ): void {
    this.log(
      "ERROR",
      source,
      message
    );
  }

  getLogs(): LogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }
}