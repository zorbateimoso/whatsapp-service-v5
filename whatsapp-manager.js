const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'https://buildboss-1.preview.emergentagent.com';
const REQUEST_TIMEOUT = 60000;

class WhatsAppManager {
  constructor() {
    this.clients = new Map();
    this.qrCodes = new Map();
    this.processedMessages = new Map(); // Cache para deduplicação
    console.log('📱 WhatsAppManager initialized');
    console.log(`🔗 Backend URL: ${BACKEND_URL}`);
    
    // Limpar cache de mensagens antigas a cada 5 minutos
    setInterval(() => {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      for (const [msgId, timestamp] of this.processedMessages.entries()) {
        if (timestamp < fiveMinutesAgo) {
          this.processedMessages.delete(msgId);
        }
      }
    }, 60000); // Check every minute
  }

  getClient(userId) {
    if (!this.clients.has(userId)) {
      console.log(`📱 Creating new WhatsApp client for user: ${userId}`);
      
      const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions'
          ]
        }
      });

      this._setupClientHandlers(client, userId);
      client.initialize();
      this.clients.set(userId, client);
    }
    return this.clients.get(userId);
  }

  _setupClientHandlers(client, userId) {
    client.on('qr', async (qr) => {
      console.log(`📱 QR Code generated for user: ${userId}`);
      try {
        const qrImage = await qrcode.toDataURL(qr);
        this.qrCodes.set(userId, qrImage);
        console.log(`✅ QR Code image generated successfully`);
      } catch (err) {
        console.error('❌ Error generating QR code image:', err);
        this.qrCodes.set(userId, qr);
      }
    });

    client.on('ready', () => {
      console.log(`✅ WhatsApp ready for user: ${userId}`);
      this.qrCodes.delete(userId);
    });

    client.on('authenticated', () => {
      console.log(`✅ WhatsApp authenticated for user: ${userId}`);
      this.qrCodes.delete(userId);
    });

    client.on('auth_failure', (msg) => {
      console.error(`❌ Auth failure for user ${userId}:`, msg);
    });

    client.on('disconnected', (reason) => {
      console.log(`⚠️ WhatsApp disconnected for user ${userId}:`, reason);
      this.clients.delete(userId);
      this.qrCodes.delete(userId);
    });

    client.on('message', async (msg) => {
      await this._handleMessage(msg, userId);
    });
  }

  async _handleMessage(msg, userId) {
    try {
      // Deduplicação: Verificar se já processamos esta mensagem
      const msgId = msg.id._serialized;
      if (this.processedMessages.has(msgId)) {
        console.log(`⏩ Skipping duplicate message: ${msgId}`);
        return;
      }
      
      // Marcar como processada
      this.processedMessages.set(msgId, Date.now());
      
      console.log(`\n📩 Message received for user ${userId}:`);
      console.log(`   From: ${msg.from}`);
      console.log(`   Type: ${msg.type}`);
      console.log(`   Text: ${msg.body ? msg.body.substring(0, 50) : 'N/A'}`);
      console.log(`   Has Media: ${msg.hasMedia}`);

      const contact = await msg.getContact();
      const chat = await msg.getChat();
      
      let messageType = 'text';
      if (msg.hasMedia) {
        if (msg.type === 'image') messageType = 'image';
        else if (msg.type === 'ptt' || msg.type === 'audio') messageType = 'audio';
        else if (msg.type === 'document') messageType = 'document';
        else messageType = 'document';
      } else if (msg.type === 'ptt' || msg.type === 'audio') {
        // Áudio sem mídia (bug do whatsapp-web.js às vezes)
        messageType = 'audio';
      }

      const webhookData = {
        user_id: userId,
        group_name: chat.name || contact.pushname || 'WhatsApp',
        group_id: msg.from,
        sender: msg.author || msg.from,
        sender_name: contact.pushname || contact.name || 'Usuário',
        timestamp: new Date().toISOString(),
        type: messageType,
        text: msg.body || null,
        validation_required: true  // Always require validation for new uploads
      };

      if (msg.hasMedia) {
        console.log('📎 Downloading media...');
        try {
          const media = await msg.downloadMedia();
          webhookData.media = media.data;
          webhookData.media_mime = media.mimetype;
          webhookData.media_filename = media.filename || `file.${media.mimetype.split('/')[1]}`;
          console.log(`✅ Media downloaded: ${messageType} (${webhookData.media.length} bytes)`);
        } catch (error) {
          console.error('❌ Error downloading media:', error.message);
        }
      }

      console.log('📤 Sending to backend:', BACKEND_URL + '/api/whatsapp/webhook');

      const response = await axios.post(
        BACKEND_URL + '/api/whatsapp/webhook',
        webhookData,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: REQUEST_TIMEOUT
        }
      );

      console.log('✅ Backend response received');
      console.log('   Status:', response.data.status);

      const { reply_message } = response.data;

      if (reply_message) {
        await msg.reply(reply_message);
        console.log('📨 Reply sent to user');
      } else {
        console.log('ℹ️  No reply message from backend');
      }

    } catch (error) {
      console.error('❌ Error processing message:');
      console.error('   Message:', error.message);
      if (error.response) {
        console.error('   Backend status:', error.response.status);
        console.error('   Backend data:', error.response.data);
      }
      
      try {
        await msg.reply('❌ Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.');
      } catch (replyError) {
        console.error('❌ Error sending error message:', replyError.message);
      }
    }
  }

  async getStatus(userId) {
    const client = this.clients.get(userId);
    if (!client) {
      return { 
        connected: false,
        hasQR: false,
        status: 'not_initialized' 
      };
    }

    try {
      const state = await client.getState();
      const hasQR = this.qrCodes.has(userId);
      const connected = state === 'CONNECTED';
      
      return {
        connected: connected,
        hasQR: hasQR,
        status: connected ? 'connected' : 'disconnected',
        state: state
      };
    } catch (error) {
      return { 
        connected: false,
        hasQR: this.qrCodes.has(userId),
        status: 'error', 
        error: error.message 
      };
    }
  }

  getQRCode(userId) {
    return this.qrCodes.get(userId) || null;
  }

  async getGroups(userId) {
    const client = this.clients.get(userId);
    if (!client) {
      throw new Error('Client not initialized for this user');
    }

    try {
      const chats = await client.getChats();
      const groups = chats
        .filter(chat => chat.isGroup)
        .map(chat => ({
          id: chat.id._serialized,
          name: chat.name
        }));
      
      return groups;
    } catch (error) {
      throw new Error(`Failed to get groups: ${error.message}`);
    }
  }

  async logout(userId) {
    const client = this.clients.get(userId);
    if (client) {
      try {
        await client.logout();
        await client.destroy();
        this.clients.delete(userId);
        this.qrCodes.delete(userId);
        console.log(`✅ User ${userId} logged out`);
      } catch (error) {
        console.error(`❌ Error logging out user ${userId}:`, error);
        throw error;
      }
    }
  }

  async destroy() {
    console.log('🛑 Destroying all WhatsApp clients...');
    for (const [userId, client] of this.clients.entries()) {
      try {
        await client.destroy();
        console.log(`✅ Client for user ${userId} destroyed`);
      } catch (error) {
        console.error(`❌ Error destroying client for user ${userId}:`, error);
      }
    }
    this.clients.clear();
    this.qrCodes.clear();
  }
}

module.exports = WhatsAppManager;
