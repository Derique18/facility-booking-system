import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'USER';

  const handleLogoClick = () => {
    if (userRole === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickLink = (destination: string) => {
    navigate(destination);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800 mt-auto w-full">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Column 1: Brand Logo */}
        <div className="space-y-4">
          <button 
            onClick={handleLogoClick}
            className="text-xl font-bold text-white tracking-wide hover:opacity-80 transition text-left focus:outline-none"
          >
            Facility<span className="text-blue-500">Portal</span>
          </button>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
            A streamlined system for managing and reserving workspaces, boardrooms, and event centers with ease.
          </p>
        </div>

        {/* Column 2: Quick Links (Now dynamically forwarding to respective pages) */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2 text-xs font-medium">
            {userRole === 'ADMIN' ? (
              <>
                <li>
                  <button 
                    onClick={() => handleQuickLink('/admin?tab=my-facilities')}
                    className="hover:text-blue-400 transition-colors duration-200 text-left"
                  >
                    My Facilities
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleQuickLink('/admin?tab=approvals')}
                    className="hover:text-blue-400 transition-colors duration-200 text-left"
                  >
                    Approval Queue
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <button 
                    onClick={() => handleQuickLink('/dashboard?tab=facilities')}
                    className="hover:text-blue-400 transition-colors duration-200 text-left"
                  >
                    Book a Space
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleQuickLink('/dashboard?tab=bookings')}
                    className="hover:text-blue-400 transition-colors duration-200 text-left"
                  >
                    My Reservations
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Column 3: Connect */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Connect</h4>
          <ul className="space-y-2 text-xs font-medium">
            <li>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-200 flex items-center gap-2">
                <span>💻</span> GitHub
              </a>
            </li>
            <li>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors duration-200 flex items-center gap-2">
                <span>🔗</span> LinkedIn
              </a>
            </li>
            <li>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-sky-400 transition-colors duration-200 flex items-center gap-2">
                <span>🐦</span> Twitter / X
              </a>
            </li>
            <li>
              <a href="mailto:admin@example.com" className="hover:text-emerald-400 transition-colors duration-200 flex items-center gap-2">
                <span>✉️</span> Gmail
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
          <p>© 2026 Facility Booking System. Built with React & Node.js.</p>
          <span className="hidden md:inline">•</span>
          <p className="text-slate-400 font-medium">Built by Engr. Chris-Deniz</p>
        </div>
        
        <div className="flex gap-4">
          <button className="hover:text-slate-300 transition">Privacy Policy</button>
          <button className="hover:text-slate-300 transition">Terms of Service</button>
        </div>
      </div>
    </footer>
  );
}