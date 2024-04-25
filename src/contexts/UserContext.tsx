import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface User {
    username: string;
    _id: string;
    fullname: string;
    role: string
}

interface UserContextType {
    user: User | null;
}

const initialContext: UserContextType = {
    user: null,
};

export const UserContext = createContext<UserContextType>(initialContext);

export const useUserContext = () => useContext(UserContext);

interface UserProviderProps {
    children: React.ReactNode;
}

const UserProvider: React.FC<UserProviderProps> = ({ children }: UserProviderProps) => {
    const [user, setUser] = useState<User | null>(null);

    const fetchUserData = async () => {
        try {
            const response = await axios.get("/api/users/auth/me");
            setUser(response.data.user);
        } catch (error) {
            console.error("Unable to fetch user data", error);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);
    console.log("aj", user);

    return (
        <UserContext.Provider value={{ user }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
