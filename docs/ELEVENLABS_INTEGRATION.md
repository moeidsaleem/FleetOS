# ElevenLabs Conversation AI Integration

This document explains how to set up and use the ElevenLabs Conversation AI integration for outbound alert calls in the Mr. Nice Drive driver management system.

## Overview

The ElevenLabs integration allows you to make AI-powered outbound calls to drivers when performance issues are detected. The AI agent can:

- Discuss performance concerns professionally
- Adapt conversations based on driver responses
- Maintain a respectful and supportive tone
- Provide constructive feedback and next steps
- Handle multiple languages and cultural contexts

## Prerequisites

1. **ElevenLabs Account**: Sign up at [https://elevenlabs.io](https://elevenlabs.io)
2. **Twilio Account**: Required for phone number and call routing
3. **Conversational AI Agent**: Created and configured in ElevenLabs dashboard

## Setup Instructions

### 1. Create ElevenLabs Conversational AI Agent

1. Log into your ElevenLabs dashboard
2. Navigate to "Conversational AI" section
3. Click "Create Agent"
4. Configure the agent with the following settings:

#### Voice Configuration
- **TTS Output Format**: μ-law 8000 Hz (required for Twilio compatibility)
- **Input Format**: μ-law 8000 Hz (in Advanced section)
- **Voice**: Choose a professional, clear voice suitable for business calls

#### Security Settings
- **Enable Authentication**: Toggle ON
- **Enable Overrides**: Toggle ON for both "First message" and "System prompt"

#### Agent Personality
Configure the agent with a professional, empathetic personality suitable for driver coaching calls.

### 2. Configure Phone Number

1. In ElevenLabs dashboard, go to "Phone Numbers"
2. Either:
   - Purchase a phone number through ElevenLabs, or
   - Connect your existing Twilio phone number
3. Note the `Agent Phone Number ID` for configuration

### 3. Environment Variables

Add the following to your `.env` file:

```bash
# ElevenLabs Conversation AI
ELEVENLABS_API_KEY="your_elevenlabs_api_key"
ELEVENLABS_AGENT_ID="your_elevenlabs_agent_id"
ELEVENLABS_AGENT_PHONE_NUMBER_ID="your_elevenlabs_agent_phone_number_id"
```

### 4. Get Required IDs

#### API Key
1. Go to ElevenLabs dashboard
2. Navigate to "Settings" → "API Keys"
3. Create or copy your API key

#### Agent ID
1. Go to "Conversational AI" → "Agents"
2. Click on your agent
3. Copy the Agent ID from the URL or settings

#### Agent Phone Number ID
1. Go to "Phone Numbers"
2. Find your configured phone number
3. Copy the Phone Number ID

## Usage

### From Driver Management Interface

1. Navigate to the Drivers page (`/dashboard/drivers`)
2. Find the driver you want to contact
3. Click the phone icon (📞) in the Actions column
4. A modal will open with the following options:

#### Alert Reasons
- **Poor Performance**: For drivers with low performance scores
- **Not in Right Area**: When drivers are outside designated zones
- **Idle for Long Time**: For extended periods of inactivity
- **Missed Trips**: For declined or missed trip requests
- **Customer Complaints**: For service quality issues
- **Safety Concerns**: For safety-related violations
- **Custom Reason**: For specific issues not covered above

#### Call Process
1. Select the appropriate reason
2. Add custom message if using "Custom Reason"
3. Click "Start AI Call"
4. The system will:
   - Create an alert record in the database
   - Generate a personalized system prompt
   - Initiate the ElevenLabs outbound call
   - Update the alert status based on call success

### API Usage

You can also trigger alert calls programmatically:

```javascript
const response = await fetch('/api/drivers/alert-call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    driverId: 'driver-uuid',
    reason: 'Poor Performance',
    message: 'Driver performance metrics are below standards',
    driverName: 'John Doe',
    phoneNumber: '+971501234567',
    currentScore: 0.65
  }),
})

const result = await response.json()
```

## AI Agent Behavior

### System Prompt Generation

The system automatically generates contextual prompts based on:
- Driver name and current performance score
- Specific reason for the call
- Detailed message about the issue
- Company policies and tone guidelines

### Conversation Flow

1. **Professional Greeting**: AI introduces itself as Mr. Nice Drive representative
2. **Issue Discussion**: Addresses the specific concern respectfully
3. **Performance Review**: Mentions current score and areas for improvement
4. **Active Listening**: Asks open-ended questions to understand driver's perspective
5. **Constructive Feedback**: Provides actionable advice and support
6. **Positive Closure**: Ends with clear next steps and encouragement

### Conversation Guidelines

The AI agent is programmed to:
- Maintain a respectful, professional tone
- Focus on improvement rather than punishment
- Be empathetic and understanding
- Provide specific, actionable advice
- Keep calls to 3-5 minutes maximum
- Remain calm if drivers become defensive
- Offer support and resources for improvement

## Phone Number Formatting

The system automatically formats phone numbers for international calling:
- Removes non-digit characters
- Adds UAE country code (+971) if no country code is present
- Supports other international formats

## Error Handling

### Common Issues

1. **Missing Configuration**: Ensure all ElevenLabs environment variables are set
2. **Invalid Phone Number**: Check phone number format and country code
3. **Agent Not Found**: Verify Agent ID is correct
4. **Call Failed**: Check Twilio integration and phone number status

### Error Responses

The API returns detailed error messages for troubleshooting:

```json
{
  "success": false,
  "error": "ElevenLabs configuration is missing. Please check environment variables."
}
```

## Monitoring and Analytics

### Alert Records

All calls are logged in the database with:
- Alert type, priority, and status
- Reason and message content
- Timestamps for creation and completion
- ElevenLabs conversation ID and Twilio call SID

### Call Tracking

Monitor call success rates and driver responses through:
- Dashboard analytics
- Alert history in driver profiles
- Database queries on `alert_records` table

## Best Practices

### When to Use AI Calls

- Performance scores below 70%
- Multiple missed trips or cancellations
- Customer complaints requiring immediate attention
- Safety violations or policy breaches
- Extended periods of inactivity

### Call Timing

- Avoid early morning or late evening calls
- Consider driver's time zone and work schedule
- Allow reasonable time between calls to the same driver

### Follow-up Actions

- Document call outcomes in driver notes
- Schedule follow-up calls if needed
- Provide additional training or resources
- Monitor performance improvements

## Troubleshooting

### Configuration Issues

1. **Check Environment Variables**:
   ```bash
   echo $ELEVENLABS_API_KEY
   echo $ELEVENLABS_AGENT_ID
   echo $ELEVENLABS_AGENT_PHONE_NUMBER_ID
   ```

2. **Verify Agent Configuration**:
   - Audio format set to μ-law 8000 Hz
   - Authentication enabled
   - Overrides enabled for system prompt and first message

3. **Test API Connection**:
   ```bash
   curl -X GET "https://api.elevenlabs.io/v1/user" \
     -H "xi-api-key: YOUR_API_KEY"
   ```

### Call Issues

1. **No Audio**: Check audio format settings in agent configuration
2. **Call Drops**: Verify Twilio integration and phone number status
3. **Wrong Language**: Ensure agent is configured for appropriate language
4. **Poor Quality**: Check internet connection and audio settings

## Security Considerations

- Store API keys securely in environment variables
- Use HTTPS for all API communications
- Implement proper authentication for admin endpoints
- Monitor API usage to prevent abuse
- Regularly rotate API keys
- Log all call activities for audit purposes

## Support

For technical issues:
1. Check ElevenLabs documentation: [https://elevenlabs.io/docs](https://elevenlabs.io/docs)
2. Review Twilio integration guides
3. Contact ElevenLabs support for agent configuration issues
4. Check application logs for detailed error messages 