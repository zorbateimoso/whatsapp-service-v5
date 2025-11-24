const express = require('express');
const cors = require('cors');
const WhatsAppManager = require('./whatsapp-manager');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const whatsappManager = new WhatsAppManager();

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'whatsapp-service-obramanager',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const status = await whatsappManager.getStatus(userId);
    res.json(status);
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/initialize', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    console.log(`Initializing WhatsApp for user: ${userId}`);
    whatsappManager.getClient(userId);
    
    const status = await whatsappManager.getStatus(userId);
    const qr = whatsappManager.getQRCode(userId);
    
    res.json({ status, qr });
  } catch (error) {
    console.error('Error initializing:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/qr/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const qr = whatsappManager.getQRCode(userId);
    res.json({ qr: qr || null });
  } catch (error) {
    console.error('Error getting QR:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/groups/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const groups = await whatsappManager.getGroups(userId);
    res.json({ groups });
  } catch (error) {
    console.error('Error getting groups:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/logout/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await whatsappManager.logout(userId);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 WhatsApp Service v2.0.0 - ObraManager');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://0.0.0.0:${PORT}`);
  console.log(`🔗 Backend URL: ${process.env.BACKEND_URL || 'Not configured'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60));
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  await whatsappManager.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  await whatsappManager.destroy();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});