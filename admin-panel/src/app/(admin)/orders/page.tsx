"use client";
import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import InvoiceEditorModal from "@/components/invoices/InvoiceEditorModal";

const API_URL = getApiUrl();

interface Utilisateur {
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
}

interface LigneCommande {
  produitId: number;
  quantite: number;
  prixUnitaire: number;
  produit: {
    id: number;
    nom: string;
    reference: string;
  };
}

interface Commande {
  id: number;
  creeLe: string;
  total: number;
  statut: "EN_ATTENTE" | "PAYEE" | "EXPEDIEE" | "LIVREE" | "ANNULEE";
  utilisateur: Utilisateur;
  lignes: LigneCommande[];
  facture?: { id: number; numero: string; fichierPdf: string | null };
}

export default function OrdersPage() {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editingLines, setEditingLines] = useState<LigneCommande[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [savingItems, setSavingItems] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Commande | null>(null);

  const toggleDetails = (id: number) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
    if (editingOrderId && editingOrderId !== id) setEditingOrderId(null);
  };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) setAllProducts(await res.json());
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("Non authentifié");
      const url = activeStatus === "ALL" ? `${API_URL}/orders/admin/all` : `${API_URL}/orders/admin/all?status=${activeStatus}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erreur lors du chargement des commandes");
      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [activeStatus, getToken]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      const token = getToken();
      if (!token) throw new Error("Non authentifié");
      const res = await fetch(`${API_URL}/orders/admin/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erreur de mise à jour");
      fetchOrders();
    } catch (err) {
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const startEditing = (order: Commande) => {
    setEditingOrderId(order.id);
    setEditingLines(JSON.parse(JSON.stringify(order.lignes)));
  };

  const saveOrderItems = async (orderId: number) => {
    setSavingItems(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Non authentifié");
      const res = await fetch(`${API_URL}/orders/admin/${orderId}/items`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lignes: editingLines.map(l => ({ produitId: l.produitId, quantite: l.quantite }))
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la sauvegarde");
      
      setEditingOrderId(null);
      fetchOrders();
    } catch (err: any) {
      alert(err.message || "Erreur de sauvegarde");
    } finally {
      setSavingItems(false);
    }
  };

  const updateLineQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const newLines = [...editingLines];
    newLines[index].quantite = newQty;
    setEditingLines(newLines);
  };

  const removeLine = (index: number) => {
    const newLines = [...editingLines];
    newLines.splice(index, 1);
    setEditingLines(newLines);
  };

  const addProductToOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = Number(e.target.value);
    if (!pId) return;
    
    // Check if product is already in order
    const exists = editingLines.findIndex(l => l.produitId === pId);
    if (exists !== -1) {
      updateLineQty(exists, editingLines[exists].quantite + 1);
      e.target.value = "";
      return;
    }

    const prod = allProducts.find(p => p.id === pId);
    if (prod) {
      setEditingLines([...editingLines, {
        produitId: prod.id,
        quantite: 1,
        prixUnitaire: prod.prix, // Note: real price is recalculated on backend anyway
        produit: { id: prod.id, nom: prod.nom, reference: prod.reference }
      }]);
    }
    e.target.value = "";
  };

  const getStatusBadgeColor = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE": return "warning";
      case "PAYEE": return "info";
      case "EXPEDIEE": return "info";
      case "LIVREE": return "success";
      case "ANNULEE": return "error";
      default: return "light";
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE": return "En attente";
      case "PAYEE": return "Payée";
      case "EXPEDIEE": return "Expédiée";
      case "LIVREE": return "Livrée";
      case "ANNULEE": return "Annulée";
      default: return statut;
    }
  };

  // Filter local search
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    const searchString = `${o.id} ${o.utilisateur.nom} ${o.utilisateur.prenom} ${o.utilisateur.email}`.toLowerCase();
    return searchString.includes(lowerQ);
  });

  return (
    <div>
      <PageBreadcrumb pageTitle="Commandes" />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button onClick={fetchOrders} className="ml-3 underline font-medium">Réessayer</button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            placeholder="Rechercher par ID, Nom, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-sm rounded-xl border px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveStatus("ALL")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeStatus === "ALL" ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`}
          >
            Toutes
          </button>
          <button
            onClick={() => setActiveStatus("EN_ATTENTE")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeStatus === "EN_ATTENTE" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`}
          >
            En attente
          </button>
          <button
            onClick={() => setActiveStatus("PAYEE")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeStatus === "PAYEE" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`}
          >
            En cours (Payée/Expédiée)
          </button>
          <button
            onClick={() => setActiveStatus("LIVREE")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeStatus === "LIVREE" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`}
          >
            Livrées
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
              <TableRow>
                <TableCell isHeader>N° Cmd</TableCell>
                <TableCell isHeader>Date</TableCell>
                <TableCell isHeader>Client</TableCell>
                <TableCell isHeader>Total</TableCell>
                <TableCell isHeader>Statut</TableCell>
                <TableCell isHeader>Facture</TableCell>
                <TableCell isHeader className="text-right">Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Chargement des commandes...</TableCell></TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Aucune commande trouvée.</TableCell></TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <TableRow className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/30 ${expandedOrderId === order.id ? 'bg-gray-50 dark:bg-gray-800/20' : ''}`}>
                      <TableCell className="font-medium text-gray-800 dark:text-gray-200">
                        #{order.id.toString().padStart(5, '0')}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(order.creeLe).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{order.utilisateur.nom} {order.utilisateur.prenom}</p>
                          <p className="text-xs text-gray-500">{order.utilisateur.email}</p>
                          {order.utilisateur.telephone && (
                            <a 
                              href={`tel:${order.utilisateur.telephone}`}
                              className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                              title="Appeler le client"
                            >
                              📞 {order.utilisateur.telephone}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-white">
                        {order.total.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                        <div className="text-xs font-normal text-gray-400">{order.lignes.length} article(s)</div>
                      </TableCell>
                      <TableCell>
                        <Badge color={getStatusBadgeColor(order.statut) as any}>
                          {getStatusLabel(order.statut)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.facture ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              N° {order.facture.numero}
                            </span>
                            <div className="flex gap-2">
                              <a
                                href={`/invoices`}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                👁 Voir
                              </a>
                              {order.facture.fichierPdf && (
                                <a
                                  href={`${API_URL.replace('/api', '')}${order.facture.fichierPdf}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-gray-600 hover:underline flex items-center gap-1"
                                >
                                  ↓ PDF
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedOrderForInvoice(order)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                          >
                            📄 Créer facture
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleDetails(order.id)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            {expandedOrderId === order.id ? 'Masquer détails' : 'Voir détails'}
                          </button>
                          <select
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            value={order.statut}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                          >
                            <option value="EN_ATTENTE">En attente</option>
                            <option value="PAYEE">Payée</option>
                            <option value="EXPEDIEE">Expédiée</option>
                            <option value="LIVREE">Livrée</option>
                            <option value="ANNULEE">Annulée</option>
                          </select>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {expandedOrderId === order.id && (
                      <TableRow className="bg-gray-50 dark:bg-gray-800/10 border-b border-gray-100 dark:border-gray-800">
                        <TableCell colSpan={6} className="p-0">
                          <div className="p-4 sm:p-6 border-l-4 border-brand-500">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                {editingOrderId === order.id ? "Modifier la commande" : "Contenu de la commande"}
                              </h4>
                              {editingOrderId !== order.id ? (
                                <button
                                  onClick={() => startEditing(order)}
                                  className="text-sm text-brand-600 hover:underline font-medium"
                                >
                                  Modifier le contenu
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingOrderId(null)}
                                    className="px-3 py-1.5 text-sm text-gray-600 border rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    onClick={() => saveOrderItems(order.id)}
                                    disabled={savingItems}
                                    className="px-3 py-1.5 text-sm text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
                                  >
                                    {savingItems ? "Sauvegarde..." : "Enregistrer"}
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {editingOrderId === order.id && (
                              <div className="mb-4">
                                <select 
                                  onChange={addProductToOrder}
                                  value=""
                                  className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                >
                                  <option value="" disabled>+ Ajouter un produit...</option>
                                  {allProducts.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.reference} - {p.nom} ({(p.prix * (1 - (p.remise||0)/100)).toFixed(3)} DT)
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {(editingOrderId === order.id ? editingLines : order.lignes).map((ligne, idx) => (
                                <div key={idx} className="relative rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                  <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 pr-6" title={ligne.produit.nom}>
                                    {ligne.produit.nom}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Réf: {ligne.produit.reference}</p>
                                  
                                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
                                    {editingOrderId === order.id ? (
                                      <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-500">Qté:</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={ligne.quantite}
                                          onChange={(e) => updateLineQty(idx, parseInt(e.target.value) || 1)}
                                          className="w-16 rounded border px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-600 dark:text-gray-300">Qté : <strong>{ligne.quantite}</strong></span>
                                    )}
                                    
                                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                                      {(ligne.prixUnitaire * ligne.quantite).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                                    </span>
                                  </div>

                                  {editingOrderId === order.id && (
                                    <button 
                                      onClick={() => removeLine(idx)}
                                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                      title="Retirer ce produit"
                                    >
                                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedOrderForInvoice && (
        <InvoiceEditorModal
          order={selectedOrderForInvoice as any}
          onClose={() => setSelectedOrderForInvoice(null)}
          onSuccess={() => {
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
