/**
 * Khmer Math Learning & Assessment System (រៀន និងវាយតម្លៃគណិតវិទ្យាខ្មែរ)
 * Secure Database & Storage Service (Dual Engine: Supabase PostgreSQL + Local Engine)
 * Enforces Server/Service-Level Role-Based Access Control (RBAC) & Audit Logging
 */

class DatabaseService {
  constructor() {
    this.storageKeyPrefix = 'KM_MATH_DB_';
    this.supabaseClient = null;
    this.isSupabaseConnected = false;
    this.configuredOwnerEmail = null;
  }

  async init() {
    // 1. Try initializing Supabase if credentials exist
    const config = this.getSupabaseConfig();
    if (config && config.url && config.key && window.supabase) {
      try {
        this.supabaseClient = window.supabase.createClient(config.url, config.key);
        const { error } = await this.supabaseClient.from('profiles').select('id').limit(1);
        if (!error) {
          this.isSupabaseConnected = true;
          console.log('✅ Supabase PostgreSQL Connected with RLS');
        } else {
          console.warn('⚠️ Supabase connection failed, using local engine:', error.message);
        }
      } catch (e) {
        console.warn('⚠️ Could not connect to Supabase, using local engine:', e);
      }
    }

    // 2. Fetch Owner Gmail configuration (from Supabase Database RPC, Server API, or config)
    await this.fetchServerOwnerConfig();

    // 3. Central Database Synchronization across multiple devices
    await this.syncFromCentralServer();

    // 4. Initialize local storage engine with seed data if still empty
    this.initLocalStorage();

    // 5. Ensure configured Owner Gmail has Super Admin role in database
    const ownerEmail = this.getOwnerEmail();
    if (ownerEmail) {
      this.syncOwnerRole(ownerEmail);
    }

    // 6. Push state to central server if using server engine
    if (!this.isSupabaseConnected) {
      this.pushToCentralServer();
    }

    return true;
  }

  async fetchServerOwnerConfig() {
    // 1. If Supabase is connected, query the verified Owner Gmail directly from PostgreSQL!
    if (this.isSupabaseConnected && this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient.rpc('get_owner_email');
        if (!error && data && data.trim() !== '') {
          this.configuredOwnerEmail = data.trim().toLowerCase();
          localStorage.setItem(this.storageKeyPrefix + 'OWNER_EMAIL', this.configuredOwnerEmail);
          console.log('👑 Verified Permanent Owner Gmail loaded from Supabase Database:', this.configuredOwnerEmail);
          return this.configuredOwnerEmail;
        }
      } catch (e) {
        console.warn('Supabase get_owner_email note:', e);
      }
    }

    // 2. Try fetching Owner Gmail configuration from secure server API (localhost / LAN)
    try {
      if (typeof fetch === 'function') {
        const res = await fetch('/api/owner-config');
        if (res.ok) {
          const data = await res.json();
          if (data && data.ownerEmail && data.ownerEmail.trim() !== '') {
            this.configuredOwnerEmail = data.ownerEmail.trim().toLowerCase();
            localStorage.setItem(this.storageKeyPrefix + 'OWNER_EMAIL', this.configuredOwnerEmail);
            console.log('👑 Permanent Owner Gmail loaded from Server API:', this.configuredOwnerEmail);
            return this.configuredOwnerEmail;
          }
        }
      }
    } catch {
      // Offline or static file load - fallback to persistent local storage
    }

    // 3. Fallback to persistent storage or default permanent owner
    const saved = localStorage.getItem(this.storageKeyPrefix + 'OWNER_EMAIL');
    if (saved && saved.trim() !== '') {
      this.configuredOwnerEmail = saved.trim().toLowerCase();
    } else {
      this.configuredOwnerEmail = 'vayseangleng@gmail.com';
      localStorage.setItem(this.storageKeyPrefix + 'OWNER_EMAIL', this.configuredOwnerEmail);
    }
    return this.configuredOwnerEmail;
  }

  getOwnerEmail() {
    if (this.configuredOwnerEmail) return this.configuredOwnerEmail;
    try {
      const saved = localStorage.getItem(this.storageKeyPrefix + 'OWNER_EMAIL');
      if (saved) {
        this.configuredOwnerEmail = saved.trim().toLowerCase();
        return this.configuredOwnerEmail;
      }
    } catch {}
    return '';
  }

  async setOwnerEmail(email, persistToServer = true) {
    const cleanEmail = (email || '').trim().toLowerCase();
    this.configuredOwnerEmail = cleanEmail;
    try {
      if (cleanEmail) {
        localStorage.setItem(this.storageKeyPrefix + 'OWNER_EMAIL', cleanEmail);
      } else {
        localStorage.removeItem(this.storageKeyPrefix + 'OWNER_EMAIL');
      }
    } catch {}

    // Persist to server config if online
    if (persistToServer && cleanEmail) {
      try {
        if (typeof fetch === 'function') {
          await fetch('/api/owner-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ownerEmail: cleanEmail })
          });
        }
      } catch (e) {
        console.warn('Could not post owner config to server:', e);
      }
    }

    // Sync database records immediately
    if (cleanEmail) {
      this.syncOwnerRole(cleanEmail);
    }
    return cleanEmail;
  }

  syncOwnerRole(targetEmail) {
    if (!targetEmail) return;
    const cleanEmail = targetEmail.trim().toLowerCase();
    const users = this._get('USERS');
    if (!users || users.length === 0) return;

    let changed = false;
    let foundOwnerUser = false;

    users.forEach(u => {
      const isMatch = u.email && u.email.trim().toLowerCase() === cleanEmail;
      if (isMatch) {
        foundOwnerUser = true;
        if (!u.isOwner || u.role !== 'owner' || u.accountStatus !== 'active') {
          u.isOwner = true;
          u.role = 'owner';
          u.accountStatus = 'active';
          changed = true;
        }
      } else if (u.isOwner === true) {
        // Demote other accounts to preserve single genuine owner constraint
        u.isOwner = false;
        if (u.role === 'owner') {
          u.role = 'teacher';
        }
        changed = true;
      }
    });

    if (!foundOwnerUser) {
      const placeholder = users.find(u => u.id === 'user-owner-1' || u.email === 'owner@khmermath.edu.kh');
      if (placeholder) {
        placeholder.email = cleanEmail;
        placeholder.isOwner = true;
        placeholder.role = 'owner';
        placeholder.accountStatus = 'active';
        changed = true;
      }
    }

    if (changed) {
      this._set('USERS', users);
    }

    // Sync current active auth session if matching
    if (window.auth && window.auth.currentUser) {
      const curEmail = (window.auth.currentUser.email || '').trim().toLowerCase();
      if (curEmail === cleanEmail) {
        window.auth.currentUser.isOwner = true;
        window.auth.currentUser.role = 'owner';
        window.auth.currentUser.accountStatus = 'active';
        try {
          localStorage.setItem(window.auth.sessionKey, JSON.stringify(window.auth.currentUser));
        } catch {}
        window.auth.notifyAuthChange();
      }
    }
  }

  getSupabaseConfig() {
    try {
      const saved = localStorage.getItem('KM_SUPABASE_CONFIG');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.url && parsed.key) return parsed;
      }
      // Fallback to window.KM_SUPABASE_CONFIG (configured in js/supabase-config.js for public web hosting)
      if (window.KM_SUPABASE_CONFIG && window.KM_SUPABASE_CONFIG.url && window.KM_SUPABASE_CONFIG.key && window.KM_SUPABASE_CONFIG.url.trim() !== '') {
        return {
          url: window.KM_SUPABASE_CONFIG.url.trim(),
          key: window.KM_SUPABASE_CONFIG.key.trim()
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  setSupabaseConfig(url, key) {
    if (!url || !key) {
      localStorage.removeItem('KM_SUPABASE_CONFIG');
      this.supabaseClient = null;
      this.isSupabaseConnected = false;
      return false;
    }
    localStorage.setItem('KM_SUPABASE_CONFIG', JSON.stringify({ url: url.trim(), key: key.trim() }));
    return true;
  }

  initLocalStorage() {
    const initialized = localStorage.getItem(this.storageKeyPrefix + 'INITIALIZED');
    if (!initialized && window.SEED_DATA) {
      this.resetToSeedData();
    }
  }

  resetToSeedData() {
    if (!window.SEED_DATA) return;
    localStorage.setItem(this.storageKeyPrefix + 'USERS', JSON.stringify(window.SEED_DATA.users));
    localStorage.setItem(this.storageKeyPrefix + 'CLASSES', JSON.stringify(window.SEED_DATA.classes));
    localStorage.setItem(this.storageKeyPrefix + 'CHAPTERS', JSON.stringify(window.SEED_DATA.chapters));
    localStorage.setItem(this.storageKeyPrefix + 'LESSONS', JSON.stringify(window.SEED_DATA.lessons));
    localStorage.setItem(this.storageKeyPrefix + 'QUIZZES', JSON.stringify(window.SEED_DATA.quizzes));
    localStorage.setItem(this.storageKeyPrefix + 'ATTEMPTS', JSON.stringify(window.SEED_DATA.attempts));
    localStorage.setItem(this.storageKeyPrefix + 'AUDIT_LOGS', JSON.stringify(window.SEED_DATA.auditLogs || []));
    localStorage.setItem(this.storageKeyPrefix + 'INITIALIZED', 'true');
    console.log('✨ Seed data loaded successfully with Owner, Teacher, and Student roles');
  }

  // --- Internal Storage & Central Sync Helpers ---
  async syncFromCentralServer() {
    try {
      if (typeof fetch === 'function') {
        const res = await fetch('/api/db/sync');
        if (res.ok) {
          const remoteDb = await res.json();
          if (remoteDb && remoteDb.users && Array.isArray(remoteDb.users) && remoteDb.users.length > 0) {
            const tables = ['USERS', 'CLASSES', 'CHAPTERS', 'LESSONS', 'QUIZZES', 'ATTEMPTS', 'AUDIT_LOGS'];
            tables.forEach(t => {
              const remoteKey = t.toLowerCase();
              if (remoteDb[remoteKey]) {
                localStorage.setItem(this.storageKeyPrefix + t, JSON.stringify(remoteDb[remoteKey]));
              }
            });
            localStorage.setItem(this.storageKeyPrefix + 'INITIALIZED', 'true');
            console.log('🔄 Synced state from Central Server Database');
          }
        }
      }
    } catch (e) {
      console.warn('Central server sync skipped (offline or server unreachable):', e);
    }
  }

  async pushToCentralServerNow() {
    try {
      if (typeof fetch === 'function') {
        const payload = {
          users: this._get('USERS'),
          classes: this._get('CLASSES'),
          chapters: this._get('CHAPTERS'),
          lessons: this._get('LESSONS'),
          quizzes: this._get('QUIZZES'),
          attempts: this._get('ATTEMPTS'),
          auditLogs: this._get('AUDIT_LOGS'),
          ownerEmail: this.getOwnerEmail()
        };
        const res = await fetch('/api/db/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          console.log('☁️ State immediately saved to Central Server Database (server_db.json)');
          return true;
        }
      }
    } catch (e) {
      console.warn('Could not push to central server:', e);
    }
    return false;
  }

  pushToCentralServer() {
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(async () => {
      await this.pushToCentralServerNow();
    }, 300);
  }

  async uploadFile(file) {
    if (!file) throw new Error('គ្មានឯកសារដែលត្រូវអាប់ឡូតឡើយ');

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64,
          mimeType: file.type || 'application/octet-stream'
        })
      });
      if (res.ok) {
        return await res.json();
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error ${res.status}`);
      }
    } catch (err) {
      console.warn('Server upload note, using embedded storage:', err.message);
      return {
        success: true,
        url: base64,
        fileName: file.name,
        storedName: file.name,
        sizeBytes: file.size,
        mimeType: file.type
      };
    }
  }

  _get(key) {
    const raw = localStorage.getItem(this.storageKeyPrefix + key);
    return raw ? JSON.parse(raw) : [];
  }

  _set(key, data) {
    localStorage.setItem(this.storageKeyPrefix + key, JSON.stringify(data));
    this.pushToCentralServer();
  }

  // ==========================================
  // SERVER-SIDE SECURITY & PERMISSION GUARDS
  // ==========================================
  _assertRole(allowedRoles, actionName) {
    const user = window.auth ? window.auth.getCurrentUser() : null;
    if (!user || !user.id) {
      throw new Error(`សិទ្ធិត្រូវបានបដិសេធ (401 Unauthorized): សូមចូលគណនីមុននឹងធ្វើ [${actionName}]!`);
    }

    // Anti-Tampering Check: Verify user against actual Database record, NOT just in-memory object
    const users = this._get('USERS') || [];
    const dbUser = users.find(u => u.id === user.id);
    if (!dbUser) {
      throw new Error(`សិទ្ធិត្រូវបានបដិសេធ (401 Unauthorized): គណនីមិនមានក្នុងមូលទិន្នន័យឡើយ!`);
    }

    const ownerEmail = this.getOwnerEmail();
    const isOwnerByEmail = ownerEmail && dbUser.email && dbUser.email.trim().toLowerCase() === ownerEmail;
    const isOwnerInDb = dbUser.isOwner === true && dbUser.role === 'owner';

    // Permanent Super Admin / Owner has universal access
    if (isOwnerByEmail || isOwnerInDb) {
      return true;
    }

    // Non-owner: strictly check their genuine role stored in database
    const genuineRole = dbUser.role;
    if (!allowedRoles.includes(genuineRole)) {
      throw new Error(`សិទ្ធិត្រូវបានបដិសេធ (403 Forbidden): គណនីប្រភេទ ${genuineRole.toUpperCase()} គ្មានសិទ្ធិ [${actionName}] ឡើយ!`);
    }
    return true;
  }

  // ==========================================
  // AUDIT LOGGING SYSTEM (ប្រវត្តិសកម្មភាព)
  // ==========================================
  async logActivity(action, resourceType, resourceId, details) {
    try {
      const logs = this._get('AUDIT_LOGS');
      const currentUser = window.auth ? window.auth.getCurrentUser() : null;
      const newLog = {
        id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        actorName: currentUser ? (currentUser.fullNameKm || currentUser.email) : 'ប្រព័ន្ធ (System)',
        actorRole: currentUser ? currentUser.role : 'system',
        action,
        resourceType,
        resourceId,
        details,
        createdAt: new Date().toISOString()
      };
      logs.unshift(newLog); // newest first
      // Keep up to 200 recent events
      this._set('AUDIT_LOGS', logs.slice(0, 200));
      return newLog;
    } catch (e) {
      console.warn('Logging error:', e);
    }
  }

  async getAuditLogs() {
    this._assertRole(['owner'], 'មើលប្រវត្តិសកម្មភាពប្រព័ន្ធ (View Audit Logs)');
    return this._get('AUDIT_LOGS');
  }

  // ==========================================
  // USERS & ACCOUNT MANAGEMENT
  // ==========================================
  async getUsers() {
    return this._get('USERS');
  }

  async getUserByEmail(email) {
    if (!email) return null;
    const users = await this.getUsers();
    return users.find(u => u.email && u.email.toLowerCase().trim() === email.toLowerCase().trim());
  }

  async getUserById(id) {
    const users = await this.getUsers();
    return users.find(u => u.id === id);
  }

  async createUser(userData, isInternalRegistration = false) {
    const ownerEmail = this.getOwnerEmail();
    const isMatchingOwner = ownerEmail && userData.email && userData.email.trim().toLowerCase() === ownerEmail;

    // If called directly through management interface, must be Owner
    if (!isInternalRegistration && !isMatchingOwner) {
      this._assertRole(['owner'], 'បង្កើតគណនីអ្នកប្រើប្រាស់ (Create User)');
    }

    const users = await this.getUsers();
    const existing = users.find(u => u.email && u.email.toLowerCase().trim() === userData.email.toLowerCase().trim());
    if (existing) {
      throw new Error('គណនីអ៊ីមែលនេះមានក្នុងប្រព័ន្ធរួចហើយ!');
    }

    const newUser = {
      id: 'user-' + Date.now(),
      accountStatus: isMatchingOwner ? 'active' : (userData.accountStatus || 'active'),
      isOwner: isMatchingOwner ? true : (userData.role === 'owner'),
      ...userData,
      role: isMatchingOwner ? 'owner' : userData.role,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this._set('USERS', users);

    await this.logActivity(
      'CREATE_USER',
      'user',
      newUser.id,
      `បានបង្កើតគណនីថ្មី៖ ${newUser.fullNameKm} (${newUser.role})`
    );

    return newUser;
  }

  async updateUserRole(userId, newRole) {
    this._assertRole(['owner'], 'ប្តូរសិទ្ធិអ្នកប្រើប្រាស់ (Change User Role)');

    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('រកមិនឃើញអ្នកប្រើប្រាស់នេះទេ');

    const targetUser = users[index];
    const ownerEmail = this.getOwnerEmail();
    const isTargetOwner = targetUser.isOwner === true || (ownerEmail && targetUser.email && targetUser.email.toLowerCase().trim() === ownerEmail);

    // STRICT OWNER PROTECTION:
    if (isTargetOwner) {
      throw new Error('មិនអនុញ្ញាតឱ្យដកហូតសិទ្ធិ ឬកែប្រែតួនាទីម្ចាស់កម្មវិធី (Owner) ជាដាច់ខាត!');
    }

    if (newRole === 'owner') {
      if (!ownerEmail || targetUser.email.toLowerCase().trim() !== ownerEmail) {
        throw new Error('មិនអនុញ្ញាតឱ្យកំណត់តួនាទីជាម្ចាស់កម្មវិធី (Owner) លើសពីម្នាក់ ឬអ៊ីមែលខុសពី Owner Gmail ឡើយ!');
      }
    }

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    targetUser.updatedAt = new Date().toISOString();
    users[index] = targetUser;
    this._set('USERS', users);

    await this.logActivity(
      'UPDATE_USER_ROLE',
      'user',
      userId,
      `បានប្តូរសិទ្ធិ ${targetUser.fullNameKm} ពី ${oldRole} ទៅ ${newRole}`
    );

    return targetUser;
  }

  async updateUserStatus(userId, newStatus) {
    return await this.toggleAccountStatus(userId, newStatus);
  }

  async toggleAccountStatus(userId, newStatus) {
    this._assertRole(['owner'], 'កែប្រែស្ថានភាពគណនី (Toggle Account Status)');

    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('រកមិនឃើញអ្នកប្រើប្រាស់នេះទេ');

    const targetUser = users[index];
    const ownerEmail = this.getOwnerEmail();
    const isTargetOwner = targetUser.isOwner === true || (ownerEmail && targetUser.email && targetUser.email.toLowerCase().trim() === ownerEmail);

    if (isTargetOwner) {
      throw new Error('មិនអនុញ្ញាតឱ្យផ្អាក ឬបិទគណនីម្ចាស់កម្មវិធី (Owner) ឡើយ!');
    }

    targetUser.accountStatus = newStatus;
    targetUser.updatedAt = new Date().toISOString();
    users[index] = targetUser;
    this._set('USERS', users);

    await this.logActivity(
      'CHANGE_ACCOUNT_STATUS',
      'user',
      userId,
      `បានប្តូរស្ថានភាព ${targetUser.fullNameKm} ទៅជា ${newStatus.toUpperCase()}`
    );

    return targetUser;
  }

  async deleteUser(userId) {
    this._assertRole(['owner'], 'លុបគណនីអ្នកប្រើប្រាស់ (Delete User)');

    let users = await this.getUsers();
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) throw new Error('រកមិនឃើញគណនីនេះទេ');

    const ownerEmail = this.getOwnerEmail();
    const isTargetOwner = targetUser.isOwner === true || (ownerEmail && targetUser.email && targetUser.email.toLowerCase().trim() === ownerEmail);

    if (isTargetOwner) {
      throw new Error('មិនអនុញ្ញាតឱ្យលុបគណនីម្ចាស់កម្មវិធី (Owner) ជាដាច់ខាត!');
    }

    users = users.filter(u => u.id !== userId);
    this._set('USERS', users);

    await this.logActivity(
      'DELETE_USER',
      'user',
      userId,
      `បានលុបគណនី៖ ${targetUser.fullNameKm} (${targetUser.email})`
    );

    return true;
  }

  // ==========================================
  // CLASSES
  // ==========================================
  async getClasses(grade = null) {
    let classes = this._get('CLASSES');
    if (grade) {
      classes = classes.filter(c => c.grade === parseInt(grade, 10));
    }
    return classes;
  }

  async getClassById(id) {
    const classes = await this.getClasses();
    return classes.find(c => c.id === id);
  }

  async getClassByCode(code) {
    const classes = await this.getClasses();
    return classes.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
  }

  async createClass(classData) {
    this._assertRole(['owner', 'teacher'], 'បង្កើតថ្នាក់រៀន (Create Class)');

    const classes = await this.getClasses();
    const newClass = {
      id: 'class-' + Date.now(),
      code: classData.code ? classData.code.toUpperCase() : 'MTH-' + Math.floor(100 + Math.random() * 900),
      studentCount: 0,
      isActive: true,
      ...classData,
      createdAt: new Date().toISOString()
    };
    classes.push(newClass);
    this._set('CLASSES', classes);

    await this.logActivity(
      'CREATE_CLASS',
      'class',
      newClass.id,
      `បានបង្កើតថ្នាក់ថ្មី៖ ${newClass.name} (កូដ: ${newClass.code})`
    );

    return newClass;
  }

  // ==========================================
  // CHAPTERS & LESSONS
  // ==========================================
  async getChapters(classId) {
    const chapters = this._get('CHAPTERS');
    return chapters
      .filter(c => c.classId === classId)
      .sort((a, b) => a.order - b.order);
  }

  async createChapter(chapterData) {
    this._assertRole(['owner', 'teacher'], 'បង្កើតជំពូក (Create Chapter)');

    const chapters = this._get('CHAPTERS');
    const newChapter = {
      id: 'chap-' + Date.now(),
      order: chapters.filter(c => c.classId === chapterData.classId).length + 1,
      ...chapterData,
      createdAt: new Date().toISOString()
    };
    chapters.push(newChapter);
    this._set('CHAPTERS', chapters);

    await this.logActivity('CREATE_CHAPTER', 'chapter', newChapter.id, `បានបន្ថែមជំពូក៖ ${newChapter.title}`);
    return newChapter;
  }

  async getLessons(chapterId, role = 'student') {
    const lessons = this._get('LESSONS');
    let filtered = lessons.filter(l => l.chapterId === chapterId);

    // SECURITY: Students can ONLY view published lessons!
    if (role === 'student' || (window.auth && window.auth.isStudent())) {
      filtered = filtered.filter(l => l.isPublished === true);
    }
    return filtered;
  }

  async getLessonById(id) {
    const lessons = this._get('LESSONS');
    return lessons.find(l => l.id === id);
  }

  async createLesson(lessonData) {
    this._assertRole(['owner', 'teacher'], 'បង្កើតមេរៀន (Create Lesson)');

    const lessons = this._get('LESSONS');
    const newLesson = {
      id: 'les-' + Date.now(),
      files: [],
      video: null,
      isPublished: true,
      ...lessonData,
      createdAt: new Date().toISOString()
    };
    lessons.push(newLesson);
    this._set('LESSONS', lessons);

    await this.logActivity('CREATE_LESSON', 'lesson', newLesson.id, `បានបង្កើតមេរៀន៖ ${newLesson.title}`);
    return newLesson;
  }

  async updateLesson(lessonId, updates) {
    this._assertRole(['owner', 'teacher'], 'កែសម្រួលមេរៀន (Update Lesson)');

    const lessons = this._get('LESSONS');
    const index = lessons.findIndex(l => l.id === lessonId);
    if (index === -1) throw new Error('រកមិនឃើញមេរៀននេះឡើយ');

    lessons[index] = { ...lessons[index], ...updates, updatedAt: new Date().toISOString() };
    this._set('LESSONS', lessons);

    await this.logActivity('UPDATE_LESSON', 'lesson', lessonId, `បានកែសម្រួលមេរៀន៖ ${lessons[index].title}`);
    return lessons[index];
  }

  async deleteLesson(lessonId) {
    this._assertRole(['owner', 'teacher'], 'លុបមេរៀន (Delete Lesson)');

    let lessons = this._get('LESSONS');
    const target = lessons.find(l => l.id === lessonId);
    lessons = lessons.filter(l => l.id !== lessonId);
    this._set('LESSONS', lessons);

    await this.logActivity('DELETE_LESSON', 'lesson', lessonId, `បានលុបមេរៀន៖ ${target ? target.title : lessonId}`);
    return true;
  }

  // ==========================================
  // FILE STORAGE & UPLOADS
  // ==========================================
  async uploadLessonFile(file, lessonId) {
    this._assertRole(['owner', 'teacher'], 'Upload ឯកសារ (Upload File)');

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`ទំហំឯកសារលើសពីកម្រិតកំណត់ (អតិបរមា 50MB)! ទំហំបច្ចុប្បន្ន: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
    }

    const extension = file.name.split('.').pop().toLowerCase();
    const allowed = ['pdf', 'docx', 'pptx', 'mp4', 'png', 'jpg', 'jpeg'];
    if (!allowed.includes(extension)) {
      throw new Error(`ប្រភេទឯកសារមិនត្រូវបានអនុញ្ញាត! គាំទ្រតែ PDF, DOCX, PPTX, MP4, PNG, JPG ប៉ុណ្ណោះ។`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileRecord = {
          id: 'file-' + Date.now(),
          name: file.name,
          type: extension,
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          url: e.target.result,
          uploadedAt: new Date().toISOString()
        };

        const lesson = await this.getLessonById(lessonId);
        if (lesson) {
          if (!lesson.files) lesson.files = [];
          lesson.files.push(fileRecord);
          await this.updateLesson(lessonId, { files: lesson.files });
        }

        await this.logActivity('UPLOAD_FILE', 'file', fileRecord.id, `បាន Upload ឯកសារ ${file.name} ទៅក្នុងមេរៀន ${lesson ? lesson.title : ''}`);
        resolve(fileRecord);
      };
      reader.onerror = () => reject(new Error('បរាជ័យក្នុងការ Upload ឯកសារ'));
      reader.readAsDataURL(file);
    });
  }

  async deleteLessonFile(lessonId, fileId) {
    this._assertRole(['owner', 'teacher'], 'លុបឯកសារ (Delete File)');

    const lesson = await this.getLessonById(lessonId);
    if (!lesson || !lesson.files) return;
    lesson.files = lesson.files.filter(f => f.id !== fileId);
    await this.updateLesson(lessonId, { files: lesson.files });

    await this.logActivity('DELETE_FILE', 'file', fileId, `បានលុបឯកសារភ្ជាប់ពីមេរៀន ${lesson.title}`);
    return true;
  }

  // ==========================================
  // QUIZZES & ASSESSMENTS
  // ==========================================
  async getQuizzes(classId = null, role = 'student') {
    let quizzes = this._get('QUIZZES');

    // Students only see published quizzes
    if (role === 'student' || (window.auth && window.auth.isStudent())) {
      quizzes = quizzes.filter(q => q.isPublished === true);
      if (classId && classId !== 'all') {
        quizzes = quizzes.filter(q => q.classId === classId || q.classId === 'all' || !q.classId);
      }
    } else {
      // Teachers and Owners:
      // If a specific classId is provided (and not 'all'), filter by it
      if (classId && classId !== 'all') {
        quizzes = quizzes.filter(q => q.classId === classId || q.classId === 'all');
      }
    }
    return quizzes;
  }

  async getQuizById(id, role = null) {
    const quizzes = this._get('QUIZZES');
    const quiz = quizzes.find(q => q.id === id);
    if (!quiz) return null;

    // CRITICAL SECURITY SANITIZATION:
    // Privileged caller (system evaluation, owner, or teacher) gets full master quiz.
    // Students NEVER receive master correctOption or explanationKm!
    const isPrivileged = role === 'system' || role === 'owner' || role === 'teacher';
    if (!isPrivileged && (role === 'student' || (window.auth && window.auth.isStudent()))) {
      const sanitized = JSON.parse(JSON.stringify(quiz));
      sanitized.questions = sanitized.questions.map(q => {
        const { correctOption, explanationKm, ...safeQuestion } = q;
        return safeQuestion;
      });
      return sanitized;
    }

    return quiz;
  }

  async createQuiz(quizData) {
    this._assertRole(['owner', 'teacher'], 'បង្កើតកម្រងតេស្ត (Create Quiz)');
    const currentUser = window.auth ? window.auth.getCurrentUser() : null;

    if (!quizData || !quizData.title || !quizData.title.trim()) {
      throw new Error('ចំណងជើងតេស្តមិនអាចទទេបានទេ (Quiz title is required)');
    }
    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error('តេស្តត្រូវតែមានសំណួរយ៉ាងតិច ១ (Quiz must have at least 1 question)');
    }

    const quizzes = this._get('QUIZZES');

    // Standardize & sanitize question models
    const questions = (quizData.questions || []).map((q, idx) => ({
      ...q,
      id: q.id || ('q-' + Date.now() + '-' + (idx + 1)),
      number: q.number || (idx + 1),
      type: q.type || 'mcq',
      difficulty: q.difficulty || 'medium',
      points: parseFloat(q.points) || 5,
      promptKm: q.promptKm || '',
      mathFormula: q.mathFormula || '',
      options: q.options || [],
      correctOption: q.correctOption !== undefined ? q.correctOption : 'A',
      explanationKm: q.explanationKm || '',
      image: q.image || q.imageUrl || null
    }));

    const totalPoints = questions.reduce((acc, q) => acc + (parseFloat(q.points) || 1), 0);
    const difficultyCounts = quizData.difficultyCounts || {
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length
    };

    const newQuiz = {
      id: quizData.id || ('quiz-' + Date.now()),
      title: quizData.title,
      description: quizData.description || '',
      grade: parseInt(quizData.grade, 10) || 12,
      classId: quizData.classId || 'class-12a',
      chapterId: quizData.chapterId || null,
      lessonId: quizData.lessonId || null,
      subject: quizData.subject || 'គណិតវិទ្យា',
      timeLimitMinutes: parseInt(quizData.timeLimitMinutes, 10) || 30,
      maxAttempts: parseInt(quizData.maxAttempts, 10) || 1,
      passPercentage: parseFloat(quizData.passPercentage) || 60,
      shuffleQuestions: !!quizData.shuffleQuestions,
      shuffleOptions: !!quizData.shuffleOptions,
      showSolutionOnSubmit: quizData.showSolutionOnSubmit !== false,
      isPublished: quizData.isPublished !== false,
      createdBy: currentUser ? currentUser.id : 'user-teacher-1',
      createdByName: currentUser ? (currentUser.fullNameKm || currentUser.fullNameEn) : 'លោកគ្រូ អ្នកគ្រូ',
      createdByEmail: currentUser ? currentUser.email : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalPoints,
      questionCount: questions.length,
      difficultyCounts,
      questions,
      uploadedFiles: quizData.uploadedFiles || []
    };

    // Prepend to array so newest shows first
    quizzes.unshift(newQuiz);
    this._set('QUIZZES', quizzes);

    // Save directly to central server database immediately
    await this.pushToCentralServerNow();

    await this.logActivity('CREATE_QUIZ', 'quiz', newQuiz.id, `បានបង្កើតកម្រងតេស្ត៖ ${newQuiz.title}`);
    return newQuiz;
  }

  async updateQuiz(id, updates) {
    this._assertRole(['owner', 'teacher'], 'កែសម្រួលតេស្ត (Update Quiz)');
    const currentUser = window.auth ? window.auth.getCurrentUser() : null;

    const quizzes = this._get('QUIZZES');
    const index = quizzes.findIndex(q => q.id === id);
    if (index === -1) throw new Error('រកមិនឃើញកម្រងតេស្តនេះទេ');

    const existing = quizzes[index];

    // RBAC Check: Non-owner teachers can only edit quizzes they created
    if (currentUser && currentUser.role === 'teacher' && !currentUser.isOwner) {
      if (existing.createdBy && existing.createdBy !== currentUser.id && existing.createdByEmail && existing.createdByEmail !== currentUser.email) {
        throw new Error('សិទ្ធិត្រូវបានបដិសេធ (403 Forbidden): លោកអ្នកអាចកែសម្រួលតែតេស្តដែលលោកអ្នកបានបង្កើតប៉ុណ្ណោះ!');
      }
    }

    let questions = updates.questions ? updates.questions.map((q, idx) => ({
      ...q,
      id: q.id || ('q-' + Date.now() + '-' + (idx + 1)),
      number: q.number || (idx + 1),
      type: q.type || 'mcq',
      difficulty: q.difficulty || 'medium',
      points: parseFloat(q.points) || 5,
      promptKm: q.promptKm || '',
      mathFormula: q.mathFormula || '',
      options: q.options || [],
      correctOption: q.correctOption !== undefined ? q.correctOption : 'A',
      explanationKm: q.explanationKm || '',
      image: q.image || q.imageUrl || null
    })) : existing.questions;

    const totalPoints = questions.reduce((acc, q) => acc + (parseFloat(q.points) || 1), 0);
    const difficultyCounts = updates.difficultyCounts || {
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length
    };

    quizzes[index] = {
      ...existing,
      ...updates,
      id: existing.id, // Strictly protect original ID to avoid duplicates!
      questions,
      totalPoints,
      questionCount: questions.length,
      difficultyCounts,
      updatedAt: new Date().toISOString()
    };

    this._set('QUIZZES', quizzes);
    await this.pushToCentralServerNow();

    await this.logActivity('UPDATE_QUIZ', 'quiz', id, `បានកែសម្រួលកម្រងតេស្ត៖ ${quizzes[index].title}`);
    return quizzes[index];
  }

  async duplicateQuiz(id) {
    this._assertRole(['owner', 'teacher'], 'ចម្លងកម្រងតេស្ត (Duplicate Quiz)');
    const target = await this.getQuizById(id, 'teacher');
    if (!target) throw new Error('រកមិនឃើញកម្រងតេស្តដែលត្រូវចម្លងទេ');

    const currentUser = window.auth ? window.auth.getCurrentUser() : null;

    const duplicatedData = {
      ...target,
      id: 'quiz-' + Date.now(),
      title: target.title + ' (ចម្លង)',
      isPublished: false, // Default to draft
      createdBy: currentUser ? currentUser.id : target.createdBy,
      createdByName: currentUser ? (currentUser.fullNameKm || currentUser.fullNameEn) : target.createdByName,
      createdByEmail: currentUser ? currentUser.email : target.createdByEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return await this.createQuiz(duplicatedData);
  }

  async togglePublishQuiz(id) {
    this._assertRole(['owner', 'teacher'], 'ផ្លាស់ប្តូរការផ្សព្វផ្សាយតេស្ត');
    const quiz = await this.getQuizById(id, 'teacher');
    if (!quiz) throw new Error('រកមិនឃើញកម្រងតេស្តទេ');
    return await this.updateQuiz(id, { isPublished: !quiz.isPublished });
  }

  async deleteQuiz(id) {
    this._assertRole(['owner', 'teacher'], 'លុបកម្រងតេស្ត (Delete Quiz)');
    const currentUser = window.auth ? window.auth.getCurrentUser() : null;

    let quizzes = this._get('QUIZZES');
    const target = quizzes.find(q => q.id === id);
    if (!target) return true;

    // RBAC: Non-owner teachers can only delete their own quizzes
    if (currentUser && currentUser.role === 'teacher' && !currentUser.isOwner) {
      if (target.createdBy && target.createdBy !== currentUser.id && target.createdByEmail && target.createdByEmail !== currentUser.email) {
        throw new Error('សិទ្ធិត្រូវបានបដិសេធ (403 Forbidden): លោកអ្នកអាចលុបតែតេស្តដែលលោកអ្នកបានបង្កើតប៉ុណ្ណោះ!');
      }
    }

    quizzes = quizzes.filter(q => q.id !== id);
    this._set('QUIZZES', quizzes);
    await this.pushToCentralServerNow();

    await this.logActivity('DELETE_QUIZ', 'quiz', id, `បានលុបកម្រងតេស្ត៖ ${target.title}`);
    return true;
  }

  // ==========================================
  // ATTEMPTS, TEST ARENA & PRIVACY ENFORCEMENT
  // ==========================================
  async startQuizAttempt(quizId, studentId, studentName, classId) {
    // Student can only start attempt for themselves
    if (window.auth && window.auth.isStudent() && window.auth.getCurrentUser().id !== studentId) {
      throw new Error('សិទ្ធិត្រូវបានបដិសេធ៖ មិនអាចចាប់ផ្តើមតេស្តជំនួសអ្នកដទៃបានទេ!');
    }

    const fullQuiz = await this.getQuizById(quizId, 'owner');
    if (!fullQuiz) throw new Error('កម្រងតេស្តមិនមានក្នុងប្រព័ន្ធ');

    const attempts = this._get('ATTEMPTS');
    const studentAttempts = attempts.filter(a => a.quizId === quizId && a.studentId === studentId);

    if (fullQuiz.maxAttempts && studentAttempts.length >= fullQuiz.maxAttempts) {
      // Check if retake is allowed by teacher
      const lastAttempt = studentAttempts[studentAttempts.length - 1];
      if (!lastAttempt || !lastAttempt.allowRetake) {
        throw new Error(`អ្នកបានប្រើចំនួនដងអតិបរមា (${fullQuiz.maxAttempts} ដង) រួចហើយសម្រាប់តេស្តនេះ!`);
      }
    }

    const now = new Date();
    const durationMs = (fullQuiz.timeLimitMinutes || 30) * 60 * 1000;
    const expiresAt = new Date(now.getTime() + durationMs);

    const newAttempt = {
      id: 'att-' + Date.now(),
      quizId,
      studentId,
      studentName,
      classId,
      attemptNumber: studentAttempts.length + 1,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      submittedAt: null,
      totalScore: 0,
      maxScore: fullQuiz.totalPoints,
      percentage: 0,
      status: 'in_progress',
      answers: {},
      teacherFeedback: null,
      allowRetake: false
    };

    attempts.push(newAttempt);
    this._set('ATTEMPTS', attempts);

    await this.logActivity('START_QUIZ', 'attempt', newAttempt.id, `សិស្ស ${studentName} បានចាប់ផ្តើមតេស្ត ${fullQuiz.title}`);
    return newAttempt;
  }

  async saveAttemptDraft(attemptId, answers) {
    const attempts = this._get('ATTEMPTS');
    const index = attempts.findIndex(a => a.id === attemptId);
    if (index === -1) return;

    // Student can only save their own in-progress attempt
    if (window.auth && window.auth.isStudent()) {
      if (attempts[index].studentId !== window.auth.getCurrentUser().id) {
        throw new Error('សិទ្ធិត្រូវបានបដិសេធ!');
      }
    }

    if (attempts[index].status !== 'in_progress') {
      return; // Already submitted
    }

    attempts[index].answers = { ...attempts[index].answers, ...answers };
    attempts[index].lastDraftSavedAt = new Date().toISOString();
    this._set('ATTEMPTS', attempts);
    return true;
  }

  async submitQuizAttempt(attemptId, finalAnswers) {
    const attempts = this._get('ATTEMPTS');
    const index = attempts.findIndex(a => a.id === attemptId);
    if (index === -1) throw new Error('រកមិនឃើញការប្រឡងនេះទេ');

    const attempt = attempts[index];

    // Security: Student cannot submit other student's test or resubmit a finished test
    if (window.auth && window.auth.isStudent()) {
      if (attempt.studentId !== window.auth.getCurrentUser().id) {
        throw new Error('សិទ្ធិត្រូវបានបដិសេធ!');
      }
    }

    if (attempt.status !== 'in_progress' && !attempt.allowRetake) {
      throw new Error('តេស្តនេះត្រូវបានបញ្ជូនរួចហើយ មិនអាចកែប្រែបានទៀតឡើយ!');
    }

    const fullQuiz = await this.getQuizById(attempt.quizId, 'owner');
    if (!fullQuiz) throw new Error('កម្រងតេស្តមិនមានក្នុងប្រព័ន្ធ');

    const now = new Date();
    const expiresAt = new Date(attempt.expiresAt);
    const isTimedOut = (now.getTime() - expiresAt.getTime()) > 15000;

    // Server-Side Objective Grading
    let totalScore = 0;
    const gradedAnswers = {};
    let hasOpenResponse = false;

    for (const question of fullQuiz.questions) {
      const studentResponse = (finalAnswers[question.id] || '').trim();
      const points = parseFloat(question.points) || 1;
      let isCorrect = false;
      let scoreAwarded = 0;

      if (question.type === 'mcq' || question.type === 'true_false') {
        if (studentResponse.toLowerCase() === (question.correctOption || '').toLowerCase()) {
          isCorrect = true;
          scoreAwarded = points;
        }
      } else if (question.type === 'short_answer') {
        const expected = (question.correctOption || '').trim().toLowerCase();
        if (studentResponse.toLowerCase() === expected) {
          isCorrect = true;
          scoreAwarded = points;
        }
      } else if (question.type === 'open_response') {
        hasOpenResponse = true;
        scoreAwarded = 0; // pending manual grading by teacher
        isCorrect = null;
      }

      totalScore += scoreAwarded;
      gradedAnswers[question.id] = {
        response: studentResponse,
        isCorrect,
        score: scoreAwarded,
        teacherNotes: ''
      };
    }

    const maxScore = fullQuiz.totalPoints || 1;
    const percentage = Math.round((totalScore / maxScore) * 100);

    attempts[index] = {
      ...attempt,
      submittedAt: now.toISOString(),
      expiresAt: attempt.expiresAt,
      status: isTimedOut ? 'timed_out' : (hasOpenResponse ? 'submitted' : 'graded'),
      totalScore,
      maxScore,
      percentage,
      answers: gradedAnswers,
      isTimedOut,
      allowRetake: false
    };

    this._set('ATTEMPTS', attempts);

    await this.logActivity(
      'SUBMIT_QUIZ',
      'attempt',
      attempt.id,
      `សិស្ស ${attempt.studentName} បានបញ្ជូនតេស្ត ${fullQuiz.title} (ពិន្ទុ: ${totalScore}/${maxScore})`
    );

    return attempts[index];
  }

  // --- Student Privacy Protected Query ---
  async getStudentAttempts(studentId, quizId = null) {
    // ENFORCE STUDENT PRIVACY:
    // A student can ONLY query their own studentId!
    if (window.auth && window.auth.isStudent()) {
      const currentStudentId = window.auth.getCurrentUser().id;
      if (currentStudentId !== studentId) {
        throw new Error('សិទ្ធិត្រូវបានបដិសេធ (403 Forbidden): សិស្សមិនអាចមើលលទ្ធផលរបស់សិស្សដទៃបានឡើយ!');
      }
    }

    let attempts = this._get('ATTEMPTS');
    attempts = attempts.filter(a => a.studentId === studentId);
    if (quizId) {
      attempts = attempts.filter(a => a.quizId === quizId);
    }
    return attempts;
  }

  async getAttemptsByQuiz(quizId) {
    this._assertRole(['owner', 'teacher'], 'មើលលទ្ធផលរួមនៃតេស្ត (View Quiz Submissions)');
    const attempts = this._get('ATTEMPTS');
    return attempts.filter(a => a.quizId === quizId);
  }

  async gradeStudentAttempt(attemptId, scoresByQuestion, teacherFeedback = '') {
    this._assertRole(['owner', 'teacher'], 'កែពិន្ទុការប្រឡង (Grade Student Submission)');

    const attempts = this._get('ATTEMPTS');
    const index = attempts.findIndex(a => a.id === attemptId);
    if (index === -1) throw new Error('រកមិនឃើញការប្រឡង');

    const attempt = attempts[index];
    let totalScore = 0;

    for (const [qId, detail] of Object.entries(scoresByQuestion)) {
      if (attempt.answers[qId]) {
        attempt.answers[qId].score = parseFloat(detail.score) || 0;
        attempt.answers[qId].teacherNotes = detail.notes || '';
        attempt.answers[qId].isCorrect = attempt.answers[qId].score > 0;
      }
    }

    for (const key of Object.keys(attempt.answers)) {
      totalScore += (parseFloat(attempt.answers[key].score) || 0);
    }

    attempt.totalScore = totalScore;
    attempt.percentage = Math.round((totalScore / (attempt.maxScore || 1)) * 100);
    attempt.status = 'graded';
    attempt.teacherFeedback = teacherFeedback;
    attempt.gradedAt = new Date().toISOString();
    attempt.gradedBy = window.auth.getCurrentUser().id;

    attempts[index] = attempt;
    this._set('ATTEMPTS', attempts);

    await this.logActivity(
      'GRADE_ATTEMPT',
      'attempt',
      attemptId,
      `បានកែពិន្ទុសិស្ស ${attempt.studentName} (ពិន្ទុថ្មី: ${totalScore}/${attempt.maxScore})`
    );

    return attempt;
  }

  async allowStudentRetake(attemptId) {
    this._assertRole(['owner', 'teacher'], 'អនុញ្ញាតឱ្យសិស្សប្រឡងឡើងវិញ (Allow Retake)');

    const attempts = this._get('ATTEMPTS');
    const index = attempts.findIndex(a => a.id === attemptId);
    if (index === -1) throw new Error('រកមិនឃើញការប្រឡង');

    attempts[index].allowRetake = true;
    attempts[index].status = 'in_progress';
    this._set('ATTEMPTS', attempts);

    await this.logActivity(
      'ALLOW_RETAKE',
      'attempt',
      attemptId,
      `បានអនុញ្ញាតឱ្យសិស្ស ${attempts[index].studentName} ធ្វើតេស្តឡើងវិញ`
    );

    return true;
  }

  // ==========================================
  // ANALYTICS & CSV EXPORT
  // ==========================================
  async getQuizAnalytics(quizId) {
    this._assertRole(['owner', 'teacher'], 'មើលរបាយការណ៍វិភាគ (View Analytics)');

    const attempts = await this.getAttemptsByQuiz(quizId);
    const submitted = attempts.filter(a => a.status === 'submitted' || a.status === 'graded');

    if (submitted.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        averagePercentage: 0,
        highestScore: 0,
        lowestScore: 0,
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
        questionAnalytics: []
      };
    }

    const totalSubmissions = submitted.length;
    const scores = submitted.map(a => a.totalScore);
    const percentages = submitted.map(a => a.percentage);

    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const averageScore = (scores.reduce((a, b) => a + b, 0) / totalSubmissions).toFixed(1);
    const averagePercentage = Math.round(percentages.reduce((a, b) => a + b, 0) / totalSubmissions);

    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    submitted.forEach(a => {
      const p = a.percentage;
      if (p >= 85) gradeDistribution.A++;
      else if (p >= 75) gradeDistribution.B++;
      else if (p >= 65) gradeDistribution.C++;
      else if (p >= 50) gradeDistribution.D++;
      else if (p >= 40) gradeDistribution.E++;
      else gradeDistribution.F++;
    });

    const fullQuiz = await this.getQuizById(quizId, 'owner');
    const questionAnalytics = (fullQuiz.questions || []).map((q, idx) => {
      let correctCount = 0;
      submitted.forEach(a => {
        if (a.answers[q.id] && a.answers[q.id].isCorrect) {
          correctCount++;
        }
      });
      return {
        questionId: q.id,
        number: idx + 1,
        promptKm: q.promptKm,
        type: q.type,
        correctCount,
        successRate: Math.round((correctCount / totalSubmissions) * 100)
      };
    });

    return {
      totalSubmissions,
      averageScore,
      averagePercentage,
      highestScore,
      lowestScore,
      gradeDistribution,
      questionAnalytics
    };
  }

  generateCSV(attempts, quizTitle) {
    let csv = '\uFEFF'; // UTF-8 BOM for Khmer text
    csv += 'ឈ្មោះសិស្ស,លេខសម្គាល់,កាលបរិច្ឆេទបញ្ជូន,ពិន្ទុទទួលបាន,ពិន្ទុសរុប,ភាគរយ (%),និទ្ទេស,ស្ថានភាព\n';

    attempts.forEach(a => {
      const grade = a.percentage >= 85 ? 'A' : (a.percentage >= 75 ? 'B' : (a.percentage >= 65 ? 'C' : (a.percentage >= 50 ? 'D' : (a.percentage >= 40 ? 'E' : 'F'))));
      const dateStr = a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('km-KH') : 'មិនទាន់បញ្ជូន';
      csv += `"${a.studentName || 'សិស្ស'}","${a.studentId}","${dateStr}",${a.totalScore},${a.maxScore},${a.percentage}%,"${grade}","${a.status}"\n`;
    });

    return csv;
  }
}

// Global DB instance
window.db = new DatabaseService();
