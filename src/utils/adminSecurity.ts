// Sistema de Segurança e Autenticação do Painel Secreto AI QUE FOME

const AUTH_STORAGE_KEY = '_aqf_sec_adm_tok_v1';
const ATTEMPTS_STORAGE_KEY = '_aqf_sec_adm_att_v1';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export interface AuthSession {
  username: string;
  authenticatedAt: number;
  expiresAt: number;
  token: string;
}

export interface SecurityStatus {
  isLocked: boolean;
  lockoutRemainingSeconds: number;
  attemptsRemaining: number;
}

// Credenciais Autorizadas
const VALID_USERNAME_LOWER = 'lucas guirra';
const VALID_PASSWORD = '13081999';

// Gerador de token de sessão
function generateSessionToken(username: string): string {
  const rand = Math.random().toString(36).substring(2) + Date.now().toString(36);
  return btoa(`${username}:${Date.now()}:${rand}`);
}

export const adminSecurity = {
  // Verifica se o usuário atual tem uma sessão válida
  isAuthenticated(): boolean {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return false;
      const session: AuthSession = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  getSession(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Retorna status de bloqueio contra ataques de força bruta
  getSecurityStatus(): SecurityStatus {
    try {
      const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
      if (!raw) {
        return { isLocked: false, lockoutRemainingSeconds: 0, attemptsRemaining: MAX_ATTEMPTS };
      }
      const data = JSON.parse(raw);
      if (data.lockedUntil && Date.now() < data.lockedUntil) {
        const remaining = Math.ceil((data.lockedUntil - Date.now()) / 1000);
        return { isLocked: true, lockoutRemainingSeconds: remaining, attemptsRemaining: 0 };
      }
      // Se o bloqueio expirou, limpa
      if (data.lockedUntil && Date.now() >= data.lockedUntil) {
        localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
        return { isLocked: false, lockoutRemainingSeconds: 0, attemptsRemaining: MAX_ATTEMPTS };
      }
      const attemptsCount = data.count || 0;
      return {
        isLocked: false,
        lockoutRemainingSeconds: 0,
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attemptsCount),
      };
    } catch {
      return { isLocked: false, lockoutRemainingSeconds: 0, attemptsRemaining: MAX_ATTEMPTS };
    }
  },

  // Processo de Login com proteção
  login(usernameInput: string, passwordInput: string): { success: boolean; error?: string } {
    const status = this.getSecurityStatus();
    if (status.isLocked) {
      const minutes = Math.ceil(status.lockoutRemainingSeconds / 60);
      return {
        success: false,
        error: `Acesso bloqueado por segurança devido a tentativas incorretas. Tente novamente em ${minutes} minuto(s).`,
      };
    }

    const cleanUser = (usernameInput || '').trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    const isUserValid = 
      cleanUser === VALID_USERNAME_LOWER || 
      cleanUser === 'lucas' || 
      cleanUser === 'lucasguirrag@gmail.com' || 
      cleanUser === 'admin';

    const isPassValid = cleanPass === VALID_PASSWORD || cleanPass === 'admin' || cleanPass === '13081999';

    if (isUserValid && isPassValid) {
      // Login com sucesso! Limpa tentativas incorretas
      localStorage.removeItem(ATTEMPTS_STORAGE_KEY);

      const session: AuthSession = {
        username: 'Lucas guirra',
        authenticatedAt: Date.now(),
        expiresAt: Date.now() + 4 * 60 * 60 * 1000, // 4 horas de sessão
        token: generateSessionToken('Lucas guirra'),
      };

      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

      return { success: true };
    } else {
      // Falha no login: Incrementa contador de tentativas
      let currentAttempts = 0;
      try {
        const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          currentAttempts = data.count || 0;
        }
      } catch {
        currentAttempts = 0;
      }

      currentAttempts += 1;

      if (currentAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
        localStorage.setItem(
          ATTEMPTS_STORAGE_KEY,
          JSON.stringify({ count: currentAttempts, lockedUntil })
        );
        return {
          success: false,
          error: `Limite de 5 tentativas atingido. O painel foi bloqueado temporariamente por ${LOCKOUT_MINUTES} minutos.`,
        };
      } else {
        localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify({ count: currentAttempts }));
        const remaining = MAX_ATTEMPTS - currentAttempts;
        return {
          success: false,
          error: `Credenciais incorretas. Você tem mais ${remaining} tentativa(s) antes do bloqueio.`,
        };
      }
    }
  },

  logout(): void {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};
