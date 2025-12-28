"use client";

import * as React from "react";
import { User, Lock, Mail } from "lucide-react";
import { useUserContext } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function ModernSettingsPage() {
  const { user } = useUserContext();
  const displayName = user?.fullname || user?.username || "User";
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      if (window.toast) {
        window.toast.error("Passwords don't match");
      }
      return;
    }

    setLoading(true);
    // Add your password change logic here
    setTimeout(() => {
      setLoading(false);
      if (window.toast) {
        window.toast.success("Password changed successfully");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Settings</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-4xl">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                  Name
                </label>
                <div className="flex items-center gap-3 rounded-lg border border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm capitalize">{displayName}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                  Email
                </label>
                <div className="flex items-center gap-3 rounded-lg border border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{user?.email || "—"}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                  Role
                </label>
                <div className="flex items-center gap-3">
                  <Badge variant="success" className="capitalize">
                    {user?.role}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                  User ID
                </label>
                <div className="flex items-center gap-3 rounded-lg border border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    {user?._id || user?.id || "—"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-600" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                type="password"
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <Input
                type="password"
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                type="password"
                label="Confirm New Password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={loading}>
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card>
          <CardHeader>
            <CardTitle>Security Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Use a strong password with at least 8 characters</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Include uppercase, lowercase, numbers, and special characters</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Don't share your password with anyone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Change your password regularly</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
