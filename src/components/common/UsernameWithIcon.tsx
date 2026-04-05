import clsx from "clsx";
import { FiUser } from "react-icons/fi";

type UsernameWithIconProps = {
  username?: string | null;
  fullname?: string | null;
  fallback?: string;
  className?: string;
  iconClassName?: string;
};

const UsernameWithIcon = ({
  username,
  fullname,
  fallback = "-",
  className,
  iconClassName,
}: UsernameWithIconProps) => {
  if (!username) {
    return <span>{fallback}</span>;
  }

  return (
    <span
      title={fullname || username}
      className={clsx("inline-flex items-center gap-1.5", className)}
    >
      <FiUser className={clsx("text-[12px] text-slate-400", iconClassName)} />
      <span>{username}</span>
    </span>
  );
};

export default UsernameWithIcon;
