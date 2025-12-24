import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/navigation'
import { useUserContext } from "@/contexts/UserContext";
import toast from "react-hot-toast";
import { logoutAction } from "@/actions/users";

const DropdownUser = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user } = useUserContext();
  const router = useRouter()
  const trigger = useRef<any>(null);
  const dropdown = useRef<any>(null);
  const handleLogout = async () => {
    try {
      const toastId = toast.loading("Logging Out");
      await logoutAction();
      toast.dismiss(toastId);
      toast.success("Logged Out Successfully");
      router.refresh()
    } catch (error) {
      console.log({ message: "logout failed", error });
      toast.error("logout failed");
    }
  }

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  return (
    <div className="relative">
      <Link
        ref={trigger}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4"
        href="#"
      >
        <span className="hidden capitalize  text-right lg:block">
          <span className="block text-sm font-medium text-black dark:text-white">
            {user?.username}
          </span>
          <span className="block text-xs">{user?.role}</span>
        </span>

        <span className="h-12 w-12 rounded-full">
          <Image
            width={112}
            height={112}
            src={"/images/user/user-01.png"}
            style={{
              width: "auto",
              height: "auto",
            }}
            alt="User"
          />
        </span>

        <svg
          className="hidden fill-current sm:block"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.410765 0.910734C0.736202 0.585297 1.26384 0.585297 1.58928 0.910734L6.00002 5.32148L10.4108 0.910734C10.7362 0.585297 11.2638 0.585297 11.5893 0.910734C11.9147 1.23617 11.9147 1.76381 11.5893 2.08924L6.58928 7.08924C6.26384 7.41468 5.7362 7.41468 5.41077 7.08924L0.410765 2.08924C0.0853277 1.76381 0.0853277 1.23617 0.410765 0.910734Z"
            fill=""
          />
        </svg>
      </Link>

      <div
        ref={dropdown}
        onFocus={() => setDropdownOpen(true)}
        onBlur={() => setDropdownOpen(false)}
        className={`absolute right-0 mt-4 flex w-62.5 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark ${dropdownOpen === true ? "block" : "hidden"
          }`}
      >
        <Link
          href="/settings"
          className="flex items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
        >
          <svg
            className="fill-current"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.8656 8.86874C20.5219 8.49062 20.0406 8.28437 19.525 8.28437H18.9375V7.73125C18.9375 7.73125 18.9375 7.69687 18.9375 7.6625C18.9375 7.59375 18.9031 7.52499 18.8687 7.45624L18.075 5.54999C17.9719 5.30937 17.7656 5.13749 17.525 5.06874C17.2844 4.99999 17.0094 5.03437 16.8031 5.20624L15.8406 5.95937C15.2875 5.61562 14.6656 5.37499 14.0094 5.20624V4.12499C14.0094 3.64062 13.6656 3.22812 13.1844 3.15937C12.9781 3.125 12.7719 3.125 12.5656 3.125H11.4344C11.2281 3.125 11.0219 3.125 10.8156 3.15937C10.3344 3.22812 9.99062 3.64062 9.99062 4.12499V5.20624C9.33437 5.37499 8.7125 5.61562 8.15937 5.95937L7.19687 5.20624C6.99062 5.03437 6.71562 4.99999 6.475 5.06874C6.23437 5.13749 6.0625 5.30937 5.92812 5.54999L5.13437 7.45624C5.06562 7.52499 5.06562 7.59375 5.06562 7.6625C5.06562 7.69687 5.06562 7.73125 5.06562 7.73125V8.28437H4.47812C3.96249 8.28437 3.48124 8.49062 3.1375 8.86874C2.79375 9.24687 2.62187 9.72812 2.65625 10.2094L2.72499 12.5406C2.75937 13.0219 2.96562 13.4687 3.34374 13.8125C3.72187 14.1562 4.16874 14.3625 4.65 14.3625H5.06562V14.9156C5.06562 14.9156 5.06562 14.95 5.06562 14.9844C5.06562 15.0531 5.09999 15.1219 5.13437 15.1906L5.92812 17.0969C6.03124 17.3375 6.2375 17.5094 6.47812 17.5781C6.71874 17.6469 6.99374 17.6125 7.19999 17.4406L8.16249 16.6875C8.71562 17.0312 9.3375 17.2719 9.99374 17.4406V18.5219C9.99374 19.0062 10.3375 19.4187 10.8187 19.4875C11.025 19.5219 11.2312 19.5219 11.4375 19.5219H12.5687C12.775 19.5219 12.9812 19.5219 13.1875 19.4875C13.6687 19.4187 14.0125 19.0062 14.0125 18.5219V17.4406C14.6687 17.2719 15.2906 17.0312 15.8437 16.6875L16.8062 17.4406C17.0125 17.6125 17.2875 17.6469 17.5281 17.5781C17.7687 17.5094 17.9406 17.3375 18.075 17.0969L18.8687 15.1906C18.9375 15.1219 18.9375 15.0531 18.9375 14.9844C18.9375 14.95 18.9375 14.9156 18.9375 14.9156V14.3625H19.5594C20.075 14.3625 20.5562 14.1562 20.9 13.8125C21.2437 13.4687 21.45 13.0219 21.4844 12.5406L21.5531 10.2094C21.5531 9.72812 21.3812 9.24687 20.8656 8.86874ZM12 15.125C9.86874 15.125 8.15624 13.4125 8.15624 11.2812C8.15624 9.14999 9.86874 7.4375 12 7.4375C14.1312 7.4375 15.8437 9.14999 15.8437 11.2812C15.8437 13.4125 14.1312 15.125 12 15.125Z"
              fill=""
            />
          </svg>
          Settings
        </Link>

        <button onClick={handleLogout} className="flex items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base">
          <svg
            className="fill-current"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.5375 0.618744H11.6531C10.7594 0.618744 10.0031 1.37499 10.0031 2.26874V4.64062C10.0031 5.05312 10.3469 5.39687 10.7594 5.39687C11.1719 5.39687 11.55 5.05312 11.55 4.64062V2.23437C11.55 2.16562 11.5844 2.13124 11.6531 2.13124H15.5375C16.3625 2.13124 17.0156 2.78437 17.0156 3.60937V18.3562C17.0156 19.1812 16.3625 19.8344 15.5375 19.8344H11.6531C11.5844 19.8344 11.55 19.8 11.55 19.7312V17.3594C11.55 16.9469 11.2062 16.6031 10.7594 16.6031C10.3125 16.6031 10.0031 16.9469 10.0031 17.3594V19.7312C10.0031 20.625 10.7594 21.3812 11.6531 21.3812H15.5375C17.2219 21.3812 18.5625 20.0062 18.5625 18.3562V3.64374C18.5625 1.95937 17.1875 0.618744 15.5375 0.618744Z"
              fill=""
            />
            <path
              d="M6.05001 11.7563H12.2031C12.6156 11.7563 12.9594 11.4125 12.9594 11C12.9594 10.5875 12.6156 10.2438 12.2031 10.2438H6.08439L8.21564 8.07813C8.52501 7.76875 8.52501 7.2875 8.21564 6.97812C7.90626 6.66875 7.42501 6.66875 7.11564 6.97812L3.67814 10.4844C3.36876 10.7938 3.36876 11.275 3.67814 11.5844L7.11564 15.0906C7.25314 15.2281 7.45939 15.3312 7.66564 15.3312C7.87189 15.3312 8.04376 15.2625 8.21564 15.125C8.52501 14.8156 8.52501 14.3344 8.21564 14.025L6.05001 11.7563Z"
              fill=""
            />
          </svg>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default DropdownUser;
