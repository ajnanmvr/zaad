"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserContext } from "@/contexts/UserContext";
import { formatDubaiDateTime } from "@/utils/dubaiTime";

type TaskNotification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  task?: {
    _id: string;
    title?: string;
    status?: string;
  };
  entityType?: string;
  entityId?: string;
};

type NotificationResponse = {
  notifications: TaskNotification[];
  unreadCount: number;
};

const DropdownNotification = () => {
  const { user } = useUserContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const trigger = useRef<HTMLAnchorElement | null>(null);
  const dropdown = useRef<HTMLDivElement | null>(null);

  const canReadNotifications =
    Array.isArray(user?.permissions) &&
    (user.permissions.includes("tasks.notifications.read") ||
      user.permissions.includes("tasks.read") ||
      user.permissions.includes("tasks.manage") ||
      user.permissions.includes("payments.read") ||
      user.permissions.includes("payments.write"));

  const canReadTasks =
    Array.isArray(user?.permissions) &&
    (user.permissions.includes("tasks.read") || user.permissions.includes("tasks.manage"));

  const getNotificationHref = (item: TaskNotification) => {
    if (item.entityType === "payment" && item.entityId) {
      return `/accounts/transactions/details/${item.entityId}`;
    }

    if (item.entityType === "company" || item.entityType === "employee" || item.entityType === "individual") {
      return `/${item.entityType}/${item.entityId}`;
    }

    if (item.task?._id || item.type === "assigned" || item.type === "updated" || item.type === "completed") {
      return "/tasks";
    }

    return canReadTasks ? "/tasks" : "/accounts/transactions";
  };

  const query = useQuery({
    queryKey: ["task-notifications", canReadNotifications],
    queryFn: async () => {
      const { data } = await axios.get("/api/task-notifications?limit=8");
      return data as NotificationResponse;
    },
    enabled: canReadNotifications,
    refetchInterval: 30000,
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => axios.patch(`/api/task-notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-notifications"] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: () => axios.patch("/api/task-notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-notifications"] });
    },
  });

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current || !trigger.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
      )
        return;
      setDropdownOpen(false);
    };

    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, [dropdownOpen]);

  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [dropdownOpen]);

  if (!canReadNotifications) {
    return null;
  }

  const notifications = query.data?.notifications || [];
  const unreadCount = query.data?.unreadCount || 0;
  const notifying = unreadCount > 0;

  return (
    <li className="relative">
      <Link
        ref={trigger}
        onClick={(event) => {
          event.preventDefault();
          setDropdownOpen((prev) => !prev);
        }}
        href="#"
        className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
      >
        <span
          className={`absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-meta-1 ${
            notifying ? "inline" : "hidden"
          }`}
        >
          <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-75"></span>
        </span>

        <svg
          className="fill-current duration-300 ease-in-out"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16.1999 14.9343L15.6374 14.0624C15.5249 13.8937 15.4687 13.7249 15.4687 13.528V7.67803C15.4687 6.01865 14.7655 4.47178 13.4718 3.31865C12.4312 2.39053 11.0812 1.7999 9.64678 1.6874V1.1249C9.64678 0.787402 9.36553 0.478027 8.9999 0.478027C8.6624 0.478027 8.35303 0.759277 8.35303 1.1249V1.65928C8.29678 1.65928 8.24053 1.65928 8.18428 1.6874C4.92178 2.05303 2.4749 4.66865 2.4749 7.79053V13.528C2.44678 13.8093 2.39053 13.9499 2.33428 14.0343L1.7999 14.9343C1.63115 15.2155 1.63115 15.553 1.7999 15.8343C1.96865 16.0874 2.2499 16.2562 2.55928 16.2562H8.38115V16.8749C8.38115 17.2124 8.6624 17.5218 9.02803 17.5218C9.36553 17.5218 9.6749 17.2405 9.6749 16.8749V16.2562H15.4687C15.778 16.2562 16.0593 16.0874 16.228 15.8343C16.3968 15.553 16.3968 15.2155 16.1999 14.9343Z"
            fill=""
          />
        </svg>
      </Link>

      <div
        ref={dropdown}
        onFocus={() => setDropdownOpen(true)}
        onBlur={() => setDropdownOpen(false)}
        className={`absolute -right-27 mt-2.5 flex max-h-[28rem] w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-80 ${
          dropdownOpen ? "block" : "hidden"
        }`}
      >
        <div className="flex items-center justify-between px-4.5 py-3">
          <h5 className="text-sm font-medium text-bodydark2">Notifications</h5>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => readAllMutation.mutate()}
              className="text-xs font-medium text-primary"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <ul className="flex h-auto flex-col overflow-y-auto">
          {notifications.length === 0 ? (
            <li className="border-t border-stroke px-4.5 py-4 text-sm text-slate-500 dark:border-strokedark dark:text-slate-400">
              No new notifications.
            </li>
          ) : (
            notifications.map((item) => {
              const href = getNotificationHref(item);

              return (
                <li key={item._id}>
                  <Link
                    href={href}
                    onClick={() => {
                      if (!item.isRead) {
                        readMutation.mutate(item._id);
                      }
                      setDropdownOpen(false);
                      router.push(href);
                    }}
                    className={`flex w-full flex-col gap-1.5 border-t border-stroke px-4.5 py-3 text-left hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4 ${
                      item.isRead ? "opacity-80" : ""
                    }`}
                  >
                    <p className="text-sm">
                      <span className="text-black dark:text-white">{item.title}</span>
                      {item.message ? ` - ${item.message}` : ""}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDubaiDateTime(item.createdAt)}</p>
                  </Link>
                </li>
              );
            })
          )}
        </ul>

        <Link
          href={canReadTasks ? "/tasks" : "/accounts/transactions"}
          className="border-t border-stroke px-4.5 py-3 text-center text-sm font-medium text-primary dark:border-strokedark"
        >
          {canReadTasks ? "Open My Tasks" : "Open Transactions"}
        </Link>
      </div>
    </li>
  );
};

export default DropdownNotification;
