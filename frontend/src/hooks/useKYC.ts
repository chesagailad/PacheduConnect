import { useState, useEffect, useCallback } from 'react';
import { kycService, KYCData, SendLimitCheck } from '../services/kycService';

interface UseKYCReturn {
  kycData: KYCData | null;
  loading: boolean;
  error: string | null;
  refreshKYC: () => Promise<void>;
  checkSendLimit: (amount: number) => Promise<SendLimitCheck>;
  updateSentAmount: (amount: number) => Promise<void>;
}

export const useKYC = (): UseKYCReturn => {
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKYCStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kycService.getKYCStatus();
      setKycData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch KYC status');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshKYC = useCallback(async () => {
    await fetchKYCStatus();
  }, [fetchKYCStatus]);

  const checkSendLimit = useCallback(async (amount: number): Promise<SendLimitCheck> => {
    try {
      return await kycService.checkSendLimit(amount);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to check send limit');
    }
  }, []);

  const updateSentAmount = useCallback(async (amount: number) => {
    try {
      await kycService.updateSentAmount(amount);
      // Refresh KYC data after updating sent amount
      await fetchKYCStatus();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update sent amount');
    }
  }, [fetchKYCStatus]);

  useEffect(() => {
    fetchKYCStatus();
  }, [fetchKYCStatus]);

  return {
    kycData,
    loading,
    error,
    refreshKYC,
    checkSendLimit,
    updateSentAmount,
  };
}; 