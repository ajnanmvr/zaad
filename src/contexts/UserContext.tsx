"use client"
import { createContext, useContext } from 'react';
import axios from 'axios';
import { TUser } from '@/types/user';
import { useQuery } from '@tanstack/react-query';

export const UserContext = createContext<{ user: TUser | null }>({ user: null });
export const useUserContext = () => useContext(UserContext);

const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: user, isError } = useQuery({
        queryKey: ["user"], queryFn: async () => {
            const response = await axios.get("/api/users/auth/me");
            return response.data.user
        }
    })
    if (isError) {
        (async () => {
            await axios.get("/api/users/auth/logout");
        })();
    }
    return (
        <UserContext.Provider value={{ user }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
