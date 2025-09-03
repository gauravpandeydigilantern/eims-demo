import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedDemoUsers() {
  try {
    console.log("Seeding demo users...");

    const demoUsers = [
      // NEC General Manager (Full Access)
      {
        email: "general@nec.com",
        password: await hashPassword("password123"),
        firstName: "Rajesh",
        lastName: "Kumar",
        role: "NEC_GENERAL" as const,
        region: null,
        isActive: true,
      },
      
      // NEC Engineers for different regions (Geographic restrictions)
      {
        email: "engineer.mumbai@nec.com",
        password: await hashPassword("password123"),
        firstName: "Priya",
        lastName: "Sharma",
        role: "NEC_ENGINEER" as const,
        region: "Mumbai",
        isActive: true,
      },
      {
        email: "engineer.delhi@nec.com",
        password: await hashPassword("password123"),
        firstName: "Amit",
        lastName: "Singh",
        role: "NEC_ENGINEER" as const,
        region: "Delhi",
        isActive: true,
      },
      {
        email: "engineer.bangalore@nec.com",
        password: await hashPassword("password123"),
        firstName: "Sunita",
        lastName: "Reddy",
        role: "NEC_ENGINEER" as const,
        region: "Bangalore",
        isActive: true,
      },
      {
        email: "engineer.chennai@nec.com",
        password: await hashPassword("password123"),
        firstName: "Karthik",
        lastName: "Naidu",
        role: "NEC_ENGINEER" as const,
        region: "Chennai",
        isActive: true,
      },
      
      // NEC Admins for device management
      {
        email: "admin@nec.com",
        password: await hashPassword("password123"),
        firstName: "Deepak",
        lastName: "Patel",
        role: "NEC_ADMIN" as const,
        region: null,
        isActive: true,
      },
      {
        email: "admin.tech@nec.com",
        password: await hashPassword("password123"),
        firstName: "Sneha",
        lastName: "Joshi",
        role: "NEC_ADMIN" as const,
        region: null,
        isActive: true,
      },
      
      // Client users from different companies (Read-only access)
      {
        email: "client@reliance.com",
        password: await hashPassword("password123"),
        firstName: "Vikas",
        lastName: "Agarwal",
        role: "CLIENT" as const,
        region: null,
        isActive: true,
      },
      {
        email: "client@tata.com",
        password: await hashPassword("password123"),
        firstName: "Meera",
        lastName: "Gupta",
        role: "CLIENT" as const,
        region: null,
        isActive: true,
      },
      {
        email: "client@adani.com",
        password: await hashPassword("password123"),
        firstName: "Rohit",
        lastName: "Malhotra",
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