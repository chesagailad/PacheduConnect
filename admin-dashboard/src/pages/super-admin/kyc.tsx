import { useEffect, useState } from 'react';
import { apiClient } from '@/utils/api';
import { KYC, User } from '@/types';
import toast from 'react-hot-toast';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';

interface KYCWithUser extends KYC {
  user: User;
  history?: { status: string; changedAt: string; changedBy: string; comment?: string }[];
}

export default function SuperAdminKYCPage() {
  const [kycRequests, setKycRequests] = useState<KYCWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAdmin, setFilterAdmin] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedKYC, setSelectedKYC] = useState<KYCWithUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchKYC();
  }, []);

  async function fetchKYC() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getKYCRequests({ status: 'pending' });
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
      await apiClient.rejectKYC(id, 'Rejected by super admin');
      toast.success('KYC rejected');
      fetchKYC();
    } catch {
      toast.error('Failed to reject KYC');
    }
  }

  // Filtering and sorting logic for audit trail
  function filterAndSortHistory(history: KYCWithUser['history']) {
    if (!history) return [];
    let filtered = history;
    if (filterAdmin) {
      filtered = filtered.filter(h => h.changedBy.toLowerCase().includes(filterAdmin.toLowerCase()));
    }
    if (filterStatus) {
      filtered = filtered.filter(h => h.status === filterStatus);
    }
    if (filterStart) {
      filtered = filtered.filter(h => new Date(h.changedAt) >= new Date(filterStart));
    }
    if (filterEnd) {
      filtered = filtered.filter(h => new Date(h.changedAt) <= new Date(filterEnd));
    }
    filtered = filtered.sort((a, b) => sortDesc ? new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime() : new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
    return filtered;
  }

  function openModal(kyc: KYCWithUser) {
    setSelectedKYC(kyc);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setSelectedKYC(null);
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
      <div className="mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1">Filter by Admin</label>
          <input type="text" value={filterAdmin} onChange={e => setFilterAdmin(e.target.value)} className="input input-sm" placeholder="Admin name/email" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Filter by Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input input-sm">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Start Date</label>
          <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="input input-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">End Date</label>
          <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="input input-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Sort</label>
          <button className="btn btn-xs" onClick={() => setSortDesc(!sortDesc)}>{sortDesc ? 'Newest First' : 'Oldest First'}</button>
        </div>
      </div>
      <div className="card">
        <table className="min-w-full bg-white border mb-8">
          <thead>
            <tr>
              <th className="px-4 py-2 border">User</th>
              <th className="px-4 py-2 border">Level</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Submitted At</th>
              <th className="px-4 py-2 border">Actions</th>
              <th className="px-4 py-2 border">Audit Trail</th>
            </tr>
          </thead>
          <tbody>
            {kycRequests.map((k) => (
              <tr key={k.id}>
                <td className="px-4 py-2 border">{k.user?.name || '-'}</td>
                <td className="px-4 py-2 border">{k.level}</td>
                <td className="px-4 py-2 border">{k.status}</td>
                <td className="px-4 py-2 border">{new Date(k.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 border flex flex-col gap-2">
                  <button className="btn btn-info btn-xs mb-1" onClick={() => openModal(k)}>
                    <EyeIcon className="h-4 w-4 mr-1" /> View Details
                  </button>
                  <button className="btn btn-success btn-xs mb-1" onClick={() => handleApprove(k.id)}>
                    <CheckCircleIcon className="h-4 w-4 mr-1" /> Approve
                  </button>
                  <button className="btn btn-danger btn-xs" onClick={() => handleReject(k.id)}>
                    <XCircleIcon className="h-4 w-4 mr-1" /> Reject
                  </button>
                </td>
                <td className="px-4 py-2 border">
                  <ul className="text-xs">
                    {k.history && filterAndSortHistory(k.history).length > 0 ? (
                      filterAndSortHistory(k.history).map((h, idx) => (
                        <li key={idx} className="mb-1">
                          <span className="font-semibold">{h.status}</span> by {h.changedBy} at {new Date(h.changedAt).toLocaleString()}
                          {h.comment && <span className="ml-2 italic text-gray-500">({h.comment})</span>}
                        </li>
                      ))
                    ) : (
                      <li>No audit trail</li>
                    )}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* KYC Details Modal */}
      <Transition.Root show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative card text-left shadow-xl transform transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                        KYC Request Details
                      </Dialog.Title>
                      <div className="mt-2">
                        {selectedKYC && (
                          <div>
                            <div className="mb-2">
                              <strong>User:</strong> {selectedKYC.user?.name} ({selectedKYC.user?.email})<br />
                              <strong>Level:</strong> {selectedKYC.level}<br />
                              <strong>Status:</strong> {selectedKYC.status}<br />
                              <strong>Submitted At:</strong> {new Date(selectedKYC.createdAt).toLocaleString()}<br />
                            </div>
                            <div className="mb-2">
                              <strong>Documents:</strong>
                              <ul className="list-disc ml-6">
                                {selectedKYC.documents?.length > 0 ? (
                                  selectedKYC.documents.map((doc, idx) => (
                                    <li key={idx}>
                                      {doc.type} - {doc.status} {doc.fileName && (<span>({doc.fileName})</span>)}
                                    </li>
                                  ))
                                ) : (
                                  <li>No documents</li>
                                )}
                              </ul>
                            </div>
                            <div className="mb-2">
                              <strong>Status History:</strong>
                              <ul className="list-disc ml-6">
                                {selectedKYC.history && selectedKYC.history.length > 0 ? (
                                  filterAndSortHistory(selectedKYC.history).map((h, idx) => (
                                    <li key={idx}>
                                      <span className="font-semibold">{h.status}</span> by {h.changedBy} at {new Date(h.changedAt).toLocaleString()}
                                      {h.comment && <span className="ml-2 italic text-gray-500">({h.comment})</span>}
                                    </li>
                                  ))
                                ) : (
                                  <li>No audit trail</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    {selectedKYC && (
                      <>
                        <button type="button" className="btn btn-success mr-2" onClick={() => { handleApprove(selectedKYC.id); closeModal(); }}>
                          <CheckCircleIcon className="h-4 w-4 mr-1" /> Approve
                        </button>
                        <button type="button" className="btn btn-danger mr-2" onClick={() => { handleReject(selectedKYC.id); closeModal(); }}>
                          <XCircleIcon className="h-4 w-4 mr-1" /> Reject
                        </button>
                      </>
                    )}
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
} 