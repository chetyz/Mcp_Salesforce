#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as dotenv from "dotenv";

import { createSalesforceConnection } from "./utils/connection.js";
// Only import the new integration tools for now
import { MANAGE_INTEGRATIONS, handleManageIntegrations, ManageIntegrationsArgs } from "./tools/manageIntegrations.js";
import { QUICK_SETUP_INTEGRATION, handleQuickSetupIntegration, QuickSetupArgs } from "./tools/quickSetupIntegration.js";

dotenv.config();

const server = new Server(
  {
    name: "salesforce-mcp-server-enhanced",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Tool handlers - only the new integration tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // New integration tools
    MANAGE_INTEGRATIONS,
    QUICK_SETUP_INTEGRATION
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    if (!args) throw new Error('Arguments are required');

    const conn = await createSalesforceConnection();

    switch (name) {
      // NEW INTEGRATION TOOLS
      case "salesforce_manage_integrations": {
        const integrationArgs = args as Record<string, unknown>;
        if (!integrationArgs.operation) {
          throw new Error('operation is required for managing integrations');
        }
        
        // Type check and conversion
        const validatedArgs: ManageIntegrationsArgs = {
          operation: integrationArgs.operation as 'create' | 'list' | 'update' | 'delete' | 'activate' | 'deactivate',
          integrationName: integrationArgs.integrationName as string | undefined,
          config: integrationArgs.config as any | undefined
        };

        return await handleManageIntegrations(conn, validatedArgs);
      }

      case "salesforce_quick_setup_integration": {
        const quickSetupArgs = args as Record<string, unknown>;
        if (!quickSetupArgs.type || !quickSetupArgs.objectName || !quickSetupArgs.config) {
          throw new Error('type, objectName, and config are required for quick setup integration');
        }
        
        // Type check and conversion
        const validatedArgs: QuickSetupArgs = {
          type: quickSetupArgs.type as 'whatsapp_lead' | 'slack_opportunity' | 'email_case' | 'webhook_custom',
          objectName: quickSetupArgs.objectName as string,
          config: quickSetupArgs.config as any
        };

        return await handleQuickSetupIntegration(conn, validatedArgs);
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}.\n\nAvailable tools:\n- salesforce_manage_integrations\n- salesforce_quick_setup_integration\n\nNote: This is the enhanced version with integration capabilities. Use the original MCP for standard Salesforce operations.` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Enhanced Salesforce MCP Server with Integration Tools running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});