
import React from 'react';
import { AppState, User } from '../types';
import { Cpu, LogIn, LogOut, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeState: AppState;
  onNavigate: (state: AppState) => void;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeState, onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Navbar */}
      <header className="h-16 px-6 flex items-center justify-between sticky top-0 z-50 glass-panel border-b-0 border-b-zinc-800/50">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate(AppState.HOME)}
        >
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Cpu size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
            PCB <span className="text-emerald-500">AI</span>
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/50 p-1 rounded-full border border-zinc-800/50 backdrop-blur-sm">
          <button 
            onClick={() => onNavigate(AppState.HOME)}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeState === AppState.HOME 
                ? 'bg-zinc-800 text-white shadow-md' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => onNavigate(AppState.DESIGN_STUDIO)}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeState === AppState.DESIGN_STUDIO 
                ? 'bg-zinc-800 text-white shadow-md' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            Design Studio
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-zinc-200">{user.name}</p>
                <div className={`flex items-center justify-end gap-1 text-[10px] font-mono ${user.role === 'admin' ? 'text-purple-400' : 'text-emerald-500'}`}>
                  {user.role === 'admin' && <ShieldCheck size={10} />}
                  <span>{user.role === 'admin' ? 'ADMIN ACCESS' : 'PRO ACCOUNT'}</span>
                </div>
              </div>
              <div className="h-8 w-px bg-zinc-800 mx-1"></div>
              <button 
                onClick={onLogout}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-full transition-all"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onNavigate(AppState.AUTH)}
              className="flex items-center gap-2 px-5 py-2 bg-white text-zinc-950 rounded-full text-sm font-bold hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
            >
              <LogIn size={16} />
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
