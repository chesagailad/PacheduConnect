import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface TransactionConfirmationProps {
  transaction: {
    id: string;
    amount: number;
    currency: string;
    recipientName: string;
    recipientPhone?: string;
    recipientEmail?: string;
    fees: number;
    exchangeRate?: number;
    totalAmount: number;
    createdAt: string;
    estimatedDelivery?: string;
    referenceNumber: string;
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    notes?: string;
  };
  onClose?: () => void;
  onPrint?: () => void;
  onEmail?: () => void;
  className?: string;
}

export const TransactionConfirmation: React.FC<TransactionConfirmationProps> = ({
  transaction,
  onClose,
  onPrint,
  onEmail,
  className = '',
}) => {
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const generateReceipt = async () => {
    setIsGeneratingReceipt(true);
    
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Pachedu Remittance', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('Transaction Receipt', 105, 30, { align: 'center' });
      
      // Transaction Details
      doc.setFontSize(10);
      doc.text(`Reference Number: ${transaction.referenceNumber}`, 20, 50);
      doc.text(`Date: ${formatDate(transaction.createdAt)}`, 20, 60);
      
      // Sender Information
      doc.setFontSize(12);
      doc.text('Sender Information', 20, 80);
      doc.setFontSize(10);
      doc.text(`Name: ${transaction.senderName}`, 20, 90);
      doc.text(`Email: ${transaction.senderEmail}`, 20, 100);
      if (transaction.senderPhone) {
        doc.text(`Phone: ${transaction.senderPhone}`, 20, 110);
      }
      
      // Recipient Information
      doc.setFontSize(12);
      doc.text('Recipient Information', 20, 130);
      doc.setFontSize(10);
      doc.text(`Name: ${transaction.recipientName}`, 20, 140);
      if (transaction.recipientPhone) {
        doc.text(`Phone: ${transaction.recipientPhone}`, 20, 150);
      }
      if (transaction.recipientEmail) {
        doc.text(`Email: ${transaction.recipientEmail}`, 20, 160);
      }
      
      // Transaction Summary
      doc.setFontSize(12);
      doc.text('Transaction Summary', 20, 180);
      doc.setFontSize(10);
      doc.text(`Amount: ${formatCurrency(transaction.amount, transaction.currency)}`, 20, 190);
      doc.text(`Fees: ${formatCurrency(transaction.fees, transaction.currency)}`, 20, 200);
      doc.text(`Total: ${formatCurrency(transaction.totalAmount, transaction.currency)}`, 20, 210);
      
      if (transaction.exchangeRate) {
        doc.text(`Exchange Rate: 1 USD = ${transaction.exchangeRate.toFixed(4)} ${transaction.currency}`, 20, 220);
      }
      
      if (transaction.estimatedDelivery) {
        doc.text(`Estimated Delivery: ${formatDate(transaction.estimatedDelivery)}`, 20, 230);
      }
      
      if (transaction.notes) {
        doc.text(`Notes: ${transaction.notes}`, 20, 240);
      }
      
      // Footer
      doc.setFontSize(8);
      doc.text('Thank you for using Pachedu Remittance', 105, 270, { align: 'center' });
      doc.text('For support, contact: support@pachedu.com', 105, 275, { align: 'center' });
      
      // Save the PDF
      doc.save(`receipt-${transaction.referenceNumber}.pdf`);
      
      if (onPrint) {
        onPrint();
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const sendEmailReceipt = async () => {
    try {
      const response = await fetch('/api/transactions/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          email: transaction.senderEmail,
        }),
      });
      
      if (response.ok) {
        alert('Receipt sent to your email successfully!');
        if (onEmail) {
          onEmail();
        }
      } else {
        alert('Failed to send receipt. Please try again.');
      }
    } catch (error) {
      console.error('Error sending receipt:', error);
      alert('Failed to send receipt. Please try again.');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto ${className}`}>
      {/* Success Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Transaction Successful!
        </h2>
        <p className="text-gray-600">
          Your money transfer has been processed successfully.
        </p>
      </div>

      {/* Transaction Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Reference Number:</dt>
                <dd className="text-sm font-medium text-gray-900">{transaction.referenceNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Date:</dt>
                <dd className="text-sm font-medium text-gray-900">{formatDate(transaction.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Amount:</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Fees:</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatCurrency(transaction.fees, transaction.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Total:</dt>
                <dd className="text-sm font-bold text-gray-900">
                  {formatCurrency(transaction.totalAmount, transaction.currency)}
                </dd>
              </div>
            </dl>
          </div>
          
          <div>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Recipient:</dt>
                <dd className="text-sm font-medium text-gray-900">{transaction.recipientName}</dd>
              </div>
              {transaction.recipientPhone && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Phone:</dt>
                  <dd className="text-sm font-medium text-gray-900">{transaction.recipientPhone}</dd>
                </div>
              )}
              {transaction.recipientEmail && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Email:</dt>
                  <dd className="text-sm font-medium text-gray-900">{transaction.recipientEmail}</dd>
                </div>
              )}
              {transaction.exchangeRate && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Exchange Rate:</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    1 USD = {transaction.exchangeRate.toFixed(4)} {transaction.currency}
                  </dd>
                </div>
              )}
              {transaction.estimatedDelivery && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Est. Delivery:</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatDate(transaction.estimatedDelivery)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        
        {transaction.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <dt className="text-sm text-gray-500 mb-1">Notes:</dt>
            <dd className="text-sm text-gray-900">{transaction.notes}</dd>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={generateReceipt}
          disabled={isGeneratingReceipt}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isGeneratingReceipt ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Receipt
            </>
          )}
        </button>
        
        <button
          onClick={sendEmailReceipt}
          className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email Receipt
        </button>
        
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        )}
      </div>

      {/* Additional Information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• You'll receive a confirmation email with transaction details</li>
          <li>• Track your transaction status in real-time</li>
          <li>• Recipient will be notified when money is ready for pickup</li>
          <li>• Contact support if you have any questions</li>
        </ul>
      </div>
    </div>
  );
};

export default TransactionConfirmation; 