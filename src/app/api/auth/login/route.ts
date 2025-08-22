import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { generateCSRFToken, createCSRFHash } from '@/lib/csrf';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = loginSchema.parse(body);

    const success = await login(username, password);

    if (success) {
      // Generate CSRF token for authenticated session
      const csrfToken = generateCSRFToken();
      const csrfHash = createCSRFHash(csrfToken);

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        csrfToken,
      });

      // Set CSRF hash in httpOnly cookie
      response.cookies.set('csrf-hash', csrfHash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}