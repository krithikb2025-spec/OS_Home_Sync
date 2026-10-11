import {
  ApplianceConfig,
  ApplianceName,
  Priority,
  SchedulingAlgorithm,
  SystemConfig
} from "../types";

const defaultAppliances: Record<
  ApplianceName,
  ApplianceConfig
> = {
  Fan: {
    name: "Fan",
    icon: "🌀",
    power: 200,
    minPower: 50,
    maxPower: 500,
    priority: "Medium"
  },

  AC: {
    name: "AC",
    icon: "❄️",
    power: 1800,
    minPower: 500,
    maxPower: 2500,
    priority: "High",
    temperatureThreshold: 24
  },

  Light: {
    name: "Light",
    icon: "💡",
    power: 100,
    minPower: 10,
    maxPower: 200,
    priority: "Low"
  },

  Refrigerator: {
    name: "Refrigerator",
    icon: "🧊",
    power: 300,
    minPower: 100,
    maxPower: 600,
    priority: "Very High"
  },

  Heater: {
    name: "Heater",
    icon: "🔥",
    power: 1500,
    minPower: 500,
    maxPower: 2500,
    priority: "Medium",
    temperatureThreshold: 20
  }
};

const clone = <T,>(value: T): T =>
  JSON.parse(JSON.stringify(value));

export class ConfigurationManager {
  private config: SystemConfig = {
    totalPower: 3000,
    algorithm: "Priority",
    timeQuantum: 100,
    agingEnabled: false,
    appliances: clone(defaultAppliances)
  };

  getConfig(): SystemConfig {
    return clone(this.config);
  }

  setTotalPower(totalPower: number): void {
    if (!Number.isFinite(totalPower) || totalPower < 100) {
      throw new Error(
        "Total power must be at least 100W."
      );
    }

    this.config.totalPower = Math.round(totalPower);
  }

  setAlgorithm(
    algorithm: SchedulingAlgorithm
  ): void {
    this.config.algorithm = algorithm;
  }

  setTimeQuantum(timeQuantum: number): void {
    if (
      !Number.isFinite(timeQuantum) ||
      timeQuantum < 50
    ) {
      throw new Error(
        "Time quantum must be at least 50ms."
      );
    }

    this.config.timeQuantum =
      Math.round(timeQuantum);
  }

  setAgingEnabled(enabled: boolean): void {
    this.config.agingEnabled = enabled;
  }

  updateAppliance(
    name: ApplianceName,
    changes: Partial<
      Omit<ApplianceConfig, "name" | "icon">
    >
  ): void {
    const current =
      this.config.appliances[name];

    const nextPower =
      changes.power ?? current.power;

    const nextMin =
      changes.minPower ?? current.minPower;

    const nextMax =
      changes.maxPower ?? current.maxPower;

    if (nextMin > nextMax) {
      throw new Error(
        "Minimum power cannot exceed maximum power."
      );
    }

    if (
      nextPower < nextMin ||
      nextPower > nextMax
    ) {
      throw new Error(
        `${name} power must be between ${nextMin}W and ${nextMax}W.`
      );
    }

    this.config.appliances[name] = {
      ...current,
      ...changes,
      power: Math.round(nextPower),
      minPower: Math.round(nextMin),
      maxPower: Math.round(nextMax)
    };
  }

  getAppliance(
    name: ApplianceName
  ): ApplianceConfig {
    return clone(
      this.config.appliances[name]
    );
  }

  getPriorityValue(
    priority: Priority
  ): number {
    return {
      "Very High": 1,
      High: 2,
      Medium: 3,
      Low: 4
    }[priority];
  }
}