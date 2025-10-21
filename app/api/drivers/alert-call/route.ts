import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../libs/database' // Commented out until alertCall model is added
import { z } from 'zod'
import { ElevenLabsService } from '../../../../lib/elevenlabs'
import fs from 'fs/promises'
import path from 'path'

// Request validation schema
const AlertCallRequestSchema = z.object({
  driverId: z.string().uuid(),
  reason: z.string().min(1),
  message: z.string().min(1),
  driverName: z.string().min(1),
  phoneNumber: z.string().min(1),
  currentScore: z.number().min(0).max(1),
  language: z.string().optional().default('en'), // Driver's preferred language
  tone: z.string().optional().default('neutral')
})

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID
const ELEVENLABS_AGENT_PHONE_NUMBER_ID = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID

console.log('ElevenLabs Environment Check:')
console.log('ELEVENLABS_API_KEY:', ELEVENLABS_API_KEY ? '✅ Set' : '❌ Missing')
console.log('ELEVENLABS_AGENT_ID:', ELEVENLABS_AGENT_ID ? '✅ Set' : '❌ Missing')
console.log('ELEVENLABS_AGENT_PHONE_NUMBER_ID:', ELEVENLABS_AGENT_PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing')

// Helper function to generate language-specific prompts
function generateAlertCallPrompt(driverName: string, reason: string, message: string, currentScore: number, language: string = 'en') {
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

Guidelines:
- Be empathetic and understanding
- Focus on improvement rather than punishment
- Ask open-ended questions to understand their situation
- Provide specific, actionable advice
- Keep the conversation professional but friendly
- If they become defensive, remain calm and redirect to solutions
- The call should last 3-5 minutes maximum

Remember: The goal is to help the driver improve, not to reprimand them. Be supportive while addressing the concerns clearly.`,

    ar: `أنت ممثل مهني من شركة Mr. Nice Drive للليموزين تتصل بـ ${driverName}.

دورك هو:
1. الحفاظ على نبرة محترمة ومهنية وداعمة طوال المحادثة
2. معالجة القلق المحدد: ${reason}
3. مناقشة المشكلة: ${message}
4. اذكر أن نقاط الأداء الحالية هي ${scorePercentage}%
5. الاستماع لوجهة نظرهم وتقديم ملاحظات بناءة
6. تقديم الدعم والموارد لمساعدتهم على التحسن
7. إنهاء المكالمة بملاحظة إيجابية مع خطوات واضحة

إرشادات:
- كن متعاطفاً ومتفهماً
- ركز على التحسين وليس العقاب
- اطرح أسئلة مفتوحة لفهم وضعهم
- قدم نصائح محددة وقابلة للتطبيق
- حافظ على المحادثة مهنية لكن ودية
- إذا أصبحوا دفاعيين، ابق هادئاً وأعد التوجيه للحلول
- يجب أن تستمر المكالمة 3-5 دقائق كحد أقصى

تذكر: الهدف هو مساعدة السائق على التحسن، وليس توبيخه.`,

    es: `Usted es un representante profesional del servicio de limusinas Mr. Nice Drive llamando a ${driverName}.

Su función es:
1. Mantener un tono respetuoso, profesional y de apoyo durante toda la conversación
2. Abordar la preocupación específica: ${reason}
3. Discutir el problema: ${message}
4. Mencionar que su puntuación de rendimiento actual es del ${scorePercentage}%
5. Escuchar su perspectiva y brindar comentarios constructivos
6. Ofrecer apoyo y recursos para ayudarlos a mejorar
7. Terminar la llamada con una nota positiva con pasos claros a seguir

Pautas:
- Sea empático y comprensivo
- Concéntrese en la mejora en lugar del castigo
- Haga preguntas abiertas para entender su situación
- Proporcione consejos específicos y prácticos
- Mantenga la conversación profesional pero amigable
- Si se ponen a la defensiva, mantenga la calma y redirija a las soluciones
- La llamada debe durar máximo 3-5 minutos

Recuerde: El objetivo es ayudar al conductor a mejorar, no reprenderlo. Sea de apoyo mientras aborda las preocupaciones claramente.`,

    fr: `Vous êtes un représentant professionnel du service de limousine Mr. Nice Drive appelant ${driverName}.

Votre rôle est de :
1. Maintenir un ton respectueux, professionnel et de soutien tout au long de la conversation
2. Aborder la préoccupation spécifique : ${reason}
3. Discuter du problème : ${message}
4. Mentionner que leur score de performance actuel est de ${scorePercentage}%
5. Écouter leur perspective et fournir des commentaires constructifs
6. Offrir du soutien et des ressources pour les aider à s'améliorer
7. Terminer l'appel sur une note positive avec des étapes claires

Directives :
- Soyez empathique et compréhensif
- Concentrez-vous sur l'amélioration plutôt que sur la punition
- Posez des questions ouvertes pour comprendre leur situation
- Fournissez des conseils spécifiques et réalisables
- Gardez la conversation professionnelle mais amicale
- S'ils deviennent défensifs, restez calme et redirigez vers les solutions
- L'appel devrait durer 3-5 minutes maximum

Rappelez-vous : L'objectif est d'aider le conducteur à s'améliorer, pas de le réprimander. Soyez encourageant tout en abordant clairement les préoccupations.`,

    de: `Sie sind ein Vertreter von Mr. Nice Drive und rufen ${driverName} an.

Hauptziele:
1. Professioneller, direkter Ton
2. Anliegen klar ansprechen: ${reason}
3. Problem erörtern: ${message}
4. Aktuellen Leistungswert ${scorePercentage}% kommunizieren
5. Feedback geben und Verbesserungsvorschläge machen
6. Konkrete Unterstützung anbieten
7. Klare nächste Schritte festlegen

Wichtige Regeln:
- Direkt und lösungsorientiert kommunizieren
- Fokus auf Verbesserung und Entwicklung
- Klare Erwartungen setzen
- Spezifische Handlungsempfehlungen geben
- Professionelle Distanz wahren
- Bei Widerstand: Sachlich bleiben und Lösungen aufzeigen
- Gesprächsdauer: 3-5 Minuten

Ziel: Leistungsverbesserung durch klare Kommunikation und Unterstützung.`,

    it: `Lei è un rappresentante professionale del servizio limousine Mr. Nice Drive che chiama ${driverName}.

Il suo ruolo è:
1. Mantenere un tono rispettoso, professionale e di supporto durante tutta la conversazione
2. Affrontare la preoccupazione specifica: ${reason}
3. Discutere il problema: ${message}
4. Menzionare che il loro punteggio di performance attuale è ${scorePercentage}%
5. Ascoltare la loro prospettiva e fornire feedback costruttivo
6. Offrire supporto e risorse per aiutarli a migliorare
7. Terminare la chiamata con una nota positiva e passi chiari successivi

Linee guida:
- Sia empatico e comprensivo
- Si concentri sul miglioramento piuttosto che sulla punizione
- Faccia domande aperte per capire la loro situazione
- Fornisca consigli specifici e attuabili
- Mantenga la conversazione professionale ma amichevole
- Se diventano difensivi, rimanga calmo e reindirizzi alle soluzioni
- La chiamata dovrebbe durare massimo 3-5 minuti

Ricordi: L'obiettivo è aiutare l'autista a migliorare, non rimproverarlo.`,

    pt: `Você é um representante profissional do serviço de limusine Mr. Nice Drive ligando para ${driverName}.

Seu papel é:
1. Manter um tom respeitoso, profissional e de apoio durante toda a conversa
2. Abordar a preocupação específica: ${reason}
3. Discutir o problema: ${message}
4. Mencionar que sua pontuação de desempenho atual é ${scorePercentage}%
5. Ouvir sua perspectiva e fornecer feedback construtivo
6. Oferecer suporte e recursos para ajudá-los a melhorar
7. Terminar a ligação com uma nota positiva e próximos passos claros

Diretrizes:
- Seja empático e compreensivo
- Foque na melhoria em vez da punição
- Faça perguntas abertas para entender sua situação
- Forneça conselhos específicos e acionáveis
- Mantenha a conversa profissional mas amigável
- Se ficarem defensivos, permaneça calmo e redirecione para soluções
- A ligação deve durar no máximo 3-5 minutos

Lembre-se: O objetivo é ajudar o motorista a melhorar, não repreendê-lo.`,

    ru: `Вы профессиональный представитель лимузинного сервиса Mr. Nice Drive, звонящий ${driverName}.

Ваша роль:
1. Поддерживать уважительный, профессиональный и поддерживающий тон на протяжении всего разговора
2. Обратиться к конкретной проблеме: ${reason}
3. Обсудить вопрос: ${message}
4. Упомянуть, что их текущий показатель эффективности составляет ${scorePercentage}%
5. Выслушать их точку зрения и предоставить конструктивную обратную связь
6. Предложить поддержку и ресурсы для улучшения
7. Завершить звонок на позитивной ноте с четкими следующими шагами

Руководящие принципы:
- Будьте эмпатичны и понимающими
- Сосредоточьтесь на улучшении, а не на наказании
- Задавайте открытые вопросы, чтобы понять их ситуацию
- Предоставляйте конкретные, выполнимые советы
- Поддерживайте профессиональный, но дружелюбный разговор
- Если они становятся оборонительными, оставайтесь спокойными и перенаправляйте к решениям
- Звонок должен длиться максимум 3-5 минут

Помните: Цель - помочь водителю улучшиться, а не упрекать его.`,

    tr: `Mr. Nice Drive limuzin hizmetinin profesyonel temsilcisi olarak ${driverName}'i arıyorsunuz.

Rolünüz:
1. Konuşma boyunca saygılı, profesyonel ve destekleyici bir ton sürdürmek
2. Belirli endişeyi ele almak: ${reason}
3. Sorunu tartışmak: ${message}
4. Mevcut performans puanlarının ${scorePercentage}% olduğunu belirtmek
5. Perspektiflerini dinlemek ve yapıcı geri bildirim sağlamak
6. İyileşmeleri için destek ve kaynaklar sunmak
7. Aramayı pozitif bir notla ve net sonraki adımlarla bitirmek

Yönergeler:
- Empatik ve anlayışlı olun
- Ceza yerine iyileştirmeye odaklanın
- Durumlarını anlamak için açık uçlu sorular sorun
- Spesifik, uygulanabilir tavsiyelerde bulunun
- Konuşmayı profesyonel ama dostane tutun
- Savunma durumuna geçerlerse, sakin kalın ve çözümlere yönlendirin
- Arama maksimum 3-5 dakika sürmeli

Unutmayın: Amaç sürücünün gelişmesine yardımcı olmak, azarlamak değil.`,

    nl: `U bent een professionele vertegenwoordiger van Mr. Nice Drive limousineservice die ${driverName} belt.

Uw rol is:
1. Een respectvolle, professionele en ondersteunende toon behouden tijdens het hele gesprek
2. De specifieke zorg aanpakken: ${reason}
3. Het probleem bespreken: ${message}
4. Vermelden dat hun huidige prestatiescore ${scorePercentage}% is
5. Hun perspectief beluisteren en constructieve feedback geven
6. Ondersteuning en middelen aanbieden om hen te helpen verbeteren
7. Het gesprek eindigen op een positieve noot met duidelijke vervolgstappen

Richtlijnen:
- Wees empathisch en begripvol
- Focus op verbetering in plaats van straf
- Stel open vragen om hun situatie te begrijpen
- Geef specifieke, uitvoerbare adviezen
- Houd het gesprek professioneel maar vriendelijk
- Als ze defensief worden, blijf kalm en stuur door naar oplossingen
- Het gesprek moet maximaal 3-5 minuten duren

Onthoud: Het doel is de chauffeur te helpen verbeteren, niet berispen.`,

    pl: `Jesteś profesjonalnym przedstawicielem serwisu limuzyn Mr. Nice Drive dzwoniącym do ${driverName}.

Twoja rola to:
1. Utrzymywanie szacunkowego, profesjonalnego i wspierającego tonu przez całą rozmowę
2. Odniesienie się do konkretnego problemu: ${reason}
3. Omówienie kwestii: ${message}
4. Wspomnienie, że ich obecny wynik wydajności to ${scorePercentage}%
5. Wysłuchanie ich perspektywy i udzielenie konstruktywnej informacji zwrotnej
6. Zaoferowanie wsparcia i zasobów pomocy w poprawie
7. Zakończenie rozmowy na pozytywnej nucie z jasnymi kolejnymi krokami

Wytyczne:
- Bądź empatyczny i wyrozumiały
- Skup się na poprawie zamiast karaniu
- Zadawaj otwarte pytania, aby zrozumieć ich sytuację
- Udzielaj konkretnych, możliwych do wykonania rad
- Utrzymuj rozmowę profesjonalną, ale przyjazną
- Jeśli staną się defensywni, zachowaj spokój i przekieruj na rozwiązania
- Rozmowa powinna trwać maksymalnie 3-5 minut

Pamiętaj: Celem jest pomóc kierowcy się poprawić, a nie go łajać.`,

    ur: `السلام علیکم ${driverName}، یہ Mr. Nice Drive سے کال ہے۔ آپ کے کام کے بارے میں بات کرنی ہے۔ وقت ہے؟`
  };

  return prompts[language as keyof typeof prompts] || prompts.en;
}

// Helper function to generate language-specific first messages
function generateFirstMessage(driverName: string, language: string = 'en') {
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

// Helper to load versioned prompts
async function getVersionedPrompt({ language, reason, tone, driverName }:{ language: string, reason: string, tone: string, driverName: string }): Promise<{ prompt: string, version: number }> {
  const promptsPath = path.resolve(process.cwd(), 'prompts/alert-call-prompts.json')
  const promptsData = JSON.parse(await fs.readFile(promptsPath, 'utf8'))
  const version = promptsData.version || 1
  const langPrompts = promptsData.languages[language] || promptsData.languages['en']
  const tonePrompts = langPrompts?.[tone] || langPrompts?.['neutral']
  let template = tonePrompts?.[reason] || promptsData.default?.[tone] || promptsData.default?.neutral
  if (!template) template = 'Dear {DRIVER_NAME}, please address the following issue.'
  return { prompt: template.replace('{DRIVER_NAME}', driverName), version }
}

// Helper to load voice config
async function getVoiceId(language: string): Promise<string> {
  const voicesPath = path.resolve(process.cwd(), 'config/voices.json')
  const voicesData = JSON.parse(await fs.readFile(voicesPath, 'utf8'))
  return voicesData[language] || voicesData['en']
}

export async function POST(request: NextRequest) {
  try {
    console.log('Received alert call request')
    
    // Check ElevenLabs configuration
    if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID || !ELEVENLABS_AGENT_PHONE_NUMBER_ID) {
      console.error('ElevenLabs configuration missing')
      return NextResponse.json(
        { 
          success: false, 
          error: 'ElevenLabs configuration is missing. Please check environment variables.' 
        },
        { status: 500 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))

    const { 
      driverId, 
      reason, 
      message, 
      driverName, 
      phoneNumber, 
      currentScore,
      language = 'en',
      tone = 'neutral'
    } = AlertCallRequestSchema.parse(body)

    console.log(`Initiating alert call for driver: ${driverName} (${driverId}) - ${phoneNumber} in ${language}`)

    // Initialize ElevenLabs service
    const elevenlabs = ElevenLabsService.getInstance(ELEVENLABS_API_KEY)

    // Prepare dynamic variables for the conversation
    const dynamicVariables = {
      driver_name: driverName,
      driver_phone: phoneNumber,
      driver_id: driverId,
      reason: reason,
      message: message,
      score: (currentScore * 100).toString(),
      score_percentage: `${Math.round(currentScore * 100)}%`,
      company_name: 'Mr. Nice Drive',
      call_date: new Date().toLocaleDateString(),
      call_time: new Date().toLocaleTimeString(),
      language: language,
      call_type: 'alert_call'
    }

    // Get versioned prompt and voice
    const { prompt, version } = await getVersionedPrompt({ language, reason, tone, driverName })
    const voiceId = await getVoiceId(language)

    console.log('Dynamic variables:', dynamicVariables)
    console.log('Language:', language)
    console.log('Custom prompt length:', prompt.length)

    // Save alert record with promptVersion
    let alertRecord = await prisma.alertRecord.create({
      data: {
        driverId,
        alertType: 'CALL',
        priority: 'HIGH',
        reason,
        message,
        status: 'PENDING',
        triggeredBy: 'MANUAL',
        promptVersion: version,
      }
    })

    // Make the outbound call
    let callResult, callError = ''
    try {
      callResult = await elevenlabs.makeOutboundCall(
        ELEVENLABS_AGENT_ID,
        ELEVENLABS_AGENT_PHONE_NUMBER_ID,
        phoneNumber,
        {
          dynamic_variables: dynamicVariables,
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: prompt
              },
              first_message: generateFirstMessage(driverName, language),
              language: language
              // voice: voiceId, // Removed, not supported by API
            }
          }
        }
      )
    } catch (err) {
      callError = err instanceof Error ? err.message : 'Unknown error'
    }
    // Update alert record with result
    const callSuccess = callResult && callResult.conversation_id
    alertRecord = await prisma.alertRecord.update({
      where: { id: alertRecord.id },
      data: {
        status: callSuccess ? 'SENT' : 'FAILED',
        sentAt: callSuccess ? new Date() : undefined,
        error: !callSuccess && callError ? callError : undefined,
        conversationId: callSuccess ? callResult.conversation_id : undefined,
      }
    })
    if (callSuccess) {
      return NextResponse.json({
        success: true,
        message: 'Alert call initiated successfully',
        data: {
          conversation_id: callResult.conversation_id,
          callSid: callResult.callSid,
          driver_name: driverName,
          phone_number: phoneNumber,
          language: language,
          reason: reason,
          alertRecord,
          promptVersion: version
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: callError || 'Failed to initiate alert call',
        data: { alertRecord }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('ElevenLabs call failed:', error)
    
    let errorMessage = 'An unexpected error occurred'
    let statusCode = 500

    if (error instanceof z.ZodError) {
      errorMessage = `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      statusCode = 400
    } else if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes('Invalid ElevenLabs API key')) {
        statusCode = 401
      } else if (error.message.includes('Access denied')) {
        statusCode = 403
      } else if (error.message.includes('not found')) {
        statusCode = 404
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: statusCode }
    )
  }
} 
