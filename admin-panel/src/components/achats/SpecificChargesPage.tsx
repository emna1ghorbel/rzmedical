"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import type { ChargeFormCategory } from "./SpecificChargeForm";

const API_URL = getApiUrl();
const meta = { CHARGES: { title: "Charges générales", path: "/charges" }, CNSS: { title: "CNSS", path: "/charges/cnss" }, NEUF_BA4A: { title: "9BA4A", path: "/charges/9ba4a" } } as const;
export default function SpecificChargesPage({ categorie }: { categorie: ChargeFormCategory }) {
  const { getToken } = useAuth(); const [items, setItems] = useState<any[]>([]); const [error, setError] = useState(""); const current = meta[categorie];
  useEffect(() => { fetch(`${API_URL}/achats/charges/${categorie}`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setItems(d); }).catch(e => setError(e.message)); }, [categorie, getToken]);
  const amount = (x: any) => Number(x.montantTTC ?? x.totalCnss ?? x.montant ?? 0).toFixed(3);
  const number = (x: any) => x.numeroCharge ?? x.numeroDeclaration ?? x.numero;
  return <main className="mx-auto max-w-7xl p-6"><div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-bold">{current.title}</h1><p className="text-sm text-gray-500">Charges indépendantes des achats et du stock.</p></div><Link href={`${current.path}/new`} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">+ Ajouter une charge</Link></div>{error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}<div className="overflow-hidden rounded-xl border bg-white dark:bg-gray-900"><table className="w-full text-sm"><thead className="bg-gray-50 text-left dark:bg-gray-800"><tr><th className="p-3">Numéro</th><th className="p-3">Description / nature</th><th className="p-3">Bénéficiaire</th><th className="p-3">Montant</th><th className="p-3">Statut</th></tr></thead><tbody>{items.map(item => <tr key={item.id} className="border-t"><td className="p-3">{number(item)}</td><td className="p-3">{item.nature ?? item.periodeDeclaration ?? item.description}</td><td className="p-3">{item.beneficiaire ?? "CNSS"}</td><td className="p-3">{amount(item)} TND</td><td className="p-3">{item.statutPaiement}</td></tr>)}{!items.length && <tr><td className="p-8 text-center text-gray-500" colSpan={5}>Aucune charge enregistrée.</td></tr>}</tbody></table></div></main>;
}
