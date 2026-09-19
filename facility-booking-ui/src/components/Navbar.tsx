import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

interface NavbarProps {
  title: string;
  activeTab?: 'facilities' | 'bookings';
  setActiveTab?: (tab: 'facilities' | 'bookings') => void;
  onHomeClick?: () => void; // <--- Added to handle resetting tabs on single-page views
}

export default function Navbar({ title, activeTab, setActiveTab, onHomeClick }: NavbarProps) {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [email] = useState(localStorage.getItem('userEmail') || 'User');
  const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('lastName') || '');
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('avatarUrl') || '');
  const [userRole] = useState(localStorage.getItem('userRole') || 'USER');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('lastName', lastName);
    localStorage.setItem('avatarUrl', avatarUrl);
    setMessage('Profile details saved successfully!');
    setError('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await API.post('/auth/change-password', { oldPassword, newPassword });
      setMessage('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleLogoClick = () => {
    if (onHomeClick) {
      onHomeClick(); // Resets tab state to 'facilities' if we're on a single-page view
    }
    if (userRole === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <>
      <nav className="bg-slate-900 text-white shadow-md px-6 py-3 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLogoClick}
            className="text-lg font-bold tracking-wide hover:opacity-80 transition text-left focus:outline-none"
          >
            Facility<span className="text-blue-500">Portal</span>
          </button>

          {setActiveTab && (
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveTab('facilities')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  activeTab === 'facilities' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {userRole === 'ADMIN' ? 'My Facilities' : 'Facilities'}
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  activeTab === 'bookings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {userRole === 'ADMIN' ? 'Approval Queue' : 'My Bookings'}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-full transition text-left"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-blue-400" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow">
                {getInitials()}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-200 leading-none">
                {firstName ? `${firstName} ${lastName}` : email.split('@')[0]}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">{userRole}</p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Slide-over Settings Drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Account Settings</h3>
                  <p className="text-xs text-slate-500">Manage profile details & credentials</p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {message && <div className="mb-4 p-2.5 bg-emerald-50 border-l-2 border-emerald-500 text-emerald-700 text-xs rounded">{message}</div>}
              {error && <div className="mb-4 p-2.5 bg-rose-50 border-l-2 border-rose-500 text-rose-700 text-xs rounded">{error}</div>}

              {/* Profile Details Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs mb-8">
                <h4 className="font-bold text-slate-800 text-sm">Personal Info</h4>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Email</label>
                  <input type="text" value={email} disabled className="w-full bg-slate-100 border p-2 rounded text-slate-500 cursor-not-allowed" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border p-2 rounded text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border p-2 rounded text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Profile Picture</label>
                  <div className="flex items-center gap-3 mb-2">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Preview" className="w-10 h-10 rounded-full object-cover border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {getInitials()}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 font-semibold cursor-pointer"
                    />
                  </div>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Or enter Image URL (https://...)"
                    className="w-full border p-2 rounded text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded font-semibold hover:bg-slate-900 transition">
                  Save Details
                </button>
              </form>

              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="space-y-3 text-xs border-t pt-6">
                <h4 className="font-bold text-slate-800 text-sm">Change Password</h4>
                
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Current Password</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full border p-2 rounded text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      {showOldPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border p-2 rounded text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition">
                  Update Password
                </button>
              </form>
            </div>

            <button
              onClick={handleLogout}
              className="w-full border border-rose-300 text-rose-600 hover:bg-rose-50 py-2 rounded text-xs font-bold mt-8 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}