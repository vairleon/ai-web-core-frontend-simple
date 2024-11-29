import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { User } from '@/types/api';
import api from '@/utils/api'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken');
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register');
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
  const isAdminPage = request.nextUrl.pathname.startsWith('/dashboard/admin');
  const isTaskPage = request.nextUrl.pathname.startsWith('/dashboard/tasks');

  // Create a response object that we'll modify
  let response = NextResponse.next();

  // // If token exists but is invalid/malformed, clear it
  // if (token?.value && (!token.value.startsWith('ey') || token.value.split('.').length !== 3)) {
  //   console.log("reset token:", response.json())
  //   response = NextResponse.redirect(new URL('/login', request.url));
  //   response.cookies.delete('accessToken');
  //   return response;
  // }

  // If no token and trying to access protected routes
  if (!token && isDashboardPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If has token and trying to access auth pages
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Verify token and user privileges for protected routes
  if (token && isDashboardPage) {
    try {
      let userData = await api.getProfile(token);

      // For admin-only pages
      if (isAdminPage && userData.role !== 'admin') {
        // return NextResponse.redirect(new URL('/dashboard', request.url));
        return new NextResponse(null, { status: 404 });
      }
      
      // For task slave pages
      if (isTaskPage && userData.role !== 'admin' && userData.role !== 'task_slave') {
        // return NextResponse.redirect(new URL('/dashboard', request.url));
        return new NextResponse(null, { status: 404 });
      }

    } catch (error) {
      // If verification fails, clear token and redirect to login
      console.error('Auth verification failed:', error);
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      redirectResponse.cookies.delete('accessToken');
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register'
  ]
};