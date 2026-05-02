import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class TicketsService {
  private formatDate(value: string | Date) {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  }

  async generateTicketPDF(booking: any, event: any, user: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 48, left: 48, right: 48, bottom: 48 },
        });
        const ticketsDir = join(process.cwd(), 'uploads', 'tickets');
        
        if (!fs.existsSync(ticketsDir)) {
          fs.mkdirSync(ticketsDir, { recursive: true });
        }

        const fileName = `ticket-${booking.id}.pdf`;
        const filePath = join(ticketsDir, fileName);
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        const pageWidth = doc.page.width;
        const contentWidth = pageWidth - doc.page.margins.left - doc.page.margins.right;
        const sectionGap = 20;
        const cardPadding = 16;

        doc.rect(0, 0, pageWidth, 112).fill('#0d5c63');
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text('Eventify', doc.page.margins.left, 28);
        doc.fontSize(28).font('Helvetica-Bold').text('Event Ticket', doc.page.margins.left, 44, {
          width: contentWidth,
          align: 'left',
        });

        doc.y = 132;
        doc.fillColor('#172426');
        doc.fontSize(10).font('Helvetica-Bold').text('EVENT', doc.page.margins.left, doc.y);
        doc.moveDown(0.3);
        doc.fontSize(20).font('Helvetica-Bold').text(event.title || 'Untitled event', {
          width: contentWidth,
        });
        doc.moveDown(0.8);

        const infoTop = doc.y;
        const colWidth = (contentWidth - 24) / 2;

        doc.roundedRect(doc.page.margins.left, infoTop, colWidth, 110, 10).fill('#f3f8f8');
        doc.roundedRect(doc.page.margins.left + colWidth + 24, infoTop, colWidth, 110, 10).fill('#f3f8f8');

        doc.fillColor('#5f6f72').fontSize(9).font('Helvetica-Bold');
        doc.text('DATE & TIME', doc.page.margins.left + cardPadding, infoTop + 14);
        doc.text('LOCATION', doc.page.margins.left + cardPadding, infoTop + 64);
        doc.text('ATTENDEE', doc.page.margins.left + colWidth + 24 + cardPadding, infoTop + 14);
        doc.text('EMAIL', doc.page.margins.left + colWidth + 24 + cardPadding, infoTop + 64);

        doc.fillColor('#172426').fontSize(11).font('Helvetica');
        doc.text(this.formatDate(event.date), doc.page.margins.left + cardPadding, infoTop + 28, {
          width: colWidth - cardPadding * 2,
        });
        doc.text(event.location || '-', doc.page.margins.left + cardPadding, infoTop + 78, {
          width: colWidth - cardPadding * 2,
        });
        doc.text(user.name || '-', doc.page.margins.left + colWidth + 24 + cardPadding, infoTop + 28, {
          width: colWidth - cardPadding * 2,
        });
        doc.text(user.email || '-', doc.page.margins.left + colWidth + 24 + cardPadding, infoTop + 78, {
          width: colWidth - cardPadding * 2,
        });

        doc.y = infoTop + 130 + sectionGap;

        doc.roundedRect(doc.page.margins.left, doc.y, contentWidth, 96, 10).strokeColor('#d8e6e7').lineWidth(1).stroke();
        doc.fillColor('#5f6f72').fontSize(9).font('Helvetica-Bold')
          .text('BOOKING REFERENCE', doc.page.margins.left + cardPadding, doc.y + 14)
          .text('TICKET STATUS', doc.page.margins.left + cardPadding, doc.y + 52);

        doc.fillColor('#172426').fontSize(11).font('Helvetica')
          .text(booking.id, doc.page.margins.left + cardPadding, doc.y + 28, { width: contentWidth - cardPadding * 2 })
          .text(booking.status || 'CONFIRMED', doc.page.margins.left + cardPadding, doc.y + 66, { width: contentWidth - cardPadding * 2 });

        doc.fillColor('#5f6f72').fontSize(9).font('Helvetica')
          .text('Present this ticket at check-in. Keep your booking reference for support.', doc.page.margins.left, doc.page.height - 64, {
            width: contentWidth,
            align: 'center',
          });

        doc.end();

        stream.on('finish', () => {
          resolve(`/uploads/tickets/${fileName}`);
        });

        stream.on('error', (err) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
