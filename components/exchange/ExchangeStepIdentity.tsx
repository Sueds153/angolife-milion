import React from "react";
import { ArrowRightLeft, Sparkles } from "lucide-react";

interface ExchangeStepIdentityProps {
  tradeAction: "buy" | "sell";
  tradeAmount: string;
  tradeCurrency: "USD" | "EUR";
  totalKzFormatted: string;
  currentRateValue: number;
  isRateValid: boolean;
  formData: any;
  setFormData: (data: any) => void;
  showStep1Errors: boolean;
  savingsFormatted: string;
}

export const ExchangeStepIdentity: React.FC<ExchangeStepIdentityProps> = ({
  tradeAction,
  tradeAmount,
  tradeCurrency,
  totalKzFormatted,
  currentRateValue,
  isRateValid,
  formData,
  setFormData,
  showStep1Errors,
  savingsFormatted,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm mb-4">
          Passo 1:{" "}
          {tradeAction === "buy" ? "Identificação" : "Dados de Recebimento"}
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-black border border-orange-500/20 dark:border-orange-500/30 p-8 rounded-3xl space-y-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ArrowRightLeft size={40} className="text-orange-500" />
          </div>
          <div className="flex flex-col items-center gap-1 relative">
            <span className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white break-all text-center">
              {totalKzFormatted}
            </span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Total a {tradeAction === "buy" ? "entregar" : "receber"}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-black border border-orange-500/20 p-8 rounded-3xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              {tradeAction === "buy" ? "RECEBES" : "ENTREGAS"}
            </span>
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">
              Câmbio: 1 USD = {currentRateValue.toLocaleString("pt-AO")} Kz
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-black text-slate-900 dark:text-white">
              {parseFloat(tradeAmount).toFixed(2)} {tradeCurrency}
            </span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {tradeCurrency === "USD" ? "Dólares" : "Euros"} Digitais
            </span>
          </div>
        </div>
      </div>

      {!isRateValid && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex flex-col items-center gap-3 animate-pulse text-center">
          <div className="p-3 bg-red-500/20 rounded-full text-red-500">
            <div className="w-6 h-6 border-2 border-current rounded-full flex items-center justify-center">
              !
            </div>
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-black text-red-500 uppercase tracking-widest">
              ALERTA DE SISTEMA
            </span>
            <p className="text-xs font-bold text-white leading-tight">
              Sistema em atualização de taxas. Por favor, tente novamente em
              instantes.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
          Dados Pessoais
        </label>
        <div className="space-y-1">
          <input
            className={`w-full bg-white dark:bg-slate-900 border ${showStep1Errors && !formData.fullName ? "border-red-500" : "border-orange-500/20"} p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors`}
            placeholder="Nome Completo *"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
          />
          {showStep1Errors && !formData.fullName && (
            <p className="text-[9px] text-red-500 font-bold ml-2 uppercase">
              Campo obrigatório
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <input
              type="number"
              className={`w-full bg-white dark:bg-slate-900 border ${showStep1Errors && !formData.age ? "border-red-500" : "border-orange-500/20"} p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors`}
              placeholder="Idade"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
            />
            {showStep1Errors && !formData.age && (
              <p className="text-[9px] text-red-500 font-bold ml-2 uppercase">
                Campo obrigatório
              </p>
            )}
          </div>
          <select
            aria-label="Gênero"
            className="w-full bg-white dark:bg-slate-900 border border-orange-500/20 p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500"
            value={formData.gender}
            onChange={(e) =>
              setFormData({ ...formData, gender: e.target.value })
            }
          >
            <option>Masculino</option>
            <option>Feminino</option>
            <option>Prefiro não dizer</option>
          </select>
        </div>
      </div>

      {tradeAction === "buy" ? (
        <>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
              Escolha sua Carteira Digital
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                "Wise",
                "PayPal",
                "Revolut",
                "Redotpay",
                "Bybit",
                "Jeton",
                "Binance",
                "Outros",
              ].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setFormData({ ...formData, wallet: w })}
                  className={`p-3 rounded-xl border-2 font-bold text-[10px] transition-all uppercase tracking-tighter ${formData.wallet === w ? "bg-orange-500/10 border-orange-500 text-slate-900 dark:text-white" : "bg-white dark:bg-slate-900 border-orange-500/10 text-slate-500"}`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
              Coordenada / ID da Carteira *
            </label>
            <div className="space-y-1">
              <input
                className={`w-full bg-white dark:bg-slate-900 border-2 ${showStep1Errors && !formData.coordinates ? "border-red-500" : "border-orange-500/20"} p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors`}
                placeholder={
                  formData.wallet === "Binance"
                    ? "Insira Pay ID"
                    : formData.wallet === "Wise" || formData.wallet === "PayPal"
                      ? "Insira E-mail"
                      : "Insira ID ou Coordenada"
                }
                value={formData.coordinates}
                onChange={(e) =>
                  setFormData({ ...formData, coordinates: e.target.value })
                }
              />
              {showStep1Errors && !formData.coordinates && (
                <p className="text-[9px] text-red-500 font-bold ml-2 uppercase">
                  Insira a coordenada
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
            Dados Bancários para Receber Kwanza
          </label>
          <select
            aria-label="Banco de Destino"
            className="w-full bg-white dark:bg-slate-900 border border-orange-500/20 p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500"
            value={formData.bank}
            onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
          >
            {["BAI", "BFA", "ATLÂNTICO", "PAYPAY"].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <div className="space-y-1">
            <input
              className={`w-full bg-white dark:bg-slate-900 border ${showStep1Errors && (formData.iban.length !== 25 || !formData.iban.startsWith("AO06")) ? "border-red-500" : "border-orange-500/20"} p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors`}
              placeholder="IBAN (AO06...) *"
              value={formData.iban}
              maxLength={25}
              onChange={(e) => {
                let val = e.target.value.toUpperCase().replace(/\s/g, "");
                if (!val.startsWith("AO06")) {
                  val = "AO06" + val.replace(/\D/g, "");
                } else {
                  const prefix = "AO06";
                  const rest = val.slice(4).replace(/\D/g, "");
                  val = prefix + rest;
                }
                if (val.length <= 25) {
                  setFormData({ ...formData, iban: val });
                }
              }}
            />
            {showStep1Errors && formData.iban.length < 25 && (
              <p className="text-[9px] text-red-500 font-bold ml-2 uppercase">
                IBAN incompleto (25 dígitos)
              </p>
            )}
          </div>
          <div className="space-y-1">
            <input
              className={`w-full bg-white dark:bg-slate-900 border ${showStep1Errors && !formData.accountHolder ? "border-red-500" : "border-orange-500/20"} p-5 rounded-2xl font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-colors`}
              placeholder="Nome do Titular da Conta *"
              value={formData.accountHolder}
              onChange={(e) =>
                setFormData({ ...formData, accountHolder: e.target.value })
              }
            />
            {showStep1Errors && !formData.accountHolder && (
              <p className="text-[9px] text-red-500 font-bold ml-2 uppercase">
                Campo obrigatório
              </p>
            )}
          </div>
        </div>
      )}

      {parseFloat(tradeAmount) > 0 && (
        <div className="bg-green-500/5 border border-green-500/10 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
          <div className="bg-green-500/20 p-2 rounded-full text-green-500">
            <Sparkles size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest whitespace-nowrap">
              Economia AngoLife
            </span>
            <span className="text-xs font-bold text-white leading-tight">
              Estás a poupar aproximadamente{" "}
              <span className="text-green-500">{savingsFormatted}</span> em
              comparação às taxas médias de rua.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
