"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel, getFilteredRowModel, HeaderGroup, Header, Row, Cell } from '@tanstack/react-table';
import Modal from 'react-modal';
import styles from "./profile.module.css";
import { signOut } from 'next-auth/react';

type Reservation = {
  id: string;
  espaceId: string;
  date_debut: string;
  date_fin?: string;
  heure_debut?: string;
  heure_fin?: string;
  reservation_type: string;
  statut: string;
  montant_total: number;
};

// Composant pour afficher et gérer les réservations de l'utilisateur connecté
function ReservationTable() {
  const { data: session } = useSession();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    espace_id: '',
    type_reservation: 'heure',
    date_debut: '',
    date_fin: '',
    heure_debut: '',
    heure_fin: '',
    entreprise: '',
    demande_speciale: '',
  });

  // Récupérer les réservations de l'utilisateur connecté
  useEffect(() => {
    const userId = (session?.user as { id?: string })?.id;
    const token = (session as any)?.token;
    if (!userId) return;
    setLoading(true);
    fetch(`/api/reservations/user/liste`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setReservations(data.reservations || []);
        setLoading(false);
      });
  }, [session]);

  // Colonnes du tableau
  const columns = useMemo<ColumnDef<Reservation, unknown>[]>(() => [
    { accessorKey: 'espaceId', header: 'Espace' },
    { accessorKey: 'date_debut', header: 'Début' },
    { accessorKey: 'date_fin', header: 'Fin' },
    { accessorKey: 'heure_debut', header: 'Heure début' },
    { accessorKey: 'heure_fin', header: 'Heure fin' },
    { accessorKey: 'reservation_type', header: 'Type' },
    { accessorKey: 'statut', header: 'Statut' },
    { accessorKey: 'montant_total', header: 'Montant' },
  ], []);

  // Table TanStack
  const table = useReactTable<Reservation>({
    data: reservations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter: filter },
    onGlobalFilterChange: setFilter,
  });

  // Gestion du formulaire de réservation
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = (session as any)?.token;
    await fetch('/api/reservations/user/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    setModalOpen(false);
    // Refresh reservations
    setLoading(true);
    fetch(`/api/reservations/user/liste`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setReservations(data.reservations || []);
        setLoading(false);
      });
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h2>Mes réservations</h2>
      <button onClick={() => setModalOpen(true)}>Nouvelle réservation</button>
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filtrer..."
        style={{ marginLeft: 16 }}
      />
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup: HeaderGroup<Reservation>) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header: Header<Reservation, unknown>) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length}>Chargement...</td></tr>
          ) : table.getRowModel().rows.length === 0 ? (
            <tr><td colSpan={columns.length}>Aucune réservation</td></tr>
          ) : (
            table.getRowModel().rows.map((row: Row<Reservation>) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell: Cell<Reservation, unknown>) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Précédent
        </button>
        <span> Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} </span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Suivant
        </button>
      </div>
      <Modal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <h3>Nouvelle réservation</h3>
        <form onSubmit={handleSubmit}>
          <input name="espace_id" placeholder="ID de l'espace" value={form.espace_id} onChange={handleFormChange} required />
          <select name="type_reservation" value={form.type_reservation} onChange={handleFormChange}>
            <option value="heure">Heure</option>
            <option value="journee">Journée</option>
            <option value="semaine">Semaine</option>
            <option value="mois">Mois</option>
          </select>
          <input name="date_debut" type="date" value={form.date_debut} onChange={handleFormChange} required />
          <input name="date_fin" type="date" value={form.date_fin} onChange={handleFormChange} />
          <input name="heure_debut" type="time" value={form.heure_debut} onChange={handleFormChange} />
          <input name="heure_fin" type="time" value={form.heure_fin} onChange={handleFormChange} />
          <input name="entreprise" placeholder="Entreprise" value={form.entreprise} onChange={handleFormChange} />
          <input name="demande_speciale" placeholder="Demande spéciale" value={form.demande_speciale} onChange={handleFormChange} />
          <button type="submit">Enregistrer</button>
        </form>
      </Modal>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (typeof window !== 'undefined') {
    Modal.setAppElement('#__next');
  }

  if (status === "loading") {
    return <div className={styles.container}>Chargement...</div>;
  }

  if (!session || !session.user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.avatar}>
            <span>?</span>
          </div>
          <h2 className={styles.title}>Non connecté</h2>
          <div className={styles.subtitle}>Vous devez être connecté pour accéder à cette page.</div>
          <a href="/login" className={styles.link}>Se connecter</a>
        </div>
      </div>
    );
  }

  // Avatar avec initiales
  const initials = ((session.user as any).firstname?.[0] || "") + ((session.user as any).name?.[0] || "");

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.avatar}>
          <span>{initials.toUpperCase()}</span>
        </div>
        <h2 className={styles.title}>Profil utilisateur</h2>
        <div className={styles.subtitle}>Bienvenue sur votre espace personnel</div>
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Nom :</span>
            <span className={styles.value}>{(session.user as any).name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Prénom :</span>
            <span className={styles.value}>{(session.user as any).firstname || <span style={{ fontStyle: "italic", color: "#bbb" }}>Non renseigné</span>}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Email :</span>
            <span className={styles.value}>{(session.user as any).email}</span>
          </div>
          {(session.user as any).id && (
            <div className={styles.infoRow}>
              <span className={styles.label}>ID :</span>
              <span className={styles.value}>{(session.user as any).id}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={styles.button}
        >
          Se déconnecter
        </button>
        <ReservationTable />
      </div>
    </div>
  );
} 