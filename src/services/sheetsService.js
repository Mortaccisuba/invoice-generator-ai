const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Nota: Esta es una versión simplificada. Para producción, usa OAuth2 o Service Account
async function saveToSheets(documentData) {
  try {
    // Por ahora, solo registramos en consola
    console.log('📋 Registrando en Google Sheets:', {
      date: documentData.date,
      type: documentData.type,
      client: documentData.client.name,
      total: documentData.total
    });

    // TODO: Implementar Google Sheets API con autenticación adecuada
    // Para ahora, guardar en archivo local como backup
    const fs = require('fs');
    const path = require('path');
    
    const logFile = path.join(__dirname, '../../data/transactions.json');
    if (!fs.existsSync(path.dirname(logFile))) {
      fs.mkdirSync(path.dirname(logFile), { recursive: true });
    }

    let transactions = [];
    if (fs.existsSync(logFile)) {
      transactions = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    }

    transactions.push({
      date: documentData.date,
      type: documentData.type,
      client: documentData.client.name,
      total: documentData.total,
      timestamp: new Date().toISOString()
    });

    fs.writeFileSync(logFile, JSON.stringify(transactions, null, 2));

  } catch (error) {
    console.error('Error al guardar en Sheets:', error.message);
  }
}

module.exports = { saveToSheets };
