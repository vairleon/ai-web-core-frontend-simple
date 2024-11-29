'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/utils/cookies';

export default function ProfileButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);

    // Check auth status periodically
    const checkAuthStatus = () => {
      const token = getAuthToken();
      setIsLoggedIn(!!token);
    };

    const interval = setInterval(checkAuthStatus, 1000);
    return () => clearInterval(interval);
  }, []);

//   const buttonClasses = "flex items-center justify-center gap-2 p-8 lg:p-0 rounded-md px-3 py-2 text-sm font-semibold text-foreground border border-transparent hover:border-gray-300 transition-colors";

  return (
    <Link
      href={isLoggedIn ? "/dashboard/profile" : "/login"}
    > <p className='font-medium text-base'>
      {isLoggedIn ? 'Profile' : 'Sign In'}
      </p>
    </Link>    
    
  );
}
