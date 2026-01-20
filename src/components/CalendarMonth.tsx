import { ChevronLeft, ChevronRight, FileText, CheckSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ICalendarEvents } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay } from 'date-fns';

interface CalendarMonthProps extends ICalendarEvents {
    year: number;
    month: number;
    onSelectDate?: (date: Date) => void;
    onMonthChange?: (year: number, month: number) => void;
}

export function CalendarMonth({
    year,
    month,
    events,
    tasks,
    onSelectDate,
    onMonthChange
}: CalendarMonthProps) {
    
    const currentDate = new Date(year, month - 1); // JS Month is 0-indexed
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Calculate padding days for the start of the week (Sun -> Sat)
    const startDay = getDay(monthStart);
    const paddingDays = Array.from({ length: startDay });

    const handlePrevMonth = () => {
        const prev = subMonths(currentDate, 1);
        onMonthChange?.(prev.getFullYear(), prev.getMonth() + 1);
    };

    const handleNextMonth = () => {
        const next = addMonths(currentDate, 1);
        onMonthChange?.(next.getFullYear(), next.getMonth() + 1);
    };

    const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="py-2 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr">
                {/* Empty padding cells */}
                {paddingDays.map((_, i) => (
                    <div key={`padding-${i}`} className="min-h-25 border-b border-r border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30" />
                ))}

                {/* Days */}
                {daysInMonth.map((date) => {
                    const dateKey = formatDateKey(date);
                    const dayEvents = events[dateKey];
                    const dayTasks = tasks[dateKey];
                    const isCurrentMonth = isSameMonth(date, currentDate);
                    const isCurrentDay = isToday(date);

                    return (
                        <div
                            key={date.toString()}
                            className={cn(
                                "min-h-25 p-2 border-b border-r border-slate-100 dark:border-slate-800/50 relative hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group",
                                !isCurrentMonth && "text-slate-300 bg-slate-50/50"
                            )}
                            onClick={() => onSelectDate?.(date)}
                        >
                            <div className="flex justify-between items-start">
                                <span
                                    className={cn(
                                        "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                        isCurrentDay
                                            ? "bg-brand-600 text-white shadow-sm"
                                            : "text-slate-700 dark:text-slate-300"
                                    )}
                                >
                                    {format(date, 'd')}
                                </span>
                            </div>

                            {/* Indicators */}
                            <div className="mt-2 space-y-1">
                                {/* Expiring Documents */}
                                {(dayEvents?.expired || 0) > 0 && (
                                    <div className="flex items-center gap-1.5 text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">
                                        <AlertTriangle className="w-3 h-3 shrink-0" />
                                        <span className="font-medium truncate">{dayEvents?.expired} Expired</span>
                                    </div>
                                )}
                                {(dayEvents?.expiring || 0) > 0 && (
                                    <div className="flex items-center gap-1.5 text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100">
                                        <FileText className="w-3 h-3 shrink-0" />
                                        <span className="font-medium truncate">{dayEvents?.expiring} Expiring</span>
                                    </div>
                                )}
                                {/* Tasks */}
                                {dayTasks?.map((task) => (
                                    <div key={task.id} className={cn(
                                        "flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded border truncate",
                                        task.status === 'completed'
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 line-through opacity-70"
                                            : "bg-blue-50 text-blue-700 border-blue-100"
                                    )}>
                                        <CheckSquare className="w-3 h-3 shrink-0" />
                                        <span className="truncate max-w-full">{task.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
