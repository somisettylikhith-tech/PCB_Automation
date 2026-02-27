
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DesignData, ChatMessage, Component } from '../types';
import { generateDesignFromPrompt, refineDesign } from '../services/geminiService';
import PCBPreview, { ViewMode } from '../components/PCBPreview';
import { useStore } from '../context/Store';
import { downloadGerberFiles, downloadBOM, downloadKiCadPCB, downloadKiCadSchematic } from '../utils/export';
import { 
  Send, Bot, User, Download, FileJson, 
  Settings, Loader2, ChevronRight, Layers, 
  Cpu, Activity, Zap, MousePointer2, CircuitBoard, FileCode2,
  FileDigit, Share2, Box, Grid, Sliders, Undo, Redo
} from 'lucide-react';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'assistant',
  content: 'PCB AI Design Engine Online. I can generate schematic sheets and PCB layouts. Try "Create a mechanical keyboard pcb with RP2040".',
  timestamp: Date.now()
};

const DesignStudio: React.FC = () => {
  const { showNotification } = useStore();
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // History State for Undo/Redo
  const [history, setHistory] = useState<DesignData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Derived Design State
  const design = historyIndex >= 0 ? history[historyIndex] : null;

  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [showRoutes, setShowRoutes] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('PCB_2D');
  
  // New State for Preferences
  const [showPreferences, setShowPreferences] = useState(false);
  const [componentPreferences, setComponentPreferences] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // History Actions
  const addToHistory = (newDesign: DesignData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newDesign);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      showNotification('info', 'Undoing last change');
    }
  }, [historyIndex, showNotification]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      showNotification('info', 'Redoing change');
    }
  }, [historyIndex, history.length, showNotification]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        
        // View Modes
        if (e.key === '1') {
            setViewMode('SCHEMATIC');
            showNotification('info', 'Switched to Schematic View');
        }
        if (e.key === '2') {
            setViewMode('PCB_2D');
            showNotification('info', 'Switched to 2D PCB View');
        }
        if (e.key === '3') {
            setViewMode('PCB_3D');
            showNotification('info', 'Switched to 3D CAD View');
        }

        // Undo/Redo
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            if (e.shiftKey) {
                e.preventDefault();
                redo();
            } else {
                e.preventDefault();
                undo();
            }
        }
        // Windows Redo Alternative
        if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, showNotification]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    try {
      let newDesign: DesignData;
      
      if (!design) {
        // Initial generation with preferences
        newDesign = await generateDesignFromPrompt(userMsg.content, componentPreferences);
        showNotification('success', 'Design generated from library!');
      } else {
        // Refinement with preferences
        newDesign = await refineDesign(design, userMsg.content, componentPreferences);
        showNotification('success', 'Design refined.');
      }

      addToHistory(newDesign);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've updated the ${newDesign.projectName}. \nComponents: ${newDesign.components.length}\nNets: ${newDesign.nets.length}\n\nYou can now export the KiCad files.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      console.error(error);
      showNotification('error', 'Processing failed. Please retry.');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'System error during generation. Please try a simpler prompt.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 overflow-hidden">
      
      {/* LEFT PANEL: Chat / Copilot */}
      <div className="w-80 flex flex-col border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-sm z-20">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <Bot size={18} className="text-emerald-500" />
          <span className="font-bold text-sm tracking-wide">AI Design Engineer</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-emerald-900/50 text-emerald-500'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`rounded-2xl p-3 text-sm max-w-[85%] shadow-lg ${msg.role === 'user' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          {isProcessing && (
            <div className="flex items-center gap-2 text-zinc-500 text-xs px-4">
              <Loader2 size={12} className="animate-spin" />
              <span>Analyzing requirements...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900 transition-all duration-300">
          
          {/* Component Preferences Drawer */}
          {showPreferences && (
            <div className="mb-3 animate-in slide-in-from-bottom-5 fade-in">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider flex items-center gap-1">
                  <Sliders size={10} /> Component Library Constraints
                </label>
                <button onClick={() => setComponentPreferences('')} className="text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer">Clear</button>
              </div>
              <textarea
                value={componentPreferences}
                onChange={(e) => setComponentPreferences(e.target.value)}
                placeholder="E.g., Use 0805 resistors, STM32F103 MCU, and USB-Micro..."
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:ring-1 focus:ring-emerald-500 outline-none resize-none h-20 placeholder:text-zinc-700"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className={`p-3 rounded-xl transition-all border ${showPreferences ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-transparent hover:text-white'}`}
              title="Component Library Settings"
            >
              <Settings size={18} />
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Describe your circuit..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none shadow-inner h-full"
                disabled={isProcessing}
              />
              <button 
                onClick={handleSendMessage}
                disabled={isProcessing || !inputValue.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white disabled:opacity-50 disabled:bg-zinc-800 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER PANEL: Canvas */}
      <div className="flex-1 flex flex-col relative bg-[#09090b]">
        {/* Toolbar */}
        <div className="h-14 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between px-6 backdrop-blur-md z-10">
          
          <div className="flex items-center gap-4">
            {/* View Modes */}
            <div className="flex items-center gap-1 bg-zinc-800/50 p-1 rounded-lg border border-zinc-700/50">
              <button
                  onClick={() => setViewMode('SCHEMATIC')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'SCHEMATIC' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  title="Schematic View (Press 1)"
              >
                  <Grid size={14} />
                  <span className="hidden sm:inline">Schematic</span>
              </button>
              <button
                  onClick={() => setViewMode('PCB_2D')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'PCB_2D' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  title="2D PCB View (Press 2)"
              >
                  <Layers size={14} />
                  <span className="hidden sm:inline">PCB 2D</span>
              </button>
              <button
                  onClick={() => setViewMode('PCB_3D')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'PCB_3D' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  title="3D CAD View (Press 3)"
              >
                  <Box size={14} />
                  <span className="hidden sm:inline">3D CAD</span>
              </button>
            </div>

            {/* Undo / Redo Controls */}
            <div className="flex items-center gap-1">
                <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo size={16} />
                </button>
                <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    title="Redo (Ctrl+Y)"
                >
                    <Redo size={16} />
                </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {design && (
              <>
                <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-zinc-500 mr-4">
                  <Activity size={14} className="text-emerald-500" />
                  <span className="text-zinc-200 font-bold">{design.projectName}</span>
                  <span className="mx-2 text-zinc-700">|</span>
                  <span>{design.components.length} components</span>
                </div>

                <button 
                  onClick={() => setShowRoutes(!showRoutes)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    showRoutes 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50' 
                      : 'bg-zinc-800/50 text-zinc-400 border-transparent hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <CircuitBoard size={14} />
                  {showRoutes ? 'Hide Routes' : 'Show Routes'}
                </button>

                <div className="w-px h-6 bg-zinc-800 mx-2" />

                <div className="flex items-center bg-zinc-800/50 rounded-lg p-1 border border-zinc-800">
                  <button 
                    onClick={() => downloadKiCadSchematic(design)}
                    className="p-2 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group relative"
                    title="Export KiCad Schematic"
                  >
                    <FileDigit size={16} />
                  </button>
                  <button 
                    onClick={() => downloadKiCadPCB(design)}
                    className="p-2 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group relative"
                    title="Export KiCad PCB"
                  >
                    <FileCode2 size={16} />
                  </button>
                  <button 
                    onClick={() => downloadBOM(design)}
                    className="p-2 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group relative"
                    title="Export BOM (CSV)"
                  >
                    <FileJson size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 overflow-hidden relative">
          {design ? (
            <PCBPreview 
              data={design} 
              viewMode={viewMode}
              onSelectComponent={setSelectedComponent}
              selectedComponentId={selectedComponent?.id}
              showRoutes={showRoutes}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 space-y-6">
              <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center animate-float-slow">
                <Layers size={48} className="opacity-50 text-emerald-500" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-zinc-300">Start Designing</p>
                <p className="text-sm text-zinc-500">Use the copilot to generate a schematic & PCB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Inspector */}
      <div className="w-72 border-l border-zinc-800 bg-zinc-900/50 backdrop-blur-sm flex flex-col z-20">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Component Inspector</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {selectedComponent ? (
            <div className="space-y-6 animate-in slide-in-from-right-10 fade-in duration-300">
              <div>
                <h2 className="text-2xl font-black text-white mb-2">{selectedComponent.name}</h2>
                <div className="flex flex-wrap gap-2">
                   <div className="inline-flex items-center px-2.5 py-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                    {selectedComponent.type}
                  </div>
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs font-mono">
                    {selectedComponent.package}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold">Value</label>
                  <div className="p-3 bg-black/40 border border-zinc-800 rounded-lg text-sm text-white font-mono shadow-inner">
                    {selectedComponent.value}
                  </div>
                </div>

                {design && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold">Connectivity</label>
                    <div className="space-y-1.5">
                      {design.nets
                        .filter(n => n.connections.includes(selectedComponent.id))
                        .map(n => (
                          <div key={n.id} className="flex items-center gap-3 text-xs text-zinc-300 p-2 hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-zinc-700 group">
                            <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                               <Zap size={14} />
                            </div>
                            <div className="flex-1">
                                <span className="font-bold block">{n.name}</span>
                                <span className="text-[10px] text-zinc-500 font-mono">{n.connections.length} nodes</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center space-y-4">
              <div className="p-4 rounded-full bg-zinc-800/50">
                <MousePointer2 size={24} className="opacity-50" />
              </div>
              <p className="text-sm px-4">Select a component to view specifications and connectivity</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="text-[10px] text-center text-zinc-600 flex items-center justify-center gap-2">
            <span>PCB AI Engine v2.0</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default DesignStudio;
    