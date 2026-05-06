'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, X, Filter } from 'lucide-react';

interface AdvancedFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
  filters?: {
    status?: string;
    team?: string;
    dateRange?: string;
    priority?: string;
  };
}

export function AdvancedFilters({ onSearch, onFilterChange, filters = {} }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState(filters);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    onFilterChange({});
    onSearch('');
  };

  const activeFilterCount = Object.values(activeFilters).filter(v => v).length;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by name, ID, or team..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border-border flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white font-medium">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Filter Options */}
      {isExpanded && (
        <Card className="border border-border bg-background/50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Select
                    value={activeFilters.status || ''}
                    onValueChange={(v) => handleFilterChange('status', v)}
                  >
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Team</label>
                  <Select
                    value={activeFilters.team || ''}
                    onValueChange={(v) => handleFilterChange('team', v)}
                  >
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="All teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Teams</SelectItem>
                      <SelectItem value="alpha">Team Alpha</SelectItem>
                      <SelectItem value="beta">Team Beta</SelectItem>
                      <SelectItem value="gamma">Team Gamma</SelectItem>
                      <SelectItem value="delta">Team Delta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Date Range</label>
                  <Select
                    value={activeFilters.dateRange || ''}
                    onValueChange={(v) => handleFilterChange('dateRange', v)}
                  >
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="Any date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Date</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <Select
                    value={activeFilters.priority || ''}
                    onValueChange={(v) => handleFilterChange('priority', v)}
                  >
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

