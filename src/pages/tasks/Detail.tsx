import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Edit, Calendar, CheckCircle2 } from "lucide-react";

import type { ITask } from "@/types";

export default function TaskDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const tasks: any[] = [];

    const task = tasks.find((t: ITask) => t._id === id);

    if (!task) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Task not found</h2>
                <Button className="mt-4" onClick={() => navigate("/tasks")}>Go Back</Button>
            </div>
        );
    }

    const priorityColors: Record<string, string> = {
        high: "text-red-600 bg-red-50 dark:bg-red-900/20",
        medium: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
        low: "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/tasks")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Task Management</h1>
                </div>
                <Button onClick={() => navigate(`/tasks/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="text-xl">{task.title}</CardTitle>
                            <CardDescription>Created on {new Date(task.createdAt).toLocaleDateString()}</CardDescription>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                            {task.priority} Priority
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {task.description || "No description provided."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <Calendar className="h-5 w-5 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Due Date</p>
                                <p className="font-medium">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <CheckCircle2 className={`h-5 w-5 ${task.status === 'completed' ? 'text-green-500' : 'text-slate-500'}`} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Status</p>
                                <p className="font-medium capitalize">{task.status}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
