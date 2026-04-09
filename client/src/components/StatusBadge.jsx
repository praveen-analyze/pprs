import React from 'react';

const STATUS_MAP = {
  submitted    : { label: 'Submitted',    bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-200',   dot: 'bg-gray-500'   },
  under_review : { label: 'Under Review', bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
  assigned     : { label: 'Assigned',     bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
  in_progress  : { label: 'In Progress',  bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500' },
  resolved     : { label: 'Resolved',     bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-200',  dot: 'bg-green-500'  },
  rejected     : { label: 'Rejected',     bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200',    dot: 'bg-red-500'    },
};

export default function StatusBadge({ status, size = 'md' }) {
  const c = STATUS_MAP[status] || STATUS_MAP.submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full shadow-sm border ${c.border} ${c.bg} ${c.text} ${size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3.5 py-1'}`}>
      <span className={`rounded-full flex-shrink-0 shadow-sm ${c.dot} ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
      {c.label}
    </span>
  );
}
