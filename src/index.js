require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { processMessage } = require('./services/aiService');
const { generatePDF } = require('./services/pdfService');
const { saveToSheets } = require('./services/sheetsService');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const PORT = process.env.PORT || 3000;

// Mensajes de inicio
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `¡Hola! 👋 Bienvenido a *Generador de Facturas IA*\n\nPuedo ayudarte a generar:\n📄 Facturas de Venta\n💳 Cuentas de Cobro\n📋 Cotizaciones\n\n*¿Cómo funciono?*\n1. Envía un mensaje con los detalles (cliente, items, precios)\n2. Puedes usar texto o voz 🎤\n3. Yo genero el PDF y te lo envío aquí\n\n*Ejemplo:*\n"Factura para Valentina, Kit de DVR de 4 canales $100.000, Disco duro de 500 GB $50.000"\n\n¿Qué necesitas hoy?`, {
    parse_mode: 'Markdown'
  });
});

// Procesar mensajes de texto
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text && !text.startsWith('/')) {
    try {
      bot.sendMessage(chatId, '⏳ Procesando tu solicitud...');

      // Procesar con IA
      const documentData = await processMessage(text);
      
      // Generar PDF
      const pdfPath = await generatePDF(documentData);
      
      // Guardar en Google Sheets
      await saveToSheets(documentData);
      
      // Enviar PDF por Telegram
      const fileStream = fs.createReadStream(pdfPath);
      await bot.sendDocument(chatId, fileStream, {
        caption: `✅ ${documentData.type} generada exitosamente\n💰 Total: $${documentData.total.toLocaleString('es-CO')}`
      });
      
      // Limpiar archivo temporal
      fs.unlinkSync(pdfPath);
      
    } catch (error) {
      console.error('Error:', error);
      bot.sendMessage(chatId, `❌ Error al procesar: ${error.message}`);
    }
  }
});

// Procesar mensajes de voz
bot.on('voice', async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    bot.sendMessage(chatId, '🎤 Transcribiendo audio...');
    
    // Descargar archivo de voz
    const file = await bot.getFile(msg.voice.file_id);
    const filePath = await bot.downloadFile(file.file_id, './downloads/');
    
    // Aquí irá la transcripción con Whisper
    bot.sendMessage(chatId, '🔄 Funcionalidad de voz en desarrollo...');
    
  } catch (error) {
    bot.sendMessage(chatId, `❌ Error al procesar voz: ${error.message}`);
  }
});

// Webhook (opcional para producción)
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', bot: 'running' });
});

app.listen(PORT, () => {
  console.log(`✅ Bot iniciado en puerto ${PORT}`);
  console.log(`📱 Bot: t.me/PDFFacturas_bot`);
});
