'use client';

import { useState } from 'react';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface ShippingAddressFormProps {
  isOpen: boolean;
  onSubmit: (address: ShippingAddress) => void;
  initialData?: Partial<ShippingAddress>;
}

export default function ShippingAddressForm({ isOpen, onSubmit, initialData }: ShippingAddressFormProps) {
  const [formData, setFormData] = useState<ShippingAddress>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    addressLine1: initialData?.addressLine1 || '',
    addressLine2: initialData?.addressLine2 || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zipCode: initialData?.zipCode || '',
    country: initialData?.country || 'US',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP code';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-2">
          Shipping Address
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Please provide your shipping address to complete your order.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                First Name <span className="text-[#0D6B4D]">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full bg-[#1a1a1a] border ${
                  errors.firstName ? 'border-red-500' : 'border-[#3a3a3a]'
                } rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0D6B4D] focus:border-transparent`}
                placeholder="First name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                Last Name <span className="text-[#0D6B4D]">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full bg-[#1a1a1a] border ${
                  errors.lastName ? 'border-red-500' : 'border-[#3a3a3a]'
                } rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0D6B4D] focus:border-transparent`}
                placeholder="Last name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-300 mb-1">
              Street Address <span className="text-[#0D6B4D]">*</span>
            </label>
            <input
              type="text"
              id="addressLine1"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className={`w-full bg-[#1a1a1a] border ${
                errors.addressLine1 ? 'border-red-500' : 'border-[#3a3a3a]'
              } rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0D6B4D] focus:border-transparent`}
              placeholder="123 Main St"
            />
            {errors.addressLine1 && (
              <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>
            )}
          </div>

          <div>
            <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-300 mb-1">
              Apartment, suite, etc. <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              id="addressLine2"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0D6B4D] focus:border-transparent"
              placeholder="Apt 4B"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1">
                City <span className="text-[#0D6B4D]">*</span>
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`w-full bg-[#1a1a1a] border ${
                  errors.city ? 'border-red-500' : 'border-[#3a3a3a]'
                } rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0D6B4D] focus:border-transparent`}
                placeholder="City"
              />
              {errors.city && (
                <p className="text-red-500 text-xs mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-1">
                State <span className="text-[#0D6B4D]">*</span>
              </label>
              <input
                type="text"
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className={`w-full bg-[#1a1a1a] border ${
                  errors.state ? 'border-red-500' : 'border-[#3a3a3a]'
                } rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0D6B4D] focus:border-transparent`}
                placeholder="State"
              />
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">{errors.state}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-300 mb-1">
                ZIP Code <span className="text-[#0D6B4D]">*</span>
              </label>
              <input
                type="text"
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className={`w-full bg-[#1a1a1a] border ${
                  errors.zipCode ? 'border-red-500' : 'border-[#3a3a3a]'
                } rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0D6B4D] focus:border-transparent`}
                placeholder="12345"
              />
              {errors.zipCode && (
                <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>
              )}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-1">
                Country <span className="text-[#0D6B4D]">*</span>
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className={`w-full bg-[#1a1a1a] border ${
                  errors.country ? 'border-red-500' : 'border-[#3a3a3a]'
                } rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#0D6B4D] focus:border-transparent`}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="MX">Mexico</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
              {errors.country && (
                <p className="text-red-500 text-xs mt-1">{errors.country}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-semibold rounded-lg px-4 py-2 transition-colors"
            >
              Continue to Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

