#!/usr/bin/env tsx
import dotenv from "dotenv";
dotenv.config();

import { storage } from "./storage";
import { hashPassword } from "./auth";

async function seedQuickDemo() {
  try {
    console.log("Seeding quick demo users...");

    const demo = [
      { email: "general@nec.com", password: "password123", firstName: "NEC", lastName: "General", role: "NEC_GENERAL", region: null },
      { email: "engineer@nec.com", password: "password123", firstName: "NEC", lastName: "Engineer", role: "NEC_ENGINEER", region: null },
      { email: "admin@nec.com", password: "password123", firstName: "NEC", lastName: "Admin", role: "NEC_ADMIN", region: null },
      { email: "client@company.com", password: "password123", firstName: "Client", lastName: "User", role: "CLIENT", region: null },
    ];

    for (const u of demo) {
      try {
        const hashed = await hashPassword(u.password);
        const userData = {
          email: u.email,
          password: hashed,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role as any,
          region: u.region,
          isActive: true,
        };

        await storage.upsertUser(userData as any);
        console.log(`Upserted user: ${u.email} -> password: ${u.password}`);
      } catch (err) {
        console.error(`Failed to upsert ${u.email}:`, err);
      }
    }

    console.log("Quick demo seeding finished.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedQuickDemo();
}
