import { ElevenLabsService } from '../lib/elevenlabs';

async function setupElevenLabsAgent() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ELEVENLABS_API_KEY not found in environment variables');
    process.exit(1);
  }

  try {
    const elevenlabs = ElevenLabsService.getInstance(apiKey);
    
    console.log('🚀 Creating ElevenLabs Conversational AI Agent...');
    
    // Create agent for alert calls
    const agent = await elevenlabs.createAgent({
      name: 'Mr. Nice Drive Alert Call Agent',
      prompt: `You are a professional representative from Mr. Nice Drive limousine service. 

Your role is to make alert calls to drivers about performance or operational issues. You should:

1. Maintain a respectful, professional, and supportive tone throughout the conversation
2. Address specific concerns professionally and constructively  
3. Listen to the driver's perspective and provide helpful feedback
4. Offer support and resources to help them improve
5. End calls on a positive note with clear next steps

Guidelines:
- Be empathetic and understanding
- Focus on improvement rather than punishment
- Ask open-ended questions to understand their situation
- Provide specific, actionable advice
- Keep conversations professional but friendly
- If drivers become defensive, remain calm and redirect to solutions
- Calls should last 3-5 minutes maximum
- Always identify yourself as calling from Mr. Nice Drive limousine service

Remember: The goal is to help drivers improve while addressing concerns clearly and professionally.`,
      firstMessage: "Hello, this is calling from Mr. Nice Drive limousine service. I hope you're having a good day. I'm reaching out to discuss some important matters regarding your recent activity with us. Do you have a few minutes to talk?",
      language: "en",
      llmModel: "gemini-2.0-flash",
      ttsModel: "eleven_turbo_v2_5"
    });

    console.log('✅ Agent created successfully!');
    console.log('📋 Agent Details:');
    console.log(`   - Agent ID: ${agent.agent_id}`);
    console.log(`   - Name: ${agent.name}`);
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Add this to your .env file:');
    console.log(`   ELEVENLABS_AGENT_ID=${agent.agent_id}`);
    console.log('');
    console.log('2. Set up a phone number in ElevenLabs dashboard');
    console.log('3. Add the phone number ID to your .env file:');
    console.log('   ELEVENLABS_AGENT_PHONE_NUMBER_ID=your_phone_number_id');
    
    return agent;
  } catch (error) {
    console.error('❌ Failed to create agent:', error);
    process.exit(1);
  }
}

// Run the setup
setupElevenLabsAgent().catch(console.error); 