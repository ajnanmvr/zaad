import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import UserProvider from "@/contexts/UserContext";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <body>
        <div className="dark:bg-boxdark-2 dark:text-bodydark">
          <ReactQueryProvider>
            <UserProvider>
              <Toaster />
              {children}
            </UserProvider>
          </ReactQueryProvider>
        </div>
      </body>
    </html>
  );
}
