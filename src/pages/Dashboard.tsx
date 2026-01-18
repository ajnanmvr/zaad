
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useStore } from "@/store";
import { Building2, Users, CheckSquare, UserCircle, ArrowRight, TrendingUp, TrendingDown, Clock, AlertOctagon, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { IDocument, ITask } from "@/types";
import { addDays, isBefore, parseISO, format } from "date-fns";
import { MyTasks } from "@/components/MyTasks";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    const { companies, employees, individuals, documents, tasks } = useStore();
    const navigate = useNavigate();
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);

    // --- Calculations for Key Metrics ---

    // Companies
    const companyDocs = documents.filter((d: IDocument) => Boolean(d.company)); // Rough check, assuming 'company' field is populated
    const expiringCompanyDocsCount = companyDocs.filter((d: IDocument) =>
        d.expiryDate && isBefore(parseISO(d.expiryDate), thirtyDaysFromNow)
    ).length;

    // Employees
    const empDocs = documents.filter((d: IDocument) => Boolean(d.employee));
    const expiringEmpDocsCount = empDocs.filter((d: IDocument) =>
        d.expiryDate && isBefore(parseISO(d.expiryDate), thirtyDaysFromNow)
    ).length;

    // Individuals
    const indDocs = documents.filter((d: IDocument) => Boolean(d.individual));
    const expiringIndDocsCount = indDocs.filter((d: IDocument) =>
        d.expiryDate && isBefore(parseISO(d.expiryDate), thirtyDaysFromNow)
    ).length;

    // Tasks
    const pendingTasksCount = tasks.filter((t: ITask) => t.status !== "completed").length;
    const completedTasksCount = tasks.filter((t: ITask) => t.status === "completed").length;


    // --- Calculations for Critical Alerts ---
    const expiredDocs = documents.filter((d: IDocument) =>
        d.expiryDate && isBefore(parseISO(d.expiryDate), today)
    );

    const expiringSoonDocs = documents.filter((d: IDocument) =>
        d.expiryDate &&
        isBefore(parseISO(d.expiryDate), thirtyDaysFromNow) &&
        !isBefore(parseISO(d.expiryDate), today)
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <LayoutDashboard className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                        Dashboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{format(today, 'EEEE, MMMM d, yyyy')}</p>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div>
                <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Key Metrics</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Companies"
                        value={companies.length}
                        subValue={`${expiringCompanyDocsCount} expiring soon`}
                        trend="+12.5%"
                        trendUp={true}
                        icon={Building2}
                        color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        onClick={() => navigate('/companies')}
                    />
                    <MetricCard
                        title="Employees"
                        value={employees.length}
                        subValue={`${expiringEmpDocsCount} expiring soon`}
                        trend="+8.2%"
                        trendUp={true}
                        icon={Users}
                        color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        onClick={() => navigate('/employees')}
                    />
                    <MetricCard
                        title="Individuals"
                        value={individuals.length}
                        subValue={`${expiringIndDocsCount} expiring soon`}
                        trend="+5.1%"
                        trendUp={true}
                        icon={UserCircle}
                        color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                        onClick={() => navigate('/individuals')}
                    />
                    <MetricCard
                        title="Pending Tasks"
                        value={pendingTasksCount}
                        subValue={`${completedTasksCount} completed`}
                        trend="-3.2%"
                        trendUp={false}
                        icon={CheckSquare}
                        color="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        onClick={() => navigate('/tasks')}
                    />
                </div>
            </div>

            {/* Main Content Grid: Alerts + My Tasks */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: Critical Alerts & CTA */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Critical Alerts</h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Immediate Action */}
                        <div className="relative overflow-hidden rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-6 flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/documents/expiring?filter=expired')}>
                            <div className="bg-red-100 dark:bg-red-900/40 w-10 h-10 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                                <AlertOctagon className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-red-900 dark:text-red-300">Documents Requiring Immediate Action</h3>
                                <p className="text-sm text-red-700 dark:text-red-400/80">Multiple documents have already expired and need urgent renewal</p>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-4xl font-bold text-red-700 dark:text-red-400">{expiredDocs.length}</span>
                                <ArrowRight className="w-5 h-5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                            </div>
                        </div>

                        {/* Expiring Soon */}
                        <div className="relative overflow-hidden rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 p-6 flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/documents/expiring?filter=soon')}>
                            <div className="bg-orange-100 dark:bg-orange-900/40 w-10 h-10 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 mb-4">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-orange-900 dark:text-orange-300">Documents Expiring Soon</h3>
                                <p className="text-sm text-orange-700 dark:text-orange-400/80">Schedule renewals to prevent service interruptions</p>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-4xl font-bold text-orange-700 dark:text-orange-400">{expiringSoonDocs.length}</span>
                                <ArrowRight className="w-5 h-5 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                            </div>
                        </div>
                    </div>

                    {/* Financial CTA */}
                    <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-950 p-6 sm:p-10 text-white shadow-lg">
                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="space-y-2 max-w-md">
                                <h3 className="text-xl font-bold">Ready to dive deeper?</h3>
                                <p className="text-slate-300">Access detailed financial reports, transaction history, and profit analytics for your business.</p>
                            </div>
                            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => navigate('/financials')}>
                                Open Financial Dashboard
                            </Button>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
                    </div>
                </div>

                {/* Right Column: My Tasks */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">My Tasks</h2>
                        <Button variant="ghost" className="text-sm h-auto p-0 hover:bg-transparent text-brand-600 hover:text-brand-700" onClick={() => navigate('/tasks')}>
                            View All
                        </Button>
                    </div>
                    <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <CheckSquare className="w-4 h-4" />
                                <span>Recent & Upcoming</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <MyTasks tasks={tasks.filter((t: ITask) => t.status !== 'completed').sort((a: ITask, b: ITask) => (a.dueDate || '').localeCompare(b.dueDate || '')).slice(0, 5)} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: number | string;
    subValue: string;
    trend: string;
    trendUp: boolean;
    icon: LucideIcon;
    color: string;
    onClick?: () => void;
}

function MetricCard({ title, value, subValue, trend, trendUp, icon: Icon, color, onClick }: MetricCardProps) {
    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden" onClick={onClick}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">{value}</h3>
                    </div>
                    <div className={`p-3 rounded-lg ${color} transition-colors`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{subValue}</span>
                    <span className={`flex items - center font - medium ${trendUp ? 'text-emerald-600' : 'text-red-600'} `}>
                        {trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {trend}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
