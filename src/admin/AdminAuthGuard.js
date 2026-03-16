import React, { createContext, useContext, useEffect, useState } from "react";

// AdminAuth context to expose authentication state and login/logout helpers
const AdminAuthContext = createContext();

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function AdminAuthProvider({ children }) {
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth by calling a protected admin API (server returns 200 if session valid)
  async function checkAuth() {
    try {
      const resp = await fetch("/admin/api/stats", { credentials: "same-origin" });
      if (resp.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  // login: accept { username?, password } and POST to /admin/login
  async function login({ username, password }) {
    try {
      const body = { password };
      if (username) body.username = username;
      const resp = await fetch("/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (resp.ok) {
        // server sets cookie; verify by checking protected endpoint
        await checkAuth();
        return { success: true };
      }
      const json = await resp.json().catch(() => ({}));
      return { success: false, message: json.message || "Login failed" };
    } catch (err) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  async function logout() {
    try {
      await fetch("/admin/logout", { method: "POST", credentials: "same-origin" });
    } catch (e) { /* ignore */ }
    setIsAuthenticated(false);
  }

  const value = { checking, isAuthenticated, login, logout, checkAuth };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
