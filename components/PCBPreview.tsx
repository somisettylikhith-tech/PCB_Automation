
import React, { useMemo, useState } from 'react';
import { DesignData, Component } from '../types';
import { getKiCadDefinition } from '../utils/componentLibrary';

export type ViewMode = 'SCHEMATIC' | 'PCB_2D' | 'PCB_3D';

interface PCBPreviewProps {
  data: DesignData;
  viewMode: ViewMode;
  onSelectComponent?: (component: Component) => void;
  selectedComponentId?: string | null;
  showRoutes?: boolean;
}

const PCBPreview: React.FC<PCBPreviewProps> = ({ 
  data, 
  viewMode,
  onSelectComponent, 
  selectedComponentId,
  showRoutes = false
}) => {
  const [rotation, setRotation] = useState({ x: 60, y: 0, z: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // Handle 3D Rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode === 'PCB_3D') {
      setIsDragging(true);
      setLastMouse({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && viewMode === 'PCB_3D') {
      const deltaX = e.clientX - lastMouse.x;
      const deltaY = e.clientY - lastMouse.y;
      setRotation(prev => ({
        x: Math.max(0, Math.min(90, prev.x - deltaY * 0.5)), // Limit tilt
        y: prev.y,
        z: prev.z + deltaX * 0.5
      }));
      setLastMouse({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Layout Calculations
  const scale = 5; // Pixels per mm
  const padding = 60;
  
  const layoutData = useMemo(() => {
    if (!data.components || data.components.length === 0) return [];

    const cols = Math.ceil(Math.sqrt(data.components.length)) || 1;
    const cellWidth = (data.boardDimensions.width * scale) / cols;
    
    return data.components.map((c, i) => {
      const def = getKiCadDefinition(c.type, c.package);
      let x = 0, y = 0;

      if (c.position) {
        x = c.position.x * scale + padding;
        y = c.position.y * scale + padding;
      } else {
        const row = Math.floor(i / cols);
        const col = i % cols;
        x = padding + col * cellWidth + cellWidth / 2;
        y = padding + row * cellWidth + cellWidth / 2;
      }
      return { ...c, x, y, def };
    });
  }, [data]);

  // Schematic Layout (Grid based)
  const schematicData = useMemo(() => {
    if (!data.components || data.components.length === 0) return [];

    const cols = Math.ceil(Math.sqrt(data.components.length)) || 1;
    const spacingX = 150;
    const spacingY = 120;
    
    return data.components.map((c, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      return {
        ...c,
        sx: 100 + col * spacingX,
        sy: 100 + row * spacingY,
        def: getKiCadDefinition(c.type, c.package)
      };
    });
  }, [data]);

  // Move routes calculation to top level (Fix for React Error #300)
  const routes = useMemo(() => {
    if (!showRoutes) return [];
    const calculatedRoutes: { path: string, netId: string }[] = [];
    data.nets.forEach(net => {
      const points = net.connections
        .map(compId => layoutData.find(c => c.id === compId))
        .filter(c => c !== undefined) as any[];
      if (points.length < 2) return;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        const offset = (parseInt(net.id.replace(/\D/g,'')) || 0) * 4; 
        const midX = (p1.x + p2.x) / 2 + (i % 2 === 0 ? offset : -offset);
        const path = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
        calculatedRoutes.push({ path, netId: net.id });
      }
    });
    return calculatedRoutes;
  }, [layoutData, data.nets, showRoutes]);

  // --- RENDERERS ---

  const renderSchematic = () => {
    return (
      <div className="w-full h-full overflow-auto bg-[#1e293b] relative">
        {/* Blueprint Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <svg className="w-[2000px] h-[2000px] min-w-full min-h-full">
           {/* Schematic Wires */}
           {data.nets.map(net => {
              const comps = net.connections
                .map(id => schematicData.find(c => c.id === id))
                .filter(c => c !== undefined);
              
              if (comps.length < 2) return null;

              // Safe Path Generation
              const paths: React.ReactElement[] = [];
              for(let i=0; i<comps.length-1; i++) {
                const c1 = comps[i];
                const c2 = comps[i+1];
                
                if (!c1 || !c2) continue;

                // Bezier Curve
                const d = `M ${c1.sx + 40} ${c1.sy} C ${c1.sx + 80} ${c1.sy}, ${c2.sx - 80} ${c2.sy}, ${c2.sx - 40} ${c2.sy}`;
                
                paths.push(
                  <path key={`${net.id}-${i}`} d={d} stroke="#60a5fa" strokeWidth="2" fill="none" className="opacity-60 group-hover:opacity-100 transition-opacity" />
                );
              }

              return (
                <g key={net.id} className="group">
                  {paths}
                  {comps.map((c, idx) => (
                     c && <circle key={idx} cx={idx === 0 ? c.sx + 40 : c.sx - 40} cy={c.sy} r="3" fill="#60a5fa" />
                  ))}
                </g>
              );
           })}

           {/* Symbols */}
           {schematicData.map(c => {
             const isSelected = selectedComponentId === c.id;
             return (
               <g key={c.id} transform={`translate(${c.sx}, ${c.sy})`} onClick={() => onSelectComponent?.(c)} className="cursor-pointer">
                  <rect x="-40" y="-30" width="80" height="60" fill={isSelected ? "#334155" : "#0f172a"} stroke={isSelected ? "#34d399" : "#cbd5e1"} strokeWidth="2" rx="4" />
                  <text x="0" y="-10" textAnchor="middle" fill="#e2e8f0" className="text-xs font-bold font-mono pointer-events-none">{c.name}</text>
                  <text x="0" y="10" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-mono pointer-events-none">{c.value}</text>
                  <text x="0" y="25" textAnchor="middle" fill="#64748b" className="text-[8px] font-mono pointer-events-none">{c.package}</text>
                  
                  {/* Pins */}
                  <line x1="-40" y1="0" x2="-45" y2="0" stroke="#cbd5e1" strokeWidth="2" />
                  <line x1="40" y1="0" x2="45" y2="0" stroke="#cbd5e1" strokeWidth="2" />
               </g>
             );
           })}
        </svg>
      </div>
    );
  };

  const renderPCB2D = () => {
    const width = data.boardDimensions.width * scale + padding * 2;
    const height = data.boardDimensions.height * scale + padding * 2;

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 overflow-auto bg-zinc-950/50">
        <div className="relative group">
          <div className="absolute -inset-4 bg-emerald-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <div className="relative rounded-xl shadow-2xl p-1 glass-panel">
            <svg
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              className="rounded bg-[#0f1510] shadow-inner cursor-crosshair"
            >
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f331f" strokeWidth="0.5" />
                  <circle cx="1" cy="1" r="0.5" fill="#2a4a2a" />
                </pattern>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <rect x={padding} y={padding} width={data.boardDimensions.width * scale} height={data.boardDimensions.height * scale} fill="url(#grid)" rx="6" stroke="#2a4a2a" strokeWidth="2" />
              
              {showRoutes ? (
                <g className="routes" filter="url(#glow)">
                    {routes.map((route, i) => (
                    <path key={i} d={route.path} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 hover:opacity-100 hover:stroke-emerald-300 transition-colors" />
                    ))}
                </g>
                ) : (
                data.nets.map((net) => {
                    const points = net.connections.map(compId => layoutData.find(c => c.id === compId)).filter(c => c !== undefined) as any[];
                    if (points.length < 2) return null;
                    return (
                    <g key={net.id} className="opacity-40 hover:opacity-100 transition-opacity">
                        {points.slice(0, -1).map((p, i) => (
                        <line key={`${net.id}-${i}`} x1={p.x} y1={p.y} x2={points[i + 1].x} y2={points[i + 1].y} stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 2" />
                        ))}
                    </g>
                    );
                })
                )}

              {layoutData.map((comp) => {
                const isSelected = selectedComponentId === comp.id;
                const w = comp.def.width * scale;
                const h = comp.def.height * scale;
                return (
                  <g key={comp.id} transform={`translate(${comp.x}, ${comp.y})`} onClick={(e) => { e.stopPropagation(); onSelectComponent?.(comp); }} className="cursor-pointer hover:scale-105 transition-transform">
                    {isSelected && <rect x={-w/2 - 4} y={-h/2 - 4} width={w + 8} height={h + 8} fill="none" stroke="#10b981" strokeWidth="1.5" rx="4" className="animate-pulse" />}
                    <rect x={-w/2} y={-h/2} width={w} height={h} fill={isSelected ? "#27272a" : "#18181b"} stroke={isSelected ? "#10b981" : "#52525b"} strokeWidth="1.5" rx="2" />
                    {comp.def.pins.length <= 2 ? (
                        <>
                            <rect x={-w/2 - 1} y={-h/2} width={w/4} height={h} fill="#ca8a04" />
                            <rect x={w/2 - w/4 + 1} y={-h/2} width={w/4} height={h} fill="#ca8a04" />
                        </>
                    ) : (
                        <>
                            <circle cx={-w/2 + 2} cy={-h/2 + 2} r="1" fill="#fff" opacity="0.5" />
                            <rect x={-w/2 - 1} y={-h/2} width={1} height={h} fill="#ca8a04" opacity="0.7" />
                            <rect x={w/2} y={-h/2} width={1} height={h} fill="#ca8a04" opacity="0.7" />
                        </>
                    )}
                    <text x="0" y={-h/2 - 4} textAnchor="middle" fontSize="10" fill={isSelected ? "#10b981" : "#a1a1aa"} className="font-mono font-bold select-none">{comp.name}</text>
                    <text x="0" y={h/2 + 8} textAnchor="middle" fontSize="8" fill="#52525b" className="font-mono select-none">{comp.value}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    );
  };

  const renderPCB3D = () => {
    // 3D Scale Factor
    const s3d = 3; 
    const boardW = data.boardDimensions.width * s3d;
    const boardH = data.boardDimensions.height * s3d;
    
    return (
      <div 
        className="w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-900 to-black cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="perspective-container relative w-full h-full flex items-center justify-center" style={{ perspective: '1000px' }}>
          <div 
            className="scene-3d relative transition-transform duration-75 ease-out"
            style={{ 
              transformStyle: 'preserve-3d',
              transform: `rotateX(${rotation.x}deg) rotateZ(${rotation.z}deg) rotateY(${rotation.y}deg)` 
            }}
          >
            {/* PCB BOARD VOLUME */}
            <div 
              className="absolute bg-[#064e3b] border-2 border-[#047857]/50 shadow-[0_0_50px_rgba(6,78,59,0.5)]"
              style={{
                width: boardW,
                height: boardH,
                transform: `translate(-50%, -50%) translateZ(0px)`,
                borderRadius: '4px',
                backgroundImage: 'repeating-linear-gradient(45deg, #065f46 0, #065f46 1px, transparent 0, transparent 50%)',
                backgroundSize: '10px 10px'
              }}
            >
                {/* Copper Traces Layer (Fake) */}
                <div className="absolute inset-0 opacity-20" style={{ 
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 20 L40 20 M20 0 L20 40\' stroke=\'%23fbbf24\' stroke-width=\'1\'/%3E%3C/svg%3E")',
                    backgroundSize: '30px 30px'
                }}></div>
            </div>
            
            {/* Board Thickness Side */}
            <div 
                className="absolute bg-[#022c22]"
                style={{
                    width: boardW,
                    height: '4px',
                    transform: `translate(-50%, -50%) translateY(${boardH/2}px) rotateX(-90deg) translateZ(2px)`
                }}
            ></div>
            <div 
                className="absolute bg-[#022c22]"
                style={{
                    height: boardH,
                    width: '4px',
                    transform: `translate(-50%, -50%) translateX(${boardW/2}px) rotateY(90deg) translateZ(2px)`
                }}
            ></div>

            {/* COMPONENTS */}
            {layoutData.map(c => {
                const w = c.def.width * s3d;
                const h = c.def.height * s3d;
                // Safeguard against missing zHeight (default to 0.5mm)
                const z = (c.def.zHeight || 0.5) * s3d * 2; 
                
                // Calculate positions with safety checks
                let px = (c.x - padding) / scale * s3d - boardW/2;
                let py = (c.y - padding) / scale * s3d - boardH/2;

                if (isNaN(px)) px = 0;
                if (isNaN(py)) py = 0;

                const isSelected = selectedComponentId === c.id;

                const colorTop = isSelected ? '#34d399' : '#18181b';
                const colorSide = isSelected ? '#059669' : '#27272a';

                return (
                    <div 
                        key={c.id}
                        className="absolute"
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 2px)` 
                        }}
                    >
                        {/* Shadow */}
                        <div className="absolute top-0 left-0 bg-black/50 blur-sm" style={{ width: w, height: h, transform: `translate(-50%, -50%)` }}></div>
                        
                        {/* 3D Component Volume Construction */}
                        <div style={{ transformStyle: 'preserve-3d', transform: 'translate(-50%, -50%)' }}>
                            {/* TOP */}
                            <div 
                                className="absolute flex items-center justify-center border border-zinc-700"
                                style={{ 
                                    width: w, height: h, 
                                    background: colorTop,
                                    transform: `translateZ(${z.toFixed(2)}px)`
                                }}
                            >
                                <span className="text-[6px] text-zinc-400 font-mono rotate-180 select-none">{c.name}</span>
                            </div>
                            
                            {/* FRONT */}
                            <div className="absolute" style={{ width: w, height: z, background: colorSide, transform: `translateY(${h/2}px) rotateX(-90deg) translateZ(${z/2}px)` }}>
                                {/* Pins Graphic: Adaptive based on width */}
                                <div className="w-full h-full flex justify-between px-[10%]">
                                    <div className="w-[10%] h-full bg-[#ca8a04]"></div>
                                    <div className="w-[10%] h-full bg-[#ca8a04]"></div>
                                </div>
                            </div>
                            
                            {/* BACK */}
                            <div className="absolute" style={{ width: w, height: z, background: colorSide, transform: `translateY(-${h/2}px) rotateX(90deg) translateZ(${z/2}px)` }}></div>
                            
                            {/* LEFT */}
                            <div className="absolute" style={{ width: z, height: h, background: colorSide, transform: `translateX(-${w/2}px) rotateY(-90deg) translateZ(${z/2}px)` }}></div>
                            
                            {/* RIGHT */}
                            <div className="absolute" style={{ width: z, height: h, background: colorSide, transform: `translateX(${w/2}px) rotateY(90deg) translateZ(${z/2}px)` }}></div>
                        </div>
                    </div>
                );
            })}
          </div>
        </div>

        {/* 3D Controls Hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-2 rounded-full text-xs text-zinc-400 border border-zinc-800 pointer-events-none">
            Click & Drag to Rotate • 3D Visualization Mode
        </div>
      </div>
    );
  };

  return (
    <>
        {viewMode === 'SCHEMATIC' && renderSchematic()}
        {viewMode === 'PCB_2D' && renderPCB2D()}
        {viewMode === 'PCB_3D' && renderPCB3D()}
    </>
  );
};

export default PCBPreview;
