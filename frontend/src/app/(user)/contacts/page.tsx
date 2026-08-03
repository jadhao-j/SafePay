"use client";

/**
 * Contacts Page — Phase 11D
 * List, search, add, and delete saved recipients.
 */

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  upi_id: string | null;
  created_at: string;
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = ["#7C5CFF", "#39D2FF", "#3DDC97", "#FFB84D", "#FF79C6", "#FF5C5C"];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", upi_id: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { void fetchContacts(); }, []);

  async function fetchContacts(q = "") {
    setLoading(true);
    try {
      const res = await apiClient.get<{ contacts: Contact[] }>(`/contacts/${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      setContacts(res.data.contacts);
    } catch { setContacts([]); }
    finally { setLoading(false); }
  }

  async function handleSearch(val: string) {
    setSearch(val);
    await fetchContacts(val);
  }

  async function handleAdd() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.phone.trim() && !form.upi_id.trim()) { setError("Enter phone or UPI ID."); return; }
    setSaving(true); setError("");
    try {
      await apiClient.post("/contacts/", { name: form.name, phone: form.phone || null, upi_id: form.upi_id || null });
      setForm({ name: "", phone: "", upi_id: "" });
      setShowAdd(false);
      await fetchContacts(search);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Could not save contact.");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await apiClient.delete(`/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch { }
    setDeleteId(null);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#F5F6F8", fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050608", color: "#F5F6F8", fontFamily: "var(--font-dm-sans,'DM Sans',sans-serif)", padding: "28px 20px 100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Contacts</h1>
          <p style={{ fontSize: 13, color: "#6B7180", margin: "2px 0 0" }}>Saved recipients</p>
        </div>
        <button id="btn-add-contact" onClick={() => setShowAdd(true)}
          style={{ padding: "10px 18px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#7C5CFF,#39D2FF)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Add
        </button>
      </div>

      {/* Search */}
      <input
        value={search} onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by name or phone…"
        style={{ ...inputStyle, marginBottom: 16 }}
      />

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#6B7180", paddingTop: 40 }}>Loading…</div>
      ) : contacts.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: "#6B7180" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <p style={{ fontSize: 14 }}>{search ? "No contacts match your search." : "No saved contacts yet."}</p>
          {!search && <button onClick={() => setShowAdd(true)} style={{ marginTop: 12, padding: "10px 20px", borderRadius: 12, background: "rgba(124,92,255,0.15)", border: "1px solid rgba(124,92,255,0.3)", color: "#7C5CFF", fontSize: 13, cursor: "pointer" }}>Add your first contact</button>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {contacts.map((c, i) => (
            <div key={c.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: AVATAR_COLORS[i % AVATAR_COLORS.length] + "33", border: `1.5px solid ${AVATAR_COLORS[i % AVATAR_COLORS.length]}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: AVATAR_COLORS[i % AVATAR_COLORS.length], flexShrink: 0 }}>
                {initials(c.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#F5F6F8" }}>{c.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9198A8" }}>{c.phone || c.upi_id}</p>
              </div>
              {deleteId === c.id ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleDelete(c.id)} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(255,92,92,0.15)", border: "1px solid rgba(255,92,92,0.3)", color: "#FF5C5C", fontSize: 12, cursor: "pointer" }}>Delete</button>
                  <button onClick={() => setDeleteId(null)} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#9198A8", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setDeleteId(c.id)} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#9198A8", fontSize: 14, cursor: "pointer" }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ background: "#0D0F14", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 480, border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Add Contact</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder="Full name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} />
              <input placeholder="Phone number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={inputStyle} />
              <input placeholder="UPI ID (e.g. 9876543210@safepay)" value={form.upi_id} onChange={(e) => setForm((f) => ({ ...f, upi_id: e.target.value }))} style={inputStyle} />
              {error && <p style={{ fontSize: 12, color: "#FF5C5C", margin: 0 }}>{error}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowAdd(false); setError(""); }} style={{ flex: 1, padding: "13px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#9198A8", fontSize: 14, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleAdd} disabled={saving} style={{ flex: 1, padding: "13px", borderRadius: 12, background: "linear-gradient(135deg,#7C5CFF,#39D2FF)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Saving…" : "Save Contact"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
