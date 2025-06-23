import { Connection } from 'jsforce';

// Define integration types
export type IntegrationType = 'whatsapp' | 'slack' | 'email' | 'webhook' | 'custom';
export type TriggerEvent = 'insert' | 'update' | 'delete';

export interface IntegrationConfig {
  name: string;
  type: IntegrationType;
  endpoint: string;
  authType: 'none' | 'bearer' | 'api_key' | 'oauth';
  authConfig?: {
    token?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    phoneNumber?: string;  // Added for WhatsApp
    channel?: string;      // Added for Slack
    [key: string]: any;    // Allow additional properties
  };
  objectName: string;
  triggerEvents: TriggerEvent[];
  messageTemplate: string;
  condition?: string; // SOQL condition to filter when to trigger
  active: boolean;
}

export interface ManageIntegrationsArgs {
  operation: 'create' | 'list' | 'update' | 'delete' | 'activate' | 'deactivate';
  integrationName?: string;
  config?: IntegrationConfig;
}

export const MANAGE_INTEGRATIONS = {
  name: "salesforce_manage_integrations",
  description: "Manage external API integrations for Salesforce objects. Create webhooks, notifications to WhatsApp, Slack, email, etc. when records are created, updated, or deleted.",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["create", "list", "update", "delete", "activate", "deactivate"],
        description: "Operation to perform on integrations"
      },
      integrationName: {
        type: "string",
        description: "Name of the integration (required for update, delete, activate, deactivate operations)"
      },
      config: {
        type: "object",
        description: "Integration configuration (required for create and update operations)",
        properties: {
          name: {
            type: "string",
            description: "Unique name for the integration"
          },
          type: {
            type: "string",
            enum: ["whatsapp", "slack", "email", "webhook", "custom"],
            description: "Type of integration"
          },
          endpoint: {
            type: "string",
            description: "API endpoint URL for the external service"
          },
          authType: {
            type: "string",
            enum: ["none", "bearer", "api_key", "oauth"],
            description: "Authentication type for the API"
          },
          authConfig: {
            type: "object",
            description: "Authentication configuration",
            properties: {
              token: { type: "string", description: "Bearer token or API token" },
              apiKey: { type: "string", description: "API key" },
              clientId: { type: "string", description: "OAuth client ID" },
              clientSecret: { type: "string", description: "OAuth client secret" },
              phoneNumber: { type: "string", description: "Phone number for WhatsApp" },
              channel: { type: "string", description: "Channel for Slack" }
            }
          },
          objectName: {
            type: "string",
            description: "Salesforce object to monitor (e.g., 'Lead', 'Account', 'Contact')"
          },
          triggerEvents: {
            type: "array",
            items: {
              type: "string",
              enum: ["insert", "update", "delete"]
            },
            description: "Events that trigger the integration"
          },
          messageTemplate: {
            type: "string",
            description: "Message template with merge fields (e.g., 'New lead: {Name} from {Company}')"
          },
          condition: {
            type: "string",
            description: "Optional SOQL condition to filter when integration triggers (e.g., 'Rating = Hot')"
          },
          active: {
            type: "boolean",
            description: "Whether the integration is active"
          }
        },
        required: ["name", "type", "endpoint", "authType", "objectName", "triggerEvents", "messageTemplate", "active"]
      }
    },
    required: ["operation"]
  }
};

export async function handleManageIntegrations(
  conn: Connection,
  args: ManageIntegrationsArgs
): Promise<{ content: Array<{ type: string; text: string }> }> {
  
  try {
    switch (args.operation) {
      case 'create':
        return await createIntegration(conn, args.config!);
      case 'list':
        return await listIntegrations(conn);
      case 'update':
        return await updateIntegration(conn, args.integrationName!, args.config!);
      case 'delete':
        return await deleteIntegration(conn, args.integrationName!);
      case 'activate':
        return await activateIntegration(conn, args.integrationName!, true);
      case 'deactivate':
        return await activateIntegration(conn, args.integrationName!, false);
      default:
        throw new Error(`Unknown operation: ${args.operation}`);
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error managing integration: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

async function createIntegration(conn: Connection, config: IntegrationConfig) {
  const steps = [];
  
  // Step 1: Create custom object to store integration configs if it doesn't exist
  try {
    await conn.describe('Integration_Config__c');
  } catch (error) {
    // Object doesn't exist, create it
    await createIntegrationConfigObject(conn);
    steps.push("✅ Created Integration_Config__c custom object");
  }

  // Step 2: Store integration configuration
  const integrationRecord = {
    Name: config.name,
    Type__c: config.type,
    Endpoint__c: config.endpoint,
    Auth_Type__c: config.authType,
    Auth_Config__c: JSON.stringify(config.authConfig || {}),
    Object_Name__c: config.objectName,
    Trigger_Events__c: config.triggerEvents.join(','),
    Message_Template__c: config.messageTemplate,
    Condition__c: config.condition || '',
    Active__c: config.active
  };

  const result = await conn.sobject('Integration_Config__c').create(integrationRecord);
  steps.push(`✅ Created integration config record: ${result.id}`);

  // Step 3: Create or update trigger for the object
  const triggerCode = generateTriggerCode(config);
  const triggerName = `${config.objectName}IntegrationTrigger`;
  
  try {
    // Try to create the trigger
    await createTrigger(conn, triggerName, config.objectName, triggerCode);
    steps.push(`✅ Created trigger: ${triggerName}`);
  } catch (error) {
    // If trigger exists, update it
    try {
      await updateTrigger(conn, triggerName, triggerCode);
      steps.push(`✅ Updated existing trigger: ${triggerName}`);
    } catch (updateError) {
      steps.push(`⚠️ Warning: Could not create/update trigger: ${updateError}`);
    }
  }

  // Step 4: Create utility class for API callouts
  const utilityClassName = 'IntegrationCalloutService';
  const utilityClassCode = generateUtilityClass();
  
  try {
    await createApexClass(conn, utilityClassName, utilityClassCode);
    steps.push(`✅ Created utility class: ${utilityClassName}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('DUPLICATE_VALUE')) {
      steps.push(`✅ Utility class already exists: ${utilityClassName}`);
    } else {
      steps.push(`⚠️ Warning: Could not create utility class: ${error}`);
    }
  }

  return {
    content: [{
      type: "text",
      text: `🚀 Integration "${config.name}" created successfully!\n\n${steps.join('\n')}\n\n📋 Summary:\n- Type: ${config.type}\n- Object: ${config.objectName}\n- Events: ${config.triggerEvents.join(', ')}\n- Status: ${config.active ? 'Active' : 'Inactive'}\n\n💡 Your integration will trigger on ${config.triggerEvents.join('/')} events for ${config.objectName} records.`
    }]
  };
}

async function listIntegrations(conn: Connection) {
  try {
    const results = await conn.query(`
      SELECT Name, Type__c, Object_Name__c, Trigger_Events__c, Active__c, CreatedDate
      FROM Integration_Config__c 
      ORDER BY CreatedDate DESC
    `);

    if (results.records.length === 0) {
      return {
        content: [{
          type: "text",
          text: "No integrations found. Use 'create' operation to set up your first integration!"
        }]
      };
    }

    const integrationsList = results.records.map((record: any) => 
      `📱 ${record.Name}\n   Type: ${record.Type__c} | Object: ${record.Object_Name__c}\n   Events: ${record.Trigger_Events__c} | Status: ${record.Active__c ? '🟢 Active' : '🔴 Inactive'}`
    ).join('\n\n');

    return {
      content: [{
        type: "text",
        text: `🔗 Your Integrations (${results.records.length} total):\n\n${integrationsList}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: "No integrations found. The Integration_Config__c object may not exist yet. Create your first integration to get started!"
      }]
    };
  }
}

async function updateIntegration(conn: Connection, integrationName: string, config: IntegrationConfig) {
  const updateData: any = {};
  
  if (config.endpoint) updateData.Endpoint__c = config.endpoint;
  if (config.authConfig) updateData.Auth_Config__c = JSON.stringify(config.authConfig);
  if (config.messageTemplate) updateData.Message_Template__c = config.messageTemplate;
  if (config.condition !== undefined) updateData.Condition__c = config.condition;
  if (config.active !== undefined) updateData.Active__c = config.active;

  const result = await conn.sobject('Integration_Config__c').update({
    Name: integrationName,
    ...updateData
  });

  return {
    content: [{
      type: "text",
      text: `✅ Integration "${integrationName}" updated successfully!`
    }]
  };
}

async function deleteIntegration(conn: Connection, integrationName: string) {
  // Find the integration record
  const results = await conn.query(`SELECT Id FROM Integration_Config__c WHERE Name = '${integrationName}'`);
  
  if (results.records.length === 0) {
    throw new Error(`Integration "${integrationName}" not found`);
  }

  await conn.sobject('Integration_Config__c').delete(results.records[0].Id);

  return {
    content: [{
      type: "text",
      text: `🗑️ Integration "${integrationName}" deleted successfully!`
    }]
  };
}

async function activateIntegration(conn: Connection, integrationName: string, active: boolean) {
  const result = await conn.sobject('Integration_Config__c').update({
    Name: integrationName,
    Active__c: active
  });

  const status = active ? 'activated' : 'deactivated';
  const emoji = active ? '🟢' : '🔴';

  return {
    content: [{
      type: "text",
      text: `${emoji} Integration "${integrationName}" ${status} successfully!`
    }]
  };
}

// Helper functions for creating Salesforce components
async function createIntegrationConfigObject(conn: Connection) {
  const metadata = {
    fullName: 'Integration_Config__c',
    label: 'Integration Config',
    pluralLabel: 'Integration Configs',
    nameField: {
      type: 'Text',
      label: 'Integration Name'
    },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite'
  };

  await conn.metadata.create('CustomObject', metadata);

  // Create custom fields
  const fields = [
    { name: 'Type__c', type: 'Text', length: 50, label: 'Type' },
    { name: 'Endpoint__c', type: 'LongTextArea', length: 1000, label: 'Endpoint' },
    { name: 'Auth_Type__c', type: 'Text', length: 50, label: 'Auth Type' },
    { name: 'Auth_Config__c', type: 'LongTextArea', length: 2000, label: 'Auth Config' },
    { name: 'Object_Name__c', type: 'Text', length: 100, label: 'Object Name' },
    { name: 'Trigger_Events__c', type: 'Text', length: 100, label: 'Trigger Events' },
    { name: 'Message_Template__c', type: 'LongTextArea', length: 1000, label: 'Message Template' },
    { name: 'Condition__c', type: 'LongTextArea', length: 1000, label: 'Condition' },
    { name: 'Active__c', type: 'Checkbox', label: 'Active' }
  ];

  for (const field of fields) {
    await conn.metadata.create('CustomField', {
      fullName: `Integration_Config__c.${field.name}`,
      ...field
    });
  }
}

function generateTriggerCode(config: IntegrationConfig): string {
  const events = config.triggerEvents.map(event => {
    switch (event) {
      case 'insert': return 'after insert';
      case 'update': return 'after update';
      case 'delete': return 'after delete';
      default: return '';
    }
  }).filter(Boolean);

  return `trigger ${config.objectName}IntegrationTrigger on ${config.objectName} (${events.join(', ')}) {
    IntegrationCalloutService.handleIntegrationCallout('${config.name}', Trigger.new, Trigger.old, Trigger.operationType);
}`;
}

function generateUtilityClass(): string {
  return `public class IntegrationCalloutService {
    
    @future(callout=true)
    public static void handleIntegrationCallout(String integrationName, List<SObject> newRecords, List<SObject> oldRecords, System.TriggerOperation operationType) {
        try {
            // Get integration config
            Integration_Config__c config = [
                SELECT Type__c, Endpoint__c, Auth_Type__c, Auth_Config__c, Message_Template__c, Condition__c, Active__c
                FROM Integration_Config__c 
                WHERE Name = :integrationName AND Active__c = true
                LIMIT 1
            ];
            
            if (config == null) return;
            
            // Process records
            for (SObject record : newRecords) {
                // Check condition if specified
                if (String.isNotBlank(config.Condition__c)) {
                    // For now, we'll skip condition checking in this basic implementation
                    // In a full implementation, you'd evaluate the SOQL condition here
                }
                
                // Prepare message
                String message = prepareMessage(config.Message_Template__c, record);
                
                // Make callout based on integration type
                makeCallout(config, message, record);
            }
        } catch (Exception e) {
            System.debug('Integration callout error: ' + e.getMessage());
        }
    }
    
    private static String prepareMessage(String template, SObject record) {
        String message = template;
        
        // Replace merge fields in template
        Map<String, Object> fieldMap = record.getPopulatedFieldsAsMap();
        for (String fieldName : fieldMap.keySet()) {
            Object fieldValue = fieldMap.get(fieldName);
            if (fieldValue != null) {
                message = message.replace('{' + fieldName + '}', String.valueOf(fieldValue));
            }
        }
        
        return message;
    }
    
    private static void makeCallout(Integration_Config__c config, String message, SObject record) {
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(config.Endpoint__c);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        
        // Add authentication
        Map<String, Object> authConfig = (Map<String, Object>) JSON.deserializeUntyped(config.Auth_Config__c);
        
        if (config.Auth_Type__c == 'bearer' && authConfig.containsKey('token')) {
            req.setHeader('Authorization', 'Bearer ' + (String) authConfig.get('token'));
        } else if (config.Auth_Type__c == 'api_key' && authConfig.containsKey('apiKey')) {
            req.setHeader('X-API-Key', (String) authConfig.get('apiKey'));
        }
        
        // Prepare payload based on integration type
        Map<String, Object> payload = new Map<String, Object>();
        
        if (config.Type__c == 'whatsapp') {
            payload.put('phone', getPhoneFromRecord(record));
            payload.put('message', message);
        } else if (config.Type__c == 'slack') {
            payload.put('text', message);
            payload.put('channel', getSlackChannelFromConfig(authConfig));
        } else {
            payload.put('message', message);
            payload.put('data', record);
        }
        
        req.setBody(JSON.serialize(payload));
        
        try {
            HttpResponse res = http.send(req);
            System.debug('Integration response: ' + res.getStatusCode() + ' ' + res.getBody());
        } catch (Exception e) {
            System.debug('Callout error: ' + e.getMessage());
        }
    }
    
    private static String getPhoneFromRecord(SObject record) {
        // Try common phone fields
        if (record.get('Phone') != null) return (String) record.get('Phone');
        if (record.get('MobilePhone') != null) return (String) record.get('MobilePhone');
        return null;
    }
    
    private static String getSlackChannelFromConfig(Map<String, Object> authConfig) {
        return authConfig.containsKey('channel') ? (String) authConfig.get('channel') : '#general';
    }
}`;
}

async function createTrigger(conn: Connection, triggerName: string, objectName: string, triggerBody: string) {
  const metadata = {
    fullName: triggerName,
    tableEnumOrId: objectName,
    status: 'Active',
    body: triggerBody
  };

  await conn.metadata.create('ApexTrigger', metadata);
}

async function updateTrigger(conn: Connection, triggerName: string, triggerBody: string) {
  const metadata = {
    fullName: triggerName,
    body: triggerBody
  };

  await conn.metadata.update('ApexTrigger', metadata);
}

async function createApexClass(conn: Connection, className: string, classBody: string) {
  const metadata = {
    fullName: className,
    status: 'Active',
    body: classBody
  };

  await conn.metadata.create('ApexClass', metadata);
}