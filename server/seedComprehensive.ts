#!/usr/bin/env tsx
import dotenv from "dotenv";
dotenv.config();

import { seedComprehensiveData } from "./data/comprehensiveSeedData";
import { seedDemoUsers } from "./seedUsers";

async function runComprehensiveSeeding() {
  try {
    console.log('🚀 Starting comprehensive database seeding...');
    console.log('This will seed the database with:');
    console.log('- Users for all 4 roles (NEC_GENERAL, NEC_ENGINEER, NEC_ADMIN, CLIENT)');
    console.log('- Weather data for all weather conditions');
    console.log('- Device operations and maintenance schedules');
    console.log('- AI chat sessions and comprehensive alerts');
    console.log('');
    
    // Run comprehensive seeding
    await seedComprehensiveData();
    
    console.log('');
    console.log('✅ Comprehensive seeding completed successfully!');
    console.log('');
    console.log('📧 Login credentials (password: password123):');
    console.log('');
    console.log('🔥 NEC_GENERAL (Full Access):');
    console.log('   • general.manager@nec.com');
    console.log('   • general.ops@nec.com');
    console.log('   • cto@nec.com');
    console.log('');
    console.log('🔧 NEC_ENGINEER (Regional Access):');
    console.log('   • engineer.mumbai@nec.com (Mumbai region)');
    console.log('   • engineer.delhi@nec.com (Delhi region)');
    console.log('   • engineer.bangalore@nec.com (Bangalore region)');
    console.log('   • engineer.chennai@nec.com (Chennai region)');
    console.log('   • engineer.kolkata@nec.com (Kolkata region)');
    console.log('   • engineer.hyderabad@nec.com (Hyderabad region)');
    console.log('   • engineer.pune@nec.com (Pune region)');
    console.log('   • engineer.ahmedabad@nec.com (Ahmedabad region)');
    console.log('');
    console.log('⚙️ NEC_ADMIN (Device Management):');
    console.log('   • admin.primary@nec.com');
    console.log('   • admin.tech@nec.com');
    console.log('   • admin.operations@nec.com');
    console.log('   • admin.security@nec.com');
    console.log('');
    console.log('👁️ CLIENT (Read-only):');
    console.log('   • client.primary@reliance.com');
    console.log('   • client.ops@reliance.com');
    console.log('   • client.primary@tata.com');
    console.log('   • client.finance@tata.com');
    console.log('   • client.primary@adani.com');
    console.log('   • client.tech@adani.com');
    console.log('   • client@larsentoubro.com');
    console.log('   • client@infosys.com');
    console.log('   • client@wipro.com');
    console.log('');
    console.log('🌤️ Weather Conditions Seeded:');
    console.log('   • sunny, cloudy, partly_cloudy, rainy');
    console.log('   • thunderstorm, fog, clear, windy');
    console.log('   • hot, cold (with appropriate alerts)');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Comprehensive seeding failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveSeeding();
}
