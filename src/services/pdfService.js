const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generatePDF(documentData) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `${documentData.type.replace(/ /g, '_')}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../../downloads', fileName);
      
      // Crear carpeta si no existe
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      const doc = new PDFDocument({ margin: 40 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Encabezado azul
      doc.rect(0, 0, doc.page.width, 100)
        .fill('#2C5AA0');

      // Nombre de la empresa (blanco)
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('white')
        .text(documentData.company.name, 50, 20);

      // Tipo de documento (derecha)
      doc.fontSize(14)
        .text(documentData.type.toUpperCase(), 0, 50, {
          width: doc.page.width - 80,
          align: 'right'
        });

      // RUC y fecha
      doc.fontSize(10)
        .text(`Nº Factura: ${documentData.company.ruc}`, 50, 55)
        .text(`Fecha de Emisión: ${documentData.date}`, 0, 55, {
          width: doc.page.width - 80,
          align: 'right'
        });

      // Espacio
      doc.y = 120;

      // Sección de cliente
      doc.fillColor('black')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('INFORMACIÓN DEL CLIENTE', 50, doc.y);

      doc.y += 20;
      doc.fontSize(10)
        .font('Helvetica')
        .text(`Cliente: ${documentData.client.name}`, 50)
        .text(`Teléfono: ${documentData.client.phone || 'N/A'}`, 50)
        .text(`Dirección: ${documentData.client.address || 'N/A'}`, 50);

      doc.y += 20;

      // Encabezado de tabla
      const tableTop = doc.y;
      const colWidth = (doc.page.width - 100) / 4;

      doc.rect(50, tableTop, doc.page.width - 100, 25)
        .fill('#2C5AA0');

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('white')
        .text('ITEM', 55, tableTop + 5, { width: colWidth - 10 })
        .text('DESCRIPCIÓN', 55 + colWidth, tableTop + 5, { width: colWidth - 10 })
        .text('CANT.', 55 + colWidth * 2, tableTop + 5, { width: colWidth / 2 })
        .text('V. UNITARIO', 55 + colWidth * 2.5, tableTop + 5, { width: colWidth / 2 })
        .text('V. TOTAL', 55 + colWidth * 3.5, tableTop + 5, { width: colWidth / 2 });

      // Items
      let currentY = tableTop + 30;
      documentData.items.forEach((item, index) => {
        doc.fontSize(9)
          .font('Helvetica')
          .fillColor('black')
          .text(String(index + 1), 55, currentY, { width: colWidth - 10 })
          .text(item.description, 55 + colWidth, currentY, { width: colWidth - 10 })
          .text(String(item.quantity), 55 + colWidth * 2, currentY, { width: colWidth / 2 })
          .text(`$${item.unitPrice.toLocaleString('es-CO')}`, 55 + colWidth * 2.5, currentY, { width: colWidth / 2 })
          .text(`$${item.total.toLocaleString('es-CO')}`, 55 + colWidth * 3.5, currentY, { width: colWidth / 2 });

        currentY += 20;
      });

      // Línea separadora
      doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).stroke();
      currentY += 15;

      // Totales
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('Valor Total Facturado:', 0, currentY, {
          width: doc.page.width - 100,
          align: 'right'
        })
        .text(`$${documentData.total.toLocaleString('es-CO')}`, 0, currentY + 15, {
          width: doc.page.width - 100,
          align: 'right'
        });

      if (documentData.discount && documentData.discount > 0) {
        doc.text(`Descuento: $${documentData.discount.toLocaleString('es-CO')}`, 0, currentY + 30, {
          width: doc.page.width - 100,
          align: 'right'
        });
      }

      // Observaciones
      if (documentData.notes) {
        doc.y += 50;
        doc.fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#D9534F')
          .text('OBSERVACIONES Y GARANTÍA', 50, doc.y);
        
        doc.fontSize(9)
          .font('Helvetica')
          .fillColor('black')
          .text(documentData.notes, 50, doc.y + 20, { width: doc.page.width - 100 });
      }

      // Pie de página
      doc.fontSize(8)
        .text(`${documentData.company.address} - ${documentData.company.city} - ${documentData.company.country}`, {
          align: 'center'
        }, doc.page.height - 30);

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePDF };
