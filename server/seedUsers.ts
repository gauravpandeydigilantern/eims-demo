import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedDemoUsers() {
  try {
    console.log("Seeding demo users...");

    const demoUsers = [
      {
        email: "general@nec.com",
        password: await hashPassword("password123"),
        firstName: "General",
        lastName: "Manager",
        role: "NEC_GENERAL" as const,
        region: null,
        isActive: true,
      },
      {
        email: "engineer@nec.com",
        password: await hashPassword("password123"),
        firstName: "Regional",
        lastName: "Engineer",
        role: "NEC_ENGINEER" as const,
        region: "Maharashtra",
        isActive: true,
      },
      {
        email: "admin@nec.com",
        password: await hashPassword("password123"),
        firstName: "System",
        lastName: "Admin",
        role: "NEC_ADMIN" as const,
        region: null,
        isActive: true,
      },
      {
        email: "client@company.com",
        password: await hashPassword("password123"),
        firstName: "Client",
        lastName: "User",
        role: "CLIENT" as const,
        region: null,
        isActive: true,
      },
    ];

    for (const userData of demoUsers) {
      try {
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(userData.email);
        if (!existingUser) {
          await storage.createUser(userData);
          console.log(`Created user: ${userData.email} (${userData.role})`);
        } else {
          console.log(`User already exists: ${userData.email}`);
        }
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
      }
    }

    console.log("Demo users seeding completed");
  } catch (error) {
    console.error("Error seeding demo users:", error);
  }
}