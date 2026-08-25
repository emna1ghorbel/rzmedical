"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePdfDocument, InvoiceData, InvoiceLine } from "./InvoicePdfDocument";
import { montantEnLettres, formatTND } from "@/utils/numberToFrenchWords";
import { DEFAULT_TIMBRE_FISCAL, DEFAULT_TVA_RATE } from "@/utils/invoiceConfig";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderLine {
  produitId: number;
  quantite: number;
  prixUnitaire: number;
  produit: { id: number; nom: string; reference: string };
}

interface Order {
  id: number;
  creeLe: string;
  total: number;
  statut: string;
  utilisateur: {
    id?: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string | null;
    adresse?: string | null;
    matriculeFiscale?: string | null;
  };
  lignes: OrderLine[];
}

interface InvoiceLineForm {
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  totalHT: number;
}

interface ValidationErrors {
  numero?: string;
  dateEmission?: string;
  clientNom?: string;
  timbreFiscal?: string;
  lignes?: string[];
  general?: string;
}

interface InvoiceEditorModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const round3 = (x: number) => Math.round(x * 1000) / 1000;

const todayDDMMYYYY = () => {
  const now = new Date();
  const d = now.getDate().toString().padStart(2, "0");
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
};

const parseDate = (ddmmyyyy: string): Date | null => {
  const parts = ddmmyyyy.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return new Date(y, m - 1, d);
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function InvoiceEditorModal({
  order,
  onClose,
  onSuccess,
}: InvoiceEditorModalProps) {
  const { getToken } = useAuth();

  // ── Form State ──
  const [numero, setNumero] = useState("");
  const [dateEmission, setDateEmission] = useState(todayDDMMYYYY());
  const [clientNom, setClientNom] = useState(
    `${order.utilisateur.nom || ""} ${order.utilisateur.prenom || ""}`.trim()
  );
  const [clientMF, setClientMF] = useState(
    order.utilisateur.matriculeFiscale || ""
  );
  const [clientAdresse, setClientAdresse] = useState(
    order.utilisateur.adresse || ""
  );
  const [clientTelephone, setClientTelephone] = useState(
    order.utilisateur.telephone || ""
  );
  const [clientEmail, setClientEmail] = useState(order.utilisateur.email || "");
  const [timbreFiscal, setTimbreFiscal] = useState(DEFAULT_TIMBRE_FISCAL);

  // ── Invoice Lines ──
  const [lignes, setLignes] = useState<InvoiceLineForm[]>(() =>
    order.lignes.map((l) => {
      const qty = l.quantite;
      const pu = l.prixUnitaire;
      const tva = DEFAULT_TVA_RATE;
      return {
        designation: l.produit.nom,
        quantite: qty,
        prixUnitaireHT: pu,
        tauxTVA: tva,
        totalHT: round3(qty * pu),
      };
    })
  );

  // ── UI State ──
  const [loadingNumber, setLoadingNumber] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [successMsg, setSuccessMsg] = useState("");
  const previewBlobRef = useRef<Blob | null>(null);

  // ── Load invoice number ──
  useEffect(() => {
    const fetchNumber = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/invoices/admin/generate-number`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNumero(data.numero);
        }
      } catch {
        setNumero(`${new Date().getFullYear()}0001`);
      } finally {
        setLoadingNumber(false);
      }
    };
    fetchNumber();
  }, [getToken]);

  // ── Live Calculation ──
  const montantHT = round3(lignes.reduce((s, l) => s + l.totalHT, 0));
  const montantTVA = round3(
    lignes.reduce((s, l) => s + round3(l.totalHT * (l.tauxTVA / 100)), 0)
  );
  const montantTTC = round3(montantHT + montantTVA + timbreFiscal);

  // ── Line Updates ──
  const updateLine = (idx: number, field: keyof InvoiceLineForm, value: any) => {
    setLignes((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      // Recalculate totalHT
      const qty = field === "quantite" ? value : next[idx].quantite;
      const pu = field === "prixUnitaireHT" ? value : next[idx].prixUnitaireHT;
      next[idx].totalHT = round3(Number(qty) * Number(pu));
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
        tauxTVA: DEFAULT_TVA_RATE,
        totalHT: 0,
      },
    ]);
  };

  const removeLine = (idx: number) => {
    setLignes((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Validation ──
  const validate = (): boolean => {
    const errs: ValidationErrors = {};

    if (!numero.trim()) errs.numero = "Le numéro de facture est requis";
    else if (!/^\d{8}$/.test(numero.trim()))
      errs.numero = "Format invalide (ex: 20260055)";

    if (!dateEmission.trim())
      errs.dateEmission = "La date est requise";
    else if (!parseDate(dateEmission))
      errs.dateEmission = "Format invalide (DD/MM/YYYY)";

    if (!clientNom.trim()) errs.clientNom = "Le nom du client est requis";

    if (isNaN(timbreFiscal) || timbreFiscal < 0)
      errs.timbreFiscal = "Timbre fiscal invalide";

    const lineErrors: string[] = lignes.map((l, i) => {
      if (!l.designation.trim()) return `Ligne ${i + 1}: désignation requise`;
      if (l.quantite <= 0) return `Ligne ${i + 1}: quantité invalide`;
      if (l.prixUnitaireHT < 0) return `Ligne ${i + 1}: prix invalide`;
      if (l.tauxTVA < 0 || l.tauxTVA > 100)
        return `Ligne ${i + 1}: TVA invalide (0–100%)`;
      return "";
    });
    const hasLineErrors = lineErrors.some(Boolean);
    if (hasLineErrors) errs.lignes = lineErrors.filter(Boolean);

    if (lignes.length === 0) errs.general = "La facture doit avoir au moins une ligne";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Build InvoiceData for PDF ──
  const buildInvoiceData = useCallback((): InvoiceData => ({
    numero: numero.trim(),
    dateEmission: dateEmission.trim(),
    clientNom: clientNom.trim(),
    clientMF: clientMF.trim() || undefined,
    clientAdresse: clientAdresse.trim() || undefined,
    clientTelephone: clientTelephone.trim() || undefined,
    clientEmail: clientEmail.trim() || undefined,
    lignes: lignes.map((l) => ({
      designation: l.designation.trim(),
      quantite: Number(l.quantite),
      prixUnitaireHT: Number(l.prixUnitaireHT),
      tauxTVA: Number(l.tauxTVA),
      totalHT: l.totalHT,
    })),
    timbreFiscal,
    montantHT,
    montantTVA,
    montantTTC,
  }), [numero, dateEmission, clientNom, clientMF, clientAdresse, clientTelephone, clientEmail, lignes, timbreFiscal, montantHT, montantTVA, montantTTC]);

  // ── Generate PDF Blob ──
  const generatePdfBlob = async (): Promise<Blob> => {
    const data = buildInvoiceData();
    const blob = await pdf(<InvoicePdfDocument data={data} />).toBlob();
    return blob;
  };

  // ── Preview ──
  const handlePreview = async () => {
    if (!validate()) return;
    setPreviewLoading(true);
    try {
      const blob = await generatePdfBlob();
      previewBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (err) {
      setErrors({ general: "Erreur lors de la génération de l'aperçu PDF" });
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── Final Creation ──
  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    setErrors({});

    try {
      const token = getToken();
      if (!token) throw new Error("Non authentifié");

      // 1. Generate PDF blob
      const blob = await generatePdfBlob();

      // 2. Upload PDF to backend
      const formData = new FormData();
      formData.append(
        "file",
        blob,
        `facture-${numero.trim()}.pdf`
      );
      const uploadRes = await fetch(`${API_URL}/upload/single`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Erreur d'upload du PDF");
      }
      const { url: fichierPdf } = await uploadRes.json();

      // 3. Create invoice in DB
      const data = buildInvoiceData();
      const invoicePayload = {
        numero: data.numero,
        commandeId: order.id,
        dateEmission: parseDate(data.dateEmission)?.toISOString() || new Date().toISOString(),
        clientNom: data.clientNom,
        clientMF: data.clientMF,
        clientAdresse: data.clientAdresse,
        clientTelephone: data.clientTelephone,
        clientEmail: data.clientEmail,
        timbreFiscal: data.timbreFiscal,
        montantHT: data.montantHT,
        montantTVA: data.montantTVA,
        montantTTC: data.montantTTC,
        montantEnLettres: montantEnLettres(data.montantTTC),
        fichierPdf,
        lignes: data.lignes,
      };

      const createRes = await fetch(`${API_URL}/invoices/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoicePayload),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Erreur lors de la création de la facture");
      }

      setSuccessMsg("Facture créée avec succès !");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrors({ general: err.message || "Erreur inattendue" });
    } finally {
      setSaving(false);
    }
  };

  // ── Cleanup preview URL ──
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6">
      <div className="relative w-full max-w-5xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-700 to-blue-600 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Créer une Facture
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              Commande #{order.id.toString().padStart(5, "0")} —{" "}
              {order.utilisateur.nom} {order.utilisateur.prenom}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        {showPreview && previewUrl ? (
          /* ── PDF Preview ── */
          <div className="flex flex-col h-[80vh]">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                Aperçu de la facture
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                  }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  ← Retour à la modification
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Création...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Créer la facture
                    </>
                  )}
                </button>
              </div>
            </div>
            <iframe
              src={previewUrl}
              className="flex-1 w-full"
              title="Aperçu PDF"
            />
          </div>
        ) : (
          /* ── Editor Form ── */
          <div className="p-6 space-y-7 overflow-y-auto max-h-[85vh]">
            {/* Success */}
            {successMsg && (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {successMsg}
              </div>
            )}

            {/* Global error */}
            {errors.general && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                </svg>
                {errors.general}
              </div>
            )}

            {/* ── Section: Informations générales ── */}
            <Section title="Informations générales" icon="📋">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Facture N°"
                  error={errors.numero}
                  hint="Généré automatiquement"
                >
                  {loadingNumber ? (
                    <div className="h-10 rounded-lg bg-gray-100 animate-pulse dark:bg-gray-800" />
                  ) : (
                    <input
                      id="invoice-numero"
                      type="text"
                      value={numero}
                      readOnly
                      className={inputClass(!!errors.numero) + " bg-gray-50 text-gray-600 cursor-not-allowed select-none"}
                    />
                  )}
                </Field>
                <Field label="Date" error={errors.dateEmission}>
                  <input
                    id="invoice-date"
                    type="text"
                    value={dateEmission}
                    onChange={(e) => setDateEmission(e.target.value)}
                    className={inputClass(!!errors.dateEmission)}
                    placeholder="JJ/MM/AAAA"
                  />
                </Field>
              </div>
            </Section>

            {/* ── Section: Client ── */}
            <Section title="Informations client" icon="👤">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nom du client" error={errors.clientNom} required>
                  <input
                    id="invoice-client-nom"
                    type="text"
                    value={clientNom}
                    onChange={(e) => setClientNom(e.target.value)}
                    className={inputClass(!!errors.clientNom)}
                    placeholder="Nom complet du client"
                  />
                </Field>
                <Field label="M.F. (Matricule Fiscal)">
                  <input
                    id="invoice-client-mf"
                    type="text"
                    value={clientMF}
                    onChange={(e) => setClientMF(e.target.value)}
                    className={inputClass(false)}
                    placeholder="ex: 1202870WAP000"
                  />
                </Field>
                <Field label="Adresse" className="md:col-span-2">
                  <input
                    id="invoice-client-adresse"
                    type="text"
                    value={clientAdresse}
                    onChange={(e) => setClientAdresse(e.target.value)}
                    className={inputClass(false)}
                    placeholder="Adresse du client"
                  />
                </Field>
                <Field label="Téléphone">
                  <input
                    id="invoice-client-tel"
                    type="text"
                    value={clientTelephone}
                    onChange={(e) => setClientTelephone(e.target.value)}
                    className={inputClass(false)}
                    placeholder="ex: +216 XX XXX XXX"
                  />
                </Field>
                <Field label="Email">
                  <input
                    id="invoice-client-email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className={inputClass(false)}
                    placeholder="email@exemple.com"
                  />
                </Field>
              </div>
            </Section>

            {/* ── Section: Produits ── */}
            <Section title="Lignes de facture" icon="📦">
              {/* Line errors */}
              {errors.lignes && errors.lignes.length > 0 && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
                  {errors.lignes.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">
                      {e}
                    </p>
                  ))}
                </div>
              )}

              {/* Table header */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-600 text-white text-left">
                      <th className="px-3 py-3 font-semibold min-w-[220px]">Désignation</th>
                      <th className="px-3 py-3 font-semibold text-center w-24">Quantité</th>
                      <th className="px-3 py-3 font-semibold text-right w-32">P.U.HT (TND)</th>
                      <th className="px-3 py-3 font-semibold text-center w-24">T.TVA %</th>
                      <th className="px-3 py-3 font-semibold text-right w-32">P.T.HT (TND)</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {lignes.map((ligne, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/60 dark:bg-gray-800/40"}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={ligne.designation}
                            onChange={(e) =>
                              updateLine(idx, "designation", e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            placeholder="Désignation du produit"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={ligne.quantite}
                            onChange={(e) =>
                              updateLine(idx, "quantite", parseFloat(e.target.value) || 0)
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={ligne.prixUnitaireHT}
                            onChange={(e) =>
                              updateLine(idx, "prixUnitaireHT", parseFloat(e.target.value) || 0)
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-right focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={ligne.tauxTVA}
                            onChange={(e) =>
                              updateLine(idx, "tauxTVA", parseFloat(e.target.value) || 0)
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                            {formatTND(ligne.totalHT)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => removeLine(idx)}
                            disabled={lignes.length <= 1}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Supprimer cette ligne"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={addLine}
                className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter une ligne
              </button>
            </Section>

            {/* ── Section: Fiscalité + Résumé ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fiscalité */}
              <Section title="Fiscalité" icon="🏛️">
                <Field label="Timbre Fiscal (TND)" error={errors.timbreFiscal}>
                  <input
                    id="invoice-timbre"
                    type="number"
                    min="0"
                    step="0.001"
                    value={timbreFiscal}
                    onChange={(e) =>
                      setTimbreFiscal(parseFloat(e.target.value) || 0)
                    }
                    className={inputClass(!!errors.timbreFiscal)}
                  />
                </Field>
              </Section>

              {/* Live Summary */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-5">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>💰</span> Résumé
                </h3>
                <div className="space-y-2">
                  <SummaryRow label="Total HT" value={`${formatTND(montantHT)} TND`} />
                  <SummaryRow label="TVA" value={`${formatTND(montantTVA)} TND`} />
                  <SummaryRow label="Timbre Fiscal" value={`${formatTND(timbreFiscal)} TND`} />
                  <div className="border-t border-blue-200 dark:border-blue-800 my-2" />
                  <SummaryRow
                    label="Total TTC"
                    value={`${formatTND(montantTTC)} TND`}
                    highlight
                  />
                </div>
                <div className="mt-4 rounded-lg bg-blue-100 dark:bg-blue-900/40 p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed italic">
                    {montantEnLettres(montantTTC)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer Actions ── */}
        {!showPreview && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Annuler
            </button>
            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                disabled={previewLoading || loadingNumber}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-700 border border-blue-300 bg-white dark:bg-gray-900 dark:text-blue-300 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/50 disabled:opacity-50 transition-colors"
              >
                {previewLoading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
                Aperçu PDF
              </button>

              <button
                onClick={handleCreate}
                disabled={saving || loadingNumber}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-60 transition-colors shadow-md shadow-blue-200 dark:shadow-none"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Créer la facture
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${highlight ? "font-bold text-blue-800 dark:text-blue-200 text-base" : "text-sm text-gray-700 dark:text-gray-300"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

const inputClass = (hasError: boolean) =>
  `w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none transition-colors dark:bg-gray-800 dark:text-white ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500 dark:bg-red-950/20 dark:border-red-700"
      : "border-gray-200 bg-white focus:border-blue-400 dark:border-gray-700"
  }`;
