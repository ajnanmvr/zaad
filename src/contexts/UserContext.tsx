"use client"
import { createContext, useContext } from 'react';
import { TUser } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUserAction } from '@/actions/users';

export const UserContext = createContext<{ user: TUser | null }>({ user: null });
export const useUserContext = () => useContext(UserContext);

const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: user } = useQuery({
        queryKey: ["user"], queryFn: async () => {
            try {
                return await getCurrentUserAction();
            } catch {
                return null;
            }
        }
    });

    return (
        <UserContext.Provider value={{ user }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
