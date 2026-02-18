# WhatsApp Business Integration Guide

This guide explains how to set up and use WhatsApp Business API integration in Guardian Assist.

## Features

- Send automated WhatsApp messages to customers
- Notifications for:
  - New ticket creation
  - Ticket status updates
  - Ready for pickup alerts
- Message logging and tracking
- Test message functionality
- Configurable automatic notifications

## Setup Instructions

### 1. Create a Meta Business Account

1. Go to [business.facebook.com](https://business.facebook.com)
2. Create a business account if you don't have one
3. Verify your business

### 2. Set Up WhatsApp Business API

1. Go to [Meta Developer Portal](https://developers.facebook.com)
2. Create a new app or use an existing one
3. Add the WhatsApp product to your app
4. Follow the setup wizard to:
   - Connect your WhatsApp Business Account
   - Add a phone number
   - Verify your business

### 3. Get Your Credentials

From the WhatsApp section in Meta Developer Portal:

1. **Phone Number ID**: Found in the "From" field when testing the API
2. **Access Token**: Generate a permanent access token (System User tokens are recommended for production)

### 4. Configure in Guardian Assist

1. Log in as an admin user
2. Go to System Settings
3. Navigate to "WhatsApp Settings" tab
4. Enter your:
   - Business Phone Number ID
   - Access Token
   - Webhook Verify Token (optional, for receiving status updates)
5. Enable the integration
6. Configure automatic notification preferences:
   - Ticket Created
   - Status Changes
   - Ready for Pickup
7. Click "Save WhatsApp Settings"

### 5. Test Your Integration

1. In the "Test WhatsApp Integration" section:
2. Enter a phone number (with country code, e.g., 27821234567)
3. Customize the test message if desired
4. Click "Send Test Message"
5. Verify the message is received on WhatsApp

## Using WhatsApp Notifications

### Automatic Notifications

When enabled in settings, the system will automatically send WhatsApp messages:

- **On Ticket Creation**: When a new repair ticket is created
- **On Status Change**: When ticket status is updated
- **On Ready for Pickup**: When status changes to "Ready for Pickup"

### Manual Messages

You can also send WhatsApp messages manually using the service utility:

```typescript
import { sendWhatsAppMessage } from '../lib/whatsappService';

const result = await sendWhatsAppMessage({
  phoneNumber: '27821234567',
  message: 'Your custom message',
  ticketId: 'ticket-uuid',
  messageType: 'custom'
});
```

### Helper Functions

The system provides helper functions for common message types:

```typescript
import {
  sendTicketCreatedMessage,
  sendStatusUpdateMessage,
  sendReadyForPickupMessage
} from '../lib/whatsappService';
```

## Message Templates

### Ticket Created
```
Hi [Customer Name], your device has been received. Ticket #[Ticket Number]. We'll update you on progress.
```

### Status Update
```
Update for Ticket #[Ticket Number]: Status changed to [New Status]. [Optional notes]
```

### Ready for Pickup
```
Great news! Your device (Ticket #[Ticket Number]) is ready for collection. Please visit us during business hours.
```

## Message Logging

All WhatsApp messages are automatically logged in the database with:
- Ticket ID
- Customer phone number
- Message content
- Message type
- WhatsApp message ID (if successful)
- Status (sent, failed, delivered, read)
- Timestamps
- Error messages (if failed)

## Phone Number Format

Phone numbers must be in international format without the + sign:
- Correct: `27821234567` (South Africa)
- Incorrect: `+27821234567`, `0821234567`

## Troubleshooting

### Messages Not Sending

1. **Check Integration Status**: Verify WhatsApp integration is enabled in settings
2. **Verify Credentials**: Ensure Phone Number ID and Access Token are correct
3. **Check Phone Number Format**: Must be international format without + sign
4. **Review Message Logs**: Check the whatsapp_message_log table for error details
5. **Test Connection**: Use the test message feature to verify setup

### Common Errors

- **"WhatsApp integration is disabled"**: Enable integration in System Settings > WhatsApp Settings
- **"Failed to send WhatsApp message"**: Check your access token hasn't expired
- **"Invalid phone number"**: Ensure number is in correct international format

## Security

- Access tokens are stored securely in the database
- Only admin users can configure WhatsApp settings
- All messages are logged for audit purposes
- The edge function validates settings before sending

## Limitations

- WhatsApp Business API has rate limits (check Meta documentation for current limits)
- Messages can only be sent to phone numbers that have interacted with your business number within 24 hours, or using approved message templates
- For production use, you need to get your WhatsApp Business Account approved by Meta

## Support

For more information about WhatsApp Business API:
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Help Center](https://business.facebook.com/help)
