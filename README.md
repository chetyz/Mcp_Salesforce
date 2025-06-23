# Salesforce MCP Server - Enhanced Edition

An enhanced MCP (Model Context Protocol) server implementation that integrates Claude with Salesforce, featuring **automatic external API integrations**. This server allows Claude to query, modify, and manage your Salesforce objects and records, plus **automatically set up integrations** with external services like WhatsApp, Slack, email, and custom webhooks.

## 🆕 NEW FEATURES - Integration Management

### **🔗 Automatic Integration Setup**
Create integrations that automatically trigger when Salesforce records are created, updated, or deleted:

- **WhatsApp notifications** when new leads are created
- **Slack alerts** for opportunity updates  
- **Email notifications** for new cases
- **Custom webhooks** for any object/event combination

### **⚡ Quick Setup Templates**
Pre-built integration templates for common scenarios:
- `whatsapp_lead` - WhatsApp notifications for new leads
- `slack_opportunity` - Slack alerts for opportunities
- `email_case` - Email notifications for support cases
- `webhook_custom` - Generic webhook for any use case

## Original Features

* **Object and Field Management**: Create and modify custom objects and fields using natural language
* **Smart Object Search**: Find Salesforce objects using partial name matches
* **Detailed Schema Information**: Get comprehensive field and relationship details for any object
* **Flexible Data Queries**: Query records with relationship support and complex filters
* **Data Manipulation**: Insert, update, delete, and upsert records with ease
* **Cross-Object Search**: Search across multiple objects using SOSL
* **Apex Code Management**: Read, create, and update Apex classes and triggers
* **Intuitive Error Handling**: Clear feedback with Salesforce-specific error details

## Installation

```bash
npm install -g @tsmztech/mcp-server-salesforce
```

## 🆕 New Integration Tools

### salesforce_manage_integrations
Complete integration management:
* Create new integrations with external APIs
* List all configured integrations
* Update integration settings
* Activate/deactivate integrations
* Delete integrations

### salesforce_quick_setup_integration
Quick setup for common integration scenarios:
* WhatsApp Business API integration
* Slack webhook integration
* Email service integration
* Custom webhook integration

## Integration Examples

### 📱 WhatsApp Lead Notifications
```
"Set up WhatsApp notifications when new leads are created"

Quick setup with:
- Type: whatsapp_lead
- Object: Lead
- WhatsApp API token: your_token
- Phone number: +1234567890
- Message: "🔔 New lead: {Name} from {Company} - Rating: {Rating}"
```

### 💬 Slack Opportunity Alerts
```
"Create Slack alerts for opportunity updates"

Quick setup with:
- Type: slack_opportunity  
- Object: Opportunity
- Slack webhook URL: your_webhook_url
- Channel: #sales
- Message: "💰 {Name} - ${Amount} - Stage: {StageName}"
```

### 📧 Email Case Notifications
```
"Send email notifications for new support cases"

Quick setup with:
- Type: email_case
- Object: Case  
- Email API endpoint: your_email_service
- Message: "New case #{CaseNumber} from {Contact.Name}"
```

### 🎯 Custom Webhook Integration
```
"Create custom webhook for account updates"

Setup with:
- Type: webhook_custom
- Object: Account
- Webhook URL: https://your-system.com/webhook
- Events: insert, update
- Condition: "Type = 'Customer'"
```

## How Integration Works

1. **Setup**: Use quick setup or manual configuration
2. **Automatic Creation**: 
   - Creates `Integration_Config__c` custom object to store settings
   - Generates Apex trigger for your target object
   - Creates `IntegrationCalloutService` utility class
3. **Runtime**: When records match your criteria, automatic callouts are made
4. **Management**: Full control to activate, deactivate, update, or delete integrations

## Original Tools

### salesforce_search_objects
Search for standard and custom objects by partial name matches.

### salesforce_describe_object
Get detailed object schema information including fields, relationships, and picklist values.

### salesforce_query_records
Query records with relationship support and complex WHERE conditions.

### salesforce_aggregate_query
Execute aggregate queries with GROUP BY, aggregate functions, and HAVING clauses.

### salesforce_dml_records
Perform data operations: insert, update, delete, and upsert records.

### salesforce_manage_object
Create and modify custom objects with sharing settings.

### salesforce_manage_field
Manage object fields including relationships and automatically grant Field Level Security.

### salesforce_manage_field_permissions
Manage Field Level Security (Field Permissions) for specific profiles.

### salesforce_search_all
Search across multiple objects using SOSL with field snippets.

### salesforce_read_apex / salesforce_write_apex
Read and manage Apex classes with full source code access.

### salesforce_read_apex_trigger / salesforce_write_apex_trigger
Read and manage Apex triggers for any object.

### salesforce_execute_anonymous
Execute anonymous Apex code for custom operations.

### salesforce_manage_debug_logs
Manage debug logs for Salesforce users with configurable log levels.

## Setup

### Salesforce Authentication
You can connect to Salesforce using one of two authentication methods:

#### 1. Username/Password Authentication (Default)
1. Set up your Salesforce credentials
2. Get your security token (Reset from Salesforce Settings)

#### 2. OAuth 2.0 Client Credentials Flow
1. Create a Connected App in Salesforce
2. Enable OAuth settings and select "Client Credentials Flow"
3. Set appropriate scopes (typically "api" is sufficient)
4. Save the Client ID and Client Secret
5. **Important**: Note your instance URL (e.g., `https://your-domain.my.salesforce.com`) as it's required for authentication

### Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

#### For Username/Password Authentication:
```json
{
  "mcpServers": {
    "salesforce": {
      "command": "npx",
      "args": ["-y", "@tsmztech/mcp-server-salesforce"],
      "env": {
        "SALESFORCE_CONNECTION_TYPE": "User_Password",
        "SALESFORCE_USERNAME": "your_username",
        "SALESFORCE_PASSWORD": "your_password",
        "SALESFORCE_TOKEN": "your_security_token",
        "SALESFORCE_INSTANCE_URL": "org_url"
      }
    }
  }
}
```

#### For OAuth 2.0 Client Credentials Flow:
```json
{
  "mcpServers": {
    "salesforce": {
      "command": "npx",
      "args": ["-y", "@tsmztech/mcp-server-salesforce"],
      "env": {
        "SALESFORCE_CONNECTION_TYPE": "OAuth_2.0_Client_Credentials",
        "SALESFORCE_CLIENT_ID": "your_client_id",
        "SALESFORCE_CLIENT_SECRET": "your_client_secret",
        "SALESFORCE_INSTANCE_URL": "https://your-domain.my.salesforce.com"
      }
    }
  }
}
```

## 🆕 Integration Usage Examples

### Quick Integration Setup
```
"Set up WhatsApp notifications for hot leads"
"Create Slack alerts when opportunities exceed $50k" 
"Send email notifications for high-priority cases"
"Configure webhook for account updates"
```

### Managing Integrations
```
"List all my integrations"
"Deactivate the WhatsApp lead integration"
"Update the Slack webhook URL"
"Delete the old email integration"
```

### Advanced Integration Configuration
```
"Create custom integration for Contact updates that sends data to my CRM webhook when the lead score changes"
"Set up WhatsApp notifications only for leads with rating 'Hot' from specific lead sources"
```

## Traditional Usage Examples

### Searching Objects
```
"Find all objects related to Accounts"
"Show me objects that handle customer service"
"What objects are available for order management?"
```

### Getting Schema Information
```
"What fields are available in the Account object?"
"Show me the picklist values for Case Status"
"Describe the relationship fields in Opportunity"
```

### Querying Records
```
"Get all Accounts created this month"
"Show me high-priority Cases with their related Contacts"
"Find all Opportunities over $100k"
```

### Managing Custom Objects
```
"Create a Customer Feedback object"
"Add a Rating field to the Feedback object"
"Update sharing settings for the Service Request object"
```

## Development

### Building from source
```bash
# Clone your fork
git clone https://github.com/chetyz/Mcp_Salesforce.git

# Navigate to directory
cd Mcp_Salesforce

# Install dependencies
npm install

# Build the project
npm run build
```

## Contributing
Contributions are welcome! Feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Issues and Support
If you encounter any issues or need support, please file an issue on the [GitHub repository](https://github.com/chetyz/Mcp_Salesforce/issues).