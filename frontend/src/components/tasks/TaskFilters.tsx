'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { TaskStatus, Priority } from '@pawaacflow/shared/types/enums';
import { ITaskFilter } from '@pawaacflow/shared/types/task';

interface TaskFiltersProps {
  filters: ITaskFilter;
  onFilterChange: (filters: ITaskFilter) => void;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  ...Object.values(TaskStatus).map((s) => ({
    value: s,
    label: s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  })),
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  ...Object.values(Priority).map((p) => ({
    value: p,
    label: p.charAt(0).toUpperCase() + p.slice(1),
  })),
];

export function TaskFilters({ filters, onFilterChange }: TaskFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = filters.status || filters.priority || filters.search;

  const handleClear = () => {
    onFilterChange({});
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter className="h-4 w-4 mr-1" />
        Filters
        {hasActiveFilters && (
          <span className="ml-1 w-2 h-2 rounded-full bg-primary-500" />
        )}
      </Button>

      {showFilters && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-700">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={handleClear}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-3">
            <Select
              label="Status"
              options={statusOptions}
              value={filters.status || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  status: (e.target.value as TaskStatus) || undefined,
                })
              }
            />
            <Select
              label="Priority"
              options={priorityOptions}
              value={filters.priority || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  priority: (e.target.value as Priority) || undefined,
                })
              }
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Search
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Search tasks..."
                value={filters.search || ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    search: e.target.value || undefined,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
