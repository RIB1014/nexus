export interface UserPreferences {
  instruments?: { name: string; emoji?: string }[];
  defaultHomeView?: string;
  notifications?: Record<string, unknown>;
}

export interface DashboardWidgetConfig {
  /** Module id whose dashboardWidget should render. */
  moduleId: string;
  /** Stable id for this widget instance (allows duplicates later). */
  id: string;
}

export interface DashboardLayout {
  widgets: DashboardWidgetConfig[];
}
