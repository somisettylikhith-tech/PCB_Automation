
import { DesignData } from '../types';
import { generatePCB, generateSchematic } from './kicadGenerator';
import { getKiCadDefinition } from './componentLibrary';

// --- Downloader Helper ---
const downloadFile = (filename: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// --- KiCad PCB Export ---
export const downloadKiCadPCB = (data: DesignData) => {
  const content = generatePCB(data);
  downloadFile(`${data.projectName.replace(/\s+/g, '_')}.kicad_pcb`, content, 'text/plain');
};

// --- KiCad Schematic Export ---
export const downloadKiCadSchematic = (data: DesignData) => {
  const content = generateSchematic(data);
  downloadFile(`${data.projectName.replace(/\s+/g, '_')}.kicad_sch`, content, 'text/plain');
};

// --- Other Exports ---
export const downloadBOM = (data: DesignData) => {
  const header = "Designator,Component,Value,Package,Footprint,KiCad Lib,Quantity\n";
  const rows = data.components.map(c => {
    const def = getKiCadDefinition(c.type, c.package);
    return `${c.name},${c.type},${c.value},${c.package},${def.footprint},${def.libId},1`;
  }).join('\n');
  
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.projectName}_BOM.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const downloadGerberFiles = (data: DesignData) => {
  const content = "Gerber generation requires a backend CAM processor. \nPlease use the KiCad export to generate production files.";
  downloadFile("README_Gerbers.txt", content, "text/plain");
};
