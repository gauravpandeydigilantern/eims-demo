CREATE TYPE "public"."alert_category" AS ENUM('DEVICE_OFFLINE', 'PERFORMANCE', 'WEATHER', 'MAINTENANCE', 'SECURITY');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('CRITICAL', 'WARNING', 'INFO');--> statement-breakpoint
CREATE TYPE "public"."device_status" AS ENUM('LIVE', 'DOWN', 'MAINTENANCE', 'WARNING', 'SHUTDOWN');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('FIXED_READER', 'HANDHELD_DEVICE');--> statement-breakpoint
CREATE TYPE "public"."vendor" AS ENUM('BCIL', 'ZEBRA', 'IMP', 'ANJ');--> statement-breakpoint
CREATE TABLE "ai_chat_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar,
	"messages" jsonb DEFAULT '[]',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar,
	"type" "alert_type" NOT NULL,
	"category" "alert_category" NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"is_resolved" boolean DEFAULT false,
	"acknowledged_by" varchar,
	"acknowledged_at" timestamp,
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "device_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar NOT NULL,
	"cpu_usage" integer,
	"ram_usage" integer,
	"temperature" numeric(5, 2),
	"antenna_status" boolean DEFAULT true,
	"network_status" boolean DEFAULT true,
	"power_status" boolean DEFAULT true,
	"health_score" integer,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "device_operations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"operation" varchar NOT NULL,
	"status" varchar NOT NULL,
	"parameters" jsonb DEFAULT '{}',
	"result" text,
	"error_message" text,
	"executed_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" varchar PRIMARY KEY NOT NULL,
	"mac_address" varchar,
	"asset_id" varchar,
	"serial_number" varchar,
	"device_type" "device_type" NOT NULL,
	"vendor" "vendor" NOT NULL,
	"model" varchar,
	"firmware_version" varchar,
	"status" "device_status" DEFAULT 'DOWN' NOT NULL,
	"sub_status" varchar,
	"location" varchar NOT NULL,
	"toll_plaza" varchar NOT NULL,
	"region" varchar NOT NULL,
	"zone" varchar NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"install_date" timestamp,
	"last_seen" timestamp,
	"last_sync" timestamp,
	"last_transaction" timestamp,
	"last_tag_read" timestamp,
	"last_registration" timestamp,
	"uptime" integer DEFAULT 0,
	"transaction_count" integer DEFAULT 0,
	"pending_count" integer DEFAULT 0,
	"success_count" integer DEFAULT 0,
	"time_difference" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "devices_mac_address_unique" UNIQUE("mac_address")
);
--> statement-breakpoint
CREATE TABLE "maintenance_schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"priority" varchar DEFAULT 'MEDIUM' NOT NULL,
	"status" varchar DEFAULT 'SCHEDULED' NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"scheduled_date" timestamp NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"estimated_duration" integer,
	"actual_duration" integer,
	"assigned_to" varchar,
	"created_by" varchar NOT NULL,
	"completed_by" varchar,
	"required_parts" jsonb DEFAULT '[]',
	"notes" text,
	"attachments" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'CLIENT' NOT NULL,
	"region" varchar,
	"permissions" jsonb DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"last_login" timestamp,
	"login_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weather_data" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region" varchar NOT NULL,
	"city" varchar NOT NULL,
	"temperature" numeric(5, 2),
	"humidity" integer,
	"condition" varchar,
	"wind_speed" numeric(5, 2),
	"precipitation" numeric(5, 2),
	"alerts" jsonb DEFAULT '[]',
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_metrics" ADD CONSTRAINT "device_metrics_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_operations" ADD CONSTRAINT "device_operations_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_operations" ADD CONSTRAINT "device_operations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");