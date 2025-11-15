import React, { useRef } from 'react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { RepairTicket } from '../lib/supabase';

interface TicketLabelProps {
  ticket: RepairTicket;
  onBack: () => void;
}

export const TicketLabel: React.FC<TicketLabelProps> = ({ ticket, onBack }) => {
  const labelRef = useRef<HTMLDivElement>(null);

  const generateQRCode = async (text: string) => {
    try {
      return await QRCode.toDataURL(text, {
        width: 400,
        margin: 0,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const [qrCode, setQrCode] = React.useState('');

  React.useEffect(() => {
    const trackingUrl = `${window.location.origin}/#track-${ticket.ticket_number}`;
    generateQRCode(trackingUrl).then(setQrCode);
  }, [ticket.ticket_number]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !labelRef.current) return;

    const labelHtml = labelRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${ticket.ticket_number}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Poppins', sans-serif;
            }

            @page {
              size: 102mm 102mm;
              margin: 0;
            }

            @media print {
              body {
                margin: 0;
                padding: 0;
                width: 102mm;
                height: 102mm;
              }

              .label-container {
                width: 102mm !important;
                height: 102mm !important;
                padding: 0 !important;
                font-family: 'Poppins', sans-serif;
                background: white;
                display: flex;
                flex-direction: column;
                page-break-after: avoid;
              }
            }

            @media screen {
              body {
                background: #f0f0f0;
                padding: 20px;
              }

              .label-container {
                width: 102mm;
                height: 102mm;
                margin: 0 auto;
                background: white;
                padding: 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                font-family: 'Poppins', sans-serif;
                display: flex;
                flex-direction: column;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            ${labelHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 100);
              }, 250);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownload = async () => {
    if (!labelRef.current) return;

    try {
      const canvas = await html2canvas(labelRef.current, {
        scale: 3,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [102, 102]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 102, 102);
      pdf.save(`${ticket.ticket_number}-label.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const PRIMARY = '#ffb400';
  const customerName = ticket.customer
    ? `${ticket.customer.first_name || ''} ${ticket.customer.last_name || ticket.customer.name || ''}`.trim()
    : 'Customer';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Tickets</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
            style={{ backgroundColor: PRIMARY }}
          >
            <Printer size={16} />
            <span>Print Label</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="mx-auto" style={{ width: '102mm', height: '102mm', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div
            ref={labelRef}
            className="flex flex-col"
            style={{
              width: '102mm',
              height: '102mm',
              padding: '0',
              fontFamily: 'Poppins, sans-serif',
              background: 'white',
              position: 'relative'
            }}
          >
            <div style={{
              textAlign: 'center',
              paddingTop: '6mm',
              paddingBottom: '4mm'
            }}>
              <div style={{
                width: '22mm',
                height: '22mm',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src="/ticket logo.png"
                  alt="Logo"
                  style={{
                    width: '22mm',
                    height: '22mm',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </div>
            </div>

            <div style={{
              borderTop: '1.5px solid #000',
              padding: '1.5mm 0',
              marginLeft: '6mm',
              marginRight: '6mm',
              marginBottom: '4mm'
            }}>
              <div style={{
                fontSize: '12pt',
                fontWeight: 900,
                color: '#000',
                textAlign: 'center',
                letterSpacing: '-0.3px',
                lineHeight: 1
              }}>
                {ticket.ticket_number}
              </div>
            </div>

            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: '4mm'
            }}>
              {qrCode && (
                <img
                  src={qrCode}
                  alt="QR Code"
                  style={{
                    width: '30mm',
                    height: '30mm',
                    display: 'block'
                  }}
                />
              )}
            </div>

            <div style={{
              borderTop: '1.5px solid #000',
              padding: '2mm 0',
              marginLeft: '6mm',
              marginRight: '6mm',
              marginBottom: '6mm',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '13pt',
                fontWeight: 900,
                color: '#000',
                marginBottom: '0.5mm',
                lineHeight: 1.1
              }}>
                {customerName}
              </div>
              <div style={{
                fontSize: '10pt',
                fontWeight: 400,
                color: '#000',
                lineHeight: 1.1
              }}>
                {ticket.customer?.customer_number || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Brother TD-4100N Printing Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Label size: 4" x 4" (102mm x 102mm)</li>
          <li>• Black and white thermal print optimized</li>
          <li>• Ensure printer is set to correct paper size</li>
          <li>• Print using "Actual Size" (no scaling)</li>
          <li>• Attach label securely to device with QR code visible</li>
        </ul>
      </div>
    </div>
  );
};
