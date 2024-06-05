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
    const [user, setUser] = useState<User>(
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
