// backend/services/export.service.js
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, AlignmentType, UnderlineType } = require('docx');

class ExportService {
    
    static async exportPDF(data, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    info: {
                        Title: options.title || 'Rapport de calcul',
                        Author: 'ERP SaaS'
                    }
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));

                // En-tête
                doc.fontSize(20)
                   .font('Helvetica-Bold')
                   .text('RAPPORT DE CALCUL', { align: 'center' })
                   .moveDown();

                doc.fontSize(12)
                   .font('Helvetica')
                   .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' })
                   .moveDown();

                doc.fontSize(11)
                   .font('Helvetica')
                   .text(options.type === 'detaille' ? 'Rapport détaillé' : 'Rapport ', { align: 'center' })
                   .moveDown();

                doc.moveTo(50, 140)
                   .lineTo(545, 140)
                   .stroke();

                let y = 160;
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .text('Informations générales', 50, y);
                y += 25;

                doc.fontSize(11)
                   .font('Helvetica')
                   .text(`Montant de base: ${data.montant || 0} DT`, 50, y);
                y += 18;

                if (data.taux !== undefined && data.taux !== null) {
                    doc.text(`Taux appliqué: ${data.taux}%`, 50, y);
                    y += 18;
                }

                if (data.nbJours) {
                    doc.text(`Nombre de jours: ${data.nbJours}`, 50, y);
                    y += 18;
                }

                y += 10;
                const hasDetails = data.details && 
                                   Array.isArray(data.details) && 
                                   data.details.length > 0;

                if (options.type === 'detaille' && hasDetails) {
        
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .text('Détail par période', 50, y);
                    y += 20;

                    const headers = ['Période', 'Début', 'Fin', 'Jours', 'Taux', 'Résultat'];
                    const colWidths = [60, 70, 70, 50, 60, 80];
                    let x = 50;

                    doc.fontSize(10)
                       .font('Helvetica-Bold')
                       .fillColor('#1E293B');

                    headers.forEach((h, i) => {
                        doc.text(h, x, y, { width: colWidths[i], align: 'left' });
                        x += colWidths[i];
                    });

                    y += 20;
                    doc.fillColor('#94A3B8')
                       .moveTo(50, y)
                       .lineTo(545, y)
                       .stroke();

                    y += 8;

                    data.details.forEach((d, index) => {
                        x = 50;
                        doc.fontSize(10)
                           .font('Helvetica')
                           .fillColor('#0F172A');

                        const rowData = [
                            `#${index + 1}`,
                            d.date_debut || d.date_debut_raw || '',
                            d.date_fin || d.date_fin_raw || '',
                            String(d.nbJours || 0),
                            `${d.taux || 0}%`,
                            `${d.resultat || 0} DT`
                        ];

                        rowData.forEach((value, i) => {
                            doc.text(String(value), x, y, { width: colWidths[i], align: 'left' });
                            x += colWidths[i];
                        });

                        y += 18;
                    });

                    y += 10;
                    doc.moveTo(50, y)
                       .lineTo(545, y)
                       .stroke();

                    y += 20;
                    doc.fontSize(14)
                       .font('Helvetica-Bold')
                       .fillColor('#0EA5E9')
                       .text(`Total: ${data.total || data.resultat || 0} DT`, 420, y);
                } else {
                    y += 40;
                    doc.fontSize(16)
                       .font('Helvetica-Bold')
                       .fillColor('#0EA5E9')
                       .text(`Résultat final: ${data.resultat || 0} DT`, 50, y);
                }

                doc.end();

            } catch (err) {
                console.error(' Erreur PDF:', err);
                reject(err);
            }
        });
    }

  
    static async exportWord(data, options = {}) {
        try {
            console.log(' Début export Word...');

            // Données sécurisées
            const montant = data.montant || 0;
            const taux = data.taux || 0;
            const resultat = data.resultat || 0;
            const nbJours = data.nbJours || 0;
            const typeRapport = options.type || 'simplifie';

            console.log(`Montant: ${montant}, Taux: ${taux}, Résultat: ${resultat}, Type: ${typeRapport}`);

            // Créer un document simple
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        // Titre principal
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'RAPPORT DE CALCUL',
                                    size: 36,
                                    bold: true,
                                    font: 'Arial'
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 }
                        }),
                        // Date
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Date: ${new Date().toLocaleDateString('fr-FR')}`,
                                    size: 24,
                                    font: 'Arial'
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 }
                        }),
                        // Type de rapport
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: typeRapport === 'detaille' ? 'Rapport détaillé' : 'Rapport simplifié',
                                    size: 20,
                                    font: 'Arial'
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 }
                        }),
                        
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: '──────────────────────────────────',
                                    size: 15,
                                    font: 'Arial'
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 }
                        }),
                        // Informations générales
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'INFORMATIONS GÉNÉRALES',
                                    size: 20,
                                    bold: true,
                                    font: 'Arial'
                                })
                            ],
                            spacing: { after: 150 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Montant de base: ${montant} DT`,
                                    size: 20,
                                    font: 'Arial'
                                })
                            ],
                            spacing: { after: 100 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Taux appliqué: ${taux}%`,
                                    size: 20,
                                    font: 'Arial'
                                })
                            ],
                            spacing: { after: 100 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Nombre de jours: ${nbJours}`,
                                    size: 20,
                                    font: 'Arial'
                                })
                            ],
                            spacing: { after: 200 }
                        }),
                        // Résultat SOULIGNÉ SANS GRAS
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'RÉSULTAT FINAL: ',
                                    size: 24,
                                    bold: true,
                                    font: 'Arial'
                                }),
                                new TextRun({
                                    text: `${resultat} DT`,
                                    size: 24,
                                    bold: false,        // ← PAS GRAS
                                    underline: {
                                        type: UnderlineType.SINGLE  // ← SOULIGNÉ
                                    },
                                    font: 'Arial'
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 300 }
                        })
                    ]
                }]
            });

            console.log(' Génération du buffer Word...');
            const buffer = await Packer.toBuffer(doc);
            console.log(' Word généré, taille:', buffer.length);
            return buffer;

        } catch (err) {
            console.error(' Erreur export Word:', err);
            console.error('Stack:', err.stack);
            throw err;
        }
    }
}

module.exports = ExportService;