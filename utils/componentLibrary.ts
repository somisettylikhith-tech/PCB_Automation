
// Virtual Library Mapping for KiCad Export
// This acts as the bridge between AI "Natural Language" and KiCad "Technical Specifications"

export interface PinDef {
  number: string;
  name: string;
  type: 'power_in' | 'power_out' | 'input' | 'output' | 'bidirectional' | 'passive';
}

export interface KiCadDefinition {
  libId: string;      // E.g., "Device:R"
  footprint: string;  // E.g., "Resistor_SMD:R_0603_1608Metric"
  description: string;
  datasheet?: string;
  keywords?: string;
  pins: PinDef[];
  designatorPrefix: string;
  // Geometry for web preview (simplified)
  width: number; // mm
  height: number; // mm
  zHeight: number; // mm (New for 3D View)
}

// Helper to generate generic pins
const genPins = (count: number, prefix: string = ''): PinDef[] => 
  Array.from({ length: count }, (_, i) => ({ number: `${i+1}`, name: `${prefix}${i+1}`, type: 'passive' }));

// THE COMPONENT DATABASE
const COMPONENT_DB: Record<string, KiCadDefinition> = {
  // --- PASSIVES ---
  'R_0603': {
    libId: "Device:R",
    footprint: "Resistor_SMD:R_0603_1608Metric",
    description: "Resistor, 1608 metric, 0603 imperial",
    pins: [{number: '1', name: '', type: 'passive'}, {number: '2', name: '', type: 'passive'}],
    designatorPrefix: "R",
    width: 1.6, height: 0.8, zHeight: 0.45
  },
  'C_0603': {
    libId: "Device:C",
    footprint: "Capacitor_SMD:C_0603_1608Metric",
    description: "Unpolarized capacitor",
    pins: [{number: '1', name: '', type: 'passive'}, {number: '2', name: '', type: 'passive'}],
    designatorPrefix: "C",
    width: 1.6, height: 0.8, zHeight: 0.9
  },
  'C_Polarized_Case_B': {
    libId: "Device:C_Polarized",
    footprint: "Capacitor_Tantalum_SMD:CP_EIA-3528-21_Kemet-B",
    description: "Polarized capacitor, Tantalum Case B",
    pins: [{number: '1', name: '+', type: 'passive'}, {number: '2', name: '-', type: 'passive'}],
    designatorPrefix: "C",
    width: 3.5, height: 2.8, zHeight: 1.9
  },
  'LED_0603': {
    libId: "Device:LED",
    footprint: "LED_SMD:LED_0603_1608Metric",
    description: "Light emitting diode",
    pins: [{number: '1', name: 'K', type: 'passive'}, {number: '2', name: 'A', type: 'passive'}],
    designatorPrefix: "D",
    width: 1.6, height: 0.8, zHeight: 0.6
  },
  'D_SOD-123': {
    libId: "Device:D",
    footprint: "Diode_SMD:D_SOD-123",
    description: "Diode, SOD-123 package",
    pins: [{number: '1', name: 'K', type: 'passive'}, {number: '2', name: 'A', type: 'passive'}],
    designatorPrefix: "D",
    width: 2.7, height: 1.6, zHeight: 1.15
  },

  // --- ICs / MCUs ---
  'SOIC-8': {
    libId: "Amplifier_Operational:LM358",
    footprint: "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm",
    description: "Generic 8-pin SOIC",
    pins: genPins(8),
    designatorPrefix: "U",
    width: 4.9, height: 3.9, zHeight: 1.75
  },
  'NE555': {
    libId: "Timer:NE555D",
    footprint: "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm",
    description: "Precision Timers, 555 compatible",
    pins: [
      {number: '1', name: 'GND', type: 'power_in'}, {number: '2', name: 'TR', type: 'input'},
      {number: '3', name: 'Q', type: 'output'}, {number: '4', name: 'R', type: 'input'},
      {number: '5', name: 'CV', type: 'input'}, {number: '6', name: 'THR', type: 'input'},
      {number: '7', name: 'DIS', type: 'input'}, {number: '8', name: 'VCC', type: 'power_in'}
    ],
    designatorPrefix: "U",
    width: 4.9, height: 3.9, zHeight: 1.75
  },
  'ATmega328P': {
    libId: "MCU_Microchip_ATmega:ATmega328P-AU",
    footprint: "Package_QFP:TQFP-32_7x7mm_P0.8mm",
    description: "8-bit AVR Microcontroller",
    pins: genPins(32, 'P'),
    designatorPrefix: "U",
    width: 7, height: 7, zHeight: 1.2
  },
  'ESP32-WROOM': {
    libId: "RF_Module:ESP32-WROOM-32",
    footprint: "RF_Module:ESP32-WROOM-32",
    description: "RF Module, ESP32",
    pins: genPins(38),
    designatorPrefix: "U",
    width: 18, height: 25.5, zHeight: 3.1
  },
  'RP2040': {
    libId: "MCU_Module:RP2040",
    footprint: "Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm",
    description: "RP2040 Microcontroller",
    pins: genPins(57), // +1 for EP
    designatorPrefix: "U",
    width: 7, height: 7, zHeight: 0.9
  },

  // --- CONNECTORS ---
  'PinHeader_1x02': {
    libId: "Connector:Conn_01x02_Pin",
    footprint: "Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical",
    description: "Generic connector, single row, 01x02",
    pins: genPins(2),
    designatorPrefix: "J",
    width: 5.08, height: 2.54, zHeight: 8.5
  },
  'PinHeader_1x04': {
    libId: "Connector:Conn_01x04_Pin",
    footprint: "Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical",
    description: "Generic connector, single row, 01x04",
    pins: genPins(4),
    designatorPrefix: "J",
    width: 10.16, height: 2.54, zHeight: 8.5
  },
  'USB_C': {
    libId: "Connector:USB_C_Receptacle_USB2.0",
    footprint: "Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12",
    description: "USB 2.0-only Type-C Receptacle",
    pins: [
      {number: 'A1', name: 'GND', type: 'power_in'}, {number: 'A4', name: 'VBUS', type: 'power_in'},
      {number: 'A5', name: 'CC1', type: 'bidirectional'}, {number: 'A6', name: 'D+', type: 'bidirectional'},
      {number: 'A7', name: 'D-', type: 'bidirectional'}, {number: 'A8', name: 'SBU1', type: 'bidirectional'},
      {number: 'A9', name: 'VBUS', type: 'power_in'}, {number: 'A12', name: 'GND', type: 'power_in'},
      {number: 'B1', name: 'GND', type: 'power_in'}, {number: 'B4', name: 'VBUS', type: 'power_in'},
      {number: 'B5', name: 'CC2', type: 'bidirectional'}, {number: 'B6', name: 'D+', type: 'bidirectional'},
      {number: 'B7', name: 'D-', type: 'bidirectional'}, {number: 'B8', name: 'SBU2', type: 'bidirectional'},
      {number: 'B9', name: 'VBUS', type: 'power_in'}, {number: 'B12', name: 'GND', type: 'power_in'},
      {number: 'S1', name: 'SHIELD', type: 'passive'}
    ],
    designatorPrefix: "J",
    width: 8.94, height: 7.3, zHeight: 3.2
  }
};

export const DEFAULT_DEF: KiCadDefinition = {
  ...COMPONENT_DB['R_0603'],
  zHeight: 0.5 // Explicit fallback
};

// Intelligent Matcher
export const getKiCadDefinition = (type: string, pkg: string): KiCadDefinition => {
  const t = type.toLowerCase();
  const p = pkg.toLowerCase();

  // Explicit Package Matches
  if (p.includes('0603')) {
    if (t.includes('led')) return COMPONENT_DB['LED_0603'];
    if (t.includes('cap')) return COMPONENT_DB['C_0603'];
    return COMPONENT_DB['R_0603'];
  }
  
  // Connectors
  if (t.includes('usb')) return COMPONENT_DB['USB_C'];
  if (t.includes('header') || p.includes('pinheader')) {
    if (p.includes('1x4') || t.includes('4')) return COMPONENT_DB['PinHeader_1x04'];
    return COMPONENT_DB['PinHeader_1x02'];
  }

  // ICs
  if (t.includes('555')) return COMPONENT_DB['NE555'];
  if (t.includes('atmega') || t.includes('arduino')) return COMPONENT_DB['ATmega328P'];
  if (t.includes('esp32')) return COMPONENT_DB['ESP32-WROOM'];
  if (t.includes('rp2040')) return COMPONENT_DB['RP2040'];
  if (t.includes('opamp') || p.includes('soic-8')) return COMPONENT_DB['SOIC-8'];

  // Default fallbacks based on type
  if (t.includes('diode')) return COMPONENT_DB['D_SOD-123'];
  if (t.includes('cap') && (t.includes('pol') || t.includes('tant'))) return COMPONENT_DB['C_Polarized_Case_B'];

  return DEFAULT_DEF;
};
