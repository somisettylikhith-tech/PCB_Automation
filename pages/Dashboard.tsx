
import React, { useEffect, useState } from 'react';
import { useStore } from '../context/Store';
import { authService } from '../services/authService';
import { User } from '../types';
import { Plus, Clock, ExternalLink, Trash2, Search, Filter, Cpu, CheckCircle, Activity, Zap, Layers, Users, Shield } from 'lucide-react';

interface DashboardProps {
  onNewDesign: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewDesign }) => {
  const { projects, deleteProject, user } = useStore();
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Fetch admin data if role is admin
  useEffect(() => {
    if (user?.role === 'admin') {
      authService.getAllUsers().then(setAllUsers);
    }
  }, [user]);

  return (
    <div className="flex-1 relative overflow-hidden bg-[#050505]">
      {/* Ambient Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[120px] animate-float-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] animate-float-slow delay-700"></div>
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-purple-900/5 rounded-full blur-[80px] animate-float-medium delay-300"></div>
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto w-full space-y-12 h-full overflow-y-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="animate-float-fast delay-100">
            <h1 className="text-4xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
              Control Center
            </h1>
            <p className="text-zinc-400 font-medium tracking-wide">Orchestrate your hardware designs.</p>
          </div>
          <button 
            onClick={onNewDesign}
            className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 overflow-hidden animate-float-fast delay-200"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-90 transition-transform duration-500">
              <Plus size={18} />
            </div>
            <span className="tracking-wide">New Project</span>
          </button>
        </div>

        {/* Stats/Quick Actions (Floating Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Active Projects', value: projects.length.toString(), color: 'emerald', icon: <Cpu size={24} />, delay: 'delay-100' },
            { label: 'Components', value: '1,248', color: 'blue', icon: <Activity size={24} />, delay: 'delay-200' },
            { label: 'System Status', value: 'Online', color: 'purple', icon: <Zap size={24} />, delay: 'delay-300' }
          ].map((stat, i) => (
            <div 
              key={i} 
              className={`glass-card p-6 rounded-3xl relative overflow-hidden group transition-all duration-500 hover:border-white/10 hover:shadow-2xl animate-float-medium ${stat.delay}`}
            >
              {/* Internal Glow */}
              <div className={`absolute -right-12 -top-12 w-40 h-40 bg-${stat.color}-500/20 rounded-full blur-[50px] group-hover:bg-${stat.color}-500/30 transition-colors`}></div>
              
              <div className="relative z-10 flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400 border border-${stat.color}-500/20`}>
                    {stat.icon}
                  </div>
                  <div className={`w-2 h-2 rounded-full bg-${stat.color}-500 shadow-[0_0_10px_currentColor] animate-pulse`}></div>
                </div>
                <div>
                  <p className="text-5xl font-black text-white tracking-tighter mb-1">{stat.value}</p>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ADMIN SECTION (Protected) */}
        {user?.role === 'admin' && (
          <div className="animate-in slide-in-from-bottom-10 fade-in duration-700">
            <div className="flex items-center gap-3 px-2 mb-4">
              <Shield size={20} className="text-purple-400" />
              <h2 className="text-lg font-bold text-zinc-200">Admin Console</h2>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl border border-purple-500/20 bg-purple-900/5">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-purple-300 font-bold">Registered Users</h3>
                    <p className="text-xs text-purple-400/60 mt-1">Manage system access and roles</p>
                 </div>
                 <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-mono border border-purple-500/30">
                   {allUsers.length} Users Found
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allUsers.map(u => (
                  <div key={u.id} className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 flex items-center gap-3 hover:border-purple-500/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Users size={18} className="text-zinc-400" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm text-zinc-200 truncate">{u.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                    </div>
                    <div className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {u.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Project List */}
        <div className="space-y-6 animate-float-slow delay-500">
          <div className="flex items-center justify-between backdrop-blur-sm bg-zinc-900/30 p-2 rounded-xl border border-zinc-800/50">
            <div className="flex items-center gap-3 px-4">
              <Layers size={20} className="text-zinc-400" />
              <h2 className="text-lg font-bold text-zinc-200">Recent Projects</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-zinc-950/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none w-48 placeholder:text-zinc-600 text-zinc-300 transition-all focus:w-64 focus:bg-zinc-900"
                />
              </div>
              <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {projects.map((project, idx) => (
              <div 
                key={project.id} 
                className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all group cursor-pointer relative overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300">
                    <Cpu size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-200 group-hover:text-white transition-colors">{project.name}</h3>
                    <p className="text-sm text-zinc-500 mt-1">{project.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 pl-16 md:pl-0">
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Last Edited</p>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <Clock size={12} className="text-zinc-500" />
                      <p className="text-xs text-zinc-400 font-mono">{project.createdAt}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-xl text-sm font-medium transition-all text-zinc-300 hover:text-white shadow-lg">
                      <ExternalLink size={14} />
                      Open Studio
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                      className="p-2.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {projects.length === 0 && (
              <div className="text-center py-24 glass-panel rounded-3xl border-dashed border-2 border-zinc-800">
                <p className="text-zinc-500">No projects in orbit. Launch a new one.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
