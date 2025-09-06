import { storage } from "../storage";
import { hashPassword } from "../auth";
import type { 
  InsertDevice, 
  InsertDeviceMetrics, 
  InsertAlert, 
  InsertWeatherData,
  InsertMaintenanceSchedule,
  InsertDeviceOperation,
  InsertAiChatSession,
  UpsertUser 
} from "@shared/schema";

export async function seedComprehensiveData() {
  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // 1. Seed users for all roles with comprehensive coverage
    await seedComprehensiveUsers();
    
    // 2. Seed devices (if not already done)
    const devices = await seedDevicesIfEmpty();
    
    // 3. Seed weather data for all conditions
    await seedComprehensiveWeatherData();
    
    // 4. Seed device operations
    await seedDeviceOperations(devices);
    
    // 5. Seed maintenance schedules - TODO: Implement when storage methods are available
    // await seedMaintenanceSchedules(devices);
    
    // 6. Seed AI chat sessions
    await seedAiChatSessions();
    
    // 7. Seed additional alerts for various conditions
    await seedComprehensiveAlerts(devices);
    
    console.log('✅ Comprehensive database seeding completed!');
  } catch (error) {
    console.error('❌ Error during comprehensive seeding:', error);
    throw error;
  }
}

async function seedComprehensiveUsers() {
  console.log('👥 Seeding comprehensive users for all roles...');

  try {
    // Check if users already exist
    const existingUsers = await storage.getAllUsers();
    if (existingUsers && existingUsers.length >= 20) {
      console.log(`✅ Database already has ${existingUsers.length} users. Skipping user creation.`);
      return;
    }
  } catch (error) {
    console.log('No existing users found. Proceeding with user creation...');
  }

  const comprehensiveUsers = [
    // NEC_GENERAL users (Full system access)
    {
      email: "general.manager@nec.com",
      password: await hashPassword("password123"),
      firstName: "Rajesh",
      lastName: "Kumar",
      role: "NEC_GENERAL" as const,
      region: null,
      permissions: { 
        all: true, 
        admin: true, 
        analytics: true,
        reports: true,
        user_management: true 
      },
      isActive: true,
    },
    {
      email: "general.ops@nec.com",
      password: await hashPassword("password123"),
      firstName: "Kavitha",
      lastName: "Menon",
      role: "NEC_GENERAL" as const,
      region: null,
      permissions: { 
        all: true, 
        operations: true, 
        monitoring: true,
        emergency_response: true 
      },
      isActive: true,
    },
    {
      email: "cto@nec.com",
      password: await hashPassword("password123"),
      firstName: "Dr. Anand",
      lastName: "Krishnamurthy",
      role: "NEC_GENERAL" as const,
      region: null,
      permissions: { 
        all: true, 
        technical: true, 
        system_config: true,
        architecture: true 
      },
      isActive: true,
    },

    // NEC_ENGINEER users for all regions (Geographic restrictions)
    {
      email: "engineer.mumbai@nec.com",
      password: await hashPassword("password123"),
      firstName: "Priya",
      lastName: "Sharma",
      role: "NEC_ENGINEER" as const,
      region: "Mumbai",
      permissions: { 
        regional: ["Mumbai", "Pune"],
        device_operations: true,
        maintenance: true 
      },
      isActive: true,
    },
    {
      email: "engineer.mumbai2@nec.com",
      password: await hashPassword("password123"),
      firstName: "Vikram",
      lastName: "Desai",
      role: "NEC_ENGINEER" as const,
      region: "Mumbai",
      permissions: { 
        regional: ["Mumbai"],
        device_troubleshooting: true 
      },
      isActive: true,
    },
    {
      email: "engineer.delhi@nec.com",
      password: await hashPassword("password123"),
      firstName: "Amit",
      lastName: "Singh",
      role: "NEC_ENGINEER" as const,
      region: "Delhi",
      permissions: { 
        regional: ["Delhi"],
        device_operations: true,
        field_support: true 
      },
      isActive: true,
    },
    {
      email: "engineer.delhi2@nec.com",
      password: await hashPassword("password123"),
      firstName: "Neha",
      lastName: "Gupta",
      role: "NEC_ENGINEER" as const,
      region: "Delhi",
      permissions: { 
        regional: ["Delhi"],
        preventive_maintenance: true 
      },
      isActive: true,
    },
    {
      email: "engineer.bangalore@nec.com",
      password: await hashPassword("password123"),
      firstName: "Sunita",
      lastName: "Reddy",
      role: "NEC_ENGINEER" as const,
      region: "Bangalore",
      permissions: { 
        regional: ["Bangalore", "Hyderabad"],
        device_operations: true 
      },
      isActive: true,
    },
    {
      email: "engineer.chennai@nec.com",
      password: await hashPassword("password123"),
      firstName: "Karthik",
      lastName: "Naidu",
      role: "NEC_ENGINEER" as const,
      region: "Chennai",
      permissions: { 
        regional: ["Chennai"],
        device_operations: true,
        emergency_response: true 
      },
      isActive: true,
    },
    {
      email: "engineer.kolkata@nec.com",
      password: await hashPassword("password123"),
      firstName: "Subrata",
      lastName: "Ghosh",
      role: "NEC_ENGINEER" as const,
      region: "Kolkata",
      permissions: { 
        regional: ["Kolkata"],
        device_operations: true 
      },
      isActive: true,
    },
    {
      email: "engineer.hyderabad@nec.com",
      password: await hashPassword("password123"),
      firstName: "Ramesh",
      lastName: "Chandra",
      role: "NEC_ENGINEER" as const,
      region: "Hyderabad",
      permissions: { 
        regional: ["Hyderabad"],
        device_operations: true 
      },
      isActive: true,
    },
    {
      email: "engineer.pune@nec.com",
      password: await hashPassword("password123"),
      firstName: "Aishwarya",
      lastName: "Patil",
      role: "NEC_ENGINEER" as const,
      region: "Pune",
      permissions: { 
        regional: ["Pune", "Mumbai"],
        device_operations: true 
      },
      isActive: true,
    },
    {
      email: "engineer.ahmedabad@nec.com",
      password: await hashPassword("password123"),
      firstName: "Jayesh",
      lastName: "Patel",
      role: "NEC_ENGINEER" as const,
      region: "Ahmedabad",
      permissions: { 
        regional: ["Ahmedabad"],
        device_operations: true 
      },
      isActive: true,
    },

    // NEC_ADMIN users for device management
    {
      email: "admin.primary@nec.com",
      password: await hashPassword("password123"),
      firstName: "Deepak",
      lastName: "Patel",
      role: "NEC_ADMIN" as const,
      region: null,
      permissions: { 
        admin: true, 
        device_management: true,
        user_management: true,
        system_config: true 
      },
      isActive: true,
    },
    {
      email: "admin.tech@nec.com",
      password: await hashPassword("password123"),
      firstName: "Sneha",
      lastName: "Joshi",
      role: "NEC_ADMIN" as const,
      region: null,
      permissions: { 
        admin: true, 
        device_management: true,
        firmware_updates: true,
        technical_support: true 
      },
      isActive: true,
    },
    {
      email: "admin.operations@nec.com",
      password: await hashPassword("password123"),
      firstName: "Ravi",
      lastName: "Mehta",
      role: "NEC_ADMIN" as const,
      region: null,
      permissions: { 
        admin: true, 
        operations: true,
        monitoring: true,
        alert_management: true 
      },
      isActive: true,
    },
    {
      email: "admin.security@nec.com",
      password: await hashPassword("password123"),
      firstName: "Pooja",
      lastName: "Agarwal",
      role: "NEC_ADMIN" as const,
      region: null,
      permissions: { 
        admin: true, 
        security: true,
        audit: true,
        compliance: true 
      },
      isActive: true,
    },

    // CLIENT users from different companies (Read-only access)
    {
      email: "client.primary@reliance.com",
      password: await hashPassword("password123"),
      firstName: "Vikas",
      lastName: "Agarwal",
      role: "CLIENT" as const,
      region: null,
      permissions: { 
        readonly: true,
        dashboard: true,
        reports: ["performance", "transaction"] 
      },
      isActive: true,
    },
    {
      email: "client.ops@reliance.com",
      password: await hashPassword("password123"),
      firstName: "Sanjay",
      lastName: "Malhotra",
      role: "CLIENT" as const,
      region: null,
      permissions: { 
        readonly: true,
        operational_view: true 
      },
      isActive: true,
    },
    {
      email: "client.primary@tata.com",
      password: await hashPassword("password123"),
      firstName: "Meera",
      lastName: "Gupta",
      role: "CLIENT" as const,
      region: null,
      permissions: { 
        readonly: true,
        analytics: true,
        regional_view: ["Mumbai", "Delhi", "Bangalore"] 
      },
      isActive: true,
    },
    {
      email: "client.finance@tata.com",
      password: await hashPassword("password123"),
      firstName: "Arjun",
      lastName: "Tiwari",
      role: "CLIENT" as const,
      region: null,
      permissions: { 
        readonly: true,
        financial_reports: true 
      },
      isActive: true,
    },
    {
      email: "client.primary@adani.com",
      password: await hashPassword("password123"),
      firstName: "Rohit",
      lastName: "Malhotra",
      role: "CLIENT" as const,
      region: null,
      permissions: { 
        readonly: true,
        dashboard: true,
        performance_metrics: true 
      },
      isActive: true,
    },
    {
      email: "client.tech@adani.com",
      password: await hashPassword("password123"),
      firstName: "Shreya",
      lastName: "Nair",
      role: "CLIENT" as const,
      region: null,
      permissions: { 
        readonly: true,
        technical_view: true 
      },
      isActive: true,
    },
    {
      email: "client@larsentoubro.com",
      password: await hashPassword("password123"),
      firstName: "Manoj",
      lastName: "Kumar",
      role: "CLIENT" as const,
      region: null,
      permissions: { 
        readonly: true,
        project_view: true 
      },
      isActive: true,
    },
    {
      email: "client@infosys.com",
      password: await hashPassword("password123"),
      firstName: "Divya",
      lastName: "Krishnan",
      role: "CLIENT" as const,
      region: null,
      permissions: { 
        readonly: true,
        it_integration: true 
      },
      isActive: true,
    },
    {
      email: "client@wipro.com",
      password: await hashPassword("password123"),
      firstName: "Suresh",
      lastName: "Babu",
      role: "CLIENT" as const,
      region: null,
      permissions: { 
        readonly: true,
        dashboard: true 
      },
      isActive: true,
    },
  ];

  // Create users
  for (const userData of comprehensiveUsers) {
    try {
      const existingUser = await storage.getUserByEmail(userData.email);
      if (!existingUser) {
        await storage.createUser(userData);
        console.log(`✅ Created user: ${userData.email} (${userData.role})`);
      } else {
        console.log(`ℹ️ User already exists: ${userData.email}`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }

  // Update some users with recent login times for realistic activity monitoring
  console.log('🔄 Updating user login timestamps for activity monitoring...');
  try {
    const allUsers = await storage.getAllUsers();
    const recentLoginUsers = allUsers.slice(0, Math.min(8, allUsers.length)); // Update first 8 users
    
    for (let i = 0; i < recentLoginUsers.length; i++) {
      const user = recentLoginUsers[i];
      // Simulate logins at different times in the last 24 hours
      const loginTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
      await storage.updateUser(user.id, { lastLogin: loginTime });
    }
    console.log(`✅ Updated login timestamps for ${recentLoginUsers.length} users`);
  } catch (error) {
    console.error('❌ Error updating user login timestamps:', error);
  }

  console.log('✅ Comprehensive users seeding completed');
}

async function seedDevicesIfEmpty(): Promise<any[]> {
  try {
    const existingDevices = await storage.getAllDevices();
    if (existingDevices && existingDevices.length > 0) {
      console.log(`ℹ️ Database already has ${existingDevices.length} devices. Skipping device creation.`);
      return existingDevices;
    }
  } catch (error) {
    console.log('No existing devices found. Creating devices...');
  }

  // Import and run the existing device seeding
  const { seedDatabase } = await import('./seedData');
  await seedDatabase();
  
  return await storage.getAllDevices();
}

async function seedComprehensiveWeatherData() {
  console.log('🌤️ Seeding comprehensive weather data for all conditions...');

  const weatherRegions = [
    { region: 'Mumbai', city: 'Mumbai' },
    { region: 'Delhi', city: 'Delhi' },
    { region: 'Bangalore', city: 'Bangalore' },
    { region: 'Chennai', city: 'Chennai' },
    { region: 'Kolkata', city: 'Kolkata' },
    { region: 'Hyderabad', city: 'Hyderabad' },
    { region: 'Pune', city: 'Pune' },
    { region: 'Ahmedabad', city: 'Ahmedabad' },
    { region: 'Jaipur', city: 'Jaipur' },
    { region: 'Lucknow', city: 'Lucknow' },
  ];

  // All possible weather conditions
  const allWeatherConditions = [
    {
      condition: 'sunny',
      tempRange: [25, 40],
      humidityRange: [30, 60],
      windRange: [5, 15],
      precipitation: 0,
      alerts: []
    },
    {
      condition: 'cloudy',
      tempRange: [20, 30],
      humidityRange: [50, 80],
      windRange: [8, 20],
      precipitation: 0,
      alerts: []
    },
    {
      condition: 'partly_cloudy',
      tempRange: [22, 32],
      humidityRange: [40, 70],
      windRange: [6, 18],
      precipitation: 0,
      alerts: []
    },
    {
      condition: 'rainy',
      tempRange: [18, 28],
      humidityRange: [70, 95],
      windRange: [10, 30],
      precipitation: [5, 50],
      alerts: [{
        type: 'Heavy Rain',
        severity: 'medium',
        description: 'Moderate to heavy rainfall expected',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      }]
    },
    {
      condition: 'thunderstorm',
      tempRange: [20, 30],
      humidityRange: [80, 95],
      windRange: [20, 45],
      precipitation: [20, 80],
      alerts: [{
        type: 'Severe Weather',
        severity: 'high',
        description: 'Thunderstorm with strong winds and heavy rain',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      }]
    },
    {
      condition: 'fog',
      tempRange: [15, 25],
      humidityRange: [85, 98],
      windRange: [2, 8],
      precipitation: [0, 5],
      alerts: [{
        type: 'Low Visibility',
        severity: 'medium',
        description: 'Dense fog reducing visibility',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      }]
    },
    {
      condition: 'clear',
      tempRange: [20, 35],
      humidityRange: [25, 55],
      windRange: [3, 12],
      precipitation: 0,
      alerts: []
    },
    {
      condition: 'windy',
      tempRange: [18, 32],
      humidityRange: [40, 75],
      windRange: [25, 50],
      precipitation: 0,
      alerts: [{
        type: 'High Wind',
        severity: 'medium',
        description: 'Strong winds may affect device performance',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      }]
    },
    {
      condition: 'hot',
      tempRange: [35, 48],
      humidityRange: [20, 40],
      windRange: [5, 15],
      precipitation: 0,
      alerts: [{
        type: 'Extreme Heat',
        severity: 'high',
        description: 'High temperature may affect device performance',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      }]
    },
    {
      condition: 'cold',
      tempRange: [5, 15],
      humidityRange: [30, 60],
      windRange: [8, 20],
      precipitation: 0,
      alerts: [{
        type: 'Low Temperature',
        severity: 'low',
        description: 'Cold weather conditions detected',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      }]
    }
  ];

  // Assign different weather conditions to different regions
  for (let i = 0; i < weatherRegions.length; i++) {
    const location = weatherRegions[i];
    const weatherCondition = allWeatherConditions[i % allWeatherConditions.length];
    
    const tempRange = Array.isArray(weatherCondition.tempRange) ? weatherCondition.tempRange : [weatherCondition.tempRange, weatherCondition.tempRange];
    const humidityRange = Array.isArray(weatherCondition.humidityRange) ? weatherCondition.humidityRange : [weatherCondition.humidityRange, weatherCondition.humidityRange];
    const windRange = Array.isArray(weatherCondition.windRange) ? weatherCondition.windRange : [weatherCondition.windRange, weatherCondition.windRange];
    const precipitationRange = Array.isArray(weatherCondition.precipitation) ? weatherCondition.precipitation : [weatherCondition.precipitation, weatherCondition.precipitation];

    const weatherData: InsertWeatherData = {
      region: location.region,
      city: location.city,
      temperature: (tempRange[0] + Math.random() * (tempRange[1] - tempRange[0])).toFixed(1),
      humidity: Math.floor(humidityRange[0] + Math.random() * (humidityRange[1] - humidityRange[0])),
      condition: weatherCondition.condition,
      windSpeed: (windRange[0] + Math.random() * (windRange[1] - windRange[0])).toFixed(1),
      precipitation: precipitationRange[0] === precipitationRange[1] ? 
        precipitationRange[0].toString() : 
        (precipitationRange[0] + Math.random() * (precipitationRange[1] - precipitationRange[0])).toFixed(1),
      alerts: weatherCondition.alerts,
    };

    try {
      await storage.updateWeatherData(weatherData);
      // console.log(`✅ Created weather data for ${location.city}: ${weatherCondition.condition}`);
    } catch (error) {
      console.error(`❌ Failed to create weather data for ${location.city}:`, error);
    }
  }

  console.log('✅ Comprehensive weather data seeding completed');
}

async function seedDeviceOperations(devices: any[]) {
  console.log('🔧 Seeding device operations...');

  const users = await storage.getAllUsers();
  const engineers = users.filter(u => u.role === 'NEC_ENGINEER' || u.role === 'NEC_ADMIN');
  
  if (engineers.length === 0) {
    console.log('No engineers found for device operations');
    return;
  }

  const operations = [
    'RESET_FULL', 'RESET_SERVICE', 'CONFIG_REFRESH', 'FIRMWARE_UPDATE',
    'DIAGNOSTIC_RUN', 'CALIBRATION', 'NETWORK_TEST', 'ANTENNA_CHECK',
    'POWER_CYCLE', 'LOG_DOWNLOAD', 'BACKUP_CONFIG', 'RESTORE_CONFIG'
  ];

  const statuses = ['SUCCESS', 'PENDING', 'FAILED'];
  const operationsToCreate = Math.min(50, devices.length * 2); // Limit to 50 operations

  for (let i = 0; i < operationsToCreate; i++) {
    const device = devices[Math.floor(Math.random() * devices.length)];
    const engineer = engineers[Math.floor(Math.random() * engineers.length)];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const operationData: InsertDeviceOperation = {
      deviceId: device.id,
      userId: engineer.id,
      operation,
      status,
      parameters: {
        timestamp: new Date().toISOString(),
        initiatedBy: engineer.email,
        reason: 'Routine maintenance',
      },
      result: status === 'SUCCESS' ? 'Operation completed successfully' : 
              status === 'FAILED' ? 'Operation failed due to network timeout' : null,
      errorMessage: status === 'FAILED' ? 'Network connection timeout after 30 seconds' : null,
      executedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in past week
      completedAt: status !== 'PENDING' ? new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000) : null,
    };

    try {
      await storage.createDeviceOperation(operationData);
    } catch (error) {
      console.error(`Failed to create device operation for ${device.id}:`, error);
    }
  }

  console.log(`✅ Created ${operationsToCreate} device operations`);
}

async function seedMaintenanceSchedules(devices: any[]) {
  console.log('🔨 Seeding maintenance schedules...');

  const users = await storage.getAllUsers();
  const engineers = users.filter(u => u.role === 'NEC_ENGINEER');
  const admins = users.filter(u => u.role === 'NEC_ADMIN' || u.role === 'NEC_GENERAL');
  
  if (engineers.length === 0 || admins.length === 0) {
    console.log('Not enough users found for maintenance schedules');
    return;
  }

  const maintenanceTypes = ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'];

  const schedulesToCreate = Math.min(30, devices.length); // Limit to 30 schedules

  for (let i = 0; i < schedulesToCreate; i++) {
    const device = devices[Math.floor(Math.random() * devices.length)];
    const engineer = engineers[Math.floor(Math.random() * engineers.length)];
    const admin = admins[Math.floor(Math.random() * admins.length)];
    const maintenanceType = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const scheduleData: InsertMaintenanceSchedule = {
      deviceId: device.id,
      type: maintenanceType,
      priority,
      status,
      title: `${maintenanceType.toLowerCase()} maintenance for ${device.id}`,
      description: `Routine ${maintenanceType.toLowerCase()} maintenance scheduled for device ${device.id} at ${device.location}`,
      scheduledDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in next 30 days
      startedAt: status === 'IN_PROGRESS' || status === 'COMPLETED' ? 
        new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000) : null,
      completedAt: status === 'COMPLETED' ? 
        new Date(Date.now() - Math.random() * 1 * 24 * 60 * 60 * 1000) : null,
      estimatedDuration: Math.floor(Math.random() * 240) + 60, // 1-4 hours in minutes
      actualDuration: status === 'COMPLETED' ? Math.floor(Math.random() * 300) + 30 : null,
      assignedTo: engineer.id,
      createdBy: admin.id,
      completedBy: status === 'COMPLETED' ? engineer.id : null,
      requiredParts: [
        { name: 'Antenna cable', quantity: 1, partNumber: 'ANT-001' },
        { name: 'Power adapter', quantity: 1, partNumber: 'PWR-002' }
      ],
      notes: status === 'COMPLETED' ? 'Maintenance completed successfully. All systems operational.' : 
             status === 'IN_PROGRESS' ? 'Maintenance in progress. Expected completion in 2 hours.' :
             'Scheduled for routine maintenance check.',
    };

    try {
      // TODO: Implement createMaintenanceSchedule method in storage
      console.log(`Maintenance schedule created for ${device.id} (method not implemented yet)`);
      // await storage.createMaintenanceSchedule(scheduleData);
    } catch (error) {
      console.error(`Failed to create maintenance schedule for ${device.id}:`, error);
    }
  }

  console.log(`✅ Created ${schedulesToCreate} maintenance schedules`);
}

async function seedAiChatSessions() {
  console.log('🤖 Seeding AI chat sessions...');

  const users = await storage.getAllUsers();
  const sessionsToCreate = Math.min(15, users.length); // Limit to 15 sessions

  const sampleConversations = [
    {
      title: "Device Troubleshooting",
      messages: [
        { role: "user", content: "Help me troubleshoot device FR_MUM_01_01 that's showing offline status" },
        { role: "assistant", content: "I'll help you troubleshoot device FR_MUM_01_01. Let me check the device status and recent metrics..." },
        { role: "user", content: "What could be the common causes for this device going offline?" },
        { role: "assistant", content: "Common causes for device offline status include: 1) Network connectivity issues, 2) Power supply problems, 3) Hardware malfunction, 4) Configuration errors. Let me analyze the recent data for this specific device." }
      ]
    },
    {
      title: "Performance Analytics Query",
      messages: [
        { role: "user", content: "Show me the performance trends for Mumbai region devices" },
        { role: "assistant", content: "Here's the performance analysis for Mumbai region devices. I can see there are 145 toll plazas with varying performance metrics..." },
        { role: "user", content: "Which devices have the lowest performance scores?" },
        { role: "assistant", content: "Based on the latest health scores, the following devices in Mumbai region have performance concerns..." }
      ]
    },
    {
      title: "Weather Impact Analysis",
      messages: [
        { role: "user", content: "How is the current weather affecting device performance in Chennai?" },
        { role: "assistant", content: "Current weather conditions in Chennai show thunderstorm activity which may impact device performance..." }
      ]
    },
    {
      title: "Maintenance Schedule Query",
      messages: [
        { role: "user", content: "What maintenance is scheduled for this week?" },
        { role: "assistant", content: "Here's the maintenance schedule for this week across all regions..." }
      ]
    },
    {
      title: "Alert Investigation",
      messages: [
        { role: "user", content: "Explain the critical alerts I'm seeing on my dashboard" },
        { role: "assistant", content: "I can see several critical alerts in your dashboard. Let me break them down by priority and provide recommended actions..." }
      ]
    }
  ];

  for (let i = 0; i < sessionsToCreate; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const conversation = sampleConversations[Math.floor(Math.random() * sampleConversations.length)];

    const sessionData: InsertAiChatSession = {
      userId: user.id,
      title: conversation.title,
      messages: conversation.messages,
      isActive: Math.random() > 0.3, // 70% active sessions
    };

    try {
      await storage.createChatSession(sessionData);
    } catch (error) {
      console.error(`Failed to create AI chat session for user ${user.email}:`, error);
    }
  }

  console.log(`✅ Created ${sessionsToCreate} AI chat sessions`);
}

async function seedComprehensiveAlerts(devices: any[]) {
  console.log('🚨 Seeding comprehensive alerts...');

  // Create various types of alerts to demonstrate all conditions
  const alertTypes = [
    {
      type: 'CRITICAL',
      category: 'DEVICE_OFFLINE',
      title: 'Critical System Failure',
      message: 'Multiple devices have gone offline simultaneously in the same region',
    },
    {
      type: 'CRITICAL',
      category: 'SECURITY',
      title: 'Security Breach Detected',
      message: 'Unauthorized access attempt detected on critical infrastructure',
    },
    {
      type: 'WARNING',
      category: 'PERFORMANCE',
      title: 'Performance Degradation',
      message: 'Device performance has declined below acceptable thresholds',
    },
    {
      type: 'WARNING',
      category: 'WEATHER',
      title: 'Severe Weather Impact',
      message: 'Current weather conditions are affecting device operations',
    },
    {
      type: 'INFO',
      category: 'MAINTENANCE',
      title: 'Scheduled Maintenance Reminder',
      message: 'Upcoming scheduled maintenance for critical devices',
    },
    {
      type: 'INFO',
      category: 'DEVICE_OFFLINE',
      title: 'Planned Maintenance Window',
      message: 'Device will be offline during scheduled maintenance window',
    },
  ];

  const alertsToCreate = Math.min(25, devices.length); // Limit to 25 alerts

  for (let i = 0; i < alertsToCreate; i++) {
    const device = devices[Math.floor(Math.random() * devices.length)];
    const alertTemplate = alertTypes[Math.floor(Math.random() * alertTypes.length)];

    const alertData: InsertAlert = {
      deviceId: Math.random() > 0.3 ? device.id : null, // 30% regional alerts without specific device
      type: alertTemplate.type as any,
      category: alertTemplate.category as any,
      title: alertTemplate.title,
      message: device ? `${alertTemplate.message} - Device: ${device.id} at ${device.location}` : 
               `${alertTemplate.message} - Region: ${device.region}`,
      isRead: Math.random() > 0.4, // 60% read alerts
      isResolved: Math.random() > 0.7, // 30% resolved alerts
      metadata: {
        deviceId: device.id,
        region: device.region,
        severity: alertTemplate.type.toLowerCase(),
        timestamp: new Date().toISOString(),
        source: 'automated_monitoring',
      },
    };

    try {
      await storage.createAlert(alertData);
    } catch (error) {
      console.error(`Failed to create alert for device ${device.id}:`, error);
    }
  }

  console.log(`✅ Created ${alertsToCreate} comprehensive alerts`);
}
