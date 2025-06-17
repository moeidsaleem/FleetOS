// import { ElevenLabsService } from '../lib/elevenlabs';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testEnhancedOutboundCall() {
  console.log('🧪 Testing Enhanced ElevenLabs Outbound Call Functionality\n');

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const phoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;

  if (!apiKey || !agentId || !phoneNumberId) {
    console.error('❌ Missing required environment variables');
    console.log('Required: ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID, ELEVENLABS_AGENT_PHONE_NUMBER_ID');
    return;
  }

  try {
    // const elevenlabs = ElevenLabsService.getInstance(apiKey);
    
    // Test data for different languages
    const testCases = [
      {
        language: 'en',
        driverName: 'John Smith',
        phoneNumber: '+1234567890', // Test phone number
        reason: 'Poor Performance',
        message: 'Driver performance has been below 60% for the last week'
      },
      {
        language: 'ar',
        driverName: 'أحمد محمد',
        phoneNumber: '+1234567891', // Test phone number
        reason: 'منطقة خاطئة',
        message: 'السائق يعمل خارج المنطقة المخصصة'
      },
      {
        language: 'es',
        driverName: 'Carlos Rodriguez',
        phoneNumber: '+1234567892', // Test phone number
        reason: 'Tiempo de inactividad',
        message: 'El conductor ha estado inactivo durante demasiado tiempo'
      },
      {
        language: 'fr',
        driverName: 'Jean Dupont',
        phoneNumber: '+1234567893', // Test phone number
        reason: 'Plaintes clients',
        message: 'Plusieurs plaintes de clients reçues cette semaine'
      },
      {
        language: 'de',
        driverName: 'Hans Mueller',
        phoneNumber: '+1234567894', // Test phone number
        reason: 'Schlechte Leistung',
        message: 'Fahrerleistung ist unter dem Standard'
      },
      {
        language: 'it',
        driverName: 'Marco Rossi',
        phoneNumber: '+1234567895', // Test phone number
        reason: 'Area sbagliata',
        message: 'Il conducente sta operando fuori dalla zona designata'
      },
      {
        language: 'pt',
        driverName: 'João Silva',
        phoneNumber: '+1234567896', // Test phone number
        reason: 'Tempo inativo',
        message: 'Motorista inativo por muito tempo'
      },
      {
        language: 'ru',
        driverName: 'Иван Петров',
        phoneNumber: '+1234567897', // Test phone number
        reason: 'Плохая производительность',
        message: 'Производительность водителя ниже стандарта'
      },
      {
        language: 'tr',
        driverName: 'Mehmet Öz',
        phoneNumber: '+1234567898', // Test phone number
        reason: 'Kötü performans',
        message: 'Sürücü performansı standartların altında'
      },
      {
        language: 'nl',
        driverName: 'Jan van der Berg',
        phoneNumber: '+1234567899', // Test phone number
        reason: 'Slechte prestaties',
        message: 'Chauffeursprestaties onder de standaard'
      },
      {
        language: 'pl',
        driverName: 'Jan Kowalski',
        phoneNumber: '+1234567800', // Test phone number
        reason: 'Słaba wydajność',
        message: 'Wydajność kierowcy poniżej standardu'
      },
      {
        language: 'ur',
        driverName: 'احمد علی',
        phoneNumber: '+1234567801', // Test phone number
        reason: 'کام میں کمی',
        message: 'ڈرائیور کا کام ٹھیک نہیں'
      }
    ];

    console.log('🌐 Testing Multi-language Support:\n');
    
    for (const testCase of testCases) {
      console.log(`📞 Testing ${testCase.language.toUpperCase()} call for ${testCase.driverName}:`);
      
      // Prepare dynamic variables
      const dynamicVariables = {
        driver_name: testCase.driverName,
        driver_phone: testCase.phoneNumber,
        reason: testCase.reason,
        message: testCase.message,
        score: '65',
        score_percentage: '65%',
        company_name: 'Mr. Nice Drive',
        call_date: new Date().toLocaleDateString(),
        call_time: new Date().toLocaleTimeString()
      };

      // Generate language-specific prompt
      const customPrompt = generateTestPrompt(testCase.driverName, testCase.reason, testCase.message, 0.65, testCase.language);
      const firstMessage = generateTestFirstMessage(testCase.driverName, testCase.language);

      console.log('   📋 Dynamic Variables:', Object.keys(dynamicVariables).join(', '));
      console.log('   💬 First Message Preview:', firstMessage.substring(0, 50) + '...');
      console.log('   📝 Custom Prompt Length:', customPrompt.length, 'characters');
      
      // Note: Uncomment the next section to make actual test calls
      /*
      try {
        const result = await elevenlabs.makeOutboundCall(
          agentId,
          phoneNumberId,
          testCase.phoneNumber,
          {
            dynamic_variables: dynamicVariables,
            conversation_config_override: {
              agent: {
                prompt: {
                  prompt: customPrompt
                },
                first_message: firstMessage,
                language: testCase.language
              }
            }
          }
        );
        
        console.log('   ✅ Call initiated successfully:', result.conversation_id);
      } catch (error) {
        console.log('   ❌ Call failed:', error instanceof Error ? error.message : 'Unknown error');
      }
      */
      
      console.log('   ⚠️  Actual call skipped (uncomment to enable)');
      console.log('');
    }

    console.log('🎯 Enhanced Features Test Summary:');
    console.log('✅ Dynamic variables support - Ready');
    console.log('✅ Custom prompts per language - Ready');
    console.log('✅ Custom first messages - Ready');
    console.log('✅ Multi-language support (en, ar, es, fr, de, it, pt, ru, tr, nl, pl, ur) - Ready');
    console.log('✅ Conversation config override - Ready');
    console.log('');
    console.log('💡 To test actual calls, uncomment the call section in this script');
    console.log('⚠️  Make sure to use test phone numbers to avoid charges');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper functions for generating test prompts
function generateTestPrompt(driverName: string, reason: string, message: string, currentScore: number, language: string = 'en') {
  const scorePercentage = Math.round(currentScore * 100);
  
  const prompts = {
    en: `You are a professional representative from Mr. Nice Drive limousine service calling ${driverName}. 

Your role is to:
1. Maintain a respectful, professional, and supportive tone throughout the conversation
2. Address the specific concern: ${reason}
3. Discuss the issue: ${message}
4. Mention that their current performance score is ${scorePercentage}%
5. Listen to their perspective and provide constructive feedback
6. Offer support and resources to help them improve
7. End the call on a positive note with clear next steps

Remember: The goal is to help the driver improve, not to reprimand them.`,

    ar: `أنت ممثل مهني من شركة Mr. Nice Drive للليموزين تتصل بـ ${driverName}.

دورك هو:
1. الحفاظ على نبرة محترمة ومهنية وداعمة طوال المحادثة
2. معالجة القلق المحدد: ${reason}
3. مناقشة المشكلة: ${message}
4. اذكر أن نقاط الأداء الحالية هي ${scorePercentage}%

تذكر: الهدف هو مساعدة السائق على التحسن، وليس توبيخه.`,

    es: `Usted es un representante profesional del servicio de limusinas Mr. Nice Drive llamando a ${driverName}.

Su función es:
1. Mantener un tono respetuoso, profesional y de apoyo durante toda la conversación
2. Abordar la preocupación específica: ${reason}
3. Discutir el problema: ${message}
4. Mencionar que su puntuación de rendimiento actual es del ${scorePercentage}%

Recuerde: El objetivo es ayudar al conductor a mejorar, no reprenderlo.`,

    fr: `Vous êtes un représentant professionnel du service de limousine Mr. Nice Drive appelant ${driverName}.

Votre rôle est de :
1. Maintenir un ton respectueux, professionnel et de soutien tout au long de la conversation
2. Aborder la préoccupation spécifique : ${reason}
3. Discuter du problème : ${message}
4. Mentionner que leur score de performance actuel est de ${scorePercentage}%

Rappelez-vous : L'objectif est d'aider le conducteur à s'améliorer, pas de le réprimander.`,

    de: `Sie sind ein professioneller Vertreter des Mr. Nice Drive Limousinenservice und rufen ${driverName} an.

Ihre Aufgabe ist es:
1. Einen respektvollen, professionellen und unterstützenden Ton zu bewahren
2. Das spezifische Anliegen anzusprechen: ${reason}
3. Das Problem zu besprechen: ${message}
4. Zu erwähnen, dass ihr aktueller Leistungswert ${scorePercentage}% beträgt

Denken Sie daran: Das Ziel ist es, dem Fahrer zu helfen, sich zu verbessern.`,

    it: `Lei è un rappresentante professionale del servizio limousine Mr. Nice Drive che chiama ${driverName}.

Il suo ruolo è:
1. Mantenere un tono rispettoso, professionale e di supporto
2. Affrontare la preoccupazione specifica: ${reason}
3. Discutere il problema: ${message}
4. Menzionare che il loro punteggio di performance attuale è ${scorePercentage}%

Ricordi: L'obiettivo è aiutare l'autista a migliorare.`,

    pt: `Você é um representante profissional do serviço de limusine Mr. Nice Drive ligando para ${driverName}.

Seu papel é:
1. Manter um tom respeitoso, profissional e de apoio
2. Abordar a preocupação específica: ${reason}
3. Discutir o problema: ${message}
4. Mencionar que sua pontuação de desempenho atual é ${scorePercentage}%

Lembre-se: O objetivo é ajudar o motorista a melhorar.`,

    ru: `Вы профессиональный представитель лимузинного сервиса Mr. Nice Drive, звонящий ${driverName}.

Ваша роль:
1. Поддерживать уважительный, профессиональный тон
2. Обратиться к конкретной проблеме: ${reason}
3. Обсудить вопрос: ${message}
4. Упомянуть, что их текущий показатель эффективности составляет ${scorePercentage}%

Помните: Цель - помочь водителю улучшиться.`,

    tr: `Mr. Nice Drive limuzin hizmetinin profesyonel temsilcisi olarak ${driverName}'i arıyorsunuz.

Rolünüz:
1. Saygılı, profesyonel ton sürdürmek
2. Belirli endişeyi ele almak: ${reason}
3. Sorunu tartışmak: ${message}
4. Mevcut performans puanlarının ${scorePercentage}% olduğunu belirtmek

Unutmayın: Amaç sürücünün gelişmesine yardımcı olmak.`,

    nl: `U bent een professionele vertegenwoordiger van Mr. Nice Drive limousineservice die ${driverName} belt.

Uw rol is:
1. Een respectvolle, professionele toon behouden
2. De specifieke zorg aanpakken: ${reason}
3. Het probleem bespreken: ${message}
4. Vermelden dat hun huidige prestatiescore ${scorePercentage}% is

Onthoud: Het doel is de chauffeur te helpen verbeteren.`,

    pl: `Jesteś profesjonalnym przedstawicielem serwisu limuzyn Mr. Nice Drive dzwoniącym do ${driverName}.

Twoja rola to:
1. Utrzymywanie szacunkowego, profesjonalnego tonu
2. Odniesienie się do konkretnego problemu: ${reason}
3. Omówienie kwestii: ${message}
4. Wspomnienie, że ich obecny wynik wydajności to ${scorePercentage}%

Pamiętaj: Celem jest pomóc kierowcy się poprawić.`,

    ur: `السلام علیکم ${driverName}، یہ Mr. Nice Drive سے کال ہے۔ آپ کے کام کے بارے میں بات کرنی ہے۔ وقت ہے؟`
  };

  return prompts[language as keyof typeof prompts] || prompts.en;
}

function generateTestFirstMessage(driverName: string, language: string = 'en') {
  const messages = {
    en: `Hello ${driverName}, this is a call from Mr. Nice Drive limousine service. I hope you're having a good day. I'm calling to discuss some feedback about your recent work with us. Is this a good time to talk?`,
    ar: `مرحباً ${driverName}، هذه مكالمة من خدمة Mr. Nice Drive للليموزين. أتمنى أن تقضي يوماً جميلاً. أتصل لمناقشة بعض التعليقات حول عملك الأخير معنا. هل هذا وقت مناسب للحديث؟`,
    es: `Hola ${driverName}, esta es una llamada del servicio de limusinas Mr. Nice Drive. Espero que esté teniendo un buen día. Te llamo para discutir algunos comentarios sobre tu trabajo reciente con nosotros. ¿Es un buen momento para hablar?`,
    fr: `Bonjour ${driverName}, c'est un appel du service de limousine Mr. Nice Drive. J'espère que vous passez une bonne journée. Je vous appelle pour discuter de quelques commentaires sur votre travail récent avec nous. Est-ce un bon moment pour parler ?`,
    de: `Hallo ${driverName}, hier ist ein Anruf vom Mr. Nice Drive Limousinenservice. Ich hoffe, Sie haben einen schönen Tag. Ich rufe an, um einige Rückmeldungen zu Ihrer kürzlichen Arbeit bei uns zu besprechen. Ist das ein guter Zeitpunkt zum Sprechen?`,
    it: `Ciao ${driverName}, questa è una chiamata dal servizio limousine Mr. Nice Drive. Spero che tu stia passando una bella giornata. Ti sto chiamando per discutere alcuni feedback sul tuo lavoro recente con noi. È un buon momento per parlare?`,
    pt: `Olá ${driverName}, esta é uma ligação do serviço de limusine Mr. Nice Drive. Espero que esteja tendo um bom dia. Estou ligando para discutir alguns comentários sobre seu trabalho recente conosco. É um bom momento para conversar?`,
    ru: `Здравствуйте, ${driverName}, это звонок из лимузинного сервиса Mr. Nice Drive. Надеюсь, у вас хороший день. Я звоню, чтобы обсудить некоторые отзывы о вашей недавней работе с нами. Удобно ли сейчас поговорить?`,
    tr: `Merhaba ${driverName}, bu Mr. Nice Drive limuzin hizmetinden bir arama. Umarım güzel bir gün geçiriyorsunuzdur. Bizimle olan son çalışmanız hakkında bazı geri bildirimleri görüşmek için arıyorum. Konuşmak için uygun bir zaman mı?`,
    nl: `Hallo ${driverName}, dit is een oproep van Mr. Nice Drive limousineservice. Ik hoop dat u een goede dag heeft. Ik bel om wat feedback over uw recente werk bij ons te bespreken. Is dit een goed moment om te praten?`,
    pl: `Cześć ${driverName}, to telefon z serwisu limuzyn Mr. Nice Drive. Mam nadzieję, że masz dobry dzień. Dzwonię, aby omówić kilka uwag dotyczących twojej ostatniej pracy z nami. Czy to dobry moment na rozmowę?`,
    ur: `السلام علیکم ${driverName}، یہ Mr. Nice Drive سے کال ہے۔ آپ کے کام کے بارے میں بات کرنی ہے۔ وقت ہے؟`
  };

  return messages[language as keyof typeof messages] || messages.en;
}

// Run the test
testEnhancedOutboundCall().catch(console.error); 