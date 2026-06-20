"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CalView = "day" | "week" | "month" | "agenda";
export type TimeFormat = "12" | "24";
export type Density = "comfortable" | "compact";

interface CalendarPrefs {
  weekStartsOn: 0 | 1;
  timeFormat: TimeFormat;
  defaultView: CalView;
  density: Density;
  showWeekends: boolean;
  showDeclined: boolean; // reserved
  hiddenCalendars: string[]; // ids toggled off locally as a fallback

  setWeekStartsOn: (v: 0 | 1) => void;
  setTimeFormat: (v: TimeFormat) => void;
  setDefaultView: (v: CalView) => void;
  setDensity: (v: Density) => void;
  setShowWeekends: (v: boolean) => void;
}

export const useCalendarPrefs = create<CalendarPrefs>()(
  persist(
    (set) => ({
      weekStartsOn: 0,
      timeFormat: "12",
      defaultView: "week",
      density: "comfortable",
      showWeekends: true,
      showDeclined: false,
      hiddenCalendars: [],
      setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      setDefaultView: (defaultView) => set({ defaultView }),
      setDensity: (density) => set({ density }),
      setShowWeekends: (showWeekends) => set({ showWeekends }),
    }),
    { name: "nexus-calendar-prefs" },
  ),
);
