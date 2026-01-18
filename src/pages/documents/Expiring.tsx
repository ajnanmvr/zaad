import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, AlertTriangle, CheckCircle, Clock, Building2, User, UserCircle } from "lucide-react";
import type { IDocument } from "@/types";
import { parseISO, differenceInDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ExpiringDocuments() {
    const { documents, companies, employees, individuals } = useStore();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<'all' | 'week' | 'month' | 'later'>('all');
    const [dismissedDocs, setDismissedDocs] = useState<Set<string>>(new Set());
    const [dismissMenu, setDismissMenu] = useState<string | null>(null);
    const [customReason, setCustomReason] = useState("");
    const dismissReasons = ["Renewed by other provider", "Not interested", "Will renew later", "Custom reason"];

    const today = new Date();

    const getOwnerDetails = (doc: IDocument) => {
        if (doc.company) {
            const comp = companies.find((c) => c._id === doc.company);
            return { type: 'company', name: comp?.name || 'Unknown', email: comp?.email, icon: Building2 };
        }
        if (doc.employee) {
            const emp = employees.find((e) => e._id === doc.employee);
            const comp = emp?.company ? companies.find((c) => c._id === emp.company)?.name : "Unknown Co";
            return { type: 'employee', name: emp?.name || 'Unknown', sub: comp, email: emp?.email, icon: User };
        }
        if (doc.individual) {
            const ind = individuals.find((i) => i._id === doc.individual);
            return { type: 'individual', name: ind?.name || 'Unknown', email: ind?.email, icon: UserCircle };
        }
        return { type: 'unknown', name: 'Unknown', icon: AlertTriangle };
    };

    const getUrgency = (expiryStr?: string) => {
        if (!expiryStr) return 'unknown';
        const expiry = parseISO(expiryStr);
        const daysLeft = differenceInDays(expiry, today);

        if (daysLeft < 0) return 'expired';
        if (daysLeft <= 7) return 'critical';
        if (daysLeft <= 30) return 'attention';
        return 'upcoming';
    };

    const handleDismiss = (docId: string, reason: string) => {
        setDismissedDocs(prev => new Set(prev).add(docId));
        setDismissMenu(null);
        setCustomReason("");
        console.log(`Document ${docId} dismissed with reason: ${reason}`);
    };

    const handleRenew = (docId: string) => {
        alert(`Renewal initiated for document ${docId}. In a real app, this would open a renewal form.`);
    };

    const filteredDocs = documents.filter((doc) => {
        if (dismissedDocs.has(doc._id)) return false;
        if (!doc.expiryDate) return false;
        const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        const urgency = getUrgency(doc.expiryDate);
        if (filter === 'week') return urgency === 'critical' || urgency === 'expired';
        if (filter === 'month') return urgency === 'attention';
        if (filter === 'later') return urgency === 'upcoming';
        return urgency !== 'unknown';
    }).sort((a, b) => (a.expiryDate!).localeCompare(b.expiryDate!));

    const counts = {
        week: documents.filter((d) => !dismissedDocs.has(d._id) && ['critical', 'expired'].includes(getUrgency(d.expiryDate))).length,
        month: documents.filter((d) => !dismissedDocs.has(d._id) && getUrgency(d.expiryDate) === 'attention').length,
        later: documents.filter((d) => !dismissedDocs.has(d._id) && getUrgency(d.expiryDate) === 'upcoming').length
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Clock className="h-8 w-8 text-brand-600" />
                        Expiring Documents
                    </h1>
                    <p className="text-slate-500">Monitor renewals with company context</p>
                </div>
                <Button onClick={() => navigate("/documents/new")}>
                    <Plus className="mr-2 h-4 w-4" /> New Document
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-50 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search documents..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-white dark:bg-slate-900"
                    />
                </div>
                <FilterButton
                    label="Expiring this week"
                    count={counts.week}
                    active={filter === 'week'}
                    onClick={() => setFilter(filter === 'week' ? 'all' : 'week')}
                    color="text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900"
                />
                <FilterButton
                    label="Expiring in 30 days"
                    count={counts.month}
                    active={filter === 'month'}
                    onClick={() => setFilter(filter === 'month' ? 'all' : 'month')}
                    color="text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-900"
                />
                <FilterButton
                    label="Upcoming later"
                    count={counts.later}
                    active={filter === 'later'}
                    onClick={() => setFilter(filter === 'later' ? 'all' : 'later')}
                    color="text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900"
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Renewal queue</h2>
                    <span className="text-sm text-slate-500">Sorted by urgency</span>
                </div>

                {filteredDocs.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No documents found matching the criteria.</p>
                    </div>
                )}

                {filteredDocs.map(doc => {
                    const owner = getOwnerDetails(doc);
                    const urgency = getUrgency(doc.expiryDate);
                    const daysLeft = differenceInDays(parseISO(doc.expiryDate!), today);

                    return (
                        <Card key={doc._id} className={cn(
                            "border-l-4 transition-all hover:shadow-md",
                            urgency === 'expired' ? "border-l-red-600 border-red-100 dark:border-red-900/50 bg-red-50/10" :
                                urgency === 'critical' ? "border-l-red-500" :
                                    urgency === 'attention' ? "border-l-orange-500" :
                                        "border-l-emerald-500"
                        )}>
                            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                                <div className="space-y-1 min-w-50">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{doc.name}</h3>
                                        <Badge urgency={urgency} />
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <owner.icon className="w-3 h-3" />
                                        <span className="capitalize">{owner.type}</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-1 text-sm border-l border-slate-100 dark:border-slate-800 pl-0 sm:pl-6">
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">{owner.name}</div>
                                    {owner.sub && <div className="text-slate-500">{owner.sub}</div>}
                                    <div className="text-slate-400 text-xs">{owner.email}</div>
                                </div>

                                <div className="flex-1 space-y-1 text-sm border-l border-slate-100 dark:border-slate-800 pl-0 sm:pl-6">
                                    <div className="font-mono font-medium text-slate-700 dark:text-slate-300">{doc.expiryDate}</div>
                                    <div className={cn(
                                        "font-bold",
                                        daysLeft < 0 ? "text-red-600" : daysLeft <= 30 ? "text-orange-600" : "text-emerald-600"
                                    )}>
                                        {daysLeft < 0 ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days left`}
                                    </div>
                                    {urgency === 'critical' && <div className="text-xs text-red-500 italic">Immediate action required</div>}
                                </div>

                                <div className="relative flex flex-row sm:flex-col gap-2 pt-4 sm:pt-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800">
                                    <Button 
                                        size="sm" 
                                        className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700"
                                        onClick={() => handleRenew(doc._id)}
                                    >
                                        Renew
                                    </Button>
                                    <div className="relative w-full sm:w-auto">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="w-full text-slate-400 hover:text-slate-600"
                                            onClick={() => setDismissMenu(dismissMenu === doc._id ? null : doc._id)}
                                        >
                                            Dismiss
                                        </Button>
                                        {dismissMenu === doc._id && (
                                            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                                                {dismissReasons.map((reason) => (
                                                    <div key={reason}>
                                                        {reason !== 'Custom reason' ? (
                                                            <button
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 first:rounded-t-lg dark:text-slate-200"
                                                                onClick={() => handleDismiss(doc._id, reason)}
                                                            >
                                                                {reason}
                                                            </button>
                                                        ) : (
                                                            <input
                                                                className="w-full px-3 py-2 text-sm border-t border-slate-200 dark:border-slate-700 rounded-b-lg bg-white dark:bg-slate-800 dark:text-slate-200"
                                                                placeholder="Custom reason..."
                                                                value={customReason}
                                                                onChange={(e) => setCustomReason(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && customReason) {
                                                                        handleDismiss(doc._id, customReason);
                                                                    }
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

interface FilterButtonProps {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
    color: string;
}

function FilterButton({ label, count, active, onClick, color }: FilterButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                active ? color : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            )}
        >
            <span>{label}</span>
            <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs bg-white/50 dark:bg-black/20",
                active ? "font-bold" : "text-slate-500"
            )}>{count}</span>
        </button>
    );
}

function Badge({ urgency }: { urgency: string }) {
    if (urgency === 'expired') return <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">Expired</span>;
    if (urgency === 'critical') return <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 dark:bg-red-900/10 px-2 py-0.5 rounded-full">Critical</span>;
    if (urgency === 'attention') return <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">Attention</span>;
    return <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Upcoming</span>;
}
