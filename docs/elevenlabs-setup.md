# ElevenLabs Conversational AI Setup Guide

This guide will help you set up ElevenLabs Conversational AI for making automated alert calls to drivers with **enhanced features** including dynamic variables, custom prompts, and multilingual support.

## 🚀 Quick Start

### 1. Get Your ElevenLabs API Key
1. Go to [ElevenLabs](https://elevenlabs.io) and create an account
2. Navigate to your [API Keys page](https://elevenlabs.io/app/api-keys)
3. Create a new API key and copy it

### 2. Set Environment Variables
Create a `.env.local` file in your project root:

```bash
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_AGENT_ID=will_be_set_after_agent_creation
ELEVENLABS_AGENT_PHONE_NUMBER_ID=will_be_set_after_phone_setup
```

### 3. Create Your AI Agent
Run the setup script to create your conversational AI agent:

```bash
npm run setup:elevenlabs
```

This will:
- Create a professional AI agent for driver communications
- Configure multilingual support (English, Arabic, Spanish, French)
- Set up proper conversational flows
- Return your agent ID for configuration

### 4. Configure Phone Number
1. In your ElevenLabs dashboard, go to Phone Numbers
2. Add a phone number (Twilio or SIP trunk)
3. Assign it to your created agent
4. Copy the phone number ID to your `.env.local` file

## 🧪 Test Your Setup

### Check Configuration
```bash
npm run check:elevenlabs
```

### Test Enhanced Features
```bash
npm run test:enhanced-call
```

This tests:
- ✅ Dynamic variables support
- ✅ Custom prompts per language  
- ✅ Custom first messages
- ✅ Multi-language support (en, ar, es, fr)
- ✅ Conversation config override

## ✨ Enhanced Features

### 🌐 **Multilingual Support**
The system now supports multiple languages with native prompts:

- **English (en)** - Default language
- **Arabic (ar)** - Full Arabic support with RTL text
- **Spanish (es)** - Professional Spanish conversations
- **French (fr)** - Native French interactions

**Language Selection:**
- Drivers can have a preferred language set in their profile
- The UI allows selecting language per call
- AI adapts conversation style based on language

### 📋 **Dynamic Variables**
Each call now includes comprehensive dynamic data:

```javascript
{
  driver_name: "Ahmed Mohamed",
  driver_phone: "+971501234567", 
  reason: "Poor Performance",
  message: "Driver performance below 60%",
  score: "65",
  score_percentage: "65%",
  company_name: "Mr. Nice Drive",
  call_date: "12/10/2024",
  call_time: "2:30 PM"
}
```

**Usage in Prompts:**
The AI can reference these variables naturally during conversation, making each call personalized and contextual.

### 🎭 **Custom Prompts & First Messages**
Each language gets professionally crafted:

**Custom System Prompts:**
- Role-specific instructions for each language
- Cultural considerations for communication style
- Consistent professional tone across languages

**Personalized First Messages:**
- Natural greetings in native language
- Driver's name integration
- Context-appropriate opening

### ⚙️ **Conversation Config Override**
Real-time customization of:
- **Agent Prompts** - Dynamic system instructions
- **First Messages** - Personalized call openings  
- **Language Settings** - Per-call language selection
- **Conversation Flow** - Adaptive call structure

## 📞 Making Enhanced Calls

### From the UI
1. Select a driver from the drivers list
2. Click "Alert Call" 
3. Choose:
   - **Reason** for the call
   - **Language** for the conversation
   - **Custom message** (if needed)
4. The AI will make a personalized call with:
   - Driver's name and info
   - Reason-specific talking points
   - Performance score context
   - Language-appropriate communication

### API Usage
```javascript
// Enhanced outbound call with full customization
await elevenlabs.makeOutboundCall(
  agentId,
  phoneNumberId, 
  phoneNumber,
  {
    dynamic_variables: {
      driver_name: "Ahmed Mohamed",
      reason: "Performance Issue",
      score_percentage: "65%",
      // ... more variables
    },
    conversation_config_override: {
      agent: {
        prompt: {
          prompt: customLanguagePrompt
        },
        first_message: personalizedGreeting,
        language: "ar" // or "en", "es", "fr"
      }
    }
  }
);
```

## 🔧 Advanced Configuration

### Custom Language Support
To add more languages:

1. **Update Supported Languages:**
```typescript
const SUPPORTED_LANGUAGES = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  // Add to components/ui/alert-call-modal.tsx
];
```

2. **Add Language Prompts:**
```javascript
// Add to app/api/drivers/alert-call/route.ts
const prompts = {
  de: `Sie sind ein professioneller Vertreter von Mr. Nice Drive...`
};
```

3. **Add First Messages:**
```javascript
const messages = {
  de: `Hallo ${driverName}, hier ist ein Anruf von Mr. Nice Drive...`
};
```

### Custom Dynamic Variables
Add more contextual data:

```javascript
const dynamicVariables = {
  // Driver context
  driver_id: driver.id,
  driver_rating: driver.rating,
  last_trip: driver.lastTrip,
  
  // Performance context  
  weekly_score: calculateWeeklyScore(),
  trip_count: driver.tripCount,
  
  // Company context
  manager_name: "Sarah Johnson",
  support_phone: "+1-800-SUPPORT"
};
```

## 🎯 Best Practices

### 📝 **Prompt Engineering**
- Keep prompts conversational and supportive
- Include specific performance metrics
- Provide clear next steps
- Maintain professional but empathetic tone

### 🌍 **Multilingual Considerations**
- Test prompts with native speakers
- Consider cultural communication styles
- Adapt formality levels per language
- Handle time zones for international drivers

### 📊 **Performance Monitoring**
- Track call success rates by language
- Monitor conversation duration
- Analyze driver feedback and responses
- Adjust prompts based on outcomes

## 🔍 Troubleshooting

### Common Issues

**404 Errors:**
- Verify `ELEVENLABS_AGENT_ID` is correct
- Check `ELEVENLABS_AGENT_PHONE_NUMBER_ID` exists
- Ensure phone number is assigned to agent

**Language Issues:**
- Verify language code is supported
- Check prompt encoding for special characters
- Test with simple ASCII prompts first

**Dynamic Variables Not Working:**
- Verify `conversation_initiation_client_data` structure
- Check API payload in network logs
- Ensure variables are properly JSON-encoded

### Debug Commands
```bash
# Full configuration check
npm run check:elevenlabs

# Test enhanced features (safe mode)
npm run test:enhanced-call

# Create new agent if needed
npm run setup:elevenlabs
```

## 📚 Resources

- [ElevenLabs Conversational AI Docs](https://elevenlabs.io/docs/conversational-ai/overview)
- [Outbound Call API Reference](https://elevenlabs.io/docs/conversational-ai/api-reference/conversations/outbound-call)
- [Dynamic Variables Documentation](https://elevenlabs.io/docs/conversational-ai/api-reference/conversations/outbound-call#request.body.conversation_initiation_client_data)

## 🆘 Support

If you encounter issues:
1. Check the configuration with `npm run check:elevenlabs`
2. Review the [setup guide](./elevenlabs-setup.md)
3. Test with `npm run test:enhanced-call`
4. Check ElevenLabs dashboard for agent/phone status

## 🎯 Features

### Predefined Alert Reasons
- **Poor Performance**: For drivers with low scores
- **Wrong Area**: When drivers are outside service zones
- **Idle Time**: For drivers inactive too long
- **Missed Trips**: For declined trip requests
- **Customer Complaints**: For service issues
- **Safety Concerns**: For safety violations
- **Custom Reason**: For specific situations

### AI Conversation Features
- Professional, respectful tone
- Adaptive conversation based on driver responses
- Dynamic prompts based on driver data and alert reason
- Performance score integration
- Constructive feedback approach
- Clear next steps for improvement

## 🔧 Configuration Options

### Agent Configuration
The AI agent is configured with:
- **LLM Model**: Gemini 2.0 Flash (latest, fastest)
- **TTS Model**: Turbo v2.5 (high quality, low latency)
- **Language**: English (configurable)
- **Conversation Length**: 3-5 minutes target

### Customization
You can customize:
- Agent prompts in `scripts/setup-elevenlabs-agent.ts`
- Alert reasons in `components/ui/alert-call-modal.tsx`
- Conversation flow in the API route

## 📊 Pricing

ElevenLabs Conversational AI pricing (as of 2024):
- **Free Tier**: 15 minutes/month
- **Creator**: $22/month - 250 minutes
- **Pro**: $99/month - 1,100 minutes  
- **Business**: $1,320/month - 13,750 minutes at $0.08/minute

**Recommendation**: Business tier for production use with multiple daily calls.

## 🛠️ Troubleshooting

### Common Issues

#### "ElevenLabs configuration missing"
- Check your `.env.local` has all required variables
- Run `npm run check:elevenlabs` to verify

#### "Invalid ElevenLabs API key"
- Verify API key is correct
- Check account has Conversational AI access

#### "Access denied" or "plan may not include..."
- Upgrade to a paid ElevenLabs plan
- Conversational AI requires Creator tier or higher

#### "Agent not found"
- Run `npm run setup:elevenlabs` to create an agent
- Verify ELEVENLABS_AGENT_ID matches your created agent

#### "Phone number not found"
- Set up phone number in ElevenLabs dashboard
- Add correct phone number ID to environment variables

### Getting Help

1. **Check Configuration**: `npm run check:elevenlabs`
2. **View Logs**: Check browser console and server logs
3. **ElevenLabs Support**: [help.elevenlabs.io](https://help.elevenlabs.io)
4. **Documentation**: [ElevenLabs Docs](https://elevenlabs.io/docs/conversational-ai)

## 🔐 Security Notes

- Keep your API key secure and never commit it to version control
- Use environment variables for all sensitive configuration
- Regularly rotate API keys
- Monitor usage in ElevenLabs dashboard

## 📈 Monitoring

Track your alert calls:
- **Database**: All calls logged in `alertRecord` table
- **ElevenLabs Dashboard**: View conversation history and analytics
- **Application Logs**: Detailed logging for debugging

## 🎨 Customization Examples

### Custom Alert Reason
Add to `PREDEFINED_REASONS` in the modal:

```javascript
{
  value: 'fuel_efficiency',
  label: 'Fuel Efficiency Concern',
  description: 'Driver fuel usage is above optimal levels'
}
```

### Custom Voice
Change voice in setup script:

```javascript
voiceId: "different_voice_id_here"
```

### Custom Prompts
Modify system prompts in `generateSystemPrompt()` function in the API route.

---

**Ready to make your first AI call?** Follow the quick start steps above! 🚀 