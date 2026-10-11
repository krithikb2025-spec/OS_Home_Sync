import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type {
  ApplianceName,
  Process,
  SchedulingAlgorithm,
} from "./types";
import { useSystem } from "./context/SystemContext";

const APPLIANCES: ApplianceName[] = [
  "Fan",
  "AC",
  "Light",
  "Refrigerator",
  "Heater",
];

const PRIORITY_VALUE: Record<string, number> = {
  "Very High": 1,
  High: 2,
  Medium: 3,
  Low: 4,
};

type PageName =
  | "Dashboard"
  | "OS Configuration"
  | "Power Quota"
  | "Mutex & Semaphores"
  | "Ready Queue";

function App() {
  const {
    system,
    toggle,
    setTotalPower,
    setAlgorithm,
    setTimeQuantum,
    setAging,
    updateAppliancePower,
    clearLogs,
    resetSystem,
  } = useSystem();

  const [activePage, setActivePage] =
    useState<PageName>("Dashboard");

  const [currentTime, setCurrentTime] =
    useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const getProcess = (name: ApplianceName): Process | undefined =>
    system.processes.find(
      (process) => process.appliance === name
    );

  const runningProcesses = system.processes.filter(
    (process) => process.state === "RUNNING"
  );

  const waitingProcesses = system.processes.filter(
    (process) =>
      process.state === "WAITING" ||
      process.state === "BLOCKED"
  );

  const readyProcesses = system.processes.filter(
    (process) => process.state === "READY"
  );

  const usage =
    system.config.totalPower > 0
      ? (system.allocatedPower /
          system.config.totalPower) *
        100
      : 0;

  const sortedProcesses = useMemo(() => {
    return APPLIANCES
      .map((name) => {
        const process = getProcess(name);
        const config =
          system.config.appliances[name];

        return {
          name,
          process,
          config,
          priorityValue:
            PRIORITY_VALUE[config.priority] ?? 99,
        };
      })
      .sort(
        (a, b) =>
          a.priorityValue - b.priorityValue
      );
  }, [system]);

  const formatState = (state: string) =>
    state.replace("_", " ");

  const stateClass = (state: string) =>
    state.toLowerCase();

  const applianceIcon = (name: ApplianceName) => {
    return system.config.appliances[name].icon;
  };

  const formatUptime = (milliseconds: number) => {
    const totalSeconds = Math.floor(
      milliseconds / 1000
    );

    const hours = Math.floor(
      totalSeconds / 3600
    );

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  return (
    <div className="os-app">
      {/* =====================================================
          TOP BAR
      ====================================================== */}

      <header className="system-bar">
        <div className="system-brand">
          <div className="brand-mark">
            HS
          </div>

          <div>
            <div className="brand-name">
              HomeSync OS
            </div>

            <div className="brand-version">
              Unified Smart Control Kernel
            </div>
          </div>
        </div>

        <div className="kernel-status">
          <span className="online-dot" />

          <span>
            KERNEL
            <strong> ONLINE</strong>
          </span>

          <span className="bar-separator" />

          <span>
            PID COUNT
            <strong>
              {system.processes.length}
            </strong>
          </span>

          <span className="bar-separator" />

          <span>
            SCHEDULER
            <strong>
              {system.config.algorithm}
            </strong>
          </span>
        </div>

        <div className="system-clock">
          <span>SYSTEM TIME</span>

          <strong>
            {currentTime.toLocaleTimeString()}
          </strong>
        </div>
      </header>

      <div className="layout">
        {/* ===================================================
            SIDEBAR
        ==================================================== */}

        <aside className="os-sidebar">
          <div className="sidebar-title">
            PROCESS DOMAINS
          </div>

          <nav>
            {[
              ["Dashboard", "▦"],
              ["OS Configuration", "⚙"],
              ["Power Quota", "⚡"],
              ["Mutex & Semaphores", "▣"],
              ["Ready Queue", "≡"],
            ].map(([label, icon]) => (
              <button
                key={label}
                className={
                  activePage === label
                    ? "side-nav active"
                    : "side-nav"
                }
                onClick={() =>
                  setActivePage(
                    label as PageName
                  )
                }
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="kernel-box">
              <div className="kernel-box-title">
                KERNEL STATUS
              </div>

              <div className="kernel-line">
                <span>CPU</span>
                <strong>ACTIVE</strong>
              </div>

              <div className="kernel-line">
                <span>MEMORY</span>
                <strong>STABLE</strong>
              </div>

              <div className="kernel-line">
                <span>RUNNING</span>
                <strong>
                  {runningProcesses.length}
                </strong>
              </div>

              <div className="kernel-line">
                <span>READY</span>
                <strong>
                  {readyProcesses.length}
                </strong>
              </div>

              <div className="kernel-line">
                <span>BLOCKED</span>
                <strong>
                  {waitingProcesses.length}
                </strong>
              </div>

            </div>

            <div className="sidebar-version">
              HomeSync OS v1.0
              <br />
              Operating Systems Project
            </div>
          </div>
        </aside>

        {/* ===================================================
            WORKSPACE
        ==================================================== */}

        <main className="workspace">
          {/* =================================================
              DASHBOARD
          ================================================== */}

          {activePage === "Dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="section-kicker">
                    OS PROCESS CONTROL
                  </div>

                  <h1>
                    Process Dashboard
                  </h1>

                  <p>
                    Real-time process, resource,
                    scheduling and synchronization
                    management.
                  </p>
                </div>

                <button
                  className="danger-button"
                  onClick={resetSystem}
                >
                  RESET SYSTEM
                </button>
              </div>

              {/* METRICS */}

              <section className="metric-grid">
                <div className="metric-card">
                  <div className="metric-label">
                    POWER LIMIT
                  </div>

                  <div className="metric-value">
                    {system.config.totalPower}
                    <span> W</span>
                  </div>

                  <div className="metric-sub">
                    GLOBAL RESOURCE LIMIT
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">
                    CURRENT LOAD
                  </div>

                  <div className="metric-value">
                    {system.allocatedPower}
                    <span> W</span>
                  </div>

                  <div className="metric-sub">
                    {usage.toFixed(1)}%
                    RESOURCE UTILIZATION
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">
                    AVAILABLE POWER
                  </div>

                  <div className="metric-value available">
                    {system.availablePower}
                    <span> W</span>
                  </div>

                  <div className="metric-sub">
                    FREE SHARED RESOURCE
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">
                    PROCESS STATUS
                  </div>

                  <div className="metric-value">
                    {runningProcesses.length}
                    <span>
                      {" "}
                      / {APPLIANCES.length}
                    </span>
                  </div>

                  <div className="metric-sub">
                    {readyProcesses.length} READY ·{" "}
                    {waitingProcesses.length} BLOCKED
                  </div>
                </div>
              </section>

              {/* RESOURCE ALERT */}

              {waitingProcesses.length > 0 && (
                <section className="alert-panel">
                  <div className="alert-icon">
                    !
                  </div>

                  <div className="alert-content">
                    <strong>
                      RESOURCE BLOCKING DETECTED
                    </strong>

                    <p>
                      One or more appliance
                      processes are waiting because
                      the requested power exceeds
                      the currently available shared
                      resource.
                    </p>
                  </div>

                  <div className="alert-count">
                    {waitingProcesses.length}
                    <span>BLOCKED</span>
                  </div>
                </section>
              )}

              {/* PROCESS CARDS */}

              <section className="panel-section">
                <div className="section-header">
                  <div>
                    <h2>
                      Appliance OS Processes
                    </h2>

                    <p>
                      Each appliance is represented
                      as an independent process.
                    </p>
                  </div>

                  <span className="section-count">
                    {APPLIANCES.length} REGISTERED
                  </span>
                </div>

                <div className="worker-grid">
                  {sortedProcesses.map(
                    ({ name, process, config }) => {
                      if (!process) {
                        return null;
                      }

                      return (
                        <article
                          key={name}
                          className={
                            process.state ===
                            "BLOCKED"
                              ? "worker-card blocked-card"
                              : "worker-card"
                          }
                        >
                          <div className="worker-header">
                            <div className="worker-icon">
                              {applianceIcon(name)}
                            </div>

                            <div className="worker-name">
                              <strong>
                                Worker-{name}
                              </strong>

                              <span>
                                PID {process.pid}
                              </span>
                            </div>

                            <span
                              className={`process-state ${stateClass(
                                process.state
                              )}`}
                            >
                              {formatState(
                                process.state
                              )}
                            </span>
                          </div>

                          <div className="worker-info">
                            <div>
                              <span>
                                ALLOCATED
                              </span>
                              <strong>
                                {process.powerAllocated} W
                              </strong>
                            </div>

                            <div>
                              <span>
                                REQUIRED
                              </span>
                              <strong>
                                {config.power} W
                              </strong>
                            </div>

                            <div>
                              <span>
                                PRIORITY
                              </span>
                              <strong>
                                {config.priority}
                              </strong>
                            </div>

                            <div>
                              <span>
                                CPU BURST
                              </span>
                              <strong>
                                {process.cpuBurst} ms
                              </strong>
                            </div>

                            <div>
                              <span>
                                WAITING
                              </span>
                              <strong>
                                {Math.floor(
                                  process.waitingTime /
                                    1000
                                )}{" "}
                                s
                              </strong>
                            </div>

                            <div>
                              <span>
                                RANGE
                              </span>
                              <strong>
                                {config.minPower}-
                                {config.maxPower} W
                              </strong>
                            </div>
                          </div>

                          <div className="worker-footer">
                            <span>
                              STATE:
                              {" "}
                              <strong>
                                {formatState(
                                  process.state
                                )}
                              </strong>
                            </span>

                            <button
                              className={
                                process.state ===
                                "IDLE"
                                  ? "worker-button"
                                  : "worker-button off"
                              }
                              onClick={() =>
                                toggle(name)
                              }
                            >
                              {process.state ===
                              "IDLE"
                                ? "POWER ON"
                                : "POWER OFF"}
                            </button>
                          </div>

                          {process.state ===
                            "BLOCKED" && (
                            <div className="blocked-message">
                              Requested resource:
                              {" "}
                              {config.power} W
                              {" "}
                              | Available:
                              {" "}
                              {system.availablePower} W
                            </div>
                          )}
                        </article>
                      );
                    }
                  )}
                </div>
              </section>

              {/* LOWER GRID */}

              <div className="dashboard-grid">
                {/* POWER */}

                <section className="panel-section">
                  <div className="section-header compact">
                    <div>
                      <h2>
                        Dynamic Power Allocator
                      </h2>

                      <p>
                        Shared power resource
                        allocation.
                      </p>
                    </div>

                    <span className="limit-label">
                      LIMIT:
                      {" "}
                      {system.config.totalPower} W
                    </span>
                  </div>

                  <div className="allocation-bar">
                    {sortedProcesses.map(
                      ({
                        name,
                        process,
                      }) => {
                        const percentage =
                          process &&
                          system.config.totalPower >
                            0
                            ? (process.powerAllocated /
                                system.config
                                  .totalPower) *
                              100
                            : 0;

                        return (
                          <div
                            key={name}
                            className="allocation-segment"
                            style={
                              {
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    1,
                                    percentage
                                  )
                                )}%`,
                              } as CSSProperties
                            }
                            title={`${name}: ${
                              process?.powerAllocated ??
                              0
                            } W`}
                          />
                        );
                      }
                    )}
                  </div>

                  <div className="allocation-legend">
                    {sortedProcesses.map(
                      ({
                        name,
                        process,
                      }) => (
                        <div
                          className="legend-item"
                          key={name}
                        >
                          <span className="legend-dot" />
                          <span>{name}</span>
                          <strong>
                            {process?.powerAllocated ??
                              0}
                            W
                          </strong>
                        </div>
                      )
                    )}
                  </div>

                  <div className="resource-request">
                    <div className="request-title">
                      RESOURCE REQUEST QUEUE
                    </div>

                    {waitingProcesses.length ===
                    0 ? (
                      <div className="request-empty">
                        No blocked resource
                        requests.
                      </div>
                    ) : (
                      waitingProcesses.map(
                        (process) => (
                          <div
                            className="request-row"
                            key={process.pid}
                          >
                            <span>
                              PID {process.pid}
                            </span>

                            <strong>
                              Worker-
                              {process.appliance}
                            </strong>

                            <span>
                              REQUEST:
                              {" "}
                              {
                                system.config
                                  .appliances[
                                  process.appliance
                                ].power
                              }
                              W
                            </span>

                            <span className="request-status">
                              BLOCKED
                            </span>
                          </div>
                        )
                      )
                    )}
                  </div>
                </section>

                {/* MUTEX */}

                <section className="panel-section">
                  <div className="section-header compact">
                    <div>
                      <h2>
                        Synchronization & Mutex
                      </h2>

                      <p>
                        Shared resource protection.
                      </p>
                    </div>

                    <span
                      className={
                        system.mutexes.some(
                          (mutex) =>
                            mutex.locked
                        )
                          ? "mutex-state locked"
                          : "mutex-state"
                      }
                    >
                      {system.mutexes.some(
                        (mutex) =>
                          mutex.locked
                      )
                        ? "LOCKED"
                        : "AVAILABLE"}
                    </span>
                  </div>

                  <div className="mutex-list">
                    {system.mutexes.map(
                      (mutex) => (
                        <div
                          className="mutex-row"
                          key={mutex.name}
                        >
                          <div className="mutex-name">
                            <strong>
                              {mutex.name}
                            </strong>

                            <span>
                              {mutex.owner !==
                              null
                                ? `Owner PID ${mutex.owner}`
                                : "No current owner"}
                            </span>
                          </div>

                          <span
                            className={
                              mutex.locked
                                ? "lock-pill locked"
                                : "lock-pill"
                            }
                          >
                            {mutex.locked
                              ? "LOCKED"
                              : "FREE"}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  <div className="sync-flow">
                    <span>REQUEST</span>
                    <b>→</b>
                    <span>MUTEX</span>
                    <b>→</b>
                    <span>CHECK</span>
                    <b>→</b>
                    <span>ALLOCATE</span>
                  </div>
                </section>
              </div>

              {/* SCHEDULER */}

              <div className="dashboard-grid">
                <section className="panel-section">
                  <div className="section-header compact">
                    <div>
                      <h2>
                        Scheduler RunQueue
                      </h2>

                      <p>
                        Active dispatch matrix.
                      </p>
                    </div>

                    <span className="algorithm-label">
                      {system.config.algorithm}
                    </span>
                  </div>

                  <div className="scheduler-table">
                    <div className="scheduler-head">
                      <span>PID</span>
                      <span>PROCESS</span>
                      <span>PRIORITY</span>
                      <span>POWER</span>
                      <span>STATE</span>
                      <span>ACTION</span>
                    </div>

                    {sortedProcesses.map(
                      ({
                        name,
                        process,
                        config,
                      }) => {
                        if (!process) {
                          return null;
                        }

                        return (
                          <div
                            className="scheduler-row"
                            key={name}
                          >
                            <span>
                              {process.pid}
                            </span>

                            <span className="process-name">
                              Worker-{name}
                            </span>

                            <span>
                              {config.priority}
                            </span>

                            <span>
                              {config.power} W
                            </span>

                            <span>
                              <b
                                className={`mini-state ${stateClass(
                                  process.state
                                )}`}
                              >
                                {formatState(
                                  process.state
                                )}
                              </b>
                            </span>

                            <button
                              className="table-action"
                              onClick={() =>
                                toggle(name)
                              }
                            >
                              {process.state ===
                              "IDLE"
                                ? "RUN"
                                : "STOP"}
                            </button>
                          </div>
                        );
                      }
                    )}
                  </div>
                </section>

                {/* LOG */}

                <section className="panel-section">
                  <div className="section-header compact">
                    <div>
                      <h2>
                        Kernel Activity Log
                      </h2>

                      <p>
                        Latest OS events.
                      </p>
                    </div>

                    <button
                      className="clear-log"
                      onClick={clearLogs}
                    >
                      CLEAR
                    </button>
                  </div>

                  <div className="kernel-log">
                    {system.logs.length ===
                    0 ? (
                      <div className="log-empty">
                        No kernel events
                        recorded.
                      </div>
                    ) : (
                      [...system.logs]
                        .reverse()
                        .slice(0, 12)
                        .map((log) => (
                          <div
                            className="kernel-log-row"
                            key={log.id}
                          >
                            <span className="log-timestamp">
                              {new Date(
                                log.time
                              ).toLocaleTimeString()}
                            </span>

                            <span className="log-level">
                              {log.level}
                            </span>

                            <span className="log-text">
                              {log.message}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* =================================================
              OS CONFIGURATION
          ================================================== */}

          {activePage ===
            "OS Configuration" && (
            <section className="full-panel">
              <div className="page-heading">
                <div>
                  <div className="section-kicker">
                    SYSTEM SETTINGS
                  </div>

                  <h1>
                    OS Configuration
                  </h1>

                  <p>
                    Configure power,
                    scheduling and appliance
                    requirements.
                  </p>
                </div>
              </div>

              <div className="configuration-grid">
                <div className="config-box">
                  <h3>
                    Global Configuration
                  </h3>

                  <label>
                    Maximum Home Power (W)
                  </label>

                  <input
                    type="number"
                    min="100"
                    value={
                      system.config.totalPower
                    }
                    onChange={(event) =>
                      setTotalPower(
                        Number(
                          event.target.value
                        )
                      )
                    }
                  />

                  <label>
                    Scheduling Algorithm
                  </label>

                  <select
                    value={
                      system.config.algorithm
                    }
                    onChange={(event) =>
                      setAlgorithm(
                        event.target
                          .value as SchedulingAlgorithm
                      )
                    }
                  >
                    <option value="Priority">
                      Priority
                    </option>

                    <option value="Round Robin">
                      Round Robin
                    </option>

                    <option value="FCFS">
                      FCFS
                    </option>
                  </select>

                  <label>
                    Time Quantum (ms)
                  </label>

                  <input
                    type="number"
                    min="50"
                    value={
                      system.config.timeQuantum
                    }
                    onChange={(event) =>
                      setTimeQuantum(
                        Number(
                          event.target.value
                        )
                      )
                    }
                  />

                  <label className="check-setting">
                    <input
                      type="checkbox"
                      checked={
                        system.config
                          .agingEnabled
                      }
                      onChange={(event) =>
                        setAging(
                          event.target
                            .checked
                        )
                      }
                    />

                    Enable priority aging
                  </label>

                  <div className="config-runtime">
                    <span>UPTIME</span>

                    <strong>
                      {formatUptime(
                        system.uptime
                      )}
                    </strong>
                  </div>
                </div>

                <div className="config-box">
                  <h3>
                    Appliance Power
                    Requirements
                  </h3>

                  {APPLIANCES.map(
                    (name) => {
                      const config =
                        system.config
                          .appliances[name];

                      return (
                        <div
                          className="config-appliance"
                          key={name}
                        >
                          <div>
                            <strong>
                              {name}
                            </strong>

                            <span>
                              {config.priority}
                              {" · "}
                              {config.minPower}
                              -
                              {config.maxPower}
                              W
                            </span>
                          </div>

                          <input
                            type="number"
                            min={config.minPower}
                            max={config.maxPower}
                            value={config.power}
                            onChange={(event) =>
                              updateAppliancePower(
                                name,
                                Number(
                                  event.target
                                    .value
                                )
                              )
                            }
                          />

                          <span>W</span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              POWER QUOTA
          ================================================== */}

          {activePage === "Power Quota" && (
            <section className="full-panel">
              <div className="page-heading">
                <div>
                  <div className="section-kicker">
                    RESOURCE MANAGER
                  </div>

                  <h1>
                    Power Quota
                  </h1>

                  <p>
                    Shared power allocation
                    and contention status.
                  </p>
                </div>
              </div>

              <div className="quota-display">
                <div className="quota-main">
                  <span>
                    CURRENT RESOURCE LOAD
                  </span>

                  <strong>
                    {system.allocatedPower} W
                  </strong>

                  <div className="quota-track">
                    <div
                      className="quota-fill"
                      style={
                        {
                          width: `${Math.min(
                            100,
                            Math.max(0, usage)
                          )}%`,
                        } as CSSProperties
                      }
                    />
                  </div>

                  <small>
                    {usage.toFixed(1)}% of{" "}
                    {system.config.totalPower} W
                    allocated
                  </small>
                </div>

                <div className="quota-side">
                  <div>
                    <span>LIMIT</span>
                    <strong>
                      {system.config.totalPower} W
                    </strong>
                  </div>

                  <div>
                    <span>USED</span>
                    <strong>
                      {system.allocatedPower} W
                    </strong>
                  </div>

                  <div>
                    <span>FREE</span>
                    <strong>
                      {system.availablePower} W
                    </strong>
                  </div>
                </div>
              </div>

              <div className="resource-table">
                {APPLIANCES.map(
                  (name) => {
                    const process =
                      getProcess(name);

                    const config =
                      system.config
                        .appliances[name];

                    return (
                      <div
                        className="resource-table-row"
                        key={name}
                      >
                        <span>
                          {name}
                        </span>

                        <span>
                          PID{" "}
                          {process?.pid ?? "—"}
                        </span>

                        <span>
                          {process?.powerAllocated ??
                            0}{" "}
                          W
                        </span>

                        <span>
                          {config.power} W
                        </span>

                        <span
                          className={`mini-state ${stateClass(
                            process?.state ??
                              "IDLE"
                          )}`}
                        >
                          {formatState(
                            process?.state ??
                              "IDLE"
                          )}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          )}

          {/* =================================================
              MUTEX
          ================================================== */}

          {activePage ===
            "Mutex & Semaphores" && (
            <section className="full-panel">
              <div className="page-heading">
                <div>
                  <div className="section-kicker">
                    SYNCHRONIZATION
                  </div>

                  <h1>
                    Mutex & Semaphores
                  </h1>

                  <p>
                    Critical section and lock
                    ownership.
                  </p>
                </div>
              </div>

              <div className="mutex-large">
                <div className="mutex-large-status">
                  <div
                    className={
                      system.mutexes.some(
                        (mutex) =>
                          mutex.locked
                      )
                        ? "mutex-indicator locked"
                        : "mutex-indicator"
                    }
                  >
                    {system.mutexes.some(
                      (mutex) =>
                        mutex.locked
                    )
                      ? "LOCKED"
                      : "FREE"}
                  </div>

                  <h3>
                    SYNCHRONIZATION MANAGER
                  </h3>

                  <p>
                    Mutex locks protect shared
                    resources during power
                    allocation and release.
                  </p>
                </div>

                <div className="mutex-rules">
                  {system.mutexes.map(
                    (mutex, index) => (
                      <div
                        key={mutex.name}
                      >
                        <span>
                          {index + 1}
                        </span>

                        <div>
                          <strong>
                            {mutex.name}
                          </strong>

                          <small>
                            {mutex.locked
                              ? `Locked by PID ${mutex.owner}`
                              : "Available"}
                          </small>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              READY QUEUE
          ================================================== */}

          {activePage === "Ready Queue" && (
            <section className="full-panel">
              <div className="page-heading">
                <div>
                  <div className="section-kicker">
                    CPU SCHEDULER
                  </div>

                  <h1>
                    Ready Queue
                  </h1>

                  <p>
                    Processes prepared for CPU
                    scheduling.
                  </p>
                </div>
              </div>

              <div className="queue-list">
                {readyProcesses.length ===
                0 ? (
                  <div className="queue-empty">
                    No processes are currently
                    waiting in the ready queue.
                  </div>
                ) : (
                  readyProcesses.map(
                    (process, index) => (
                      <div
                        className="queue-row"
                        key={process.pid}
                      >
                        <span>
                          #{index + 1}
                        </span>

                        <strong>
                          PID {process.pid}
                          {" · "}
                          Worker-
                          {process.appliance}
                        </strong>

                        <span>
                          {process.priority}
                        </span>

                        <span>
                          READY
                        </span>
                      </div>
                    )
                  )
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;