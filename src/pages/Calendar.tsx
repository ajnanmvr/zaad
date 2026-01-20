import { useState, useMemo } from 'react';
import { CalendarMonth } from "@/components/CalendarMonth";
import { isBefore, parseISO, addDays } from "date-fns";
import type { ICalendarEvents, IDayCounts, ICalendarDocument, ICalendarTask } from "@/types";
import { AlertCircle, Calendar as CalendarIcon, Clock } from "lucide-react";

export default function CalendarPage() {
    const documents: any[] = [];
    const tasks: any[] = [];
    const [currentDate, setCurrentDate] = useState(new Date());
    const today = useMemo(() => new Date(), []);

    // Stats for Top Bar
    const expiredCount = documents.filter((d: any) =>
        d.expiryDate && isBefore(parseISO(d.expiryDate), today)
    ).length;

    const expiringSoonCount = documents.filter((d: any) =>
        d.expiryDate &&
        isBefore(parseISO(d.expiryDate), addDays(today, 30)) &&
        !isBefore(parseISO(d.expiryDate), today)
    ).length;

    // Aggregating Data for Calendar
    const calendarData = useMemo<ICalendarEvents>(() => {
        const events: Record<string, IDayCounts> = {};
        const docsMap: Record<string, ICalendarDocument[]> = {};
        const tasksMap: Record<string, ICalendarTask[]> = {};

        // Process Documents
        documents.forEach((doc) => {
            if (!doc.expiryDate) return;
            const dateKey = doc.expiryDate;

            // Counts
            if (!events[dateKey]) events[dateKey] = { expired: 0, expiring: 0 };

            const isExpired = isBefore(parseISO(doc.expiryDate), today);
            if (isExpired) {
                events[dateKey].expired = (events[dateKey].expired || 0) + 1;
            } else {
                events[dateKey].expiring = (events[dateKey].expiring || 0) + 1;
            }

            // List items
            if (!docsMap[dateKey]) docsMap[dateKey] = [];
            docsMap[dateKey].push({
                company: doc.company || 'Unknown',
                type: doc.type,
                expiresOn: doc.expiryDate
            });
        });

        // Process Tasks
        tasks.forEach((task) => {
            if (!task.dueDate) return;
            const dateKey = task.dueDate;

            if (!tasksMap[dateKey]) tasksMap[dateKey] = [];
            tasksMap[dateKey].push({
                id: task._id,
                title: task.title,
                status: task.status
            });
        });

        return { events, documents: docsMap, tasks: tasksMap };
    }, [documents, tasks, today]);

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <CalendarIcon className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                        Calendar & Expirations
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Click a date to see expiring documents and tasks</p>
                </div>

                <div className="flex gap-3">
                    <div className="flex items-center gap-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-800">
                        <AlertCircle className="w-5 h-5" />
                        <div className="flex flex-col">
                            <span className="text-xl font-bold leading-none">{expiredCount}</span>
                            <span className="text-xs font-medium opacity-80 uppercase">Expired</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg border border-orange-100 dark:border-orange-800">
                        <Clock className="w-5 h-5" />
                        <div className="flex flex-col">
                            <span className="text-xl font-bold leading-none">{expiringSoonCount}</span>
                            <span className="text-xs font-medium opacity-80 uppercase">Expiring Soon</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Component */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4">
                <CalendarMonth
                    year={currentDate.getFullYear()}
                    month={currentDate.getMonth() + 1}
                    events={calendarData.events}
                    documents={calendarData.documents}
                    tasks={calendarData.tasks}
                    onMonthChange={(y, m) => setCurrentDate(new Date(y, m - 1))}
                    onSelectDate={(date) => console.log('Selected', date)}
                />
            </div>
        </div>
    );
}
