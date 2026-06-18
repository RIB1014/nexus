import {
  addDays,
  nextDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  type Day,
} from "date-fns";

export type Priority = "none" | "low" | "medium" | "high" | "urgent";

export interface ParsedTask {
  title: string;
  dueDate: Date | null;
  dueTime: string | null; // "HH:MM"
  priority: Priority;
  tags: string[];
}

const WEEKDAYS: Record<string, Day> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sun: 0,
  mon: 1,
  tue: 2,
  tues: 2,
  wed: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  fri: 5,
  sat: 6,
};

const PRIORITY_WORDS: Record<string, Priority> = {
  urgent: "urgent",
  high: "high",
  medium: "medium",
  med: "medium",
  low: "low",
};

function atMidnight(d: Date): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(d, 0), 0), 0), 0);
}

/**
 * Lightweight natural-language parser for the Tasks quick-add bar.
 * Understands things like:
 *   "finish essay tomorrow at 3pm high priority #school"
 *   "call mom friday low"
 *   "submit form in 3 days !urgent"
 * Anything it doesn't recognize stays in the title.
 */
export function parseQuickAdd(input: string, now: Date = new Date()): ParsedTask {
  let text = ` ${input.trim()} `;
  let priority: Priority = "none";
  let dueDate: Date | null = null;
  let dueTime: string | null = null;
  const tags: string[] = [];

  // Tags: #word
  text = text.replace(/\s#([\p{L}\p{N}_-]+)/gu, (_m, tag) => {
    tags.push(String(tag).toLowerCase());
    return " ";
  });

  // Priority: "!high", "high priority", or a bare priority word.
  text = text.replace(
    /\s!?(urgent|high|medium|med|low)(\s+priority)?\b/gi,
    (_m, word) => {
      priority = PRIORITY_WORDS[String(word).toLowerCase()] ?? priority;
      return " ";
    },
  );

  // Time: "at 3pm", "3:30pm", "at 15:00"
  text = text.replace(
    /\s(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
    (whole, h, m, ap) => {
      let hour = parseInt(h, 10);
      const min = m ? parseInt(m, 10) : 0;
      const ampm = ap ? String(ap).toLowerCase() : null;
      // Only treat as a time if it looks like one (has am/pm or a colon, or
      // a plausible hour with explicit "at").
      if (!ampm && !m && !/\bat\s/i.test(whole)) return whole;
      if (hour > 23 || min > 59) return whole;
      if (ampm === "pm" && hour < 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0;
      dueTime = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      return " ";
    },
  );

  // Relative dates
  const lower = text.toLowerCase();
  const matchAndStrip = (re: RegExp) => {
    const m = lower.match(re);
    if (!m) return null;
    text = text.replace(new RegExp(m[0], "i"), " ");
    return m;
  };

  if (/\btoday\b/.test(lower)) {
    dueDate = atMidnight(now);
    matchAndStrip(/\btoday\b/);
  } else if (/\btonight\b/.test(lower)) {
    dueDate = atMidnight(now);
    if (!dueTime) dueTime = "20:00";
    matchAndStrip(/\btonight\b/);
  } else if (/\btomorrow\b/.test(lower)) {
    dueDate = atMidnight(addDays(now, 1));
    matchAndStrip(/\btomorrow\b/);
  } else {
    const inDays = lower.match(/\bin\s+(\d{1,3})\s+days?\b/);
    if (inDays) {
      dueDate = atMidnight(addDays(now, parseInt(inDays[1], 10)));
      text = text.replace(new RegExp(inDays[0], "i"), " ");
    } else {
      // "next monday" / "monday"
      const wd = lower.match(
        /\b(?:next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/,
      );
      if (wd) {
        const day = WEEKDAYS[wd[1]];
        dueDate = atMidnight(nextDay(now, day));
        text = text.replace(new RegExp(wd[0], "i"), " ");
      }
    }
  }

  const title = text.replace(/\s+/g, " ").trim();

  return {
    title: title || input.trim(),
    dueDate,
    dueTime,
    priority,
    tags,
  };
}
