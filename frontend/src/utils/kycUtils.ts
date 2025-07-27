import { KYCData } from '../services/kycService';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
};

export const getKYCLevelInfo = (level: string) => {
  const levels = {
    bronze: {
      name: 'Bronze',
      limit: 5000,
      color: 'amber',
      description: 'Basic verification level',
      requirements: ['ID Document', 'Selfie with ID', 'Home Address']
    },
    silver: {
      name: 'Silver',
      limit: 25000,
      color: 'gray',
      description: 'Enhanced verification level',
      requirements: ['Certified ID Copy', 'Proof of Address', 'Job Title']
    },
    gold: {
      name: 'Gold',
      limit: 50000,
      color: 'yellow',
      description: 'Full verification level',
      requirements: ['All previous requirements', 'Additional verification']
    }
  };

  return levels[level as keyof typeof levels] || levels.bronze;
};

export const getNextKYCLevel = (currentLevel: string): string | null => {
  const levelOrder = ['bronze', 'silver', 'gold'];
  const currentIndex = levelOrder.indexOf(currentLevel);
  
  if (currentIndex === -1 || currentIndex === levelOrder.length - 1) {
    return null;
  }
  
  return levelOrder[currentIndex + 1];
};

export const canUpgradeKYC = (kycData: KYCData): boolean => {
  return kycData.status === 'approved' && kycData.level !== 'gold';
};

export const getRemainingLimit = (kycData: KYCData): number => {
  return Math.max(0, kycData.monthlySendLimit - kycData.currentMonthSent);
};

export const getLimitUsagePercentage = (kycData: KYCData): number => {
  if (kycData.monthlySendLimit === 0) return 0;
  return Math.min(100, (kycData.currentMonthSent / kycData.monthlySendLimit) * 100);
};

export const getKYCStatusColor = (status: string): string => {
  switch (status) {
    case 'approved':
      return 'green';
    case 'pending':
      return 'yellow';
    case 'rejected':
      return 'red';
    default:
      return 'gray';
  }
};

export const getKYCStatusIcon = (status: string): string => {
  switch (status) {
    case 'approved':
      return 'check-circle';
    case 'pending':
      return 'clock';
    case 'rejected':
      return 'exclamation-triangle';
    default:
      return 'question-mark-circle';
  }
};

export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and PDF files are allowed' };
  }
  
  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getDaysUntilReset = (resetDate: string): number => {
  const reset = new Date(resetDate);
  const now = new Date();
  const diffTime = reset.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const isKYCExpired = (kycData: KYCData): boolean => {
  if (!kycData.verifiedAt) return false;
  
  const verifiedDate = new Date(kycData.verifiedAt);
  const now = new Date();
  const diffTime = now.getTime() - verifiedDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // KYC expires after 1 year
  return diffDays > 365;
};

export const getKYCProgress = (kycData: KYCData): number => {
  const levelOrder = ['bronze', 'silver', 'gold'];
  const currentIndex = levelOrder.indexOf(kycData.level);
  
  if (currentIndex === -1) return 0;
  
  const progress = ((currentIndex + 1) / levelOrder.length) * 100;
  
  // If current level is approved, show full progress for that level
  if (kycData.status === 'approved') {
    return progress;
  }
  
  // If pending or rejected, show partial progress
  return progress * 0.5;
}; 