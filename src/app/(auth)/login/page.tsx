'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { setAuthCookie } from '@/utils/cookies';
import api from '@/utils/api';

interface LoginFormData {
  email?: string;
  phone?: string;
  userName?: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginFormData>({
    password: '',
  });
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | 'userName'>('email');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const loginParams: LoginFormData = {
        password: formData.password,
        [loginMethod]: formData[loginMethod]
      };
      
      const data = await api.login(loginParams);
      setAuthCookie(data.accessToken);
      handleLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred');
    }
  };

  const handleLoginSuccess = () => {
    const callbackUrl = searchParams.get('callbackUrl');
    if (callbackUrl) {
      router.push(callbackUrl);
    } else {
      const isFromHome = document.referrer === '/' || document.referrer === '';
      router.push(isFromHome ? '/dashboard' : document.referrer);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`px-3 py-1 rounded ${
                  loginMethod === 'email' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`px-3 py-1 rounded ${
                  loginMethod === 'phone' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Phone
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('userName')}
                className={`px-3 py-1 rounded ${
                  loginMethod === 'userName' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Username
              </button>
            </div>

            <label htmlFor="loginInput" className="block text-sm font-medium leading-6 text-gray-900">
              {loginMethod === 'email' ? 'Email address' : 
               loginMethod === 'phone' ? 'Phone number' : 
               'Username'}
            </label>
            <div className="mt-2">
              <input
                id="loginInput"
                name={loginMethod}
                type={loginMethod === 'email' ? 'email' : 'text'}
                autoComplete={loginMethod}
                required
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                value={formData[loginMethod] || ''}
                onChange={(e) => setFormData({...formData, [loginMethod]: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Sign in
            </button>
          </div>
        </form>

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 