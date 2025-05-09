"use client"
import { createContext, useContext } from 'react';
import axios from 'axios';
import { TUser } from '@/types/user';
import { useQuery } from '@tanstack/react-query';

export const UserContext = createContext<{ user: TUser | null }>({ user: null });
export const useUserContext = () => useContext(UserContext);

const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: user } = useQuery({
        queryKey: ["user"], queryFn: async () => {
            const { data } = await axios.get("/api/users/auth/me");
            return data.user;
        }
    });

    return (
        <UserContext.Provider value={{ user }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
