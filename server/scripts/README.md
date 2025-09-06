This folder contains small seeding utilities.

seed_device_status.ts
- Seeds ~100 synthetic devices and device_metrics records into the database using the project's Drizzle DB instance.

How to run (Windows PowerShell):

Set your DATABASE_URL in .env or system environment, then:

# run seeder
npm run seed:devices
