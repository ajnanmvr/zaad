import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { Toaster } from "react-hot-toast";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ToastProvider } from "@/components/ui/Toast";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <title>ZAAD BUSINESS DOCUMENTS SERVICES | ADMIN DASHBOARD</title>
      <body>
        <div className="dark:bg-boxdark-2 dark:text-bodydark">
          <ReactQueryProvider>
            <ToastProvider>
              {children}
              <ReactQueryDevtools initialIsOpen={false} />
              <Toaster />
            </ToastProvider>
          </ReactQueryProvider>
        </div>
      </body>
    </html>
  );
}
