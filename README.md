# Mr. Nice Drive - Driver Performance Tracking System

A comprehensive driver performance tracking and alerting system for limousine companies operating with Uber Fleet API. Built with Next.js 15, TypeScript, Prisma, and PostgreSQL.

## Features

### 🎯 Advanced Driver Scoring Engine
- **Weighted 6-metric formula** with real-time performance tracking
- **Acceptance Rate (30%)** - Driver's trip acceptance percentage
- **Cancellation Rate (20%)** - Inverted cancellation percentage
- **Completion Rate (15%)** - Successfully completed trips
- **Feedback Score (15%)** - Normalized rider ratings (0-5 scale)
- **Trip Volume (10%)** - Normalized trip count index
- **Idle Ratio (10%)** - Inverted idle time percentage

### 🚨 Multi-Channel Alert System
- **WhatsApp Business API** integration
- **Telegram Bot** notifications
- **Voice Calls** via Twilio
- **🤖 ElevenLabs Conversation AI** - AI-powered outbound calls for driver coaching
- **Smart prioritization** based on performance scores

### 📊 Real-time Dashboard
- Live performance metrics and trends
- Driver rankings and analytics
- Alert management and tracking
- Uber Fleet API integration status

### 🔄 Uber Fleet API Integration
- Automatic driver data synchronization
- Real-time metrics fetching
- Trip data analysis
- Performance history tracking

### 📞 AI-Powered Driver Coaching
- **ElevenLabs Conversation AI** integration for professional outbound calls
- **Contextual conversations** based on specific performance issues
- **Multiple alert reasons**: Poor performance, wrong area, idle time, missed trips, etc.
- **Professional tone** with empathetic and constructive feedback
- **Real-time call initiation** from driver management interface

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Uber Fleet API credentials
- WhatsApp Business API token (optional)
- Twilio account (optional)
- Telegram Bot token (optional)
- **ElevenLabs account** with Conversational AI agent (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd mr-niceguy
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
./setup-env.sh
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mr_niceguy_db"

# Uber Fleet API
UBER_CLIENT_ID="your_uber_client_id"
UBER_CLIENT_SECRET="your_uber_client_secret"
UBER_SERVER_TOKEN="your_uber_server_token"
UBER_ORGANIZATION_ID="your_organization_id"
UBER_BASE_URL="https://api.uber.com"

# Alert System (Optional)
WHATSAPP_ACCESS_TOKEN="your_whatsapp_token"
TWILIO_ACCOUNT_SID="your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_token"
TELEGRAM_BOT_TOKEN="your_telegram_token"

# ElevenLabs Conversation AI (Optional)
ELEVENLABS_API_KEY="your_elevenlabs_api_key"
ELEVENLABS_AGENT_ID="your_elevenlabs_agent_id"
ELEVENLABS_AGENT_PHONE_NUMBER_ID="your_elevenlabs_agent_phone_number_id"
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## ElevenLabs Integration Setup

For detailed setup instructions for the AI-powered calling feature, see [ElevenLabs Integration Guide](docs/ELEVENLABS_INTEGRATION.md).

### Quick Setup
1. Create an ElevenLabs account at [elevenlabs.io](https://elevenlabs.io)
2. Create a Conversational AI agent
3. Configure audio format to μ-law 8000 Hz for Twilio compatibility
4. Enable authentication and overrides in agent settings
5. Add your credentials to the `.env` file

### Usage
1. Navigate to the Drivers page
2. Click the phone icon (📞) next to any driver
3. Select a reason for the call (poor performance, wrong area, etc.)
4. Click "Start AI Call" to initiate the conversation

## API Documentation

### Driver Alert Calls API

#### Initiate AI-Powered Alert Call
```bash
POST /api/drivers/alert-call
Content-Type: application/json

{
  "driverId": "driver-uuid",
  "reason": "Poor Performance",
  "message": "Driver performance metrics are below standards",
  "driverName": "John Doe",
  "phoneNumber": "+971501234567",
  "currentScore": 0.65
}
```

#### Send Traditional Alerts
```bash
POST /api/drivers/alert
Content-Type: application/json

{
  "driverId": "driver-uuid",
  "channel": "whatsapp",
  "message": "Performance review requested"
}
```

### Driver Scoring API

#### Test Scoring Engine
```bash
# Test with custom metrics
POST /api/test-scoring
Content-Type: application/json

{
  "metrics": {
    "acceptanceRate": 0.85,
    "cancellationRate": 0.1,
    "completionRate": 0.9,
    "feedbackScore": 4.7,
    "tripVolumeIndex": 0.75,
    "idleRatio": 0.2
  }
}
```

#### Get Example Scenarios
```bash
GET /api/test-scoring
```

### Driver Management API

#### List Drivers
```bash
# Get all drivers
GET /api/drivers

# Sync from Uber and get drivers
GET /api/drivers?syncFromUber=true

# Filter by status
GET /api/drivers?status=ACTIVE

# Search drivers
GET /api/drivers?search=john
```

#### Create Driver
```bash
POST /api/drivers
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+971501234567",
  "uberDriverId": "uber_driver_123",
  "status": "ACTIVE"
}
```

## Driver Scoring Formula

The system uses a weighted formula to calculate driver performance scores:

```
score = (acceptanceRate × 0.3) + 
        ((1 - cancellationRate) × 0.2) + 
        (completionRate × 0.15) + 
        (feedbackScore ÷ 5 × 0.15) + 
        (tripVolumeIndex × 0.1) + 
        ((1 - idleRatio) × 0.1)
```

### Metric Definitions

| Metric | Weight | Description | Range |
|--------|--------|-------------|-------|
| **Acceptance Rate** | 30% | Percentage of trip requests accepted | 0.0 - 1.0 |
| **Cancellation Rate** | 20% | Percentage of trips cancelled (inverted) | 0.0 - 1.0 |
| **Completion Rate** | 15% | Percentage of trips completed successfully | 0.0 - 1.0 |
| **Feedback Score** | 15% | Average rider rating (normalized) | 0.0 - 5.0 |
| **Trip Volume Index** | 10% | Normalized trip count | 0.0 - 1.0 |
| **Idle Ratio** | 10% | Time spent idle vs active (inverted) | 0.0 - 1.0 |

### Grade Scale

| Score Range | Grade | Category |
|-------------|-------|----------|
| 95% - 100% | A+ | Excellent |
| 90% - 94% | A | Excellent |
| 85% - 89% | B+ | Good |
| 80% - 84% | B | Good |
| 75% - 79% | C+ | Average |
| 70% - 74% | C | Average |
| 60% - 69% | D | Poor |
| Below 60% | F | Critical |

## Project Structure

```
mr-niceguy/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   └── ui/               # Shadcn/ui components
├── libs/                  # Core business logic
│   ├── driver-scoring/    # Scoring engine
│   ├── uber-fleet/       # Uber API integration
│   ├── uber-sync/        # Data synchronization
│   └── database/         # Prisma client
├── prisma/               # Database schema
├── types/                # TypeScript definitions
└── public/               # Static assets
```

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **UI**: Tailwind CSS + Shadcn/ui
- **Validation**: Zod
- **Charts**: Recharts
- **Icons**: Lucide React

## Development

### Database Operations
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# View database
npx prisma studio

# Reset database
npx prisma db push --force-reset
```

### Testing the Scoring Engine
```bash
# Test with curl
curl -X POST http://localhost:3000/api/test-scoring \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": {
      "acceptanceRate": 0.85,
      "cancellationRate": 0.1,
      "completionRate": 0.9,
      "feedbackScore": 4.7,
      "tripVolumeIndex": 0.75,
      "idleRatio": 0.2
    }
  }'
```

## Deployment

### Environment Setup
1. Set up PostgreSQL database
2. Configure Uber Fleet API credentials
3. Set up alert service credentials (optional)
4. Deploy to your preferred platform (Vercel, Railway, etc.)

### Production Considerations
- Enable database connection pooling
- Set up monitoring and logging
- Configure rate limiting for API endpoints
- Set up backup strategies for driver data
- Implement proper error handling and retry logic

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the scoring formula implementation

---

**Built with ❤️ for the limousine industry in Dubai**
