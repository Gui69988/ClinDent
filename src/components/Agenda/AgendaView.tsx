/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Phone,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  Link2,
  Trash2,
  BookmarkPlus
} from 'lucide-react';
import { useDental, createDefaultOdontogram } from '../../context/DentalContext';
import { Appointment, AppointmentStatus, WaitingListEntry } from '../../types/dental';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:15', '11:30',
  '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

export default function AgendaView() {
  const {
    appointments,
    addAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    patients,
    addPatient,
    users,
    currentUnit,
    waitingList,
    addWaitingList,
    removeWaitingList,
    logAction
  } = useDental();

  // Calendar Date State
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-07-09'); // Base mock date matching prompt
  const [selectedDentistId, setSelectedDentistId] = useState<string>('all');
  const [selectedChair, setSelectedChair] = useState<number>(1);
  
  // Modals / Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  
  // New Appointment Fields
  const [newPatientNameInput, setNewPatientNameInput] = useState('');
  const [selectedPatientFromRec, setSelectedPatientFromRec] = useState<any | null>(null);
  const [showRecs, setShowRecs] = useState(false);
  const [newDentistId, setNewDentistId] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newDuration, setNewDuration] = useState(30);
  const [newNotes, setNewNotes] = useState('');

  // Unregistered Patient Flow State
  const [pendingUnregisteredAppointment, setPendingUnregisteredAppointment] = useState<{
    tempId: string;
    patientName: string;
    dentistId: string;
    dentistName: string;
    date: string;
    time: string;
    durationMinutes: number;
    chairNumber: number;
    unitId: string;
    notes: string;
  } | null>(null);

  // Unregistered Patient Registration Fields
  const [regCpf, setRegCpf] = useState('');
  const [regRg, setRegRg] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regGender, setRegGender] = useState('Masculino');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCep, setRegCep] = useState('');
  const [regStreet, setRegStreet] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regNeighborhood, setRegNeighborhood] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');

  // Waiting list fields
  const [waitPatientId, setWaitPatientId] = useState('');
  const [waitPatientNameInput, setWaitPatientNameInput] = useState('');
  const [showWaitRecs, setShowWaitRecs] = useState(false);
  const [selectedWaitPatientFromRec, setSelectedWaitPatientFromRec] = useState<any | null>(null);
  const [waitNotes, setWaitNotes] = useState('');
  const [waitArrivalTime, setWaitArrivalTime] = useState(''); // Horário de chegada

  // Filter recommendations only if typed name matches existing patients
  const patientRecs = newPatientNameInput.trim()
    ? patients.filter(p => p.name.toLowerCase().includes(newPatientNameInput.toLowerCase()) && !p.deletedAt)
    : [];

  const waitPatientRecs = waitPatientNameInput.trim()
    ? patients.filter(p => p.name.toLowerCase().includes(waitPatientNameInput.toLowerCase()) && !p.deletedAt)
    : [];

  // Handle scheduling
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const dentist = users.find(u => u.id === newDentistId);
    if (!dentist) return;
    
    if (selectedPatientFromRec) {
      addAppointment({
        patientId: selectedPatientFromRec.id,
        patientName: selectedPatientFromRec.name,
        patientPhone: selectedPatientFromRec.phone,
        dentistId: dentist.id,
        dentistName: dentist.name,
        date: selectedDateStr,
        time: newTime,
        durationMinutes: Number(newDuration),
        chairNumber: selectedChair,
        unitId: currentUnit,
        status: 'confirmado',
        notes: newNotes
      });
      setShowAddModal(false);
      // Reset
      setNewPatientNameInput('');
      setSelectedPatientFromRec(null);
      setNewNotes('');
    } else {
      // Patient does not exist! Transition to registration below appointment
      setPendingUnregisteredAppointment({
        tempId: 'p_temp_' + Date.now(),
        patientName: newPatientNameInput,
        dentistId: dentist.id,
        dentistName: dentist.name,
        date: selectedDateStr,
        time: newTime,
        durationMinutes: Number(newDuration),
        chairNumber: selectedChair,
        unitId: currentUnit,
        notes: newNotes
      });
      setShowAddModal(false);
    }
  };

  // Handle registering unregistered patient and finalizing appointment
  const handleRegisterAndComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUnregisteredAppointment) return;

    // 1. Save patient to local context
    const realPatientId = addPatient({
      name: pendingUnregisteredAppointment.patientName,
      cpf: regCpf || '000.000.000-00',
      rg: regRg || '00.000.000-0',
      birthDate: regBirthDate || '1990-01-01',
      gender: regGender,
      maritalStatus: 'Não Informado',
      profession: 'Não Informado',
      address: {
        cep: regCep || '00000-000',
        street: regStreet || 'Não Informado',
        number: regNumber || 'S/N',
        neighborhood: regNeighborhood || 'Não Informado',
        city: regCity || 'Não Informado',
        state: regState || 'SP'
      },
      phone: regPhone || '(11) 99999-9999',
      email: regEmail || 'email@provisorio.com',
      referralSource: 'Ficha Automática de Nova Agenda',
      status: 'ativo'
    });

    // 2. Complete appointment creation with real ID and real phone
    addAppointment({
      patientId: realPatientId,
      patientName: pendingUnregisteredAppointment.patientName,
      patientPhone: regPhone || '(11) 99999-9999',
      dentistId: pendingUnregisteredAppointment.dentistId,
      dentistName: pendingUnregisteredAppointment.dentistName,
      date: pendingUnregisteredAppointment.date,
      time: pendingUnregisteredAppointment.time,
      durationMinutes: pendingUnregisteredAppointment.durationMinutes,
      chairNumber: pendingUnregisteredAppointment.chairNumber,
      unitId: pendingUnregisteredAppointment.unitId,
      status: 'confirmado',
      notes: pendingUnregisteredAppointment.notes
    });

    // 3. Clear states
    setPendingUnregisteredAppointment(null);
    setNewPatientNameInput('');
    setSelectedPatientFromRec(null);
    setNewNotes('');
    
    // Clear registration fields
    setRegCpf('');
    setRegRg('');
    setRegBirthDate('');
    setRegGender('Masculino');
    setRegPhone('');
    setRegEmail('');
    setRegCep('');
    setRegStreet('');
    setRegNumber('');
    setRegNeighborhood('');
    setRegCity('');
    setRegState('');

    alert(`Paciente "${pendingUnregisteredAppointment.patientName}" cadastrado com sucesso e consulta agendada!`);
  };

  // Handle waiting list add with arrival time
  const handleAddToWaiting = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = selectedWaitPatientFromRec || patients.find(p => p.name.toLowerCase() === waitPatientNameInput.trim().toLowerCase() && !p.deletedAt);
    if (pat) {
      addWaitingList({
        patientId: pat.id,
        patientName: pat.name,
        phone: pat.phone,
        preferredDays: ['Segunda', 'Quarta', 'Sexta'],
        preferredPeriods: ['tarde'],
        notes: waitNotes,
        arrivalTime: waitArrivalTime || undefined
      });
      setShowWaitingModal(false);
      setWaitNotes('');
      setWaitArrivalTime('');
      setWaitPatientNameInput('');
      setSelectedWaitPatientFromRec(null);
    } else {
      alert("Paciente não cadastrado! Só é possível adicionar à fila de espera pacientes já cadastrados no banco de dados.");
    }
  };

  // Send Whatsapp confirmation (Simulated WhatsApp web redirect)
  const sendWhatsAppReminder = (appt: Appointment, type: 'confirmacao' | 'lembrete') => {
    const formattedPhone = appt.patientPhone.replace(/[^0-9]/g, '');
    const greeting = `Olá, ${appt.patientName}!`;
    const message = type === 'confirmacao' 
      ? `${greeting} Aqui é da ClinDent. Gostaríamos de confirmar sua consulta agendada para o dia ${appt.date} às ${appt.time} com ${appt.dentistName}. Confirma o comparecimento? Envie SIM ou NÃO.`
      : `${greeting} Lembrete amigável de sua consulta amanhã às ${appt.time} com ${appt.dentistName}. Por favor, chegue com 10 minutos de antecedência. Até logo!`;
      
    const url = `https://web.whatsapp.com/send?phone=55${formattedPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    logAction('send_whatsapp_reminder', `Disparou lembrete de WhatsApp (${type}) para o paciente: ${appt.patientName}`);
  };

  // Filtered appointments for calendar render
  const filteredAppts = appointments.filter(appt => {
    const matchesDate = appt.date === selectedDateStr;
    const matchesDentist = selectedDentistId === 'all' || appt.dentistId === selectedDentistId;
    const matchesChair = appt.chairNumber === selectedChair;
    const matchesUnit = appt.unitId === currentUnit;
    return matchesDate && matchesDentist && matchesChair && matchesUnit;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:space-x-6 lg:space-y-0">
      
      {/* LEFT: Agenda Core Calendar */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Calendário de Consultas</h2>
              <p className="text-xs text-slate-400">Gerencie atendimentos por cadeira e profissional</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Quick waiting list click */}
            <button
              onClick={() => setShowWaitingModal(true)}
              className="text-xs flex items-center space-x-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-teal-500" />
              <span>Adicionar Fila</span>
            </button>

            {/* Quick Appointment Add */}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-teal-500 text-slate-950 font-medium text-xs flex items-center space-x-1.5 hover:bg-teal-400 px-3 py-1.5 rounded-lg transition-all shadow-md shadow-teal-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Agendamento</span>
            </button>
          </div>
        </div>

        {/* Agenda Filters Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Filtro por Dentista</label>
            <select
              value={selectedDentistId}
              onChange={(e) => setSelectedDentistId(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">Todos os Dentistas</option>
              {users.filter(u => u.role === 'dentista' || u.role === 'admin').map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.cro})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Cadeira / Consultório</label>
            <div className="flex space-x-1 bg-white p-1 rounded-lg border border-slate-200">
              {[1, 2, 3].map(num => (
                <button
                  key={num}
                  onClick={() => setSelectedChair(num)}
                  className={`flex-1 text-center py-1 text-xs rounded font-medium transition-colors ${
                    selectedChair === num ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Cadeira {num}
                </button>
              ))}
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Data selecionada</label>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSelectedDateStr(prev => {
                  const d = new Date(prev);
                  d.setDate(d.getDate() - 1);
                  return d.toISOString().split('T')[0];
                })}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors text-slate-600"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="date"
                value={selectedDateStr}
                onChange={(e) => setSelectedDateStr(e.target.value)}
                className="flex-1 text-center text-xs border border-slate-200 rounded-lg p-1 font-mono focus:outline-none"
              />
              <button
                onClick={() => setSelectedDateStr(prev => {
                  const d = new Date(prev);
                  d.setDate(d.getDate() + 1);
                  return d.toISOString().split('T')[0];
                })}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors text-slate-600"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* TIME GRID & APPOINTMENTS CONTAINER */}
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {TIME_SLOTS.map((time) => {
            const appt = filteredAppts.find(a => a.time === time);
            
            // Lunch break blocking simulation
            const isLunchTime = time === '12:00';

            return (
              <div key={time} className={`flex items-stretch min-h-[56px] transition-colors ${isLunchTime ? 'bg-amber-50/20' : ''}`}>
                {/* Time Indicator */}
                <div className="w-16 flex items-center justify-center border-r border-slate-100 text-xs font-mono font-semibold text-slate-400 bg-slate-50 shrink-0">
                  {time}
                </div>

                {/* Slot Content */}
                <div className="flex-1 p-2 flex items-center relative">
                  {isLunchTime ? (
                    <div className="text-xs text-amber-600 flex items-center space-x-1.5 font-medium px-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Bloqueio: Intervalo de Almoço de Equipe</span>
                    </div>
                  ) : appt ? (
                    <div className={`w-full border p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between transition-all hover:shadow-sm ${
                      appt.status === 'atendido' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                      appt.status === 'falta' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                      appt.status === 'em_atendimento' ? 'bg-indigo-50 border-indigo-100 text-indigo-800' :
                      appt.status === 'confirmado' ? 'bg-teal-50 border-teal-100 text-teal-800' :
                      'bg-amber-50 border-amber-100 text-amber-800'
                    }`}>
                      {/* Appointment summary */}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-xs text-slate-800">{appt.patientName}</span>
                          <span className="text-[10px] text-slate-400">({appt.durationMinutes} min)</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-500">
                          <span className="flex items-center"><User className="w-3 h-3 text-slate-400 mr-1" /> {appt.dentistName}</span>
                          <span className="flex items-center"><Phone className="w-3 h-3 text-slate-400 mr-1" /> {appt.patientPhone}</span>
                          {appt.notes && <span className="italic text-slate-400 max-w-xs truncate" title={appt.notes}>Obs: {appt.notes}</span>}
                        </div>
                      </div>

                      {/* Status select dropdown & communications */}
                      <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                        {/* WhatsApp automated templates dropdown / action buttons */}
                        <div className="flex space-x-1 border-r border-slate-200/60 pr-2 mr-1">
                          <button
                            onClick={() => sendWhatsAppReminder(appt, 'confirmacao')}
                            className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-indigo-600 transition-all text-[11px] font-medium flex items-center space-x-1"
                            title="Disparar confirmação de consulta no WhatsApp"
                          >
                            <Phone className="w-3 h-3 text-indigo-500" />
                            <span className="hidden sm:inline text-[10px]">WhatsApp</span>
                          </button>
                        </div>

                        {/* Status Select */}
                        <select
                          value={appt.status}
                          onChange={(e) => updateAppointmentStatus(appt.id, e.target.value as AppointmentStatus)}
                          className="text-[11px] font-medium border border-slate-200 rounded p-1 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                        >
                          <option value="confirmado">Confirmado</option>
                          <option value="aguardando_confirmacao">Pendente</option>
                          <option value="em_atendimento">Em Atendimento</option>
                          <option value="atendido">Atendido</option>
                          <option value="falta">Falta</option>
                          <option value="cancelado">Cancelado</option>
                        </select>

                        {/* Delete Appt */}
                        <button
                          onClick={() => {
                            if (confirm(`Excluir agendamento de ${appt.patientName}?`)) {
                              deleteAppointment(appt.id);
                            }
                          }}
                          className="p-1 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                          title="Remover da agenda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setNewTime(time);
                        setShowAddModal(true);
                      }}
                      className="w-full h-full text-left py-2 px-3 text-slate-300 hover:text-teal-500 hover:bg-slate-50 border border-transparent hover:border-dashed hover:border-teal-200 rounded-lg transition-all text-xs flex items-center space-x-1 group"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-500" />
                      <span>Agendar consulta às {time}...</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Waiting List Panel */}
      <div className="w-full lg:w-72 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2.5 mb-4 border-b border-slate-200 pb-3">
            <BookmarkPlus className="w-4 h-4 text-teal-600" />
            <h3 className="font-semibold text-slate-800 text-sm">Fila de Espera (Encaixes)</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-normal">
            Pacientes que desejam ser chamados caso ocorra um cancelamento de horário na unidade.
          </p>

          <div className="space-y-3">
            {waitingList.length > 0 ? (
              waitingList.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between relative group">
                  <button
                    onClick={() => removeWaitingList(item.id)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Excluir da fila de espera"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <p className="text-xs font-bold text-slate-800 truncate pr-5">{item.patientName}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.phone}</p>
                  {item.arrivalTime && (
                    <span className="inline-flex items-center space-x-1 mt-1 bg-amber-50 text-amber-700 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200 w-fit">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Chegada: {item.arrivalTime}</span>
                    </span>
                  )}
                  {item.notes && <p className="text-[10px] bg-slate-50 border border-slate-100 p-1.5 rounded text-slate-500 italic mt-1.5">{item.notes}</p>}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                Fila de espera vazia.
              </div>
            )}
          </div>
        </div>

        {/* Quick actions indicator */}
        <div className="border-t border-slate-200 pt-4 mt-4 space-y-2.5 text-xs text-slate-500">
          <div className="flex items-center justify-between text-[11px]">
            <span>Taxa de Ocupação da Cadeira {selectedChair}:</span>
            <span className="font-semibold text-emerald-600">82% (Excelente)</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: '82%' }}></div>
          </div>
        </div>
      </div>

      {/* MODAL: Add Appointment */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-semibold text-sm">Agendar Consulta</span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateAppointment} className="p-5 space-y-4 text-xs">
              <div className="relative">
                <label className="block text-slate-600 font-medium mb-1">Paciente (Digite o nome por extenso)</label>
                <input
                  type="text"
                  value={newPatientNameInput}
                  onChange={(e) => {
                    setNewPatientNameInput(e.target.value);
                    setSelectedPatientFromRec(null);
                    setShowRecs(true);
                  }}
                  onFocus={() => setShowRecs(true)}
                  required
                  placeholder="Nome completo do paciente..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
                
                {/* Autocomplete recommendations ONLY if patient already exists */}
                {showRecs && patientRecs.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50 text-xs divide-y divide-slate-100">
                    {patientRecs.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setNewPatientNameInput(p.name);
                          setSelectedPatientFromRec(p);
                          setShowRecs(false);
                        }}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-700">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">CPF: {p.cpf}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedPatientFromRec && (
                  <div className="mt-1.5 text-[11px] text-emerald-600 font-semibold flex items-center">
                    ✓ Paciente já cadastrado no sistema (ID: {selectedPatientFromRec.id})
                  </div>
                )}
                
                {!selectedPatientFromRec && newPatientNameInput.trim() && patientRecs.length === 0 && (
                  <div className="mt-1.5 text-[11px] text-amber-600 font-semibold">
                    ⚠ Paciente não cadastrado. Ficha de cadastro abrirá automaticamente após agendar!
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Dentista</label>
                  <select
                    value={newDentistId}
                    onChange={(e) => setNewDentistId(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Selecione...</option>
                    {users.filter(u => u.role === 'dentista' || u.role === 'admin').map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Duração</label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="120">2 Horas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Horário</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Cadeira / Consultório</label>
                  <select
                    value={selectedChair}
                    onChange={(e) => setSelectedChair(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                  >
                    <option value="1">Cadeira 1</option>
                    <option value="2">Cadeira 2</option>
                    <option value="3">Cadeira 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Anotações / Procedimento previsto</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Consulta diagnóstica, Troca de aparelho, Ajuste prótese..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 min-h-[60px]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-lg shadow"
                >
                  Agendar Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Unregistered Patient Registration Page below appointment */}
      {pendingUnregisteredAppointment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-100 animate-pulse" />
                <span className="font-bold text-sm tracking-wide uppercase">Paciente não cadastrado</span>
              </div>
              <button 
                onClick={() => setPendingUnregisteredAppointment(null)} 
                className="text-amber-100 hover:text-white font-bold text-sm"
              >
                ✕ Fechar
              </button>
            </div>
            
            <div className="bg-amber-50 p-4 border-b border-amber-200 text-xs text-amber-800 leading-relaxed">
              O agendamento de consulta foi iniciado para o paciente provisório <strong>{pendingUnregisteredAppointment.patientName}</strong>. 
              Para que a consulta seja homologada no sistema, por favor preencha a ficha de cadastramento completa abaixo:
            </div>

            <form onSubmit={handleRegisterAndComplete} className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              {/* Registration Form Underneath */}
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-2 text-teal-600">
                Ficha de Cadastramento do Novo Paciente
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    value={regCpf}
                    onChange={(e) => setRegCpf(e.target.value)}
                    placeholder="123.456.789-00"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-teal-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">RG</label>
                  <input
                    type="text"
                    value={regRg}
                    onChange={(e) => setRegRg(e.target.value)}
                    placeholder="12.345.678-9"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-teal-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Data de Nascimento *</label>
                  <input
                    type="date"
                    required
                    value={regBirthDate}
                    onChange={(e) => setRegBirthDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-teal-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Gênero</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Celular / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-teal-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">E-mail</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-teal-500 bg-slate-50"
                  />
                </div>
              </div>

              <h5 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider pt-2 border-t border-slate-100">
                Endereço Residencial
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">CEP</label>
                  <input
                    type="text"
                    value={regCep}
                    onChange={(e) => setRegCep(e.target.value)}
                    placeholder="01311-200"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-500 font-medium mb-1">Logradouro (Rua/Avenida)</label>
                  <input
                    type="text"
                    value={regStreet}
                    onChange={(e) => setRegStreet(e.target.value)}
                    placeholder="Av. Paulista"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Número</label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="1000"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Bairro</label>
                  <input
                    type="text"
                    value={regNeighborhood}
                    onChange={(e) => setRegNeighborhood(e.target.value)}
                    placeholder="Bela Vista"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Cidade</label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    placeholder="SP"
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPendingUnregisteredAppointment(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                >
                  Cancelar Tudo
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-md"
                >
                  Salvar Cadastro & Concluir Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add to Waiting List */}
      {showWaitingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-semibold text-sm">Adicionar à Fila de Espera</span>
              <button onClick={() => setShowWaitingModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddToWaiting} className="p-5 space-y-4 text-xs">
              <div className="relative">
                <label className="block text-slate-600 font-medium mb-1">Paciente (Digite o nome por extenso)</label>
                <input
                  type="text"
                  value={waitPatientNameInput}
                  onChange={(e) => {
                    setWaitPatientNameInput(e.target.value);
                    setSelectedWaitPatientFromRec(null);
                    setShowWaitRecs(true);
                  }}
                  onFocus={() => setShowWaitRecs(true)}
                  required
                  placeholder="Nome do paciente..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
                
                {/* Autocomplete recommendations ONLY if patient already exists */}
                {showWaitRecs && waitPatientRecs.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50 text-xs divide-y divide-slate-100">
                    {waitPatientRecs.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setWaitPatientNameInput(p.name);
                          setSelectedWaitPatientFromRec(p);
                          setShowWaitRecs(false);
                        }}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-700">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">CPF: {p.cpf}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedWaitPatientFromRec && (
                  <div className="mt-1.5 text-[11px] text-emerald-600 font-semibold flex items-center">
                    ✓ Paciente cadastrado (ID: {selectedWaitPatientFromRec.id})
                  </div>
                )}

                {!selectedWaitPatientFromRec && waitPatientNameInput.trim() && waitPatientRecs.length === 0 && (
                  <div className="mt-1.5 text-[11px] text-rose-600 font-semibold">
                    ⚠ Paciente não cadastrado no banco de dados.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Horário de Chegada (Opcional)</label>
                <input
                  type="time"
                  value={waitArrivalTime}
                  onChange={(e) => setWaitArrivalTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Preferência de Horário / Observações</label>
                <textarea
                  value={waitNotes}
                  onChange={(e) => setWaitNotes(e.target.value)}
                  placeholder="Ex: Prefere segundas e quartas na parte da tarde..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 min-h-[80px]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWaitingModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-lg"
                >
                  Adicionar Fila
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
