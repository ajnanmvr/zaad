"use client"
import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { TUser } from '@/types/user';

export const UserContext = createContext<{ user: TUser | null }>({ user: null });
export const useUserContext = () => useContext(UserContext);

const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<TUser>(
        {
            username: "",
            _id: "",
            fullname: "",
            role: ""
        }
    );
    const fetchUserData = async () => {
        try {
            const response = await axios.get("/api/users/auth/me");
            console.log(response)
            setUser(response.data.user);

        } catch (error) {
            await axios.get("/api/users/auth/logout")
            console.error("Unable to fetch user data", error);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    return (
        <UserContext.Provider value={{ user }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
