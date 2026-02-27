
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Component {
  id: string;
  name: string;
  type: string;
  value: string;
  package: string;
  // Position is optional from AI, but required for rendering/export
  position?: { x: number; y: number };
}

export interface Net {
  id: string;
  name: string;
  connections: string[]; // array of componentIds
}

export interface Trace {
  netId: string;
  points: { x: number; y: number }[];
}

export interface DesignData {
  projectName: string;
  boardDimensions: { width: number; height: number };
  components: Component[];
  nets: Net[];
  routes?: Trace[]; // Calculated client-side or provided by AI
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  data?: DesignData;
}

export enum AppState {
  HOME,
  DESIGN_STUDIO,
  AUTH
}

export type InputMethod = 'TEXT' | 'FILE';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
