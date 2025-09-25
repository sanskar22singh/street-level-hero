import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
// Demo users removed; rely solely on stored users

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: 'citizen' | 'admin') => Promise<boolean>;
  signup: (data: { name: string; email: string; password: string; role: 'citizen' | 'admin'; city: string }) => Promise<User>;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  isLoading: boolean;
  adminExists: boolean;
  createAdmin: (data: { name: string; email: string; password: string; city: string }) => Promise<User>;
  requestPasswordReset: (email: string) => Promise<string | null>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminExists, setAdminExists] = useState(true);

  // Fixed single administrator for all deployments (no per-browser setup)
  const FIXED_ADMIN = {
    id: 'admin-fixed-0001',
    name: 'City Administrator',
    email: 'jubinpatel@gmail.com',
    role: 'admin' as const,
    city: 'Head Office',
    points: 0,
    level: 'Bronze' as const,
    badges: [] as string[],
    joinDate: '2024-01-01',
    password: '123123',
  } satisfies User;

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('roadReportUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Single admin is fixed globally
    setAdminExists(true);
    setIsLoading(false);
  }, []);

  const getStoredUsers = (): User[] => {
    const usersRaw = localStorage.getItem('roadReportUsers');
    try {
      return usersRaw ? (JSON.parse(usersRaw) as User[]) : [];
    } catch {
      return [];
    }
  };

  const setStoredUsers = (users: User[]) => {
    localStorage.setItem('roadReportUsers', JSON.stringify(users));
  };

  const login = async (email: string, password: string, role?: 'citizen' | 'admin'): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const storedUsers = getStoredUsers();

    // Enforce fixed admin for admin logins
    if (role === 'admin') {
      if (email.toLowerCase() === FIXED_ADMIN.email.toLowerCase() && password === FIXED_ADMIN.password) {
        // Do not store fixed admin in users list; session only
        const sessionUser: User = { ...FIXED_ADMIN };
        setUser(sessionUser);
        localStorage.setItem('roadReportUser', JSON.stringify(sessionUser));
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    }

    // Check local stored users with password match only
    const storedUser = storedUsers.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && (role ? u.role === role : true)
    );
    if (storedUser && storedUser.password === password) {
      setUser(storedUser);
      localStorage.setItem('roadReportUser', JSON.stringify(storedUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const signup: AuthContextType['signup'] = async ({ name, email, password, role, city }) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Prevent creating any new admin users; only fixed admin exists
    if (role === 'admin') {
      setIsLoading(false);
      throw new Error('Admin is managed centrally');
    }

    // Ensure unique email across stored users
    const lower = email.toLowerCase();
    const storedUsers2 = getStoredUsers();
    const existsInStored = storedUsers2.some(u => u.email.toLowerCase() === lower);
    if (existsInStored) {
      setIsLoading(false);
      // Throw for caller to handle
      throw new Error('Email already in use');
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      role,
      city,
      points: 0,
      level: 'Bronze',
      badges: [],
      joinDate: new Date().toISOString().slice(0, 10),
      password,
    };

    const updated = [...storedUsers2, newUser];
    setStoredUsers(updated);
    setUser(newUser);
    localStorage.setItem('roadReportUser', JSON.stringify(newUser));
    setIsLoading(false);
    return newUser;
  };

  // One-time admin creation (only if no admin exists)
  const createAdmin: AuthContextType['createAdmin'] = async () => {
    // Disallow runtime admin creation; one fixed admin only
    throw new Error('Admin is fixed and cannot be created');
  };

  // Simple password reset using localStorage token (demo-only)
  const requestPasswordReset: AuthContextType['requestPasswordReset'] = async (email) => {
    const users = getStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return null;
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    const tokensRaw = localStorage.getItem('roadReportResetTokens');
    const tokens = tokensRaw ? JSON.parse(tokensRaw) as Record<string, { token: string; exp: number }> : {};
    tokens[email.toLowerCase()] = { token, exp: Date.now() + 15 * 60 * 1000 };
    localStorage.setItem('roadReportResetTokens', JSON.stringify(tokens));
    return token; // In real app, email this token
  };

  const resetPassword: AuthContextType['resetPassword'] = async (email, token, newPassword) => {
    const tokensRaw = localStorage.getItem('roadReportResetTokens');
    const tokens = tokensRaw ? JSON.parse(tokensRaw) as Record<string, { token: string; exp: number }> : {};
    const rec = tokens[email.toLowerCase()];
    if (!rec || rec.token !== token || rec.exp < Date.now()) return false;
    // update user
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;
    users[idx] = { ...users[idx], password: newPassword } as User;
    setStoredUsers(users);
    // clear token
    delete tokens[email.toLowerCase()];
    localStorage.setItem('roadReportResetTokens', JSON.stringify(tokens));
    // If resetting current session user, update it
    setUser(prev => {
      if (prev && prev.email.toLowerCase() === email.toLowerCase()) {
        const updated = { ...prev, password: newPassword } as User;
        localStorage.setItem('roadReportUser', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('roadReportUser');
  };

  const updateUser: AuthContextType['updateUser'] = (updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const preMerge: User = { ...prev, ...updates };
      // Award special badge and blue tick at 150+ points
      const reachedMilestone = (preMerge.points || 0) >= 150;
      const badges = new Set(preMerge.badges || []);
      if (reachedMilestone) {
        badges.add('blue_tick');
        badges.add('special_1000');
      }
      const updatedUser: User = { ...preMerge, badges: Array.from(badges) };
      // Persist session user
      localStorage.setItem('roadReportUser', JSON.stringify(updatedUser));

      // Persist in stored users list as well
      const users = getStoredUsers();
      const idx = users.findIndex(u => u.id === updatedUser.id);
      if (idx !== -1) {
        const pre: User = { ...users[idx], ...updates } as User;
        const b = new Set(pre.badges || []);
        if ((pre.points || 0) >= 150) { b.add('blue_tick'); b.add('special_1000'); }
        users[idx] = { ...pre, badges: Array.from(b) } as User;
        setStoredUsers(users);
      }

      return updatedUser;
    });
  };

  const value = {
    user,
    login,
    signup,
    updateUser,
    logout,
    isLoading,
    adminExists,
    createAdmin,
    requestPasswordReset,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};