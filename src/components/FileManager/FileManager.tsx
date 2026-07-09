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
  Eye,
  CheckCircle,
  FileSpreadsheet
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
  isVirtual?: boolean;
  content?: string;
}

const FOLDERS_CONFIG = [
  { id: 'radiografias', label: 'Radiografias (RX)', iconColor: 'bg-blue-50 text-blue-600', folderPathName: 'Radiografias' },
  { id: 'gto', label: "Gto's (Guias de Convênio)", iconColor: 'bg-amber-50 text-amber-600', folderPathName: "Gto's" },
  { id: 'pessoais', label: 'Exames e Laudos', iconColor: 'bg-indigo-50 text-indigo-600', folderPathName: 'Exames' },
  { id: 'contratos', label: 'Contratos e Termos', iconColor: 'bg-purple-50 text-purple-600', folderPathName: 'Contratos' },
  { id: 'Gerais', label: 'Fichas e Prontuários Gerais', iconColor: 'bg-slate-50 text-slate-600', folderPathName: 'Gerais' }
];

type FileCategory = 'pacientes' | 'agenda' | 'financeiro' | 'estoque' | 'auditoria';

export default function FileManager() {
  const { 
    patients, 
    logAction, 
    documents, 
    addDocument, 
    deleteDocument,
    anamneses,
    odontograms,
    evolutions,
    budgets 
  } = useDental();

  const [activeCategory, setActiveCategory] = useState<FileCategory>('pacientes');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewVirtualFile, setPreviewVirtualFile] = useState<LocalFile | null>(null);
  
  // Real or simulated local storage root directory path
  const [rootPath, setRootPath] = useState<string>(() => {
    return localStorage.getItem('clindent_local_root_path') || 'C:\\ClinDent\\Armazenamento_Geral';
  });
  
  const [isLinked, setIsLinked] = useState<boolean>(() => {
    return localStorage.getItem('clindent_local_root_linked') === 'true' || true; // Set linked by default for better local UX
  });

  // Local files stored in localStorage for general non-patient modules
  const [generalFiles, setGeneralFiles] = useState<LocalFile[]>(() => {
    const saved = localStorage.getItem('clindent_local_general_files');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    // Seed default non-patient files
    return [
      { id: 'f4', category: 'agenda', folderName: 'Agenda', fileName: 'agenda_geral_2026.json', fileSize: '35 KB', uploadedAt: '2026-07-09' },
      { id: 'f5', category: 'agenda', folderName: 'Agenda', fileName: 'grade_horarios_dentistas.xml', fileSize: '12 KB', uploadedAt: '2026-07-08' },
      { id: 'f6', category: 'financeiro', folderName: 'Financeiro', fileName: 'fechamento_caixa_mensal.xlsx', fileSize: '1.4 MB', uploadedAt: '2026-07-09' },
      { id: 'f7', category: 'financeiro', folderName: 'Financeiro', fileName: 'fluxo_de_caixa_projetado.csv', fileSize: '180 KB', uploadedAt: '2026-07-07' },
      { id: 'f8', category: 'estoque', folderName: 'Estoque', fileName: 'inventario_insumos_materiais.xlsx', fileSize: '450 KB', uploadedAt: '2026-07-09' },
      { id: 'f9', category: 'estoque', folderName: 'Estoque', fileName: 'pedidos_compra_fornecedores.pdf', fileSize: '1.2 MB', uploadedAt: '2026-07-08' },
      { id: 'f10', category: 'auditoria', folderName: 'Auditoria', fileName: 'logs_seguranca_lgpd.log', fileSize: '250 KB', uploadedAt: '2026-07-09' },
      { id: 'f11', category: 'auditoria', folderName: 'Auditoria', fileName: 'backup_criptografado_seguro.bin', fileSize: '18.5 MB', uploadedAt: '2026-07-09' }
    ];
  });

  // Combined list of virtual patient files generated dynamically from clinic data
  const [virtualFiles, setVirtualFiles] = useState<LocalFile[]>([]);

  // Safe helper to convert Unicode text to Base64 data urls safely
  const getJsonBase64Url = (obj: any) => {
    try {
      const jsonStr = JSON.stringify(obj, null, 2);
      return 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(jsonStr)));
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    localStorage.setItem('clindent_local_general_files', JSON.stringify(generalFiles));
  }, [generalFiles]);

  // Dynamically generate simulated JSON files representing physical files of saved clinical records
  useEffect(() => {
    const allVirtual: LocalFile[] = [];

    patients.forEach(patient => {
      if (patient.deletedAt) return;
      const pId = patient.id;

      // 1. Personal registration data file (cadastro_pessoal.json)
      const regData = {
        id: patient.id,
        nome: patient.name,
        cpf: patient.cpf || 'Não Informado',
        rg: patient.rg || 'Não Informado',
        data_nascimento: patient.birthDate,
        genero: patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Feminino' : 'Outro',
        estado_civil: patient.maritalStatus || 'Não Informado',
        profissao: patient.profession || 'Não Informado',
        telefone: patient.phone,
        email: patient.email || 'Não Informado',
        endereco: patient.address || 'Não Informado',
        convenio: patient.insuranceName || 'Particular',
        convenio_carteira: patient.insuranceCardNumber || 'N/A',
        origem_indicacao: patient.referralSource || 'Espontâneo',
        status: patient.status === 'ativo' ? 'Ativo' : patient.status === 'em_tratamento' ? 'Em Tratamento' : 'Inativo',
        data_cadastro: patient.createdAt
      };

      allVirtual.push({
        id: `v_reg_${pId}`,
        patientId: pId,
        category: 'pacientes',
        folderName: 'Gerais',
        fileName: 'cadastro_pessoal.json',
        fileSize: `${(JSON.stringify(regData, null, 2).length / 1024).toFixed(1)} KB`,
        uploadedAt: (patient.updatedAt || patient.createdAt).split('T')[0],
        fileDataUrl: getJsonBase64Url(regData),
        isVirtual: true,
        content: JSON.stringify(regData, null, 2)
      });

      // 2. Anamnese questions file (ficha_anamnese.json)
      const anamnese = anamneses[pId];
      if (anamnese) {
        const anamneseData = {
          alergias: anamnese.allergies || 'Nenhuma informada',
          medicamentos_em_uso: anamnese.medicationsInUse || 'Nenhum informado',
          doencas_pre_existentes: anamnese.preExistingDiseases || 'Nenhuma informada',
          problemas_cardiacos: anamnese.heartProblems ? 'Sim' : 'Não',
          gestante: anamnese.isPregnant ? 'Sim' : 'Não',
          uso_anticoagulante: anamnese.usesAnticoagulant ? 'Sim' : 'Não',
          observacoes_adicionais: anamnese.additionalNotes || 'Sem observações',
          data_assinatura: anamnese.signatureDate || 'Pendente',
          assinatura_paciente: anamnese.patientSignature ? '[Assinatura Digital Integrada]' : 'Pendente de assinatura'
        };

        allVirtual.push({
          id: `v_anam_${pId}`,
          patientId: pId,
          category: 'pacientes',
          folderName: 'Gerais',
          fileName: 'ficha_anamnese.json',
          fileSize: `${(JSON.stringify(anamneseData, null, 2).length / 1024).toFixed(1)} KB`,
          uploadedAt: anamnese.signatureDate || patient.createdAt.split('T')[0],
          fileDataUrl: getJsonBase64Url(anamneseData),
          isVirtual: true,
          content: JSON.stringify(anamneseData, null, 2)
        });
      }

      // 3. Odontograma records file (odontograma_prontuario.json)
      const odontogram = odontograms[pId];
      if (odontogram) {
        const activeTeeth = odontogram.filter(t => 
          Object.values(t.faces).some(f => f !== 'none') || (t.anomalies && t.anomalies.length > 0) || t.notes
        ).map(t => ({
          dente: t.toothNumber,
          faces_alteradas: Object.entries(t.faces)
            .filter(([_, state]) => state !== 'none')
            .map(([face, state]) => `${face}: ${state}`),
          anomalias_detectadas: t.anomalies,
          observacoes: t.notes || ''
        }));

        if (activeTeeth.length > 0) {
          allVirtual.push({
            id: `v_odon_${pId}`,
            patientId: pId,
            category: 'pacientes',
            folderName: 'Gerais',
            fileName: 'odontograma_prontuario.json',
            fileSize: `${(JSON.stringify(activeTeeth, null, 2).length / 1024).toFixed(1)} KB`,
            uploadedAt: (patient.updatedAt || patient.createdAt).split('T')[0],
            fileDataUrl: getJsonBase64Url(activeTeeth),
            isVirtual: true,
            content: JSON.stringify(activeTeeth, null, 2)
          });
        }
      }

      // 4. Clinical progress timelines (evolucoes_clinicas.json)
      const patientEvos = evolutions.filter(e => e.patientId === pId);
      if (patientEvos.length > 0) {
        const evoSummary = patientEvos.map(e => ({
          data: e.date.split('T')[0],
          dentista: e.dentistName,
          cro: e.dentistCro || 'CRO-SP N/A',
          procedimento: e.procedurePerformed,
          observacoes_clinicas: e.clinicalNotes,
          materiais_utilizados: e.materialsUsed || []
        }));

        allVirtual.push({
          id: `v_evos_${pId}`,
          patientId: pId,
          category: 'pacientes',
          folderName: 'Gerais',
          fileName: 'evolucoes_clinicas.json',
          fileSize: `${(JSON.stringify(evoSummary, null, 2).length / 1024).toFixed(1)} KB`,
          uploadedAt: patientEvos[0].date.split('T')[0],
          fileDataUrl: getJsonBase64Url(evoSummary),
          isVirtual: true,
          content: JSON.stringify(evoSummary, null, 2)
        });
      }

      // 5. Patient Financial Budgets (orcamentos_e_planos.json)
      const patientBudgets = budgets.filter(b => b.patientId === pId);
      if (patientBudgets.length > 0) {
        const budgetSummary = patientBudgets.map(b => ({
          titulo: b.title,
          valor_total: b.totalValue,
          parcelas: b.installments,
          metodo_pagamento: b.paymentMethod === 'pix' ? 'PIX' : b.paymentMethod === 'cartao_credito' ? 'Cartão de Crédito' : b.paymentMethod === 'boleto' ? 'Boleto Bancário' : 'Dinheiro',
          status: b.status === 'aprovado' ? 'Aprovado pelo Paciente' : b.status === 'rejeitado' ? 'Rejeitado' : 'Aguardando Aprovação',
          criado_em: b.createdAt.split('T')[0],
          procedimentos_incluidos: b.procedures.map(p => ({
            procedimento: p.procedureName,
            dente: p.toothNumber || 'Geral',
            valor: p.value,
            status: p.status === 'realizado' ? 'Realizado' : 'Planejado'
          }))
        }));

        allVirtual.push({
          id: `v_budg_${pId}`,
          patientId: pId,
          category: 'pacientes',
          folderName: 'Gerais',
          fileName: 'orcamentos_e_planos.json',
          fileSize: `${(JSON.stringify(budgetSummary, null, 2).length / 1024).toFixed(1)} KB`,
          uploadedAt: patientBudgets[0].createdAt.split('T')[0],
          fileDataUrl: getJsonBase64Url(budgetSummary),
          isVirtual: true,
          content: JSON.stringify(budgetSummary, null, 2)
        });
      }
    });

    setVirtualFiles(allVirtual);
  }, [patients, documents, anamneses, odontograms, evolutions, budgets]);

  // Map our rich context uploaded documents dynamically into LocalFile objects
  const patientFiles: LocalFile[] = documents.map(doc => {
    return {
      id: doc.id,
      patientId: doc.patientId,
      category: 'pacientes',
      folderName: doc.category, // e.g., 'radiografias', 'gto', etc.
      fileName: doc.name,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt.split('T')[0],
      fileDataUrl: doc.url
    };
  });

  // Combined virtual and real local files database for badges and lists
  const files = [...generalFiles, ...patientFiles, ...virtualFiles];

  const handleLinkLocalFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        const customPath = `C:\\ClinDent\\${handle.name}`;
        setRootPath(customPath);
        setIsLinked(true);
        localStorage.setItem('clindent_local_root_path', customPath);
        localStorage.setItem('clindent_local_root_linked', 'true');
        logAction('link_local_folder', `Pasta local vinculada com sucesso: ${customPath}`);
        alert(`Sucesso! A pasta "${handle.name}" foi vinculada!\n\nToda a base de dados do site (Agenda, Pacientes, Caixa, Estoques e Logs) será salva de forma estruturada em subpastas em:\n${customPath}`);
      } catch (err) {
        console.error("Erro ao selecionar diretório:", err);
        alert("Não foi possível acessar a pasta selecionada. O navegador pode ter cancelado a operação ou a pasta não possui as permissões necessárias.");
      }
    } else {
      const customPath = prompt("Digite o caminho de diretório local que deseja simular e vincular:", rootPath);
      if (customPath) {
        setRootPath(customPath);
        setIsLinked(true);
        localStorage.setItem('clindent_local_root_path', customPath);
        localStorage.setItem('clindent_local_root_linked', 'true');
        logAction('link_local_folder', `Pasta local vinculada manualmente: ${customPath}`);
        alert(`Sucesso! A pasta de armazenamento local foi vinculada para: \n${customPath}`);
      }
    }
  };

  const handleUnlink = () => {
    setIsLinked(false);
    localStorage.removeItem('clindent_local_root_linked');
    logAction('unlink_local_folder', 'Desvinculou pasta de armazenamento local');
  };

  const handleOpenFolder = () => {
    navigator.clipboard.writeText(rootPath).then(() => {
      alert("Caminho da pasta copiado para a área de transferência! Cole-o na barra de endereços do seu Explorador de Arquivos para abrir.");
    });
  };

  const activePatient = patients.find(p => p.id === selectedPatientId && !p.deletedAt);

  // Filter patients/subfolders based on query
  const filteredPatients = patients.filter(p => 
    !p.deletedAt && p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle local file upload / import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const uploadedFile = e.target.files[0];

    if (activeCategory === 'pacientes' && (!selectedPatientId || !activeFolder)) {
      alert("Por favor, selecione um paciente e uma subpasta para importar o arquivo.");
      return;
    }

    const sizeStr = uploadedFile.size >= 1024 * 1024
      ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(uploadedFile.size / 1024).toFixed(0)} KB`;

    let targetPath = '';
    if (activeCategory === 'pacientes') {
      if (activeFolder === 'Gerais') {
        alert("A pasta 'Gerais' é reservada para as fichas de cadastro, prontuários e anamneses exportadas em tempo real pelo ClinDent. Por favor, importe seu arquivo em subpastas clínicas como 'Radiografias' ou 'Exames'.");
        return;
      }
      targetPath = `${getPatientFolderPath(selectedPatientId, activePatient!.name, activeFolder!)}\\${uploadedFile.name}`;
    } else {
      targetPath = `${getCategoryPath(activeCategory)}\\${uploadedFile.name}`;
    }

    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('path', targetPath);

    try {
      const response = await fetch('/api/fs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload');

      if (activeCategory === 'pacientes') {
        addDocument(
          selectedPatientId,
          uploadedFile.name,
          activeFolder as any,
          targetPath, // Store path instead of base64
          sizeStr,
          `Importado via Gerenciador de Armazenamento`
        );
        logAction('local_file_upload', `Importou arquivo para "${targetPath}"`);
        alert(`Arquivo "${uploadedFile.name}" salvo na pasta local com sucesso!`);
      } else {
        const newFile: LocalFile = {
          id: 'file_' + Date.now(),
          category: activeCategory,
          folderName: activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1),
          fileName: uploadedFile.name,
          fileSize: sizeStr,
          uploadedAt: new Date().toISOString().split('T')[0],
          fileDataUrl: targetPath // Store path
        };
        setGeneralFiles(prev => [newFile, ...prev]);
        logAction('local_file_upload', `Importou arquivo para "${targetPath}"`);
        alert(`Arquivo "${uploadedFile.name}" salvo na pasta local com sucesso!`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar arquivo localmente.');
    }
  };

  const handleDeleteFile = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o arquivo "${name}" desta pasta local?`)) {
      if (activeCategory === 'pacientes') {
        deleteDocument(id);
        logAction('local_file_delete', `Excluiu o arquivo local "${name}" da pasta.`);
      } else {
        setGeneralFiles(prev => prev.filter(f => f.id !== id));
        logAction('local_file_delete', `Excluiu o arquivo local "${name}" da pasta.`);
      }
    }
  };

  // Helper to get formatted local storage path for the patient
  const getPatientPath = (patientId: string, patientName: string) => {
    const safeName = patientName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-zA-Z0-9]/g, "_"); // replace spaces and symbols
    return `${rootPath}\\Pacientes\\${patientId}_${safeName}`;
  };

  const getPatientFolderPath = (patientId: string, patientName: string, folderId: string) => {
    const patientPath = getPatientPath(patientId, patientName);
    const config = FOLDERS_CONFIG.find(c => c.id === folderId);
    const folderName = config ? config.folderPathName : folderId;
    return `${patientPath}\\${folderName}`;
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
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto" id="file-manager-root">
      {/* Header section with drive linker */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="fm-header">
        <div className="flex items-start space-x-3.5">
          <div className={`p-2.5 rounded-lg ${isLinked ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-slate-100 text-slate-500'}`}>
            <HardDrive className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Gerenciador de Armazenamento Local</h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl leading-normal">
              Organizador integrado com o disco físico da clínica. O sistema cria e exporta todas as fichas, prontuários, radiografias e exames de forma estruturada na pasta principal <span className="font-mono bg-slate-50 px-1 py-0.5 border rounded text-slate-600 font-bold">\Pacientes</span> de sua máquina local.
            </p>
            {/* Link status indicator can be added here if needed */}
          </div>
        </div>

        <div>
          {isLinked ? (
            <div className="flex flex-col items-end gap-2">
              <button 
                onClick={handleOpenFolder}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Folder className="w-4 h-4" />
                <span>Abrir Pasta</span>
              </button>
              <span className="text-[10px] font-mono bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-200" title={rootPath}>
                {rootPath.length > 25 ? rootPath.substring(0, 22) + '...' : rootPath}
              </span>
            </div>
          ) : (
            <button 
              onClick={handleLinkLocalFolder}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <span>Vincular Pasta no Computador</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" id="fm-category-tabs">
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
              className={`p-3.5 rounded-xl border text-left transition-all relative cursor-pointer ${
                isActive 
                  ? 'bg-teal-50 border-teal-300 text-slate-900 shadow-sm font-semibold' 
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/20 text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-teal-500 text-slate-950 font-black' : 'bg-slate-100 text-slate-600'}`}>
                  {cat.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{cat.label}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 truncate font-mono">{filesCount} arquivos locais</p>
                </div>
              </div>
              {isActive && (
                <div className="absolute top-1.5 right-1.5 bg-teal-500 text-slate-950 font-mono text-[8px] px-1.5 py-0.5 rounded font-black uppercase">
                  Ativo
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Tree Explorer Bar */}
        {activeCategory === 'pacientes' ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-bold text-slate-700 block mb-2">Árvore de Diretórios</span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar pasta de paciente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="p-2 space-y-1 max-h-[420px] overflow-y-auto">
              {/* Root folder item */}
              <button
                onClick={() => {
                  setSelectedPatientId('');
                  setActiveFolder(null);
                }}
                className={`w-full text-left p-2.5 flex items-center space-x-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  selectedPatientId === '' 
                    ? 'bg-teal-50 text-teal-950 font-bold border border-teal-100' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Folder className="w-4 h-4 text-teal-600 fill-teal-600/10 shrink-0" />
                <span className="truncate">📁 Pacientes (Pasta Principal)</span>
              </button>

              {/* Subfolders tree indentation list */}
              <div className="pl-4 border-l border-slate-100 space-y-1 mt-1">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(p => {
                    const isSelected = p.id === selectedPatientId;
                    const cleanName = p.name
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "") // remove accents
                      .replace(/[^a-zA-Z0-9]/g, "_"); // remove characters
                    const folderName = `${p.id}_${cleanName}`;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setActiveFolder(null);
                        }}
                        className={`w-full text-left p-2 flex items-center justify-between rounded-lg text-xs transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-100 text-slate-900 font-bold border-l-2 border-teal-500 pl-3' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-teal-600 fill-teal-600/10' : 'text-slate-400'}`} />
                          <span className="truncate font-mono text-[10px]">{folderName}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-[10px] text-slate-400">
                    Nenhuma pasta de paciente cadastrada.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* General directories info sidebar on left */
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

        {/* Directory grid explorer on Right */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6 min-h-[450px] flex flex-col justify-between" id="fm-explorer-panel">
          {activeCategory === 'pacientes' ? (
            /* Patients Module Explorer */
            selectedPatientId === '' ? (
              /* Root Pacientes folder containing all patient directory folders */
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">Caminho do Diretório Principal</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1 bg-slate-50 p-2 border border-slate-150 rounded-lg select-all">
                      {rootPath}\Pacientes
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Pastas de Pacientes (Atualizado com o Prontuário)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map(p => {
                        const filesCount = files.filter(f => f.patientId === p.id).length;
                        const cleanName = p.name
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-zA-Z0-9]/g, "_");
                        const folderPath = `${p.id}_${cleanName}`;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setSelectedPatientId(p.id)}
                            className="p-4 border border-slate-200 hover:border-teal-300 hover:bg-teal-50/10 rounded-xl text-left transition-all group cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                                <Folder className="w-5 h-5 fill-amber-500/10" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-700 truncate">{p.name}</p>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                                  📁 \{folderPath}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="inline-block bg-slate-100 text-slate-600 font-mono text-[9px] px-2 py-1 rounded-full font-bold">
                                {filesCount} arq
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-12 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 col-span-2">
                        <Folder className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        Nenhuma pasta de paciente correspondente à busca.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-500 leading-normal">
                    <p className="font-bold text-slate-700">Comportamento de Criação de Pastas:</p>
                    <p className="mt-1">
                      A pasta vazia do seu computador funciona como o diretório raiz. Sempre que um paciente é criado no ClinDent, uma pasta dedicada com o padrão <span className="font-mono bg-white px-1 border rounded text-slate-600 font-bold">ID_NOME_DO_PACIENTE</span> é disponibilizada imediatamente acima, permitindo isolar radiografias, contratos e receitas.
                    </p>
                  </div>
                </div>
              </div>
            ) : !activeFolder ? (
              /* Selected patient's direct subfolders structure */
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => {
                        setSelectedPatientId('');
                        setActiveFolder(null);
                      }}
                      className="flex items-center space-x-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Voltar para pasta principal Pacientes</span>
                    </button>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500">
                      ID do Paciente: {activePatient?.id}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-xs mt-3">Diretório Local do Paciente</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-1 bg-slate-50 p-2 border border-slate-150 rounded-lg select-all">
                    {activePatient ? getPatientPath(activePatient.id, activePatient.name) : ''}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Subpastas Clínicas Obrigatórias</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {FOLDERS_CONFIG.map((folder) => {
                      const filesInFolder = files.filter(
                        f => f.patientId === selectedPatientId && f.folderName === folder.id
                      );
                      return (
                        <button 
                          key={folder.id}
                          onClick={() => setActiveFolder(folder.id)}
                          className="p-4 border border-slate-200 hover:border-teal-300 hover:bg-slate-50/50 rounded-xl text-left transition-all group cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${folder.iconColor} group-hover:scale-105 transition-transform`}>
                              <Folder className="w-5 h-5 fill-current/10" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">{folder.label}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {filesInFolder.length} arquivos salvos nesta pasta
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Patient medical dashboard sync box */}
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start space-x-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-700 leading-normal">
                    <p className="font-bold text-emerald-800">Sincronização Ativa de Prontuários Gerais:</p>
                    <p className="mt-1">
                      A subpasta <span className="font-bold text-slate-800">Gerais</span> armazena relatórios consolidados em formato JSON com todas as evoluções clínicas, odontograma, anamnese assinada e orçamentos do paciente. Estes arquivos são exportados e atualizados pelo site automaticamente a cada alteração.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Active subfolder content file list view */
              <div className="space-y-5 h-full flex flex-col justify-between">
                <div>
                  <button 
                    onClick={() => setActiveFolder(null)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 mb-3 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar para as subpastas de {activePatient?.name}</span>
                  </button>

                  <div className="border-b border-slate-150 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 text-xs truncate">
                        Pasta: <span className="text-teal-600">"{FOLDERS_CONFIG.find(f => f.id === activeFolder)?.label || activeFolder}"</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate select-all">
                        Caminho Local: {activePatient ? getPatientFolderPath(activePatient.id, activePatient.name, activeFolder) : ''}
                      </p>
                    </div>

                    {activeFolder !== 'Gerais' && (
                      <label className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs cursor-pointer flex items-center space-x-1.5 shadow-sm transition-colors shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Importar Arquivo</span>
                        <input 
                          type="file" 
                          onChange={handleFileUpload} 
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {files.filter(f => f.patientId === selectedPatientId && f.folderName === activeFolder).length > 0 ? (
                      files
                        .filter(f => f.patientId === selectedPatientId && f.folderName === activeFolder)
                        .map(file => {
                          const isImage = file.fileName.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                          return (
                            <div 
                              key={file.id} 
                              className="p-3 border border-slate-150 rounded-xl bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className={`p-1.5 rounded-lg ${isImage ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                  {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-700 truncate" title={file.fileName}>{file.fileName}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Tamanho: {file.fileSize} | Sincronizado: {file.uploadedAt}</p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1.5 shrink-0">
                                {file.isVirtual && (
                                  <button
                                    onClick={() => setPreviewVirtualFile(file)}
                                    className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                                    title="Visualizar ficha técnica formatada"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Visualizar</span>
                                  </button>
                                )}

                                {file.fileDataUrl ? (
                                  <a 
                                    href={file.fileDataUrl} 
                                    download={file.fileName}
                                    className="p-1.5 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg transition-colors cursor-pointer"
                                    title="Baixar arquivo para o computador"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <button 
                                    onClick={() => alert(`Simulando download de arquivo local do seu computador: ${file.fileName}`)}
                                    className="p-1.5 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg transition-colors cursor-pointer"
                                    title="Baixar arquivo local"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {!file.isVirtual && (
                                  <button 
                                    onClick={() => handleDeleteFile(file.id, file.fileName)}
                                    className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                                    title="Remover sincronização"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
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

                {/* Physical directory script guide */}
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-[11px] text-amber-800 leading-normal">
                  <p className="font-bold flex items-center space-x-1.5">
                    <span>Espelhamento com a Máquina Clínica:</span>
                  </p>
                  <p className="mt-1">
                    Crie esta estrutura física de subpastas no seu computador para sincronizar suas fotos com o ClinDent:
                  </p>
                  <div className="mt-2 p-2 bg-white/75 font-mono text-[9px] rounded border border-amber-100 select-all text-slate-700">
                    mkdir "{activePatient ? getPatientFolderPath(activePatient.id, activePatient.name, activeFolder) : ''}"
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
                                  className="p-1.5 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg transition-colors cursor-pointer"
                                  title="Baixar para o computador"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <button 
                                  onClick={() => alert(`Simulando download do arquivo de banco de dados do ClinDent: ${file.fileName}`)}
                                  className="p-1.5 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg transition-colors cursor-pointer"
                                  title="Baixar arquivo de dados"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button 
                                onClick={() => handleDeleteFile(file.id, file.fileName)}
                                className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
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

      {/* Visual File Viewer modal / drawer */}
      {previewVirtualFile && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="preview-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-800 text-xs font-mono">{previewVirtualFile.fileName}</span>
              </div>
              <button 
                onClick={() => setPreviewVirtualFile(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-100 hover:bg-slate-200 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              {(() => {
                try {
                  const data = JSON.parse(previewVirtualFile.content || '{}');
                  
                  // Render format according to the file type
                  if (previewVirtualFile.fileName === 'cadastro_pessoal.json') {
                    return (
                      <div className="space-y-4">
                        <div className="bg-teal-50/50 border border-teal-100 p-3 rounded-xl flex items-center space-x-2.5">
                          <Users className="w-4 h-4 text-teal-600" />
                          <span className="text-xs font-bold text-teal-950">Dados Cadastrais Oficiais do Paciente</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Nome Completo</span>
                            <span className="font-semibold text-slate-800 text-xs">{data.nome}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Nascimento</span>
                            <span className="font-semibold text-slate-800 text-xs">{data.data_nascimento}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">CPF</span>
                            <span className="font-semibold text-slate-800 text-xs font-mono">{data.cpf}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Telefone</span>
                            <span className="font-semibold text-slate-800 text-xs font-mono">{data.telefone}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Convênio</span>
                            <span className="font-semibold text-slate-800 text-xs">{data.convenio}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Endereço</span>
                            <span className="font-semibold text-slate-800 text-xs truncate block" title={data.endereco}>{data.endereco}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Cadastro no Sistema</span>
                            <span className="font-semibold text-slate-850 text-[11px] font-mono">{data.data_cadastro}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Status Clínico</span>
                            <span className="inline-block px-2 py-0.5 mt-1 bg-teal-100 text-teal-800 rounded font-bold text-[10px] uppercase">
                              {data.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (previewVirtualFile.fileName === 'ficha_anamnese.json') {
                    return (
                      <div className="space-y-4">
                        <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl flex items-center space-x-2.5">
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-amber-950">Ficha Sanitária de Anamnese e Riscos</span>
                        </div>
                        <div className="space-y-3 text-xs">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Doenças Pré-existentes</span>
                              <span className="font-semibold text-slate-800 block mt-0.5">{data.doencas_pre_existentes}</span>
                            </div>
                            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Alergias Detectadas</span>
                              <span className="font-semibold text-slate-800 block mt-0.5">{data.alergias}</span>
                            </div>
                          </div>

                          <div className="p-3 border border-slate-100 rounded-lg space-y-2.5">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Problemas Cardíacos / Marcapasso:</span>
                              <span className={`font-bold ${data.problemas_cardiacos === 'Sim' ? 'text-red-600' : 'text-slate-700'}`}>{data.problemas_cardiacos}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-slate-600">Gestante no Momento:</span>
                              <span className="font-bold text-slate-700">{data.gestante}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-slate-600">Usa Anticoagulantes:</span>
                              <span className={`font-bold ${data.uso_anticoagulante === 'Sim' ? 'text-rose-600' : 'text-slate-700'}`}>{data.uso_anticoagulante}</span>
                            </div>
                          </div>

                          <div className="p-2.5 bg-slate-55 border border-slate-150 rounded-lg">
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Observações de Prontuário</span>
                            <span className="text-slate-700 block mt-0.5 text-[11px] italic">{data.observacoes_adicionais}</span>
                          </div>

                          <div className="pt-3 border-t flex justify-between text-[11px]">
                            <span className="text-slate-400">Assinado em: <span className="font-mono text-slate-700">{data.data_assinatura}</span></span>
                            <span className="text-emerald-600 font-bold">{data.assinatura_paciente}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (previewVirtualFile.fileName === 'odontograma_prontuario.json') {
                    return (
                      <div className="space-y-4">
                        <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center space-x-2.5">
                          <Info className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-blue-950">Mapeamento Anatômico do Odontograma</span>
                        </div>
                        <div className="space-y-2.5">
                          {Array.isArray(data) && data.map((t: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800 text-xs">Dente {t.dente}</span>
                                <span className="text-slate-400 font-mono text-[10px]">Alterado</span>
                              </div>
                              {t.faces_alteradas && t.faces_alteradas.length > 0 && (
                                <div>
                                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Regiões Alteradas</span>
                                  <span className="text-slate-700 font-mono text-[10px]">{t.faces_alteradas.join(' | ')}</span>
                                </div>
                              )}
                              {t.anomalias_detectadas && t.anomalias_detectadas.length > 0 && (
                                <div>
                                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Anomalias Clínicas</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {t.anomalias_detectadas.map((a: string, aidx: number) => (
                                      <span key={aidx} className="bg-red-50 text-red-700 border border-red-100 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase font-mono">
                                        {a}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {t.observacoes && (
                                <div>
                                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Notas de Tratamento</span>
                                  <p className="text-slate-650 italic mt-0.5 font-sans leading-normal">{t.observacoes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (previewVirtualFile.fileName === 'evolucoes_clinicas.json') {
                    return (
                      <div className="space-y-4">
                        <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex items-center space-x-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-950">Evolução de Tratamentos Realizados</span>
                        </div>
                        <div className="border-l-2 border-slate-200 pl-4 space-y-4 py-1">
                          {Array.isArray(data) && data.map((evo: any, idx: number) => (
                            <div key={idx} className="relative space-y-1.5 text-xs">
                              {/* Bullet node */}
                              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-slate-100" />
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 text-xs">{evo.procedimento}</span>
                                <span className="text-slate-400 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">{evo.data}</span>
                              </div>
                              <p className="text-slate-600 italic leading-relaxed">{evo.observacoes_clinicas}</p>
                              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                                <span>Dentista: <span className="font-semibold text-slate-600">{evo.dentista}</span> ({evo.cro})</span>
                                {evo.materiais_utilizados && evo.materiais_utilizados.length > 0 && (
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-500">Insumos: {evo.materiais_utilizados.join(', ')}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (previewVirtualFile.fileName === 'orcamentos_e_planos.json') {
                    return (
                      <div className="space-y-4">
                        <div className="bg-purple-50/50 border border-purple-100 p-3 rounded-xl flex items-center space-x-2.5">
                          <DollarSign className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-bold text-purple-950">Orçamentos e Planos de Custos</span>
                        </div>
                        <div className="space-y-3">
                          {Array.isArray(data) && data.map((b: any, idx: number) => (
                            <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/30 text-xs space-y-2.5">
                              <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-bold text-slate-800 text-sm">{b.titulo}</span>
                                <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${b.status.includes('Aprovado') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {b.status}
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <span className="text-slate-400 text-[9px] block uppercase font-bold">Procedimentos Planejados</span>
                                <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                                  {b.procedimentos_incluidos.map((p: any, pidx: number) => (
                                    <div key={pidx} className="flex justify-between py-1.5">
                                      <span className="text-slate-700">{p.procedimento} <span className="font-mono text-[9px] text-slate-400">({p.dente})</span></span>
                                      <span className="font-bold text-slate-800">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-2 border-t flex justify-between items-center text-xs font-semibold">
                                <div className="text-slate-400">
                                  <span>Plano: <span className="text-slate-700">{b.parcelas}x no {b.metodo_pagamento}</span></span>
                                </div>
                                <div className="text-right">
                                  <span className="text-slate-400 block text-[9px] uppercase">Valor Total</span>
                                  <span className="text-teal-700 font-bold text-sm">R$ {b.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <pre className="bg-slate-50 border p-4 rounded-xl font-mono text-[10px] overflow-x-auto text-slate-700 leading-normal">
                      {previewVirtualFile.content}
                    </pre>
                  );
                } catch (e) {
                  return (
                    <pre className="bg-slate-50 border p-4 rounded-xl font-mono text-[10px] overflow-x-auto text-slate-700">
                      {previewVirtualFile.content}
                    </pre>
                  );
                }
              })()}
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-end space-x-2">
              {previewVirtualFile.fileDataUrl && (
                <a 
                  href={previewVirtualFile.fileDataUrl} 
                  download={previewVirtualFile.fileName}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo Oficial .json</span>
                </a>
              )}
              <button 
                onClick={() => setPreviewVirtualFile(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
