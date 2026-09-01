'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export function useAuth() {
    const [owner, setOwner] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const response = await api.get('/api/auth/me');
                setOwner(response.data);
            } catch (err) {
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    return { owner, loading };
}
