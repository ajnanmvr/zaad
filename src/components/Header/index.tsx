import Link from "next/link";
import Image from "next/image";
import { FiGrid, FiMenu } from "react-icons/fi";

import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownNotification from "./DropdownNotification";
import DropdownUser from "./DropdownUser";

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-4 z-40 mx-4 mt-4 rounded-3xl border border-slate-200/70 bg-white/75 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-none md:mx-6">
      <div className="flex items-center justify-between px-4 py-3.5 md:px-6">
        <div className="flex items-center gap-3">
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <FiMenu className="text-xl" />
          </button>

          <Link className="block flex-shrink-0 lg:hidden" href="/">
            <Image width={30} height={30} src="/images/logo/logo-icon.svg" alt="Logo" />
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30">
              <FiGrid className="text-lg" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Workspace
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {todayLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <ul className="flex items-center gap-2 sm:gap-4">
            <DarkModeSwitcher />
            <DropdownNotification />
          </ul>
          <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-800 sm:block"></div>
          <DropdownUser />
        </div>
      </div>
    </header>
  );
};

export default Header;
