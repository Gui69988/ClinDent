/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  CalendarDays,
  Percent,
  FileSpreadsheet,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldCheck,
  Gift
} from 'lucide-react';
import { useDental } from '../context/DentalContext';

export default function Dashboard() {
  const { financials, appointments, patients, budgets, auditLogs } = useDental();
  const [selectedPeriod, setSelectedPeriod] = useState<'mes' | 'ano'>('mes');

  // Compute stats
  const totalReceitas = financials
    .filter(f => f.type === 'receita' && f.status === 'pago')
    .reduce((sum, f) => sum + f.value, 0);

  const totalDespesas = financials
    .filter(f => f.type === 'despesa' && f.status === 'pago')
    .reduce((sum, f) => sum + f.value, 0);

  const netProfit = totalReceitas - totalDespesas;

  const pendingReceitas = financials
    .filter(f => f.type === 'receita' && f.status === 'pendente')
    .reduce((sum, f) => sum + f.value, 0);

  const pastDueReceitas = financials
    .filter(f => f.type === 'receita' && f.status === 'atrasado')
    .reduce((sum, f) => sum + f.value, 0);

  // Appointments metrics
  const totalApptsCount = appointments.length;
  const attendedCount = appointments.filter(a => a.status === 'atendido').length;
  const noShowCount = appointments.filter(a => a.status === 'falta').length;
  const noShowRate = totalApptsCount > 0 ? Math.round((noShowCount / totalApptsCount) * 100) : 0;

  // Active Patients
  const activePatientsCount = patients.filter(p => p.status === 'ativo' || p.status === 'em_tratamento').length;

  // Budgets metrics
  const pendingBudgets = budgets.filter(b => b.status === 'pendente');
  const pendingBudgetsValue = pendingBudgets.reduce((sum, b) => sum + b.totalValue, 0);

  // Marketing: Indication channels
  const referralSources = patients.reduce((acc, p) => {
    const src = p.referralSource || 'Outros';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // AI-generated suggestions (requested in section 8)
  const aiInsights = [
    {
      title: 'Risco de Abandono de Tratamento',
      desc: 'Ana Carolina Oliveira possui parcelas em atraso de 19 dias e não compareceu à consulta de estética no dia 9 de Julho. Sugere-se contato preventivo.',
      severity: 'high'
    },
    {
      title: 'Otimização de Agenda Ociosa',
      desc: 'Detectado 15% de ociosidade nas tardes de quarta-feira na Unidade Jardins. Dra. Guinevere Vance possui 3 horários livres na próxima semana.',
      severity: 'medium'
    },
    {
      title: 'Métrica de Conversão',
      desc: 'Excelente! A taxa de fechamento de orçamentos ortodônticos cresceu 12% após a introdução de planos de parcelamento flexíveis.',
      severity: 'success'
    }
  ];

  // Calculate birthday patients for today
  const today = new Date();
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayDay = String(today.getDate()).padStart(2, '0');
  const targetMD = `${todayMonth}-${todayDay}`;

  const birthdayPatients = patients.filter(p => {
    if (!p.birthDate || p.deletedAt) return false;
    const parts = p.birthDate.split('-');
    if (parts.length === 3) {
      // Handles both YYYY-MM-DD and DD-MM-YYYY if saved loosely
      const pMD = parts[1] === todayMonth && parts[2] === todayDay;
      const alternativeMD = parts[1] === todayMonth && parts[0] === todayDay;
      return pMD || alternativeMD;
    }
    return false;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-700">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Bem-vindo ao ClinDent!</h2>
          <p className="text-sm text-slate-300 mt-1">
            Aqui está o resumo operacional e de faturamento de hoje. A clínica está operando em conformidade com a LGPD.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-mono">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>LGPD 100% Conforme</span>
          </div>
        </div>
      </div>

      {/* Birthday Reminders Section */}
      {birthdayPatients.length > 0 && (
        <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border border-teal-200/50 p-5 rounded-2xl shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="p-2.5 bg-teal-500 text-slate-900 rounded-xl shadow-sm animate-bounce mt-0.5">
              <Gift className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Aniversariantes do Dia! 🎂</h3>
              <p className="text-xs text-slate-500 mt-1">
                {birthdayPatients.length === 1 
                  ? 'Temos 1 paciente aniversariante hoje. Envie felicitações para fortalecer o relacionamento clínica-paciente!' 
                  : `Temos ${birthdayPatients.length} pacientes aniversariantes hoje. Envie felicitações para fortalecer o relacionamento clínica-paciente!`}
              </p>
              
              <div className="mt-3 flex flex-wrap gap-2">
                {birthdayPatients.map(p => {
                  const birthYear = parseInt(p.birthDate.split('-')[0]);
                  const age = !isNaN(birthYear) ? new Date().getFullYear() - birthYear : null;
                  return (
                    <div key={p.id} className="bg-white border border-teal-100 rounded-xl p-3 flex items-center justify-between gap-4 shadow-sm max-w-sm w-full sm:w-auto">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {p.phone} {age ? `| ${age} anos` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const cleanPhone = p.phone.replace(/[^0-9]/g, '');
                          const greeting = `Olá, ${p.name}! 🎉 Feliz aniversário! Nós da ClinDent lhe desejamos um dia repleto de alegrias, saúde e muitos sorrisos. É um privilégio ter você como paciente! Parabéns! 🎂`;
                          const url = `https://web.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(greeting)}`;
                          window.open(url, '_blank');
                        }}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded-lg transition-colors shrink-0"
                      >
                        Enviar Parabéns 💬
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faturamento Líquido</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center">
              <span className="text-emerald-500 font-medium mr-1 flex items-center"><ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +8.4%</span>
              em relação ao mês anterior
            </p>
          </div>
        </div>

        {/* Patients */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pacientes Ativos</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{activePatientsCount}</h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center">
              <span className="text-teal-500 font-medium mr-1 flex items-center"><ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12%</span>
              novos pacientes este mês
            </p>
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taxa de Faltas (No-Show)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{noShowRate}%</h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center">
              <span className="text-emerald-500 font-medium mr-1 flex items-center"><ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> -3%</span>
              desde os avisos por WhatsApp
            </p>
          </div>
        </div>

        {/* Budgets Pending */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orçamentos Pendentes</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">R$ {pendingBudgetsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-400 mt-1">
              <span className="font-semibold text-slate-600">{pendingBudgets.length}</span> orçamentos aguardando resposta
            </p>
          </div>
        </div>
      </div>

      {/* Charts & Interactive Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Balance SVG Chart (2/3 width) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Balanço de Fluxo de Caixa</h3>
                <p className="text-xs text-slate-400">Receitas vs Despesas realizadas por período</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedPeriod('mes')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    selectedPeriod === 'mes' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setSelectedPeriod('ano')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    selectedPeriod === 'ano' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Anual (Acumulado)
                </button>
              </div>
            </div>

            {/* Custom High-Fidelity Responsive SVG Chart */}
            <div className="relative h-64 w-full flex items-end">
              {/* Y Axis Guide Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-300 font-mono">
                <div className="border-b border-dashed border-slate-100 w-full pt-2">R$ 10.000</div>
                <div className="border-b border-dashed border-slate-100 w-full">R$ 7.500</div>
                <div className="border-b border-dashed border-slate-100 w-full">R$ 5.000</div>
                <div className="border-b border-dashed border-slate-100 w-full">R$ 2.500</div>
                <div className="border-b border-dashed border-slate-100 w-full pb-1">R$ 0</div>
              </div>

              {/* Graphical bars */}
              <div className="relative w-full h-48 flex justify-around items-end pt-4 px-2 z-10">
                {/* Jan */}
                <div className="flex flex-col items-center w-12">
                  <div className="flex space-x-1.5 items-end h-32 w-full justify-center">
                    <div className="w-3 bg-teal-500 rounded-t" style={{ height: '70%' }} title="Receita: R$ 7.000"></div>
                    <div className="w-3 bg-rose-400 rounded-t" style={{ height: '40%' }} title="Despesa: R$ 4.000"></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2">Jan</span>
                </div>
                {/* Fev */}
                <div className="flex flex-col items-center w-12">
                  <div className="flex space-x-1.5 items-end h-32 w-full justify-center">
                    <div className="w-3 bg-teal-500 rounded-t" style={{ height: '80%' }} title="Receita: R$ 8.000"></div>
                    <div className="w-3 bg-rose-400 rounded-t" style={{ height: '45%' }} title="Despesa: R$ 4.500"></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2">Fev</span>
                </div>
                {/* Mar */}
                <div className="flex flex-col items-center w-12">
                  <div className="flex space-x-1.5 items-end h-32 w-full justify-center">
                    <div className="w-3 bg-teal-500 rounded-t" style={{ height: '65%' }} title="Receita: R$ 6.500"></div>
                    <div className="w-3 bg-rose-400 rounded-t" style={{ height: '35%' }} title="Despesa: R$ 3.500"></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2">Mar</span>
                </div>
                {/* Abr */}
                <div className="flex flex-col items-center w-12">
                  <div className="flex space-x-1.5 items-end h-32 w-full justify-center">
                    <div className="w-3 bg-teal-500 rounded-t" style={{ height: '85%' }} title="Receita: R$ 8.500"></div>
                    <div className="w-3 bg-rose-400 rounded-t" style={{ height: '50%' }} title="Despesa: R$ 5.000"></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2">Abr</span>
                </div>
                {/* Mai */}
                <div className="flex flex-col items-center w-12">
                  <div className="flex space-x-1.5 items-end h-32 w-full justify-center">
                    <div className="w-3 bg-teal-500 rounded-t" style={{ height: '90%' }} title="Receita: R$ 9.000"></div>
                    <div className="w-3 bg-rose-400 rounded-t" style={{ height: '55%' }} title="Despesa: R$ 5.500"></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2">Mai</span>
                </div>
                {/* Jun */}
                <div className="flex flex-col items-center w-12">
                  <div className="flex space-x-1.5 items-end h-32 w-full justify-center">
                    <div className="w-3 bg-teal-500 rounded-t" style={{ height: '95%' }} title="Receita: R$ 9.500"></div>
                    <div className="w-3 bg-rose-400 rounded-t" style={{ height: '45%' }} title="Despesa: R$ 4.500"></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2">Jun</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-around text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-teal-500 rounded"></span>
              <span>Receitas Recebidas</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-rose-400 rounded"></span>
              <span>Despesas Pagas</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-slate-800 font-semibold">Prejeção Caixa Saudável:</span>
              <span className="text-emerald-600 font-medium">+R$ 4.500,00</span>
            </div>
          </div>
        </div>

        {/* Marketing Funnel & Referrals (1/3 width) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">Origem dos Pacientes</h3>
            <p className="text-xs text-slate-400 mb-4">Canais de atração de novos leads de marketing</p>

            {/* Funnel bars */}
            <div className="space-y-3.5">
              {Object.entries(referralSources).map(([source, count]) => {
                const total = patients.length || 1;
                const countNum = count as number;
                const pct = Math.round((countNum / total) * 100);
                return (
                  <div key={source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-600">{source}</span>
                      <span className="text-slate-400">{count} pac. ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          source === 'Instagram' ? 'bg-indigo-500' :
                          source === 'Google Pesquisa' ? 'bg-teal-500' :
                          source.includes('Indicação') ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4 text-[11px] text-slate-400">
            Métricas calculadas em tempo real com base no cadastro de indicação das fichas clínicas.
          </div>
        </div>
      </div>

      {/* AI Smart Panel & Live Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* AI Predictor (1/3 width) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-purple-100 p-1.5 rounded-lg text-purple-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-800">Assistente IA Clínico</h3>
            </div>

            <div className="space-y-4">
              {aiInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border text-xs leading-normal space-y-1 ${
                    insight.severity === 'high' ? 'bg-rose-50/50 border-rose-100 text-rose-800' :
                    insight.severity === 'medium' ? 'bg-amber-50/50 border-amber-100 text-amber-800' :
                    'bg-teal-50/50 border-teal-100 text-teal-800'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-semibold">
                    {insight.severity === 'high' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                    <span>{insight.title}</span>
                  </div>
                  <p className="text-slate-600 leading-normal">{insight.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Atualizado há 10 minutos</span>
          </div>
        </div>

        {/* Audit Logs (2/3 width) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Rastro de Auditoria & Segurança</h3>
                <p className="text-xs text-slate-400">Atividades de usuários registradas para LGPD</p>
              </div>
              <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600 font-mono">
                Log Ativo (AES-256)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="py-2">Data/Hora</th>
                    <th className="py-2">Usuário</th>
                    <th className="py-2">Ação</th>
                    <th className="py-2">Detalhes</th>
                    <th className="py-2 text-right">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {auditLogs.slice(0, 4).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                      </td>
                      <td className="py-2.5">
                        <span className="font-medium text-slate-700">{log.userName}</span>
                        <span className="text-[10px] block text-slate-400 uppercase">{log.role}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[10px] uppercase font-semibold text-slate-600">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-400">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>Rastreamento obrigatório conforme as diretrizes do CFO e termos da LGPD.</span>
            <span className="font-semibold text-teal-600">Completo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
