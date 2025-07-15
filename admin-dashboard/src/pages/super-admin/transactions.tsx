import { useEffect, useState } from 'react';
import { apiClient } from '@/utils/api';
import { Transaction } from '@/types';
import { EyeIcon } from '@heroicons/react/24/outline';

export default function SuperAdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getTransactions();
      setTransactions(res.data);
    } catch (err: any) {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading transactions...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Transactions</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Status</th>
              <th>User</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.type}</td>
                <td>{tx.amount}</td>
                <td>{tx.currency}</td>
                <td>{tx.status}</td>
                <td>{tx.sender?.name || tx.recipient?.name || '-'}</td>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
                <td>
                  <button className="btn btn-info btn-xs">
                    <EyeIcon className="h-4 w-4 mr-1" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 