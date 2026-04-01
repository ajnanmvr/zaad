import Link from "next/link";
import { FiChevronRight, FiHome } from "react-icons/fi";

interface BreadcrumbProps {
  pageName: string;
}

const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-4 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black capitalize tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
          {pageName}
        </h2>

        <nav>
          <ol className="flex items-center gap-2 text-sm font-medium">
            <li>
              <Link
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                href="/"
              >
                <FiHome className="text-xs" />
                Dashboard
              </Link>
            </li>
            <li className="text-slate-400">
              <FiChevronRight />
            </li>
            <li className="font-semibold text-cyan-600 dark:text-cyan-400">{pageName}</li>
          </ol>
        </nav>
      </div>
    </div>
  );
};

export default Breadcrumb;
