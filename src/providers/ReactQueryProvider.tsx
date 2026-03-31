"use client"
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureClientAuthInterceptor } from "@/utils/clientAuthInterceptor";
const queryClient = new QueryClient({});
export default function ReactQueryProvider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    useEffect(() => {
        configureClientAuthInterceptor();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}
