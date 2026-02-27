
import { User } from '../types';

// --- MOCK BACKEND INFRASTRUCTURE ---

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Client-side SHA-256 Hashing (For demo purposes only - normally done on server)
const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface DBUser extends User {
  passwordHash: string;
  createdAt: number;
}

const DB_KEY = 'pcbai_db_users';
const TOKEN_KEY = 'pcbai_auth_token';

export const authService = {
  // REGISTER API
  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    await delay(800); // Simulate network

    const users: DBUser[] = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already registered');
    }

    const passwordHash = await hashPassword(password);
    
    // Auto-assign admin role for demo purposes if email contains 'admin'
    const role: 'admin' | 'user' = email.toLowerCase().includes('admin') ? 'admin' : 'user';

    const newUser: DBUser = {
      id: crypto.randomUUID(),
      name,
      email,
      role,
      passwordHash,
      createdAt: Date.now()
    };

    users.push(newUser);
    localStorage.setItem(DB_KEY, JSON.stringify(users));

    // Generate Mock JWT (In real app, this is signed by server secret)
    const token = btoa(JSON.stringify({ userId: newUser.id, role: newUser.role, exp: Date.now() + 86400000 }));
    localStorage.setItem(TOKEN_KEY, token);
    
    const { passwordHash: _, ...safeUser } = newUser;
    return { user: safeUser, token };
  },

  // LOGIN API
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    await delay(800);

    const users: DBUser[] = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('Invalid email or password');
    }

    // Generate Mock JWT
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role, exp: Date.now() + 86400000 }));
    localStorage.setItem(TOKEN_KEY, token);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  // VERIFY TOKEN API (Session Restore)
  async verifySession(): Promise<User | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token));
      
      // Check expiration
      if (Date.now() > payload.exp) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }

      const users: DBUser[] = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
      const user = users.find(u => u.id === payload.userId);
      
      if (!user) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }

      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    } catch (e) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  // ADMIN API: Get All Users
  async getAllUsers(): Promise<User[]> {
    await delay(500);
    const users: DBUser[] = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    return users.map(u => {
      const { passwordHash, ...safe } = u;
      return safe;
    });
  }
};
