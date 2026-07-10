import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import sql from '@/app/api/utils/sql';

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const rows = await sql`SELECT user_type FROM user_profiles WHERE id = ${session.user.id}`;
  if (!rows[0] || rows[0].user_type !== 'admin') return null;
  return session;
}

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: 'Acesso negado' }, { status: 403 });

    const applications = await sql`
      SELECT a.*, j.title as job_title
      FROM team_applications a
      LEFT JOIN team_jobs j ON a.job_opening_id = j.id
      ORDER BY a.created_at DESC
    `;
    return Response.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return Response.json({ error: 'Erro ao buscar candidaturas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const jobId = formData.get('job_opening_id');
  const name = formData.get('candidate_name');
  const email = formData.get('candidate_email');
  const phone = formData.get('candidate_phone');
  const coverLetter = formData.get('cover_letter');
  const cvFile = formData.get('cv_file') as File | null;

  if (!jobId || !name || !email || !cvFile) {
    return Response.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
  }

  // Upload CV to R2 (placeholder - would need R2 integration)
  const cvUrl = `https://placeholder.com/cv/${Date.now()}-${cvFile.name}`;

  const [application] = await sql`
    INSERT INTO team_applications (job_opening_id, candidate_name, candidate_email, candidate_phone, cover_letter, cv_url, status)
    VALUES (${jobId}, ${name}, ${email}, ${phone || null}, ${coverLetter || null}, ${cvUrl}, 'pending')
    RETURNING *
  `;

  return Response.json({ application });
}
