import { useEffect, useState } from 'react';
import { apiClient } from '@/utils/api';
import { KYC, User } from '@/types';
import toast from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface KYCWithUser extends KYC {
  user: User;
}

export default function AdminKYCPage() {
  const [kycRequests, setKycRequests] = useState<KYCWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKYC();
  }, []);

  async function fetchKYC() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getKYCRequests({ status: 'pending' });
      // Filter for Silver/Gold only
      setKycRequests(res.data.filter((k: KYCWithUser) => k.level !== 'bronze'));
    } catch (err: any) {
      setError('Failed to load KYC requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await apiClient.approveKYC(id, {});
      toast.success('KYC approved');
      fetchKYC();
    } catch {
      toast.error('Failed to approve KYC');
    }
  }

  async function handleReject(id: string) {
    try {
      await apiClient.rejectKYC(id, 'Rejected by admin');
      toast.success('KYC rejected');
      fetchKYC();
    } catch {
      toast.error('Failed to reject KYC');
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading KYC requests...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">KYC Requests (Silver/Gold)</h2>
      <div className="card">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">User</th>
              <th className="px-4 py-2 border">Level</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Submitted At</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {kycRequests.map((k) => (
              <tr key={k.id}>
                <td className="px-4 py-2 border">{k.user?.name || '-'}</td>
                <td className="px-4 py-2 border">{k.level}</td>
                <td className="px-4 py-2 border">{k.status}</td>
                <td className="px-4 py-2 border">{new Date(k.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 border">
                  <button className="btn btn-success btn-xs mr-2" onClick={() => handleApprove(k.id)}>
                    <CheckCircleIcon className="h-4 w-4 mr-1" /> Approve
                  </button>
                  <button className="btn btn-danger btn-xs" onClick={() => handleReject(k.id)}>
                    <XCircleIcon className="h-4 w-4 mr-1" /> Reject
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