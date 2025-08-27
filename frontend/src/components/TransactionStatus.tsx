import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface TransactionStatusProps {
  transactionId: string;
  initialStatus?: string;
  onStatusChange?: (status: string, details: any) => void;
  showDetails?: boolean;
  className?: string;
}

export interface TransactionDetails {
  id: string;
  status: string;
  amount: number;
  currency: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  fees: number;
  exchangeRate?: number;
  notes?: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: '⏳',
    description: 'Transaction is being processed',
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '🔄',
    description: 'Transaction is being verified and processed',
  },
  approved: {
    label: 'Approved',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '✅',
    description: 'Transaction has been approved and is being sent',
  },
  sent: {
    label: 'Sent',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '📤',
    description: 'Money has been sent to recipient',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '💸',
    description: 'Money has been delivered to recipient',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: '❌',
    description: 'Transaction failed',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: '🚫',
    description: 'Transaction was cancelled',
  },
  refunded: {
    label: 'Refunded',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: '↩️',
    description: 'Transaction has been refunded',
  },
};

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  transactionId,
  initialStatus = 'pending',
  onStatusChange,
  showDetails = true,
  className = '',
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001', {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('authToken'),
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to transaction status WebSocket');
      
      // Subscribe to transaction updates
      socket.emit('subscribe-transaction', { transactionId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from transaction status WebSocket');
    });

    socket.on('transaction-update', (data: { transactionId: string; status: string; details: TransactionDetails }) => {
      if (data.transactionId === transactionId) {
        setStatus(data.status);
        setDetails(data.details);
        setLastUpdate(new Date());
        
        if (onStatusChange) {
          onStatusChange(data.status, data.details);
        }
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Fetch initial transaction details
    fetchTransactionDetails();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unsubscribe-transaction', { transactionId });
        socketRef.current.disconnect();
      }
    };
  }, [transactionId]);

  const fetchTransactionDetails = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDetails(data);
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={`border rounded-lg p-4 ${config.bgColor} ${config.borderColor} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className={`text-lg font-semibold ${config.color}`}>
              {config.label}
            </h3>
            <p className="text-sm text-gray-600">
              {config.description}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {showDetails && details && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Transaction Details</h4>
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Amount:</dt>
                  <dd className="text-sm font-medium">
                    {formatCurrency(details.amount, details.currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Fees:</dt>
                  <dd className="text-sm font-medium">
                    {formatCurrency(details.fees, details.currency)}
                  </dd>
                </div>
                {details.exchangeRate && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Exchange Rate:</dt>
                    <dd className="text-sm font-medium">
                      1 USD = {details.exchangeRate.toFixed(4)} {details.currency}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Created:</dt>
                  <dd className="text-sm font-medium">
                    {formatDate(details.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recipient</h4>
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Name:</dt>
                  <dd className="text-sm font-medium">{details.recipientName}</dd>
                </div>
                {details.recipientPhone && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Phone:</dt>
                    <dd className="text-sm font-medium">{details.recipientPhone}</dd>
                  </div>
                )}
                {details.recipientEmail && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Email:</dt>
                    <dd className="text-sm font-medium">{details.recipientEmail}</dd>
                  </div>
                )}
                {details.estimatedDelivery && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Est. Delivery:</dt>
                    <dd className="text-sm font-medium">
                      {formatDate(details.estimatedDelivery)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          
          {details.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
              <p className="text-sm text-gray-600">{details.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionStatus; 