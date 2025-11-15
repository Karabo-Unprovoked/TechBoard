import React, { useRef } from 'react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { RepairTicket } from '../lib/supabase';

interface TicketLabelProps {
  ticket: RepairTicket;
  onBack: () => void;
}

export const TicketLabel: React.FC<TicketLabelProps> = ({ ticket, onBack }) => {
  const labelRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);

  const generateQRCode = async (text: string) => {
    try {
      return await QRCode.toDataURL(text, {
        width: 200,
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

  const [qrCode, setQrCode] = React.useState('');

  React.useEffect(() => {
    const trackingUrl = `${window.location.origin}/#track-${ticket.ticket_number}`;
    generateQRCode(trackingUrl).then(setQrCode);

    if (barcodeRef.current && ticket.serial_number) {
      try {
        JsBarcode(barcodeRef.current, ticket.serial_number, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 5
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [ticket.ticket_number, ticket.serial_number]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !labelRef.current) return;

    const labelHtml = labelRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${ticket.ticket_number}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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
                padding: 5mm !important;
                font-family: 'Inter', Arial, sans-serif;
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
                height: 152mm;
                margin: 0 auto;
                background: white;
                padding: 5mm;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                font-family: 'Inter', Arial, sans-serif;
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
        format: [102, 152]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 102, 152);
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
              padding: '5mm',
              fontFamily: 'Inter, Arial, sans-serif',
              background: 'white'
            }}
          >
            {/* Header Section with Logo and Ticket Number */}
            <div style={{
              background: '#2c3e50',
              padding: '3mm',
              borderRadius: '2mm',
              marginBottom: '3mm',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                width: '15mm',
                height: '15mm',
                background: 'white',
                borderRadius: '2mm',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img
                  src="/Logo.png"
                  alt="Logo"
                  style={{ width: '13mm', height: '13mm', objectFit: 'contain' }}
                />
              </div>
              <div style={{ textAlign: 'right', color: 'white' }}>
                <div style={{ fontSize: '20pt', fontWeight: 700, letterSpacing: '0.5px' }}>
                  {ticket.ticket_number}
                </div>
                <div style={{ fontSize: '8pt', marginTop: '1mm', opacity: 0.9 }}>
                  {new Date(ticket.created_at).toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>

            {/* Device Information */}
            <div style={{
              background: '#34495e',
              padding: '3mm',
              borderRadius: '2mm',
              marginBottom: '3mm',
              textAlign: 'center'
            }}>
              <div style={{ color: 'white', fontSize: '14pt', fontWeight: 600 }}>
                {ticket.brand ? `${ticket.brand} ${ticket.model || ''}` : ticket.device_type}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10pt', marginTop: '1mm' }}>
                {ticket.issue_description || 'Screen Repair'}
              </div>
            </div>

            {/* Customer Information Box */}
            <div style={{
              border: '2px solid #34495e',
              borderRadius: '2mm',
              padding: '3mm',
              marginBottom: '3mm',
              background: '#ecf0f1'
            }}>
              <div style={{ fontSize: '14pt', fontWeight: 600, color: '#2c3e50', marginBottom: '1mm' }}>
                {customerName}
              </div>
              <div style={{ fontSize: '11pt', color: '#34495e' }}>
                {ticket.customer?.customer_number || 'N/A'}
              </div>
            </div>

            {/* Barcode Section */}
            {ticket.serial_number && (
              <div style={{
                textAlign: 'center',
                marginBottom: '3mm',
                padding: '2mm',
                background: 'white',
                borderRadius: '2mm'
              }}>
                <svg ref={barcodeRef}></svg>
              </div>
            )}

            {/* QR Code Section */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              {qrCode && (
                <>
                  <img
                    src={qrCode}
                    alt="QR Code"
                    style={{
                      width: '45mm',
                      height: '45mm',
                      border: '3px solid #2c3e50',
                      borderRadius: '2mm',
                      padding: '2mm',
                      background: 'white'
                    }}
                  />
                  <div style={{
                    marginTop: '2mm',
                    fontSize: '9pt',
                    color: '#34495e',
                    textAlign: 'center',
                    fontWeight: 500
                  }}>
                    Scan to track repair status
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{
              textAlign: 'center',
              paddingTop: '3mm',
              borderTop: '2px solid #2c3e50',
              fontSize: '9pt',
              color: '#34495e'
            }}>
              <div style={{ fontWeight: 600, fontSize: '10pt', marginBottom: '1mm' }}>
                guardianassist.co.za
              </div>
              <div>+27 86 120 3203</div>
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
