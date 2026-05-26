import React from 'react';
import { Card } from './Card';
import { Spinner } from './Spinner';

export const Table = ({ columns, data, isLoading, emptyState, emptyStateIcon = 'folder_open', emptyStateAction, onRowClick }) => {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-white/5 border-b border-border">
              {columns.map((col, index) => (
                <th 
                  key={index} 
                  className={`py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <Spinner />
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`py-4 px-6 text-sm text-text-main ${col.cellClassName || ''}`}>
                      {col.accessor ? row[col.accessor] : col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-white/5 text-text-muted rounded-full flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-3xl">{emptyStateIcon}</span>
                    </div>
                    <p className="text-text-main font-bold mb-1">{emptyState || 'No data found.'}</p>
                    <p className="text-text-muted text-sm mb-6 text-center">It looks like there's nothing here yet.</p>
                    {emptyStateAction && emptyStateAction}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export const TablePagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <div className="text-sm text-text-muted">
        Showing page <span className="font-bold text-text-main">{pagination.page}</span> of <span className="font-bold text-text-main">{pagination.pages}</span> ({pagination.total} total)
      </div>
      <div className="flex gap-2">
        <button 
          disabled={pagination.page === 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="p-2 rounded-lg bg-surface border border-border text-text-main hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <button 
          disabled={pagination.page === pagination.pages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="p-2 rounded-lg bg-surface border border-border text-text-main hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
};
