import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IDocument } from "@/types";
import { AlertCircle, CheckCircle, Clock, AlertTriangle, Calendar, X, RefreshCw } from "lucide-react";
import { parseISO, differenceInDays } from "date-fns";

interface DocumentManagementProps {
    documents: IDocument[];
    onRenew?: (docId: string) => void;
    onDismiss?: (docId: string, reason: string) => void;
    compact?: boolean;
}

const dismissReasons = [
    "Renewed by other provider",
    "Not interested",
    "Will renew later",
    "Custom reason",
];

const getDocumentStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'unknown', label: 'Unknown', color: 'slate', icon: AlertTriangle };

    const today = new Date();
    const expiry = parseISO(expiryDate);
    const daysLeft = differenceInDays(expiry, today);

    if (daysLeft < 0) {
        return {
            status: 'expired',
            label: `Expired ${Math.abs(daysLeft)} days ago`,
            color: 'red',
            icon: AlertCircle,
            bgColor: 'bg-red-50 dark:bg-red-900/10',
            borderColor: 'border-red-200 dark:border-red-900',
            textColor: 'text-red-700 dark:text-red-400',
        };
    }

    if (daysLeft === 0) {
        return {
            status: 'today',
            label: 'Expires Today',
            color: 'red',
            icon: AlertTriangle,
            bgColor: 'bg-red-50 dark:bg-red-900/10',
            borderColor: 'border-red-200 dark:border-red-900',
            textColor: 'text-red-700 dark:text-red-400',
        };
    }

    if (daysLeft <= 7) {
        return {
            status: 'critical',
            label: `${daysLeft} days left`,
            color: 'orange',
            icon: AlertTriangle,
            bgColor: 'bg-orange-50 dark:bg-orange-900/10',
            borderColor: 'border-orange-200 dark:border-orange-900',
            textColor: 'text-orange-700 dark:text-orange-400',
        };
    }

    if (daysLeft <= 30) {
        return {
            status: 'attention',
            label: `${daysLeft} days left`,
            color: 'amber',
            icon: Clock,
            bgColor: 'bg-amber-50 dark:bg-amber-900/10',
            borderColor: 'border-amber-200 dark:border-amber-900',
            textColor: 'text-amber-700 dark:text-amber-400',
        };
    }

    return {
        status: 'valid',
        label: `${daysLeft} days left`,
        color: 'green',
        icon: CheckCircle,
        bgColor: 'bg-green-50 dark:bg-green-900/10',
        borderColor: 'border-green-200 dark:border-green-900',
        textColor: 'text-green-700 dark:text-green-400',
    };
};

export function DocumentCard({ doc, status, onRenew, onDismiss }: {
    doc: IDocument;
    status: ReturnType<typeof getDocumentStatus>;
    onRenew?: () => void;
    onDismiss?: (reason: string) => void;
}) {
    const [showDismissMenu, setShowDismissMenu] = useState(false);
    const [customReason, setCustomReason] = useState("");
    const Icon = status.icon;

    const handleDismiss = (reason: string) => {
        if (reason === 'Custom reason' && !customReason) {
            alert('Please enter a custom reason');
            return;
        }
        onDismiss?.(reason === 'Custom reason' ? customReason : reason);
        setShowDismissMenu(false);
        setCustomReason("");
    };

    return (
        <div className={`border rounded-lg p-4 ${status.bgColor} ${status.borderColor}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${status.textColor}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{doc.name}</p>
                        <p className={`text-sm ${status.textColor}`}>{status.label}</p>
                        {doc.expiryDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(doc.expiryDate).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {(status.status === 'expired' || status.status === 'critical' || status.status === 'today') && (
                        <Button
                            size="sm"
                            onClick={onRenew}
                            className="whitespace-nowrap"
                        >
                            <RefreshCw className="w-4 h-4 mr-1" /> Renew
                        </Button>
                    )}

                    <div className="relative">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowDismissMenu(!showDismissMenu)}
                        >
                            <X className="w-4 h-4" />
                        </Button>

                        {showDismissMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                                {dismissReasons.map((reason) => (
                                    <div key={reason}>
                                        {reason === 'Custom reason' ? (
                                            <div className="p-2 border-t border-gray-200 dark:border-slate-700">
                                                <Input
                                                    placeholder="Enter reason..."
                                                    value={customReason}
                                                    onChange={(e) => setCustomReason(e.target.value)}
                                                    className="text-xs mb-2"
                                                />
                                                <Button
                                                    size="sm"
                                                    className="w-full text-xs"
                                                    onClick={() => handleDismiss(reason)}
                                                >
                                                    Dismiss
                                                </Button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleDismiss(reason)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-slate-700 last:border-0"
                                            >
                                                {reason}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DocumentManagement({
    documents,
    onRenew,
    onDismiss,
    compact = false,
}: DocumentManagementProps) {
    const categorizedDocs = {
        expired: documents.filter(d => getDocumentStatus(d.expiryDate).status === 'expired'),
        critical: documents.filter(d => getDocumentStatus(d.expiryDate).status === 'critical'),
        attention: documents.filter(d => getDocumentStatus(d.expiryDate).status === 'attention'),
        valid: documents.filter(d => getDocumentStatus(d.expiryDate).status === 'valid'),
    };

    if (compact) {
        return (
            <div className="space-y-3">
                {documents.length === 0 && (
                    <p className="text-sm text-gray-500">No documents</p>
                )}
                {documents.map(doc => {
                    const status = getDocumentStatus(doc.expiryDate);
                    return (
                        <DocumentCard
                            key={doc._id}
                            doc={doc}
                            status={status}
                            onRenew={() => onRenew?.(doc._id)}
                            onDismiss={(reason) => onDismiss?.(doc._id, reason)}
                        />
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Expired Documents */}
            {categorizedDocs.expired.length > 0 && (
                <Card className="border-red-200 dark:border-red-900">
                    <CardHeader className="bg-red-50 dark:bg-red-900/10">
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            Expired Documents ({categorizedDocs.expired.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        {categorizedDocs.expired.map(doc => (
                            <DocumentCard
                                key={doc._id}
                                doc={doc}
                                status={getDocumentStatus(doc.expiryDate)}
                                onRenew={() => onRenew?.(doc._id)}
                                onDismiss={(reason) => onDismiss?.(doc._id, reason)}
                            />
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Critical Documents */}
            {categorizedDocs.critical.length > 0 && (
                <Card className="border-orange-200 dark:border-orange-900">
                    <CardHeader className="bg-orange-50 dark:bg-orange-900/10">
                        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                            <AlertTriangle className="w-5 h-5" />
                            Urgent Renewal ({categorizedDocs.critical.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        {categorizedDocs.critical.map(doc => (
                            <DocumentCard
                                key={doc._id}
                                doc={doc}
                                status={getDocumentStatus(doc.expiryDate)}
                                onRenew={() => onRenew?.(doc._id)}
                                onDismiss={(reason) => onDismiss?.(doc._id, reason)}
                            />
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Attention Needed */}
            {categorizedDocs.attention.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-900">
                    <CardHeader className="bg-amber-50 dark:bg-amber-900/10">
                        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <Clock className="w-5 h-5" />
                            Expiring Soon ({categorizedDocs.attention.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        {categorizedDocs.attention.map(doc => (
                            <DocumentCard
                                key={doc._id}
                                doc={doc}
                                status={getDocumentStatus(doc.expiryDate)}
                                onRenew={() => onRenew?.(doc._id)}
                                onDismiss={(reason) => onDismiss?.(doc._id, reason)}
                            />
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Valid Documents */}
            {categorizedDocs.valid.length > 0 && (
                <Card className="border-green-200 dark:border-green-900">
                    <CardHeader className="bg-green-50 dark:bg-green-900/10">
                        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-5 h-5" />
                            Valid Documents ({categorizedDocs.valid.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        {categorizedDocs.valid.map(doc => (
                            <DocumentCard
                                key={doc._id}
                                doc={doc}
                                status={getDocumentStatus(doc.expiryDate)}
                                onRenew={() => onRenew?.(doc._id)}
                                onDismiss={(reason) => onDismiss?.(doc._id, reason)}
                            />
                        ))}
                    </CardContent>
                </Card>
            )}

            {documents.length === 0 && (
                <Card>
                    <CardContent className="pt-6 text-center text-gray-500">
                        <p>No documents found</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
