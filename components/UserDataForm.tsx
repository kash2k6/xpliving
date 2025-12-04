'use client';

import { useState } from 'react';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface UserDataFormProps {
  isOpen: boolean;
  onSubmit: (data: UserData) => void;
  onSkip: () => void;
}

export default function UserDataForm({ isOpen, onSubmit, onSkip }: UserDataFormProps) {
  const [formData, setFormData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UserData, string>>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-2">
          Help Us Personalize Your Experience
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          To help personalize your recommendations, could you share your first and last name? And if you'd like, I can send you exclusive discount codes and tips via email—what's your email address? (Phone number is optional, if you want important updates.)
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Enter your first name"
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
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email Address <span className="text-[#0D6B4D]">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full bg-[#1a1a1a] border ${
                errors.email ? 'border-red-500' : 'border-[#3a3a3a]'
              } rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0D6B4D] focus:border-transparent`}
              placeholder="your.email@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
              Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0D6B4D] focus:border-transparent"
              placeholder="(123) 456-7890"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-[#0D6B4D] hover:bg-[#0b5940] text-white font-semibold rounded-lg px-4 py-2 transition-colors"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-gray-300 font-medium rounded-lg transition-colors"
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

