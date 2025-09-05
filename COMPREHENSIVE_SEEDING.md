# EIMS Database Comprehensive Seeding

This document describes the comprehensive database seeding that has been implemented for the EIMS (Edge Infrastructure Management System) demo.

## What Gets Seeded

### 1. Users for All 4 Roles (25 users total)

#### NEC_GENERAL (Full System Access) - 3 users
- `general.manager@nec.com` - System Administrator with full permissions
- `general.ops@nec.com` - Operations Manager with monitoring/emergency permissions  
- `cto@nec.com` - Technical Lead with architecture/system config permissions

#### NEC_ENGINEER (Regional Access) - 9 users
- `engineer.mumbai@nec.com` - Mumbai region engineer
- `engineer.mumbai2@nec.com` - Additional Mumbai engineer
- `engineer.delhi@nec.com` - Delhi region engineer  
- `engineer.delhi2@nec.com` - Additional Delhi engineer
- `engineer.bangalore@nec.com` - Bangalore region engineer
- `engineer.chennai@nec.com` - Chennai region engineer
- `engineer.kolkata@nec.com` - Kolkata region engineer
- `engineer.hyderabad@nec.com` - Hyderabad region engineer
- `engineer.pune@nec.com` - Pune region engineer
- `engineer.ahmedabad@nec.com` - Ahmedabad region engineer

#### NEC_ADMIN (Device Management) - 4 users  
- `admin.primary@nec.com` - Primary admin with user/device management
- `admin.tech@nec.com` - Technical admin with firmware/support permissions
- `admin.operations@nec.com` - Operations admin with monitoring/alerts
- `admin.security@nec.com` - Security admin with audit/compliance

#### CLIENT (Read-only Access) - 9 users
- `client.primary@reliance.com` - Reliance primary contact
- `client.ops@reliance.com` - Reliance operations
- `client.primary@tata.com` - Tata primary contact  
- `client.finance@tata.com` - Tata finance team
- `client.primary@adani.com` - Adani primary contact
- `client.tech@adani.com` - Adani technical team
- `client@larsentoubro.com` - L&T contact
- `client@infosys.com` - Infosys contact
- `client@wipro.com` - Wipro contact

**All users have password: `password123`**

### 2. Weather Data for All Conditions (10+ conditions)

The seeding creates comprehensive weather data covering all possible conditions:

- **sunny** - Clear sunny weather (25-40°C, low humidity)
- **cloudy** - Overcast conditions (20-30°C, moderate humidity) 
- **partly_cloudy** - Partially cloudy skies (22-32°C)
- **rainy** - Rain conditions with moderate precipitation (18-28°C, high humidity)
- **thunderstorm** - Severe weather with heavy rain and wind (20-30°C, very high humidity)
- **fog** - Dense fog with low visibility (15-25°C, very high humidity)
- **clear** - Clear weather conditions (20-35°C, moderate humidity)
- **windy** - High wind conditions (18-32°C, strong winds 25-50 km/h)
- **hot** - Extreme heat conditions (35-48°C, low humidity) 
- **cold** - Low temperature conditions (5-15°C)

Each condition includes appropriate weather alerts and realistic temperature/humidity ranges.

### 3. Device Data

If no devices exist, the system will seed:
- **4,000+** devices across 8 major regions
- **600+** toll plazas with 6-8 devices each
- Realistic device types (Fixed Readers & Handheld Devices)
- Multiple vendors (BCIL, ZEBRA, IMP, ANJ)
- Various device statuses with realistic distribution

### 4. Device Operations (50 operations)

Sample device operations performed by engineers:
- RESET_FULL, RESET_SERVICE, CONFIG_REFRESH
- FIRMWARE_UPDATE, DIAGNOSTIC_RUN, CALIBRATION
- NETWORK_TEST, ANTENNA_CHECK, POWER_CYCLE
- LOG_DOWNLOAD, BACKUP_CONFIG, RESTORE_CONFIG

### 5. AI Chat Sessions (15 sessions)

Sample AI chat conversations covering:
- Device troubleshooting scenarios
- Performance analytics queries  
- Weather impact analysis
- Maintenance schedule inquiries
- Alert investigations

### 6. Comprehensive Alerts (25+ alerts)

Various alert types demonstrating all conditions:
- **CRITICAL**: System failures, security breaches
- **WARNING**: Performance issues, weather impacts
- **INFO**: Maintenance reminders, planned outages

## How to Run Seeding

### Option 1: Automatic Seeding
The seeding runs automatically when you start the development server:

```bash
npm run dev
```

### Option 2: Manual Seeding
Run the comprehensive seeding script manually:

```bash
npm run db:seed
```

### Option 3: Database Initialization
Initialize the database and run seeding:

```bash
npm run db:init
npm run db:seed
```

## Seeding Behavior

- **Smart Detection**: Checks if data already exists to avoid duplicates
- **Incremental**: Only seeds missing data types
- **Safe**: Won't overwrite existing user accounts
- **Comprehensive**: Seeds all aspects for complete system demo

## Login Credentials

All seeded users use the password: **`password123`**

## Regional Coverage

The seeding covers these Indian regions:
- Mumbai, Delhi, Bangalore, Chennai
- Kolkata, Hyderabad, Pune, Ahmedabad
- Jaipur, Lucknow (for weather data)

## Weather Alert Examples

- **Heavy Rain**: Moderate to heavy rainfall expected
- **Severe Weather**: Thunderstorm warnings
- **Low Visibility**: Dense fog alerts
- **High Wind**: Strong wind warnings  
- **Extreme Heat**: High temperature alerts
- **Low Temperature**: Cold weather conditions

## Role-Based Permissions

Each role has appropriate permissions:
- **NEC_GENERAL**: Full system access
- **NEC_ENGINEER**: Regional restrictions based on assigned region
- **NEC_ADMIN**: Device/user management capabilities
- **CLIENT**: Read-only dashboard access

This comprehensive seeding ensures the EIMS demo system has realistic data for all user roles and weather conditions, providing a complete demonstration environment.
