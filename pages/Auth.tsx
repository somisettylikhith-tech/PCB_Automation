
import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { Cpu, Mail, Lock, User, ArrowRight, Github, AlertCircle, Loader2 } from 'lucide-react';

const Auth: React.FC = () => {
  const { login, register } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error("Name is required");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        await register(name, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-[#050505]">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] animate-float-slow"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-[100px] animate-float-medium delay-500"></div>
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 glass-card p-8 rounded-[2rem] shadow-2xl animate-float-medium border border-white/5">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-[0_10px_30px_rgba(16,185,129,0.3)] animate-float-fast">
            <Cpu size={36} className="text-white" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-zinc-400 font-medium">
            {isLogin ? 'Enter your credentials to access the studio.' : 'Join the automated hardware revolution.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 fade-in">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Full Name</label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Engineer"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-all text-white placeholder:text-zinc-700 hover:bg-zinc-900"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Email Address</label>
            <div className="relative group">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@pcbai.dev"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-all text-white placeholder:text-zinc-700 hover:bg-zinc-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Password</label>
            <div className="relative group">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-all text-white placeholder:text-zinc-700 hover:bg-zinc-900"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {isLogin ? 'Authenticate' : 'Initialize Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center gap-4 text-zinc-700 my-8">
          <div className="flex-1 h-px bg-zinc-800"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Or connect via</span>
          <div className="flex-1 h-px bg-zinc-800"></div>
        </div>

        <button className="w-full py-3 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all hover:text-white">
          <Github size={20} />
          <span>GitHub</span>
        </button>

        <p className="text-center text-sm text-zinc-500 mt-8">
          {isLogin ? "Need a neural link?" : "Already connected?"}{' '}
          <button 
            onClick={toggleMode}
            className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors ml-1"
          >
            {isLogin ? 'Create Access' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
