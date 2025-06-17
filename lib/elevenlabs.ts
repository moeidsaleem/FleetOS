import axios from 'axios';

// Types based on ElevenLabs API documentation
export interface ConversationConfig {
  agent: {
    first_message: string;
    language: string;
    prompt: {
      prompt: string;
      llm: string;
      temperature?: number;
      max_tokens?: number;
      tools?: Array<{
        type: string;
        name: string;
        description: string;
      }>;
      knowledge_base?: Array<{
        document_id: string;
        id: string;
        type: string;
        name: string;
      }>;
    };
  };
  tts: {
    voice_id: string;
    model_id: string;
    stability?: number;
    speed?: number;
    similarity_boost?: number;
  };
}

export interface PlatformSettings {
  call_limits?: {
    agent_concurrency_limit?: number;
    daily_limit?: number;
  };
  privacy?: {
    record_voice?: boolean;
    retention_days?: number;
  };
  data_collection?: Record<string, {
    type: string;
    description?: string;
  }>;
  evaluation?: {
    criteria: Array<{
      id: string;
      conversation_goal_prompt: string;
      name: string;
      type: string;
      use_knowledge_base?: boolean;
    }>;
  };
  overrides?: {
    conversation_config_override?: {
      agent?: {
        prompt?: {
          prompt?: boolean;
        };
        first_message?: boolean;
        language?: boolean;
      };
    };
  };
}

// Valid LLM models based on documentation
export const SUPPORTED_MODELS = {
  GOOGLE: {
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.0-flash': 'Gemini 2.0 Flash', 
    'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'gemini-1.5-pro': 'Gemini 1.5 Pro'
  },
  OPENAI: {
    'gpt-4.1': 'GPT-4.1',
    'gpt-4.1-mini': 'GPT-4.1 Mini',
    'gpt-4.1-nano': 'GPT-4.1 Nano',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo'
  },
  ANTHROPIC: {
    'claude-sonnet-4': 'Claude Sonnet 4',
    'claude-3.5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3.5-sonnet-v1': 'Claude 3.5 Sonnet v1',
    'claude-3.7-sonnet': 'Claude 3.7 Sonnet',
    'claude-3.0-haiku': 'Claude 3.0 Haiku'
  }
} as const;

// Valid TTS models based on documentation
export const TTS_MODELS = {
  'eleven_turbo_v2_5': 'Turbo v2.5 (Recommended)',
  'eleven_flash_v2_5': 'Flash v2.5 (Fastest)',
  'eleven_multilingual_v2': 'Multilingual v2'
} as const;

export class ElevenLabsService {
  private static instance: ElevenLabsService;
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  private constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public static getInstance(apiKey: string): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService(apiKey);
    }
    return ElevenLabsService.instance;
  }

  private get headers() {
    return {
      'xi-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  private get fileHeaders() {
    return {
      'xi-api-key': this.apiKey,
      'Content-Type': 'multipart/form-data'
    };
  }

  /**
   * Create a new agent in ElevenLabs Conversational AI
   */
  async createAgent(agentData: {
    name: string;
    voiceId?: string;
    prompt?: string;
    firstMessage?: string;
    language?: string;
    llmModel?: keyof typeof SUPPORTED_MODELS.GOOGLE | keyof typeof SUPPORTED_MODELS.OPENAI | keyof typeof SUPPORTED_MODELS.ANTHROPIC;
    ttsModel?: keyof typeof TTS_MODELS;
    goals?: any[];
  }) {
    try {
      // Prepare the conversation config based on the ElevenLabs API
      const conversationConfig: ConversationConfig = {
        agent: {
          first_message: agentData.firstMessage || "Hello, how can I help you today?",
          language: agentData.language || "en",
          prompt: {
            prompt: agentData.prompt || "You are a helpful assistant that helps customers with their questions.",
            llm: agentData.llmModel || "gemini-2.0-flash", // Updated to correct model name
            temperature: 0.7,
            max_tokens: 2000,
            tools: [
              {
                type: 'system',
                name: 'end_call',
                description: 'End the call',
              },
            ]
          }
        },
        tts: {
          voice_id: agentData.voiceId || "cjVigY5qzO86Huf0OWal", // Default ElevenLabs voice
          model_id: agentData.ttsModel || "eleven_turbo_v2_5", // Updated to latest TTS model
          stability: 0.5,
          speed: 1.0,
          similarity_boost: 0.8
        }
      };

      console.log('Agent Config', conversationConfig);

      // Process goals for platform settings
      const platformSettings: PlatformSettings = {
        call_limits: {
          agent_concurrency_limit: 5,
          daily_limit: 1000
        },
        privacy: {
          record_voice: true,
          retention_days: 30
        },
        overrides: {
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: true
              },
              first_message: true,
              language: true
            }
          }
        }
      };

      // Process goals if provided and valid
      if (agentData.goals && Array.isArray(agentData.goals) && agentData.goals.length > 0) {
        try {
          // Process data collection goals
          const dataCollectionGoals = agentData.goals.filter(
            goal => goal && goal.type === 'data_collection' && goal.active
          );
          
          if (dataCollectionGoals.length > 0) {
            platformSettings.data_collection = {};

            console.log('dataCollectionGoals', dataCollectionGoals.map(goal => goal.dataCollectionFields));
            
            dataCollectionGoals.forEach(goal => {
              if (goal.dataCollectionFields && Array.isArray(goal.dataCollectionFields) && goal.dataCollectionFields.length > 0) {
                goal.dataCollectionFields.forEach((field: { name: string; type: string; description: string }) => {
                  if (field && field.name && platformSettings.data_collection) {
                    platformSettings.data_collection[field.name] = {
                      type: field.type || 'string',
                      description: field.description || undefined
                    };
                  }
                });
              }
            });
          }
          
          // Process evaluation goals
          const evaluationGoals = agentData.goals.filter(
            goal => goal && goal.type === 'evaluation' && goal.active
          );
          
          if (evaluationGoals.length > 0) {
            platformSettings.evaluation = {
              criteria: []
            };
            
            console.log('Adding evaluation goals to the agent:', evaluationGoals.length);
            
            evaluationGoals.forEach(goal => {
              if (!goal || !goal.name) return;
              
              console.log('Processing evaluation goal:', goal.name);
              if (goal.evaluationRules && Array.isArray(goal.evaluationRules) && goal.evaluationRules.length > 0) {
                console.log('Evaluation rules found:', goal.evaluationRules.length);
                goal.evaluationRules.forEach((rule: any) => {
                  if (!rule) return;
                  
                  console.log('Rule details:', JSON.stringify(rule, null, 2));
                  
                  // Determine the conversation goal prompt to use
                  const prompt = rule.conversation_goal_prompt || (rule as any).scoringCriteria || '';
                  
                  if (!prompt) {
                    console.warn('Warning: Rule is missing conversation_goal_prompt:', rule.name);
                    return; // Skip this rule
                  }
                  
                  const ruleId = rule.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? 
                    crypto.randomUUID() : 
                    Math.random().toString(36).substr(2, 9));
                  
                  if (platformSettings.evaluation?.criteria) {
                    platformSettings.evaluation.criteria.push({
                      id: ruleId,
                      conversation_goal_prompt: prompt,
                      name: rule.name || 'Evaluation Rule',
                      type: rule.type || "prompt",
                      use_knowledge_base: rule.use_knowledge_base || false
                    });
                  }
                });
              }
            });
          }
        } catch (error) {
          console.error('Error processing goals:', error);
          // Continue without goals if there's an error
        }
      }

      console.log('Platform Settings', JSON.stringify(platformSettings, null, 2));

      const payload = {
        conversation_config: conversationConfig,
        name: agentData.name,
        platform_settings: platformSettings
      };

      console.log('Payload', JSON.stringify(payload, null, 2));

      // Create the agent using the ElevenLabs API with correct endpoint
      const response = await axios.post(
        `${this.baseUrl}/convai/agents/create`,
        payload,
        {
          headers: this.headers
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to create ElevenLabs agent:', error);
      
      // Improve error reporting
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;
        const statusCode = error.response?.status;
        
        console.error('API Error Details:', {
          status: statusCode,
          data: responseData,
          url: error.config?.url
        });
        
        // Provide more specific error messages based on status code
        if (statusCode === 401) {
          throw new Error('Invalid ElevenLabs API key. Please check your API key.');
        } else if (statusCode === 403) {
          throw new Error('Access denied. Your ElevenLabs plan may not include Conversational AI features.');
        } else if (statusCode === 400) {
          throw new Error(`Invalid request: ${responseData?.detail || 'Please check your agent configuration.'}`);
        } else if (statusCode === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        // Throw a more informative error message
        throw new Error(`Failed to create ElevenLabs agent: ${responseData?.detail || error.message}`);
      }
      
      throw new Error('Failed to create ElevenLabs agent');
    }
  }

  /**
   * Update an existing agent in ElevenLabs Conversational AI
   */
  async updateAgent(agentId: string, updateData: {
    name?: string;
    voiceId?: string;
    prompt?: string;
    firstMessage?: string;
    language?: string;
    goals?: any[];
    knowledgeBase?: string[];
  }) {
    try {
      // Build the update payload based on what fields are provided
      const updatePayload: any = {};
      
      if (updateData.name) {
        updatePayload.name = updateData.name;
      }

      // If we have conversational config updates
      if (updateData.voiceId || updateData.prompt || updateData.firstMessage || updateData.language || updateData.knowledgeBase) {
        updatePayload.conversation_config = {};
        
        // Voice settings update
        if (updateData.voiceId) {
          updatePayload.conversation_config.tts = {
            voice_id: updateData.voiceId
          };
        }
        
        // Agent settings update
        if (updateData.prompt || updateData.firstMessage || updateData.language || updateData.knowledgeBase) {
          updatePayload.conversation_config.agent = {};
          
          if (updateData.prompt) {
            updatePayload.conversation_config.agent.prompt = {
              prompt: updateData.prompt
            };
          }
          
          if (updateData.firstMessage) {
            updatePayload.conversation_config.agent.first_message = updateData.firstMessage;
          }
          
          if (updateData.language) {
            updatePayload.conversation_config.agent.language = updateData.language;
          }

          // Knowledge base update
          if (updateData.knowledgeBase !== undefined) {
            // Initialize prompt section if not already there
            updatePayload.conversation_config.agent.prompt = updatePayload.conversation_config.agent.prompt || {};
            
            if (updateData.knowledgeBase.length > 0) {
              // Format knowledge base IDs as KnowledgeBaseLocator objects
              updatePayload.conversation_config.agent.prompt.knowledge_base = updateData.knowledgeBase.map(docId => ({
                document_id: docId,
                id: docId,
                type: "file",
                name: `Document ${docId}`
              }));
            } else {
              // If we're clearing the knowledge base (empty array)
              updatePayload.conversation_config.agent.prompt.knowledge_base = [];
            }
          }
        }
      }

      // Process goals for platform settings if provided
      if (updateData.goals && updateData.goals.length > 0) {
        updatePayload.platform_settings = {};
        
        // Process data collection goals
        const dataCollectionGoals = updateData.goals.filter(
          goal => goal.type === 'data_collection' && goal.active
        );
        
        if (dataCollectionGoals.length > 0) {
          updatePayload.platform_settings.data_collection = {
            fields: []
          };
          
          dataCollectionGoals.forEach(goal => {
            if (goal.dataCollectionFields && goal.dataCollectionFields.length > 0) {
              goal.dataCollectionFields.forEach((field: any) => {
                updatePayload.platform_settings.data_collection.fields.push({
                  name: field.name,
                  type: field.type,
                  required: field.required,
                  description: field.description || undefined
                });
              });
            }
          });
        }
        
        // Process evaluation goals
        const evaluationGoals = updateData.goals.filter(
          goal => goal.type === 'evaluation' && goal.active
        );
        
        console.log('Evaluation goals for ElevenLabs update:', evaluationGoals.length);
        
        if (evaluationGoals.length > 0) {
          updatePayload.platform_settings.evaluation = {
            criteria: []
          };
          
          evaluationGoals.forEach(goal => {
            console.log('Processing evaluation goal:', goal.name);
            if (goal.evaluationRules && goal.evaluationRules.length > 0) {
              console.log('Evaluation rules found:', goal.evaluationRules.length);
              goal.evaluationRules.forEach((rule: { id: string; conversation_goal_prompt: string; name: string; type: string; use_knowledge_base: boolean }) => {
                console.log('Rule details:', JSON.stringify(rule, null, 2));
                updatePayload.platform_settings.evaluation.criteria.push({
                  id: rule.id,
                  conversation_goal_prompt: rule.conversation_goal_prompt,
                  name: rule.name,
                  type: rule.type || "prompt",
                  use_knowledge_base: rule.use_knowledge_base || false
                });
              });
            }
          });
          
          console.log('ElevenLabs evaluation criteria:', JSON.stringify(updatePayload.platform_settings.evaluation.criteria, null, 2));
        }
      }

      // Only proceed if we have something to update
      if (Object.keys(updatePayload).length === 0) {
        throw new Error('No update data provided');
      }

      // Update the agent using the ElevenLabs API with the correct endpoint
      console.log(`Updating ElevenLabs agent ${agentId} with payload:`, JSON.stringify(updatePayload, null, 2));
      
      const response = await axios.patch(
        `${this.baseUrl}/convai/agents/${agentId}`,
        updatePayload,
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Successfully updated ElevenLabs agent ${agentId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to update ElevenLabs agent:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data,
        });
        
        if (error.response?.status === 404) {
          throw new Error(`ElevenLabs agent with ID ${agentId} not found. Verify the agent ID is correct.`);
        } else if (error.response?.status === 401) {
          throw new Error('ElevenLabs API key is invalid or missing. Please check your API key.');
        } else if (error.response) {
          throw new Error(`ElevenLabs API error: ${error.response.data?.detail || error.message}`);
        }
      }
      
      throw new Error('Failed to update ElevenLabs agent');
    }
  }

  /**
   * Get an agent's details
   */
  async getAgent(agentId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/convai/agents/${agentId}`,
        {
          headers: {
            'xi-api-key': this.apiKey
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get ElevenLabs agent:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`ElevenLabs agent with ID ${agentId} not found.`);
        } else if (error.response?.status === 401) {
          throw new Error('ElevenLabs API key is invalid or missing.');
        } else if (error.response) {
          throw new Error(`ElevenLabs API error: ${error.response.data?.detail || error.message}`);
        }
      }
      
      throw new Error('Failed to get ElevenLabs agent');
    }
  }
  
  /**
   * List all agents
   */
  async listAgents() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/convai/agents`,
        {
          headers: {
            'xi-api-key': this.apiKey
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to list ElevenLabs agents:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('ElevenLabs API key is invalid or missing.');
        } else if (error.response) {
          throw new Error(`ElevenLabs API error: ${error.response.data?.detail || error.message}`);
        }
      }
      
      throw new Error('Failed to list ElevenLabs agents');
    }
  }
  
  /**
   * List all phone numbers
   */
  async listPhoneNumbers() {
    try {
      console.log('Fetching ElevenLabs phone numbers with API key', this.apiKey ? 'provided' : 'missing');
      
      // Use the correct endpoint according to ElevenLabs documentation
      const response = await axios.get(
        `${this.baseUrl}/convai/phone-numbers/`,
        {
          headers: {
            'xi-api-key': this.apiKey
          }
        }
      );
      console.log('ElevenLabs listPhoneNumbers response status:', response.status);
      return response.data;
    } catch (error) {
      console.error('Failed to list ElevenLabs phone numbers:', error);
      
      // Improved error handling with more details
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data,
        });
        
        if (error.response?.status === 404) {
          throw new Error('ElevenLabs phone numbers endpoint not found. Check if the API endpoint is correct.');
        } else if (error.response?.status === 401) {
          throw new Error('ElevenLabs API key is invalid or missing. Please check your API key.');
        } else if (error.response) {
          throw new Error(`ElevenLabs API error: ${error.response.data?.detail || error.message}`);
        }
      }
      
      throw new Error('Failed to list ElevenLabs phone numbers');
    }
  }

  /**
   * Get a specific phone number details
   */
  async getPhoneNumber(phoneNumberId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/convai/phone-numbers/${phoneNumberId}`,
        {
          headers: {
            'xi-api-key': this.apiKey
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get ElevenLabs phone number:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Phone number not found in ElevenLabs.');
        } else if (error.response) {
          throw new Error(`ElevenLabs API error: ${error.response.data?.detail || error.message}`);
        }
      }
      
      throw new Error('Failed to get ElevenLabs phone number');
    }
  }

  
  /**
   * Make an outbound call using ElevenLabs native outbound calling
   */
  async makeOutboundCall(
    agentId: string, 
    phoneNumberId: string, 
    toNumber: string,
    options?: {
      dynamic_variables?: Record<string, string>;
      conversation_config_override?: {
        agent?: {
          prompt?: {
            prompt?: string;
          };
          first_message?: string;
          language?: string;
        };
      };
    }
  ) {
    try {
      const payload: any = {
        agent_id: agentId,
        agent_phone_number_id: phoneNumberId,
        to_number: toNumber
      };

      // Add conversation initiation client data if options are provided
      if (options && (options.dynamic_variables || options.conversation_config_override)) {
        payload.conversation_initiation_client_data = {};
        
        // Add dynamic variables
        if (options.dynamic_variables) {
          payload.conversation_initiation_client_data.dynamic_variables = options.dynamic_variables;
        }

        // Add conversation config overrides
        if (options.conversation_config_override) {
          payload.conversation_initiation_client_data.conversation_config_override = options.conversation_config_override;
        }
      }

      console.log('Outbound call payload:', JSON.stringify(payload, null, 2));

      // Use the correct Twilio outbound call endpoint from ElevenLabs documentation
      const response = await axios.post(
        `${this.baseUrl}/convai/twilio/outbound-call`,
        payload,
        {
          headers: this.headers
        }
      );
      
      console.log('Outbound call response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to initiate ElevenLabs outbound call:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('ElevenLabs API error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url
        });
        
        const statusCode = error.response.status;
        const responseData = error.response.data;
        
        if (statusCode === 401) {
          throw new Error('Invalid ElevenLabs API key. Please check your API key in environment variables.');
        } else if (statusCode === 403) {
          throw new Error('Access denied. Your ElevenLabs plan may not include outbound calling features.');
        } else if (statusCode === 400) {
          throw new Error(`Invalid request: ${responseData?.detail || 'Please check your call configuration.'}`);
        } else if (statusCode === 404) {
          throw new Error(`Endpoint not found or agent/phone number invalid. Response: ${responseData?.detail || 'Not Found'}`);
        } else if (statusCode === 422) {
          throw new Error(`Validation error: ${responseData?.detail || 'Please check your request parameters.'}`);
        } else if (statusCode === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        throw new Error(`ElevenLabs API error (${statusCode}): ${responseData?.detail || error.message}`);
      }
      
      throw new Error('Failed to initiate outbound call');
    }
  }

  // Create knowledge base document from text
  async createKnowledgeBaseFromText(text: string, name?: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/convai/knowledge-base/text`,
        { text, name },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating knowledge base from text:', error);
      throw error;
    }
  }

  // Create knowledge base document from file
  async createKnowledgeBaseFromFile(file: File, name?: string) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (name) formData.append('name', name);

      const response = await axios.post(
        `${this.baseUrl}/convai/knowledge-base/file`,
        formData,
        { headers: this.fileHeaders }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating knowledge base from file:', error);
      throw error;
    }
  }

  // Create knowledge base document from URL
  async createKnowledgeBaseFromUrl(url: string, name?: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/convai/knowledge-base/url`,
        { url, name },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating knowledge base from URL:', error);
      throw error;
    }
  }

  // Get dependent agents for a knowledge base document
  async getDependentAgents(documentId: string, cursor?: string, pageSize: number = 30) {
    try {
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      if (pageSize) params.append('page_size', pageSize.toString());
      
      const response = await axios.get(
        `${this.baseUrl}/convai/knowledge-base/${documentId}/dependent-agents?${params.toString()}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting dependent agents:', error);
      throw error;
    }
  }

  // Delete a knowledge base document
  async deleteKnowledgeBaseDocument(documentId: string) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/convai/knowledge-base/documents/${documentId}`,
        {
          headers: this.headers
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to delete knowledge base document:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Knowledge base document with ID ${documentId} not found.`);
        } else if (error.response) {
          throw new Error(`ElevenLabs API error: ${error.response.data?.detail || error.message}`);
        }
      }
      
      throw new Error('Failed to delete knowledge base document');
    }
  }

  /**
   * Delete an existing agent from ElevenLabs Conversational AI
   */
  async deleteAgent(agentId: string) {
    try {
      console.log(`Attempting to delete ElevenLabs agent: ${agentId}`);
      
      const response = await axios.delete(
        `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('ElevenLabs agent deletion successful');
      return response.data;
    } catch (error) {
      console.error('Failed to delete ElevenLabs agent:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data,
        });
        
        if (error.response?.status === 422) {
          throw new Error('Failed to delete agent: Unprocessable Entity');
        }
        throw new Error(`Failed to delete agent: ${error.response?.data?.detail || error.message}`);
      }
      throw new Error('Failed to delete ElevenLabs agent');
    }
  }

  /**
   * Create a new phone number in ElevenLabs
   * Supports both Twilio and SIP trunk configurations
   */
  async createPhoneNumber(data: {
    provider: 'twilio' | 'sip_trunk';
    label: string;
    twilio?: {
      phone_number: string;
      sid: string;
      token: string;
    };
    sip_trunk?: {
      domain: string;
      termination_uri: string;
      credentials?: {
        username: string;
        password: string;
      }
    }
  }) {
    try {
      // Format request body based on provider type
      let requestBody: any = {
        label: data.label
      };

      // Add provider-specific configuration
      if (data.provider === 'twilio') {
        if (!data.twilio) {
          throw new Error('Twilio configuration is required for Twilio provider');
        }
        requestBody = {
          ...requestBody,
          provider: 'twilio',
          ...data.twilio
        };
      } else if (data.provider === 'sip_trunk') {
        if (!data.sip_trunk) {
          throw new Error('SIP trunk configuration is required for SIP trunk provider');
        }
        requestBody = {
          ...requestBody,
          provider: 'sip_trunk',
          ...data.sip_trunk
        };
      } else {
        throw new Error('Invalid provider type. Must be "twilio" or "sip_trunk"');
      }

      // Make API request
      const response = await fetch(`${this.baseUrl}/convai/phone-numbers/create`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create phone number: ${error.detail || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating phone number:', error);
      throw error;
    }
  }

  /**
   * Get all available phone numbers
   */
  async getPhoneNumbers() {
    try {
      console.log('Fetching phone numbers from ElevenLabs API...');
      
      // Try with the proven endpoint first
      try {
        const response = await axios.get(
          `${this.baseUrl}/convai/phone-numbers`,
          {
            headers: {
              "xi-api-key": this.apiKey,
              "Content-Type": "application/json",
            },
          }
        );
        
        console.log('ElevenLabs API response:', JSON.stringify(response.data, null, 2));
        
        // Normalize the response structure
        if (response.data && response.data.phone_numbers) {
          return response.data;
        } else if (Array.isArray(response.data)) {
          return { phone_numbers: response.data };
        } else {
          // Return empty array if data is in an unexpected format
          return { phone_numbers: [] };
        }
      } catch (primaryError) {
        console.error('Error from primary endpoint:', primaryError);
        
        // Try backward compatibility endpoint as a fallback
        try {
          const altResponse = await axios.get(
            `${this.baseUrl}/conversational-voice/phone-numbers`,
            {
              headers: {
                "xi-api-key": this.apiKey,
                "Content-Type": "application/json",
              },
            }
          );
          
          console.log('ElevenLabs API response from fallback endpoint:', JSON.stringify(altResponse.data, null, 2));
          
          // Normalize the response structure
          if (altResponse.data && altResponse.data.phone_numbers) {
            return altResponse.data;
          } else if (Array.isArray(altResponse.data)) {
            return { phone_numbers: altResponse.data };
          }
        } catch (fallbackError) {
          console.error('Error from fallback endpoint:', fallbackError);
        }
        
        // If all else fails, try to call the listPhoneNumbers method
        try {
          console.log('Attempting to use listPhoneNumbers method instead...');
          const result = await this.listPhoneNumbers();
          
          // Convert to the expected format if needed
          if (result && !result.phone_numbers) {
            if (Array.isArray(result)) {
              return { phone_numbers: result };
            } else {
              return { phone_numbers: [] };
            }
          }
          
          return result;
        } catch (listError) {
          console.error('Error from listPhoneNumbers method:', listError);
          // Return empty array after all attempts have failed
          return { phone_numbers: [] };
        }
      }
    } catch (error) {
      console.error("Error fetching ElevenLabs phone numbers:", error);
      // Return empty array to prevent UI errors
      return { phone_numbers: [] };
    }
  }

  async assignPhoneNumberToAgent(phoneNumberId: string, agentId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/convai/phone-numbers/${phoneNumberId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agent_id: agentId }),
      });

      if (!response.ok) {
        const error = await response.json();
         console.log('Assigning phone number error', error)
        throw new Error(`Failed to assign phone number: ${error.detail || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error assigning phone number:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a single agent
   */
  async getAgentConversationHistory(agentId: string, options?: {
    cursor?: string;
    page_size?: number;
  }) {
    try {
      const params = new URLSearchParams();
      if (options?.cursor) params.append('cursor', options.cursor);
      if (options?.page_size) params.append('page_size', options.page_size.toString());
      
      const response = await axios.get(
        `${this.baseUrl}/convai/conversation-history/${agentId}${params.toString() ? '?' + params.toString() : ''}`,
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Failed to get conversation history for agent ${agentId}:`, error);
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        
        if (statusCode === 401) {
          throw new Error('Invalid ElevenLabs API key. Please check your API key.');
        } else if (statusCode === 404) {
          throw new Error(`Agent with ID ${agentId} not found or has no conversation history.`);
        } else if (statusCode === 403) {
          throw new Error('Access denied. Your ElevenLabs plan may not include conversation history access.');
        }
      }
      
      throw new Error(`Failed to get conversation history for agent ${agentId}`);
    }
  }

  /* 
   * Get Multiple Agents Conversation History
   * The purpose of this is to get the conversation history for multiple agents at once for a campaign.
   */
  async getMultipleAgentsConversationHistory(agentIds: string[], options?: {
    cursor?: string;
    page_size?: number;
  }) {
    try {
      const responses = await Promise.allSettled(agentIds.map(async (agentId) => {
        return await this.getAgentConversationHistory(agentId, options);
      }));

      // Process results and handle any failures
      const successfulResponses: any[] = [];
      const failedAgents: string[] = [];

      responses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulResponses.push({
            agentId: agentIds[index],
            data: result.value
          });
        } else {
          failedAgents.push(agentIds[index]);
          console.error(`Failed to get history for agent ${agentIds[index]}:`, result.reason);
        }
      });

      return {
        successful: successfulResponses,
        failed: failedAgents,
        totalRequested: agentIds.length,
        totalSuccessful: successfulResponses.length
      };
    } catch (error) {
      console.error('Failed to get multiple agents conversation history:', error);
      throw new Error('Failed to get multiple agents conversation history');
    }
  }

  /**
   * Synthesize speech from text using ElevenLabs TTS API.
   */
  async synthesizeSpeech(
    text: string,
    voiceId: string,
    options?: {
      modelId?: keyof typeof TTS_MODELS;
      stability?: number;
      similarityBoost?: number;
      style?: number;
      useSpeakerBoost?: boolean;
      speed?: number;
      outputFormat?: 'mp3_44100_128' | 'pcm_44100' | 'ulaw_8000';
    }
  ): Promise<string> {
    try {
      const payload = {
        text,
        model_id: options?.modelId ?? 'eleven_multilingual_v2',
        voice_settings: {
          stability: options?.stability ?? 0.5,
          similarity_boost: options?.similarityBoost ?? 0.75,
          style: options?.style ?? 0,
          use_speaker_boost: options?.useSpeakerBoost ?? false,
          speed: options?.speed ?? 1.0,
        },
      };

      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        payload,
        {
          headers: this.headers,
          responseType: 'arraybuffer',
          params: {
            output_format: options?.outputFormat ?? 'mp3_44100_128',
          },
        }
      );

      return Buffer.from(response.data).toString('base64');
    } catch (error) {
      console.error('Failed to synthesize speech:', error);
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const responseData = error.response?.data;
        
        if (statusCode === 401) {
          throw new Error('Invalid ElevenLabs API key. Please check your API key.');
        } else if (statusCode === 400) {
          throw new Error(`Invalid request: Please check your text and voice settings.`);
        } else if (statusCode === 422) {
          throw new Error(`Unprocessable entity: ${responseData?.detail || 'Invalid voice ID or parameters.'}`);
        } else if (statusCode === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }
      
      throw new Error('Failed to synthesize speech');
    }
  }

  /**
   * Connect to WebSocket for real-time conversation
   */
  static connectWebSocket(
    wsUrl: string,
    config: any,
    onMessage: (data: any) => void,
    onStatusChange: (status: any) => void
  ) {
    try {
      const ws = new WebSocket(wsUrl);
      const statusRef = { current: { isConnected: false, isLoading: true, error: null, messages: [] } };

      ws.onopen = () => {
        console.log('WebSocket connection established');
        statusRef.current = { ...statusRef.current, isConnected: true, isLoading: false };
        onStatusChange('connected');
        
        // Send initialization configuration if provided
        if (config) {
          ws.send(JSON.stringify({
            type: 'config',
            ...config
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        statusRef.current = { ...statusRef.current, error: null, isLoading: false };
        onStatusChange('error');
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        statusRef.current = { ...statusRef.current, isConnected: false, isLoading: false };
        onStatusChange('disconnected');
      };

      return {
        sendMessage: (message: string) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'text',
              content: message
            }));
          }
        },
        close: () => {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      throw error;
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`ElevenLabs API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error getting ElevenLabs voices:', error);
      return [];
    }
  }
}