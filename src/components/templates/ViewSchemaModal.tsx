'use client';

import { TaskTemplate } from '@/types/api';

interface ViewSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TaskTemplate;
}

export default function ViewSchemaModal({ isOpen, onClose, template }: ViewSchemaModalProps) {
  if (!isOpen) return null;

  const formatJSON = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Schema Name: {template.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2">Data Schema</h3>
            <pre className="bg-gray-50 rounded-md p-4 overflow-x-auto">
              <code className="text-sm text-gray-800">
                {formatJSON(template.dataSchema)}
              </code>
            </pre>
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2">Result Schema</h3>
            <pre className="bg-gray-50 rounded-md p-4 overflow-x-auto">
              <code className="text-sm text-gray-800">
                {formatJSON(template.resultSchema)}
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
