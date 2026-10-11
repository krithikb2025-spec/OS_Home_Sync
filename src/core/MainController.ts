import {
  ApplianceName,
  Process,
  SystemSnapshot
} from "../types";

import {
  ConfigurationManager
} from "./ConfigurationManager";

import { Logger } from "./Logger";

import {
  ResourceManager
} from "./ResourceManager";

import { Scheduler } from "./Scheduler";

import {
  SynchronizationManager
} from "./SynchronizationManager";

export class MainController {
  readonly configuration:
    ConfigurationManager;

  readonly logger:
    Logger;

  readonly sync:
    SynchronizationManager;

  readonly resources:
    ResourceManager;

  readonly scheduler:
    Scheduler;

  private processes =
    new Map<number, Process>();

  private nextPid = 1001;

  private startedAt =
    Date.now();

  constructor() {
    this.configuration =
      new ConfigurationManager();

    this.logger =
      new Logger();

    this.sync =
      new SynchronizationManager(
        this.logger
      );

    this.resources =
      new ResourceManager(
        this.logger,
        this.sync,
        () =>
          this.configuration
            .getConfig()
            .totalPower
      );

    this.scheduler =
      new Scheduler();

    this.logger.info(
      "SYSTEM",
      "HomeSync OS initialized."
    );
  }

  getSnapshot():
    SystemSnapshot {
    const config =
      this.configuration
        .getConfig();

    const processes =
      [
        ...this.processes.values()
      ].map(process => ({
        ...process
      }));

    const allocatedPower =
      this.resources
        .getAllocatedPower();

    for (
      const process of processes
    ) {
      process.powerAllocated =
        this.resources.getAllocation(
          process.pid
        );

      if (
        process.state === "READY" ||
        process.state === "BLOCKED"
      ) {
        process.waitingTime =
          Math.max(
            0,
            Date.now() -
              process.readyAt
          );
      }
    }

    return {
      config,
      processes,
      allocatedPower,
      availablePower:
        Math.max(
          0,
          config.totalPower -
            allocatedPower
        ),
      logs:
        this.logger.getLogs(),
      mutexes:
        this.sync.getStatus(),
      uptime:
        Date.now() -
        this.startedAt
    };
  }

  toggleAppliance(
    name: ApplianceName
  ): void {
    const existing =
      [
        ...this.processes.values()
      ].find(
        process =>
          process.appliance === name &&
          process.state !== "IDLE"
      );

    if (existing) {
      this.powerOff(name);
    } else {
      this.powerOn(name);
    }
  }

  powerOn(
    name: ApplianceName
  ): void {
    const alreadyExists =
      [
        ...this.processes.values()
      ].some(
        process =>
          process.appliance === name &&
          (
            process.state === "RUNNING" ||
            process.state === "READY" ||
            process.state === "BLOCKED"
          )
      );

    if (alreadyExists) {
      return;
    }

    const config =
      this.configuration
        .getAppliance(name);

    const pid =
      this.nextPid++;

    const process: Process = {
      pid,
      appliance: name,
      state: "READY",
      priority:
        config.priority,
      priorityValue:
        this.configuration
          .getPriorityValue(
            config.priority
          ),
      createdAt:
        Date.now(),
      readyAt:
        Date.now(),
      cpuBurst: 100,
      waitingTime: 0,
      powerAllocated: 0
    };

    this.processes.set(
      pid,
      process
    );

    this.logger.info(
      "PROCESS",
      `Created PID ${pid} for ${name}. State: READY.`
    );

    if (
      this.resources.canAllocate(
        config.power
      )
    ) {
      this.runProcess(
        process,
        config.power
      );
    } else {
      process.state =
        "BLOCKED";

      this.logger.warning(
        "PROCESS",
        `${name} (PID ${pid}) BLOCKED: ${config.power}W requested, ${this.resources.getAvailablePower()}W available.`
      );
    }
  }

  powerOff(
    name: ApplianceName
  ): void {
    const process =
      [
        ...this.processes.values()
      ].find(
        process =>
          process.appliance === name &&
          process.state !== "IDLE"
      );

    if (!process) {
      return;
    }

    this.resources.releasePower(
      process.pid
    );

    process.powerAllocated =
      0;

    process.state =
      "IDLE";

    process.waitingTime =
      0;

    this.logger.info(
      "PROCESS",
      `${name} (PID ${process.pid}) stopped and returned to IDLE.`
    );

    this.tryUnblockProcesses();
  }

  private runProcess(
    process: Process,
    power: number
  ): void {
    const allocated =
      this.resources.allocatePower(
        process.pid,
        power
      );

    if (!allocated) {
      process.state =
        "BLOCKED";

      return;
    }

    process.state =
      "RUNNING";

    process.powerAllocated =
      power;

    this.logger.success(
      "PROCESS",
      `${process.appliance} (PID ${process.pid}) transitioned READY → RUNNING.`
    );
  }

  tryUnblockProcesses(): void {
    const blocked =
      [
        ...this.processes.values()
      ]
        .filter(
          process =>
            process.state ===
            "BLOCKED"
        )
        .sort(
          (a, b) =>
            a.priorityValue -
              b.priorityValue ||
            a.readyAt -
              b.readyAt
        );

    for (
      const process of blocked
    ) {
      const power =
        this.configuration
          .getAppliance(
            process.appliance
          ).power;

      if (
        !this.resources.canAllocate(
          power
        )
      ) {
        continue;
      }

      process.state =
        "READY";

      this.logger.info(
        "PROCESS",
        `${process.appliance} (PID ${process.pid}) BLOCKED → READY.`
      );

      const selected =
        this.scheduler.schedule(
          [process],
          this.configuration
            .getConfig()
            .algorithm,
          this.configuration
            .getConfig()
            .agingEnabled
        );

      if (
        selected === process.pid
      ) {
        this.runProcess(
          process,
          power
        );
      }
    }
  }

  tick(): void {
    const config =
      this.configuration
        .getConfig();

    const allProcesses =
      [
        ...this.processes.values()
      ];

    for (
      const process of allProcesses
    ) {
      if (
        process.state === "READY" ||
        process.state === "BLOCKED"
      ) {
        process.waitingTime =
          Math.max(
            0,
            Date.now() -
              process.readyAt
          );
      }
    }

    const selectedPid =
      this.scheduler.schedule(
        allProcesses,
        config.algorithm,
        config.agingEnabled
      );

    if (
      selectedPid !== null
    ) {
      const selected =
        this.processes.get(
          selectedPid
        );

      if (selected) {
        this.logger.info(
          "SCHEDULER",
          `Selected PID ${selected.pid} (${selected.appliance}) using ${config.algorithm}.`
        );
      }
    }

    this.tryUnblockProcesses();
  }

  updateConfig(
    mutator: (
      manager:
        ConfigurationManager
    ) => void
  ): void {
    mutator(
      this.configuration
    );

    this.logger.info(
      "CONFIG",
      "System configuration updated."
    );

    this.tryUnblockProcesses();
  }

  clearLogs(): void {
    this.logger.clear();

    this.logger.info(
      "SYSTEM",
      "Activity log cleared."
    );
  }

  resetSystem(): void {
    for (
      const process of
        this.processes.values()
    ) {
      this.resources.releasePower(
        process.pid
      );
    }

    this.processes.clear();

    this.scheduler.reset();

    this.startedAt =
      Date.now();

    this.logger.info(
      "SYSTEM",
      "System reset completed."
    );
  }
}