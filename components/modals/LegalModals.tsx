
import React from 'react';
import { X, ShieldCheck, FileText, Lock, ChevronRight } from 'lucide-react';

interface LegalModalsProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms' | 'data';
}

export const LegalModals: React.FC<LegalModalsProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  const content = {
    terms: {
      title: 'Termos de Uso',
      subtitle: 'Condições Gerais e Responsabilidades',
      icon: <FileText size={32} />,
      sections: [
        {
          title: '1. Termos de Uso e Condições Gerais',
          text: 'Ao instalar, aceder ou utilizar o aplicativo AngoLife, o utilizador declara ter capacidade jurídica plena e aceita, de forma irrevogável e sem reservas, todos os termos aqui descritos. A discordância com qualquer cláusula implica a cessação imediata do direito de uso. Este documento constitui o acordo integral entre o proprietário da plataforma e o utilizador final.'
        },
        {
          title: '2. Natureza da Operação e Isenção (Scraping)',
          text: 'O AngoLife opera como um motor de indexação algorítmica de dados públicos. Agregação de Terceiros: O utilizador reconhece que as vagas de emprego e notícias são obtidas via web scraping de fontes externas. O AngoLife não possui controle editorial, não verifica a idoneidade das empresas anunciantes e não garante a existência real das vagas. Inexistência de Garantia: A plataforma é fornecida "tal como está". Não garantimos que o serviço será ininterrupto ou livre de erros.'
        },
        {
          title: '3. Módulo de Câmbio e Informações Financeiras',
          text: 'Caráter Informativo: Os dados de compra e venda de moedas são meramente referenciais. O AngoLife não é uma instituição financeira, não realiza custódia de valores nem intermedia transações de câmbio. Isenção Financeira: Não nos responsabilizamos por decisões financeiras ou perdas resultantes da flutuação cambial. O utilizador renuncia a qualquer direito de indemnização por erros de cotação.'
        },
        {
          title: '4. Conteúdos Premium e Propriedade Intelectual',
          text: 'Subscrição de Serviços (Gerador de CV): A funcionalidade de criação de currículos é um serviço digital de consumo imediato. Uma vez gerado o documento, o serviço considera-se prestado, não havendo lugar a reembolso. Copyright: Toda a interface, algoritmos de scraper, logótipo e estrutura de dados são propriedade intelectual exclusiva do desenvolvedor.'
        },
        {
          title: '5. Limitação de Responsabilidade',
          text: 'Em nenhuma circunstância o proprietário do AngoLife será responsável por danos incidentais, especiais ou consequentes. O utilizador concorda em indemnizar e isentar o desenvolvedor de qualquer reclamação judicial movida por terceiros devido ao uso indevido da plataforma.'
        },
        {
          title: '6. Proibição de Engenharia Reversa e Plágio',
          text: 'Fica expressamente proibida qualquer tentativa de engenharia reversa, descompilação ou acesso não autorizado ao código-fonte da plataforma. A reprodução, cópia ou plágio da interface, lógica operacional ou algoritmos de raspagem (scrapers) do AngoLife é ilegal e sujeita a severas sanções criminais e cíveis nos termos da legislação de propriedade intelectual angolana e internacional.'
        }
      ]
    },
    privacy: {
      title: 'Política de Privacidade',
      subtitle: 'Proteção e Tratamento de Dados',
      icon: <ShieldCheck size={32} />,
      sections: [
        {
          title: '1. Recolha de Dados e Consentimento',
          text: 'Em conformidade com a Lei n.º 22/11 de Angola, o utilizador autoriza a recolha de Dados Biométricos/Identificativos (Nome, e-mail, contacto), Metadados (Endereço IP, geolocalização) e Dados Curriculares inseridos voluntariamente.'
        },
        {
          title: '2. Finalidade e Tratamento',
          text: 'Os dados são recolhidos para a personalização de alertas de emprego, processamento de funções Premium e melhoria algorítmica. O armazenamento é feito em servidores de nuvem de alta segurança (Supabase), com criptografia de ponta a ponta.'
        },
        {
          title: '3. Segurança e Transferência Internacional',
          text: 'O utilizador aceita que os dados podem ser armazenados em servidores fora de Angola. Embora utilizemos protocolos rigorosos, o AngoLife não pode garantir invulnerabilidade absoluta contra ataques cibernéticos sofisticados.'
        },
        {
          title: '4. Direitos do Titular (Esquecimento)',
          text: 'O utilizador pode solicitar a retificação ou eliminação dos seus dados. O AngoLife reserva-se o direito de manter cópias de arquivo para cumprimento de obrigações legais de forma anonimizada.'
        },
        {
          title: '5. Cookies e Rastreamento',
          text: 'Utilizamos identificadores digitais para mapear o comportamento do utilizador. O uso continuado do aplicativo constitui aceitação implícita destas tecnologias.'
        },
        {
          title: '6. Jurisdição e Foro',
          text: 'Para qualquer litígio emergente deste contrato, as partes elegem o Foro da Comarca de Luanda.'
        }
      ]
    },
    data: {
      title: 'Dados Pessoais',
      subtitle: 'Gerencie suas informações',
      icon: <Lock size={32} />,
      sections: [
        {
          title: 'Como tratamos seus dados?',
          text: 'Os seus dados são protegidos por criptografia de ponta a ponta no Supabase. Coletamos apenas o necessário para o funcionamento das ferramentas de Emprego, CV e Alertas personalizados.'
        },
        {
          title: 'Seus Direitos',
          text: 'Você tem direito ao acesso, retificação e eliminação dos seus dados a qualquer momento. Para exercer este direito, pode solicitar a remoção da sua conta nas definições de perfil ou contactar o suporte.'
        },
        {
          title: 'Lei de Proteção de Dados',
          text: 'Atuamos em conformidade com a Lei n.º 22/11 da República de Angola, garantindo a privacidade e a segurança dos dados pessoais dos nossos utilizadores.'
        }
      ]
    }
  };

  const current = content[type];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col relative border border-orange-500/20 max-h-[85vh]">
        
        {/* Header Fixed */}
        <div className="p-6 md:p-8 pb-4 flex flex-col items-center text-center relative border-b border-orange-500/10">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 text-slate-400 hover:text-orange-500 transition-colors p-2"
          >
            <X size={24} />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4 border border-orange-500/20">
            {current.icon}
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {current.title}
          </h2>
          <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mt-1">
            {current.subtitle}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
          {current.sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <ChevronRight size={14} className="text-orange-500" />
                {section.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
                {section.text}
              </p>
            </div>
          ))}
          
          <div className="pt-4 pb-2">
            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-orange-500/10">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-bold italic">
                Última atualização: Fevereiro de 2024. Su-Golden. Luanda, Angola.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Fixed */}
        <div className="p-4 bg-slate-50/50 dark:bg-white/5 border-t border-orange-500/10">
          <button
            onClick={onClose}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20"
          >
            Entendi e Aceito
          </button>
        </div>
      </div>
    </div>
  );
};
