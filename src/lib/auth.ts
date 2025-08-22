import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { config } from './config';
import { SessionData } from '@/types';

const sessionOptions = {
  password: config.session.secret,
  cookieName: 'landing-gen-session',
  cookieOptions: {
    secure: config.app.baseUrl.startsWith('https'),
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax' as const,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<IronSession<SessionData>> {
  const response = new NextResponse();
  return getIronSession<SessionData>(req, response, sessionOptions);
}

export async function authenticate(username: string, password: string): Promise<boolean> {
  return username === config.app.user && password === config.app.pass;
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  
  if (!session.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  return session;
}

export async function login(username: string, password: string): Promise<boolean> {
  const isValid = await authenticate(username, password);
  
  if (isValid) {
    const session = await getSession();
    session.userId = username;
    session.isAuthenticated = true;
    await session.save();
    return true;
  }
  
  return false;
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session.isAuthenticated;
}