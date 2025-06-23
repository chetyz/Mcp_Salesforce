# 🚀 Ejemplos de Uso - Integraciones Automáticas

## Ejemplo Completo: WhatsApp para Leads

### Paso 1: Configuración Rápida
```javascript
// Usar quick setup para WhatsApp
{
  "type": "whatsapp_lead",
  "objectName": "Lead", 
  "config": {
    "whatsappApiToken": "tu_token_whatsapp",
    "phoneNumber": "+5491123456789",
    "messageTemplate": "🔔 Nuevo Lead!\n\nNombre: {Name}\nEmpresa: {Company}\nEmail: {Email}\nTeléfono: {Phone}\nFuente: {LeadSource}\nRating: {Rating}",
    "condition": "Rating = 'Hot'"
  }
}
```

### Paso 2: Lo que se crea automáticamente
1. **Objeto Custom** `Integration_Config__c` para guardar configuraciones
2. **Trigger** `LeadIntegrationTrigger` en el objeto Lead
3. **Clase Apex** `IntegrationCalloutService` para manejar las llamadas
4. **Configuración** almacenada y lista para usar

### Paso 3: Resultado
Cada vez que se crea un Lead con Rating = 'Hot', se envía automáticamente un WhatsApp a tu teléfono.

---

## Ejemplo: Slack para Oportunidades

### Configuración
```javascript
{
  "type": "slack_opportunity",
  "objectName": "Opportunity",
  "config": {
    "slackWebhookUrl": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
    "slackChannel": "#ventas",
    "messageTemplate": "💰 Oportunidad actualizada!\n\n*{Name}*\nCuenta: {Account.Name}\nMonto: ${Amount}\nEtapa: {StageName}\nProbabilidad: {Probability}%\nCierre: {CloseDate}",
    "condition": "Amount > 50000"
  }
}
```

### Resultado
Notificaciones automáticas en Slack cuando las oportunidades > $50,000 se actualizan.

---

## Ejemplo: Email para Cases

### Configuración con SendGrid
```javascript
{
  "type": "email_case",
  "objectName": "Case",
  "config": {
    "emailEndpoint": "https://api.sendgrid.com/v3/mail/send",
    "emailApiKey": "tu_sendgrid_api_key",
    "messageTemplate": "🎫 Nuevo Case #{CaseNumber}\n\nContacto: {Contact.Name}\nCuenta: {Account.Name}\nAsunto: {Subject}\nPrioridad: {Priority}\nEstado: {Status}\n\nDescripción:\n{Description}",
    "condition": "Priority = 'High'"
  }
}
```

---

## Gestión de Integraciones

### Listar todas las integraciones
```javascript
{
  "operation": "list"
}
```

### Activar/Desactivar
```javascript
{
  "operation": "deactivate",
  "integrationName": "whatsapp_lead_1234567890"
}
```

### Actualizar configuración
```javascript
{
  "operation": "update",
  "integrationName": "slack_opportunity_1234567890", 
  "config": {
    "messageTemplate": "💰 NUEVA PLANTILLA: {Name} - ${Amount}"
  }
}
```

### Eliminar integración
```javascript
{
  "operation": "delete",
  "integrationName": "email_case_1234567890"
}
```

---

## Código Apex Generado Automáticamente

### Trigger Example
```apex
trigger LeadIntegrationTrigger on Lead (after insert) {
    IntegrationCalloutService.handleIntegrationCallout('whatsapp_lead_1234567890', Trigger.new, Trigger.old, Trigger.operationType);
}
```

### Service Class (Fragmento)
```apex
public class IntegrationCalloutService {
    
    @future(callout=true)
    public static void handleIntegrationCallout(String integrationName, List<SObject> newRecords, List<SObject> oldRecords, System.TriggerOperation operationType) {
        // Obtiene configuración de Integration_Config__c
        // Prepara mensaje con merge fields
        // Hace callout basado en el tipo de integración
    }
    
    private static String prepareMessage(String template, SObject record) {
        // Reemplaza {Name}, {Company}, etc. con valores reales
    }
    
    private static void makeCallout(Integration_Config__c config, String message, SObject record) {
        // HTTP callout específico por tipo (WhatsApp, Slack, Email, etc.)
    }
}
```

---

## Casos de Uso Reales

### 1. **E-commerce**: Notificar por WhatsApp cuando hay una orden > $500
```javascript
{
  "type": "whatsapp_lead",
  "objectName": "Order__c",
  "config": {
    "messageTemplate": "🛒 Nueva orden #{Name}\nCliente: {Customer__r.Name}\nMonto: ${Total_Amount__c}",
    "condition": "Total_Amount__c > 500"
  }
}
```

### 2. **Soporte**: Slack cuando Case crítico se crea
```javascript
{
  "type": "slack_opportunity", 
  "objectName": "Case",
  "config": {
    "slackChannel": "#soporte-critico",
    "messageTemplate": "🚨 CASE CRÍTICO\n{Subject}\nCliente: {Account.Name}\nContacto: {Contact.Name}",
    "condition": "Priority = 'Critical'"
  }
}
```

### 3. **Ventas**: Email al equipo cuando Lead se convierte
```javascript
{
  "type": "email_case",
  "objectName": "Lead", 
  "config": {
    "messageTemplate": "🎉 Lead convertido!\n{Name} de {Company} se convirtió en cliente.\nValor estimado: ${Annual_Revenue}",
    "condition": "IsConverted = true"
  }
}
```

---

## Troubleshooting

### Ver todas las integraciones activas
```
"List all my integrations"
```

### Desactivar temporalmente
```
"Deactivate the WhatsApp integration for leads"
```

### Ver logs de debug
```
"Enable debug logs for integration user and show recent logs"
```

### Probar integración
```
"Create a test lead with hot rating to trigger the WhatsApp integration"
```