import React from 'react';
import type { Customer, RepairTicket } from '../lib/supabase';

interface CustomerPrintViewProps {
  customer: Customer;
  tickets: RepairTicket[];
  onClose: () => void;
}

const PRIMARY = '#ffb400';
const SECONDARY = '#5d5d5d';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateShort = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatusLabel = (status: string) => {
  return status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getStatusStyle = (status: string): string => {
  const styles: Record<string, string> = {
    'received': 'background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;',
    'in-progress': 'background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;',
    'completed': 'background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7;',
    'waiting-parts': 'background: #ffedd5; color: #9a3412; border: 1px solid #fdba74;',
    'unrepairable': 'background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;',
    'pending-customer-action': 'background: #fef9c3; color: #854d0e; border: 1px solid #fde047;',
    'pending': 'background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;',
    'invoiced': 'background: #ffedd5; color: #9a3412; border: 1px solid #fdba74;',
    'void': 'background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;',
  };
  return styles[status] || 'background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;';
};

function buildPrintHtml(customer: Customer, tickets: RepairTicket[]): string {
  const completedCount = tickets.filter(t => t.status === 'completed').length;
  const activeCount = tickets.filter(t => !['completed', 'void', 'unrepairable'].includes(t.status)).length;

  const fullAddress = [
    customer.street_address,
    customer.address_line_2,
    customer.city,
    customer.province,
    customer.postal_code,
    customer.country
  ].filter(Boolean).join(', ');

  const ticketsHtml = tickets.map((ticket, idx) => {
    const imagesHtml = ticket.device_images && ticket.device_images.length > 0
      ? `
        <div style="margin-top: 12px;">
          <div style="font-size: 11px; font-weight: 600; color: ${SECONDARY}; margin-bottom: 8px;">Device Images (captured ${formatDateShort(ticket.created_at)})</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${ticket.device_images.map(img => `
              <img src="${img}"
                style="width: 140px; height: 105px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb;"
                onerror="this.style.display='none'"
                crossorigin="anonymous"
              />
            `).join('')}
          </div>
        </div>
      `
      : '';

    const accessoriesHtml = ticket.device_accessories && ticket.device_accessories.length > 0
      ? `
        <tr>
          <td style="padding: 6px 12px; font-size: 11px; font-weight: 600; color: #6b7280; white-space: nowrap; vertical-align: top;">Accessories</td>
          <td style="padding: 6px 12px; font-size: 11px; color: #111827;">
            ${ticket.device_accessories.map(a => `<span style="display: inline-block; padding: 2px 8px; background: #f3f4f6; border-radius: 4px; margin: 2px 4px 2px 0; font-size: 10px;">${a}</span>`).join('')}
          </td>
        </tr>
      `
      : '';

    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 16px; overflow: hidden; page-break-inside: avoid;">
        <div style="background: ${idx % 2 === 0 ? '#fafafa' : '#f5f5f5'}; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 13px; font-weight: 700; color: ${SECONDARY};">${ticket.ticket_number}</span>
            <span style="padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; ${getStatusStyle(ticket.status)}">${getStatusLabel(ticket.status)}</span>
            ${ticket.priority ? `<span style="font-size: 10px; font-weight: 600; color: ${ticket.priority === 'high' || ticket.priority === 'urgent' ? '#dc2626' : '#6b7280'};">${ticket.priority.toUpperCase()}</span>` : ''}
          </div>
          <span style="font-size: 10px; color: #9ca3af;">${formatDate(ticket.created_at)}</span>
        </div>
        <div style="padding: 12px 16px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 12px; font-size: 11px; font-weight: 600; color: #6b7280; white-space: nowrap; vertical-align: top;">Device</td>
              <td style="padding: 6px 12px; font-size: 11px; color: #111827;">${ticket.device_type}${ticket.brand ? ` - ${ticket.brand}` : ''}${ticket.model ? ` ${ticket.model}` : ''}</td>
            </tr>
            ${ticket.serial_number ? `
            <tr>
              <td style="padding: 6px 12px; font-size: 11px; font-weight: 600; color: #6b7280; white-space: nowrap; vertical-align: top;">Serial No.</td>
              <td style="padding: 6px 12px; font-size: 11px; color: #111827; font-family: monospace;">${ticket.serial_number}</td>
            </tr>` : ''}
            ${ticket.issue_description ? `
            <tr>
              <td style="padding: 6px 12px; font-size: 11px; font-weight: 600; color: #6b7280; white-space: nowrap; vertical-align: top;">Issue</td>
              <td style="padding: 6px 12px; font-size: 11px; color: #111827; line-height: 1.5;">${ticket.issue_description}</td>
            </tr>` : ''}
            ${ticket.repair_notes ? `
            <tr>
              <td style="padding: 6px 12px; font-size: 11px; font-weight: 600; color: #6b7280; white-space: nowrap; vertical-align: top;">Repair Notes</td>
              <td style="padding: 6px 12px; font-size: 11px; color: #111827; line-height: 1.5;">${ticket.repair_notes}</td>
            </tr>` : ''}
            ${ticket.estimated_cost ? `
            <tr>
              <td style="padding: 6px 12px; font-size: 11px; font-weight: 600; color: #6b7280; white-space: nowrap; vertical-align: top;">Estimated Cost</td>
              <td style="padding: 6px 12px; font-size: 11px; color: #111827; font-weight: 600;">R ${ticket.estimated_cost.toFixed(2)}</td>
            </tr>` : ''}
            ${ticket.actual_cost ? `
            <tr>
              <td style="padding: 6px 12px; font-size: 11px; font-weight: 600; color: #6b7280; white-space: nowrap; vertical-align: top;">Actual Cost</td>
              <td style="padding: 6px 12px; font-size: 11px; color: #111827; font-weight: 600;">R ${ticket.actual_cost.toFixed(2)}</td>
            </tr>` : ''}
            ${accessoriesHtml}
            ${ticket.updated_at && ticket.updated_at !== ticket.created_at ? `
            <tr>
              <td style="padding: 6px 12px; font-size: 11px; font-weight: 600; color: #6b7280; white-space: nowrap; vertical-align: top;">Last Updated</td>
              <td style="padding: 6px 12px; font-size: 11px; color: #111827;">${formatDate(ticket.updated_at)}</td>
            </tr>` : ''}
          </table>
          ${imagesHtml}
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Client Report - ${customer.first_name} ${customer.last_name} (${customer.customer_number})</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #111827;
      background: #fff;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page {
      size: A4;
      margin: 15mm 12mm;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    @media screen {
      body { padding: 24px; background: #f0f0f0; max-width: 900px; margin: 0 auto; }
      .print-container { background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 20px rgba(0,0,0,0.08); }
    }
  </style>
</head>
<body>
  <div class="no-print" style="display: flex; gap: 12px; margin-bottom: 20px; justify-content: center;">
    <button onclick="window.print()" style="padding: 10px 28px; background: ${PRIMARY}; color: #fff; border: none; border-radius: 8px; font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer;">
      Print Report
    </button>
    <button onclick="window.close()" style="padding: 10px 28px; background: #fff; color: ${SECONDARY}; border: 2px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer;">
      Close
    </button>
  </div>

  <div class="print-container">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid ${PRIMARY}; margin-bottom: 24px;">
      <div>
        <div style="font-size: 22px; font-weight: 700; color: ${SECONDARY}; margin-bottom: 2px;">Client Report</div>
        <div style="font-size: 11px; color: #9ca3af;">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 13px; font-weight: 700; color: ${PRIMARY};">Computer Guardian</div>
        <div style="font-size: 10px; color: #9ca3af;">Repair Management System</div>
      </div>
    </div>

    <!-- Client Info Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px;">
      <!-- Personal Details -->
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: ${PRIMARY}; padding: 10px 16px;">
          <span style="font-size: 12px; font-weight: 700; color: #fff; letter-spacing: 0.5px;">PERSONAL DETAILS</span>
        </div>
        <div style="padding: 14px 16px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; font-size: 11px; font-weight: 600; color: #6b7280; width: 110px;">Customer No.</td>
              <td style="padding: 5px 0; font-size: 12px; font-weight: 700; color: ${PRIMARY}; font-family: monospace;">${customer.customer_number}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-size: 11px; font-weight: 600; color: #6b7280;">Full Name</td>
              <td style="padding: 5px 0; font-size: 11px; color: #111827; font-weight: 600;">${customer.title ? customer.title + ' ' : ''}${customer.first_name} ${customer.last_name}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-size: 11px; font-weight: 600; color: #6b7280;">Email</td>
              <td style="padding: 5px 0; font-size: 11px; color: #111827;">${customer.email || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-size: 11px; font-weight: 600; color: #6b7280;">Phone</td>
              <td style="padding: 5px 0; font-size: 11px; color: #111827;">${customer.phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-size: 11px; font-weight: 600; color: #6b7280;">Gender</td>
              <td style="padding: 5px 0; font-size: 11px; color: #111827;">${customer.gender || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-size: 11px; font-weight: 600; color: #6b7280;">Contact Pref.</td>
              <td style="padding: 5px 0; font-size: 11px; color: #111827; text-transform: capitalize;">${customer.preferred_contact_method || 'Email'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-size: 11px; font-weight: 600; color: #6b7280;">Referral</td>
              <td style="padding: 5px 0; font-size: 11px; color: #111827; text-transform: capitalize;">${customer.referral_source || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-size: 11px; font-weight: 600; color: #6b7280;">Collection</td>
              <td style="padding: 5px 0; font-size: 11px; color: #111827;">${customer.needs_collection ? 'Yes - Requested' : 'No'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-size: 11px; font-weight: 600; color: #6b7280;">Client Since</td>
              <td style="padding: 5px 0; font-size: 11px; color: #111827;">${formatDateShort(customer.created_at)}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Address & Stats -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; flex: 1;">
          <div style="background: ${SECONDARY}; padding: 10px 16px;">
            <span style="font-size: 12px; font-weight: 700; color: #fff; letter-spacing: 0.5px;">ADDRESS</span>
          </div>
          <div style="padding: 14px 16px;">
            <div style="font-size: 11px; color: #111827; line-height: 1.7;">
              ${fullAddress || '<span style="color: #9ca3af;">No address on file</span>'}
            </div>
          </div>
        </div>

        <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background: ${SECONDARY}; padding: 10px 16px;">
            <span style="font-size: 12px; font-weight: 700; color: #fff; letter-spacing: 0.5px;">REPAIR SUMMARY</span>
          </div>
          <div style="padding: 14px 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; text-align: center;">
              <div>
                <div style="font-size: 24px; font-weight: 700; color: ${PRIMARY};">${tickets.length}</div>
                <div style="font-size: 10px; color: #6b7280; font-weight: 600;">Total</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: 700; color: #059669;">${completedCount}</div>
                <div style="font-size: 10px; color: #6b7280; font-weight: 600;">Completed</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: 700; color: #2563eb;">${activeCount}</div>
                <div style="font-size: 10px; color: #6b7280; font-weight: 600;">Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Repair History -->
    <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">
      <div style="font-size: 16px; font-weight: 700; color: ${SECONDARY};">Repair History</div>
      <div style="font-size: 10px; color: #9ca3af; margin-top: 2px;">${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} on record</div>
    </div>

    ${tickets.length > 0 ? ticketsHtml : `
      <div style="text-align: center; padding: 40px 0; color: #9ca3af;">
        <div style="font-size: 14px; font-weight: 600;">No repair history</div>
        <div style="font-size: 11px; margin-top: 4px;">This client has no tickets on record.</div>
      </div>
    `}

    <!-- Footer -->
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 9px; color: #9ca3af;">Confidential - Computer Guardian Client Report</div>
      <div style="font-size: 9px; color: #9ca3af;">Page 1</div>
    </div>
  </div>
</body>
</html>`;
}

export const CustomerPrintView: React.FC<CustomerPrintViewProps> = ({
  customer,
  tickets,
  onClose
}) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = buildPrintHtml(customer, tickets);
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        <h3 className="text-lg font-bold mb-1" style={{ color: SECONDARY }}>
          Print Client Report
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Generate a detailed report for {customer.first_name} {customer.last_name} including
          all personal information, address, and full repair history with device images.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Client</span>
            <span className="text-xs font-bold" style={{ color: PRIMARY }}>{customer.customer_number}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {customer.title ? customer.title + ' ' : ''}{customer.first_name} {customer.last_name}
          </p>
          <p className="text-xs text-gray-500 mt-1">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} on record</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            Open Print Preview
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border-2 border-gray-200 text-gray-600 font-semibold text-sm transition-all hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
