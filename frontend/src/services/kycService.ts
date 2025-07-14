import axios from 'axios';

export interface KYCData {
  id: string;
  level: 'bronze' | 'silver' | 'gold';
  status: 'pending' | 'approved' | 'rejected';
  monthlySendLimit: number;
  currentMonthSent: number;
  resetDate: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface KYCUploadData {
  idDocument?: File;
  selfieWithId?: File;
  certifiedIdDocument?: File;
  proofOfAddress?: File;
  homeAddress?: string;
  jobTitle?: string;
}

export interface SendLimitCheck {
  canSend: boolean;
  monthlyLimit: number;
  currentMonthSent: number;
  remainingLimit: number;
  kycLevel: string;
  kycStatus: string;
}

class KYCService {
  private baseURL = '/api/kyc';

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getMultipartHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  async getKYCStatus(): Promise<KYCData> {
    try {
      const response = await axios.get(`${this.baseURL}/status`, {
        headers: this.getAuthHeaders(),
      });
      return response.data.kyc;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch KYC status');
      }
      throw new Error('Failed to fetch KYC status');
    }
  }

  async uploadBronzeDocuments(data: FormData): Promise<{ message: string; status: string }> {
    try {
      const response = await axios.post(`${this.baseURL}/upload-bronze`, data, {
        headers: this.getMultipartHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to upload Bronze documents');
      }
      throw new Error('Failed to upload Bronze documents');
    }
  }

  async uploadSilverDocuments(data: FormData): Promise<{ message: string; status: string }> {
    try {
      const response = await axios.post(`${this.baseURL}/upload-silver`, data, {
        headers: this.getMultipartHeaders(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to upload Silver documents');
      }
      throw new Error('Failed to upload Silver documents');
    }
  }

  async checkSendLimit(amount: number): Promise<SendLimitCheck> {
    try {
      const response = await axios.post(`${this.baseURL}/check-send-limit`, 
        { amount },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to check send limit');
      }
      throw new Error('Failed to check send limit');
    }
  }

  async updateSentAmount(amount: number): Promise<{ message: string; currentMonthSent: number }> {
    try {
      const response = await axios.post(`${this.baseURL}/update-sent-amount`, 
        { amount },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update sent amount');
      }
      throw new Error('Failed to update sent amount');
    }
  }
}

export const kycService = new KYCService();
export default kycService; 