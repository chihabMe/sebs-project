import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class TicketsService {
  async generateTicketPDF(booking: any, event: any, user: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const ticketsDir = join(process.cwd(), 'uploads', 'tickets');
        
        if (!fs.existsSync(ticketsDir)) {
          fs.mkdirSync(ticketsDir, { recursive: true });
        }

        const fileName = `ticket-${booking.id}.pdf`;
        const filePath = join(ticketsDir, fileName);
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Add content
        doc.fontSize(25).text('Event Ticket', { align: 'center' });
        doc.moveDown();
        doc.fontSize(18).text(`Event: ${event.title}`);
        doc.fontSize(14).text(`Date: ${new Date(event.date).toLocaleDateString()}`);
        doc.text(`Location: ${event.location}`);
        doc.moveDown();
        doc.text(`Attendee: ${user.name}`);
        doc.text(`Email: ${user.email}`);
        doc.moveDown();
        doc.fillColor('grey').fontSize(12).text(`Booking ID: ${booking.id}`);

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
