import { ElevenLabsService } from '../lib/elevenlabs';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function checkElevenLabsConfig() {
  console.log('🔍 Checking ElevenLabs Configuration...\n');

  // Check environment variables
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const phoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;

  console.log('📋 Environment Variables:');
  console.log(`   ELEVENLABS_API_KEY: ${apiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   ELEVENLABS_AGENT_ID: ${agentId ? '✅ Set' : '❌ Missing'}`);
  console.log(`   ELEVENLABS_AGENT_PHONE_NUMBER_ID: ${phoneNumberId ? '✅ Set' : '❌ Missing'}\n`);

  if (!apiKey) {
    console.error('❌ ELEVENLABS_API_KEY is required');
    return;
  }

  try {
    const elevenlabs = ElevenLabsService.getInstance(apiKey);
    
    console.log('🧪 Testing API Connection...');
    
    // Test API connection by listing agents
    const agents = await elevenlabs.listAgents();
    console.log(`✅ API Connection successful - Found ${agents.agents?.length || 0} agents\n`);

    // Check if agent exists
    if (agentId) {
      console.log('🤖 Checking Agent...');
      try {
        const agent = await elevenlabs.getAgent(agentId);
        console.log(`✅ Agent found: ${agent.name}`);
        console.log(`   - Agent ID: ${agent.agent_id}`);
        console.log(`   - Language: ${agent.conversation_config?.agent?.language || 'Not set'}`);
        console.log(`   - Voice ID: ${agent.conversation_config?.tts?.voice_id || 'Not set'}\n`);
      } catch (error) {
        console.error('❌ Agent not found or inaccessible');
        console.error('   Error:', error instanceof Error ? error.message : 'Unknown error');
        console.log('   💡 Run: npm run setup:elevenlabs to create an agent\n');
      }
    } else {
      console.log('⚠️  No agent ID configured');
      console.log('   💡 Run: npm run setup:elevenlabs to create an agent\n');
    }

    // Check phone numbers
    console.log('📞 Checking Phone Numbers...');
    try {
      const phoneNumbers = await elevenlabs.getPhoneNumbers();
      const phoneCount = phoneNumbers.phone_numbers?.length || 0;
      console.log(`✅ Found ${phoneCount} phone number(s) configured`);
      
      if (phoneCount > 0 && phoneNumbers.phone_numbers) {
        phoneNumbers.phone_numbers.forEach((phone: any, index: number) => {
          console.log(`   ${index + 1}. ${phone.number || phone.label || phone.id} (${phone.provider || 'unknown'})`);
        });
      }
      
      if (phoneNumberId) {
        const hasMatchingPhone = phoneNumbers.phone_numbers?.some((phone: any) => 
          phone.id === phoneNumberId || phone.phone_number_id === phoneNumberId
        );
        if (hasMatchingPhone) {
          console.log('✅ Configured phone number found');
        } else {
          console.log('⚠️  Configured phone number ID not found in available numbers');
        }
      } else {
        console.log('⚠️  No phone number ID configured');
      }
      console.log('');
    } catch (error) {
      console.error('❌ Failed to check phone numbers');
      console.error('   Error:', error instanceof Error ? error.message : 'Unknown error');
      console.log('   💡 You may need to set up phone numbers in ElevenLabs dashboard\n');
    }

    // Test voices
    console.log('🎤 Checking Available Voices...');
    try {
      const voices = await elevenlabs.getVoices();
      console.log(`✅ Found ${voices.length} available voices`);
      if (voices.length > 0) {
        console.log('   Popular voices:');
        voices.slice(0, 3).forEach((voice: any) => {
          console.log(`   - ${voice.name} (${voice.voice_id})`);
        });
      }
      console.log('');
    } catch (error) {
      console.error('❌ Failed to fetch voices');
      console.error('   Error:', error instanceof Error ? error.message : 'Unknown error\n');
    }

    // Summary
    console.log('📊 Configuration Summary:');
    const apiOk = !!apiKey;
    const agentOk = !!agentId;
    const phoneOk = !!phoneNumberId;
    
    if (apiOk && agentOk && phoneOk) {
      console.log('✅ All configurations look good! You should be able to make calls.');
    } else {
      console.log('⚠️  Some configurations are missing:');
      if (!apiOk) console.log('   - Add ELEVENLABS_API_KEY to your .env file');
      if (!agentOk) console.log('   - Run: npm run setup:elevenlabs to create an agent');
      if (!phoneOk) console.log('   - Set up phone number in ElevenLabs dashboard and add ELEVENLABS_AGENT_PHONE_NUMBER_ID');
    }

  } catch (error) {
    console.error('❌ Failed to connect to ElevenLabs API');
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    console.log('\n💡 Please check:');
    console.log('   1. Your API key is correct');
    console.log('   2. Your ElevenLabs account has Conversational AI access');
    console.log('   3. Your internet connection is working');
  }
}

// Run the configuration check
checkElevenLabsConfig().catch(console.error); 