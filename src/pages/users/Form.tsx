import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userService } from "@/services/user.service";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function UserForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = isEditing ? updateUserSchema : createUserSchema;

  type FormValues = UpdateUserInput | CreateUserInput;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      ...(isEditing ? { status: "active" } : { password: "" }),
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      loadUser();
    }
  }, [id, isEditing]);

  const loadUser = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const user = await userService.getUser(id);
      setValue("name", user.name);
      setValue("username", user.username);
      setValue("email", user.email);
      if (isEditing) {
        const formValues = user as UpdateUserInput;
        setValue("status", formValues.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setError("");

      if (isEditing && id) {
        await userService.updateUser(id, data as UpdateUserInput);
      } else {
        await userService.createUser(data as CreateUserInput);
      }

      navigate("/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/users")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "Edit User" : "New User"}
          </h1>
          <p className="text-gray-500">Manage system access and roles</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">User Profile</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name *
              </label>
              <Input
                {...register("name")}
                placeholder="John Doe"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Username *
              </label>
              <Input
                {...register("username")}
                placeholder="johndoe"
                disabled={isEditing}
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-sm text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address *
            </label>
            <Input
              type="email"
              {...register("email")}
              placeholder="john@zaad.ae"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password *
              </label>
              <Input
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className={
                  errors.password ? "border-red-500" : ""
                }
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}

          {isEditing && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                {...register("status" as const)}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              {(errors as any).status && (
                <p className="text-sm text-red-500">
                  {(errors as any).status.message}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/users")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
