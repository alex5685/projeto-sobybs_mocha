import { Building2, Target, Eye, Users, Award, TrendingUp, Loader2, Upload, Briefcase, Mail, MapPin, Clock, Phone, Linkedin, Instagram } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface InstitutionalData {
  institutional_message?: string;
  institutional_history?: string;
  institutional_mission?: string;
  institutional_vision?: string;
  institutional_founder_name?: string;
  institutional_founder_bio?: string;
  institutional_founder_photo?: string;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio?: string;
  photo_url?: string;
  email?: string;
}

interface JobOpening {
  id: number;
  title: string;
  department?: string;
  location?: string;
  employment_type?: string;
  description: string;
  requirements?: string;
}

interface ContactData {
  contact_email?: string;
  contact_whatsapp?: string;
  contact_linkedin?: string;
  contact_instagram?: string;
}

export default function About() {
  const navigate = useNavigate();
  const [data, setData] = useState<InstitutionalData | null>(null);
  const [contacts, setContacts] = useState<ContactData | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
    cvFile: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [instResponse, contactsResponse, teamResponse, jobsResponse] = await Promise.all([
          fetch('/api/admin/institutional'),
          fetch('/api/admin/contacts'),
          fetch('/api/team/members'),
          fetch('/api/team/jobs'),
        ]);

        if (instResponse.ok) {
          const result = await instResponse.json();
          setData(result.institutional);
        }

        if (contactsResponse.ok) {
          const result = await contactsResponse.json();
          setContacts(result.contacts);
        }

        if (teamResponse.ok) {
          const result = await teamResponse.json();
          setTeamMembers(result.members);
        }

        if (jobsResponse.ok) {
          const result = await jobsResponse.json();
          setJobOpenings(result.jobs);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !applicationForm.cvFile) return;

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const formData = new FormData();
      formData.append('job_opening_id', selectedJob.id.toString());
      formData.append('candidate_name', applicationForm.name);
      formData.append('candidate_email', applicationForm.email);
      if (applicationForm.phone) {
        formData.append('candidate_phone', applicationForm.phone);
      }
      if (applicationForm.coverLetter) {
        formData.append('cover_letter', applicationForm.coverLetter);
      }
      formData.append('cv_file', applicationForm.cvFile);

      const response = await fetch('/api/team/applications', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSubmitMessage('Candidatura enviada com sucesso! Entraremos em contato em breve.');
        setApplicationForm({
          name: '',
          email: '',
          phone: '',
          coverLetter: '',
          cvFile: null,
        });
        setSelectedJob(null);
      } else {
        setSubmitMessage('Erro ao enviar candidatura. Tente novamente.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitMessage('Erro ao enviar candidatura. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00A9E0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  const institutionalMessage = data?.institutional_message || 'Bem-vindo à Sobybs! Conectamos compradores e vendedores com transparência e segurança.';
  const institutionalHistory = data?.institutional_history || 'A Sobybs nasceu da necessidade de profissionalizar o mercado de M&A no Brasil.';
  const institutionalMission = data?.institutional_mission || 'Facilitar negociações seguras e transparentes de compra e venda de empresas.';
  const institutionalVision = data?.institutional_vision || 'Ser a plataforma de referência no Brasil para transações empresariais.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center">
              <img
                src="https://019c10bd-735b-7e82-8240-0315d24a82e1.mochausercontent.com/Logo-Sobybs-Colorido.png"
                alt="Sobybs Logo"
                className="h-16 w-auto cursor-pointer"
                onClick={() => navigate("/")}
              />
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-700 hover:text-[#00A9E0] font-medium transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <Building2 className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h1 className="text-5xl font-bold mb-6 tracking-tight">
              Sobre a Sobybs
            </h1>
            <p className="text-xl max-w-3xl mx-auto opacity-90 leading-relaxed">
              {institutionalMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* História */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Users className="w-4 h-4" />
                Nossa História
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Transformando o mercado de compra e venda de empresas
              </h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p className="whitespace-pre-wrap text-justify">{institutionalHistory}</p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-8 shadow-2xl">
                <div className="h-full bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-6xl font-bold mb-4">500+</div>
                    <div className="text-xl opacity-90">Negócios fechados</div>
                    <div className="mt-8 text-4xl font-bold mb-2">R$ 2.5B+</div>
                    <div className="text-lg opacity-90">Em transações</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Missão, Visão e Valores */}
        <section className="mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Missão */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Nossa Missão</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-justify">
                {institutionalMission}
              </p>
            </div>

            {/* Visão */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Nossa Visão</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-justify">
                {institutionalVision}
              </p>
            </div>

            {/* Valores */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Award className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Nossos Valores</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Transparência em todas as negociações</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Confidencialidade e segurança</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Excelência no atendimento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Inovação constante</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        {data?.institutional_founder_name && (
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Founder</h2>
            </div>
            <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {data.institutional_founder_photo && (
                  <img
                    src={data.institutional_founder_photo}
                    alt={data.institutional_founder_name}
                    className="w-48 h-48 rounded-full object-cover border-4 border-blue-100 shadow-xl"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center md:text-left">
                    {data.institutional_founder_name}
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-justify">
                    {data.institutional_founder_bio}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Team Section */}
        {teamMembers.length > 0 && (
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Nosso Time</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Conheça os profissionais que tornam a Sobybs possível
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
                >
                  {member.photo_url && (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-blue-50"
                    />
                  )}
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-semibold text-center mb-4">
                    {member.role}
                  </p>
                  {member.bio && (
                    <p className="text-gray-700 text-sm leading-relaxed text-center">
                      {member.bio}
                    </p>
                  )}
                  {member.email && (
                    <div className="flex items-center justify-center gap-2 mt-4 text-gray-600 text-sm">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${member.email}`} className="hover:text-blue-600">
                        {member.email}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Jobs Section */}
        {jobOpenings.length > 0 && (
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Faça parte do Time!</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Confira nossas vagas abertas e candidate-se
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {jobOpenings.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 cursor-pointer"
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                      {job.department && (
                        <p className="text-blue-600 font-semibold mb-2">{job.department}</p>
                      )}
                    </div>
                    <Briefcase className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {job.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.employment_type && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{job.employment_type}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 line-clamp-3 mb-4">{job.description}</p>
                  <button className="text-blue-600 font-semibold hover:text-blue-700">
                    Candidatar-se →
                  </button>
                </div>
              ))}
            </div>

            {/* Application Form Modal */}
            {selectedJob && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-8 my-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Candidatar-se para: {selectedJob.title}
                    </h3>
                    {selectedJob.department && (
                      <p className="text-blue-600 font-semibold">{selectedJob.department}</p>
                    )}
                  </div>

                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Descrição da vaga:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                    {selectedJob.requirements && (
                      <>
                        <h4 className="font-semibold text-gray-900 mt-4 mb-2">Requisitos:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.requirements}</p>
                      </>
                    )}
                  </div>

                  <form onSubmit={handleApplicationSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nome completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={applicationForm.name}
                        onChange={(e) => setApplicationForm({ ...applicationForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={applicationForm.email}
                        onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        value={applicationForm.phone}
                        onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Carta de apresentação
                      </label>
                      <textarea
                        rows={4}
                        value={applicationForm.coverLetter}
                        onChange={(e) => setApplicationForm({ ...applicationForm, coverLetter: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Conte-nos sobre você e por que deseja fazer parte do nosso time"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Currículo (PDF) *
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          required
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.type === 'application/pdf') {
                              setApplicationForm({ ...applicationForm, cvFile: file });
                            } else {
                              alert('Por favor, selecione apenas arquivos PDF');
                              e.target.value = '';
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Upload className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      {applicationForm.cvFile && (
                        <p className="text-sm text-gray-600 mt-1">
                          Arquivo selecionado: {applicationForm.cvFile.name}
                        </p>
                      )}
                    </div>

                    {submitMessage && (
                      <div className={`p-4 rounded-lg ${submitMessage.includes('sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {submitMessage}
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJob(null);
                          setSubmitMessage('');
                        }}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Enviando...' : 'Enviar Candidatura'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Diferenciais */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Por que escolher a Sobybs?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Oferecemos uma experiência completa e diferenciada no mercado
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <TrendingUp className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">Valuation com IA</h4>
              <p className="text-gray-700 text-sm">
                Avaliação automatizada e precisa usando inteligência artificial
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <Building2 className="w-10 h-10 text-purple-600 mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">Suporte Jurídico</h4>
              <p className="text-gray-700 text-sm">
                Assessoria legal especializada em todo o processo
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <Award className="w-10 h-10 text-green-600 mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">Suporte Contábil</h4>
              <p className="text-gray-700 text-sm">
                Análise financeira detalhada e estruturação de documentos
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
              <Users className="w-10 h-10 text-orange-600 mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">Marketplace Ativo</h4>
              <p className="text-gray-700 text-sm">
                Ampla rede de compradores e vendedores qualificados
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        {contacts && (contacts.contact_email || contacts.contact_whatsapp || contacts.contact_linkedin || contacts.contact_instagram) && (
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Entre em Contato</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Estamos prontos para atender você
              </p>
            </div>

            <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100">
              <div className="grid md:grid-cols-2 gap-8">
                {contacts.contact_email && (
                  <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                      <a 
                        href={`mailto:${contacts.contact_email}`}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {contacts.contact_email}
                      </a>
                    </div>
                  </div>
                )}

                {contacts.contact_whatsapp && (
                  <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">WhatsApp</h4>
                      <a 
                        href={`https://wa.me/${contacts.contact_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 hover:underline"
                      >
                        {contacts.contact_whatsapp}
                      </a>
                    </div>
                  </div>
                )}

                {contacts.contact_linkedin && (
                  <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Linkedin className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">LinkedIn</h4>
                      <a 
                        href={contacts.contact_linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Acessar perfil
                      </a>
                    </div>
                  </div>
                )}

                {contacts.contact_instagram && (
                  <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Instagram className="w-7 h-7 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Instagram</h4>
                      <a 
                        href={contacts.contact_instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-700 hover:underline"
                      >
                        Acessar perfil
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se a centenas de empreendedores e investidores que já confiam na Sobybs
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/subscription-plans"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Ver Planos
            </a>
            <a
              href="/register"
              className="bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-800 transition-colors border-2 border-white/20"
            >
              Cadastre-se Grátis
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
