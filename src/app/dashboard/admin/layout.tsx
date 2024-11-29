'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'bg-indigo-800 text-white' : 'text-gray-300 hover:bg-indigo-700 hover:text-white';
  };

  return (
    <div>
      <div className="bg-indigo-600 mb-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center space-x-4">
            <Link
              href="/dashboard/admin"
              className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/dashboard/admin')}`}
            >
              User Management
            </Link>
            <Link
              href="/dashboard/admin/template"
              className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/dashboard/admin/template')}`}
            >
              Template Management
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
} 