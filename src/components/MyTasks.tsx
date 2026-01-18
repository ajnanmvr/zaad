import type { ITask } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';

interface MyTasksProps {
    tasks: ITask[];
    onTaskClick?: (task: ITask) => void;
}

export function MyTasks({ tasks, onTaskClick }: MyTasksProps) {
    if (tasks.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border border-dashed border-slate-200 rounded-xl">
                <CheckCircle2 className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No pending tasks</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tasks.map((task) => {
                const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
                const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);

                return (
                    <div
                        key={task._id}
                        onClick={() => onTaskClick?.(task)}
                        className="group flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all cursor-pointer"
                    >
                        <div className={cn(
                            "mt-0.5 shrink-0",
                            task.status === 'completed' ? "text-emerald-500" : "text-slate-300 group-hover:text-brand-500"
                        )}>
                            {task.status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <Circle className="w-5 h-5" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <h4 className={cn(
                                "text-sm font-medium truncate pr-2",
                                task.status === 'completed' ? "text-slate-500 line-through" : "text-slate-800 dark:text-slate-200"
                            )}>
                                {task.title}
                            </h4>

                            <div className="flex items-center gap-3 mt-1.5">
                                {dueDate && (
                                    <div className={cn(
                                        "flex items-center gap-1 text-xs",
                                        isOverdue ? "text-red-500 font-medium" : "text-slate-500"
                                    )}>
                                        {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                        <span>{format(dueDate, 'MMM d')}</span>
                                    </div>
                                )}

                                {task.priority === 'high' && (
                                    <span className="text-[10px] font-semibold tracking-wide uppercase text-orange-600 bg-orange-50 px-1.5 py-px rounded-full">
                                        High
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
