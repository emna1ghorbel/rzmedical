"use client";

import React, { useState, useMemo, useEffect } from "react";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyInfo } from "@/context/CompanyInfoContext";
import CustomDatePicker from "./CustomDatePicker";

const API_URL = getApiUrl();

export interface InvoiceEditProps {
  invoice: any;
  allInvoices?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

interface EditLine {
  id?: number;
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  totalHT: number;
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

export default function InvoiceEditModal({
  invoice,
  allInvoices,
  onClose,
  onSuccess,
}: InvoiceEditProps) {
  const { getToken } = useAuth();
  const { defaultTimbre, defaultTva, tvaRates: companyTvaRates, timbreRates: companyTimbreRates } = useCompanyInfo();

  // Trouver la date de la dernière facture antérieure pour désactiver les dates précédentes
  const minDateEmission = useMemo(() => {
    if (!allInvoices || allInvoices.length === 0) return "";
    const others = allInvoices.filter(
      (inv: any) => inv.id !== invoice.id && inv.statut !== "ANNULEE" && String(inv.numero) < String(invoice.numero)
    );
    if (others.length === 0) return "";
    others.sort((a: any, b: any) => String(b.numero).localeCompare(String(a.numero)));
    const prev = others[0];
    return prev?.dateEmission ? prev.dateEmission.split("T")[0] : "";
  }, [allInvoices, invoice]);

  // Client info
  const [clientNom, setClientNom] = useState(invoice.clientNom || "");
  const [clientMF, setClientMF] = useState(invoice.clientMF || "");
  const [clientAdresse, setClientAdresse] = useState(invoice.clientAdresse || "");
  const [clientTelephone, setClientTelephone] = useState(invoice.clientTelephone || "");
  const [clientEmail, setClientEmail] = useState(invoice.clientEmail || "");

  // Dates
  const [dateEmission, setDateEmission] = useState(
    invoice.dateEmission ? new Date(invoice.dateEmission).toISOString().split("T")[0] : ""
  );
  const [dateEcheance, setDateEcheance] = useState(
    invoice.dateEcheance ? new Date(invoice.dateEcheance).toISOString().split("T")[0] : ""
  );

  // Status & comments
  const [statut, setStatut] = useState(invoice.statut || "BROUILLON");
  const [commentaire, setCommentaire] = useState(invoice.commentaire || "");

  // Financials
  const [timbreFiscal, setTimbreFiscal] = useState<number>(
    invoice.timbreFiscal !== undefined ? Number(invoice.timbreFiscal) : defaultTimbre
  );
  const [retenueSurce, setRetenueSurce] = useState<number>(
    invoice.retenueSurce !== undefined ? Number(invoice.retenueSurce) : 0
  );

  // Lines
  const [lignes, setLignes] = useState<EditLine[]>(() => {
    if (invoice.lignes && invoice.lignes.length > 0) {
      return invoice.lignes.map((l: any) => ({
        id: l.id,
        designation: l.designation || "",
        quantite: Number(l.quantite) || 1,
        prixUnitaireHT: Number(l.prixUnitaireHT) || 0,
        tauxTVA: Number(l.tauxTVA) || 19,
        totalHT: round3((Number(l.quantite) || 1) * (Number(l.prixUnitaireHT) || 0)),
      }));
    }
    return [
      {
        designation: "",
        quantite: 1,
        prixUnitaireHT: 0,
        tauxTVA: defaultTva,
        totalHT: 0,
      },
    ];
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyTvaRates.length > 0) {
      setLignes((prev) =>
        prev.map((line) => ({
          ...line,
          tauxTVA: companyTvaRates.includes(line.tauxTVA) ? line.tauxTVA : defaultTva,
        }))
      );
    }
  }, [companyTvaRates, defaultTva]);

  // Calculations
  const updateLine = (idx: number, field: keyof EditLine, val: any) => {
    setLignes((prev) => {
      const next = [...prev];
      const updated = { ...next[idx], [field]: val };
      if (field === "quantite" || field === "prixUnitaireHT") {
        const q = field === "quantite" ? Number(val) : updated.quantite;
        const p = field === "prixUnitaireHT" ? Number(val) : updated.prixUnitaireHT;
        updated.totalHT = round3((q || 0) * (p || 0));
      }
      if (field === "tauxTVA") {
        // Le totalHT reste identique, mais les totaux globaux et TTC ligne s'ajusteront
      }
      next[idx] = updated;
      return next;
    });
  };

  // Calcul inverse : modifier le Total TTC calcule le Prix HT
  const updateLineTTC = (idx: number, newTotalTTC: number) => {
    setLignes((prev) => {
      const next = [...prev];
      const line = { ...next[idx] };
      const q = Number(line.quantite) || 1;
      const tva = Number(line.tauxTVA) || 0;
      const tvaFactor = 1 + tva / 100;
      const denominator = tvaFactor * (q > 0 ? q : 1);

      if (denominator > 0) {
        const newPrixHT = round3(newTotalTTC / denominator);
        line.prixUnitaireHT = newPrixHT;
        line.totalHT = round3((q || 1) * newPrixHT);
      }
      next[idx] = line;
      return next;
    });
  };

  const addLine = () => {
    setLignes((prev) => [
      ...prev,
      {
        designation: "",
        quantite: 1,
        prixUnitaireHT: 0,
        tauxTVA: 19,
        totalHT: 0,
      },
    ]);
  };

  const removeLine = (idx: number) => {
    if (lignes.length <= 1) {
      alert("La facture doit comporter au moins une ligne.");
      return;
    }
    setLignes((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalHT = round3(lignes.reduce((sum, l) => sum + (l.totalHT || 0), 0));
  const totalTVA = round3(
    lignes.reduce((sum, l) => sum + (l.totalHT || 0) * ((Number(l.tauxTVA) || 0) / 100), 0)
  );
  const totalTTC = round3(totalHT + totalTVA + Number(timbreFiscal || 0));
  const netAPayer = Math.max(0, round3(totalTTC - Number(retenueSurce || 0)));

  const fmt = (n: number) =>
    Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNom.trim()) {
      setError("Le nom du client est requis.");
      return;
    }

    for (let i = 0; i < lignes.length; i++) {
      if (!lignes[i].designation.trim()) {
        setError(`Veuillez renseigner la désignation de la ligne ${i + 1}.`);
        return;
      }
      if (Number(lignes[i].quantite) <= 0) {
        setError(`La quantité de la ligne ${i + 1} doit être supérieure à 0.`);
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const token = getToken();
      const payload = {
        clientNom: clientNom.trim(),
        clientMF: clientMF.trim() || null,
        clientAdresse: clientAdresse.trim() || null,
        clientTelephone: clientTelephone.trim() || null,
        clientEmail: clientEmail.trim() || null,
        dateEmission: dateEmission || undefined,
        dateEcheance: dateEcheance || null,
        statut,
        commentaire: commentaire.trim() || null,
        timbreFiscal: Number(timbreFiscal),
        retenueSurce: Number(retenueSurce),
        lignes: lignes.map((l) => ({
          designation: l.designation.trim(),
          quantite: Number(l.quantite),
          prixUnitaireHT: Number(l.prixUnitaireHT),
          tauxTVA: Number(l.tauxTVA),
          totalHT: round3(Number(l.quantite) * Number(l.prixUnitaireHT)),
        })),
      };

      const res = await fetch(`${API_URL}/invoices/admin/${invoice.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur lors de la modification");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center text-lg font-bold shadow-xs">
              ✏️
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Modifier la facture {invoice.numero}
              </h3>
              <p className="text-xs text-gray-500">
                Ajustez les informations du client, les lignes et les conditions financières
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* General Info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                Informations Générales & Client
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom du client <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientNom}
                    onChange={(e) => setClientNom(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Matricule Fiscale
                  </label>
                  <input
                    type="text"
                    value={clientMF}
                    onChange={(e) => setClientMF(e.target.value)}
                    placeholder="Ex: 1234567/A/M/000"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={clientTelephone}
                    onChange={(e) => setClientTelephone(e.target.value)}
                    placeholder="+216 ..."
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@exemple.tn"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={clientAdresse}
                    onChange={(e) => setClientAdresse(e.target.value)}
                    placeholder="Adresse complète du client"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Dates & Status */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                Dates & Statut
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <CustomDatePicker
                    label="Date d'émission"
                    required
                    value={dateEmission}
                    minDate={minDateEmission}
                    onChange={setDateEmission}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    value={dateEcheance}
                    onChange={(e) => setDateEcheance(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut de la facture
                  </label>
                  <select
                    value={statut}
                    onChange={(e) => setStatut(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="BROUILLON">Brouillon</option>
                    <option value="VALIDEE">Validée</option>
                    <option value="ENVOYEE">Envoyée</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Lignes de la Facture
                </h4>
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400"
                >
                  <span>+</span> Ajouter une ligne
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="p-2.5 text-left">Désignation</th>
                      <th className="p-2.5 text-center w-16">Qté</th>
                      <th className="p-2.5 text-right w-24">P.U HT</th>
                      <th className="p-2.5 text-center w-20">TVA (%)</th>
                      <th className="p-2.5 text-right w-24">Total HT</th>
                      <th className="p-2.5 text-right w-24">Total TTC</th>
                      <th className="p-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {lignes.map((line, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            placeholder="Désignation du produit ou service"
                            value={line.designation}
                            onChange={(e) => updateLine(idx, "designation", e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={line.quantite}
                            onChange={(e) => updateLine(idx, "quantite", Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full text-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step="0.001"
                            value={line.prixUnitaireHT}
                            onChange={(e) => updateLine(idx, "prixUnitaireHT", parseFloat(e.target.value) || 0)}
                            className="w-full text-right rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={line.tauxTVA}
                            onChange={(e) => updateLine(idx, "tauxTVA", parseFloat(e.target.value) || 0)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            {companyTvaRates.map(rate => (
                              <option key={rate} value={rate}>{rate}%</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 text-right font-semibold tabular-nums text-gray-900 dark:text-white">
                          {fmt(line.totalHT)}
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step="0.001"
                            value={round3((line.totalHT || 0) * (1 + (Number(line.tauxTVA) || 0) / 100))}
                            onChange={(e) => updateLineTTC(idx, parseFloat(e.target.value) || 0)}
                            className="w-full text-right rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                            title="Modifier le Total TTC recalcule automatiquement le Prix HT"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="text-gray-400 hover:text-red-500 transition p-1"
                            title="Supprimer la ligne"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations and comment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Commentaire / Notes sur la facture
                </label>
                <textarea
                  rows={3}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Notes optionnelles ou conditions de règlement..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>Total HT</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{fmt(totalHT)} TND</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>Total TVA</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{fmt(totalTVA)} TND</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>Timbre Fiscal</span>
                  <div className="w-32">
                    <select
                      value={timbreFiscal}
                      onChange={(e) => setTimbreFiscal(parseFloat(e.target.value) || 0)}
                      className="w-full text-right rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
                    >
                      {companyTimbreRates.map(rate => (
                        <option key={rate} value={rate}>
                          {rate.toFixed(3)} TND
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-between items-center text-amber-700 dark:text-amber-400">
                  <span>Retenue à la source</span>
                  <div className="w-24">
                    <input
                      type="number"
                      step="0.001"
                      min={0}
                      value={retenueSurce}
                      onChange={(e) => setRetenueSurce(parseFloat(e.target.value) || 0)}
                      className="w-full text-right rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2 text-sm">
                  <span>Total TTC</span>
                  <span>{fmt(totalTTC)} TND</span>
                </div>
                <div className="flex justify-between items-center font-bold text-amber-700 dark:text-amber-400 text-sm">
                  <span>Net à payer</span>
                  <span>{fmt(netAPayer)} TND</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-800/40">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition shadow-sm flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Enregistrer les modifications</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
