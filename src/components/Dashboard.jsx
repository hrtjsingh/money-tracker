import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Users, BookOpen, Search, X } from 'lucide-react';

const Dashboard = () => {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [ledgerName, setLedgerName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchLedgers();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchLedgers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLedgers = async () => {
    try {
      const response = await axios.get('/ledgers');
      setLedgers(response.data);
    } catch (error) {
      toast.error('Failed to fetch ledgers');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`/users/search?query=${query}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchUsers(value);
  };

  const addUser = (user) => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const createLedger = async () => {
    if (!ledgerName.trim()) {
      toast.error('Please enter a ledger name');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setCreating(true);
    try {
      await axios.post('/ledgers', {
        name: ledgerName,
        participantIds: selectedUsers.map(u => u._id)
      });
      
      setShowCreateModal(false);
      setLedgerName('');
      setSelectedUsers([]);
      toast.success('Ledger created successfully!');
      // Refresh ledgers to show new one
      fetchLedgers();
    } catch (error) {
      toast.error('Failed to create ledger');
    } finally {
      setCreating(false);
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
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Ledgers</h1>
          <p className="text-gray-600 mt-2">Manage your money tracking with friends</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Ledger
        </button>
      </div>

      {ledgers.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No ledgers</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new ledger.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Ledger
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {ledgers.map((ledger) => (
            <Link
              key={ledger._id}
              to={`/ledger/${ledger._id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{ledger.name}</h3>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Participants:</span> {ledger.participants.length}
                </p>
                <div className="flex flex-wrap gap-1">
                  {ledger.participants.slice(0, 2).map((participant) => (
                    <span
                      key={participant._id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 truncate max-w-20 sm:max-w-none"
                    >
                      {participant.username}
                    </span>
                  ))}
                  {ledger.participants.length > 2 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      +{ledger.participants.length - 2} more
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created {new Date(ledger.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Ledger Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md sm:w-96 shadow-lg rounded-md bg-white m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Ledger</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ledger Name
                </label>
                <input
                  type="text"
                  value={ledgerName}
                  onChange={(e) => setLedgerName(e.target.value)}
                  className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                  placeholder="Enter ledger name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Participants
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                    placeholder="Search users by username or email"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-300 rounded-md max-h-40 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => addUser(user)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 text-sm sm:text-base"
                      >
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedUsers.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Users:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <span
                          key={user._id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                        >
                          {user.username}
                          <button
                            onClick={() => removeUser(user._id)}
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 sm:py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={createLedger}
                disabled={creating}
                className="flex-1 px-4 py-2 sm:py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-sm sm:text-base"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;