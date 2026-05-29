"use client"
import { createContext, useContext } from 'react';
import axios from 'axios';
import { TUser } from '@/types/user';
import { useQuery } from '@tanstack/react-query';

type UserContextValue = {
    user: TUser | null;
    isUserLoading: boolean;
};

export const UserContext = createContext<UserContextValue>({ user: null, isUserLoading: true });
export const useUserContext = () => useContext(UserContext);

const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: user, isLoading: isUserLoading } = useQuery({
        queryKey: ["user"], queryFn: async () => {
            const { data } = await axios.get("/api/users/auth/me");
            return data.user;
        }
    });

    return (
        <UserContext.Provider value={{ user, isUserLoading }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
