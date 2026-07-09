/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Save,
  CheckCircle,
  AlertTriangle,
  History,
  Download,
  Fingerprint
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';
import { Patient } from '../../types/dental';

interface AnamneseTabProps {
  patient: Patient;
}

export default function AnamneseTab({ patient }: AnamneseTabProps) {
  const { anamneses, updateAnamnese, currentUser, logAction } = useDental();

  // Initial answers or defaults from central context mapper
  const currentAnamnese = anamneses[patient.id] || {
    allergies: '',
    medicationsInUse: '',
    preExistingDiseases: [],
    heartProblems: false,
    isPregnant: false,
    usesAnticoagulant: false,
    patientSignature: '',
    signatureDate: ''
  };

  const [hasAllergy, setHasAllergy] = useState(!!currentAnamnese.allergies);
  const [allergyDetails, setAllergyDetails] = useState(currentAnamnese.allergies || '');
  const [hasBleeding, setHasBleeding] = useState(currentAnamnese.usesAnticoagulant || false);
  const [continuousMed, setContinuousMed] = useState(currentAnamnese.medicationsInUse || '');
  const [isPregnant, setIsPregnant] = useState(currentAnamnese.isPregnant || false);
  const [hasHeart, setHasHeart] = useState(currentAnamnese.heartProblems || false);
  
  // Signature fields
  const [patientSignatureName, setPatientSignatureName] = useState(patient.name);
  const [dentistSignatureName, setDentistSignatureName] = useState(currentUser.name);
  const [signed, setSigned] = useState(!!currentAnamnese.patientSignature);

  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    setTimeout(() => {
      updateAnamnese(patient.id, {
        allergies: hasAllergy ? allergyDetails : '',
        medicationsInUse: continuousMed,
        usesAnticoagulant: hasBleeding,
        isPregnant,
        heartProblems: hasHeart,
        patientSignature: `Assinado por ${patientSignatureName}`,
        signatureDate: new Date().toISOString().split('T')[0]
      });
      setSigned(true);
      setSaving(false);
      alert('Anamnese salva e assinada eletronicamente!');
    }, 600);
  };

  // Mock Anamnesis History/Versions (Section 1.2)
  const versionHistory = [
    { date: '09/07/2026', author: currentUser.name, action: 'Revisão e Assinatura Digital do Prontuário' },
    { date: '05/01/2025', author: 'Dra. Guinevere Pendragon', action: 'Cadastro Inicial de Anamnese' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Alert banner for critical conditions */}
      {(hasAllergy || hasBleeding || hasHeart) && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start space-x-3 text-xs text-rose-800 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <h4 className="font-bold">CONDIÇÃO CLÍNICA DE RISCO ATIVA</h4>
            <p className="text-slate-600 leading-normal mt-0.5">
              Este paciente possui alertas médicos críticos. Mantenha os materiais de primeiros socorros de fácil acesso e evite vasoconstritores se necessário.
            </p>
            <div className="flex flex-wrap gap-2 mt-2 font-mono text-[10px] uppercase font-bold text-rose-700">
              {hasAllergy && <span>• Alergia: {allergyDetails || 'Não especificada'}</span>}
              {hasBleeding && <span>• Hemorragia/Problema de Coagulação</span>}
              {hasHeart && <span>• Condição Cardíaca</span>}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core questionnaire */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-800 flex items-center"><FileText className="w-4 h-4 mr-1.5 text-teal-600" /> Questionário Médico de Onboarding</h3>
            <span className="text-[10px] text-slate-400 font-mono">Última Atualização: {currentAnamnese.signatureDate || 'Não assinada'}</span>
          </div>

          <div className="space-y-4">
            {/* Allergy Question */}
            <div className="border border-slate-100 p-3.5 rounded-lg space-y-2.5 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">1. Possui algum tipo de alergia (Látex, Penicilina, Anestésicos)?</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setHasAllergy(true)}
                    className={`px-3 py-1 rounded font-bold ${hasAllergy ? 'bg-rose-500 text-white' : 'bg-white border text-slate-500'}`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHasAllergy(false); setAllergyDetails(''); }}
                    className={`px-3 py-1 rounded font-bold ${!hasAllergy ? 'bg-slate-300 text-slate-800' : 'bg-white border text-slate-500'}`}
                  >
                    Não
                  </button>
                </div>
              </div>
              {hasAllergy && (
                <input
                  type="text"
                  value={allergyDetails}
                  onChange={(e) => setAllergyDetails(e.target.value)}
                  placeholder="Especifique a alergia em detalhes..."
                  required
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-semibold"
                />
              )}
            </div>

            {/* Continuous medication */}
            <div className="border border-slate-100 p-3.5 rounded-lg space-y-2.5 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="font-semibold text-slate-700">2. Toma algum medicamento de uso contínuo (AAS, Anticoagulante)?</span>
                <input
                  type="text"
                  value={continuousMed}
                  onChange={(e) => setContinuousMed(e.target.value)}
                  placeholder="Ex: Não, ou AAS 100mg, etc."
                  className="border border-slate-200 rounded-lg p-1.5 bg-white text-xs font-semibold w-full sm:w-64"
                />
              </div>
            </div>

            {/* Bleeding issues */}
            <div className="border border-slate-100 p-3.5 rounded-lg flex items-center justify-between bg-slate-50/50">
              <span className="font-semibold text-slate-700">3. Apresenta histórico de sangramento excessivo ou hemorragia pós-extração?</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setHasBleeding(true)}
                  className={`px-3 py-1 rounded font-bold ${hasBleeding ? 'bg-rose-500 text-white' : 'bg-white border text-slate-500'}`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setHasBleeding(false)}
                  className={`px-3 py-1 rounded font-bold ${!hasBleeding ? 'bg-slate-300 text-slate-800' : 'bg-white border text-slate-500'}`}
                >
                  Não
                </button>
              </div>
            </div>

            {/* Heart disease */}
            <div className="border border-slate-100 p-3.5 rounded-lg flex items-center justify-between bg-slate-50/50">
              <span className="font-semibold text-slate-700">4. Portador de cardiopatia, hipertensão grave ou uso de marcapasso?</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setHasHeart(true)}
                  className={`px-3 py-1 rounded font-bold ${hasHeart ? 'bg-rose-500 text-white' : 'bg-white border text-slate-500'}`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setHasHeart(false)}
                  className={`px-3 py-1 rounded font-bold ${!hasHeart ? 'bg-slate-300 text-slate-800' : 'bg-white border text-slate-500'}`}
                >
                  Não
                </button>
              </div>
            </div>

            {/* Pregnancy */}
            {patient.gender === 'Feminino' && (
              <div className="border border-slate-100 p-3.5 rounded-lg flex items-center justify-between bg-slate-50/50">
                <span className="font-semibold text-slate-700">5. Gestante ou lactante?</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsPregnant(true)}
                    className={`px-3 py-1 rounded font-bold ${isPregnant ? 'bg-indigo-500 text-white' : 'bg-white border text-slate-500'}`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPregnant(false)}
                    className={`px-3 py-1 rounded font-bold ${!isPregnant ? 'bg-slate-300 text-slate-800' : 'bg-white border text-slate-500'}`}
                  >
                    Não
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Electronic Signatures (Section 1.2) */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center"><Fingerprint className="w-4 h-4 mr-1 text-teal-600" /> Assinaturas Eletrônicas & Carimbo Profissional</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <label className="block text-slate-500 mb-1">Assinatura Digital do Paciente</label>
                <div className="border border-dashed border-slate-300 h-20 rounded bg-white flex items-center justify-center p-3 relative">
                  {signed ? (
                    <div className="text-center">
                      <span className="font-serif italic text-teal-700 text-sm tracking-widest">{patientSignatureName}</span>
                      <span className="block text-[8px] text-slate-400 font-mono mt-1">Assinado via Token ICP-Brasil às 14:12</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 text-[10px]">Desenhe a assinatura ou digite o nome completo</span>
                  )}
                </div>
                <input
                  type="text"
                  value={patientSignatureName}
                  onChange={(e) => setPatientSignatureName(e.target.value)}
                  disabled={signed}
                  className="w-full border border-slate-200 rounded p-1.5 mt-2 bg-white text-[11px]"
                />
              </div>

              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <label className="block text-slate-500 mb-1">Carimbo e Assinatura Digital do Dentista</label>
                <div className="border border-dashed border-slate-300 h-20 rounded bg-white flex items-center justify-center p-3 relative">
                  {signed ? (
                    <div className="text-center">
                      <span className="font-serif italic text-teal-700 text-sm tracking-widest">{dentistSignatureName}</span>
                      <span className="block text-[8px] text-slate-400 font-mono mt-1">Assinado via Certificado Digital CFO/CRO</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 text-[10px]">Pressione "Salvar Anamnese" para assinar</span>
                  )}
                </div>
                <input
                  type="text"
                  value={dentistSignatureName}
                  onChange={(e) => setDentistSignatureName(e.target.value)}
                  disabled={signed}
                  className="w-full border border-slate-200 rounded p-1.5 mt-2 bg-white text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-lg flex items-center space-x-1 shadow-md shadow-teal-500/10"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Assinando...' : 'Salvar e Assinar Prontuário'}</span>
            </button>
          </div>
        </form>

        {/* Audit versions logs */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2.5">
            <History className="w-4 h-4 text-teal-600" />
            <h4 className="font-semibold text-slate-800 text-xs">Histórico de Alterações</h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Rastreabilidade e auditoria obrigatória segundo a LGPD. Todas as modificações no prontuário do paciente registram o autor, o carimbo de data/hora e o IP de acesso.
          </p>

          <div className="space-y-3.5 mt-2">
            {versionHistory.map((version, i) => (
              <div key={i} className="bg-white border border-slate-200 p-3 rounded-lg shadow-2xs space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>{version.date}</span>
                  <span className="font-bold text-teal-600">v{2 - i}.0</span>
                </div>
                <p className="font-semibold text-slate-800 text-[11px]">{version.action}</p>
                <span className="text-[10px] text-slate-500 block">Operador: {version.author}</span>
              </div>
            ))}
          </div>

          {signed && (
            <button
              onClick={() => {
                alert('Exportação de Ficha de Anamnese Digital em PDF gerada para download!');
                logAction('download_anamnese_pdf', `Exportou PDF de Anamnese assinada do paciente: ${patient.name}`);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg transition-colors text-xs flex items-center justify-center space-x-1.5 mt-4"
            >
              <Download className="w-3.5 h-3.5 text-teal-500" />
              <span>Exportar PDF Completo</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
