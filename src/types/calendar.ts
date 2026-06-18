export interface CalendarEventDTO {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
  location: string | null;
  notes: string | null;
  color: string | null;
  sourceType: string | null; // 'manual' | 'outlook' | 'canvas' | 'task'
  sourceId: string | null;
  /** Present for task-derived items so the UI can link/style them. */
  isTask?: boolean;
}
