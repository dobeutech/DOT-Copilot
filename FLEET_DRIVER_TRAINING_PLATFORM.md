# Fleet Driver Training Platform - Comprehensive Analysis & Development Roadmap

## Executive Summary

This document provides a complete analysis of the existing codebase and a comprehensive development roadmap for a **Fleet Driver Training Platform** - a niche solution designed specifically for fleet operators dealing with high driver turnover, varying experience levels (0 years to veterans), and the need to centralize training administration while empowering drivers to self-manage their training journey.

---

## 🎯 Vision & Target Market

### Core Problem Statement
Fleet operators face:
- **High driver turnover** requiring constant onboarding
- **Wide experience variance** (new CDL holders to 20+ year veterans)
- **Decentralized training administration**
- **Compliance tracking challenges** across multiple locations
- **No real-time visibility** into training completion status

### Target Users
| Role | Access Type | Primary Needs |
|------|-------------|---------------|
| **Driver** | Mobile App (iOS/Android) + Web Portal | Complete training, view progress, compare against fleet |
| **Driver Coach/Supervisor** | Web Portal (Mobile-Friendly) | Assign training, track team progress, coach drivers |
| **Branch Manager** | Web Portal | Location-level reporting, compliance oversight |
| **Fleet Administrator** | Web Portal | Full access, content management, system configuration |

### Differentiators from Skillsoft/Enterprise LMS
- **Niche focus** on fleet/transportation industry
- **Telematics integration** (Samsara, Motive) via Make/Zapier
- **DOT compliance-first** design
- **Simple, non-power-user friendly** interface
- **Driver gamification** (fleet rankings/comparisons)
- **Mobile-first driver experience**

---

## 📊 Current Codebase Assessment

### Existing Project: DOT-Copilot

**Location:** `/workspace/cursor-projects/DOT-Copilot/`

#### ✅ What Already Exists

| Component | Status | Notes |
|-----------|--------|-------|
| **Backend API** | ✅ Functional | Express.js + TypeScript + Prisma |
| **Database Schema** | ✅ Complete | PostgreSQL with comprehensive models |
| **Frontend Base** | ⚠️ Basic | React + TypeScript + Vite (needs expansion) |
| **Authentication** | ✅ Complete | JWT with refresh tokens, password reset |
| **User Roles** | ✅ Implemented | DRIVER, SUPERVISOR, ADMIN |
| **Training Structure** | ✅ Implemented | Programs → Modules → Lessons → Quizzes |
| **Assignments** | ✅ Implemented | Assign training to drivers |
| **Notifications** | ⚠️ Basic | In-app only, no push/SMS/webhooks |
| **File Upload** | ✅ Implemented | S3/Azure Blob support |
| **Email Service** | ✅ Implemented | Nodemailer (SMTP) |
| **API Documentation** | ⚠️ Partial | Swagger/OpenAPI started |
| **Completion Tracking** | ✅ Implemented | Quiz scores, e-signatures |
| **Audit Logging** | ✅ Implemented | Action tracking |
| **Azure Deployment** | ✅ Ready | Bicep templates, CI/CD |

#### ❌ What's Missing (Per Requirements)

| Feature | Priority | Status |
|---------|----------|--------|
| **Mobile Apps (iOS/Android)** | 🔴 Critical | Not started |
| **SCORM Support** | 🟡 Medium | Not implemented |
| **PowerPoint Viewer** | 🔴 High | Not implemented |
| **Video Player** | 🔴 High | Needs implementation |
| **Push Notifications** | 🔴 High | Not implemented |
| **SMS Notifications** | 🟡 Medium | Not implemented |
| **Webhook System** | 🔴 High | Not implemented |
| **Scheduled Email Reports** | 🔴 High | Not implemented |
| **Driver Rankings/Comparison** | 🟡 Medium | Not implemented |
| **Make/Zapier Integration** | 🔴 High | Needs webhooks/API |
| **Comprehensive OpenAPI Docs** | 🔴 High | Needs completion |
| **Data Export** | 🔴 High | Not implemented |
| **Branch Manager Role** | 🟡 Medium | Schema needs update |
| **Driver Coach Role** | 🟡 Medium | Schema needs update |
| **Reminder System** | 🔴 High | Not implemented |

---

## 🏗️ Recommended Architecture

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            END USERS                                        │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│     DRIVER APPS      │    ADMIN PORTAL      │      INTEGRATIONS             │
│  ┌────────────────┐  │  ┌────────────────┐  │  ┌────────────────────────┐  │
│  │ iOS App        │  │  │ Web Portal     │  │  │ Samsara Telematics     │  │
│  │ (React Native) │  │  │ (React SPA)    │  │  │ Motive Telematics      │  │
│  ├────────────────┤  │  ├────────────────┤  │  │ Make/Zapier Webhooks   │  │
│  │ Android App    │  │  │ Mobile-Friendly│  │  │ Custom Integrations    │  │
│  │ (React Native) │  │  │ Responsive     │  │  └────────────────────────┘  │
│  └────────┬───────┘  │  └────────┬───────┘  │              │               │
│           │          │           │          │              │               │
└───────────┼──────────┴───────────┼──────────┴──────────────┼───────────────┘
            │                      │                          │
            └──────────────────────┴──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │      API GATEWAY (Nginx)     │
                    │   - SSL Termination          │
                    │   - Rate Limiting            │
                    │   - Load Balancing           │
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────────────────┴──────────────────────────┐
        │                                                       │
┌───────▼───────┐  ┌─────────────────┐  ┌─────────────────────┐
│   API SERVER  │  │ NOTIFICATION    │  │   WEBHOOK/EVENT     │
│   (Express)   │  │ SERVICE         │  │   PROCESSOR         │
│               │  │                 │  │                     │
│ - Auth        │  │ - Push (FCM/APNs)│  │ - Event Queue      │
│ - CRUD APIs   │  │ - Email         │  │ - Webhook Dispatch  │
│ - OpenAPI     │  │ - SMS (Twilio)  │  │ - Make Integration  │
│ - File Upload │  │ - Webhooks      │  │ - Zapier Integration│
└───────┬───────┘  └────────┬────────┘  └──────────┬──────────┘
        │                   │                       │
        └───────────────────┴───────────────────────┘
                            │
        ┌───────────────────┴───────────────────────────┐
        │                                                │
┌───────▼───────┐  ┌─────────────────┐  ┌──────────────▼─────────────┐
│   PostgreSQL  │  │     Redis       │  │   Blob Storage             │
│   Database    │  │   Cache/Queue   │  │   (S3/Azure/Minio)         │
│               │  │                 │  │                            │
│ - Users       │  │ - Sessions      │  │ - Videos                   │
│ - Training    │  │ - Notifications │  │ - PowerPoints              │
│ - Completions │  │ - Event Queue   │  │ - PDFs                     │
│ - Audit Logs  │  │                 │  │ - SCORM Packages           │
└───────────────┘  └─────────────────┘  └────────────────────────────┘
```

### Technology Stack

#### Backend (API Server)
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | Node.js 20 LTS | Already in use, proven |
| Framework | Express.js + TypeScript | Already implemented |
| ORM | Prisma | Already implemented, great DX |
| Database | PostgreSQL 16 | Already configured |
| Cache | Redis | Needed for queues, sessions |
| Queue | BullMQ | Job processing, scheduled tasks |
| Documentation | OpenAPI 3.0 + Swagger UI | Required for integrations |

#### Frontend (Web Portal)
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | React 18 + TypeScript | Already implemented |
| Build | Vite | Fast, modern |
| State | Zustand | Already implemented |
| Styling | TailwindCSS | Better than custom CSS |
| Components | Headless UI or Radix | Accessibility |
| Charts | Recharts or Chart.js | Reporting dashboards |

#### Mobile Apps
| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | React Native + Expo | Code sharing with web, faster dev |
| Navigation | React Navigation | Standard for RN |
| State | Zustand | Same as web |
| Push Notifications | Expo Notifications + FCM/APNs | Required feature |
| Video Player | expo-av | Training videos |
| Offline Support | WatermelonDB or AsyncStorage | Driver accessibility |

#### Notifications & Messaging
| Channel | Technology | Notes |
|---------|------------|-------|
| Push (Mobile) | Firebase Cloud Messaging + APNs | Industry standard |
| Push (Web) | Web Push API + Service Workers | PWA capability |
| Email | Nodemailer + SendGrid/Mailgun | Already implemented |
| SMS | Twilio | Industry standard, reliable |
| Webhooks | Custom + BullMQ | For Make/Zapier |

#### Content Delivery
| Content Type | Technology | Notes |
|--------------|------------|-------|
| Videos | HLS streaming + Video.js | Adaptive bitrate |
| PowerPoint | LibreOffice conversion to PDF/Images | Server-side |
| PDFs | PDF.js | In-browser rendering |
| SCORM 1.2/2004 | Custom SCORM runtime | Phase 2 |

---

## 📋 Database Schema Updates Required

### New/Modified Models

```prisma
// New enum for expanded roles
enum UserRole {
  DRIVER
  DRIVER_COACH
  SUPERVISOR
  BRANCH_MANAGER
  ADMIN
}

// New model for reminders
model Reminder {
  id           String   @id @default(cuid())
  title        String
  description  String?
  reminderDate DateTime @map("reminder_date")
  isRecurring  Boolean  @default(false) @map("is_recurring")
  recurrence   String?  // daily, weekly, monthly
  userId       String   @map("user_id")
  createdBy    String   @map("created_by")
  isCompleted  Boolean  @default(false) @map("is_completed")
  createdAt    DateTime @default(now()) @map("created_at")
  
  user    User @relation("UserReminders", fields: [userId], references: [id])
  creator User @relation("CreatedReminders", fields: [createdBy], references: [id])
  
  @@map("reminders")
}

// New model for webhooks
model Webhook {
  id           String   @id @default(cuid())
  name         String
  url          String
  secret       String?
  events       String[] // ["assignment.created", "training.completed", etc.]
  isActive     Boolean  @default(true) @map("is_active")
  fleetId      String   @map("fleet_id")
  createdBy    String   @map("created_by")
  lastTriggered DateTime? @map("last_triggered")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  fleet   Fleet @relation(fields: [fleetId], references: [id])
  creator User  @relation(fields: [createdBy], references: [id])
  deliveries WebhookDelivery[]
  
  @@map("webhooks")
}

model WebhookDelivery {
  id         String   @id @default(cuid())
  webhookId  String   @map("webhook_id")
  event      String
  payload    Json
  response   String?
  statusCode Int?     @map("status_code")
  success    Boolean
  attempts   Int      @default(1)
  createdAt  DateTime @default(now()) @map("created_at")
  
  webhook Webhook @relation(fields: [webhookId], references: [id])
  
  @@map("webhook_deliveries")
}

// New model for scheduled reports
model ScheduledReport {
  id            String   @id @default(cuid())
  name          String
  reportType    String   @map("report_type") // training_summary, compliance, etc.
  schedule      String   // cron expression
  recipients    String[] // email addresses
  filters       Json?    // report filters
  format        String   @default("pdf") // pdf, csv, excel
  isActive      Boolean  @default(true) @map("is_active")
  fleetId       String   @map("fleet_id")
  createdBy     String   @map("created_by")
  lastRun       DateTime? @map("last_run")
  nextRun       DateTime? @map("next_run")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  fleet   Fleet @relation(fields: [fleetId], references: [id])
  creator User  @relation(fields: [createdBy], references: [id])
  
  @@map("scheduled_reports")
}

// New model for push notification devices
model PushDevice {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  deviceToken  String   @unique @map("device_token")
  platform     String   // ios, android, web
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id])
  
  @@map("push_devices")
}

// New model for driver rankings/leaderboard
model DriverStats {
  id                    String   @id @default(cuid())
  userId                String   @unique @map("user_id")
  totalTrainingsCompleted Int    @default(0) @map("total_trainings_completed")
  averageQuizScore      Float?   @map("average_quiz_score")
  totalTimeSpent        Int      @default(0) @map("total_time_spent") // minutes
  currentStreak         Int      @default(0) @map("current_streak") // days
  longestStreak         Int      @default(0) @map("longest_streak")
  rank                  Int?
  fleetRank             Int?     @map("fleet_rank")
  lastActivity          DateTime? @map("last_activity")
  updatedAt             DateTime @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id])
  
  @@map("driver_stats")
}

// Enhanced User model additions
model User {
  // ... existing fields ...
  
  phone           String?
  preferSms       Boolean  @default(false) @map("prefer_sms")
  preferEmail     Boolean  @default(true) @map("prefer_email")
  preferPush      Boolean  @default(true) @map("prefer_push")
  timezone        String?  @default("America/New_York")
  
  pushDevices     PushDevice[]
  reminders       Reminder[] @relation("UserReminders")
  createdReminders Reminder[] @relation("CreatedReminders")
  driverStats     DriverStats?
  
  // ... existing relations ...
}

// Enhanced Lesson model for content types
model Lesson {
  // ... existing fields ...
  
  contentType     String?  @map("content_type") 
  // Types: video, pdf, powerpoint, scorm, text, image
  
  videoDuration   Int?     @map("video_duration") // seconds
  videoUrl        String?  @map("video_url")
  videoThumbnail  String?  @map("video_thumbnail")
  
  scormPackageUrl String?  @map("scorm_package_url")
  scormVersion    String?  @map("scorm_version") // 1.2, 2004
  
  pptConvertedUrl String?  @map("ppt_converted_url") // converted PDF/images
  pptOriginalUrl  String?  @map("ppt_original_url")
  
  // ... existing relations ...
}
```

---

## 🛣️ Development Roadmap

### Phase 1: Foundation Enhancement (Weeks 1-4)

#### Week 1-2: API & Documentation
- [ ] Complete OpenAPI 3.0 documentation for ALL endpoints
- [ ] Add comprehensive request/response examples
- [ ] Set up API versioning (v1, v2)
- [ ] Implement rate limiting per endpoint
- [ ] Add API key authentication for integrations
- [ ] Create Postman collection export

#### Week 3-4: Notification Infrastructure
- [ ] Implement Redis + BullMQ for job queues
- [ ] Create unified notification service
- [ ] Add Twilio SMS integration
- [ ] Implement Firebase Cloud Messaging (FCM)
- [ ] Build webhook dispatcher with retry logic
- [ ] Create event system for triggers

### Phase 2: Content & Reporting (Weeks 5-8)

#### Week 5-6: Content Delivery
- [ ] Implement video player with HLS streaming
- [ ] Add PowerPoint to PDF/image conversion (LibreOffice)
- [ ] Integrate PDF.js for in-browser viewing
- [ ] Build content upload/management UI
- [ ] Add video progress tracking

#### Week 7-8: Reporting System
- [ ] Create reporting database views
- [ ] Build scheduled report generator (BullMQ cron)
- [ ] Implement PDF/CSV/Excel export
- [ ] Add email delivery for reports
- [ ] Create reporting dashboard UI
- [ ] Implement driver ranking/leaderboard

### Phase 3: Mobile Applications (Weeks 9-14)

#### Week 9-10: Mobile Foundation
- [ ] Set up React Native + Expo project
- [ ] Implement shared authentication
- [ ] Build driver dashboard screens
- [ ] Add training content player
- [ ] Implement push notifications

#### Week 11-12: Mobile Features
- [ ] Add offline content caching
- [ ] Implement video player with offline
- [ ] Build quiz completion flow
- [ ] Add e-signature capture
- [ ] Implement reminder notifications

#### Week 13-14: Mobile Polish
- [ ] Performance optimization
- [ ] iOS App Store submission prep
- [ ] Google Play Store submission prep
- [ ] Beta testing program

### Phase 4: Integrations (Weeks 15-18)

#### Week 15-16: Webhook & Make/Zapier
- [ ] Build webhook management UI
- [ ] Create comprehensive event triggers
- [ ] Document webhook payloads
- [ ] Build Make/Zapier app templates
- [ ] Create integration documentation

#### Week 17-18: Telematics Prep
- [ ] Design Samsara data model
- [ ] Design Motive data model
- [ ] Create webhook receivers
- [ ] Build driver sync workflows
- [ ] Document telematics integration

### Phase 5: SCORM & Advanced Features (Weeks 19-22)

#### Week 19-20: SCORM Runtime
- [ ] Implement SCORM 1.2 runtime
- [ ] Add SCORM package upload/extraction
- [ ] Build SCORM content player
- [ ] Track SCORM completion data
- [ ] Test with common SCORM packages

#### Week 21-22: Advanced Features
- [ ] Implement driver self-set reminders
- [ ] Add training path recommendations
- [ ] Build compliance calendar
- [ ] Create certificate generator
- [ ] Implement bulk import/export

---

## 📱 Mobile App Specifications

### Driver Mobile App Features

#### Home Screen
```
┌────────────────────────────────┐
│  👤 John Doe                   │
│  Fleet Rank: #12 of 45         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                │
│  🎯 Quick Stats                │
│  ┌─────────┬─────────────────┐ │
│  │ 3       │ 87%             │ │
│  │ Pending │ Quiz Avg        │ │
│  └─────────┴─────────────────┘ │
│                                │
│  📚 My Training                │
│  ┌────────────────────────────┐│
│  │ ⏳ Defensive Driving 2024  ││
│  │    Due: Dec 20, 2025       ││
│  │    Progress: 45%           ││
│  │    [Continue →]            ││
│  └────────────────────────────┘│
│  ┌────────────────────────────┐│
│  │ 🆕 Hazmat Refresher        ││
│  │    Due: Jan 5, 2026        ││
│  │    [Start →]               ││
│  └────────────────────────────┘│
│                                │
│  🔔 Reminders                  │
│  • Pre-trip inspection checklist│
│  • CDL renewal due in 30 days  │
│                                │
└────────────────────────────────┘
│ 🏠 Home │ 📊 Rank │ 🔔 │ ⚙️  │
└────────────────────────────────┘
```

#### Training Player
- Video player with progress tracking
- Swipe-through PowerPoint slides
- PDF viewer with zoom
- Quiz with immediate feedback
- E-signature capture for acknowledgments

#### Driver Ranking Screen
- Fleet-wide leaderboard
- Personal stats history
- Badges/achievements
- Comparison with average

### Push Notification Types
| Trigger | Example Message |
|---------|-----------------|
| New Assignment | "New training assigned: Defensive Driving 2024" |
| Due Date Reminder | "Training due in 3 days: Hazmat Refresher" |
| Overdue Alert | "⚠️ Overdue: Pre-trip Inspection Training" |
| Completion Congratulations | "🎉 Great job! You completed Safety Orientation" |
| Ranking Change | "📈 You moved up to #8 in your fleet!" |
| Custom Reminder | "📌 Reminder: Check your tire pressure logs" |

---

## 🔗 OpenAPI Specification Enhancements

### Required Endpoints for Full Coverage

```yaml
# New endpoints to add to existing API

# Webhooks
POST   /api/v1/webhooks              # Create webhook
GET    /api/v1/webhooks              # List webhooks
GET    /api/v1/webhooks/{id}         # Get webhook
PUT    /api/v1/webhooks/{id}         # Update webhook
DELETE /api/v1/webhooks/{id}         # Delete webhook
POST   /api/v1/webhooks/{id}/test    # Test webhook
GET    /api/v1/webhooks/{id}/deliveries # Delivery history

# Scheduled Reports
POST   /api/v1/reports/scheduled     # Create scheduled report
GET    /api/v1/reports/scheduled     # List scheduled reports
PUT    /api/v1/reports/scheduled/{id} # Update
DELETE /api/v1/reports/scheduled/{id} # Delete
POST   /api/v1/reports/scheduled/{id}/run # Run immediately

# On-demand Reports
POST   /api/v1/reports/training-summary    # Generate training summary
POST   /api/v1/reports/compliance          # Compliance report
POST   /api/v1/reports/driver-progress     # Driver progress report
GET    /api/v1/reports/exports/{id}        # Download generated report

# Driver Stats & Rankings
GET    /api/v1/drivers/rankings           # Fleet rankings
GET    /api/v1/drivers/{id}/stats         # Individual stats
GET    /api/v1/drivers/me/stats           # Current driver stats

# Reminders
POST   /api/v1/reminders                  # Create reminder
GET    /api/v1/reminders                  # List reminders
PUT    /api/v1/reminders/{id}             # Update
DELETE /api/v1/reminders/{id}             # Delete
POST   /api/v1/reminders/{id}/complete    # Mark complete

# Push Devices
POST   /api/v1/devices                    # Register device
DELETE /api/v1/devices/{token}            # Unregister device

# Data Export
GET    /api/v1/export/users               # Export users CSV
GET    /api/v1/export/completions         # Export completions
GET    /api/v1/export/assignments         # Export assignments
GET    /api/v1/export/audit-logs          # Export audit logs

# Content Upload
POST   /api/v1/content/video              # Upload video
POST   /api/v1/content/powerpoint         # Upload PPT (auto-convert)
POST   /api/v1/content/pdf                # Upload PDF
POST   /api/v1/content/scorm              # Upload SCORM package

# Integration Events (for Make/Zapier)
GET    /api/v1/events                     # List event types
POST   /api/v1/events/subscribe           # Subscribe to events
```

### Webhook Event Types

```json
{
  "events": [
    "user.created",
    "user.updated",
    "user.deleted",
    "assignment.created",
    "assignment.updated",
    "assignment.due_soon",
    "assignment.overdue",
    "training.started",
    "training.progress",
    "training.completed",
    "quiz.submitted",
    "quiz.passed",
    "quiz.failed",
    "lesson.completed",
    "esignature.captured",
    "compliance.at_risk",
    "compliance.expired"
  ]
}
```

---

## 📊 Reporting System

### Default Reports (No Power User Required)

#### 1. Training Completion Dashboard
- Real-time completion percentages
- Overdue training count
- Upcoming due dates (7/14/30 days)
- Filter by: location, role, program

#### 2. Compliance Summary
- Total compliant drivers %
- At-risk drivers list
- Expired certifications
- Upcoming expirations

#### 3. Driver Progress Report
- Individual training history
- Quiz scores over time
- Time spent on training
- Comparison to fleet average

#### 4. Fleet Comparison
- Location-by-location comparison
- Average completion rates
- Top/bottom performers

### Report Delivery Options

| Channel | Trigger Types |
|---------|---------------|
| **Email** | Scheduled (daily/weekly/monthly), On-event, Manual |
| **Push Notification** | Real-time alerts, Digest summary |
| **SMS** | Critical alerts only (overdue, compliance risk) |
| **Webhook** | All events, for automation tools |
| **In-App Dashboard** | Always available, real-time |

### Scheduled Report Configuration

```json
{
  "name": "Weekly Training Summary",
  "reportType": "training_summary",
  "schedule": "0 8 * * MON",
  "recipients": ["manager@fleet.com", "admin@fleet.com"],
  "filters": {
    "locations": ["Chicago", "Detroit"],
    "includeCompleted": true,
    "dateRange": "last_7_days"
  },
  "format": "pdf",
  "isActive": true
}
```

---

## 🔌 Integration Architecture

### Make/Zapier Integration Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   DOT Copilot   │────▶│  Webhook Event  │────▶│    Make.com     │
│   Platform      │     │   Dispatcher    │     │   or Zapier     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌────────────────────────────────┼────────────────────────────────┐
                        │                                │                                │
                        ▼                                ▼                                ▼
               ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
               │   Samsara       │             │    Motive       │             │   Other Apps    │
               │   Telematics    │             │   Telematics    │             │   Slack, Teams  │
               └─────────────────┘             └─────────────────┘             └─────────────────┘
```

### Telematics Integration Use Cases

#### Samsara/Motive → DOT Copilot
1. **New driver added in telematics** → Auto-create user in training platform
2. **Driver safety event** → Trigger remedial training assignment
3. **Hours of Service violation** → Assign HOS refresher training

#### DOT Copilot → Samsara/Motive
1. **Training completed** → Update driver profile in telematics
2. **Certification earned** → Add to driver documents

### Sample Make/Zapier Scenario

```
TRIGGER: New driver created in Samsara
ACTION 1: Create user in DOT Copilot
ACTION 2: Assign "New Driver Orientation" program
ACTION 3: Send welcome SMS to driver
ACTION 4: Notify supervisor via Slack
```

---

## 💰 Cost Estimation

### Infrastructure Costs (Monthly)

| Resource | Development | Production |
|----------|-------------|------------|
| Azure App Service | $13 | $73 |
| PostgreSQL | $12 | $145 |
| Blob Storage | $2 | $10 |
| Redis Cache | $0 (local) | $15 |
| FCM/APNs | Free | Free |
| SendGrid Email | Free (100/day) | $15 |
| Twilio SMS | $0 | $50+ (usage) |
| **Total** | **~$27** | **~$300+** |

### Third-Party Services

| Service | Purpose | Cost |
|---------|---------|------|
| Twilio | SMS notifications | ~$0.0075/SMS |
| SendGrid | Email delivery | $15/month (50k emails) |
| LibreOffice Server | PPT conversion | Self-hosted |
| Video Transcoding | HLS streaming | ~$0.015/minute |

---

## 🔐 Security Considerations

### Data Protection
- All data encrypted at rest (AES-256)
- TLS 1.3 for all communications
- JWT tokens with short expiry (15 min)
- Refresh token rotation
- Audit logging for all actions

### Compliance
- SOC 2 Type II preparation
- GDPR data handling (for international)
- DOT record retention requirements
- Driver data privacy controls

### Access Control Matrix

| Role | Users | Fleet | Training | Assignments | Reports | System |
|------|-------|-------|----------|-------------|---------|--------|
| Driver | Self | View | View | Self | Self | - |
| Driver Coach | Team | View | View | Team | Team | - |
| Supervisor | Location | View | Create | Location | Location | - |
| Branch Manager | Location | Edit | Edit | Location | Location | - |
| Admin | All | All | All | All | All | Full |

---

## ✅ Success Metrics

### Platform Adoption
- Driver mobile app installs
- Weekly active users (WAU)
- Training completion rates
- Average time to complete training

### Engagement
- Push notification opt-in rate
- SMS notification usage
- Report generation frequency
- Webhook integration count

### Business Impact
- Time to onboard new drivers
- Compliance violation reduction
- Training cost per driver
- Administrative time savings

---

## 📝 Next Steps

### Immediate Actions (This Week)
1. Review and approve this roadmap
2. Set up React Native project structure
3. Complete OpenAPI documentation
4. Configure Redis + BullMQ
5. Set up Twilio account

### Short Term (Next 30 Days)
1. Complete Phase 1 (API & Notifications)
2. Begin mobile app development
3. Implement webhook system
4. Create integration documentation

### Medium Term (90 Days)
1. Launch mobile app beta
2. Complete Make/Zapier integration
3. Implement scheduled reporting
4. Begin SCORM development

---

**Document Version:** 1.0  
**Created:** December 15, 2025  
**Last Updated:** December 15, 2025  
**Status:** Ready for Review
