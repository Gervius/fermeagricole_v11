// resources/js/Pages/Invoices/Show.tsx
import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    ArrowLeft, Download, MessageCircle, CheckCircle, XCircle,
    Clock, User, FileText, Egg, Users, DollarSign, Calendar,
    X
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useToasts } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import { invoicesIndex, invoicesDownloadPdf,  invoicesApprove, invoicesAddPayment } from '@/routes';
interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    itemable_type: string; // 'App\Models\EggMovement' ou 'App\Models\Flock'
    itemable_id?: number;
}

interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    method: string; // 'Orange Money', 'Wave', 'Espèces', etc.
    reference?: string;
}

interface Invoice {
    can_add_payment: boolean;
    id: number;
    number: string;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    date: string;
    due_date: string | null;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    paid_amount: number;
    remaining_amount: number;
    status: 'draft' | 'sent'  | 'cancelled';
    payment_status: 'unpaid' | 'partial' | 'paid';
    items: InvoiceItem[];
    payments: Payment[];
    notes?: string;
    created_by: string;
    created_at: string;
    can_approve?: boolean;
    can_cancel?: boolean;
}

interface PartnerStatementLine {
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

interface Props {
    invoice: Invoice;
    partner?: {
        id: number;
        name: string;
        phone?: string;
        email?: string;
        balance: number;
        statement: PartnerStatementLine[];
    };
    flash?: { success?: string; error?: string };
}

export default function InvoiceShow({ invoice, partner, flash }: Props) {
    const { addToast } = useToasts();
    const [activeTab, setActiveTab] = useState<'invoice' | 'statement'>('invoice');


    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: invoice.remaining_amount,
        payment_date: new Date().toISOString().split('T')[0],
        method: 'Orange Money',
        reference: '',
    });



    if (flash?.success) addToast({ message: flash.success, type: 'success' });
    if (flash?.error) addToast({ message: flash.error, type: 'error' });

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(invoicesAddPayment.url(invoice.id), paymentForm, {
            onSuccess: () => {
                setShowPaymentModal(false);
                addToast({ message: 'Paiement enregistré', type: 'success' });
                // Recharger les données de la facture pour mettre à jour les montants
                router.reload({ only: ['invoice'] });
            },
            onError: (err: any) => {
                addToast({ message: err.message || 'Erreur lors du paiement', type: 'error' });
            },
        });
    };

    const handleWhatsApp = () => {
        if (!invoice.customer_phone) {
            addToast({ message: 'Numéro de téléphone client manquant', type: 'error' });
            return;
        }
        const message = `Bonjour ${invoice.customer_name}, voici votre facture ${invoice.number} du ${format(parseISO(invoice.date), 'dd/MM/yyyy')} d'un montant de ${formatCurrency(invoice.total)}. Montant dû : ${formatCurrency(invoice.remaining)}. Merci.`;
        const url = `https://wa.me/${invoice.customer_phone.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleDownloadPdf = () => {
        router.get(invoicesDownloadPdf.url(invoice.id), {}, { preserveState: true });
    };

    const getItemIcon = (type: string) => {
        if (type.includes('Egg')) return <Egg className="w-4 h-4 text-amber-600" />;
        if (type.includes('Flock')) return <Users className="w-4 h-4 text-emerald-600" />;
        return <FileText className="w-4 h-4 text-stone-400" />;
    };

    const handleApprove = () => {
        router.post(invoicesApprove.url(invoice.id), {}, {
            onSuccess: () => {
                addToast({ message: 'Facture approuvée', type: 'success' });
                // Recharger les données pour mettre à jour le statut
                router.reload({ only: ['invoice'] });
            },
            onError: (err: any) => {
                addToast({ message: err.message || 'Erreur lors de l\'approbation', type: 'error' });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Facturation', href: invoicesIndex.url() },
            { title: `Facture ${invoice.number}`, href: '#' }
        ]}>
            <Head title={`Facture ${invoice.number}`} />
            <div className="max-w-5xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">

                    {/* En-tête avec actions */}
                    <div className="px-6 py-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-4">
                        <button
                            onClick={() => router.get(invoicesIndex.url())}
                            className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
                        >
                            <ArrowLeft className="w-4 h-4" /> Retour
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={handleWhatsApp}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
                                disabled={!invoice.customer_phone}
                            >
                                <MessageCircle className="w-4 h-4" /> WhatsApp
                            </button>
                            <button
                                onClick={handleDownloadPdf}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" /> PDF
                            </button>
                            {invoice.status === 'draft' && invoice.can_approve && (
                                <button
                                    onClick={handleApprove}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" /> Approuver
                                </button>
                            )}
                            {invoice.can_add_payment && (
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                                >
                                    <DollarSign className="w-4 h-4" /> Ajouter un paiement
                                </button>
                            )}

                        </div>
                    </div>

                    {/* Onglets */}
                    <div className="px-6 pt-4 border-b border-stone-100">
                        <div className="flex gap-6">
                            <button
                                onClick={() => setActiveTab('invoice')}
                                className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'invoice' ? 'text-indigo-600' : 'text-stone-500 hover:text-stone-700'}`}
                            >
                                Détail de la facture
                                {activeTab === 'invoice' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
                            </button>
                            {partner && (
                                <button
                                    onClick={() => setActiveTab('statement')}
                                    className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'statement' ? 'text-indigo-600' : 'text-stone-500 hover:text-stone-700'}`}
                                >
                                    Relevé de compte client
                                    {activeTab === 'statement' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-6">
                        {activeTab === 'invoice' && (
                            <div className="space-y-6">
                                {/* Info client et montants */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="col-span-1">
                                        <h3 className="text-sm font-medium text-stone-500 mb-2 flex items-center gap-1">
                                            <User className="w-4 h-4" /> Client
                                        </h3>
                                        <p className="text-base font-semibold text-stone-900">{invoice.customer_name}</p>
                                        {invoice.customer_phone && <p className="text-sm text-stone-600">📱 {invoice.customer_phone}</p>}
                                        {invoice.customer_email && <p className="text-sm text-stone-600">✉️ {invoice.customer_email}</p>}
                                    </div>
                                    <div className="col-span-2 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-stone-500">Montant total</p>
                                            <p className="text-xl font-bold text-stone-900">{formatCurrency(invoice.total)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-stone-500">Déjà payé</p>
                                            <p className="text-xl font-bold text-emerald-600">{formatCurrency(invoice.paid_amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-stone-500">Reste à payer</p>
                                            <p className="text-xl font-bold text-amber-600">{formatCurrency(invoice.remaining_amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-stone-500">Échéance</p>
                                            <p className="text-base font-medium text-stone-700 flex items-center gap-1">
                                                <Calendar className="w-4 h-4 text-stone-400" />
                                                {invoice.due_date ? format(parseISO(invoice.due_date), 'dd MMM yyyy', { locale: fr }) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Lignes de facture */}
                                <div>
                                    <h3 className="text-sm font-medium text-stone-700 mb-3">Articles facturés</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-stone-50 border-y border-stone-200">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-stone-500">Description</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-stone-500">Qté</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-stone-500">Prix unitaire</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-stone-500">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100">
                                                {invoice.items.map(item => (
                                                    <tr key={item.id}>
                                                        <td className="px-4 py-3 flex items-center gap-2">
                                                            {getItemIcon(item.itemable_type)}
                                                            <span>{item.description}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-stone-50 border-t border-stone-200">
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 text-right font-semibold">Sous-total</td>
                                                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(invoice.subtotal)}</td>
                                                </tr>
                                                {invoice.tax_amount > 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-3 text-right text-sm text-stone-600">TVA ({invoice.tax_rate}%)</td>
                                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(invoice.tax_amount)}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 text-right font-bold text-base">Total TTC</td>
                                                    <td className="px-4 py-3 text-right font-bold text-base text-indigo-700">{formatCurrency(invoice.total)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Historique des paiements */}
                                {invoice.payments.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-stone-700 mb-3">Paiements reçus</h3>
                                        <div className="space-y-2">
                                            {invoice.payments.map(payment => (
                                                <div key={payment.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-emerald-100 rounded-full text-emerald-600">
                                                            <DollarSign className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-stone-900">{formatCurrency(payment.amount)}</p>
                                                            <p className="text-xs text-stone-500">{payment.method} {payment.reference && `• ${payment.reference}`}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-stone-500">{format(parseISO(payment.payment_date), 'dd/MM/yyyy')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'statement' && partner && (
                            <ClientStatement partner={partner} />
                        )}
                    </div>
                </div>
                {showPaymentModal && (
                    <AddPaymentModal
                        invoice={invoice}
                        form={paymentForm}
                        setForm={setPaymentForm}
                        onSubmit={handleAddPayment}
                        onClose={() => setShowPaymentModal(false)}
                    />
                )}
            </div>
        </AppLayout>
    );
}

function AddPaymentModal({ invoice, form, setForm, onSubmit, onClose }: any) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-7 py-5 border-b border-stone-100">
                    <h2 className="text-base font-semibold text-stone-900">Ajouter un paiement</h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={onSubmit} className="px-7 py-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">Montant (FCFA)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="1"
                            max={invoice.remaining_amount}
                            value={form.amount}
                            onChange={(e) => setForm({...form, amount: parseFloat(e.target.value)})}
                            className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            required
                        />
                        <p className="text-xs text-stone-500 mt-1">Reste dû : {formatCurrency(invoice.remaining_amount)}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">Date de paiement</label>
                        <input
                            type="date"
                            value={form.payment_date}
                            onChange={(e) => setForm({...form, payment_date: e.target.value})}
                            className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">Mode de paiement</label>
                        <select
                            value={form.method}
                            onChange={(e) => setForm({...form, method: e.target.value})}
                            className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                            <option value="Orange Money">Orange Money</option>
                            <option value="Wave">Wave</option>
                            <option value="Espèces">Espèces</option>
                            <option value="Virement">Virement</option>
                            <option value="Chèque">Chèque</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">Référence (optionnel)</label>
                        <input
                            type="text"
                            value={form.reference}
                            onChange={(e) => setForm({...form, reference: e.target.value})}
                            className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            placeholder="Numéro de transaction"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-50">
                            Annuler
                        </button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg">
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Composant relevé de compte client
function ClientStatement({ partner }: { partner: any }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-stone-700">Solde actuel</h3>
                <p className={`text-lg font-bold ${partner.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(partner.balance))}
                    <span className="text-xs font-normal text-stone-500 ml-2">
                        {partner.balance >= 0 ? '(dû par le client)' : '(avoir)'}
                    </span>
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-y border-stone-200">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-stone-500">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-stone-500">Description</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-stone-500">Débit</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-stone-500">Crédit</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-stone-500">Solde</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {partner.statement.map((line, idx) => (
                            <tr key={idx}>
                                <td className="px-4 py-2 text-stone-600">{format(parseISO(line.date), 'dd/MM/yyyy')}</td>
                                <td className="px-4 py-2 text-stone-900">{line.description}</td>
                                <td className="px-4 py-2 text-right text-red-600">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                                <td className="px-4 py-2 text-right text-emerald-600">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                                <td className="px-4 py-2 text-right font-medium text-stone-900">{formatCurrency(line.balance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}