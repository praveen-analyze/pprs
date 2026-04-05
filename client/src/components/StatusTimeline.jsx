import React from 'react';

const STATUS_CONFIG = {
  submitted    : { color: 'bg-gray-500',   label: 'Submitted'    },
  under_review : { color: 'bg-amber-500',  label: 'Under Review' },
  assigned     : { color: 'bg-blue-500',   label: 'Assigned'     },
  in_progress  : { color: 'bg-purple-500', label: 'In Progress'  },
  resolved     : { color: 'bg-green-500',  label: 'Resolved'     },
  rejected     : { color: 'bg-red-500',    label: 'Rejected'     },
};

function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(date));
}

export default function StatusTimeline({ logs = [] }) {
  if (!logs || logs.length === 0) {
    return <div className="text-sm text-gray-400 text-center py-6">No status history available.</div>;
  }
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {logs.map((log, idx) => {
          const isLast   = idx === logs.length - 1;
          const isLatest = idx === 0;
          const config   = STATUS_CONFIG[log.newStatus] || STATUS_CONFIG.submitted;
          return (
            <li key={idx}>
              <div className="relative pb-8">
                {!isLast && <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" />}
                <div className="relative flex items-start space-x-3">
                  <div className="relative flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white ${config.color}`}>
                      <span className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    {isLatest && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary-600 rounded-full border-2 border-white animate-pulse" />}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {config.label}
                        {isLatest && <span className="ml-2 text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Current</span>}
                      </p>
                      <time className="text-xs text-gray-400 flex-shrink-0">{formatDate(log.changedAt)}</time>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">By <span className="font-medium text-gray-600">{log.changedBy}</span></p>
                    {log.note && (
                      <div className="mt-1.5 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        <p className="text-sm text-gray-600 leading-relaxed">{log.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
