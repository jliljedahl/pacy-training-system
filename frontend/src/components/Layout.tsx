import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

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
            <Link
              to="/projects/new"
              className="premium-button text-white"
            >
              New Project
            </Link>
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
