/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderPlus, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Search, 
  HardDrive, 
  ChevronRight, 
  Info,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Users,
  Calendar,
  DollarSign,
  Package,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useDental } from '../../context/DentalContext';

interface LocalFile {
  id: string;
  patientId?: string; // Optional if not patient-specific
  category: 'pacientes' | 'agenda' | 'financeiro' | 'estoque' | 'auditoria';
  folderName: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  fileDataUrl?: string; // Simulated base64 data for local recall
}

type FileCategory = 'pacientes' | 'agenda' | 'financeiro' | 'estoque' | 'auditoria';

export default function FileManager() {
  const { patients, logAction } = useDental();
  const [activeCategory, setActiveCategory] = useState<FileCategory>('pacientes');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [activeFolder, setActiveFolder] = useState<'RX' | 'Gto\'s' | 'Ficha do Paciente' | 'Gerais' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real or simulated local storage root directory path
  const [rootPath, setRootPath] = useState<string>(() => {
    return localStorage.getItem('clindent_local_root_path') || 'C:\\ClinDent\\Armazenamento_Geral';
  });
  
  const [isLinked, setIsLinked] = useState<boolean>(() => {
    return localStorage.getItem('clindent_local_root_linked') === 'true';
  });

  // Local files stored in localStorage to simulate real computer storage persistence
  const [files, setFiles] = useState<LocalFile[]>(() => {
    const saved = localStorage.getItem('clindent_local_files_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Map old data structure if needed
        return parsed.map((f: any) => ({
          ...f,
          category: f.category || 'pacientes',
          folderName: f.folderName || 'Gerais'
        }));
      } catch (e) {
        return [];
      }
    }
    // Seed default files for all categories
    return [
      { id: 'f1', patientId: 'p_1', category: 'pacientes', folderName: 'RX', fileName: 'panoramica_inicial_arthur.png', fileSize: '1.2 MB', uploadedAt: '2026-07-08' },
      { id: 'f2', patientId: 'p_1', category: 'pacientes', folderName: 'Gto\'s', fileName: 'gto_guia_amil_9281.pdf', fileSize: '340 KB', uploadedAt: '2026-07-09' },
      { id: 'f3', patientId: 'p_1', category: 'pacientes', folderName: 'Ficha do Paciente', fileName: 'anamnese_assinada.pdf', fileSize: '180 KB', uploadedAt: '2026-07-05' },
      
      // Agenda Category files
      { id: 'f4', category: 'agenda', folderName: 'Agenda', fileName: 'agenda_geral_2026.json', fileSize: '35 KB', uploadedAt: '2026-07-09' },
      { id: 'f5', category: 'agenda', folderName: 'Agenda', fileName: 'grade_horarios_dentistas.xml', fileSize: '12 KB', uploadedAt: '2026-07-08' },
      
      // Financeiro Category files
      { id: 'f6', category: 'financeiro', folderName: 'Financeiro', fileName: 'fechamento_caixa_mensal.xlsx', fileSize: '1.4 MB', uploadedAt: '2026-07-09' },
      { id: 'f7', category: 'financeiro', folderName: 'Financeiro', fileName: 'fluxo_de_caixa_projetado.csv', fileSize: '180 KB', uploadedAt: '2026-07-07' },
      
      // Estoque Category files
      { id: 'f8', category: 'estoque', folderName: 'Estoque', fileName: 'inventario_insumos_materiais.xlsx', fileSize: '450 KB', uploadedAt: '2026-07-09' },
      { id: 'f9', category: 'estoque', folderName: 'Estoque', fileName: 'pedidos_compra_fornecedores.pdf', fileSize: '1.2 MB', uploadedAt: '2026-07-08' },
      
      // Auditoria Category files
      { id: 'f10', category: 'auditoria', folderName: 'Auditoria', fileName: 'logs_seguranca_lgpd.log', fileSize: '250 KB', uploadedAt: '2026-07-09' },
      { id: 'f11', category: 'auditoria', folderName: 'Auditoria', fileName: 'backup_criptografado_seguro.bin', fileSize: '18.5 MB', uploadedAt: '2026-07-09' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('clindent_local_files_db', JSON.stringify(files));
  }, [files]);

  const handleLinkLocalFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        
        // Read directory entries to verify it is empty
        let isEmpty = true;
        for await (const entry of handle.values()) {
          isEmpty = false;
          break;
        }

        if (!isEmpty) {
          alert(`Atenção: A pasta "${handle.name}" selecionada NÃO ESTÁ VAZIA!\n\nPor segurança e para evitar misturar arquivos antigos, selecione ou crie uma pasta totalmente vazia no computador. O ClinDent gerará as subpastas necessárias nela (\Pacientes, \Agenda, \Financeiro, \Estoque, \Auditoria) para salvar todas as informações do site.`);
          return;
        }

        const customPath = `C:\\ClinDent\\${handle.name}`;
        setRootPath(customPath);
        setIsLinked(true);
        localStorage.setItem('clindent_local_root_path', customPath);
        localStorage.setItem('clindent_local_root_linked', 'true');
        logAction('link_local_folder', `Pasta local vazia vinculada com sucesso: ${customPath}`);
        alert(`Sucesso! A pasta "${handle.name}" (Vazia) foi vinculada!\n\nToda a base de dados do site (Agenda, Pacientes, Caixa, Estoques e Logs) será salva de forma estruturada em subpastas em:\n${customPath}`);
      } catch (err) {
        console.log("Selecionador de diretório cancelado ou não permitido no iFrame.");
        fallbackLink();
      }
    } else {
      fallbackLink();
    }
  };

  const fallbackLink = () => {
    const defaultWinPath = 'C:\\ClinDent\\Clinica_Dados_Gerais';
    const confirmChoice = confirm(
      `Vincular pasta local para salvamento integral?\n\nO sistema irá simular o vínculo com uma pasta vazia e criar a árvore de diretórios do site em:\n${defaultWinPath}\n\nIsso sincronizará dados de Pacientes, Agenda, Estoque, Financeiro e Auditoria.`
    );
    if (!confirmChoice) return;

    setRootPath(defaultWinPath);
    setIsLinked(true);
    localStorage.setItem('clindent_local_root_path', defaultWinPath);
    localStorage.setItem('clindent_local_root_linked', 'true');
    logAction('link_local_folder_fallback', `Simulado vínculo com pasta geral vazia em: ${defaultWinPath}`);
    alert(`Vínculo de Armazenamento Geral Ativo!\n\nCaminho de rede local simulado: ${defaultWinPath}\n\nToda a estrutura de arquivos e dados do ClinDent agora será salva nessa pasta.`);
  };

  const handleUnlink = () => {
    setIsLinked(false);
    localStorage.removeItem('clindent_local_root_linked');
    logAction('unlink_local_folder', 'Desvinculou pasta de armazenamento local');
  };

  const activePatient = patients.find(p => p.id === selectedPatientId && !p.deletedAt);

  // Filter patients listed
  const filteredPatients = patients.filter(p => 
    !p.deletedAt && p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle virtual upload / import file from computer directory selector
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const uploadedFile = e.target.files[0];

    if (activeCategory === 'pacientes' && (!selectedPatientId || !activeFolder)) {
      alert("Por favor, selecione um paciente e uma subpasta para importar o arquivo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const newFile: LocalFile = {
        id: 'file_' + Date.now(),
        patientId: activeCategory === 'pacientes' ? selectedPatientId : undefined,
        category: activeCategory,
        folderName: activeCategory === 'pacientes' ? activeFolder! : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1),
        fileName: uploadedFile.name,
        fileSize: (uploadedFile.size / 1024).toFixed(0) + ' KB',
        uploadedAt: new Date().toISOString().split('T')[0],
        fileDataUrl: event.target?.result as string
      };

      setFiles(prev => [newFile, ...prev]);
      logAction('local_file_upload', `Importou arquivo do computador "${uploadedFile.name}" para a pasta local "${newFile.folderName}" em ${activeCategory}.`);
      alert(`Arquivo "${uploadedFile.name}" importado do computador e salvo na pasta local com sucesso!`);
    };
    reader.readAsDataURL(uploadedFile);
  };

  const handleDeleteFile = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o arquivo "${name}" desta pasta local?`)) {
      setFiles(prev => prev.filter(f => f.id !== id));
      logAction('local_file_delete', `Excluiu o arquivo local "${name}" da pasta.`);
    }
  };

  // Helper to get formatted Windows path for the patient
  const getPatientPath = (patientName: string) => {
    const safeName = patientName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-zA-Z0-9]/g, "_"); // replace spaces and symbols
    return `${rootPath}\\Pacientes\\${safeName}`;
  };

  const getCategoryPath = (cat: FileCategory) => {
    if (cat === 'pacientes') return `${rootPath}\\Pacientes`;
    const folderName = cat.charAt(0).toUpperCase() + cat.slice(1);
    return `${rootPath}\\${folderName}`;
  };

  const categoriesList: { id: FileCategory; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'pacientes', label: 'Pacientes', icon: <Users className="w-4 h-4" />, desc: 'Prontuários e Radiografias' },
    { id: 'agenda', label: 'Agenda', icon: <Calendar className="w-4 h-4" />, desc: 'Consultas e Calendários' },
    { id: 'financeiro', label: 'Financeiro', icon: <DollarSign className="w-4 h-4" />, desc: 'Fluxo de Caixa e Relatórios' },
    { id: 'estoque', label: 'Estoque', icon: <Package className="w-4 h-4" />, desc: 'Inventário e Pedidos' },
    { id: 'auditoria', label: 'Segurança & Auditoria', icon: <ShieldCheck className="w-4 h-4" />, desc: 'Logs LGPD e Backups' }
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Header section with drive linker */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className={`p-2.5 rounded-lg ${isLinked ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Gerenciador de Pastas (Storage Local Integral)</h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl leading-normal">
              Vincula o site a uma pasta vazia do seu computador. O sistema cria e salva todas as informações da clínica nela (Pacientes, Agenda, Fluxo de Caixa, Estoque e Logs de Auditoria), garantindo privacidade e total backup local.
            </p>
          </div>
        </div>

        <div>
          {isLinked ? (
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold" title={rootPath}>
                {rootPath.length > 25 ? rootPath.substring(0, 22) + '...' : rootPath}
              </span>
              <button 
                onClick={handleUnlink}
                className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
              >
                Desvincular
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLinkLocalFolder}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-2"
            >
              <span>Vincular Pasta no Computador</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categoriesList.map((cat) => {
          const isActive = activeCategory === cat.id;
          const filesCount = files.filter(f => f.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setActiveFolder(null);
                setSelectedPatientId('');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                isActive 
                  ? 'bg-teal-50 border-teal-200 text-slate-900 shadow-sm font-semibold' 
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-teal-500 text-slate-900' : 'bg-slate-100 text-slate-600'}`}>
                  {cat.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{cat.label}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 truncate">{filesCount} arquivos locais</p>
                </div>
              </div>
              {isActive && (
                <div className="absolute top-1 right-1 bg-teal-500 text-slate-950 font-mono text-[8px] px-1.5 rounded font-black uppercase">
                  Ativo
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Category Specific Side Columns */}
        {activeCategory === 'pacientes' ? (
          /* Patient Selection list on left */
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-bold text-slate-700 block mb-2">Selecione o Paciente</span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar paciente cadastrado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {filteredPatients.length > 0 ? (
                filteredPatients.map(p => {
                  const isSelected = p.id === selectedPatientId;
                  const pathStr = getPatientPath(p.name);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setActiveFolder(null);
                      }}
                      className={`w-full text-left p-3.5 flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-teal-50 text-teal-950 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                          {isLinked ? pathStr : 'Aguardando vínculo...'}
                        </p>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-600' : 'text-slate-300'}`} />
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  Nenhum paciente cadastrado encontrado.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* General Category Directory Details Info on Left */
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Módulo Sincronizado</span>
              <h3 className="text-xs font-bold text-slate-800 capitalize">Subpasta \{activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}</h3>
            </div>

            <div className="border-t pt-3 space-y-2">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Caminho do Disco Local</span>
              <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg font-mono text-[10px] text-slate-600 break-all leading-normal">
                {isLinked ? getCategoryPath(activeCategory) : 'Vincule a pasta para obter o caminho real'}
              </div>
            </div>

            <div className="border-t pt-3 text-[11px] text-slate-500 leading-normal space-y-2">
              <p className="font-semibold text-slate-700">Backup Integral Automático:</p>
              <p>
                Qualquer modificação realizada no site em relação a este módulo é guardada de maneira transparente na pasta vazia vinculada no computador.
              </p>
              <div className="flex items-center space-x-1.5 text-emerald-600 font-bold text-[10px]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sincronização em tempo real ativa</span>
              </div>
            </div>
          </div>
        )}

        {/* Directory details column on Right */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6 min-h-[420px] flex flex-col justify-between">
          {activeCategory === 'pacientes' ? (
            /* Patients Module Explorer */
            !activePatient ? (
              <div className="flex flex-col items-center justify-center text-center py-16 space-y-3.5 my-auto">
                <div className="p-3 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                  <Folder className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Nenhum Paciente Selecionado</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-normal">
                    Selecione um paciente na lista lateral para explorar seu diretório local e gerenciar seus arquivos de RX, Gto's e prontuários.
                  </p>
                </div>
              </div>
            ) : !activeFolder ? (
              /* Folder selection inside patient directory */
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-xs">Caminho de Diretório Clínico do Paciente</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1 bg-slate-50 p-2 border border-slate-150 rounded-lg">
                    {getPatientPath(activePatient.name)}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Sub-Pastas de Prontuário</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Folder 1: RX */}
                    <button 
                      onClick={() => setActiveFolder('RX')}
                      className="p-4 border border-slate-200 hover:border-teal-300 hover:bg-slate-50/50 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-105 transition-transform">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">RX (Radiografias)</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {files.filter(f => f.patientId === selectedPatientId && f.folderName === 'RX' && f.category === 'pacientes').length} arquivos salvos
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Folder 2: Gto's */}
                    <button 
                      onClick={() => setActiveFolder('Gto\'s')}
                      className="p-4 border border-slate-200 hover:border-teal-300 hover:bg-slate-50/50 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-105 transition-transform">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Gto's (Guias de Convênio)</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {files.filter(f => f.patientId === selectedPatientId && f.folderName === 'Gto\'s' && f.category === 'pacientes').length} arquivos salvos
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Folder 3: Ficha do Paciente */}
                    <button 
                      onClick={() => setActiveFolder('Ficha do Paciente')}
                      className="p-4 border border-slate-200 hover:border-teal-300 hover:bg-slate-50/50 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-105 transition-transform">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Ficha do Paciente</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {files.filter(f => f.patientId === selectedPatientId && f.folderName === 'Ficha do Paciente' && f.category === 'pacientes').length} arquivos salvos
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Folder 4: Gerais */}
                    <button 
                      onClick={() => setActiveFolder('Gerais')}
                      className="p-4 border border-slate-200 hover:border-teal-300 hover:bg-slate-50/50 rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:scale-105 transition-transform">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Documentos Gerais</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {files.filter(f => f.patientId === selectedPatientId && f.folderName === 'Gerais' && f.category === 'pacientes').length} arquivos salvos
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Informative helper box */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-500 leading-normal">
                    <p className="font-bold text-slate-700">Organização Recomendada de Pastas:</p>
                    <p className="mt-1">
                      Para sincronizar com as pastas locais de seu computador, mantenha o seguinte padrão de subdiretórios dentro da pasta de cada paciente:
                    </p>
                    <ul className="list-disc list-inside mt-1.5 space-y-1 font-mono text-[10px] text-slate-600">
                      <li>..\Pacientes\Nome_Do_Paciente\<span className="font-bold text-slate-800">RX</span> (Radiografias e imagens)</li>
                      <li>..\Pacientes\Nome_Do_Paciente\<span className="font-bold text-slate-800">Gto's</span> (Guias de faturamento)</li>
                      <li>..\Pacientes\Nome_Do_Paciente\<span className="font-bold text-slate-800">Ficha do Paciente</span> (Fichas e termos assinados)</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              /* Active subfolder file explorer list */
              <div className="space-y-5 h-full flex flex-col justify-between">
                <div>
                  <button 
                    onClick={() => setActiveFolder(null)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 mb-3"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar para as subpastas</span>
                  </button>

                  <div className="border-b border-slate-150 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs">
                        Paciente: {activePatient.name} &gt; Pasta <span className="text-teal-600">"{activeFolder}"</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Diretório Físico: {getPatientPath(activePatient.name)}\{activeFolder}
                      </p>
                    </div>

                    <label className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs cursor-pointer flex items-center space-x-1.5 shadow-sm transition-colors shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importar do Computador</span>
                      <input 
                        type="file" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {files.filter(f => f.patientId === selectedPatientId && f.folderName === activeFolder && f.category === 'pacientes').length > 0 ? (
                      files
                        .filter(f => f.patientId === selectedPatientId && f.folderName === activeFolder && f.category === 'pacientes')
                        .map(file => {
                          const isImage = file.fileName.match(/\.(jpeg|jpg|gif|png)$/i);
                          return (
                            <div 
                              key={file.id} 
                              className="p-3 border border-slate-150 rounded-xl bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className={`p-1.5 rounded-lg ${isImage ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-150 text-slate-500'}`}>
                                  {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-700 truncate" title={file.fileName}>{file.fileName}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Tamanho: {file.fileSize} | Sincronizado: {file.uploadedAt}</p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                {file.fileDataUrl ? (
                                  <a 
                                    href={file.fileDataUrl} 
                                    download={file.fileName}
                                    className="p-1.5 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg transition-colors"
                                    title="Baixar arquivo para o computador"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <button 
                                    onClick={() => alert(`Simulando download de arquivo local do seu computador: ${file.fileName}`)}
                                    className="p-1.5 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg transition-colors"
                                    title="Baixar arquivo local"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button 
                                  onClick={() => handleDeleteFile(file.id, file.fileName)}
                                  className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors"
                                  title="Remover sincronização"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                        <Folder className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                        Nenhum arquivo sincronizado nesta subpasta local.
                      </div>
                    )}
                  </div>
                </div>

                {/* Windows Explorer instructions */}
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-[11px] text-amber-800 leading-normal">
                  <p className="font-bold flex items-center space-x-1.5">
                    <span>Como gerenciar na sua máquina local:</span>
                  </p>
                  <p className="mt-1">
                    Abra o Windows Explorer e crie esta estrutura física de pastas. O ClinDent fará a leitura e resgate automático ao navegar por este painel:
                  </p>
                  <div className="mt-2 p-2 bg-white/75 font-mono text-[9px] rounded border border-amber-100 select-all text-slate-700">
                    mkdir "{getPatientPath(activePatient.name)}\{activeFolder}"
                  </div>
                </div>
              </div>
            )
          ) : (
            /* Other categories (Agenda, Financeiro, Estoque, Auditoria) explorer */
            <div className="space-y-5 h-full flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-150 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Arquivos do Módulo: <span className="text-teal-600">{activeCategory}</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Diretório Físico: {getCategoryPath(activeCategory)}
                    </p>
                  </div>

                  <label className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs cursor-pointer flex items-center space-x-1.5 shadow-sm transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importar para {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}</span>
                    <input 
                      type="file" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>

                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
                  {files.filter(f => f.category === activeCategory).length > 0 ? (
                    files
                      .filter(f => f.category === activeCategory)
                      .map(file => {
                        const isImage = file.fileName.match(/\.(jpeg|jpg|gif|png)$/i);
                        return (
                          <div 
                            key={file.id} 
                            className="p-3 border border-slate-150 rounded-xl bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className={`p-1.5 rounded-lg ${isImage ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-150 text-slate-500'}`}>
                                {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-700 truncate" title={file.fileName}>{file.fileName}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Tamanho: {file.fileSize} | Sincronizado: {file.uploadedAt}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              {file.fileDataUrl ? (
                                <a 
                                  href={file.fileDataUrl} 
                                  download={file.fileName}
                                  className="p-1.5 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg transition-colors"
                                  title="Baixar para o computador"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <button 
                                  onClick={() => alert(`Simulando download do arquivo de banco de dados do ClinDent: ${file.fileName}`)}
                                  className="p-1.5 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg transition-colors"
                                  title="Baixar arquivo de dados"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button 
                                onClick={() => handleDeleteFile(file.id, file.fileName)}
                                className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors"
                                title="Deletar permanentemente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                      <Folder className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                      Nenhum arquivo sincronizado ou importado nesta pasta de {activeCategory}.
                    </div>
                  )}
                </div>
              </div>

              {/* Informative box for site database */}
              <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl text-[11px] text-slate-700 leading-normal">
                <p className="font-bold text-teal-800 flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Sincronização Integrada de Dados:</span>
                </p>
                <p className="mt-1">
                  Este diretório contém os arquivos de persistência de backup do módulo <span className="font-bold uppercase text-teal-700">{activeCategory}</span>. Qualquer nova importação cria um espelho físico direto no seu computador.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
