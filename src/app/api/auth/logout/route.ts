import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await logout();

    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

    // Clear CSRF cookie
    response.cookies.delete('csrf-hash');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}