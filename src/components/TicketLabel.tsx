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
        width: 128,
        margin: 1,
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !labelRef.current) return;

    const labelHtml = labelRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${ticket.ticket_number}</title>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            @page {
              size: 102mm 152mm;
              margin: 0;
            }

            @media print {
              body {
                margin: 0;
                padding: 0;
                width: 102mm;
                height: 152mm;
              }

              .label-container {
                width: 102mm !important;
                height: 152mm !important;
                padding: 8mm !important;
                font-family: 'Montserrat', Arial, sans-serif;
                background: white;
                display: flex;
                flex-direction: column;
                page-break-after: avoid;
              }

              .label-header {
                text-align: center;
                margin-bottom: 6mm;
              }

              .label-header img {
                width: 20mm;
                height: 20mm;
                margin: 0 auto 3mm;
                display: block;
              }

              .label-header h1 {
                font-size: 18pt;
                font-weight: 700;
                color: #000;
                margin-bottom: 1mm;
              }

              .label-header p {
                font-size: 10pt;
                color: #333;
              }

              .ticket-number {
                text-align: center;
                margin-bottom: 6mm;
              }

              .ticket-number-box {
                font-size: 24pt;
                font-weight: 700;
                padding: 4mm 6mm;
                border: 3px solid #000;
                border-radius: 4mm;
                background: #000;
                color: #fff;
                display: inline-block;
              }

              .qr-code {
                text-align: center;
                margin-bottom: 6mm;
              }

              .qr-code img {
                width: 35mm;
                height: 35mm;
              }

              .device-info {
                font-size: 11pt;
                line-height: 1.6;
                margin-bottom: 6mm;
              }

              .device-info > div {
                margin-bottom: 2mm;
                word-wrap: break-word;
              }

              .device-info .label {
                font-weight: 600;
                color: #000;
              }

              .device-info .value {
                color: #333;
              }

              .label-footer {
                text-align: center;
                font-size: 9pt;
                color: #333;
                margin-top: auto;
                padding-top: 4mm;
                border-top: 2px solid #000;
              }

              .label-footer p {
                margin-bottom: 1mm;
              }

              .label-footer .website {
                font-weight: 600;
                font-size: 10pt;
              }
            }

            @media screen {
              body {
                background: #f0f0f0;
                padding: 20px;
              }

              .label-container {
                width: 102mm;
                height: 152mm;
                margin: 0 auto;
                background: white;
                padding: 8mm;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                font-family: 'Montserrat', Arial, sans-serif;
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
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150] // Label size
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 100, 150);
      pdf.save(`${ticket.ticket_number}-label.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const [qrCode, setQrCode] = React.useState('');

  React.useEffect(() => {
    generateQRCode(ticket.ticket_number).then(setQrCode);
  }, [ticket.ticket_number]);

  const PRIMARY = '#ffb400';
  const SECONDARY = '#5d5d5d';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
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

      {/* Label Preview */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="mx-auto" style={{ width: '102mm', height: '152mm', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div
            ref={labelRef}
            className="flex flex-col"
            style={{
              width: '102mm',
              height: '152mm',
              padding: '8mm',
              fontFamily: 'Montserrat, sans-serif',
              background: 'white'
            }}
          >
            {/* Header */}
            <div className="label-header" style={{ textAlign: 'center', marginBottom: '6mm' }}>
              <img
                src="/Logo.png"
                alt="Guardian Assist Logo"
                style={{ width: '20mm', height: '20mm', margin: '0 auto 3mm', display: 'block' }}
              />
              <h1 style={{ fontSize: '18pt', fontWeight: 700, color: '#000', marginBottom: '1mm' }}>
                Guardian Assist
              </h1>
              <p style={{ fontSize: '10pt', color: '#333' }}>Computer Repair Service</p>
            </div>

            {/* Ticket Number */}
            <div className="ticket-number" style={{ textAlign: 'center', marginBottom: '6mm' }}>
              <div
                className="ticket-number-box"
                style={{
                  fontSize: '24pt',
                  fontWeight: 700,
                  padding: '4mm 6mm',
                  border: '3px solid #000',
                  borderRadius: '4mm',
                  background: '#000',
                  color: '#fff',
                  display: 'inline-block'
                }}
              >
                {ticket.ticket_number}
              </div>
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="qr-code" style={{ textAlign: 'center', marginBottom: '6mm' }}>
                <img src={qrCode} alt="QR Code" style={{ width: '35mm', height: '35mm' }} />
              </div>
            )}

            {/* Device Info */}
            <div className="device-info" style={{ fontSize: '11pt', lineHeight: 1.6, marginBottom: '6mm' }}>
              <div style={{ marginBottom: '2mm' }}>
                <span className="label" style={{ fontWeight: 600, color: '#000' }}>Device:</span>
                <span className="value" style={{ color: '#333', marginLeft: '4mm' }}>{ticket.device_type}</span>
              </div>
              {(ticket.brand || ticket.model) && (
                <div style={{ marginBottom: '2mm' }}>
                  <span className="label" style={{ fontWeight: 600, color: '#000' }}>Model:</span>
                  <span className="value" style={{ color: '#333', marginLeft: '4mm' }}>{[ticket.brand, ticket.model].filter(Boolean).join(' ')}</span>
                </div>
              )}
              {ticket.serial_number && (
                <div style={{ marginBottom: '2mm' }}>
                  <span className="label" style={{ fontWeight: 600, color: '#000' }}>Serial:</span>
                  <span className="value" style={{ color: '#333', marginLeft: '4mm', fontSize: '9pt' }}>{ticket.serial_number}</span>
                </div>
              )}
              <div style={{ marginBottom: '2mm' }}>
                <span className="label" style={{ fontWeight: 600, color: '#000' }}>Status:</span>
                <span className="value" style={{ color: '#333', marginLeft: '4mm', textTransform: 'capitalize' }}>{ticket.status.replace('-', ' ')}</span>
              </div>
              <div style={{ marginBottom: '2mm' }}>
                <span className="label" style={{ fontWeight: 600, color: '#000' }}>Date:</span>
                <span className="value" style={{ color: '#333', marginLeft: '4mm' }}>{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              {ticket.device_accessories && ticket.device_accessories.length > 0 && (
                <div style={{ marginBottom: '2mm' }}>
                  <span className="label" style={{ fontWeight: 600, color: '#000' }}>Includes:</span>
                  <div style={{ color: '#333', marginLeft: '4mm', fontSize: '9pt', marginTop: '1mm' }}>
                    {ticket.device_accessories.join(', ')}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="label-footer" style={{ textAlign: 'center', fontSize: '9pt', color: '#333', marginTop: 'auto', paddingTop: '4mm', borderTop: '2px solid #000' }}>
              <p style={{ marginBottom: '1mm' }}>Track your repair at</p>
              <p className="website" style={{ fontWeight: 600, fontSize: '10pt', marginBottom: '1mm' }}>guardianassist.co.za</p>
              <p>+27 86 120 3203</p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Brother TD-4100N Printing Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Label size: 4" x 6" (102mm x 152mm)</li>
          <li>• Ensure printer is set to "Continuous Length" mode</li>
          <li>• Select "Brother TD-4100N" as your printer</li>
          <li>• Paper size should be set to 102mm x 152mm</li>
          <li>• Print using "Actual Size" (no scaling)</li>
          <li>• Attach label securely to device with QR code visible</li>
        </ul>
      </div>
    </div>
  );
};