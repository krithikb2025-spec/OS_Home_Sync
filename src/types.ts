export type ApplianceName =
  | "Fan"
  | "AC"
  | "Light"
  | "Refrigerator"
  | "Heater";

export type ProcessState =
  | "IDLE"
  | "READY"
  | "RUNNING"
  | "WAITING"
  | "BLOCKED";

export type Priority =
  | "Very High"
  | "High"
  | "Medium"
  | "Low";

export type SchedulingAlgorithm =
  | "Priority"
  | "Round Robin"
  | "FCFS";

export interface ApplianceConfig {
  name: ApplianceName;
  icon: string;
  power: number;
  minPower: number;
  maxPower: number;
  priority: Priority;
  temperatureThreshold?: number;
}

export interface SystemConfig {
  totalPower: number;
  algorithm: SchedulingAlgorithm;
  timeQuantum: number;
  agingEnabled: boolean;
  appliances: Record<ApplianceName, ApplianceConfig>;
}

export interface Process {
  pid: number;
  appliance: ApplianceName;
  state: ProcessState;
  priority: Priority;
  priorityValue: number;
  createdAt: number;
  readyAt: number;
  cpuBurst: number;
  waitingTime: number;
  powerAllocated: number;
}

export type LogLevel =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "ERROR";

export interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  source: string;
  message: string;
}

export interface MutexStatus {
  name: string;
  locked: boolean;
  owner: number | null;
  waiting: number[];
}

export interface SystemSnapshot {
  config: SystemConfig;
  processes: Process[];
  allocatedPower: number;
  availablePower: number;
  logs: LogEntry[];
  mutexes: MutexStatus[];
  uptime: number;
}