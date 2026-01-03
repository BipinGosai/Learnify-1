import { NextResponse } from 'next/server';

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const v = email.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function parseProfessorEmails(raw) {
  if (typeof raw !== 'string') return [];
  return raw
    .split(/[;,\n]/g)
    .map((s) => s.trim())
    .filter((s) => isValidEmail(s));
}

export async function GET() {
  // For now, keep a single professor option as requested.
  return NextResponse.json({ professors: ['bpin.gosai321@gmail.com'] });
}
