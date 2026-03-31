import Link from "next/link";
import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownUser from "./DropdownUser";
import Image from "next/image";
import { useState } from "react";
import { FiSearch, FiMenu } from "react-icons/fi";
import axios from "axios";
import { useUserContext } from "@/contexts/UserContext";

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ companies: [{ name: "", _id: "" }], employees: [{ name: "", _id: "" }] });
  const [isSearchResults, setIsSearchResults] = useState(false);
  const { user } = useUserContext();
  const canSearch = Array.isArray(user?.permissions) && user.permissions.includes("entities.read");

  const handleSearch = async (e: any) => {
    e.preventDefault();
    if (searchQuery.trim() !== '') {
      try {
        console.log(encodeURIComponent(searchQuery));
        const response = await axios.get(`/api/search?search=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data); // Assuming API returns an array of search results
        setIsSearchResults(true)
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
    }
  };



  return (
    <header className="sticky top-4 z-999 flex w-full max-w-[calc(100%-2rem)] mx-auto rounded-3xl bg-white/70 backdrop-blur-md shadow-sm border border-slate-200/50 dark:bg-slate-900/70 dark:border-slate-800/50">
      {isSearchResults && (
        <div className="absolute left-5 h-screen flex justify-center items-center">
          <div className="bg-white dark:bg-black p-8 rounded-lg shadow-lg">

            {searchResults?.companies.length !== 0 && (
              <>
                <h3 className=" text-sm font-semibold text-bodydark2">
                  COMPANIES
                </h3>

                <div className="flex flex-wrap gap-1 my-2">
                  {searchResults?.companies.map((company, key) => (
                    <Link href={`/company/${company._id}`}
                      className="rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary cursor-pointer dark:hover:bg-primary hover:border-primary"
                      key={key}>
                      {company.name}
                    </Link>
                  ))}
                </div>
              </>
            )}
            {searchResults?.employees.length !== 0 && (
              <>
                <h3 className=" text-sm font-semibold text-bodydark2">
                  EMPLOYEES
                </h3>

                <div className="flex flex-wrap gap-1 my-2">
                  {searchResults?.employees.map((employee, key) => (
                    <Link href={`/employee/${employee._id}`}
                      className="rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary cursor-pointer dark:hover:bg-primary hover:border-primary"
                      key={key}>
                      {employee.name}
                    </Link>
                  ))}
                </div>
              </>
            )}

            <button onClick={() => setIsSearchResults(false)} className="mr-2 w-full px-4 py-2 border-current hover:bg-slate-100 hover:bg-opacity-5 dark:hover:bg-slate-800 border rounded-lg transition-colors">
              Cancel
            </button>

          </div>
        </div>
      )
      }

      <div className="flex flex-grow items-center justify-between px-4 py-3 md:px-6 2xl:px-8">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-99999 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/50 text-slate-600 shadow-sm transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <FiMenu className="text-xl" />
          </button>

          <Link className="block flex-shrink-0 lg:hidden" href="/">
            <Image
              width={32}
              height={32}
              src={"/images/logo/logo-icon.svg"}
              alt="Logo"
            />
          </Link>
        </div>

        <div className="hidden sm:block flex-1 max-w-2xl">
          {canSearch && (
          <form onSubmit={handleSearch}>
            <div className="relative group">
              <button className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                <FiSearch className="text-lg" />
              </button>

              <input
                type="text"
                placeholder="Search everywhere..."
                className="w-full rounded-2xl bg-slate-100/50 py-2.5 pl-12 pr-4 font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary/20 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder:text-slate-500 border border-transparent focus:border-primary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          )}
        </div>

        <div className="flex items-center gap-3 2xsm:gap-5 ml-auto">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            <DarkModeSwitcher />
          </ul>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
          <DropdownUser />
        </div>
      </div>
    </header >
  );
};

export default Header;
