import UserProvider from "@/contexts/UserContext";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import ServiceFeeNotice from "@/components/ServiceFee/ServiceFeeNotice";
import ReactQueryProvider from "@/providers/ReactQueryProvider";

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <ReactQueryProvider>
      <UserProvider>
        <DefaultLayout>{children}</DefaultLayout>
        <ServiceFeeNotice />
      </UserProvider>
    </ReactQueryProvider>
  );
}
