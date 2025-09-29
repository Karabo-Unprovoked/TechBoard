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
    window.print();
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
        <div
          ref={labelRef}
          className="w-80 h-96 mx-auto bg-white border-2 border-gray-300 p-6 flex flex-col"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <img 
              src="/Untitled-CG.png" 
              alt="Guardian Assist Logo" 
              className="w-12 h-12 mx-auto mb-2"
            />
            <h1 className="text-lg font-bold" style={{ color: SECONDARY }}>
              Guardian Assist
            </h1>
            <p className="text-xs text-gray-600">Computer Repair Service</p>
          </div>

          {/* Ticket Number */}
          <div className="text-center mb-4">
            <div 
              className="text-2xl font-bold px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: PRIMARY }}
            >
              {ticket.ticket_number}
            </div>
          </div>

          {/* QR Code */}
          {qrCode && (
            <div className="text-center mb-4">
              <img src={qrCode} alt="QR Code" className="mx-auto" width="80" height="80" />
            </div>
          )}

          {/* Device Info */}
          <div className="flex-1 space-y-2 text-sm">
            <div>
              <span className="font-medium">Device:</span>
              <span className="ml-2">{ticket.device_type}</span>
            </div>
            {(ticket.brand || ticket.model) && (
              <div>
                <span className="font-medium">Model:</span>
                <span className="ml-2">{[ticket.brand, ticket.model].filter(Boolean).join(' ')}</span>
              </div>
            )}
            {ticket.serial_number && (
              <div>
                <span className="font-medium">Serial:</span>
                <span className="ml-2 text-xs">{ticket.serial_number}</span>
              </div>
            )}
            <div>
              <span className="font-medium">Status:</span>
              <span className="ml-2 capitalize">{ticket.status.replace('-', ' ')}</span>
            </div>
            <div>
              <span className="font-medium">Date:</span>
              <span className="ml-2">{new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-4">
            <p>Track your repair at</p>
            <p className="font-medium">guardianassist.co.za</p>
            <p>+27 86 120 3203</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Label Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Attach this label securely to the device</li>
          <li>• Keep the QR code visible and unobstructed</li>
          <li>• Use the ticket number for tracking and reference</li>
          <li>• Store the device in a safe location</li>
        </ul>
      </div>
    </div>
  );
};