import UserProvider from "@/contexts/UserContext";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <UserProvider>
      <DefaultLayout>
        {children}
      </DefaultLayout>
    </UserProvider>
  );
}
