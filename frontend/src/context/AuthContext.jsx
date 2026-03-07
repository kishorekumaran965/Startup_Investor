import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        if (saved && savedToken) {
            setUser(JSON.parse(saved));
            setToken(savedToken);
        }
        setLoading(false);
    }, []);

    const login = (data) => {
        const userData = { id: data.id, email: data.email, name: data.name, role: data.role, profilePhotoUrl: data.profilePhotoUrl, bio: data.bio };
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setToken(data.token);
    };

    const updateUser = (updates) => {
        const updated = { ...user, ...updates };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

