// backend/services/export.service.js
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, AlignmentType, UnderlineType } = require('docx');
const signatureService = require('./signature.service');
const fs = require('fs');
const path = require('path');

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
                doc.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    const signature = signatureService.signBuffer(buffer);
                    
                    resolve({
                        buffer: buffer,
                        signature: signature
                    });
                });

                // En-tête avec logo
                doc.fontSize(20)
                   .font('Helvetica-Bold')
                   .fillColor('#0EA5E9')
                   .text('🏢 ERP', 50, 40, { align: 'center' })
                   .fontSize(16)
                   .fillColor('#0F172A')
                   .text(options.title || 'RAPPORT DE CALCUL', { align: 'center' })
                   .moveDown();

                doc.fontSize(10)
                   .font('Helvetica')
                   .fillColor('#64748B')
                   .text('Date: ' + new Date().toLocaleDateString('fr-FR'), { align: 'center' })
                   .moveDown();

                doc.moveTo(50, 120)
                   .lineTo(545, 120)
                   .strokeColor('#E2E8F0')
                   .stroke();

                let y = 150;
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .fillColor('#0F172A')
                   .text('Informations generales', 50, y);
                y += 25;

                doc.fontSize(11)
                   .font('Helvetica')
                   .fillColor('#475569')
                   .text('Montant de base: ' + (data.montant || 0) + ' DT', 50, y);
                y += 18;

                if (data.taux !== undefined && data.taux !== null) {
                    doc.text('Taux applique: ' + data.taux + '%', 50, y);
                    y += 18;
                }

                if (data.nbJours) {
                    doc.text('Nombre de jours: ' + data.nbJours, 50, y);
                    y += 18;
                }

                y += 10;
                const hasDetails = data.details && 
                                   Array.isArray(data.details) && 
                                   data.details.length > 0;

                if (options.type === 'detaille' && hasDetails) {
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .fillColor('#0F172A')
                       .text('Detail par periode', 50, y);
                    y += 20;

                    const headers = ['Periode', 'Debut', 'Fin', 'Jours', 'Taux', 'Resultat'];
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
                            '#' + (index + 1),
                            d.date_debut || d.date_debut_raw || '',
                            d.date_fin || d.date_fin_raw || '',
                            String(d.nbJours || 0),
                            (d.taux || 0) + '%',
                            (d.resultat || 0) + ' DT'
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
                       .text('Total: ' + (data.total || data.resultat || 0) + ' DT', 420, y);
                } else {
                    y += 40;
                    doc.fontSize(16)
                       .font('Helvetica-Bold')
                       .fillColor('#0EA5E9')
                       .text('Resultat final: ' + (data.resultat || 0) + ' DT', 50, y);
                }

                // Pied de page
                y = doc.page.height - 50;
                doc.fontSize(8)
                   .font('Helvetica')
                   .fillColor('#94A3B8')
                   .text('Document genere automatiquement par ERP SaaS', 50, y, { align: 'center' });
                
                if (signatureService.signBuffer) {
                    doc.text('Signe numeriquement', 50, y + 12, { align: 'center' });
                }

                doc.end();

            } catch (err) {
                console.error('Erreur PDF:', err);
                reject(err);
            }
        });
    }

    static async exportWord(data, options = {}) {
        try {
            const montant = data.montant || 0;
            const taux = data.taux || 0;
            const resultat = data.total || data.resultat || 0;
            const nbJours = data.nbJours || 0;
            const typeRapport = options.type || 'simplifie';

            const children = [];

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'RAPPORT DE CALCUL',
                            size: 36,
                            bold: true,
                            font: 'Arial',
                            color: '0EA5E9'
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                })
            );

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Date: ' + new Date().toLocaleDateString('fr-FR'),
                            size: 24,
                            font: 'Arial',
                            color: '64748B'
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                })
            );

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '----------------------------------------------------',
                            size: 15,
                            font: 'Arial',
                            color: 'E2E8F0'
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                })
            );

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'INFORMATIONS GENERALES',
                            size: 20,
                            bold: true,
                            font: 'Arial',
                            color: '0F172A'
                        })
                    ],
                    spacing: { after: 150 }
                })
            );

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Montant de base: ' + montant + ' DT',
                            size: 20,
                            font: 'Arial',
                            color: '475569'
                        })
                    ],
                    spacing: { after: 100 }
                })
            );

            if (taux > 0) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Taux applique: ' + taux + '%',
                                size: 20,
                                font: 'Arial',
                                color: '475569'
                            })
                        ],
                        spacing: { after: 100 }
                    })
                );
            }

            if (nbJours > 0) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Nombre de jours: ' + nbJours,
                                size: 20,
                                font: 'Arial',
                                color: '475569'
                            })
                        ],
                        spacing: { after: 200 }
                    })
                );
            }

            const hasDetails = data.details && 
                               Array.isArray(data.details) && 
                               data.details.length > 0;

            if (typeRapport === 'detaille' && hasDetails) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'DETAIL PAR PERIODE',
                                size: 20,
                                bold: true,
                                font: 'Arial',
                                color: '0F172A'
                            })
                        ],
                        spacing: { before: 200, after: 150 }
                    })
                );

                const headers = ['Periode', 'Debut', 'Fin', 'Jours', 'Taux', 'Resultat'];
                const headerRow = new Paragraph({
                    children: headers.map((h, i) => {
                        const isLast = i === headers.length - 1;
                        return new TextRun({
                            text: h + (isLast ? '' : ' | '),
                            size: 16,
                            bold: true,
                            font: 'Arial',
                            color: '1E293B'
                        });
                    }),
                    spacing: { after: 80 }
                });
                children.push(headerRow);

                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '----------+----------+----------+-------+-------+----------',
                                size: 14,
                                font: 'Arial',
                                color: '94A3B8'
                            })
                        ],
                        spacing: { after: 60 }
                    })
                );

                data.details.forEach((d, index) => {
                    const periodeNum = '#' + (index + 1);
                    const dateDebut = d.date_debut || d.date_debut_raw || '';
                    const dateFin = d.date_fin || d.date_fin_raw || '';
                    const nbJoursDetail = d.nbJours || 0;
                    const tauxDetail = d.taux || 0;
                    const resultatDetail = d.resultat || 0;

                    const row = new Paragraph({
                        children: [
                            new TextRun({
                                text: periodeNum.padEnd(10) + dateDebut.padEnd(10) + dateFin.padEnd(10) + String(nbJoursDetail).padEnd(7) + String(tauxDetail).padEnd(7) + resultatDetail + ' DT',
                                size: 14,
                                font: 'Arial',
                                color: '0F172A'
                            })
                        ],
                        spacing: { after: 60 }
                    });
                    children.push(row);
                });

                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '----------+----------+----------+-------+-------+----------',
                                size: 14,
                                font: 'Arial',
                                color: '94A3B8'
                            })
                        ],
                        spacing: { before: 60, after: 100 }
                    })
                );

                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'TOTAL : ' + resultat + ' DT',
                                size: 18,
                                bold: true,
                                font: 'Arial',
                                color: '0EA5E9'
                            })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 100 }
                    })
                );

            } else {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'RESULTAT FINAL: ',
                                size: 24,
                                bold: true,
                                font: 'Arial',
                                color: '0F172A'
                            }),
                            new TextRun({
                                text: resultat + ' DT',
                                size: 24,
                                bold: true,
                                font: 'Arial',
                                color: '0EA5E9'
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 300 }
                    })
                );
            }

            if (signatureService.signBuffer) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Document signe numeriquement',
                                size: 12,
                                font: 'Arial',
                                color: '94A3B8'
                            })
                        ],
                        spacing: { before: 100 },
                        alignment: AlignmentType.CENTER
                    })
                );
            }

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Genere le ' + new Date().toLocaleDateString('fr-FR') + ' a ' + new Date().toLocaleTimeString('fr-FR'),
                            size: 12,
                            font: 'Arial',
                            color: '94A3B8'
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 300 }
                })
            );

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: children
                }]
            });

            const buffer = await Packer.toBuffer(doc);
            const signature = signatureService.signBuffer(buffer);
            
            return {
                buffer: buffer,
                signature: signature
            };

        } catch (err) {
            console.error('Erreur export Word:', err);
            throw err;
        }
    }

    static signBuffer(buffer) {
        return signatureService.signBuffer(buffer);
    }

    static verifyBuffer(buffer, signature) {
        return signatureService.verifyBuffer(buffer, signature);
    }
}

module.exports = ExportService;