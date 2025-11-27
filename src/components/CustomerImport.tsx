import React, { useState } from 'react';
import { Upload, X, Check, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import type { NotificationType } from './Notification';

interface CustomerImportProps {
  onClose: () => void;
  onImportComplete: () => void;
  onNotification: (type: NotificationType, message: string) => void;
}

interface ExcelColumn {
  field: string;
  sample: string;
}

interface FieldMapping {
  excelColumn: string;
  customerField: string;
}

interface ImportRow {
  data: any;
  errors: string[];
  warnings: string[];
}

interface EmailConflict {
  email: string;
  importData: any;
  existingCustomer: any;
}

const PRIMARY = '#ffb400';
const SECONDARY = '#5d5d5d';

export const CustomerImport: React.FC<CustomerImportProps> = ({
  onClose,
  onImportComplete,
  onNotification
}) => {
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'conflicts' | 'importing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [excelColumns, setExcelColumns] = useState<ExcelColumn[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [emailConflicts, setEmailConflicts] = useState<EmailConflict[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<Map<string, 'skip' | 'merge'>>(new Map());

  const customerFields = [
    { value: '', label: '-- Do Not Import --' },
    { value: 'customer_number', label: 'Customer Number' },
    { value: 'title', label: 'Title (Mr/Mrs/Ms/Dr)' },
    { value: 'first_name', label: 'First Name *' },
    { value: 'last_name', label: 'Last Name *' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'gender', label: 'Gender (Male/Female/Other)' },
    { value: 'referral_source', label: 'Referral Source' },
    { value: 'preferred_contact_method', label: 'Preferred Contact Method (email/phone/sms)' },
    { value: 'street_address', label: 'Street Address' },
    { value: 'address_line_2', label: 'Address Line 2' },
    { value: 'city', label: 'City' },
    { value: 'province', label: 'Province' },
    { value: 'postal_code', label: 'Postal Code' },
    { value: 'country', label: 'Country' }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          onNotification('error', 'The Excel file is empty');
          return;
        }

        setExcelData(jsonData);

        const firstRow = jsonData[0] as any;
        const columns: ExcelColumn[] = Object.keys(firstRow).map(key => ({
          field: key,
          sample: String(firstRow[key] || '').substring(0, 50)
        }));

        setExcelColumns(columns);

        const autoMappings: FieldMapping[] = columns.map(col => {
          const lowerField = col.field.toLowerCase().replace(/[_\s-]/g, '');
          let matchedField = '';

          if (lowerField.includes('customernumber') || lowerField.includes('customerid') || lowerField === 'customernum') {
            matchedField = 'customer_number';
          } else if (lowerField.includes('firstname') || lowerField === 'fname') {
            matchedField = 'first_name';
          } else if (lowerField.includes('lastname') || lowerField === 'lname' || lowerField === 'surname') {
            matchedField = 'last_name';
          } else if (lowerField.includes('email') || lowerField.includes('mail')) {
            matchedField = 'email';
          } else if (lowerField.includes('phone') || lowerField.includes('mobile') || lowerField.includes('cell')) {
            matchedField = 'phone';
          } else if (lowerField.includes('title')) {
            matchedField = 'title';
          } else if (lowerField.includes('gender') || lowerField.includes('sex')) {
            matchedField = 'gender';
          } else if (lowerField.includes('referral') || lowerField.includes('source')) {
            matchedField = 'referral_source';
          } else if (lowerField.includes('street') || lowerField.includes('address1')) {
            matchedField = 'street_address';
          } else if (lowerField.includes('address2') || lowerField.includes('addressline2')) {
            matchedField = 'address_line_2';
          } else if (lowerField.includes('city') || lowerField.includes('town')) {
            matchedField = 'city';
          } else if (lowerField.includes('province') || lowerField.includes('state')) {
            matchedField = 'province';
          } else if (lowerField.includes('postal') || lowerField.includes('zip')) {
            matchedField = 'postal_code';
          } else if (lowerField.includes('country')) {
            matchedField = 'country';
          }

          return {
            excelColumn: col.field,
            customerField: matchedField
          };
        });

        setFieldMappings(autoMappings);
        setStep('map');
      } catch (error) {
        console.error('Error reading file:', error);
        onNotification('error', 'Failed to read Excel file. Please ensure it is a valid Excel file.');
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  const updateMapping = (excelColumn: string, customerField: string) => {
    setFieldMappings(prev =>
      prev.map(m => m.excelColumn === excelColumn ? { ...m, customerField } : m)
    );
  };

  const generateCustomerNumber = async (lastNumber?: string, isImporting: boolean = false): Promise<string> => {
    if (!lastNumber) {
      const { data: customers } = await supabase
        .from('customers')
        .select('customer_number');

      if (!customers || customers.length === 0) {
        return 'C1';
      }

      // Find the highest numeric value
      const numbers = customers
        .map(c => parseInt(c.customer_number.replace('C', ''), 10))
        .filter(n => !isNaN(n));

      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      lastNumber = `C${maxNumber}`;
    }

    const numberPart = parseInt(lastNumber.replace('C', ''), 10);
    const nextNumber = numberPart + 1;

    return `C${nextNumber}`;
  };

  const handlePreview = async () => {
    const hasFirstName = fieldMappings.some(m => m.customerField === 'first_name');
    const hasLastName = fieldMappings.some(m => m.customerField === 'last_name');

    if (!hasFirstName || !hasLastName) {
      onNotification('error', 'First Name and Last Name are required fields. Please map them.');
      return;
    }

    const preview: ImportRow[] = excelData.slice(0, 10).map((row: any) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const mappedData: any = {};

      fieldMappings.forEach(mapping => {
        if (mapping.customerField) {
          mappedData[mapping.customerField] = row[mapping.excelColumn];
        }
      });

      if (!mappedData.first_name?.trim()) {
        errors.push('First name is required');
      }
      if (!mappedData.last_name?.trim()) {
        errors.push('Last name is required');
      }

      if (mappedData.email && !mappedData.email.includes('@')) {
        warnings.push('Email format may be invalid');
      }

      if (mappedData.gender) {
        const gender = mappedData.gender.toLowerCase();
        if (!['male', 'female', 'other', 'm', 'f'].includes(gender)) {
          warnings.push('Gender value not recognized (should be Male/Female/Other)');
        }
      }

      if (mappedData.preferred_contact_method) {
        const method = mappedData.preferred_contact_method.toLowerCase();
        if (!['email', 'phone', 'sms'].includes(method)) {
          warnings.push('Preferred contact method not recognized (should be email/phone/sms)');
        }
      }

      return { data: mappedData, errors, warnings };
    });

    setPreviewData(preview);
    setStep('preview');
  };

  const checkEmailConflicts = async () => {
    const conflicts: EmailConflict[] = [];

    for (const row of excelData) {
      const mappedData: any = {};
      fieldMappings.forEach(mapping => {
        if (mapping.customerField) {
          const value = row[mapping.excelColumn];
          if (value !== null && value !== undefined && value !== '') {
            mappedData[mapping.customerField] = String(value).trim();
          }
        }
      });

      if (mappedData.email?.trim()) {
        const { data: existing } = await supabase
          .from('customers')
          .select('*')
          .eq('email', mappedData.email.trim())
          .maybeSingle();

        if (existing) {
          conflicts.push({
            email: mappedData.email.trim(),
            importData: mappedData,
            existingCustomer: existing
          });
        }
      }
    }

    if (conflicts.length > 0) {
      setEmailConflicts(conflicts);
      const initialResolutions = new Map<string, 'skip' | 'merge'>();
      conflicts.forEach(c => initialResolutions.set(c.email, 'skip'));
      setConflictResolutions(initialResolutions);
      setStep('conflicts');
    } else {
      handleImport();
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setImportProgress(0);

    const validRows: any[] = [];
    let errorCount = 0;

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      const mappedData: any = {
        country: 'South Africa',
        preferred_contact_method: 'email'
      };

      fieldMappings.forEach(mapping => {
        if (mapping.customerField) {
          const value = row[mapping.excelColumn];
          if (value !== null && value !== undefined && value !== '') {
            mappedData[mapping.customerField] = String(value).trim();
          }
        }
      });

      if (mappedData.first_name?.trim() && mappedData.last_name?.trim()) {
        mappedData.name = `${mappedData.first_name} ${mappedData.last_name}`;

        if (mappedData.gender) {
          const gender = mappedData.gender.toLowerCase();
          if (gender === 'm') mappedData.gender = 'Male';
          else if (gender === 'f') mappedData.gender = 'Female';
          else if (['male', 'female', 'other'].includes(gender)) {
            mappedData.gender = gender.charAt(0).toUpperCase() + gender.slice(1);
          }
        }

        if (mappedData.preferred_contact_method) {
          mappedData.preferred_contact_method = mappedData.preferred_contact_method.toLowerCase();
        }

        validRows.push(mappedData);
      } else {
        errorCount++;
      }

      setImportProgress(Math.round(((i + 1) / excelData.length) * 20));
    }

    try {
      let successCount = 0;
      let duplicateCount = 0;

      const rowsWithNumbers = validRows.filter(row => row.customer_number?.trim());
      const rowsWithoutNumbers = validRows.filter(row => !row.customer_number?.trim());

      const totalRows = rowsWithNumbers.length + rowsWithoutNumbers.length;
      let processedCount = 0;

      for (const customerData of rowsWithNumbers) {
        const { data: existingNumber } = await supabase
          .from('customers')
          .select('customer_number')
          .eq('customer_number', customerData.customer_number)
          .maybeSingle();

        if (existingNumber) {
          console.warn('Duplicate customer number found:', customerData.customer_number);
          duplicateCount++;
          errorCount++;
          processedCount++;
          setImportProgress(20 + Math.round((processedCount / totalRows) * 70));
          continue;
        }

        if (customerData.email?.trim()) {
          const resolution = conflictResolutions.get(customerData.email.trim());

          if (resolution === 'skip') {
            processedCount++;
            setImportProgress(20 + Math.round((processedCount / totalRows) * 70));
            continue;
          }

          if (resolution === 'merge') {
            const conflict = emailConflicts.find(c => c.email === customerData.email.trim());
            if (conflict) {
              const { error } = await supabase
                .from('customers')
                .update(customerData)
                .eq('id', conflict.existingCustomer.id);

              if (error) {
                console.error('Merge error for row:', error, customerData);
                errorCount++;
              } else {
                successCount++;
              }
              processedCount++;
              setImportProgress(20 + Math.round((processedCount / totalRows) * 70));
              continue;
            }
          }
        }

        const { error } = await supabase
          .from('customers')
          .insert(customerData);

        if (error) {
          console.error('Import error for row:', error, customerData);
          errorCount++;
        } else {
          successCount++;
        }

        processedCount++;
        setImportProgress(20 + Math.round((processedCount / totalRows) * 70));
      }

      let lastCustomerNumber: string | undefined;

      for (const customerData of rowsWithoutNumbers) {
        if (customerData.email?.trim()) {
          const resolution = conflictResolutions.get(customerData.email.trim());

          if (resolution === 'skip') {
            processedCount++;
            setImportProgress(20 + Math.round((processedCount / totalRows) * 70));
            continue;
          }

          if (resolution === 'merge') {
            const conflict = emailConflicts.find(c => c.email === customerData.email.trim());
            if (conflict) {
              const { error } = await supabase
                .from('customers')
                .update(customerData)
                .eq('id', conflict.existingCustomer.id);

              if (error) {
                console.error('Merge error for row:', error, customerData);
                errorCount++;
              } else {
                successCount++;
              }
              processedCount++;
              setImportProgress(20 + Math.round((processedCount / totalRows) * 70));
              continue;
            }
          }
        }

        const customerNumber = await generateCustomerNumber(lastCustomerNumber, true);
        customerData.customer_number = customerNumber;
        lastCustomerNumber = customerNumber;

        const { error } = await supabase
          .from('customers')
          .insert(customerData);

        if (error) {
          console.error('Import error for row:', error, customerData);
          errorCount++;
        } else {
          successCount++;
        }

        processedCount++;
        setImportProgress(20 + Math.round((processedCount / totalRows) * 70));
      }

      setImportProgress(100);

      if (successCount > 0) {
        let message = `Successfully imported ${successCount} customer${successCount > 1 ? 's' : ''}`;
        if (duplicateCount > 0) {
          message += `. ${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''} skipped`;
        }
        if (errorCount - duplicateCount > 0) {
          message += `. ${errorCount - duplicateCount} error${errorCount - duplicateCount > 1 ? 's' : ''}`;
        }
        onNotification('success', message);
        setTimeout(() => {
          onImportComplete();
          onClose();
        }, 1500);
      } else {
        onNotification('error', 'Failed to import customers. Please check your data and try again.');
        setStep('preview');
      }
    } catch (error) {
      console.error('Import error:', error);
      onNotification('error', 'An error occurred during import. Please try again.');
      setStep('preview');
    }
  };

  const downloadTemplate = () => {
    const templateData = [{
      'Customer Number': 'C100',
      'First Name': 'John',
      'Last Name': 'Doe',
      'Title': 'Mr',
      'Email': 'john.doe@example.com',
      'Phone': '+27 82 123 4567',
      'Gender': 'Male',
      'Referral Source': 'Website',
      'Preferred Contact Method': 'email',
      'Street Address': '123 Main Street',
      'Address Line 2': 'Unit 4',
      'City': 'Cape Town',
      'Province': 'Western Cape',
      'Postal Code': '8001',
      'Country': 'South Africa'
    }];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, 'customer_import_template.xlsx');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: SECONDARY }}>
              Import Customers from Excel
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'upload' && 'Upload your Excel file to begin'}
              {step === 'map' && 'Map Excel columns to customer fields'}
              {step === 'preview' && 'Review data before importing'}
              {step === 'importing' && 'Importing customers...'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={step === 'importing'}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-2">Before you begin:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ensure your Excel file has column headers in the first row</li>
                      <li>First Name and Last Name are required fields</li>
                      <li>Customer Number is optional - leave blank to auto-generate</li>
                      <li>Duplicate customer numbers will be skipped</li>
                      <li>Remove any empty rows from your spreadsheet</li>
                      <li>You can download our template to see the correct format</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-6"
                >
                  <Download size={20} />
                  <span>Download Template</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <FileSpreadsheet size={64} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    Click to upload Excel file
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports .xlsx and .xls files
                  </p>
                </label>
              </div>

              {file && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">File uploaded successfully</p>
                      <p className="text-sm text-green-700">{file.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Found {excelColumns.length} columns</strong> in your Excel file with <strong>{excelData.length} rows</strong> of data.
                  Map each column to the corresponding customer field.
                </p>
              </div>

              <div className="space-y-3">
                {excelColumns.map((col, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Excel Column
                        </label>
                        <div className="bg-gray-50 px-3 py-2 rounded border border-gray-200">
                          <p className="font-mono font-semibold">{col.field}</p>
                          <p className="text-xs text-gray-500 mt-1">Sample: {col.sample || '(empty)'}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Maps to Customer Field
                        </label>
                        <select
                          value={fieldMappings.find(m => m.excelColumn === col.field)?.customerField || ''}
                          onChange={(e) => updateMapping(col.field, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                          style={{ focusRingColor: PRIMARY }}
                        >
                          {customerFields.map(field => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Preview of first 10 rows.</strong> Review the data below and check for any errors or warnings.
                </p>
              </div>

              <div className="space-y-3">
                {previewData.map((row, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${row.errors.length > 0 ? 'border-red-300 bg-red-50' : row.warnings.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-800">
                        Row {index + 1}: {row.data.first_name} {row.data.last_name}
                      </p>
                      {row.errors.length === 0 && row.warnings.length === 0 && (
                        <Check size={20} className="text-green-600" />
                      )}
                    </div>

                    {row.errors.length > 0 && (
                      <div className="mb-2">
                        {row.errors.map((error, i) => (
                          <p key={i} className="text-sm text-red-700 flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                          </p>
                        ))}
                      </div>
                    )}

                    {row.warnings.length > 0 && (
                      <div className="mb-2">
                        {row.warnings.map((warning, i) => (
                          <p key={i} className="text-sm text-yellow-700 flex items-center gap-2">
                            <AlertCircle size={16} />
                            {warning}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                      {Object.entries(row.data).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-semibold">{key}:</span> {String(value || '-')}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'conflicts' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-2">Email Conflicts Detected</p>
                    <p>
                      {emailConflicts.length} customer{emailConflicts.length > 1 ? 's' : ''} in your import file {emailConflicts.length > 1 ? 'have' : 'has'} email addresses that already exist in the database.
                      Please choose how to handle each conflict.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {emailConflicts.map((conflict, index) => (
                  <div key={conflict.email} className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="font-semibold text-gray-800 mb-1">
                        Conflict {index + 1}: {conflict.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        Choose to skip this import or merge with existing customer
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white border border-gray-300 rounded p-3">
                        <p className="font-semibold text-sm mb-2 text-gray-700">Existing Customer</p>
                        <div className="text-xs space-y-1 text-gray-600">
                          <p><span className="font-semibold">Number:</span> {conflict.existingCustomer.customer_number}</p>
                          <p><span className="font-semibold">Name:</span> {conflict.existingCustomer.name}</p>
                          <p><span className="font-semibold">Phone:</span> {conflict.existingCustomer.phone || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-300 rounded p-3">
                        <p className="font-semibold text-sm mb-2 text-gray-700">Import Data</p>
                        <div className="text-xs space-y-1 text-gray-600">
                          <p><span className="font-semibold">Number:</span> {conflict.importData.customer_number || 'Auto-generate'}</p>
                          <p><span className="font-semibold">Name:</span> {conflict.importData.name}</p>
                          <p><span className="font-semibold">Phone:</span> {conflict.importData.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <label className="flex-1 cursor-pointer">
                        <div className={`border-2 rounded-lg p-3 transition-colors ${
                          conflictResolutions.get(conflict.email) === 'skip'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`conflict-${conflict.email}`}
                              checked={conflictResolutions.get(conflict.email) === 'skip'}
                              onChange={() => {
                                const newResolutions = new Map(conflictResolutions);
                                newResolutions.set(conflict.email, 'skip');
                                setConflictResolutions(newResolutions);
                              }}
                              className="w-4 h-4"
                            />
                            <span className="font-semibold text-sm">Skip Import</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 ml-6">Keep existing customer unchanged</p>
                        </div>
                      </label>

                      <label className="flex-1 cursor-pointer">
                        <div className={`border-2 rounded-lg p-3 transition-colors ${
                          conflictResolutions.get(conflict.email) === 'merge'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`conflict-${conflict.email}`}
                              checked={conflictResolutions.get(conflict.email) === 'merge'}
                              onChange={() => {
                                const newResolutions = new Map(conflictResolutions);
                                newResolutions.set(conflict.email, 'merge');
                                setConflictResolutions(newResolutions);
                              }}
                              className="w-4 h-4"
                            />
                            <span className="font-semibold text-sm">Merge Data</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 ml-6">Update existing customer with import data</p>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Upload size={64} className="text-gray-400 mb-4 animate-pulse" />
              <p className="text-xl font-semibold text-gray-800 mb-2">Importing Customers...</p>
              <p className="text-sm text-gray-600 mb-6">Please wait while we import your data</p>

              <div className="w-full max-w-md">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all duration-300"
                    style={{ backgroundColor: PRIMARY, width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-center mt-2 text-sm font-semibold" style={{ color: PRIMARY }}>
                  {importProgress}%
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div>
            {step === 'map' && (
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={() => setStep('map')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            {step === 'conflicts' && (
              <button
                onClick={() => setStep('preview')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {step !== 'importing' && (
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}

            {step === 'map' && (
              <button
                onClick={handlePreview}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: PRIMARY }}
              >
                Preview Import
              </button>
            )}

            {step === 'preview' && (
              <button
                onClick={checkEmailConflicts}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: PRIMARY }}
              >
                Check & Import
              </button>
            )}

            {step === 'conflicts' && (
              <button
                onClick={handleImport}
                className="px-6 py-2 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: PRIMARY }}
              >
                Proceed with Import
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
