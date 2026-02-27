
import React, { useState, useEffect } from 'react';
import { AppState } from './types';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DesignStudio from './pages/DesignStudio';
import Auth from './pages/Auth';
import { StoreProvider, useStore } from './context/Store';
import { XCircle, CheckCircle, Info, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeState, setActiveState] = useState<AppState>(AppState.HOME);
  const { user, logout, notifications, dismissNotification, isLoading } = useStore();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user && activeState !== AppState.AUTH) {
      setActiveState(AppState.AUTH);
    }
    // Redirect to home if logged in and on auth page
    if (!isLoading && user && activeState === AppState.AUTH) {
      setActiveState(AppState.HOME);
    }
  }, [user, activeState, isLoading]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <Loader2 size={48} className="text-emerald-500 animate-spin" />
        </div>
      );
    }

    switch (activeState) {
      case AppState.HOME:
        return <Dashboard onNewDesign={() => setActiveState(AppState.DESIGN_STUDIO)} />;
      case AppState.DESIGN_STUDIO:
        return <DesignStudio />;
      case AppState.AUTH:
        return <Auth />;
      default:
        return <Dashboard onNewDesign={() => setActiveState(AppState.DESIGN_STUDIO)} />;
    }
  };

  return (
    <>
      <Layout 
        activeState={activeState} 
        onNavigate={setActiveState} 
        user={user}
        onLogout={logout}
      >
        {renderContent()}
      </Layout>

      {/* Global Notifications Layer */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-full fade-in duration-300 ${
              n.type === 'success' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-100' :
              n.type === 'error' ? 'bg-red-950/80 border-red-800 text-red-100' :
              'bg-zinc-900/80 border-zinc-700 text-zinc-100'
            }`}
          >
            {n.type === 'success' && <CheckCircle size={18} className="text-emerald-400" />}
            {n.type === 'error' && <XCircle size={18} className="text-red-400" />}
            {n.type === 'info' && <Info size={18} className="text-blue-400" />}
            <span className="text-sm font-medium">{n.message}</span>
            <button 
              onClick={() => dismissNotification(n.id)}
              className="ml-2 opacity-50 hover:opacity-100"
            >
              <XCircle size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
