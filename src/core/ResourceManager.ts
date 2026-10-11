import { Logger } from "./Logger";
import {
  SynchronizationManager
} from "./SynchronizationManager";

export class ResourceManager {
  private allocations =
    new Map<number, number>();

  constructor(
    private logger: Logger,
    private sync: SynchronizationManager,
    private getTotalPower: () => number
  ) {}

  getAllocatedPower(): number {
    return [
      ...this.allocations.values()
    ].reduce(
      (sum, value) => sum + value,
      0
    );
  }

  getAvailablePower(): number {
    return Math.max(
      0,
      this.getTotalPower() -
        this.getAllocatedPower()
    );
  }

  getAllocation(
    pid: number
  ): number {
    return (
      this.allocations.get(pid) ?? 0
    );
  }

  allocatePower(
    pid: number,
    amount: number
  ): boolean {
    if (
      !this.sync.acquire(
        "LOCK_RESOURCE_ALLOC",
        pid
      )
    ) {
      return false;
    }

    try {
      const available =
        this.getAvailablePower();

      if (available < amount) {
        this.logger.warning(
          "RESOURCE",
          `PID ${pid} requested ${amount}W but only ${available}W is available.`
        );

        return false;
      }

      this.allocations.set(
        pid,
        amount
      );

      this.logger.success(
        "RESOURCE",
        `Allocated ${amount}W to PID ${pid}.`
      );

      return true;
    } finally {
      this.sync.release(
        "LOCK_RESOURCE_ALLOC",
        pid
      );
    }
  }

  releasePower(
    pid: number
  ): number {
    if (
      !this.sync.acquire(
        "LOCK_RESOURCE_ALLOC",
        pid
      )
    ) {
      return 0;
    }

    try {
      const amount =
        this.allocations.get(pid) ??
        0;

      this.allocations.delete(pid);

      if (amount > 0) {
        this.logger.info(
          "RESOURCE",
          `Released ${amount}W from PID ${pid}.`
        );
      }

      return amount;
    } finally {
      this.sync.release(
        "LOCK_RESOURCE_ALLOC",
        pid
      );
    }
  }

  canAllocate(
    amount: number
  ): boolean {
    return (
      this.getAvailablePower() >=
      amount
    );
  }
}