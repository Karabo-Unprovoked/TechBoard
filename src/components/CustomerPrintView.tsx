import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import type { Customer, RepairTicket } from '../lib/supabase';

interface CustomerPrintViewProps {
  customer: Customer;
  tickets: RepairTicket[];
  onClose: () => void;
}

const PRIMARY = '#ffb400';
const SECONDARY = '#5d5d5d';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function getStatusLabel(status: string) {
  return status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getStatusClasses(status: string): string {
  const map: Record<string, string> = {
    'received': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-amber-100 text-amber-800',
    'completed': 'bg-green-100 text-green-800',
    'waiting-parts': 'bg-orange-100 text-orange-800',
    'unrepairable': 'bg-red-100 text-red-800',
    'pending-customer-action': 'bg-yellow-100 text-yellow-800',
    'pending': 'bg-amber-100 text-amber-800',
    'invoiced': 'bg-orange-100 text-orange-800',
    'void': 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

export const CustomerPrintView: React.FC<CustomerPrintViewProps> = ({ customer, tickets, onClose }) => {
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

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handlePrint = () => window.print();

  return createPortal(
    <>
      {/* Print styles injected into head */}
      <style>{`
        @media print {
          body > *:not(#cgpr-root) { display: none !important; }
          #cgpr-root { display: block !important; position: static !important; }
          #cgpr-toolbar { display: none !important; }
          #cgpr-overlay { background: transparent !important; padding: 0 !important; }
          #cgpr-sheet { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; padding: 0 !important; }
          @page { size: A4; margin: 12mm 10mm; }
        }
      `}</style>

      <div id="cgpr-root" className="fixed inset-0 z-50 flex items-start justify-center overflow-auto" style={{ background: 'rgba(0,0,0,0.55)', padding: '24px 16px' }}>

        {/* Toolbar */}
        <div id="cgpr-toolbar" className="fixed top-4 right-4 z-50 flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-sm shadow-lg transition hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-gray-700 font-semibold text-sm shadow-lg border border-gray-200 transition hover:bg-gray-50"
          >
            <X size={16} />
            Close
          </button>
        </div>

        {/* Sheet */}
        <div
          id="cgpr-sheet"
          style={{
            background: '#fff',
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm 16mm',
            borderRadius: '8px',
            boxShadow: '0 4px 40px rgba(0,0,0,0.2)',
            fontFamily: "'Montserrat', -apple-system, sans-serif",
          }}
        >
          {/* Header */}
          <div style={{ paddingBottom: '16px', borderBottom: `3px solid ${PRIMARY}`, marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <img src="/Untitled-CG.png" alt="Computer Guardian" style={{ height: '56px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Repair Management System</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px' }}>
                  Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: SECONDARY }}>Client Report</div>
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Personal */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: PRIMARY, padding: '8px 14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>PERSONAL DETAILS</span>
              </div>
              <div style={{ padding: '12px 14px' }}>
                {([
                  ['Customer No.', <span style={{ fontFamily: 'monospace', fontWeight: 700, color: PRIMARY }}>{customer.customer_number}</span>],
                  ['Full Name', `${customer.title ? customer.title + ' ' : ''}${customer.first_name} ${customer.last_name}`],
                  ['Email', customer.email || 'Not provided'],
                  ['Phone', customer.phone || 'Not provided'],
                  ['Gender', customer.gender || 'Not specified'],
                  ['Contact Pref.', customer.preferred_contact_method || 'Email'],
                  ['Referral', customer.referral_source || 'Not specified'],
                  ['Collection', customer.needs_collection ? 'Yes — Requested' : 'No'],
                  ['Client Since', formatDateShort(customer.created_at)],
                ] as [string, React.ReactNode][]).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: '8px', padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ minWidth: '100px', fontSize: '10px', fontWeight: 600, color: '#6b7280', paddingTop: '1px' }}>{label}</div>
                    <div style={{ fontSize: '11px', color: '#111827', textTransform: label === 'Contact Pref.' || label === 'Referral' ? 'capitalize' : undefined }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Address + Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', flex: 1 }}>
                <div style={{ background: SECONDARY, padding: '8px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>ADDRESS</span>
                </div>
                <div style={{ padding: '12px 14px', fontSize: '11px', color: '#111827', lineHeight: 1.7 }}>
                  {fullAddress || <span style={{ color: '#9ca3af' }}>No address on file</span>}
                </div>
              </div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: SECONDARY, padding: '8px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>REPAIR SUMMARY</span>
                </div>
                <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', gap: '8px' }}>
                  {[
                    [tickets.length, 'Total', PRIMARY],
                    [completedCount, 'Completed', '#059669'],
                    [activeCount, 'Active', '#2563eb'],
                  ].map(([count, label, color]) => (
                    <div key={label as string}>
                      <div style={{ fontSize: '26px', fontWeight: 700, color: color as string }}>{count}</div>
                      <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Repair History heading */}
          <div style={{ paddingBottom: '10px', borderBottom: '2px solid #e5e7eb', marginBottom: '14px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: SECONDARY }}>Repair History</div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} on record
            </div>
          </div>

          {/* Tickets */}
          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>No repair history</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>This client has no tickets on record.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tickets.map((ticket, idx) => (
                <div key={ticket.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  {/* Ticket header */}
                  <div style={{ background: idx % 2 === 0 ? '#fafafa' : '#f5f5f5', padding: '10px 14px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: SECONDARY }}>{ticket.ticket_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusClasses(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                      {ticket.priority && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: ['high', 'urgent'].includes(ticket.priority) ? '#dc2626' : '#6b7280' }}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>{formatDate(ticket.created_at)}</span>
                  </div>

                  {/* Ticket body */}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
                      {/* Left column */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <Row label="Device" value={[ticket.device_type, ticket.brand, ticket.model].filter(Boolean).join(' — ')} />
                        {ticket.serial_number && <Row label="Serial No." value={ticket.serial_number} mono />}
                        {ticket.issue_description && <Row label="Issue" value={ticket.issue_description} multiline />}
                        {ticket.repair_notes && <Row label="Repair Notes" value={ticket.repair_notes} multiline />}
                      </div>
                      {/* Right column */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {ticket.estimated_cost ? <Row label="Est. Cost" value={`R ${ticket.estimated_cost.toFixed(2)}`} bold /> : null}
                        {ticket.actual_cost ? <Row label="Actual Cost" value={`R ${ticket.actual_cost.toFixed(2)}`} bold /> : null}
                        {ticket.device_accessories && ticket.device_accessories.length > 0 && (
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Accessories</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {ticket.device_accessories.map(a => (
                                <span key={a} style={{ padding: '2px 7px', background: '#f3f4f6', borderRadius: '4px', fontSize: '10px', color: '#374151' }}>{a}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                          <Row label="Last Updated" value={formatDate(ticket.updated_at)} />
                        )}
                      </div>
                    </div>

                    {/* Device images */}
                    {ticket.device_images && ticket.device_images.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                          Device Images — captured {formatDateShort(ticket.created_at)}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {ticket.device_images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Device image ${i + 1}`}
                              crossOrigin="anonymous"
                              style={{ width: '130px', height: '97px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '9px', color: '#9ca3af' }}>Confidential — Computer Guardian Client Report</div>
            <div style={{ fontSize: '9px', color: '#9ca3af' }}>{customer.customer_number} — {customer.first_name} {customer.last_name}</div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

function Row({ label, value, mono, bold, multiline }: { label: string; value: string; mono?: boolean; bold?: boolean; multiline?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280' }}>{label}</div>
      <div style={{
        fontSize: '11px',
        color: '#111827',
        fontFamily: mono ? 'monospace' : undefined,
        fontWeight: bold ? 700 : undefined,
        lineHeight: multiline ? 1.5 : undefined,
        marginTop: '1px',
      }}>
        {value}
      </div>
    </div>
  );
}
