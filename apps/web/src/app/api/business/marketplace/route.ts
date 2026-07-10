import sql from '@/app/api/utils/sql';

export async function GET() {
  const businesses = await sql`
    SELECT b.id, b.alias_name, b.sector, b.status_workflow, b.created_at,
      bd.ramo_atividade, bd.segmento, bd.tempo_atuacao, bd.faturamento_mensal, bd.num_funcionarios,
      bd.cidade, bd.estado, bd.pais, bd.possui_imoveis, bd.possui_frota
    FROM businesses b
    LEFT JOIN business_details bd ON bd.business_id = b.id
    WHERE b.is_public = 1
    ORDER BY b.created_at DESC
  `;
  return Response.json({ businesses });
}
