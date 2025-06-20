import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, XCircle, IndianRupee } from 'lucide-react';

const PendingEntries = () => {
  const [pendingEntries, setPendingEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingEntries();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchPendingEntries, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingEntries = async () => {
    try {
      const response = await axios.get('/entries/pending');
      setPendingEntries(response.data);
    } catch (error) {
      toast.error('Failed to fetch pending entries');
    } finally {
      setLoading(false);
    }
  };

  const handleEntryAction = async (entryId, status) => {
    try {
      await axios.patch(`/entries/${entryId}`, { status });
      toast.success(`Entry ${status}!`);
      // Refresh pending entries
      fetchPendingEntries();
    } catch (error) {
      toast.error(`Failed to ${status} entry`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600 mt-2">Review and approve entries that require your confirmation</p>
      </div>

      {pendingEntries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending entries</h3>
          <p className="mt-1 text-sm text-gray-500">All caught up! No entries require your approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingEntries.map((entry) => (
            <div key={entry._id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-yellow-400">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-2">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      ₹{entry.amount.toFixed(2)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending Approval
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">{entry.description}</p>
                    <p className="text-gray-600">
                      {(entry.type || 'debt') === 'debt' ? (
                        <>
                          <span className="font-medium">{entry.creditor.username}</span> says you owe this amount
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{entry.debtor.username}</span> says they paid you this amount
                        </>
                      )}
                    </p>
                    {entry.ledgerId && (
                      <p className="text-sm text-gray-500">
                        Ledger: <span className="font-medium">{entry.ledgerId.name}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-500">
                    Requested on {new Date(entry.createdAt).toLocaleDateString()} at{' '}
                    {new Date(entry.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2">
                  <button
                    onClick={() => handleEntryAction(entry._id, 'approved')}
                    className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {(entry.type || 'debt') === 'debt' ? 'Approve' : 'Confirm Payment'}
                  </button>
                  <button
                    onClick={() => handleEntryAction(entry._id, 'rejected')}
                    className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {(entry.type || 'debt') === 'debt' ? 'Reject' : 'Reject Payment'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingEntries;