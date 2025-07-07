import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export interface UberSyncLog {
  id?: string;
  startedAt?: string;
  finishedAt?: string;
  status?: string;
  type?: string;
  driversProcessed?: number;
  driversCreated?: number;
  driversUpdated?: number;
  createdBy?: string;
  errorMessage?: string;
}

interface UberSyncHistoryTableProps {
  logs: UberSyncLog[];
  loading?: boolean;
  error?: string | null;
}

export function UberSyncHistoryTable({ logs, loading, error }: UberSyncHistoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-3 py-2 text-left">Started</th>
            <th className="px-3 py-2 text-left">Finished</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-left">Processed</th>
            <th className="px-3 py-2 text-left">Created</th>
            <th className="px-3 py-2 text-left">Updated</th>
            <th className="px-3 py-2 text-left">By</th>
            <th className="px-3 py-2 text-left">Error</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} className="text-center py-8"><RefreshCw className="animate-spin inline-block mr-2" /> Loading...</td></tr>
          ) : error ? (
            <tr><td colSpan={9} className="text-center text-red-600 py-8">{error}</td></tr>
          ) : logs.length === 0 ? (
            <tr><td colSpan={9} className="text-center text-muted-foreground py-8">No sync history found.</td></tr>
          ) : (
            logs.map((log, i) => {
              const rowClass =
                log.status === 'FAILURE' ? 'bg-red-50 dark:bg-red-900/20' :
                log.status === 'PARTIAL' ? 'bg-yellow-50 dark:bg-yellow-900/20' : '';
              return (
                <tr key={log.id || i} className={`border-b last:border-0 ${rowClass}`}>
                  <td className="px-3 py-2 whitespace-nowrap">{log.startedAt ? new Date(log.startedAt).toLocaleString() : ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{log.finishedAt ? new Date(log.finishedAt).toLocaleString() : ''}</td>
                  <td className="px-3 py-2 font-semibold">
                    <span className={
                      log.status === 'SUCCESS' ? 'text-green-600' :
                      log.status === 'FAILURE' ? 'text-red-600' :
                      'text-yellow-600'
                    }>{log.status}</span>
                  </td>
                  <td className="px-3 py-2">{log.type}</td>
                  <td className="px-3 py-2">{log.driversProcessed}</td>
                  <td className="px-3 py-2">{log.driversCreated}</td>
                  <td className="px-3 py-2">{log.driversUpdated}</td>
                  <td className="px-3 py-2">{log.createdBy || 'system'}</td>
                  <td className="px-3 py-2 text-red-600 max-w-xs truncate">
                    {log.errorMessage ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{log.errorMessage.slice(0, 60)}{log.errorMessage.length > 60 ? '…' : ''}</span>
                          </TooltipTrigger>
                          <TooltipContent>{log.errorMessage}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : ''}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default UberSyncHistoryTable; 