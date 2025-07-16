'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import logger from '@/utils/logger';

interface Beneficiary {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  country?: string;
}

interface BeneficiarySelectorProps {
  onSelect: (beneficiary: Beneficiary) => void;
  selectedBeneficiary?: Beneficiary | null;
  className?: string;
}

export default function BeneficiarySelector({ 
  onSelect, 
  selectedBeneficiary, 
  className = '' 
}: BeneficiarySelectorProps) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/beneficiaries', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBeneficiaries(data.data || []);
      }
    } catch (error: any) {
      logger.apiError('Error fetching beneficiaries', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (beneficiary: Beneficiary) => {
    onSelect(beneficiary);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between"
          >
            <span className={selectedBeneficiary ? 'text-gray-900' : 'text-gray-500'}>
              {selectedBeneficiary ? selectedBeneficiary.name : 'Select a beneficiary'}
            </span>
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </button>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : beneficiaries.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No beneficiaries found</div>
              ) : (
                <div>
                  {beneficiaries.map((beneficiary) => (
                    <button
                      key={beneficiary.id}
                      onClick={() => handleSelect(beneficiary)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{beneficiary.name}</div>
                      <div className="text-sm text-gray-500">
                        {beneficiary.bankName && `${beneficiary.bankName} • `}
                        {beneficiary.country}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => window.open('/beneficiaries', '_blank')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add New
        </button>
      </div>

      {selectedBeneficiary && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div><strong>Name:</strong> {selectedBeneficiary.name}</div>
            {selectedBeneficiary.email && <div><strong>Email:</strong> {selectedBeneficiary.email}</div>}
            {selectedBeneficiary.phoneNumber && <div><strong>Phone:</strong> {selectedBeneficiary.phoneNumber}</div>}
            {selectedBeneficiary.bankName && <div><strong>Bank:</strong> {selectedBeneficiary.bankName}</div>}
            {selectedBeneficiary.accountNumber && <div><strong>Account:</strong> {selectedBeneficiary.accountNumber}</div>}
            {selectedBeneficiary.country && <div><strong>Country:</strong> {selectedBeneficiary.country}</div>}
          </div>
        </div>
      )}
    </div>
  );
} 