import * as XLSX from 'xlsx';
import type { Customer, RepairTicket } from './supabase';

export const exportCustomersToExcel = (customers: Customer[]) => {
  const worksheetData = customers.map(customer => ({
    'Customer Number': customer.customer_number,
    'First Name': customer.first_name || '',
    'Last Name': customer.last_name || '',
    'Full Name': customer.name,
    'Email': customer.email || '',
    'Phone': customer.phone || '',
    'Gender': customer.gender || '',
    'Referral Source': customer.referral_source || '',
    'Created Date': new Date(customer.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  const columnWidths = [
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 20 },
    { wch: 20 }
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

  const fileName = `customers_export_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportTicketsToExcel = (tickets: RepairTicket[]) => {
  const worksheetData = tickets.map(ticket => ({
    'Ticket Number': ticket.ticket_number,
    'Customer': ticket.customer
      ? `${ticket.customer.first_name || ''} ${ticket.customer.last_name || ''}`.trim() || ticket.customer.name
      : '',
    'Customer Number': ticket.customer?.customer_number || '',
    'Device Type': ticket.device_type,
    'Brand': ticket.brand || '',
    'Model': ticket.model || '',
    'Serial Number': ticket.serial_number || '',
    'Issue Description': ticket.issue_description || '',
    'Status': ticket.status,
    'Internal Status': ticket.internal_status || '',
    'Priority': ticket.priority || '',
    'Estimated Cost': ticket.estimated_cost ? `R${ticket.estimated_cost.toFixed(2)}` : '',
    'Actual Cost': ticket.actual_cost ? `R${ticket.actual_cost.toFixed(2)}` : '',
    'Repair Notes': ticket.repair_notes || '',
    'Outsourced To': ticket.outsourced_to || '',
    'Pending Action Type': ticket.pending_customer_action_type || '',
    'Created Date': new Date(ticket.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    'Updated Date': new Date(ticket.updated_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    'Estimated Completion': ticket.estimated_completion
      ? new Date(ticket.estimated_completion).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  const columnWidths = [
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 20 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 }
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

  const fileName = `tickets_export_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
