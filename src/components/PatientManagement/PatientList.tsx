/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  TrendingUp,
  MapPin,
  FileText,
  UserCheck,
  AlertTriangle,
  Funnel
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';
import { Patient, PatientStatus } from '../../types/dental';

interface PatientListProps {
  onPatientSelect: (id: string) => void;
}

export default function PatientList({ onPatientSelect }: PatientListProps) {
  const { patients, addPatient, updatePatient, hiddenPII, logAction } = useDental();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PatientStatus>('all');
  const [referralFilter, setReferralFilter] = useState<string>('all');

  // Register / Edit Patient Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('Feminino');
  const [marital, setMarital] = useState('Solteira');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [referral, setReferral] = useState('Instagram');
  const [insurance, setInsurance] = useState('Particular');
  const [insuranceCard, setInsuranceCard] = useState('');

  // Address
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [num, setNum] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');

  // Calculate birthdays today
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;

  const birthdaysToday = patients.filter(p => !p.deletedAt && p.birthDate).filter(p => {
    const birth = new Date(p.birthDate + 'T00:00:00');
    return birth.getDate() === todayDay && (birth.getMonth() + 1) === todayMonth;
  });

  // Mini-CRM stats
  const leadFunnel = {
    contato: patients.filter(p => !p.deletedAt).length,
    agendado: patients.filter(p => !p.deletedAt && p.status === 'ativo').length,
    tratamento: patients.filter(p => !p.deletedAt && p.status === 'em_tratamento').length,
    concluido: patients.filter(p => !p.deletedAt && p.status === 'concluido').length
  };

  // Simulated CEP search (Section 1.1)
  const handleCepSearch = () => {
    if (cep.replace(/[^0-9]/g, '').length === 8) {
      setStreet('Alameda dos Anapurus');
      setNeighborhood('Moema');
      setCity('São Paulo');
      setState('SP');
      alert('CEP localizado! Endereço preenchido automaticamente.');
    } else {
      alert('Por favor, insira um CEP válido de 8 dígitos para buscar.');
    }
  };

  const handleEditPatientClick = (p: Patient) => {
    setEditingPatient(p);
    setName(p.name);
    setCpf(p.cpf);
    setRg(p.rg);
    setBirthDate(p.birthDate);
    setGender(p.gender);
    setMarital(p.maritalStatus);
    setPhone(p.phone);
    setEmail(p.email);
    setProfession(p.profession);
    setReferral(p.referralSource);
    setInsurance(p.insuranceName || 'Particular');
    setInsuranceCard(p.insuranceCardNumber || '');
    setCep(p.address.cep);
    setStreet(p.address.street);
    setNum(p.address.number);
    setComplement(p.address.complement || '');
    setNeighborhood(p.address.neighborhood);
    setCity(p.address.city);
    setState(p.address.state);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingPatient(null);
    setName('');
    setCpf('');
    setRg('');
    setBirthDate('');
    setGender('Feminino');
    setMarital('Solteira');
    setPhone('');
    setEmail('');
    setProfession('');
    setReferral('Instagram');
    setInsurance('Particular');
    setInsuranceCard('');
    setCep('');
    setStreet('');
    setNum('');
    setComplement('');
    setNeighborhood('');
    setCity('');
    setState('SP');
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("O nome do paciente é obrigatório!");
      return;
    }
    if (!cpf.trim() && !rg.trim()) {
      alert("É obrigatório preencher pelo menos um número de documento: CPF ou RG!");
      return;
    }
    if (!birthDate) {
      alert("A data de nascimento é obrigatória!");
      return;
    }

    const payload = {
      name,
      cpf: cpf.trim(),
      rg: rg.trim(),
      birthDate,
      gender,
      maritalStatus: marital,
      profession,
      address: {
        cep,
        street,
        number: num,
        complement: complement || undefined,
        neighborhood,
        city,
        state
      },
      phone,
      email,
      insuranceName: insurance !== 'Particular' ? insurance : undefined,
      insuranceCardNumber: insuranceCard || undefined,
      referralSource: referral,
      status: editingPatient ? editingPatient.status : 'ativo' as any
    };

    if (editingPatient) {
      updatePatient(editingPatient.id, payload);
      logAction('edit_patient', `Alterado dados cadastrais do paciente: ${name}`);
      handleCloseModal();
    } else {
      const newId = addPatient(payload);
      handleCloseModal();
      onPatientSelect(newId); // open their new visual jacket straight away!
    }
  };

  // Filters application - ignore soft deleted
  const filteredPatients = patients.filter(p => !p.deletedAt).filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cpf.includes(searchQuery) ||
      p.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesReferral = referralFilter === 'all' || p.referralSource === referralFilter;

    return matchesSearch && matchesStatus && matchesReferral;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      
      {/* Mini CRM Lead Funnel Visualizer (Section 8 - Mini CRM) */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-4 border-b border-slate-800 pb-3">
          <Funnel className="w-4.5 h-4.5 text-teal-400" />
          <h3 className="font-bold text-sm">Funil de Atração de Pacientes (Mini-CRM)</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">1. Contatos Recebidos</span>
            <div className="text-xl font-black mt-1 text-slate-100">{leadFunnel.contato}</div>
            <div className="w-full bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-full"></div>
            </div>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">2. Avaliações Clínicas</span>
            <div className="text-xl font-black mt-1 text-teal-400">{leadFunnel.agendado}</div>
            <div className="w-full bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
              <div className="bg-teal-400 h-full" style={{ width: '80%' }}></div>
            </div>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">3. Em Tratamento Activo</span>
            <div className="text-xl font-black mt-1 text-sky-400">{leadFunnel.tratamento}</div>
            <div className="w-full bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
              <div className="bg-sky-400 h-full" style={{ width: '60%' }}></div>
            </div>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">4. Casos Concluídos</span>
            <div className="text-xl font-black mt-1 text-emerald-400">{leadFunnel.concluido}</div>
            <div className="w-full bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full" style={{ width: '40%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Birthday Reminders Alert */}
      {birthdaysToday.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start space-x-3 shadow-sm">
          <div className="p-2 bg-teal-500 text-slate-950 rounded-xl font-bold text-base leading-none">
            🎁
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 text-xs">Aniversariantes de Hoje! 🎉</h4>
            <p className="text-[11px] text-slate-500 mb-2">Estes pacientes celebram aniversário hoje. Envie uma mensagem de felicitações no WhatsApp:</p>
            <div className="flex flex-wrap gap-2">
              {birthdaysToday.map(p => (
                <div key={p.id} className="bg-white border border-teal-100 px-3 py-1.5 rounded-lg flex items-center space-x-2 text-[11px] shadow-sm">
                  <span className="font-semibold text-slate-800">{p.name}</span>
                  <a
                    href={`https://wa.me/55${p.phone.replace(/[^0-9]/g, '')}?text=Parab%C3%A9ns%20${encodeURIComponent(p.name)}!%20A%20equipe%20da%20Cl%C3%ADnica%20Odontol%C3%B3gica%20deseja%20a%20voc%C3%AA%20um%20dia%20iluminado%20e%20repleto%20de%20sorrisos.%20Feliz%20Anivers%C3%A1rio!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded flex items-center space-x-1"
                  >
                    <span>Parabenizar no WhatsApp</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Roster Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
        
        {/* Search, Filter inputs and Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar paciente por nome, CPF ou WhatsApp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status filters */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none"
            >
              <option value="all">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="em_tratamento">Em tratamento</option>
              <option value="concluido">Tratamento concluído</option>
              <option value="inadimplente">Inadimplente</option>
            </select>

            {/* Source filters */}
            <select
              value={referralFilter}
              onChange={(e) => setReferralFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none"
            >
              <option value="all">Todas as Origens/Indicações</option>
              <option value="Instagram">Instagram</option>
              <option value="Google Pesquisa">Google Pesquisa</option>
              <option value="Indicação de Paciente (Maria de Souza)">Indicação</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1 shadow-md shadow-teal-500/10"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Novo Paciente</span>
            </button>
          </div>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-medium">
                <th className="py-2.5">Nome / Pasta Digital</th>
                <th className="py-2.5">Contato</th>
                <th className="py-2.5">CPF / Documento</th>
                <th className="py-2.5">Convênio</th>
                <th className="py-2.5">Indicação</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onPatientSelect(p.id)}>
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm hover:text-teal-600 transition-colors">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Pasta: #{p.id} | Cadastrado em: {new Date(p.createdAt).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center space-x-1.5">
                      <div className="text-slate-700">{hiddenPII ? '***-***-***' : p.phone}</div>
                      {!hiddenPII && (
                        <a
                          href={`https://wa.me/55${p.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Enviar WhatsApp"
                          className="inline-flex items-center justify-center p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded transition-colors"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.375 3.469 2.235 2.235 3.465 5.212 3.465 8.381 0 6.533-5.322 11.859-11.851 11.859h-.019c-2.001-.002-3.97-.534-5.714-1.547L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.316 0 9.643-4.32 9.645-9.637C21.023 5.64 16.963 1.91 11.86 1.91c-5.102 0-9.25 4.15-9.25 9.254-.001 1.637.479 3.235 1.391 4.622L3.02 19.985l4.31-.131c-1.127.817-1.127.817-.683 1.3zm10.368-6.172c-.27-.135-1.597-.788-1.846-.879-.25-.09-.431-.135-.612.135-.181.271-.701.879-.859 1.06-.158.18-.315.2-.585.065-.27-.135-1.14-.42-2.172-1.341-.803-.715-1.346-1.6-1.504-1.872-.158-.271-.017-.418.118-.553.122-.122.27-.316.406-.473.135-.158.18-.271.271-.452.09-.18.045-.339-.022-.474-.068-.135-.612-1.474-.839-2.016-.221-.532-.443-.46-.612-.469-.158-.008-.339-.01-.52-.01-.18 0-.474.068-.721.339-.248.271-.947.925-.947 2.257s.969 2.616 1.104 2.8c.135.18 1.907 2.911 4.62 4.082.645.278 1.148.445 1.541.571.648.206 1.238.177 1.704.108.519-.077 1.597-.653 1.823-1.284.226-.631.226-1.173.158-1.284-.067-.112-.248-.18-.518-.315z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{hiddenPII ? '***@***.com' : p.email}</div>
                  </td>
                  <td className="py-3 font-mono text-slate-500">{hiddenPII ? '***.***.***-**' : p.cpf}</td>
                  <td className="py-3">
                    <span className="font-semibold text-slate-600">{p.insuranceName || 'Particular'}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-slate-500 bg-slate-50 border border-slate-200/40 px-2 py-0.5 rounded text-[10px] font-mono">
                      {p.referralSource}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider ${
                      p.status === 'em_tratamento' ? 'bg-indigo-50 text-indigo-600' :
                      p.status === 'ativo' ? 'bg-teal-50 text-teal-600' :
                      p.status === 'concluido' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-rose-50 text-rose-600 animate-pulse'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-1">
                    <button
                      onClick={() => onPatientSelect(p.id)}
                      className="text-[11px] bg-slate-900 text-teal-400 hover:text-white font-semibold px-2 py-1 rounded transition-all"
                    >
                      Prontuário
                    </button>
                    <button
                      onClick={() => handleEditPatientClick(p)}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir/arquivar o paciente ${p.name}?`)) {
                          updatePatient(p.id, { deletedAt: new Date().toISOString() });
                          logAction('delete_patient', `Paciente arquivado: ${p.name}`);
                        }
                      }}
                      className="text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold px-2 py-1 rounded transition-colors"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Register Patient */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-semibold text-sm">Ficha Cadastral do Paciente (Pasta Digital)</span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleCreatePatient} className="p-5 max-h-[80vh] overflow-y-auto space-y-4 text-xs">
              
              {/* Section 1: Cadastro basico */}
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-500 tracking-wider block mb-3 border-b pb-1">1. Dados Cadastrais (Campos Obrigatórios *)</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Nome Completo *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-teal-200/60 rounded-lg p-2 focus:ring-1 focus:ring-teal-500" placeholder="Ex: Maria de Souza" />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">E-mail (Opcional)</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2" placeholder="maria@gmail.com" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">CPF (Mín. CPF ou RG) *</label>
                    <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} className="w-full border border-teal-200/60 rounded-lg p-2 font-mono focus:ring-1 focus:ring-teal-500" placeholder="123.456.789-00" />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">RG (Mín. CPF ou RG) *</label>
                    <input type="text" value={rg} onChange={(e) => setRg(e.target.value)} className="w-full border border-teal-200/60 rounded-lg p-2 font-mono focus:ring-1 focus:ring-teal-500" placeholder="12.345.678-9" />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Nascimento *</label>
                    <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required className="w-full border border-teal-200/60 rounded-lg p-2 focus:ring-1 focus:ring-teal-500" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Sexo</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 bg-white">
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Celular / WhatsApp</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2" placeholder="(11) 99111-2222" />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Profissão</label>
                    <input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2" placeholder="Profissional Liberal" />
                  </div>
                </div>
              </div>

              {/* Section 2: Endereco com busca CEP */}
              <div className="pt-3">
                <span className="text-[10px] uppercase font-bold text-teal-500 tracking-wider block mb-3 border-b pb-1">2. Endereço Comercial/Residencial (Opcional)</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">CEP (Busca de CEP)</label>
                    <div className="flex space-x-1">
                      <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} className="flex-1 border border-slate-200 rounded-lg p-2 font-mono" placeholder="01311-200" />
                      <button type="button" onClick={handleCepSearch} className="bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 rounded-lg text-slate-700">🔍</button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">Rua / Logradouro</label>
                    <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2" placeholder="Avenida Paulista" />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mt-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Número</label>
                    <input type="text" value={num} onChange={(e) => setNum(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2" placeholder="1000" />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Bairro</label>
                    <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2" placeholder="Bela Vista" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">Complemento / Apto</label>
                    <input type="text" value={complement} onChange={(e) => setComplement(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2" placeholder="Apto 42" />
                  </div>
                </div>
              </div>

              {/* Section 3: Financeiro / Convenio / Indicacao */}
              <div className="pt-3">
                <span className="text-[10px] uppercase font-bold text-teal-500 tracking-wider block mb-3 border-b pb-1">3. Dados Administrativos (Obrigatório *)</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Origem (Indicação)</label>
                    <select value={referral} onChange={(e) => setReferral(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 bg-white">
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Google Pesquisa">Google Pesquisa</option>
                      <option value="Indicação de Paciente (Maria de Souza)">Indicação de Paciente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Particular ou Convênio *</label>
                    <select value={insurance} onChange={(e) => setInsurance(e.target.value)} className="w-full border border-teal-200/60 rounded-lg p-2 bg-white focus:ring-1 focus:ring-teal-500 font-semibold text-slate-800">
                      <option value="Particular">Particular / Sem Convênio</option>
                      <option value="Amil Dental">Amil Dental (Convênio)</option>
                      <option value="SulAmérica Odonto">SulAmérica Odonto (Convênio)</option>
                      <option value="Bradesco Dental">Bradesco Dental (Convênio)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Número Carteirinha</label>
                    <input type="text" value={insuranceCard} onChange={(e) => setInsuranceCard(e.target.value)} disabled={insurance === 'Particular'} className="w-full border border-slate-200 rounded-lg p-2 font-mono disabled:opacity-50" placeholder="Opcional" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-medium rounded-lg"
                >
                  Salvar e Abrir Pasta Digital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
