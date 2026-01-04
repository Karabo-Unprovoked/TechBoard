import React from 'react';
import { X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const PRIMARY = '#ffb400';
  const SECONDARY = '#5d5d5d';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ backgroundColor: PRIMARY }}>
          <h2 className="text-2xl font-bold text-white">Terms & Conditions</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="prose prose-sm max-w-none" style={{ color: SECONDARY }}>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold" style={{ color: SECONDARY }}>COMPUTER GUARDIAN (PTY) LTD</h3>
              <h4 className="text-lg font-semibold" style={{ color: SECONDARY }}>TERMS & CONDITIONS – REPAIRS & SALES</h4>
              <p className="text-sm text-gray-600 mt-2">
                Company Name: Computer Guardian (Pty) Ltd<br />
                Website: www.computerguardian.co.za<br />
                Effective Date: January 2026
              </p>
            </div>

            <p className="mb-6">
              By engaging Computer Guardian (Pty) Ltd ("the Company") for repairs, services, or purchasing products, the client ("the Customer") agrees to the following Terms & Conditions.
            </p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>1. LEGAL FRAMEWORK & CPA COMPLIANCE</h5>
            <p className="mb-2">1.1 These Terms & Conditions are drafted in accordance with the Consumer Protection Act, 68 of 2008 (CPA).</p>
            <p className="mb-2">1.2 Nothing in these Terms limits a consumer's statutory rights under the CPA.</p>
            <p className="mb-4">1.3 Where permitted by law, the Company limits its liability reasonably and transparently.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>2. SCOPE OF SERVICES</h5>
            <p className="mb-2">2.1 Services include but are not limited to:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Diagnostics</li>
              <li>Hardware and software repairs</li>
              <li>Board-level repairs</li>
              <li>Data services</li>
              <li>Sales of new and refurbished devices</li>
              <li>Accessories and ICT solutions</li>
            </ul>
            <p className="mb-4">2.2 All services are provided subject to device condition, part availability, and technical feasibility.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>3. DIAGNOSTICS & FAULT ASSESSMENT</h5>
            <p className="mb-2">3.1 All devices are subject to a diagnostic assessment.</p>
            <p className="mb-2">3.2 Diagnostic fees are non-refundable, as permitted by Section 15 of the CPA (services already rendered).</p>
            <p className="mb-2">3.3 Initial fault descriptions are based on customer information and may change after diagnostics.</p>
            <p className="mb-4">3.4 Additional faults discovered will be communicated to the customer for approval.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>4. QUOTATIONS & APPROVAL</h5>
            <p className="mb-2">4.1 Quotations are valid for a limited period and subject to part availability.</p>
            <p className="mb-2">4.2 Repairs commence only after customer approval, which may be verbal, written, electronic, or via messaging platforms.</p>
            <p className="mb-2">4.3 Once approved, the quotation becomes binding.</p>
            <p className="mb-4">4.4 Special-order parts cannot be cancelled or refunded once ordered.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>5. TURNAROUND TIMES</h5>
            <p className="mb-2">5.1 All turnaround times provided are estimates only, not guarantees.</p>
            <p className="mb-2">5.2 Delays may occur due to:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Supplier or courier delays</li>
              <li>Manufacturer backorders</li>
              <li>Repair complexity</li>
              <li>Testing requirements</li>
            </ul>
            <p className="mb-4">5.3 The Company shall not be liable for delays beyond its reasonable control (CPA Section 61 exclusions).</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>6. PARTS & MATERIALS</h5>
            <p className="mb-2">6.1 Parts used may be:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>New</li>
              <li>Refurbished</li>
              <li>OEM or compatible equivalents</li>
            </ul>
            <p className="mb-2">6.2 The Company reserves the right to use compatible parts unless OEM is specifically requested.</p>
            <p className="mb-4">6.3 Cosmetic differences may occur and do not constitute defects under the CPA.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>7. WARRANTIES ON REPAIRS</h5>
            <p className="mb-2">7.1 Computer Guardian provides a limited repair warranty strictly on the specific component repaired or replaced, subject to inspection and verification by the Company.</p>
            <p className="mb-2">7.2 This warranty applies only where the same fault reoccurs as a direct result of workmanship or the replaced component being defective.</p>
            <p className="mb-2">7.3 The warranty does not apply to:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Liquid or moisture damage</li>
              <li>Physical or accidental damage</li>
              <li>Power surges, load shedding, or electrical faults</li>
              <li>Software corruption, viruses, or updates</li>
              <li>Further or unrelated faults</li>
              <li>Normal wear and tear</li>
              <li>Devices that have been tampered with or repaired by third parties after collection</li>
            </ul>
            <p className="mb-2">7.4 Board-level repairs are performed on a best-effort basis due to the complex and unpredictable nature of such repairs and may carry limited or no warranty, which the customer expressly acknowledges.</p>
            <p className="mb-2">7.5 Warranty claims are subject to:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Physical inspection</li>
              <li>Diagnostic testing</li>
              <li>Verification that the fault relates directly to the original repair</li>
            </ul>
            <p className="mb-2">7.6 If a warranty claim is approved, the Company will, at its discretion:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Re-perform the repair, or</li>
              <li>Replace the faulty component, where reasonably possible</li>
            </ul>
            <p className="mb-2">7.7 The warranty does not extend to data loss, loss of use, loss of income, or any consequential damages.</p>
            <p className="mb-4">7.8 Nothing in this section limits the customer's rights under the Consumer Protection Act, where applicable.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>8. SALES – NEW & REFURBISHED PRODUCTS</h5>
            <p className="mb-2">8.1 New products carry manufacturer warranties where applicable.</p>
            <p className="mb-2">8.2 Refurbished products may show signs of previous use and are sold accordingly.</p>
            <p className="mb-4">8.3 The CPA six-month implied warranty applies, except where damage results from misuse, negligence, or unauthorised repairs.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>9. RETURNS & REFUNDS</h5>
            <p className="mb-2">9.1 No refunds will be issued for:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Diagnostic fees</li>
              <li>Labour already performed</li>
              <li>Software services</li>
              <li>Special-order parts</li>
            </ul>
            <p className="mb-2">9.2 Hardware returns are subject to:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Inspection</li>
              <li>Supplier approval</li>
              <li>Restocking or handling fees</li>
            </ul>
            <p className="mb-4">9.3 Approved refunds will be processed within a reasonable timeframe as per CPA guidelines.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>10. DATA & PRIVACY</h5>
            <p className="mb-2">10.1 The Company is not responsible for data loss during diagnostics or repairs.</p>
            <p className="mb-2">10.2 Customers are responsible for backing up all data prior to submission.</p>
            <p className="mb-2">10.3 Data recovery services are offered without guarantee of success.</p>
            <p className="mb-4">10.4 All personal information is handled in accordance with POPIA.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>11. PAYMENT TERMS</h5>
            <p className="mb-2">11.1 Full payment is required before:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Device release</li>
              <li>Delivery</li>
              <li>Completion handover</li>
            </ul>
            <p className="mb-2">11.2 Deposits may be required for high-value repairs or parts.</p>
            <p className="mb-4">11.3 The Company reserves the right to withhold devices until payment is received.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>12. UNCOLLECTED DEVICES</h5>
            <p className="mb-2">12.1 Customers will be notified upon completion.</p>
            <p className="mb-2">12.2 Devices not collected within 30 days may incur storage fees.</p>
            <p className="mb-4">12.3 Devices uncollected after 90 days may be sold or recycled to recover costs, as permitted by law.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>13. CUSTOMER RESPONSIBILITIES</h5>
            <p className="mb-2">The customer confirms that:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>They are the lawful owner or authorised user</li>
              <li>Information provided is accurate</li>
              <li>The device condition is disclosed honestly</li>
            </ul>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>14. LIMITATION OF LIABILITY</h5>
            <p className="mb-2">14.1 The Company shall not be liable for:</p>
            <ul className="list-disc pl-6 mb-2">
              <li>Indirect or consequential losses</li>
              <li>Loss of income, profits, or business</li>
              <li>Pre-existing faults or failures</li>
            </ul>
            <p className="mb-4">14.2 Liability is limited to the value of the service or repair performed, where permitted by the CPA.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>15. RIGHT OF REFUSAL</h5>
            <p className="mb-2">The Company reserves the right to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Refuse unsafe or uneconomical repairs</li>
              <li>Decline service for abusive or unethical conduct</li>
            </ul>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>16. GOVERNING LAW & JURISDICTION</h5>
            <p className="mb-4">These Terms & Conditions are governed by the laws of the Republic of South Africa, and disputes shall be subject to South African courts.</p>

            <h5 className="text-lg font-bold mt-6 mb-3" style={{ color: SECONDARY }}>17. ACCEPTANCE</h5>
            <p className="mb-4">By submitting a device, approving a quote, or making payment, the customer confirms that they have read, understood, and accepted these Terms & Conditions.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: PRIMARY }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
