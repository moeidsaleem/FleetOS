#!/bin/bash

# Setup script for Mr. Nice Drive environment variables
echo "Setting up environment variables for Mr. Nice Drive..."

cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/mrniceguy"

# WhatsApp Business API
WHATSAPP_BUSINESS_ACCOUNT_ID="your_whatsapp_business_account_id"
WHATSAPP_ACCESS_TOKEN="your_whatsapp_access_token"
WHATSAPP_PHONE_NUMBER_ID="your_whatsapp_phone_number_id"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"

# Twilio (Voice Calls)
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="your_twilio_phone_number"

# ElevenLabs Conversation AI
ELEVENLABS_API_KEY="your_elevenlabs_api_key"
ELEVENLABS_AGENT_ID="your_elevenlabs_agent_id"
ELEVENLABS_AGENT_PHONE_NUMBER_ID="your_elevenlabs_agent_phone_number_id"

# Uber Fleet API
UBER_CLIENT_ID="your_uber_client_id"
UBER_CLIENT_SECRET="your_uber_client_secret"
UBER_REDIRECT_URI="http://localhost:3002/api/auth/uber/callback"

# Application
NEXTAUTH_SECRET="mr-niceguy-secret-key-2024"
NEXTAUTH_URL="http://localhost:3002"

# Environment
NODE_ENV="development"
EOF

echo "✅ .env file created successfully!"
echo "📝 Please update the API keys with your actual credentials"
echo "🗄️  Database URL: postgresql://postgres:postgres123@localhost:5432/mrniceguy"
echo "🐳 PostgreSQL container: mr-niceguy-db"
echo ""
echo "🔧 ElevenLabs Setup Instructions:"
echo "1. Create an account at https://elevenlabs.io"
echo "2. Create a Conversational AI agent in the dashboard"
echo "3. Configure the agent with μ-law 8000 Hz audio format for Twilio compatibility"
echo "4. Enable authentication and overrides in agent settings"
echo "5. Get your API key, Agent ID, and Agent Phone Number ID"
echo "6. Update the .env file with your ElevenLabs credentials" 