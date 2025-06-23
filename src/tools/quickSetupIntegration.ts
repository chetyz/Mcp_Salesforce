import { Connection } from 'jsforce';
import { IntegrationConfig } from './manageIntegrations.js';

export interface QuickSetupArgs {
  type: 'whatsapp_lead' | 'slack_opportunity' | 'email_case' | 'webhook_custom';
  objectName: string;
  config: {
    // WhatsApp specific
    whatsappApiToken?: string;
    phoneNumber?: string;
    
    // Slack specific
    slackWebhookUrl?: string;
    slackChannel?: string;
    
    // Email specific
    emailEndpoint?: string;
    emailApiKey?: string;
    
    // Webhook specific
    webhookUrl?: string;
    webhookHeaders?: Record<string, string>;
    
    // Common
    messageTemplate: string;
    condition?: string;
  };
}

export const QUICK_SETUP_INTEGRATION = {
  name: "salesforce_quick_setup_integration",
  description: "Quick setup for common integrations like WhatsApp notifications for new leads, Slack alerts for opportunities, email notifications for cases, etc.",
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["whatsapp_lead", "slack_opportunity", "email_case", "webhook_custom"],
        description: "Type of quick setup integration"
      },
      objectName: {
        type: "string",
        description: "Salesforce object to monitor (e.g., 'Lead', 'Opportunity', 'Case')"
      },
      config: {
        type: "object",
        description: "Configuration specific to the integration type",
        properties: {
          whatsappApiToken: {
            type: "string",
            description: "WhatsApp Business API token"
          },
          phoneNumber: {
            type: "string", 
            description: "Target phone number for WhatsApp (with country code)"
          },
          slackWebhookUrl: {
            type: "string",
            description: "Slack webhook URL"
          },
          slackChannel: {
            type: "string",
            description: "Slack channel (e.g., '#sales', '#leads')"
          },
          emailEndpoint: {
            type: "string",
            description: "Email service API endpoint"
          },
          emailApiKey: {
            type: "string",
            description: "Email service API key"
          },
          webhookUrl: {
            type: "string",
            description: "Custom webhook URL"
          },
          webhookHeaders: {
            type: "object",
            description: "Custom headers for webhook"
          },
          messageTemplate: {
            type: "string",
            description: "Message template with field placeholders (e.g., 'New lead: {Name} from {Company}')"
          },
          condition: {
            type: "string",
            description: "Optional condition to filter when to trigger (e.g., 'Rating = Hot')"
          }
        },
        required: ["messageTemplate"]
      }
    },
    required: ["type", "objectName", "config"]
  }
};

export async function handleQuickSetupIntegration(
  conn: Connection,
  args: QuickSetupArgs
): Promise<{ content: Array<{ type: string; text: string }> }> {
  
  try {
    const integrationConfig = createQuickSetupConfig(args);
    
    // Use the existing integration management logic
    const { handleManageIntegrations } = await import('./manageIntegrations.js');
    
    return await handleManageIntegrations(conn, {
      operation: 'create',
      config: integrationConfig
    });
    
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error setting up quick integration: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

function createQuickSetupConfig(args: QuickSetupArgs): IntegrationConfig {
  const baseConfig = {
    name: `${args.type}_${args.objectName}_${Date.now()}`,
    objectName: args.objectName,
    triggerEvents: ['insert'] as const,
    messageTemplate: args.config.messageTemplate,
    condition: args.config.condition,
    active: true
  };

  switch (args.type) {
    case 'whatsapp_lead':
      return {
        ...baseConfig,
        type: 'whatsapp',
        endpoint: 'https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages',
        authType: 'bearer',
        authConfig: {
          token: args.config.whatsappApiToken,
          phoneNumber: args.config.phoneNumber
        }
      };

    case 'slack_opportunity':
      return {
        ...baseConfig,
        type: 'slack',
        endpoint: args.config.slackWebhookUrl || '',
        authType: 'none',
        authConfig: {
          channel: args.config.slackChannel || '#sales'
        },
        triggerEvents: ['insert', 'update']
      };

    case 'email_case':
      return {
        ...baseConfig,
        type: 'email',
        endpoint: args.config.emailEndpoint || 'https://api.sendgrid.com/v3/mail/send',
        authType: 'api_key',
        authConfig: {
          apiKey: args.config.emailApiKey
        }
      };

    case 'webhook_custom':
      return {
        ...baseConfig,
        type: 'webhook',
        endpoint: args.config.webhookUrl || '',
        authType: 'none',
        authConfig: args.config.webhookHeaders || {}
      };

    default:
      throw new Error(`Unknown quick setup type: ${args.type}`);
  }
}

// Pre-built templates for common scenarios
export const INTEGRATION_TEMPLATES = {
  whatsapp_lead: {
    messageTemplate: "🔔 Nuevo Lead!\n\nNombre: {Name}\nEmpresa: {Company}\nEmail: {Email}\nTeléfono: {Phone}\nFuente: {LeadSource}\n\nRating: {Rating}",
    description: "Notificación de WhatsApp cuando se crea un nuevo Lead"
  },
  
  slack_opportunity: {
    messageTemplate: "💰 Oportunidad actualizada!\n\n*{Name}*\nCuenta: {Account.Name}\nMonto: ${Amount}\nEtapa: {StageName}\nProbabilidad: {Probability}%\nCierre: {CloseDate}",
    description: "Alert de Slack para oportunidades"
  },
  
  email_case: {
    messageTemplate: "🎫 Nuevo Case #{CaseNumber}\n\nContacto: {Contact.Name}\nCuenta: {Account.Name}\nAsunto: {Subject}\nPrioridad: {Priority}\nEstado: {Status}\n\nDescripción:\n{Description}",
    description: "Email para nuevos casos de soporte"
  },
  
  webhook_custom: {
    messageTemplate: "Registro actualizado: {Name} en {$ObjectType}",
    description: "Webhook genérico para cualquier objeto"
  }
};