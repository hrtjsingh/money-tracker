import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, XCircle, IndianRupee, Lock } from 'lucide-react';

const CloseRequests = () => {
  const [closeRequests, setCloseRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCloseRequests();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchCloseRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchCloseRequests = async () => {
    try {
      const response = await axios.get('/entries/close-requests');
      setCloseRequests(response.data);
    } catch (error) {
      toast.error('Failed to fetch close requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAction = async (entryId, action) => {
    try {
      await axios.patch(`/entries/${entryId}`, { action });
      const actionText = action === 'approve_close' ? 'approved' : 'rejected';
      toast.success(`Close request ${actionText}!`);
      // Refresh close requests
      fetchCloseRequests();
    } catch (error) {
      toast.error(`Failed to ${action.replace('_', ' ')}`);
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Close Requests</h1>
        <p className="text-gray-600 mt-2">Review requests to close transactions</p>
      </div>

      {closeRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Lock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No close requests</h3>
          <p className="mt-1 text-sm text-gray-500">All caught up! No transactions require closure approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {closeRequests.map((entry) => (
            <div key={entry._id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-orange-400">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-2">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      ₹{entry.amount.toFixed(2)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Close Requested
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">{entry.description}</p>
                    <p className="text-gray-600">
                      <span className="font-medium">{entry.closeRequestedBy.username}</span> wants to close this transaction
                    </p>
                    <p className="text-sm text-gray-500">
                      Transaction between <span className="font-medium">{entry.creditor.username}</span> and{' '}
                      <span className="font-medium">{entry.debtor.username}</span>
                    </p>
                    {entry.ledgerId && (
                      <p className="text-sm text-gray-500">
                        Ledger: <span className="font-medium">{entry.ledgerId.name}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-500">
                    Close requested on {new Date(entry.closeRequestedAt).toLocaleDateString()} at{' '}
                    {new Date(entry.closeRequestedAt).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2">
                  <button
                    onClick={() => handleCloseAction(entry._id, 'approve_close')}
                    className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Close
                  </button>
                  <button
                    onClick={() => handleCloseAction(entry._id, 'reject_close')}
                    className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Close
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

export default CloseRequests;