"use client";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { loginAction } from "@/actions/users";
const SignIn: React.FC = () => {
  const [user, setUser] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (isLoading) return;
    try {
      setIsLoading(true);
      const toastId = toast.loading("Logging in...");
      const res = await loginAction(user);
      toast.dismiss(toastId);
      toast.success("Logged in successfully");
      // Redirect to lightweight home page to avoid heavy dashboard
      router.replace("/home");
    } catch (error: any) {
      toast.error(error?.message || "Login Failed");
    } finally {
      setIsLoading(false);
    }
  }
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [event.target.name]: event.target.value });
  }
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/10 via-transparent to-primary/10 dark:from-primary/20 dark:to-primary/20 flex items-center justify-center py-10 px-6">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center mb-8">
          <Link className="mb-4 inline-block" href="/">
            <Image
              className="hidden dark:block"
              src={"/images/logo/logo.svg"}
              alt="Zaad"
              width={160}
              height={30}
            />
            <Image
              className="dark:hidden"
              src={"/images/logo/logo-dark.svg"}
              alt="Zaad"
              width={160}
              height={30}
            />
          </Link>
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Empowering businesses to enhance productivity & compliance.
          </p>
        </div>

        <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="p-6 sm:p-10">
            <span className="mb-2 block text-sm font-medium">Welcome back</span>
            <h2 className="mb-8 text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
              Sign in to your account
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="username" className="mb-2.5 block font-medium text-black dark:text-white">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  onChange={handleChange}
                  value={user.username}
                  autoComplete="username"
                  required
                  placeholder="Enter your username"
                  className="w-full rounded-lg border border-stroke bg-transparent py-3.5 px-4 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="mb-2.5 block font-medium text-black dark:text-white">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    onChange={handleChange}
                    value={user.password}
                    autoComplete="current-password"
                    required
                    className="w-full rounded-lg border border-stroke bg-transparent py-3.5 pl-4 pr-24 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-xs rounded-md border border-stroke px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-6 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-stroke text-primary focus:ring-primary" defaultChecked />
                  Remember me
                </label>
                <Link href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-3.5 text-white transition hover:bg-opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
