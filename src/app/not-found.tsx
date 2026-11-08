import Image from "next/image";
import Link from "next/link";
import { FiArrowLeft, FiHome } from "react-icons/fi";
import BackButton from "@/components/common/NotFoundBackButton";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_-25px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <Link href="/" className="inline-flex">
          <Image
            width={150}
            height={28}
            src="/images/logo/logo-dark.svg"
            alt="ZAAD"
            priority
            className="dark:hidden"
          />
          <Image
            width={150}
            height={28}
            src="/images/logo/logo.svg"
            alt="ZAAD"
            priority
            className="hidden dark:block"
          />
        </Link>

        <p className="mt-8 bg-gradient-to-br from-primary to-emerald-600 bg-clip-text text-8xl font-black leading-none tracking-tighter text-transparent sm:text-9xl">
          404
        </p>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Page not found
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
          The page you are looking for doesn&apos;t exist, was moved, or you may not have access to it.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
          >
            <FiHome /> Back to dashboard
          </Link>
          <BackButton>
            <FiArrowLeft /> Go back
          </BackButton>
        </div>

        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          ZAAD Business Documents Services
        </p>
      </div>
    </main>
  );
}
