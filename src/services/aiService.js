const axios = require('axios');

const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
const OPEN_ROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const COMPANY_DATA = {
  name: 'SISTEMAS & SEGURIDAD ELECTRÓNICA',
  ruc: 'FAC-2826-0403',
  phone: '3155419774',
  address: 'Carrera 17 # 33-27, Barrio Floresta',
  city: 'Cali',
  country: 'Colombia'
};

async function processMessage(userMessage) {
  try {
    const prompt = `
Analiza este mensaje y extrae la información para generar un documento (Factura, Cuenta de Cobro o Cotización).

Mensaje del usuario: "${userMessage}"

Debes retornar un JSON con esta estructura exacta:
{
  "type": "Factura de Venta" | "Cuenta de Cobro" | "Cotización",
  "client": {
    "name": "nombre del cliente",
    "phone": "teléfono si está disponible",
    "email": "correo si está disponible",
    "address": "dirección si está disponible"
  },
  "items": [
    {
      "description": "descripción del producto/servicio",
      "quantity": número,
      "unitPrice": número,
      "total": número
    }
  ],
  "total": número total,
  "discount": número (0 si no hay),
  "notes": "observaciones o garantía si la hay"
}

Si no está claro el tipo de documento, asume que es Factura de Venta.
Si falta información, usa valores por defecto razonables.
Retorna SOLO el JSON, sin explicaciones adicionales.
`;

    const response = await axios.post(OPEN_ROUTER_URL, {
      model: 'claude-3.5-sonnet',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${OPEN_ROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content;
    const documentData = JSON.parse(content);
    
    // Agregar datos de la empresa
    documentData.company = COMPANY_DATA;
    documentData.date = new Date().toLocaleDateString('es-CO');
    
    return documentData;

  } catch (error) {
    console.error('Error en IA:', error.response?.data || error.message);
    throw new Error('No pude procesar tu solicitud. Intenta con más detalles.');
  }
}

module.exports = { processMessage, COMPANY_DATA };
