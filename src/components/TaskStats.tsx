'use client';

import { useEffect, useState } from 'react';

interface TaskStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
}

export function TaskStats() {
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    running: 0,
    completed: 0,
    failed: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/task/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch task stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Tasks"
        value={stats.total}
        color="bg-blue-500"
      />
      <StatsCard
        title="Running"
        value={stats.running}
        color="bg-yellow-500"
      />
      <StatsCard
        title="Completed"
        value={stats.completed}
        color="bg-green-500"
      />
      <StatsCard
        title="Failed"
        value={stats.failed}
        color="bg-red-500"
      />
    </div>
  );
}

function StatsCard({ 
  title, 
  value, 
  color 
}: { 
  title: string; 
  value: number; 
  color: string;
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`h-10 w-10 rounded-md ${color}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-semibold text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
} 