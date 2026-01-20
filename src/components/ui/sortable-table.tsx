import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
    key: keyof T & string;
    header: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
}

interface SortableTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    className?: string;
    onRowClick?: (item: T) => void;
    renderSubRow?: (item: T) => React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SortableTable<T extends Record<string, unknown>>({
    data,
    columns,
    className = '',
    onRowClick,
    renderSubRow,
}: SortableTableProps<T>) {
    const [sortKey, setSortKey] = useState<keyof T | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const handleSort = (key: keyof T) => {
        if (sortKey === key) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortDirection(null);
                setSortKey(null);
            } else {
                setSortDirection('asc');
            }
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const sortedData = React.useMemo(() => {
        if (!sortKey || !sortDirection) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];

            if (aVal === bVal) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            const aString = String(aVal);
            const bString = String(bVal);
            const comparison = aString.localeCompare(bString);
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [data, sortKey, sortDirection]);

    return (
        <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800 ${className}`}>
            <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-200 dark:bg-slate-900/80 dark:border-slate-800">
                    <tr>
                        {columns.map((column) => {
                            const columnKey = column.key as string;
                            return (
                                <th
                                    key={columnKey}
                                    className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400 ${column.headerClassName || ''}`}
                                >
                                    {column.sortable !== false ? (
                                        <button
                                            onClick={() => handleSort(column.key)}
                                            className="flex items-center gap-1 hover:text-brand-600 transition-colors"
                                        >
                                            {column.header}
                                            {sortKey === column.key ? (
                                                sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-brand-500" /> : <ArrowDown className="h-3.5 w-3.5 text-brand-500" />
                                            ) : (
                                                <ArrowUpDown className="h-3.5 w-3.5 opacity-30 group-hover:opacity-50" />
                                            )}
                                        </button>
                                    ) : (
                                        column.header
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedData.map((item, index) => (
                        <React.Fragment key={index}>
                            <tr
                                onClick={() => onRowClick?.(item)}
                                className={onRowClick ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors duration-150' : ''}
                            >
                                {columns.map((column) => {
                                    const cellValue = item[column.key];
                                    return (
                                        <td key={column.key} className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-300 ${column.className || ''}`}>
                                            {column.render ? column.render(item) : String(cellValue ?? '')}
                                        </td>
                                    );
                                })}
                            </tr>
                            {renderSubRow && renderSubRow(item)}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
