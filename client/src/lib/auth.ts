import { User } from "@shared/schema";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  isAdmin: boolean;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

class AuthManager {
  private token: string | null = null;
  private user: AuthUser | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");
    
    if (token && userStr) {
      this.token = token;
      this.user = JSON.parse(userStr);
    }
  }

  private saveToStorage() {
    if (this.token && this.user) {
      localStorage.setItem("auth_token", this.token);
      localStorage.setItem("auth_user", JSON.stringify(this.user));
    } else {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  }

  login(response: AuthResponse) {
    this.token = response.token;
    this.user = response.user;
    this.saveToStorage();
  }

  logout() {
    this.token = null;
    this.user = null;
    this.saveToStorage();
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  isAdmin(): boolean {
    return this.isAuthenticated() && !!this.user?.isAdmin;
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }
}

export const authManager = new AuthManager();
