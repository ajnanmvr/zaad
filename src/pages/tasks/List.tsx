import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, User, Eye, Edit, Trash2, CheckSquare } from "lucide-react";
import type { ITask } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
    variant?: "outline" | "default";
}

const Badge = ({ children, className }: BadgeProps) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>{children}</span>
);

export default function TaskList() {
    const { tasks, deleteTask } = useStore();
    const navigate = useNavigate();
    const [deleteItem, setDeleteItem] = useState<ITask | null>(null);

    const filteredTasks = tasks;

    const pendingTasks = filteredTasks.filter((t: ITask) => t.status === 'pending');
    const inProgressTasks = filteredTasks.filter((t: ITask) => t.status === 'in-progress');
    const completedTasks = filteredTasks.filter((t: ITask) => t.status === 'completed');

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <CheckSquare className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                        Task Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Assign and track team tasks</p>
                </div>
                <Button onClick={() => navigate("/tasks/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Create Task
                </Button>
            </div>

            {/* Status Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatusCard label="Pending" count={pendingTasks.length} color="bg-orange-500" />
                <StatusCard label="In Progress" count={inProgressTasks.length} color="bg-blue-500" />
                <StatusCard label="Completed" count={completedTasks.length} color="bg-emerald-500" />
            </div>

            <div className="space-y-6">
                {/* Pending */}
                <Section title="Pending" tasks={pendingTasks} color="text-orange-600" onDelete={setDeleteItem} />

                {/* In Progress */}
                <Section title="In Progress" tasks={inProgressTasks} color="text-blue-600" onDelete={setDeleteItem} />

                {/* Completed */}
                <Section title="Completed" tasks={completedTasks} color="text-emerald-600" onDelete={setDeleteItem} />
            </div>

            <DeleteConfirmationDialog
                open={!!deleteItem}
                title="Delete Task"
                itemName={deleteItem?.title}
                description={`Are you sure you want to delete the task "${deleteItem?.title}"? This action cannot be undone.`}
                onConfirm={() => {
                    if (deleteItem) {
                        deleteTask(deleteItem._id);
                        setDeleteItem(null);
                    }
                }}
                onCancel={() => setDeleteItem(null)}
            />
        </div>
    );
}

interface StatusCardProps {
    label: string;
    count: number;
    color: string;
}

function StatusCard({ label, count, color }: StatusCardProps) {
    return (
        <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 flex items-center justify-between">
                <span className="font-medium text-slate-600 dark:text-slate-400">{label}</span>
                <span className={`px-3 py-1 rounded-full text-white font-bold text-sm ${color}`}>{count}</span>
            </CardContent>
        </Card>
    )
}

function Section({ title, tasks, color, onDelete }: { title: string, tasks: ITask[], color: string, onDelete: (task: ITask) => void }) {
    if (tasks.length === 0) return null;
    return (
        <div className="space-y-3">
            <h3 className={`text-lg font-bold ${color} flex items-center gap-2`}>
                {title}
                <span className="text-sm font-normal text-slate-400">({tasks.length})</span>
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map(task => (
                    <TaskCard key={task._id} task={task} onDelete={onDelete} />
                ))}
            </div>
        </div>
    )
}

function TaskCard({ task, onDelete }: { task: ITask, onDelete: (task: ITask) => void }) {
    const navigate = useNavigate();
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 dark:border-slate-800">
            <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-tight">{task.title}</h4>
                    <Badge variant="outline" className={`shrink-0 capitalize ${task.priority === 'high' ? 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        task.priority === 'medium' ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                        {task.priority || 'Low'}
                    </Badge>
                </div>

                {task.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{task.description}</p>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{task.dueDate || 'No Date'}</span>
                    </div>
                    {task.assignedTo && (
                        <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>User {task.assignedTo.substr(0, 4)}...</span>
                        </div>
                    )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/tasks/${task._id}`)}
                        title="View details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/tasks/${task._id}/edit`)}
                        title="Edit task"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => onDelete(task)}
                        title="Delete task"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
