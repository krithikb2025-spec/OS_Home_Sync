import {
  Process,
  SchedulingAlgorithm
} from "../types";

export class Scheduler {
  private lastRoundRobinIndex =
    -1;

  schedule(
    processes: Process[],
    algorithm: SchedulingAlgorithm,
    agingEnabled: boolean
  ): number | null {
    const ready =
      processes.filter(
        process =>
          process.state === "READY"
      );

    if (ready.length === 0) {
      return null;
    }

    if (algorithm === "FCFS") {
      return ready.sort(
        (a, b) =>
          a.readyAt - b.readyAt
      )[0].pid;
    }

    if (
      algorithm === "Round Robin"
    ) {
      const ordered = [
        ...ready
      ].sort(
        (a, b) =>
          a.readyAt - b.readyAt
      );

      this.lastRoundRobinIndex =
        (this.lastRoundRobinIndex + 1) %
        ordered.length;

      return ordered[
        this.lastRoundRobinIndex
      ].pid;
    }

    let best = ready[0];

    let bestScore =
      this.score(
        best,
        agingEnabled
      );

    for (
      const process of ready.slice(1)
    ) {
      const score =
        this.score(
          process,
          agingEnabled
        );

      if (
        score < bestScore ||
        (
          score === bestScore &&
          process.readyAt <
            best.readyAt
        )
      ) {
        best = process;
        bestScore = score;
      }
    }

    return best.pid;
  }

  private score(
    process: Process,
    agingEnabled: boolean
  ): number {
    const base =
      process.priorityValue;

    if (!agingEnabled) {
      return base;
    }

    const waitedSeconds =
      Math.max(
        0,
        Date.now() -
          process.readyAt
      ) / 1000;

    const boost =
      Math.floor(
        waitedSeconds / 5
      );

    return Math.max(
      1,
      base - boost
    );
  }

  reset(): void {
    this.lastRoundRobinIndex =
      -1;
  }
}