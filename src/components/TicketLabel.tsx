import React, { useRef } from 'react';
import { Download, ArrowLeft, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Customer, RepairTicket } from '../lib/supabase';

interface TicketLabelProps {
  ticket: RepairTicket & { customer: Customer };
  onBack: () => void;
  onNewTicket: () => void;
}

export const TicketLabel: React.FC<TicketLabelProps> = ({ ticket, onBack, onNewTicket }) => {
  const labelRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');

  React.useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrData = JSON.stringify({
          ticketNumber: ticket.ticket_number,
          customerId: ticket.customer_id,
          deviceType: ticket.device_type,
          brand: ticket.brand,
          model: ticket.model
        });
        
        const url = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [ticket]);

  const downloadLabel = async () => {
    if (!labelRef.current) return;

    try {
      const canvas = await html2canvas(labelRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        width: 400,
        height: 600
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150] // 4" x 6" label
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 100, 150);
      pdf.save(`${ticket.ticket_number}-label.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating label. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ticket Created Successfully</h1>
                <p className="text-gray-600">Print the label and attach it to the device</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadLabel}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                Download Label
              </button>
              <button
                onClick={onNewTicket}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                New Ticket
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ticket Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Ticket Number</p>
                  <p className="text-xl font-bold text-blue-900">{ticket.ticket_number}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Customer</p>
                    <p className="text-gray-900">{ticket.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Date Created</p>
                    <p className="text-gray-900">{formatDate(ticket.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Device Type</p>
                    <p className="text-gray-900">{ticket.device_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Status</p>
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      {ticket.status}
                    </span>
                  </div>
                </div>

                {(ticket.brand || ticket.model) && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Device Details</p>
                    <p className="text-gray-900">
                      {[ticket.brand, ticket.model].filter(Boolean).join(' ')}
                    </p>
                  </div>
                )}

                {ticket.serial_number && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Serial Number</p>
                    <p className="text-gray-900 font-mono text-sm">{ticket.serial_number}</p>
                  </div>
                )}

                {ticket.issue_description && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Issue Description</p>
                    <p className="text-gray-900">{ticket.issue_description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Printable Label */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Printable Label</h2>
              <div className="flex justify-center">
                <div
                  ref={labelRef}
                  className="bg-white border-2 border-gray-300 p-6 w-80 h-96 flex flex-col justify-between"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  {/* Header */}
                  <div className="text-center border-b border-gray-200 pb-3">
                    <h3 className="text-lg font-bold text-gray-900">Guardian Assist</h3>
                    <p className="text-sm text-gray-600">Computer Repair Service</p>
                  </div>

                  {/* Ticket Info */}
                  <div className="flex-1 py-4">
                    <div className="text-center mb-4">
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Ticket Number</p>
                      <p className="text-xl font-bold text-gray-900">{ticket.ticket_number}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Customer:</span>
                        <span className="ml-2 font-medium">{ticket.customer.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Device:</span>
                        <span className="ml-2 font-medium">{ticket.device_type}</span>
                      </div>
                      {(ticket.brand || ticket.model) && (
                        <div>
                          <span className="text-gray-600">Model:</span>
                          <span className="ml-2 font-medium">
                            {[ticket.brand, ticket.model].filter(Boolean).join(' ')}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 font-medium">{formatDate(ticket.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="text-center">
                    {qrCodeUrl ? (
                      <div>
                        <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 mx-auto mb-2" />
                        <p className="text-xs text-gray-600">Scan for details</p>
                      </div>
                    ) : (
                      <div className="w-20 h-20 mx-auto mb-2 bg-gray-100 rounded flex items-center justify-center">
                        <QrCode size={16} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};