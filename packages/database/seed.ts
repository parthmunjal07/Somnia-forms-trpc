import { scryptSync, randomBytes } from "node:crypto";
import { db } from "./index";
import { usersTable } from "./models/user";
import { formsTable, fieldsTable, responsesTable, analyticsTable } from "./models/form";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("starting seed...");

  // Seed Users
  console.log("Seeding users...");
  const [demoUser] = await db.insert(usersTable).values({
    fullName: "Demo User",
    email: "demo@somnia.io",
    passwordHash: hashPassword("Demo@2025"),
    role: "THE_ARCHITECT",
    emailVerified: true,
  }).returning();

  const [adminUser] = await db.insert(usersTable).values({
    fullName: "Admin Extractor",
    email: "admin@somnia.io",
    passwordHash: hashPassword("Admin@2025"),
    role: "THE_EXTRACTOR",
    emailVerified: true,
  }).returning();

  if (!demoUser || !adminUser) {
    throw new Error("Failed to seed users.");
  }

  // Seed Dreamscapes (Forms)
  console.log("🌌 Seeding Dreamscapes...");

  // Dreamscape 1: The Limbo Survey
  const [form1] = await db.insert(formsTable).values({
    userId: demoUser.id,
    title: "The Limbo Survey",
    slug: "limbo-survey",
    status: "published",
    visibility: "public",
  }).returning();

  if (!form1) {
    throw new Error("Failed to seed Form 1.");
  }

  const f1Fields = await db.insert(fieldsTable).values([
    { formId: form1.id, label: "Your deepest regret", type: "long_text", required: true, order: 1 },
    { formId: form1.id, label: "How many levels down did you go?", type: "number", required: true, order: 2 },
    { formId: form1.id, label: "Did you use a totem?", type: "checkbox", required: false, order: 3 },
    { formId: form1.id, label: "Select your totem type", type: "single_select", required: true, options: ["Top", "Chess Piece", "Die", "Token"], order: 4 },
    { formId: form1.id, label: "Rate your reality stability", type: "rating", required: true, order: 5 },
  ]).returning();

  // Dreamscape 2: Inception Feasibility Study
  const [form2] = await db.insert(formsTable).values({
    userId: adminUser.id,
    title: "Inception Feasibility Study",
    slug: "feasibility-study",
    status: "published",
    visibility: "unlisted",
  }).returning();

  if (!form2) {
    throw new Error("Failed to seed Form 2.");
  }

  const f2Fields = await db.insert(fieldsTable).values([
    { formId: form2.id, label: "Target name", type: "short_text", required: true, order: 1 },
    { formId: form2.id, label: "Primary objective", type: "long_text", required: true, order: 2 },
    { formId: form2.id, label: "Your team role", type: "single_select", required: true, options: ["Architect", "Extractor", "Point Man", "Forger", "Chemist"], order: 3 },
    { formId: form2.id, label: "Projected depth (levels)", type: "number", required: true, order: 4 },
    { formId: form2.id, label: "Drop-kick song selection", type: "single_select", required: true, options: ["Non, je ne regrette rien", "Time", "Mind Heist"], order: 5 },
    { formId: form2.id, label: "Scheduled kick date", type: "date", required: true, order: 6 },
  ]).returning();

  // Dreamscape 3: Subconscious Defense Assessment
  const [form3] = await db.insert(formsTable).values({
    userId: demoUser.id,
    title: "Subconscious Defense Assessment",
    slug: "subconscious-defense",
    status: "published",
    visibility: "public",
  }).returning();

  if (!form3) {
    throw new Error("Failed to seed Form 3.");
  }

  const f3Fields = await db.insert(fieldsTable).values([
    { formId: form3.id, label: "Projection threat level", type: "rating", required: true, order: 1 },
    { formId: form3.id, label: "Are the projections hostile?", type: "checkbox", required: true, order: 2 },
    { formId: form3.id, label: "Hostility types observed", type: "multi_select", required: false, options: ["Aggressive staring", "Armed attack", "Environmental collapse"], order: 3 },
    { formId: form3.id, label: "Contact email for extraction team", type: "email", required: true, order: 4 },
    { formId: form3.id, label: "Notes from the field", type: "long_text", required: false, order: 5 },
  ]).returning();

  // Seed Responses and Analytics
  console.log(" Seeding responses and analytics...");

  // Form 1 Analytics & Responses (150 views, 15 responses)
  await db.insert(analyticsTable).values({
    formId: form1.id,
    viewsCount: 150,
    submissionsCount: 15,
  });

  for (let i = 0; i < 15; i++) {
    await db.insert(responsesTable).values({
      formId: form1.id,
      responseValues: {
        [f1Fields[0]!.id]: `I left ${["Cobb", "Mal", "Saito", "Ariadne"][i % 4]} behind.`,
        [f1Fields[1]!.id]: (i % 4) + 1,
        [f1Fields[2]!.id]: i % 2 === 0,
        [f1Fields[3]!.id]: ["Top", "Chess Piece", "Die", "Token"][i % 4],
        [f1Fields[4]!.id]: (i % 5) + 1,
      },
    });
  }

  // Form 2 Analytics & Responses (75 views, 10 responses)
  await db.insert(analyticsTable).values({
    formId: form2.id,
    viewsCount: 75,
    submissionsCount: 10,
  });

  for (let i = 0; i < 10; i++) {
    await db.insert(responsesTable).values({
      formId: form2.id,
      responseValues: {
        [f2Fields[0]!.id]: `Robert Fischer ${i}`,
        [f2Fields[1]!.id]: `Plant the idea that his father ${i % 2 === 0 ? 'loved' : 'hated'} him.`,
        [f2Fields[2]!.id]: ["Architect", "Extractor", "Point Man", "Forger", "Chemist"][i % 5],
        [f2Fields[3]!.id]: 3,
        [f2Fields[4]!.id]: ["Non, je ne regrette rien", "Time", "Mind Heist"][i % 3],
        [f2Fields[5]!.id]: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      },
    });
  }

  // Form 3 Analytics & Responses (40 views, 5 responses)
  await db.insert(analyticsTable).values({
    formId: form3.id,
    viewsCount: 40,
    submissionsCount: 5,
  });

  for (let i = 0; i < 5; i++) {
    await db.insert(responsesTable).values({
      formId: form3.id,
      responseValues: {
        [f3Fields[0]!.id]: (i % 5) + 1,
        [f3Fields[1]!.id]: i % 2 !== 0,
        [f3Fields[2]!.id]: [["Aggressive staring"], ["Armed attack"], ["Environmental collapse"]][i % 3],
        [f3Fields[3]!.id]: `extractor${i}@somnia.io`,
        [f3Fields[4]!.id]: "The subconscious is militarized. Proceed with caution.",
      },
    });
  }

  console.log(" Seed completed successfully!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(" Seed failed:", e);
  process.exit(1);
});
