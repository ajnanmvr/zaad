import UserProvider from "@/contexts/UserContext";
import ModernLayout from "@/components/Layouts/ModernLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <ModernLayout>
        {children}
      </ModernLayout>
    </UserProvider>
  );
}
