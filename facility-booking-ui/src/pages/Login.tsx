import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Forgot Password Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP, 3: New Password
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await API.post('/auth/login', { email, password });
      
      // FIX: Safely handle the response payload regardless of how it's nested
      const responseData = response.data?.data || response.data;
      const user = responseData?.user;
      const token = responseData?.accessToken || responseData?.token;

      if (!token || !user) {
        throw new Error("Invalid response format from server.");
      }

      // Safely save all required items to localStorage
      localStorage.setItem('accessToken', token);
      if (responseData.refreshToken) {
        localStorage.setItem('refreshToken', responseData.refreshToken);
      }
      localStorage.setItem('userId', user.id || ''); 
      localStorage.setItem('userRole', user.role || 'USER');
      localStorage.setItem('userEmail', user.email || email);
      if (user.firstName) localStorage.setItem('firstName', user.firstName);
      if (user.lastName) localStorage.setItem('lastName', user.lastName);

      // Route based on role
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || err.message || 'Invalid email or password.');
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    try {
      await API.post('/auth/forgot-password', { email: resetEmail });
      setResetMessage('A 6-digit OTP code has been sent to your email.');
      setForgotStep(2);
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Failed to send OTP. Please check email.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    try {
      await API.post('/auth/verify-otp', { email: resetEmail, otp });
      setResetMessage('OTP verified! Enter your new password.');
      setForgotStep(3);
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Invalid or expired OTP code.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    try {
      await API.post('/auth/reset-password', { email: resetEmail, otp, newPassword });
      alert('Password reset successful! Please log in with your new password.');
      setIsForgotOpen(false);
      setForgotStep(1);
      setResetEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-1">Facility Booking System</h2>
        <p className="text-center text-xs text-slate-500 mb-6">Sign in to manage reservations</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setIsForgotOpen(true);
                  setResetEmail(email);
                }}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 z-10"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm shadow transition"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-semibold">
            Register here
          </Link>
        </p>
      </div>

      {/* Forgot Password OTP Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4">
              {forgotStep === 1 && 'Enter your account email to receive a 6-digit OTP code.'}
              {forgotStep === 2 && 'Enter the 6-digit OTP sent to your email.'}
              {forgotStep === 3 && 'Enter your new account password.'}
            </p>

            {resetMessage && (
              <div className="mb-3 p-2 bg-emerald-50 border-l-2 border-emerald-500 text-emerald-700 text-xs rounded">
                {resetMessage}
              </div>
            )}
            {resetError && (
              <div className="mb-3 p-2 bg-rose-50 border-l-2 border-rose-500 text-rose-700 text-xs rounded">
                {resetError}
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-lg text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="user@example.com"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-3 py-1.5 border rounded-lg text-slate-600 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Send OTP
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">6-Digit OTP Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-lg text-xs text-slate-900 bg-white tracking-widest text-center font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="123456"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="px-3 py-1.5 border rounded-lg text-slate-600 font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Verify OTP
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-300 p-2 rounded-lg text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-[10px] font-semibold text-slate-600 hover:text-slate-900 z-10"
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full border border-slate-300 p-2 rounded-lg text-xs text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-[10px] font-semibold text-slate-600 hover:text-slate-900 z-10"
                    >
                      {showConfirmNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-3 py-1.5 border rounded-lg text-slate-600 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}