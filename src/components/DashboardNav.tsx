import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, UserRole } from '@/types/api';
import { clearAuthCookies } from '@/utils/cookies';

interface NavProps {
  user: User | null;
}

export default function DashboardNav({ user }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    return pathname.startsWith(path) ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
  };

  const handleLogout = () => {
    clearAuthCookies();
    router.push('/login');
  };

  const isAdmin = user?.role === UserRole.ADMIN;
  const isTaskSlaver = user?.role === UserRole.TASK_SLAVE;

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex space-x-4">
              <Link
                href="/dashboard/profile"
                className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/dashboard/profile')}`}
              >
                Profile
              </Link>

              <Link
                href="/dashboard/products"
                className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/products')}`}
              >
                Products
              </Link>

              {(isTaskSlaver || isAdmin) && (
              <Link
                href="/dashboard/tasks"
                className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/dashboard/tasks')}`}
              >
                Tasks
              </Link>
              )}
              
              {isAdmin && (
                <Link
                  href="/dashboard/admin"
                  className={`rounded-md px-3 py-2 text-sm font-medium ${isActive('/dashboard/admin')}`}
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-300 text-sm">
              {user?.userName}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
