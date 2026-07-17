import sql from '@/app/api/utils/sql';

// Public endpoint — no admin auth required
export async function GET() {
  try {
    const faqs =
      await sql`SELECT * FROM faqs WHERE is_active = 1 ORDER BY display_order ASC, id ASC`;
    return Response.json({ faqs });
  } catch (error) {
    console.error('Error fetching public FAQs:', error);
    return Response.json({ error: 'Erro ao buscar FAQs' }, { status: 500 });
  }
}
