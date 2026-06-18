import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@nexus.app";

// Enabled-by-default for the demo so the app feels alive on first login.
const ENABLED_MODULES = [
  "tasks",
  "calendar",
  "notes",
  "practice-log",
  "habits",
  "wellness",
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setHours(17, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log("Seeding Nexus demo data…");

  const passwordHash = await bcrypt.hash("password123", 12);

  // Reset the demo user for an idempotent seed.
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Ryan Baek",
      passwordHash,
      onboarded: true,
      identityTags: ["student", "musician"],
      timezone: "America/New_York",
      weekStartsOn: 0,
      preferences: {
        instruments: [
          { name: "Piano", emoji: "🎹" },
          { name: "Violin", emoji: "🎻" },
        ],
      },
      dashboardLayout: {
        widgets: [
          { id: "w-tasks", moduleId: "tasks" },
          { id: "w-calendar", moduleId: "calendar" },
          { id: "w-habits", moduleId: "habits" },
          { id: "w-practice-log", moduleId: "practice-log" },
        ],
      },
    },
  });

  await prisma.userModule.createMany({
    data: ENABLED_MODULES.map((moduleId, i) => ({
      userId: user.id,
      moduleId,
      enabled: true,
      order: i,
    })),
  });

  // --- Task lists & tasks --------------------------------------------------
  const school = await prisma.taskList.create({
    data: { userId: user.id, name: "School", color: "#6366F1", icon: "📚", order: 0 },
  });
  const personal = await prisma.taskList.create({
    data: { userId: user.id, name: "Personal", color: "#22C55E", icon: "🏠", order: 1 },
  });
  const music = await prisma.taskList.create({
    data: { userId: user.id, name: "Music", color: "#A78BFA", icon: "🎵", order: 2 },
  });

  const tag = async (name: string, color: string) =>
    prisma.taskTag.create({ data: { userId: user.id, name, color } });
  const urgentTag = await tag("urgent", "#F43F5E");
  const readingTag = await tag("reading", "#38BDF8");

  await prisma.task.create({
    data: {
      userId: user.id,
      listId: school.id,
      title: "Finish music theory problem set",
      notes: "Chapters 4–5, focus on secondary dominants.",
      dueDate: daysFromNow(1),
      dueTime: "15:00",
      priority: "high",
      estimatedMin: 90,
      tags: { connect: [{ id: urgentTag.id }] },
    },
  });
  const essay = await prisma.task.create({
    data: {
      userId: user.id,
      listId: school.id,
      title: "Draft history essay",
      dueDate: daysFromNow(3),
      priority: "medium",
      tags: { connect: [{ id: readingTag.id }] },
    },
  });
  await prisma.task.createMany({
    data: [
      { userId: user.id, parentId: essay.id, title: "Outline argument", completed: true, completedAt: daysAgo(1) },
      { userId: user.id, parentId: essay.id, title: "Pull 3 primary sources" },
    ],
  });
  await prisma.task.create({
    data: {
      userId: user.id,
      listId: personal.id,
      title: "Schedule dentist appointment",
      dueDate: daysFromNow(0),
      priority: "low",
      flagged: true,
    },
  });
  await prisma.task.create({
    data: {
      userId: user.id,
      listId: music.id,
      title: "Memorize first movement",
      priority: "medium",
      flagged: true,
    },
  });
  await prisma.task.create({
    data: {
      userId: user.id,
      listId: personal.id,
      title: "Pick up dry cleaning",
      completed: true,
      completedAt: daysAgo(2),
    },
  });

  // --- Notes ---------------------------------------------------------------
  const notesRoot = await prisma.note.create({
    data: {
      userId: user.id,
      title: "Fall Semester",
      emoji: "🍂",
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Fall Semester" }] },
          { type: "paragraph", content: [{ type: "text", text: "A home for everything this term." }] },
        ],
      },
    },
  });
  await prisma.note.create({
    data: {
      userId: user.id,
      parentId: notesRoot.id,
      title: "Music Theory — Lecture 4",
      emoji: "🎼",
      tags: ["lecture"],
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Secondary dominants" }] },
          { type: "bulletList", content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "V/V resolves to V" }] }] },
          ] },
        ],
      },
    },
  });

  // --- Practice sessions ---------------------------------------------------
  const pieces = [{ name: "Chopin Nocturne Op. 9 No. 2", sections: ["A", "B"], notes: "Voicing in RH" }];
  for (let i = 0; i < 12; i++) {
    if (i % 4 === 3) continue; // a few rest days for a realistic streak/heatmap
    await prisma.practiceSession.create({
      data: {
        userId: user.id,
        instrument: i % 3 === 0 ? "Violin" : "Piano",
        durationMin: 25 + ((i * 13) % 50),
        date: daysAgo(i),
        pieces,
        goals: "Clean up the transition into B.",
        reflections: "Tempo more stable today; dynamics still uneven.",
        qualityRating: 3 + (i % 3),
        bpmRange: "60–88",
        tags: i % 2 === 0 ? ["technique", "repertoire"] : ["sight-reading"],
      },
    });
  }
  await prisma.repertoireItem.createMany({
    data: [
      { userId: user.id, title: "Chopin Nocturne Op. 9 No. 2", composer: "Chopin", instrument: "Piano", status: "polishing", lastPracticed: daysAgo(0) },
      { userId: user.id, title: "Bach Partita No. 2", composer: "Bach", instrument: "Violin", status: "learning", lastPracticed: daysAgo(2) },
    ],
  });

  // --- Habits --------------------------------------------------------------
  const practiceHabit = await prisma.habit.create({
    data: { userId: user.id, name: "Practice 30 min", emoji: "🎹", frequency: "daily", targetStreak: 30, color: "#A78BFA", order: 0 },
  });
  const readHabit = await prisma.habit.create({
    data: { userId: user.id, name: "Read 20 pages", emoji: "📖", frequency: "daily", targetStreak: 21, color: "#38BDF8", order: 1 },
  });
  for (let i = 0; i < 14; i++) {
    await prisma.habitLog.create({
      data: { habitId: practiceHabit.id, userId: user.id, date: daysAgo(i), completed: i % 4 !== 3 },
    });
    await prisma.habitLog.create({
      data: { habitId: readHabit.id, userId: user.id, date: daysAgo(i), completed: i % 3 !== 0 },
    });
  }

  // --- Wellness ------------------------------------------------------------
  for (let i = 0; i < 10; i++) {
    await prisma.wellnessLog.create({
      data: {
        userId: user.id,
        date: daysAgo(i),
        moodScore: 5 + (i % 5),
        energyScore: 4 + (i % 6),
        sleepHours: 6 + (i % 3),
        feelingTag: ["focused", "tired", "calm", "motivated"][i % 4],
        gratitude: i % 2 === 0 ? ["A good practice session", "Sunny walk", "Coffee with a friend"] : [],
      },
    });
  }

  // --- Calendar events -----------------------------------------------------
  await prisma.calendarEvent.createMany({
    data: [
      { userId: user.id, title: "Orchestra rehearsal", start: daysFromNow(1), end: daysFromNow(1), location: "Music Hall 210", sourceType: "manual", color: "#A78BFA" },
      { userId: user.id, title: "History lecture", start: daysFromNow(2), end: daysFromNow(2), location: "Lecture Hall B", sourceType: "manual", color: "#6366F1" },
    ],
  });

  console.log(`Seeded demo user: ${DEMO_EMAIL} / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
