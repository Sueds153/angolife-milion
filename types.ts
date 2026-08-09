/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 * @license Proprietary. Unauthorized copying, modification, or reverse engineering is strictly prohibited.
 */

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  postedAt: string;
  requirements: string[];
  sourceUrl?: string;
  applicationEmail?: string;
  status: "pending" | "published" | "approved" | "rejected";
  isVerified?: boolean;
  imageUrl?: string;
  category?: string;
  reportCount?: number;
  applicationCount?: number;
  source?: string;
}

export interface ExchangeRate {
  currency: "USD" | "EUR";
  formalBuy: number;
  formalSell: number;
  informalBuy: number;
  informalSell: number;
  lastUpdated: string;
}

export interface ProductDeal {
  id: string;
  title: string;
  store: string;
  storeNumber?: string;
  phone?: string;
  originalPrice: number;
  discountPrice: number;
  /** Alias de discountPrice — usado em alguns componentes como deal.price */
  price?: number;
  location: string;
  description: string;
  imagePlaceholder: string;
  /** URL pública do bucket discount-images do Supabase Storage */
  imageUrl?: string;
  url?: string;
  category?: string;
  status: "pending" | "approved" | "rejected";
  submittedBy: string;
  createdAt: string;
  views?: number;
  likes?: number;
  verified?: boolean;
  is_admin?: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  category: string;
  publishedAt: string;
  status: "pending" | "published" | "approved" | "rejected";
  imageUrl?: string;
  /** Corpo completo da notícia (HTML) — usado no modal detail */
  body?: string;
  /** Flag de prioridade/urgência (BNA, Última Hora, etc.) */
  is_priority?: boolean;
  /** Flag para marcar como "Segredo/Exclusivo" no feed */
  isSecret?: boolean;
  /** URL da imagem og:image do artigo original */
  originalImageUrl?: string;
}

export interface UserProfile {
  id?: string;
  email: string;
  referralCount: number;
  isPremium: boolean;
  referralCode: string;
  isAdmin: boolean;
  cvCredits: number;
  premiumExpiry?: number; // Timestamp
  subscriptionType?: "pack3" | "monthly" | "yearly";
  accountType?: "free" | "premium" | "bronze" | "silver";
  fullName?: string;
  phone?: string;
  location?: string;
  savedJobs?: string[]; // IDs das vagas guardadas
  applicationHistory?: { jobId: string, date: string, title: string }[];
  cvHistory?: { id: string, date: string, url: string, name: string }[];
  hasReferralDiscount?: boolean;
  avatarUrl?: string;
  // VaiJá
  tipoUtilizador?: TipoUtilizador;
  destinosFrequentes?: string[];
  avaliacaoMedia?: number | null;
  passageiroNoShowCount?: number;
  contactoEmergencia?: string;
}

// ── VaiJá ────────────────────────────────────────────
export type TipoUtilizador = "passageiro" | "motorista" | "ambos";
export type TipoVeiculo = "candongueiro" | "taxi";
export type ModoTrajeto = "trajeto" | "corredor";
export type StatusTrajeto = "ativo" | "lotado" | "finalizado" | "expirado";
export type StatusConfirmacao = "confirmado" | "embarcado" | "cancelado" | "nao_apareceu";
export type StatusPedidoDemanda = "aberto" | "atendido" | "cancelado";

export interface DriverData {
  id?: string;
  userId: string;
  matricula?: string;
  tipoVeiculo?: TipoVeiculo;
  fotoDocumentoUrl?: string;
  verificado?: boolean;
  trajetosFantasmaCount?: number;
  statusConta?: "ativo" | "suspenso";
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface MotoristaPublico {
  userId: string;
  matricula?: string;
  tipoVeiculo?: TipoVeiculo;
  verificado?: boolean;
  trajetosFantasmaCount?: number;
  statusConta?: "ativo" | "suspenso";
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  avaliacaoMedia?: number | null;
}

export interface Corredor {
  id: string;
  nome: string;
  partida: string;
  destino: string;
  partidaLat?: number | null;
  partidaLng?: number | null;
  destinoLat?: number | null;
  destinoLng?: number | null;
  precoReferencia?: number | null;
  distanciaKm?: number | null;
  ativo?: boolean;
}

export interface TrajetoAtivo {
  id: string;
  motoristaId: string;
  modo: ModoTrajeto;
  corredorId?: string | null;
  pontoPartida: string;
  partidaLat?: number | null;
  partidaLng?: number | null;
  pontoDestino: string;
  destinoLat?: number | null;
  destinoLng?: number | null;
  lugaresTotais: number;
  lugaresDisponiveis: number;
  preco: number;
  modoLotacaoRapida?: boolean;
  status: StatusTrajeto;
  incidenteReportado?: boolean;
  criadoEm: string;
  atualizadoEm: string;
  expiraEm: string;
}

export interface Confirmacao {
  id: string;
  trajetoId: string;
  passageiroId: string;
  precoAcordado?: number | null;
  status: StatusConfirmacao;
  criadoEm: string;
}

export interface PedidoDemanda {
  id: string;
  passageiroId: string;
  pontoPartida: string;
  partidaLat?: number | null;
  partidaLng?: number | null;
  pontoDestino: string;
  destinoLat?: number | null;
  destinoLng?: number | null;
  status: StatusPedidoDemanda;
  criadoEm: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "job" | "market" | "system";
  timestamp: number;
}

export type UserRole = "guest" | "admin";

// CV Types
export interface CVExperience {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface CVEducation {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export interface CVData {
  fullName: string;
  title?: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: string[];
}

export interface CheckoutFormData {
  fullName: string;
  age: string;
  gender: string;
  wallet: string;
  coordinates: string;
  bank: string;
  iban: string;
  accountHolder: string;
  termsAccepted?: boolean;
  rateGuaranteeAccepted?: boolean;
}

