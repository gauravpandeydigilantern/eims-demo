import { Router } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { z } from 'zod';
import * as nodemailer from 'nodemailer';

const router = Router();

// Validation schemas
const notificationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  push: z.boolean().default(true),
  categories: z.object({
    critical_alerts: z.boolean().default(true),
    device_down: z.boolean().default(true),
    maintenance_due: z.boolean().default(true),
    performance_issues: z.boolean().default(false),
    system_updates: z.boolean().default(false),
  }).default({}),
  quiet_hours: z.object({
    enabled: z.boolean().default(false),
    start: z.string().default('22:00'),
    end: z.string().default('08:00'),
  }).default({}),
});

const sendNotificationSchema = z.object({
  recipients: z.array(z.string()),
  subject: z.string(),
  message: z.string(),
  type: z.enum(['email', 'sms', 'push']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  category: z.string(),
});

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Get user notification preferences
router.get('/preferences', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const preferences = await storage.getUserNotificationPreferences(userId);
    
    res.json(preferences || {
      email: true,
      sms: false,
      push: true,
      categories: {
        critical_alerts: true,
        device_down: true,
        maintenance_due: true,
        performance_issues: false,
        system_updates: false,
      },
      quiet_hours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ message: 'Failed to fetch preferences' });
  }
});

// Update user notification preferences
router.put('/preferences', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const preferences = notificationPreferencesSchema.parse(req.body);
    
    await storage.updateUserNotificationPreferences(userId, preferences);
    
    res.json({ message: 'Preferences updated successfully', preferences });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

// Send notification
router.post('/send', isAuthenticated, async (req: any, res) => {
  try {
    const notificationData = sendNotificationSchema.parse(req.body);
    const senderId = req.user.id;
    
    const result = await sendNotification(notificationData, senderId);
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Get notification history
router.get('/history', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, type, category } = req.query;
    
    const history = await storage.getNotificationHistory(userId, {
      page: Number(page),
      limit: Number(limit),
      type: type as string,
      category: category as string,
    });
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ message: 'Failed to fetch notification history' });
  }
});

// Mark notification as read
router.patch('/:id/read', isAuthenticated, async (req: any, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    await storage.markNotificationAsRead(notificationId, userId);
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Get notification statistics
router.get('/stats', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = '30days' } = req.query;
    
    const stats = await storage.getNotificationStats(userId, timeframe as string);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ message: 'Failed to fetch notification stats' });
  }
});

// Test notification
router.post('/test', isAuthenticated, async (req: any, res) => {
  try {
    const { type = 'email' } = req.body;
    const user = req.user;
    
    const testMessage = {
      recipients: [user.email],
      subject: 'EIMS Test Notification',
      message: 'This is a test notification from the EIMS system. If you received this, your notification settings are working correctly.',
      type,
      priority: 'low' as const,
      category: 'system_test',
    };
    
    const result = await sendNotification(testMessage, user.id);
    
    res.json({ message: 'Test notification sent', result });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Failed to send test notification' });
  }
});

// Core notification sending function
async function sendNotification(data: any, senderId: string) {
  const { recipients, subject, message, type, priority, category } = data;
  const results = [];
  
  for (const recipient of recipients) {
    try {
      let success = false;
      let error = null;
      
      switch (type) {
        case 'email':
          success = await sendEmailNotification(recipient, subject, message, priority);
          break;
        case 'sms':
          success = await sendSMSNotification(recipient, message, priority);
          break;
        case 'push':
          success = await sendPushNotification(recipient, subject, message, priority);
          break;
        default:
          throw new Error(`Unsupported notification type: ${type}`);
      }
      
      // Log notification
      await storage.logNotification({
        senderId,
        recipient,
        type,
        category,
        subject,
        message,
        priority,
        status: success ? 'sent' : 'failed',
        sentAt: new Date(),
      });
      
      results.push({
        recipient,
        type,
        success,
        error,
      });
      
    } catch (err) {
      console.error(`Error sending ${type} to ${recipient}:`, err);
      
      await storage.logNotification({
        senderId,
        recipient,
        type,
        category,
        subject,
        message,
        priority,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
        sentAt: new Date(),
      });
      
      results.push({
        recipient,
        type,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }
  
  return {
    totalSent: results.filter(r => r.success).length,
    totalFailed: results.filter(r => !r.success).length,
    results,
  };
}

async function sendEmailNotification(email: string, subject: string, message: string, priority: string): Promise<boolean> {
  try {
    const priorityPrefix = priority === 'critical' ? '[URGENT] ' : priority === 'high' ? '[HIGH] ' : '';
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@eims-system.com',
      to: email,
      subject: `${priorityPrefix}${subject}`,
      html: generateEmailTemplate(subject, message, priority),
    };
    
    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

async function sendSMSNotification(phone: string, message: string, priority: string): Promise<boolean> {
  try {
    // SMS integration would go here (Twilio, AWS SNS, etc.)
    // For demo purposes, we'll simulate SMS sending
    console.log(`SMS to ${phone}: ${message}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
}

async function sendPushNotification(userId: string, title: string, message: string, priority: string): Promise<boolean> {
  try {
    // Push notification integration would go here (Firebase, OneSignal, etc.)
    // For demo purposes, we'll simulate push notification sending
    console.log(`Push to ${userId}: ${title} - ${message}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return true;
  } catch (error) {
    console.error('Push notification sending failed:', error);
    return false;
  }
}

function generateEmailTemplate(subject: string, message: string, priority: string): string {
  const priorityColor = priority === 'critical' ? '#ef4444' : priority === 'high' ? '#f59e0b' : '#3b82f6';
  const priorityText = priority.toUpperCase();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="background-color: ${priorityColor}; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">EIMS Notification</h1>
                <div style="background-color: rgba(255,255,255,0.2); display: inline-block; padding: 4px 12px; border-radius: 20px; margin-top: 10px; font-size: 12px; font-weight: bold;">
                    ${priorityText} PRIORITY
                </div>
            </div>
            <div style="padding: 30px;">
                <h2 style="color: #333; margin-top: 0;">${subject}</h2>
                <div style="color: #666; line-height: 1.6; white-space: pre-line;">${message}</div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                    <p>This notification was sent from the EIMS (Enterprise Infrastructure Monitoring System).</p>
                    <p>Timestamp: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Automatic alert notification system
export async function sendAutomaticAlert(alert: any) {
  try {
    const users = await storage.getUsersForAlertNotification(alert.type, alert.priority);
    
    for (const user of users) {
      const preferences = await storage.getUserNotificationPreferences(user.id);
      if (!preferences) continue;
      
      // Check if user wants this type of alert
      if (!shouldSendAlert(alert, preferences)) continue;
      
      // Check quiet hours
      if (isInQuietHours(preferences.quiet_hours)) {
        if (alert.priority !== 'critical') continue;
      }
      
      const message = formatAlertMessage(alert);
      
      // Send via preferred channels
      if (preferences.email) {
        await sendEmailNotification(user.email, `EIMS Alert: ${alert.title}`, message, alert.priority);
      }
      
      if (preferences.push) {
        await sendPushNotification(user.id, alert.title, message, alert.priority);
      }
      
      if (preferences.sms && alert.priority === 'critical') {
        await sendSMSNotification(user.phone, message, alert.priority);
      }
    }
  } catch (error) {
    console.error('Error sending automatic alert:', error);
  }
}

function shouldSendAlert(alert: any, preferences: any): boolean {
  const category = alert.category || 'general';
  return preferences.categories[category] !== false;
}

function isInQuietHours(quietHours: any): boolean {
  if (!quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = quietHours.start.split(':').map(Number);
  const [endHour, endMin] = quietHours.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  if (startTime < endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    return currentTime >= startTime || currentTime <= endTime;
  }
}

function formatAlertMessage(alert: any): string {
  return `
Alert: ${alert.title}

Description: ${alert.description}

Device: ${alert.deviceId || 'System'}
Location: ${alert.location || 'N/A'}
Priority: ${alert.priority.toUpperCase()}
Time: ${new Date(alert.createdAt).toLocaleString()}

Please check the EIMS dashboard for more details and take appropriate action.
  `.trim();
}

export default router;
