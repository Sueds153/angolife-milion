import { ExchangeRate, ProductDeal, Job, NewsArticle } from '../types';

// This file simulates the Supabase interaction. 
// In a real app, you would use `import { createClient } from '@supabase/supabase-js'`

// Initial Mock Data
let MOCK_RATES: ExchangeRate[] = [
  {
    currency: 'USD',
    formalBuy: 850.50,
    formalSell: 865.00,
    informalBuy: 1100.00,
    informalSell: 1150.00,
    lastUpdated: new Date().toISOString()
  },
  {
    currency: 'EUR',
    formalBuy: 920.10,
    formalSell: 940.20,
    informalBuy: 1200.00,
    informalSell: 1260.00,
    lastUpdated: new Date().toISOString()
  }
];

let MOCK_DEALS: ProductDeal[] = [
  {
    id: '1',
    title: 'Arroz Tio Lucas 25kg',
    store: 'Kero Kilamba',
    originalPrice: 15000,
    discountPrice: 12500,
    location: 'Kilamba, Luanda',
    description: 'Promoção de fim de semana.',
    imagePlaceholder: 'https://picsum.photos/200/200?random=1',
    status: 'approved',
    submittedBy: 'user1',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Óleo Vegetal Fula 1L',
    store: 'Candando',
    originalPrice: 2000,
    discountPrice: 1600,
    location: 'Talatona, Luanda',
    description: 'Leve 3 pague 2.',
    imagePlaceholder: 'https://picsum.photos/200/200?random=2',
    status: 'approved',
    submittedBy: 'user2',
    createdAt: new Date().toISOString()
  }
];

const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Engenheiro de Software Sénior',
    company: 'Unitel Angola',
    location: 'Luanda, Talatona',
    type: 'Tempo Inteiro',
    salary: '1.200.000 - 1.500.000 Kz',
    description: 'Procuramos um desenvolvedor sénior com experiência em React e Node.js.',
    postedAt: 'Há 2 dias',
    requirements: ['React', 'Node.js', '5+ anos de experiência'],
    sourceUrl: 'https://unitel.ao/carreiras',
    status: 'published'
  },
  {
    id: '2',
    title: 'Analista Financeiro (Scraped)',
    company: 'Banco BAI',
    location: 'Luanda, Mutamba',
    type: 'Tempo Inteiro',
    salary: 'Confidencial',
    description: 'Analista para o departamento de risco. (Vaga capturada via Bot)',
    postedAt: 'Há 5 horas',
    requirements: ['Excel Avançado', 'Finanças', 'Inglês'],
    sourceUrl: 'https://bancobai.ao',
    status: 'pending' // Pending Approval
  }
];

const MOCK_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'Kwanza valoriza 2% face ao Dólar esta semana',
    summary: 'O mercado cambial registou uma ligeira melhoria na oferta de divisas.',
    source: 'Jornal de Angola',
    url: 'https://jornaldeangola.ao',
    category: 'Economia',
    publishedAt: '2024-05-20',
    status: 'published'
  },
  {
    id: '2',
    title: 'Novas regras para importação de automóveis (RSS Feed)',
    summary: 'Governo anuncia decreto que altera os limites de idade para viaturas ligeiras.',
    source: 'Expansão',
    url: 'https://expansao.co.ao',
    category: 'Política',
    publishedAt: '2024-05-21',
    status: 'pending' // Pending Approval
  }
];

// Service Methods
export const MockSupabase = {
  getRates: async (): Promise<ExchangeRate[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_RATES]), 500);
    });
  },

  updateInformalRate: async (currency: 'USD' | 'EUR', buy: number, sell: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        MOCK_RATES = MOCK_RATES.map(r => 
          r.currency === currency 
            ? { ...r, informalBuy: buy, informalSell: sell, lastUpdated: new Date().toISOString() } 
            : r
        );
        resolve();
      }, 500);
    });
  },

  getDeals: async (isAdmin: boolean = false): Promise<ProductDeal[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (isAdmin) return resolve([...MOCK_DEALS]);
        // Public only sees approved deals
        resolve(MOCK_DEALS.filter(d => d.status === 'approved'));
      }, 500);
    });
  },

  getPendingDeals: async (): Promise<ProductDeal[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_DEALS.filter(d => d.status === 'pending'));
      }, 500);
    });
  },

  submitDeal: async (deal: Omit<ProductDeal, 'id' | 'status' | 'createdAt'>): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newDeal: ProductDeal = {
          ...deal,
          id: Math.random().toString(36).substr(2, 9),
          status: 'pending', // Requires admin approval
          createdAt: new Date().toISOString()
        };
        MOCK_DEALS.push(newDeal);
        resolve();
      }, 500);
    });
  },

  approveDeal: async (id: string, isApproved: boolean): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        MOCK_DEALS = MOCK_DEALS.map(d => 
          d.id === id ? { ...d, status: isApproved ? 'approved' : 'rejected' } : d
        );
        resolve();
      }, 500);
    });
  },

  // --- JOBS AUTOMATION MOCK ---
  getJobs: async (isAdmin: boolean = false): Promise<Job[]> => {
     return new Promise(resolve => {
        setTimeout(() => {
          if (isAdmin) resolve([...MOCK_JOBS]);
          else resolve(MOCK_JOBS.filter(j => j.status === 'published'));
        }, 500);
     });
  },

  getPendingJobs: async (): Promise<Job[]> => {
    return new Promise(resolve => {
       setTimeout(() => {
         resolve(MOCK_JOBS.filter(j => j.status === 'pending'));
       }, 500);
    });
  },

  approveJob: async (id: string, isApproved: boolean): Promise<void> => {
     return new Promise(resolve => {
        setTimeout(() => {
           // In mock, we manipulate the array in place or map it
           const idx = MOCK_JOBS.findIndex(j => j.id === id);
           if (idx !== -1) {
              if (isApproved) MOCK_JOBS[idx].status = 'published';
              else MOCK_JOBS.splice(idx, 1); // Reject deletes it in this demo
           }
           resolve();
        }, 500);
     });
  },

  // --- NEWS AUTOMATION MOCK ---
  getNews: async (isAdmin: boolean = false): Promise<NewsArticle[]> => {
    return new Promise(resolve => {
       setTimeout(() => {
         if (isAdmin) resolve([...MOCK_NEWS]);
         else resolve(MOCK_NEWS.filter(n => n.status === 'published'));
       }, 500);
    });
 },

 getPendingNews: async (): Promise<NewsArticle[]> => {
  return new Promise(resolve => {
     setTimeout(() => {
       resolve(MOCK_NEWS.filter(n => n.status === 'pending'));
     }, 500);
  });
},

 approveNews: async (id: string, isApproved: boolean): Promise<void> => {
    return new Promise(resolve => {
       setTimeout(() => {
          const idx = MOCK_NEWS.findIndex(n => n.id === id);
          if (idx !== -1) {
             if (isApproved) MOCK_NEWS[idx].status = 'published';
             else MOCK_NEWS.splice(idx, 1);
          }
          resolve();
       }, 500);
    });
 },

 // --- SIMULATION TRIGGERS ---
 triggerJobScraper: async (): Promise<number> => {
    return new Promise(resolve => {
       setTimeout(() => {
          const newJobs: Job[] = [
             {
                id: Math.random().toString(36).substr(2, 9),
                title: 'Técnico de Suporte IT (Demo)',
                company: 'NCR Angola',
                location: 'Luanda, Centro',
                type: 'Tempo Inteiro',
                salary: 'Confidencial',
                description: 'Manutenção de hardware e suporte ao cliente.',
                postedAt: 'Há 1 hora',
                requirements: ['Hardware', 'Redes', 'Atendimento'],
                sourceUrl: 'https://ncr.ao/jobs',
                status: 'pending'
             },
             {
                id: Math.random().toString(36).substr(2, 9),
                title: 'Gerente Comercial (Demo)',
                company: 'Shoprite',
                location: 'Benguela',
                type: 'Tempo Inteiro',
                description: 'Gestão de equipas de vendas e análise de KPIs.',
                postedAt: 'Há 30 min',
                requirements: ['Gestão', 'Vendas', 'Liderança'],
                status: 'pending'
             }
          ];
          MOCK_JOBS.push(...newJobs);
          resolve(newJobs.length);
       }, 2000);
    });
 },

 triggerNewsScraper: async (): Promise<number> => {
    return new Promise(resolve => {
       setTimeout(() => {
          const newNews: NewsArticle[] = [
             {
                id: Math.random().toString(36).substr(2, 9),
                title: 'Sonangol anuncia novas descobertas (Demo)',
                summary: 'Petrolífera nacional confirma reservas na Bacia do Kwanza.',
                source: 'Economia & Mercado',
                url: 'https://mercado.co.ao',
                category: 'Economia',
                publishedAt: new Date().toISOString().split('T')[0],
                status: 'pending'
             }
          ];
          MOCK_NEWS.push(...newNews);
          resolve(newNews.length);
       }, 2000);
    });
 }
};