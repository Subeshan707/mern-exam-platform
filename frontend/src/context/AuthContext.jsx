import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { AUTH } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'student'
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const resolvedRole = storedRole || parsedUser?.role;
        const isValidRole = resolvedRole === 'admin' || resolvedRole === 'student';

        if (parsedUser && typeof parsedUser === 'object' && isValidRole) {
          setUser(parsedUser);
          setRole(resolvedRole);
          localStorage.setItem('role', resolvedRole);
        } else {
          throw new Error('Invalid user payload');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      }
    }
    setLoading(false);
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    const res = await api.post(AUTH.ADMIN_LOGIN, { email, password });
    const payload = res.data?.data;
    const token = payload?.accessToken;
    const refreshToken = payload?.refreshToken;
    const admin = payload?.user;

    if (!token || !admin || admin.role !== 'admin') {
      throw new Error('Invalid admin login response');
    }

    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
    localStorage.setItem('user', JSON.stringify(admin));
    localStorage.setItem('role', 'admin');
    setUser(admin);
    setRole('admin');
    return res.data;
  }, []);

  const studentLogin = useCallback(async (rollNumber, password) => {
    const res = await api.post(AUTH.STUDENT_LOGIN, { rollNumber, password });
    const payload = res.data?.data;
    const token = payload?.accessToken;
    const refreshToken = payload?.refreshToken;
    const student = payload?.user;

    if (!token || !student || student.role !== 'student') {
      throw new Error('Invalid student login response');
    }

    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
    localStorage.setItem('user', JSON.stringify(student));
    localStorage.setItem('role', 'student');
    setUser(student);
    setRole('student');
    return res.data;
  }, []);

  const adminRegister = useCallback(async (payload) => {
    const res = await api.post(AUTH.ADMIN_REGISTER, payload);
    const data = res.data?.data;
    const token = data?.accessToken;
    const refreshToken = data?.refreshToken;
    const admin = data?.user;

    if (!token || !admin || admin.role !== 'admin') {
      throw new Error('Invalid admin registration response');
    }

    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
    localStorage.setItem('user', JSON.stringify(admin));
    localStorage.setItem('role', 'admin');
    setUser(admin);
    setRole('admin');
    return res.data;
  }, []);

  const studentRegister = useCallback(async (payload) => {
    const res = await api.post(AUTH.STUDENT_REGISTER, payload);
    const data = res.data?.data;
    const token = data?.accessToken;
    const refreshToken = data?.refreshToken;
    const student = data?.user;

    if (!token || !student || student.role !== 'student') {
      throw new Error('Invalid student registration response');
    }

    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
    localStorage.setItem('user', JSON.stringify(student));
    localStorage.setItem('role', 'student');
    setUser(student);
    setRole('student');
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post(AUTH.LOGOUT);
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
  }, []);

  const value = {
    user,
    role,
    loading,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isStudent: role === 'student',
    adminLogin,
    studentLogin,
    adminRegister,
    studentRegister,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
