import {
  MutexStatus
} from "../types";

import { Logger } from "./Logger";

interface Mutex {
  owner: number | null;
  waiting: number[];
}

export class SynchronizationManager {
  private mutexes =
    new Map<string, Mutex>();

  constructor(
    private logger: Logger
  ) {
    [
      "LOCK_POWER_BUS",
      "LOCK_RESOURCE_ALLOC",
      "LOCK_COMPRESSOR",
      "LOCK_THERMAL_CTRL"
    ].forEach(name => {
      this.mutexes.set(name, {
        owner: null,
        waiting: []
      });
    });
  }

  acquire(
    name: string,
    pid: number
  ): boolean {
    const mutex =
      this.mutexes.get(name);

    if (!mutex) {
      throw new Error(
        `Unknown mutex: ${name}`
      );
    }

    if (
      mutex.owner === null ||
      mutex.owner === pid
    ) {
      mutex.owner = pid;

      this.logger.info(
        "SYNC",
        `PID ${pid} acquired ${name}.`
      );

      return true;
    }

    if (
      !mutex.waiting.includes(pid)
    ) {
      mutex.waiting.push(pid);
    }

    this.logger.warning(
      "SYNC",
      `PID ${pid} is waiting for ${name}.`
    );

    return false;
  }

  release(
    name: string,
    pid: number
  ): void {
    const mutex =
      this.mutexes.get(name);

    if (!mutex) return;

    if (mutex.owner !== pid) return;

    mutex.owner = null;

    this.logger.info(
      "SYNC",
      `PID ${pid} released ${name}.`
    );

    const next =
      mutex.waiting.shift();

    if (next !== undefined) {
      mutex.owner = next;

      this.logger.info(
        "SYNC",
        `PID ${next} acquired ${name} from waiting queue.`
      );
    }
  }

  getStatus(): MutexStatus[] {
    return [
      ...this.mutexes.entries()
    ].map(
      ([name, value]) => ({
        name,
        locked:
          value.owner !== null,
        owner: value.owner,
        waiting: [
          ...value.waiting
        ]
      })
    );
  }
}