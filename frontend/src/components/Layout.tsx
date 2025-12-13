import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = location.pathname === '/';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Premium Navigation - Steve Jobs style */}
      <nav className="glass-effect sticky top-0 z-50 border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-20">
            <Link
              to="/"
              className="flex items-center space-x-3 group"
            >
              <div className="relative">
                <Sparkles className="w-7 h-7 text-[#007AFF] transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-[#007AFF] opacity-0 group-hover:opacity-10 rounded-full blur-xl transition-opacity duration-300"></div>
              </div>
              <span className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
                Pacy
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                to="/onboarding"
                className="premium-button text-white"
              >
                Nytt projekt
              </Link>

              {/* User Menu */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {menuOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(false)}
                      />

                      {/* Dropdown */}
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-[#1d1d1f] truncate">
                            {user.user_metadata?.name || 'User'}
                          </p>
                          <p className="text-xs text-[#86868b] truncate">
                            {user.email}
                          </p>
                        </div>

                        <button
                          onClick={handleSignOut}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with generous spacing */}
      <main className={`max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 ${isHome ? 'py-12' : 'py-16'}`}>
        {children}
      </main>
    </div>
  );
}
