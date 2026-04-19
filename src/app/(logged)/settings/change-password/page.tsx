"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ChangePassword from "@/components/Forms/ChangePassword";

export default function ChangePasswordPage() {
  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <Breadcrumb pageName="Change Password" />
      <div className="mt-6">
        <ChangePassword />
      </div>
    </div>
  );
}
