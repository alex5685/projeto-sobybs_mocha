"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/router-shim";
import { useAuth } from "@/lib/auth-shim";
import { Building2, User, AlertCircle } from "lucide-react";

type PersonType = "pf" | "pj";

interface FormData {
  person_type: PersonType;
  // PF fields
  full_name: string;
  phone: string;
  cpf: string;
  // PJ fields
  legal_name: string;
  cnpj: string;
  cpf_socio: string;
}

export default function UserRegistration() {
  const [personType, setPersonType] = useState<PersonType>("pf");
  const [formData, setFormData] = useState<FormData>({
    person_type: "pf",
    full_name: "",
    phone: "",
    cpf: "",
    legal_name: "",
    cnpj: "",
    cpf_socio: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (personType === "pf") {
      if (!formData.full_name.trim()) newErrors.full_name = "Nome completo é obrigatório";
      if (!formData.phone.trim()) newErrors.phone = "Telefone é obrigatório";
      if (!formData.cpf.trim()) newErrors.cpf = "CPF é obrigatório";
      if (formData.cpf && formData.cpf.replace(/\D/g, "").length !== 11) {
        newErrors.cpf = "CPF deve ter 11 dígitos";
      }
    } else {
      if (!formData.legal_name.trim()) newErrors.legal_name = "Razão Social é obrigatória";
      if (!formData.cnpj.trim()) newErrors.cnpj = "CNPJ é obrigatório";
      if (!formData.cpf_socio.trim()) newErrors.cpf_socio = "CPF do Sócio Responsável é obrigatório";
      if (!formData.phone.trim()) newErrors.phone = "Telefone é obrigatório";
      if (formData.cnpj && formData.cnpj.replace(/\D/g, "").length !== 14) {
        newErrors.cnpj = "CNPJ deve ter 14 dígitos";
      }
      if (formData.cpf_socio && formData.cpf_socio.replace(/\D/g, "").length !== 11) {
        newErrors.cpf_socio = "CPF deve ter 11 dígitos";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_type: personType,
          full_name: personType === "pf" ? formData.full_name : null,
          phone: formData.phone,
          cpf: personType === "pf" ? formData.cpf.replace(/\D/g, "") : null,
          legal_name: personType === "pj" ? formData.legal_name : null,
          cnpj: personType === "pj" ? formData.cnpj.replace(/\D/g, "") : null,
          cpf_socio: personType === "pj" ? formData.cpf_socio.replace(/\D/g, "") : null,
        }),
      });

      if (response.ok) {
        navigate("/profile-setup");
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || "Erro ao salvar dados" });
      }
    } catch (error) {
      console.error("Error saving registration:", error);
      setErrors({ submit: "Erro ao salvar dados" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/ef96fe50-43c7-42ec-8ef7-e5015eddd24b/8ba60b25-3fef-4266-91b9-4eec975d0723.png"
            alt="Sobybs Logo"
            className="h-20 w-auto mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Complete seu Cadastro</h1>
          <p className="text-lg text-gray-600">
            {user?.email && (
              <span className="block mb-2">
                Bem-vindo, <span className="font-semibold">{user.email}</span>
              </span>
            )}
            Precisamos de mais algumas informações para continuar
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Person Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tipo de Cadastro
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setPersonType("pf");
                  setFormData((prev) => ({ ...prev, person_type: "pf" }));
                  setErrors({});
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  personType === "pf"
                    ? "border-[#00A9E0] bg-[#00A9E0]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <User className={`w-8 h-8 mx-auto mb-2 ${personType === "pf" ? "text-[#00A9E0]" : "text-gray-400"}`} />
                <div className="font-semibold text-gray-900">Pessoa Física</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPersonType("pj");
                  setFormData((prev) => ({ ...prev, person_type: "pj" }));
                  setErrors({});
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  personType === "pj"
                    ? "border-[#00A9E0] bg-[#00A9E0]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Building2 className={`w-8 h-8 mx-auto mb-2 ${personType === "pj" ? "text-[#00A9E0]" : "text-gray-400"}`} />
                <div className="font-semibold text-gray-900">Pessoa Jurídica</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {personType === "pf" ? (
              <>
                {/* Nome Completo */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent transition-all ${
                      errors.full_name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Digite seu nome completo"
                  />
                  {errors.full_name && (
                    <div className="mt-1 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.full_name}
                    </div>
                  )}
                </div>

                {/* CPF */}
                <div>
                  <label htmlFor="cpf" className="block text-sm font-semibold text-gray-700 mb-2">
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", formatCPF(e.target.value))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent transition-all ${
                      errors.cpf ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                  {errors.cpf && (
                    <div className="mt-1 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.cpf}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Razão Social */}
                <div>
                  <label htmlFor="legal_name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Razão Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={(e) => handleInputChange("legal_name", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent transition-all ${
                      errors.legal_name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Digite a razão social"
                  />
                  {errors.legal_name && (
                    <div className="mt-1 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.legal_name}
                    </div>
                  )}
                </div>

                {/* CNPJ */}
                <div>
                  <label htmlFor="cnpj" className="block text-sm font-semibold text-gray-700 mb-2">
                    CNPJ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange("cnpj", formatCNPJ(e.target.value))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent transition-all ${
                      errors.cnpj ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                  {errors.cnpj && (
                    <div className="mt-1 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.cnpj}
                    </div>
                  )}
                </div>

                {/* CPF Sócio */}
                <div>
                  <label htmlFor="cpf_socio" className="block text-sm font-semibold text-gray-700 mb-2">
                    CPF do Sócio Responsável <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cpf_socio"
                    value={formData.cpf_socio}
                    onChange={(e) => handleInputChange("cpf_socio", formatCPF(e.target.value))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent transition-all ${
                      errors.cpf_socio ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                  {errors.cpf_socio && (
                    <div className="mt-1 flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.cpf_socio}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Telefone (comum para ambos) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Telefone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", formatPhone(e.target.value))}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00A9E0] focus:border-transparent transition-all ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
              {errors.phone && (
                <div className="mt-1 flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.phone}
                </div>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 text-sm">{errors.submit}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-[#00A9E0] to-[#1CB5E0] text-white rounded-xl hover:from-[#0098CC] hover:to-[#00A9E0] transition-all shadow-lg hover:shadow-xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Salvando..." : "Continuar"}
            </button>
          </form>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Suas informações são protegidas e criptografadas</p>
        </div>
      </div>
    </div>
  );
}
