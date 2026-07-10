import dynamic from 'next/dynamic';

const BusinessVisitas = dynamic(() => import('@/views/BusinessVisitas'), { ssr: false });

export default function BusinessVisitasPage() {
  return <BusinessVisitas />;
}
