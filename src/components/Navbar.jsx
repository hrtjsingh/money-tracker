import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Home, Clock, LogOut, IndianRupee, Menu, X, Lock } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
          <Link
              to="/"
              className={`flex items-center`}
            >
            <img
              src="/logo.png"
              alt="MoneyTracker"
              className="h-8 w-8 text-indigo-600"
            />
            <span className="ml-2 text-xl font-bold text-gray-900 ">
              Hisaab
            </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/")
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Link>

            <Link
              to="/pending"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/pending")
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              <Clock className="h-4 w-4 mr-2" />
              Pending
            </Link>

            <Link
              to="/close-requests"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/close-requests")
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              <Lock className="h-4 w-4 mr-2" />
              Close Requests
            </Link>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Welcome, {user?.username}
            </span>
            <button
              onClick={logout}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden relative">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 absolute top-0 left-0 w-full bg-white border-[1px] ">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive("/")
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                }`}
              >
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </Link>

              <Link
                to="/pending"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive("/pending")
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                }`}
              >
                <Clock className="h-5 w-5 mr-3" />
                Pending
              </Link>

              <div className="border-t border-gray-200 pt-4">
                <div className="px-3 py-2">
                  <div className="text-base font-medium text-gray-800">
                    {user?.username}
                  </div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
