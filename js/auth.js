/**
 * Khmer Math Learning & Assessment System (រៀន និងវាយតម្លៃគណិតវិទ្យាខ្មែរ)
 * Authentication & Strict Role-Based Access Control (RBAC)
 * Roles: 'owner' (Super Admin / App Owner), 'teacher', 'student'
 */

class AuthService {
  constructor() {
    this.sessionKey = 'KM_AUTH_SESSION';
    this.currentUser = null;
  }

  async init() {
    const saved = localStorage.getItem(this.sessionKey);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
        // Anti-Tampering: Re-verify session against database
        if (this.currentUser && this.currentUser.email) {
          const dbUser = await window.db.getUserByEmail(this.currentUser.email);
          if (dbUser) {
            const ownerEmail = window.db.getOwnerEmail();
            const isMatchOwner = ownerEmail && dbUser.email.toLowerCase().trim() === ownerEmail;
            if (isMatchOwner) {
              dbUser.role = 'owner';
              dbUser.isOwner = true;
              dbUser.accountStatus = 'active';
            }
            this.currentUser = { ...dbUser };
            localStorage.setItem(this.sessionKey, JSON.stringify(this.currentUser));
          } else {
            this.currentUser = null;
          }
        }
      } catch {
        this.currentUser = null;
      }
    }

    // Default to configured Super Admin / Owner account on initial load if available
    if (!this.currentUser) {
      const ownerEmail = window.db.getOwnerEmail();
      if (ownerEmail) {
        const ownerUser = await window.db.getUserByEmail(ownerEmail);
        if (ownerUser) {
          this.currentUser = ownerUser;
          localStorage.setItem(this.sessionKey, JSON.stringify(ownerUser));
        }
      }

      // Fallback to sample owner if nothing configured yet
      if (!this.currentUser) {
        const fallbackUser = await window.db.getUserByEmail('owner@khmermath.edu.kh');
        if (fallbackUser) {
          this.currentUser = fallbackUser;
          localStorage.setItem(this.sessionKey, JSON.stringify(fallbackUser));
        }
      }
    }

    this.notifyAuthChange();
    return this.currentUser;
  }

  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = await window.db.getUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('រកមិនឃើញគណនីអ៊ីមែលនេះក្នុងប្រព័ន្ធទេ!');
    }

    // Account status check (suspended or pending approval)
    if (user.accountStatus === 'suspended') {
      throw new Error('គណនីរបស់អ្នកត្រូវបានផ្អាកដំណើរការដោយ Super Admin! សូមទាក់ទងម្ចាស់កម្មវិធី។');
    }
    if (user.accountStatus === 'pending_approval') {
      throw new Error('គណនីរបស់អ្នកកំពុងរង់ចាំការត្រួតពិនិត្យ និងអនុម័តពី Super Admin / Owner។');
    }

    // Password verification
    if (user.password && user.password !== password) {
      throw new Error('ពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ!');
    }

    // AUTOMATIC OWNER PROMOTION:
    // When the configured Owner Gmail logs in successfully, automatically elevate to Super Admin
    const ownerEmail = window.db.getOwnerEmail();
    const isConfiguredOwner = ownerEmail && cleanEmail === ownerEmail;
    if (isConfiguredOwner) {
      user.role = 'owner';
      user.isOwner = true;
      user.accountStatus = 'active';
      window.db.syncOwnerRole(cleanEmail);
    }

    this.currentUser = user;
    localStorage.setItem(this.sessionKey, JSON.stringify(user));

    // Audit log login
    await window.db.logActivity(
      'USER_LOGIN',
      'user',
      user.id,
      `អ្នកប្រើប្រាស់ ${user.fullNameKm} (${user.role.toUpperCase()}) បានចូលគណនី`
    );

    this.notifyAuthChange();
    return user;
  }

  async register(userData) {
    const ownerEmail = window.db.getOwnerEmail();
    const isConfiguredOwner = ownerEmail && userData.email && userData.email.trim().toLowerCase() === ownerEmail;

    // SECURITY: General public registration can ONLY create student or pending teacher.
    // NEVER ALLOW ANYONE TO REGISTER AS OWNER OR ADMIN UNLESS EMAIL MATCHES CONFIGURED OWNER GMAIL!
    let allowedRole = 'student';
    let accountStatus = 'active';

    if (isConfiguredOwner) {
      allowedRole = 'owner';
      accountStatus = 'active';
    } else if (userData.requestedRole === 'teacher') {
      allowedRole = 'teacher';
      accountStatus = 'pending_approval'; // Teachers require Super Admin approval!
    }

    const newUser = await window.db.createUser({
      avatar: allowedRole === 'owner' ? '👑' : (allowedRole === 'teacher' ? '👨‍🏫' : '👨‍🎓'),
      role: allowedRole,
      isOwner: isConfiguredOwner,
      accountStatus,
      fullNameKm: userData.fullNameKm,
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      schoolName: userData.schoolName || 'វិទ្យាល័យព្រះស៊ីសុវត្ថិ',
      phone: userData.phone || ''
    }, true);

    if (accountStatus === 'active') {
      this.currentUser = newUser;
      localStorage.setItem(this.sessionKey, JSON.stringify(newUser));
      this.notifyAuthChange();
    }

    return newUser;
  }

  logout() {
    if (this.currentUser) {
      window.db.logActivity(
        'USER_LOGOUT',
        'user',
        this.currentUser.id,
        `អ្នកប្រើប្រាស់ ${this.currentUser.fullNameKm} បានចាកចេញពីគណនី`
      );
    }
    this.currentUser = null;
    localStorage.removeItem(this.sessionKey);
    this.notifyAuthChange();
  }

  async switchRole(targetRole) {
    const users = await window.db.getUsers();
    const found = users.find(u => u.role === targetRole);
    if (found) {
      this.currentUser = found;
      localStorage.setItem(this.sessionKey, JSON.stringify(found));
      this.notifyAuthChange();
      return found;
    }
    throw new Error(`រកមិនឃើញគណនីគំរូសម្រាប់សិទ្ធិ ${targetRole}`);
  }

  // --- Role Checkers & Permission Gates ---
  getCurrentUser() {
    return this.currentUser;
  }

  getRole() {
    return this.currentUser ? this.currentUser.role : 'guest';
  }

  isOwner() {
    if (!this.currentUser) return false;
    const ownerEmail = window.db ? window.db.getOwnerEmail() : '';
    const emailMatches = ownerEmail && this.currentUser.email && this.currentUser.email.trim().toLowerCase() === ownerEmail;
    return emailMatches || this.currentUser.role === 'owner' || this.currentUser.isOwner === true;
  }

  isTeacher() {
    return this.currentUser && (this.currentUser.role === 'teacher' || this.isOwner());
  }

  isStudent() {
    return this.currentUser && this.currentUser.role === 'student';
  }

  canManageUsers() {
    return this.isOwner();
  }

  canManageClasses() {
    return this.isOwner();
  }

  canEditLesson(lesson = null) {
    if (this.isOwner()) return true;
    if (this.isTeacher()) return true;
    return false;
  }

  canGrade() {
    return this.isOwner() || this.isTeacher();
  }

  notifyAuthChange() {
    window.dispatchEvent(new CustomEvent('km:auth-changed', {
      detail: { user: this.currentUser, role: this.getRole() }
    }));
  }
}

// Global Auth instance
window.auth = new AuthService();
