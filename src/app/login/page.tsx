"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      ...form,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/profile");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Connexion</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="exemple@email.com"
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
          {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p style={{ textAlign: "center", fontSize: "0.95rem", marginTop: 12 }}>
          Pas encore de compte ?{" "}
          <a href="/register" className={styles.link}>
            Crée un compte
          </a>
        </p>
      </div>
    </div>
  );
}
