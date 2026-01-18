import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type CreateTaskInput } from "@/lib/schemas";
import { useStore } from "@/store";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

type TaskFormValues = CreateTaskInput;

export default function TaskForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { tasks, addTask, updateTask, deleteTask, users } = useStore();
    const isEdit = !!id;

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<TaskFormValues>({      // eslint-disable-next-line @typescript-eslint/no-explicit-any        resolver: zodResolver(createTaskSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            assignedTo: "",
            status: "pending",
            priority: "medium",
            dueDate: "",
        },
    });

    useEffect(() => {
        if (isEdit && id) {
            const task = tasks.find((t) => t._id === id);
            if (task) {
                setValue("title", task.title);
                setValue("description", task.description || "");
                setValue("assignedTo", task.assignedTo || "");
                setValue("status", task.status);
                setValue("priority", task.priority);
                setValue("dueDate", task.dueDate || "");
            } else {
                navigate("/tasks");
            }
        }
    }, [id, isEdit, tasks, navigate, setValue]);

    const onSubmit = (data: TaskFormValues) => {
        if (isEdit && id) {
            updateTask(id, data);
        } else {
            // Mock createdBy for now
            addTask({ ...data, published: true, createdBy: "current_user" });
        }
        navigate("/tasks");
    };

    const handleDelete = () => {
        if (isEdit && id) {
            if (confirm("Are you sure you want to delete this task?")) {
                deleteTask(id);
                navigate("/tasks");
            }
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/tasks")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Task" : "New Task"}</h1>
                </div>
                {isEdit && (
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                )}
            </div>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <form onSubmit={handleSubmit(onSubmit as any)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Task Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Task Title *</Label>
                            <Input
                                id="title"
                                {...register("title")}
                            />
                            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                {...register("description")}
                                className="flex min-h-20 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <select
                                    id="priority"
                                    {...register("priority")}
                                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    {...register("dueDate")}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    {...register("status")}
                                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="assignedTo">Assign To</Label>
                                <select
                                    id="assignedTo"
                                    {...register("assignedTo")}
                                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                    <option value="user_1">Demo User</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => navigate("/tasks")}>Cancel</Button>
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" /> Save Task
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
