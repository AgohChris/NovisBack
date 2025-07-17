"use client";
import { useState } from "react";
import styles from "./register.module.css";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    firstname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");
      setSuccess("Inscription réussie ! Vérifie ta boîte mail.");
      setForm({ name: "", firstname: "", email: "", password: "", confirmPassword: "" });
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Inscription</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label className={styles.label}>Nom</label>
            <input
              type="text"
              name="name"
              placeholder="Ex: Traoré"
              value={form.name}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          <div>
            <label className={styles.label}>Prénom</label>
            <input
              type="text"
              name="firstname"
              placeholder="Ex: Aminata"
              value={form.firstname}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          <div>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="aminata@email.com"
              value={form.email}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          <div>
            <label className={styles.label}>Mot de passe</label>
            <input
              type="password"
              name="password"
              placeholder="********"
              value={form.password}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          <div>
            <label className={styles.label}>Confirmer le mot de passe</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="********"
              value={form.confirmPassword}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
          {success && <div className={`${styles.message} ${styles.success}`}>{success}</div>}
          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>
        <p style={{ textAlign: "center", fontSize: "0.95rem", marginTop: 12 }}>
          Déjà inscrit ?{" "}
          <a href="/login" className={styles.link}>
            Connecte-toi ici
          </a>
        </p>
      </div>
    </div>
  );
}
