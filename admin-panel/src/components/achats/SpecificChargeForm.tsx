"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();
export type ChargeFormCategory = "CHARGES" | "CNSS" | "NEUF_BA4A";

const metadata = {
  CHARGES: { title: "Charge générale", path: "/charges" },
  CNSS: { title: "Déclaration CNSS", path: "/charges/cnss" },
  NEUF_BA4A: { title: "Charge 9BA4A", path: "/charges/9ba4a" },
} as const;

const initialValues = {
  numeroCharge: "", numeroDeclaration: "", numero: "", date: new Date().toISOString().slice(0, 10),
  nature: "", description: "", periodeConcernee: "", periodeDeclaration: "", beneficiaire: "", matriculeEmployeur: "",
  nombreSalaries: "", masseSalariale: "", partPatronale: "", partSalariale: "", montantHT: "", tauxTVA: "19", montantTTC: "", montant: "",
  dateLimitePaiement: "", datePaiement: "", modePaiement: "Virement", statutPaiement: "NON_PAYEE", referenceFacture: "", referencePaiement: "", notes: "", devise: "TND",
};

// Confidence badge for auto-filled fields
type FieldState = "auto-high" | "auto-low" | "manual";

function ConfidenceBadge({ state }: { state: FieldState }) {
  if (state === "auto-high") {
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        Détecté
      </span>
    );
  }
  if (state === "auto-low") {
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" /></svg>
        À vérifier
      </span>
    );
  }
  return null;
}

function Field({ label, name, value, onChange, type = "text", required = false, placeholder, fieldState = "manual" }: { label: string; name: string; value: string; onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; type?: string; required?: boolean; placeholder?: string; fieldState?: FieldState }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      <span className="flex items-center">
        {label}{required && " *"}
        <ConfidenceBadge state={fieldState} />
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:text-white transition-colors ${fieldState !== "manual"
          ? "border-emerald-400 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/10"
          : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
          }`}
      />
    </label>
  );
}

type OcrState = "idle" | "analyzing" | "done" | "error";

interface CnssOcrData {
  date?: { value: string | null; confidence: number };
  receiptNumber?: { value: string | null; confidence: number };
  transactionReference?: { value: string | null; confidence: number };
  amount?: { value: number | null; confidence: number };
  affiliationNumber?: { value: string | null; confidence: number };
  receivedFrom?: { value: string | null; confidence: number };
  amountInWords?: { value: string | null; confidence: number };
  paymentObject?: { value: string | null; confidence: number };
  paymentMethod?: { value: string | null; confidence: number };
  warnings?: string[];
}

export default function SpecificChargeForm({ categorie }: { categorie: ChargeFormCategory }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const meta = metadata[categorie];
  const [values, setValues] = useState(initialValues);
  const [fieldStates, setFieldStates] = useState<Partial<Record<keyof typeof initialValues, FieldState>>>({});
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pieceJustificativeUrl, setPieceJustificativeUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [ocrState, setOcrState] = useState<OcrState>("idle");
  const [ocrWarnings, setOcrWarnings] = useState<string[]>([]);
  const [cnssOcrMontant, setCnssOcrMontant] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCnss = (Number(values.partPatronale) || 0) + (Number(values.partSalariale) || 0);

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Once user manually edits an auto-filled field, clear its badge
    setFieldStates((prev) => ({ ...prev, [name]: "manual" }));
  };

  const setField = (name: keyof typeof initialValues, value: string, confidence: number) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldStates((prev) => ({ ...prev, [name]: confidence >= 0.5 ? "auto-high" : "auto-low" }));
  };

  const applyFile = (selected: File) => {
    setFile(selected);
    setPieceJustificativeUrl("");
    setOcrState("idle");
    setOcrWarnings([]);
    setCnssOcrMontant(null);
    setMessage("");
    // Build preview URL for images
    if (selected.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(selected));
    } else {
      setFilePreview(null);
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (selected) applyFile(selected);
  };

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && (dropped.type.startsWith("image/") || dropped.type === "application/pdf")) {
      applyFile(dropped);
    }
  };

  // CNSS-specific OCR
  const analyzeCnssOcr = async () => {
    if (!file) { setError("Importez un reçu CNSS avant de lancer l'analyse."); return; }
    setOcrState("analyzing"); setError(""); setOcrWarnings([]);
    try {
      const data = new FormData(); data.append("file", file);
      const response = await fetch(`${API_URL}/achats/charges/cnss/ocr`, {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: data,
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Analyse OCR indisponible");

      const ocr: CnssOcrData = payload.data ?? {};
      setOcrWarnings(ocr.warnings ?? []);

      // Map OCR fields to form
      if (ocr.date?.value) setField("date", ocr.date.value, ocr.date.confidence);
      if (ocr.receiptNumber?.value && !values.numeroDeclaration) setField("numeroDeclaration", String(ocr.receiptNumber.value), ocr.receiptNumber.confidence);
      if (ocr.transactionReference?.value) setField("referencePaiement", String(ocr.transactionReference.value), ocr.transactionReference.confidence);
      if (ocr.affiliationNumber?.value) setField("matriculeEmployeur", String(ocr.affiliationNumber.value), ocr.affiliationNumber.confidence);
      if (ocr.paymentMethod?.value) {
        setValues((prev) => ({ ...prev, modePaiement: String(ocr.paymentMethod!.value) }));
        setFieldStates((prev) => ({ ...prev, modePaiement: ocr.paymentMethod!.confidence >= 0.5 ? "auto-high" : "auto-low" }));
      }
      // Amount shown as info only — user fills partPatronale/partSalariale manually
      if (ocr.amount?.value !== null && ocr.amount?.value !== undefined) {
        setCnssOcrMontant(ocr.amount.value);
      }
      // Extra info → notes
      const notesParts: string[] = [];
      if (ocr.receivedFrom?.value) notesParts.push(`Reçu de : ${ocr.receivedFrom.value}`);
      if (ocr.amountInWords?.value) notesParts.push(`Somme : ${ocr.amountInWords.value}`);
      if (ocr.paymentObject?.value) notesParts.push(`Objet : ${ocr.paymentObject.value}`);
      if (notesParts.length > 0) {
        setValues((prev) => ({ ...prev, notes: [prev.notes, ...notesParts].filter(Boolean).join("\n") }));
      }

      setOcrState("done");
      setMessage("Les informations ont été détectées automatiquement. Veuillez les vérifier avant d'enregistrer.");
    } catch (err: any) {
      setOcrState("error");
      setError(err.message || "Impossible de détecter automatiquement les informations du reçu.");
    }
  };

  // Generic OCR for CHARGES / NEUF_BA4A
  const analyzeGenericOcr = async () => {
    if (!file) return setError("Prenez une photo ou choisissez un PDF avant de lancer l'OCR.");
    setOcrLoading(true); setError("");
    try {
      const data = new FormData(); data.append("file", file);
      const response = await fetch(`${API_URL}/achats/factures/ocr`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: data });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Analyse OCR indisponible");
      const invoice = payload.data?.invoice ?? {};
      const firstLine = payload.data?.lines?.[0];
      if (invoice.numeroFacture?.value) {
        const number = String(invoice.numeroFacture.value);
        if (categorie === "CHARGES") setValues((p) => ({ ...p, numeroCharge: number }));
        if (categorie === "NEUF_BA4A") setValues((p) => ({ ...p, numero: number }));
      }
      if (invoice.dateFacture?.value) setValues((p) => ({ ...p, date: String(invoice.dateFacture.value) }));
      if (invoice.fournisseur?.value) setValues((p) => ({ ...p, beneficiaire: String(invoice.fournisseur.value) }));
      if (invoice.totalTTC?.value !== undefined) {
        const total = String(invoice.totalTTC.value);
        if (categorie === "CHARGES") setValues((p) => ({ ...p, montantTTC: total }));
        if (categorie === "NEUF_BA4A") setValues((p) => ({ ...p, montant: total }));
      }
      if (firstLine?.designation?.value) {
        if (categorie === "CHARGES") setValues((p) => ({ ...p, nature: String(firstLine.designation.value) }));
        if (categorie === "NEUF_BA4A") setValues((p) => ({ ...p, description: String(firstLine.designation.value) }));
      }
      setMessage("Données OCR ajoutées au formulaire. Vérifiez-les avant validation.");
    } catch (err: any) { setError(err.message || "Impossible d'analyser le document"); } finally { setOcrLoading(false); }
  };

  const uploadDocument = async () => {
    if (!file || pieceJustificativeUrl) return pieceJustificativeUrl;
    const data = new FormData(); data.append("file", file);
    const response = await fetch(`${API_URL}/achats/charges/document`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: data });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Impossible d'enregistrer la pièce justificative");
    setPieceJustificativeUrl(payload.url);
    return payload.url as string;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const documentUrl = await uploadDocument();
      const response = await fetch(`${API_URL}/achats/charges/${categorie}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ ...values, pieceJustificativeUrl: documentUrl || null }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Impossible d'enregistrer la charge");
      router.push(meta.path);
    } catch (err: any) { setError(err.message || "Erreur d'enregistrement"); } finally { setSaving(false); }
  };

  const paymentFields = (
    <>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <span className="flex items-center">
          Mode de paiement
          <ConfidenceBadge state={fieldStates.modePaiement ?? "manual"} />
        </span>
        <select name="modePaiement" value={values.modePaiement} onChange={onChange} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:text-white transition-colors ${fieldStates.modePaiement && fieldStates.modePaiement !== "manual" ? "border-emerald-400 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/10" : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"}`}>
          <option>Virement</option><option>Espèces</option><option>Chèque</option><option>Carte</option><option>Prélèvement</option>
        </select>
      </label>
      <Field label="Date de paiement" name="datePaiement" type="date" value={values.datePaiement} onChange={onChange} />
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut de paiement
        <select name="statutPaiement" value={values.statutPaiement} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          <option value="NON_PAYEE">Impayée</option><option value="PARTIELLEMENT_PAYEE">Partielle</option><option value="PAYEE">Payée</option>
        </select>
      </label>
    </>
  );

  // ── CNSS receipt upload section ──────────────────────────────────────────────
  const cnssReceiptSection = (
    <section className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Reçu CNSS</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Importez le reçu pour remplir automatiquement le formulaire</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${isDragOver
          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
          : file
            ? "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/10"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-blue-500"
          }`}
      >
        <input ref={fileInputRef} className="hidden" type="file" accept="image/jpeg,image/jpg,image/png,application/pdf" onChange={handleFile} />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            {/* Image preview */}
            {filePreview ? (
              <img src={filePreview} alt="Aperçu du reçu" className="max-h-48 max-w-xs rounded-lg border border-gray-200 object-contain shadow-sm dark:border-gray-600" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB — cliquez pour changer</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Glissez-déposez le reçu ici</p>
              <p className="text-sm text-gray-500">ou cliquez pour parcourir</p>
              <p className="mt-1 text-xs text-gray-400">JPG, JPEG, PNG, PDF — max. 15 MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={analyzeCnssOcr}
          disabled={!file || ocrState === "analyzing"}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ocrState === "analyzing" ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V2a10 10 0 100 20v-4l-3 3 3 3v-2a8 8 0 01-8-8z" /></svg>
              Analyse en cours…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              Analyser le reçu
            </>
          )}
        </button>

        {/* Status indicator */}
        {ocrState === "done" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Analyse terminée
          </span>
        )}
        {ocrState === "error" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Erreur
          </span>
        )}
      </div>

      {/* OCR success message */}
      {ocrState === "done" && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-300">Les informations ont été détectées automatiquement.</p>
            <p className="text-blue-700 dark:text-blue-400">Veuillez les vérifier avant d'enregistrer.</p>
          </div>
        </div>
      )}

      {/* OCR montant info */}
      {cnssOcrMontant !== null && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
          <svg className="h-4 w-4 flex-shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" /></svg>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Montant total détecté sur le reçu : {cnssOcrMontant.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} TND</span>
            {" "}— Saisissez la part patronale et la part salariale séparément ci-dessous.
          </p>
        </div>
      )}

      {/* OCR warnings */}
      {ocrWarnings.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="mb-1 text-xs font-semibold text-amber-800 dark:text-amber-300">Champs non détectés :</p>
          <ul className="space-y-0.5">
            {ocrWarnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700 dark:text-amber-400">• {w}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );

  // ── Generic OCR section (CHARGES / NEUF_BA4A) ────────────────────────────────
  const genericOcrSection = (
    <section className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 font-semibold">Pièce justificative et OCR</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white">
          Prendre une photo / choisir un fichier
          <input className="hidden" type="file" accept="image/*,.pdf" capture="environment" onChange={handleFile} />
        </label>
        <button type="button" onClick={analyzeGenericOcr} disabled={!file || ocrLoading} className="rounded-lg border border-brand-500 px-4 py-2 text-sm text-brand-600 disabled:opacity-50">
          {ocrLoading ? "Analyse…" : "Extraire avec OCR"}
        </button>
        {file && <span className="text-sm text-gray-500">{file.name}</span>}
      </div>
    </section>
  );

  return (
    <main className="mx-auto max-w-6xl p-6">
      <PageBreadcrumb pageTitle={`Nouvelle ${meta.title}`} />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{meta.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {categorie === "CNSS" ? "Importez un reçu CNSS pour remplir automatiquement le formulaire." : "Saisie manuelle, photo/PDF et vérification OCR."}
          </p>
        </div>
        <Link href={meta.path} className="rounded-lg border px-4 py-2 text-sm">Retour</Link>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}
      {message && ocrState !== "done" && (
        <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">{message}</p>
      )}

      <form onSubmit={submit} className="space-y-6">
        {/* OCR section — CNSS specific or generic */}
        {categorie === "CNSS" ? cnssReceiptSection : genericOcrSection}

        {/* CHARGES fields */}
        {categorie === "CHARGES" && (
          <section className="grid grid-cols-1 gap-4 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-3 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="col-span-full font-semibold">Informations de la charge</h2>
            <Field label="Numéro de charge" name="numeroCharge" value={values.numeroCharge} onChange={onChange} required />
            <Field label="Date" name="date" type="date" value={values.date} onChange={onChange} required />
            <Field label="Période concernée" name="periodeConcernee" value={values.periodeConcernee} onChange={onChange} placeholder="Ex. septembre 2026" />
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nature *
              <select name="nature" value={values.nature} onChange={onChange} required className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option value="">Sélectionner</option><option>Loyer</option><option>Électricité</option><option>Téléphone</option><option>Transport</option><option>Eau</option><option>Maintenance</option><option>Autre</option>
              </select>
            </label>
            <Field label="Bénéficiaire" name="beneficiaire" value={values.beneficiaire} onChange={onChange} required />
            <Field label="Référence de facture" name="referenceFacture" value={values.referenceFacture} onChange={onChange} />
            <Field label="Montant HT" name="montantHT" type="number" value={values.montantHT} onChange={onChange} required />
            <Field label="TVA (%)" name="tauxTVA" type="number" value={values.tauxTVA} onChange={onChange} required />
            <Field label="Montant TTC" name="montantTTC" type="number" value={values.montantTTC} onChange={onChange} />
            {paymentFields}
            <label className="col-span-full block text-sm font-medium">Description
              <textarea name="description" value={values.description} onChange={onChange} className="mt-1 w-full rounded-lg border p-3 dark:bg-gray-800" rows={3} />
            </label>
          </section>
        )}

        {/* CNSS fields */}
        {categorie === "CNSS" && (
          <section className="grid grid-cols-1 gap-4 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-3 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="col-span-full font-semibold">Informations CNSS</h2>
            <Field label="Numéro de déclaration" name="numeroDeclaration" value={values.numeroDeclaration} onChange={onChange} required fieldState={fieldStates.numeroDeclaration ?? "manual"} />
            <Field label="Période de déclaration" name="periodeDeclaration" value={values.periodeDeclaration} onChange={onChange} required placeholder="Ex. 3e trimestre 2026" />
            <Field label="Matricule employeur / N° affiliation" name="matriculeEmployeur" value={values.matriculeEmployeur} onChange={onChange} required fieldState={fieldStates.matriculeEmployeur ?? "manual"} />
            <Field label="Nombre de salariés" name="nombreSalaries" type="number" value={values.nombreSalaries} onChange={onChange} required />
            <Field label="Masse salariale" name="masseSalariale" type="number" value={values.masseSalariale} onChange={onChange} required />
            <Field label="Part patronale" name="partPatronale" type="number" value={values.partPatronale} onChange={onChange} required />
            <Field label="Part salariale" name="partSalariale" type="number" value={values.partSalariale} onChange={onChange} required />
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total CNSS
              <input readOnly value={totalCnss.toFixed(3)} className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </label>
            <Field label="Date" name="date" type="date" value={values.date} onChange={onChange} required fieldState={fieldStates.date ?? "manual"} />
            <Field label="Date limite de paiement" name="dateLimitePaiement" type="date" value={values.dateLimitePaiement} onChange={onChange} />
            <Field label="Référence de paiement / Transaction" name="referencePaiement" value={values.referencePaiement} onChange={onChange} fieldState={fieldStates.referencePaiement ?? "manual"} />
            {paymentFields}
          </section>
        )}

        {/* NEUF_BA4A fields */}
        {categorie === "NEUF_BA4A" && (
          <section className="grid grid-cols-1 gap-4 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-3 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="col-span-full font-semibold">Informations 9BA4A</h2>
            <Field label="Numéro" name="numero" value={values.numero} onChange={onChange} required />
            <Field label="Date" name="date" type="date" value={values.date} onChange={onChange} required />
            <Field label="Bénéficiaire" name="beneficiaire" value={values.beneficiaire} onChange={onChange} required />
            <Field label="Montant" name="montant" type="number" value={values.montant} onChange={onChange} required />
            {paymentFields}
            <label className="col-span-full block text-sm font-medium">Description *
              <textarea name="description" value={values.description} onChange={onChange} required className="mt-1 w-full rounded-lg border p-3 dark:bg-gray-800" rows={3} />
            </label>
          </section>
        )}

        <section className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <label className="block text-sm font-medium">Notes
            <textarea name="notes" value={values.notes} onChange={onChange} className="mt-1 w-full rounded-lg border p-3 dark:bg-gray-800" rows={4} placeholder="Notes internes et observations" />
          </label>
        </section>

        <button type="submit" disabled={saving} className="rounded-lg bg-brand-500 px-5 py-3 font-semibold text-white disabled:opacity-50">
          {saving ? "Validation…" : "Valider et enregistrer la charge"}
        </button>
      </form>
    </main>
  );
}
