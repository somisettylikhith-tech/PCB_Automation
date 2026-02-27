
import { DesignData } from '../types';
import { getKiCadDefinition, KiCadDefinition } from './componentLibrary';

/**
 * KiCad Generator
 * Generates valid .kicad_pcb and .kicad_sch files compatible with KiCad 6.0+
 */

const uuid = () => crypto.randomUUID();

// --- SCHEMATIC GENERATOR ---

export const generateSchematic = (data: DesignData): string => {
  const HEADER = `(kicad_sch (version 20211123) (generator pcb_ai_web)

  (uuid ${uuid()})

  (paper "A4")
  (title_block
    (title "${data.projectName}")
    (date "${new Date().toISOString().split('T')[0]}")
    (rev "1.0")
    (company "PCB AI Design Automation")
  )
`;

  let libSymbols = '(lib_symbols\n';
  let symbols = '';
  
  // Track unique definitions to avoid duplicate library entries
  const usedDefs = new Set<string>();

  // Simple Auto-Layout for Schematic
  let x = 40;
  let y = 40;
  const colWidth = 40;
  const rowHeight = 30;
  const maxX = 250;

  data.components.forEach((comp) => {
    const def = getKiCadDefinition(comp.type, comp.package);
    
    // 1. Add to Library Table if new
    if (!usedDefs.has(def.libId)) {
      usedDefs.add(def.libId);
      libSymbols += generateLibSymbol(def);
    }

    // 2. Place Component Instance
    symbols += `
  (symbol (lib_id "${def.libId}") (at ${x.toFixed(2)} ${y.toFixed(2)} 0) (unit 1)
    (in_bom yes) (on_board yes) (dnp no)
    (uuid "${uuid()}")
    (property "Reference" "${comp.name}" (at ${x} ${y-5} 0)
      (effects (font (size 1.27 1.27)))
    )
    (property "Value" "${comp.value}" (at ${x} ${y+5} 0)
      (effects (font (size 1.27 1.27)))
    )
    (property "Footprint" "${def.footprint}" (at ${x} ${y+7} 0)
      (effects (font (size 1.27 1.27)) hide)
    )
  )
    `;

    // Move cursor
    x += colWidth;
    if (x > maxX) {
      x = 40;
      y += rowHeight;
    }
  });

  libSymbols += '  )\n';

  return HEADER + libSymbols + symbols + '\n)';
};

const generateLibSymbol = (def: KiCadDefinition): string => {
  // Generates a self-contained symbol definition so the user doesn't need external libs
  const pinText = def.pins.map((pin, i) => {
    // Distribute pins around a rectangle
    const side = i % 2 === 0 ? -5.08 : 5.08;
    const y = Math.floor(i / 2) * -2.54; 
    
    return `
      (pin ${pin.type} line (at ${side === -5.08 ? -7.62 : 7.62} ${y} 0) (length 2.54)
        (name "${pin.name}" (effects (font (size 1.27 1.27))))
        (number "${pin.number}" (effects (font (size 1.27 1.27))))
      )`;
  }).join('\n');

  const height = Math.max(5.08, Math.ceil(def.pins.length / 2) * 2.54);
  
  return `
    (symbol "${def.libId}" (in_bom yes) (on_board yes)
      (property "Reference" "${def.designatorPrefix}" (at 0 0 0) (effects (font (size 1.27 1.27))))
      (property "Value" "${def.libId}" (at 0 0 0) (effects (font (size 1.27 1.27))))
      (symbol "${def.libId}_1_1"
        (rectangle (start -5.08 2.54) (end 5.08 ${-height}) (stroke (width 0.254) (type default) (color 0 0 0 0)) (fill (type background)))
        ${pinText}
      )
    )
  `;
};


// --- PCB GENERATOR ---

export const generatePCB = (data: DesignData): string => {
  const w = data.boardDimensions.width;
  const h = data.boardDimensions.height;

  let pcb = `(kicad_pcb (version 20211014) (generator pcb_ai_web)

  (general
    (thickness 1.6)
  )

  (layers
    (0 "F.Cu" signal)
    (31 "B.Cu" signal)
    (32 "B.Adhes" user)
    (33 "F.Adhes" user)
    (34 "B.Paste" user)
    (35 "F.Paste" user)
    (36 "B.SilkS" user)
    (37 "F.SilkS" user)
    (38 "B.Mask" user)
    (39 "F.Mask" user)
    (44 "Edge.Cuts" user)
  )

  (setup
    (stackup
      (layer "F.SilkS" (type "Top Silk Screen"))
      (layer "F.Paste" (type "Top Solder Paste"))
      (layer "F.Mask" (type "Top Solder Mask") (color "green"))
      (layer "F.Cu" (type "copper") (thickness 0.035))
      (layer "B.Cu" (type "copper") (thickness 0.035))
      (layer "B.Mask" (type "Bottom Solder Mask") (color "green"))
    )
  )
  
  (gr_line (start 0 0) (end ${w} 0) (layer "Edge.Cuts") (width 0.1))
  (gr_line (start ${w} 0) (end ${w} ${h}) (layer "Edge.Cuts") (width 0.1))
  (gr_line (start ${w} ${h}) (end 0 ${h}) (layer "Edge.Cuts") (width 0.1))
  (gr_line (start 0 ${h}) (end 0 0) (layer "Edge.Cuts") (width 0.1))
`;

  // 1. Generate Nets Section
  // (kicad_pcb requires nets to be declared first)
  const netMap = new Map<string, number>();
  netMap.set("", 0); // Net 0 is no net
  let netCounter = 1;
  
  data.nets.forEach(net => {
    netMap.set(net.id, netCounter);
    pcb += `  (net ${netCounter} "${net.name}")\n`;
    netCounter++;
  });

  // 2. Place Components
  const padding = 20;
  const cols = Math.ceil(Math.sqrt(data.components.length)) || 1;
  const cellW = (w - padding*2) / cols;
  
  data.components.forEach((comp, i) => {
    const def = getKiCadDefinition(comp.type, comp.package);
    
    let posX = comp.position ? comp.position.x : (padding + (i % cols) * cellW);
    let posY = comp.position ? comp.position.y : (padding + Math.floor(i / cols) * cellW);
    
    if (isNaN(posX)) posX = 10;
    if (isNaN(posY)) posY = 10;

    pcb += `
  (footprint "${def.footprint}" (layer "F.Cu")
    (tedit ${Date.now().toString(16).substring(0,8)}) (tstamp "${uuid()}")
    (at ${posX.toFixed(3)} ${posY.toFixed(3)})
    (descr "${def.description}")
    (attr smd)
    (fp_text reference "${comp.name}" (at 0 -${(def.height/2 + 1).toFixed(2)}) (layer "F.SilkS")
      (effects (font (size 1 1) (thickness 0.15)))
    )
    (fp_text value "${comp.value}" (at 0 ${(def.height/2 + 1).toFixed(2)}) (layer "F.Fab")
      (effects (font (size 1 1) (thickness 0.15)))
    )
    ${generateFootprintPads(def, data, comp.id, netMap)}
  )
    `;
  });

  pcb += `)`;
  return pcb;
};

const generateFootprintPads = (def: KiCadDefinition, data: DesignData, compId: string, netMap: Map<string, number>): string => {
  return def.pins.map((pin, i) => {
    let netId = 0;
    let netName = "";
    
    const matchingNet = data.nets.find(n => 
      (n.connections.includes(compId)) && 
      (n.name.toUpperCase() === pin.name.toUpperCase() || n.name.toUpperCase() === pin.number)
    );

    if (matchingNet) {
        netId = netMap.get(matchingNet.id) || 0;
        netName = matchingNet.name;
    } else {
        const anyNet = data.nets.find(n => n.connections.includes(compId));
        if (anyNet && i === 0) { 
             netId = netMap.get(anyNet.id) || 0;
             netName = anyNet.name;
        }
    }

    const netString = netId > 0 ? `(net ${netId} "${netName}")` : '';

    let px = 0;
    let py = 0;
    let w = 1.5;
    let h = 1.5;
    let shape = 'rect';

    if (def.pins.length <= 2) {
       px = (i === 0) ? -1 : 1;
       w = 1.0; h = 1.2;
    } else if (def.pins.length <= 16) {
       const pitch = 1.27;
       const row = Math.floor(i / (def.pins.length/2)); 
       const idx = i % Math.ceil(def.pins.length/2);
       px = (idx * pitch) - ((def.pins.length/4) * pitch);
       py = (row === 0) ? -2.5 : 2.5;
       w = 0.8; h = 1.5;
    } else {
       const sideLength = Math.ceil(def.pins.length/4);
       const side = Math.floor(i / sideLength);
       const pos = i % sideLength;
       const offset = 3.5;
       if (side === 0) { px = -offset; py = pos - 2; }
       if (side === 1) { py = offset; px = pos - 2; }
       if (side === 2) { px = offset; py = pos - 2; }
       if (side === 3) { py = -offset; px = pos - 2; }
       w = 0.5; h = 0.5;
       shape = 'circle';
    }

    return `(pad "${pin.number}" smd ${shape} (at ${px.toFixed(2)} ${py.toFixed(2)}) (size ${w.toFixed(2)} ${h.toFixed(2)}) (layers "F.Cu" "F.Paste" "F.Mask") ${netString})`;
  }).join('\n');
};
