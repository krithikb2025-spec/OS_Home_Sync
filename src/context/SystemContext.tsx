import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ApplianceName,
  SchedulingAlgorithm,
  SystemSnapshot,
} from "../types";

import { MainController } from "../core/MainController";

interface SystemContextValue {
  system: SystemSnapshot;
  controller: MainController;

  toggle: (name: ApplianceName) => void;

  setTotalPower: (value: number) => void;
  setAlgorithm: (value: SchedulingAlgorithm) => void;
  setTimeQuantum: (value: number) => void;
  setAging: (value: boolean) => void;

  updateAppliancePower: (
    name: ApplianceName,
    value: number
  ) => void;

  clearLogs: () => void;
  resetSystem: () => void;
}

const SystemContext =
  createContext<SystemContextValue | null>(null);

export function SystemProvider({
  children,
}: {
  children: ReactNode;
}) {
  const controller = useMemo(
    () => new MainController(),
    []
  );

  const [system, setSystem] =
    useState<SystemSnapshot>(
      () => controller.getSnapshot()
    );

  useEffect(() => {
    const timer = window.setInterval(() => {
      controller.tick();
      setSystem(controller.getSnapshot());
    }, 500);

    return () => {
      window.clearInterval(timer);
    };
  }, [controller]);

  const refresh = () => {
    setSystem(controller.getSnapshot());
  };

  const value: SystemContextValue = {
    system,

    controller,

    toggle: (name) => {
      controller.toggleAppliance(name);
      refresh();
    },

    setTotalPower: (value) => {
      controller.updateConfig((config) => {
        config.setTotalPower(value);
      });

      refresh();
    },

    setAlgorithm: (value) => {
      controller.updateConfig((config) => {
        config.setAlgorithm(value);
      });

      refresh();
    },

    setTimeQuantum: (value) => {
      controller.updateConfig((config) => {
        config.setTimeQuantum(value);
      });

      refresh();
    },

    setAging: (value) => {
      controller.updateConfig((config) => {
        config.setAgingEnabled(value);
      });

      refresh();
    },

    updateAppliancePower: (name, value) => {
      controller.updateConfig((config) => {
        config.updateAppliance(name, {
          power: value,
        });
      });

      refresh();
    },

    clearLogs: () => {
      controller.clearLogs();
      refresh();
    },

    resetSystem: () => {
      controller.resetSystem();
      refresh();
    },
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);

  if (!context) {
    throw new Error(
      "useSystem must be used inside SystemProvider"
    );
  }

  return context;
}