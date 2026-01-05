import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { professorsTable } from '@/config/schema';

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

function normalize(str = '') {
  return typeof str === 'string' ? str.toLowerCase().trim() : '';
}

function getProfessorSpecializationArray(prof) {
  const specialization = prof?.specializations;
  if (!specialization) return [];
  
  // If already an array, return it cleaned
  if (Array.isArray(specialization)) {
    return specialization.map(s => String(s).trim()).filter(s => s.length > 0);
  }
  
  // If string, split it
  if (typeof specialization === 'string') {
    return specialization.split(/[,&]/).map(s => s.trim()).filter(s => s.length > 0);
  }
  
  return [];
}

function scoreProfessorForCourse(prof, courseName, courseCategory) {
  const spec = prof?.specializations;
  const specialization = Array.isArray(spec) 
    ? spec.join(', ').toLowerCase().trim()
    : normalize(spec);
  
  if (!specialization) return 0;

  let score = 0;

  // Course name word matching (primary matching)
  const courseNameWords = courseName.split(/\s+/);
  for (const word of courseNameWords) {
    if (word.length > 3 && specialization.includes(word)) {
      score += 10;  // Higher priority for course name matching
    }
  }

  // Category match (secondary)
  if (courseCategory && specialization.includes(courseCategory)) {
    score += 5;
  }

  // Partial category word match
  const categoryWords = courseCategory.split(/[&,\s]+/);
  for (const word of categoryWords) {
    if (word.length > 3 && specialization.includes(word)) score += 2;
  }

  return score;
}

export async function GET(req) {
  try {
    // Fetch all professors from database
    const professors = await db.select().from(professorsTable);
    
    // Optionally filter by course if query params provided
    const { searchParams } = new URL(req.url);
    const courseCategory = searchParams.get('courseCategory') || '';
    const courseName = searchParams.get('courseName') || '';
    
    const enrichedProfessors = professors.map(p => ({
      email: p.email,
      name: p.name,
      specializations: p.specializations,
      specializationArray: getProfessorSpecializationArray(p),
      matchScore: courseCategory || courseName ? scoreProfessorForCourse(p, courseName, courseCategory) : 0,
    }));

    // Sort by match score if filtering
    if (courseCategory || courseName) {
      enrichedProfessors.sort((a, b) => b.matchScore - a.matchScore);
    }
    
    return NextResponse.json({ 
      professors: enrichedProfessors
    });
  } catch (e) {
    console.error('/api/professors GET error:', e);
    return NextResponse.json({ professors: [] });
  }
}
