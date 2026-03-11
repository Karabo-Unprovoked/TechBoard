import React, { useState } from 'react';
import { ArrowLeft, Upload, X, Laptop, User, Mail, Phone, MapPin, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TermsModal } from './TermsModal';

interface SelfRegistrationProps {
  onBack: () => void;
}

export const SelfRegistration: React.FC<SelfRegistrationProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    preferred_contact_method: 'email',
    referral_source: '',
    needs_collection: false,
    street_address: '',
    address_line_2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'South Africa',
    device_type: '',
    laptop_brand: '',
    laptop_model: '',
    laptop_problem: '',
    serial_number: '',
    device_includes: [] as string[],
    additional_notes: '',
    customer_declarations: {
      legal_owner: false,
      diagnostics_nonrefundable: false,
      timeline_estimate: false,
      data_backup: false,
      terms_accepted: false
    }
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 5 - imageFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s). Maximum is 5 images.`);
    }

    setImageFiles(prev => [...prev, ...filesToAdd]);

    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeviceIncludesChange = (item: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      device_includes: checked
        ? [...prev.device_includes, item]
        : prev.device_includes.filter(i => i !== item)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const imageUrls: string[] = [];

      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `registration-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('device-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('device-images')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      }

      const { error } = await supabase
        .from('registration_requests')
        .insert({
          ...formData,
          device_images: imageUrls
        });

      if (error) throw error;

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PRIMARY = '#ffb400';
  const SECONDARY = '#5d5d5d';

  if (submitted) {
    return (
      <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="min-h-screen bg-gray-50 flex items-center justify-center px-3 sm:px-4">
        <div className="max-w-md w-full bg-white rounded-lg sm:rounded-xl shadow-lg p-6 sm:p-8 text-center">
          <div className="mb-4 sm:mb-6">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={24} className="sm:w-8 sm:h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: SECONDARY }}>
            Registration Submitted!
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Thank you for your registration. We will review your request and contact you shortly via your preferred contact method.
          </p>
          <button
            onClick={onBack}
            className="w-full py-2.5 sm:py-3 text-sm sm:text-base rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: PRIMARY }}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2" style={{ color: SECONDARY }}>
                Device Repair Registration
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Fill out the form below to register your device for repair. We'll review your request and contact you soon.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Personal Information */}
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2" style={{ color: SECONDARY }}>
                  <User size={18} className="sm:w-5 sm:h-5" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <select
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    >
                      <option value="">Select title</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Contact Method
                    </label>
                    <select
                      value={formData.preferred_contact_method}
                      onChange={(e) => setFormData({ ...formData, preferred_contact_method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Where did you hear about us?
                    </label>
                    <select
                      value={formData.referral_source}
                      onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    >
                      <option value="">Select source</option>
                      <option value="google">Google Search</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="friend">Friend/Family</option>
                      <option value="repeat">Repeat Customer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.needs_collection}
                        onChange={(e) => setFormData({ ...formData, needs_collection: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: PRIMARY }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        I would like you to organize collection and delivery
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: SECONDARY }}>
                  <MapPin size={20} />
                  Address Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.street_address}
                      onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={formData.address_line_2}
                      onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province
                    </label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>
                </div>
              </div>

              {/* Device Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: SECONDARY }}>
                  <Laptop size={20} />
                  Device Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Device Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.device_type}
                      onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    >
                      <option value="">Select device type</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop">Desktop</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Phone">Phone</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Device Brand
                    </label>
                    <select
                      value={formData.laptop_brand}
                      onChange={(e) => setFormData({ ...formData, laptop_brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    >
                      <option value="">Select brand</option>
                      <option value="Acer">Acer</option>
                      <option value="Apple">Apple</option>
                      <option value="ASUS">ASUS</option>
                      <option value="Dell">Dell</option>
                      <option value="Google">Google</option>
                      <option value="HP">HP</option>
                      <option value="Huawei">Huawei</option>
                      <option value="Lenovo">Lenovo</option>
                      <option value="LG">LG</option>
                      <option value="Microsoft">Microsoft</option>
                      <option value="MSI">MSI</option>
                      <option value="Razer">Razer</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Sony">Sony</option>
                      <option value="Toshiba">Toshiba</option>
                      <option value="Xiaomi">Xiaomi</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Device Model
                    </label>
                    <input
                      type="text"
                      value={formData.laptop_model}
                      onChange={(e) => setFormData({ ...formData, laptop_model: e.target.value })}
                      placeholder="e.g., Latitude 5420, MacBook Pro"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Problem Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.laptop_problem}
                      onChange={(e) => setFormData({ ...formData, laptop_problem: e.target.value })}
                      rows={4}
                      placeholder="Please describe the issue with your device..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Device Includes
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['Charger', 'Battery', 'Bag', 'Mouse', 'External Drive', 'Other Accessories'].map(item => (
                        <label key={item} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.device_includes.includes(item)}
                            onChange={(e) => handleDeviceIncludesChange(item, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                            style={{ accentColor: PRIMARY }}
                          />
                          <span className="text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes and Condition
                    </label>
                    <textarea
                      value={formData.additional_notes}
                      onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                      rows={3}
                      placeholder="Any additional information about the device condition, scratches, dents, etc..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                      style={{ focusRingColor: PRIMARY }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Device Images (Max 5)
                    </label>
                    <div className="space-y-4">
                      {imageFiles.length < 5 && (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload size={32} className="text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">
                              Click to upload images ({imageFiles.length}/5)
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG up to 10MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                      )}

                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Device ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Declarations */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-2" style={{ color: SECONDARY }}>
                  Important Declarations
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Please read and tick all boxes to proceed. These declarations are mandatory.
                </p>

                <div className="space-y-3 mb-4">
                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.customer_declarations.legal_owner}
                      onChange={(e) => setFormData({
                        ...formData,
                        customer_declarations: {
                          ...formData.customer_declarations,
                          legal_owner: e.target.checked
                        }
                      })}
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 flex-shrink-0"
                      style={{ accentColor: PRIMARY }}
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I am the legal owner or authorised user of this device
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.customer_declarations.diagnostics_nonrefundable}
                      onChange={(e) => setFormData({
                        ...formData,
                        customer_declarations: {
                          ...formData.customer_declarations,
                          diagnostics_nonrefundable: e.target.checked
                        }
                      })}
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 flex-shrink-0"
                      style={{ accentColor: PRIMARY }}
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I understand diagnostics are non-refundable
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.customer_declarations.timeline_estimate}
                      onChange={(e) => setFormData({
                        ...formData,
                        customer_declarations: {
                          ...formData.customer_declarations,
                          timeline_estimate: e.target.checked
                        }
                      })}
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 flex-shrink-0"
                      style={{ accentColor: PRIMARY }}
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I understand repair timelines are estimates
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.customer_declarations.data_backup}
                      onChange={(e) => setFormData({
                        ...formData,
                        customer_declarations: {
                          ...formData.customer_declarations,
                          data_backup: e.target.checked
                        }
                      })}
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 flex-shrink-0"
                      style={{ accentColor: PRIMARY }}
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I have backed up my data
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.customer_declarations.terms_accepted}
                      onChange={(e) => setFormData({
                        ...formData,
                        customer_declarations: {
                          ...formData.customer_declarations,
                          terms_accepted: e.target.checked
                        }
                      })}
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 flex-shrink-0"
                      style={{ accentColor: PRIMARY }}
                      required
                    />
                    <span className="text-sm text-gray-700">
                      I accept Computer Guardian's{' '}
                      <button
                        type="button"
                        className="font-semibold underline hover:opacity-80"
                        style={{ color: PRIMARY }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowTermsModal(true);
                        }}
                      >
                        Terms & Conditions
                      </button>
                    </span>
                  </label>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    By ticking these boxes and submitting this form, you acknowledge that you have read and understood all declarations above, including the Terms & Conditions document.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  );
};
