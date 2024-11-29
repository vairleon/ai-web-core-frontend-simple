'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { Task } from '@/types/api';
import Link from 'next/link';
import Image from 'next/image';
import { clearAuthCookies } from '@/utils/cookies';
import { toast } from 'react-hot-toast';

// Helper function to check if string is a valid URL
const isValidUrl = (string: string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Add new components for JSON viewer and image preview
type JsonViewerModalProps = {
  data: any;
  onClose: () => void;
  onPreviewUrl: (url: string) => void;
};

const JsonViewerModal = ({ data, onClose, onPreviewUrl }: JsonViewerModalProps) => {
  // Recursive function to render JSON with clickable URLs
  const renderJsonValue = (value: any): JSX.Element | string => {
    if (typeof value === 'string' && isValidUrl(value)) {
      return (
        <span className="flex items-center gap-2">
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            {value}
          </a>
          {/\.(jpg|jpeg|png|gif|webp)$/i.test(value) && (
            <button
              onClick={() => onPreviewUrl(value)}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
            >
              Preview
            </button>
          )}
        </span>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="pl-4">
          {Object.entries(value).map(([key, val]) => (
            <div key={key}>
              <span className="text-gray-600">{key}: </span>
              {renderJsonValue(val)}
            </div>
          ))}
        </div>
      );
    }
    
    return JSON.stringify(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-medium">Data Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
          {renderJsonValue(data)}
        </div>
      </div>
    </div>
  );
};

export default function TaskPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [showOnlyNotSuccess, setShowOnlyNotSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [jsonViewerData, setJsonViewerData] = useState<any>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasks = await api.getAllTasks();
        setTasks(tasks);
        setFilteredTasks(tasks);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);


  // Modified filter effect
  useEffect(() => {
    let filtered = [...tasks];
    
    // if (searchId) {
    //   filtered = filtered.filter(task => 
    //     task.id.toString().includes(searchId)
    //   );
    // }

    if (searchName) {
      filtered = filtered.filter(task => 
        task.name.includes(searchName)
      );
    }
    
    if (showOnlyNotSuccess) {
      filtered = filtered.filter(task => task.status !== 'success');
    }
    
    setFilteredTasks(filtered);
  }, [tasks, searchId, showOnlyNotSuccess]);

  // Helper function to handle data viewing
  const handleViewData = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      setJsonViewerData(parsed);
    } catch (e) {
      setJsonViewerData({ error: 'Invalid JSON', raw: jsonString });
    }
  };


  // Preview modal component
  const PreviewModal = ({ url, onClose }: { url: string; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-2xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-medium">Preview</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="relative w-[400px] h-[400px]">
          <Image
            src={url}
            alt="Preview"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );

  const handleRefreshTask = async (taskId: number) => {
    try {
      const result = await api.refreshPendingTask(taskId);
      toast.success(result.message);
      // Refresh your task list or update the specific task in UI
    } catch (error: any) {
      toast.error(error.message || 'Failed to refresh task');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header section */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Tasks Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage and monitor all your tasks in one place
            </p>
          </div>
          {/* <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link
              href="/dashboard/tasks/new"
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Create Task
            </Link>
          </div> */}
        </div>

        {/* Filters section */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by Task Name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showOnlyNotSuccess"
              checked={showOnlyNotSuccess}
              onChange={(e) => setShowOnlyNotSuccess(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="showOnlyNotSuccess" className="text-sm text-gray-600">
              Incompleted Tasks
            </label>
          </div>
        </div>

        {/* Tasks table */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ID</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Data</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Result</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {task.id}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                        {/* <Link href={`/dashboard/tasks/${task.id}`} className="hover:text-indigo-600"> */}
                          {task.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          task.status === 'success' ? 'bg-green-100 text-green-800' :
                          task.status === 'failed' ? 'bg-red-100 text-red-800' :
                          task.status === 'pending' || task.status === 'queueing' || task.status === 'init' ? 'bg-yellow-100 text-yellow-800' :
                          task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleRefreshTask(task.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Refresh
                          </button>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => handleViewData(task.data)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Data
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {task.resultData ? (
                          <button
                            onClick={() => handleViewData(task.resultData || '')}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Result
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(task.createTime).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(task.updateTime).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* JSON viewer modal */}
      {jsonViewerData && (
        <JsonViewerModal
          data={jsonViewerData}
          onClose={() => setJsonViewerData(null)}
          onPreviewUrl={(url) => setPreviewUrl(url)}
        />
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
} 