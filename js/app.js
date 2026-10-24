/**
 * Khmer Math Learning & Assessment System (រៀន និងវាយតម្លៃគណិតវិទ្យាខ្មែរ)
 * Main Application Orchestrator, Router & View Controller
 */

class App {
  constructor() {
    this.currentView = null;
    this.modalCallback = null;
  }

  async init() {
    console.log('🚀 Initializing Khmer Math Learning & Assessment System...');

    // 1. Initialize Database
    await window.db.init();

    // 2. Initialize Authentication
    await window.auth.init();

    // 3. Setup Navigation & Global Event Listeners
    this.setupGlobalEvents();

    // 4. Update Header UI based on initial user
    this.updateHeaderUI();

    // 5. Initialize PWA, Service Worker & Offline Listeners
    this.initPWAAndOffline();

    // 6. Navigate to default role view
    const initialRole = window.auth.getRole();
    if (initialRole === 'owner') {
      this.navigate('owner-dashboard');
    } else if (initialRole === 'teacher') {
      this.navigate('teacher-lessons');
    } else if (initialRole === 'student') {
      this.navigate('student-lessons');
    } else {
      this.navigate('owner-dashboard');
    }

    console.log('✨ System initialized successfully.');
  }

  initPWAAndOffline() {
    // 1. Register Service Worker for PWA caching & offline resilience
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', { scope: './' })
          .then(registration => {
            console.log('✅ Khmer Math PWA ServiceWorker registered with scope:', registration.scope);
          })
          .catch(error => {
            console.warn('⚠️ ServiceWorker registration info:', error);
          });
      });
    }

    // 2. Network connectivity listeners (Online / Offline status)
    const updateOnlineStatus = () => {
      const offlinePill = document.getElementById('header-offline-pill');
      if (offlinePill) {
        offlinePill.style.display = navigator.onLine ? 'none' : 'inline-flex';
      }
    };

    window.addEventListener('online', () => {
      updateOnlineStatus();
      this.showToast('🌐 អ៊ីនធឺណិតបានភ្ជាប់ឡើងវិញ (Online)', 'success');
      if (window.db && window.db.syncFromCentralServer) {
        window.db.syncFromCentralServer();
      }
    });

    window.addEventListener('offline', () => {
      updateOnlineStatus();
      this.showToast('⚠️ គ្មានការតភ្ជាប់អ៊ីនធឺណិត (Offline Mode) - ដំណើរការជាមួយទិន្នន័យក្នុងឧបករណ៍', 'warning');
    });

    updateOnlineStatus();

    // 3. PWA Install Prompt handling
    let deferredPrompt = null;
    const installBtn = document.getElementById('btn-header-install');
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (!isStandalone) {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) {
          installBtn.style.display = 'inline-flex';
        }
      });

      if (installBtn) {
        if (isIos) {
          installBtn.style.display = 'inline-flex';
        }

        installBtn.onclick = async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            console.log('User install choice:', choiceResult.outcome);
            deferredPrompt = null;
            installBtn.style.display = 'none';
          } else if (isIos) {
            const iosModal = document.getElementById('ios-install-modal');
            if (iosModal) iosModal.classList.add('active');
          } else {
            this.showToast('💡 ដើម្បីដំឡើង App សូមចុចម៉ឺនុយ Browser (⋮ ឬ ⋯) រួចជ្រើសរើស "Install Khmer Math" ឬ "Add to Home Screen"', 'info');
          }
        };
      }
    }

    window.addEventListener('appinstalled', () => {
      console.log('🎉 Khmer Math PWA installed');
      if (installBtn) installBtn.style.display = 'none';
      this.showToast('🎉 បានដំឡើង Khmer Math App ដោយជោគជ័យ!', 'success');
    });

    // iOS guidance modal event handlers
    const iosCloseBtn = document.getElementById('ios-modal-close-btn');
    const iosDoneBtn = document.getElementById('ios-modal-done-btn');
    const iosModal = document.getElementById('ios-install-modal');
    if (iosCloseBtn && iosModal) {
      iosCloseBtn.onclick = () => iosModal.classList.remove('active');
    }
    if (iosDoneBtn && iosModal) {
      iosDoneBtn.onclick = () => iosModal.classList.remove('active');
    }
  }

  setupGlobalEvents() {
    // Listen for auth changes
    window.addEventListener('km:auth-changed', () => {
      this.updateHeaderUI();
      const role = window.auth.getRole();
      if (role === 'owner') this.navigate('owner-dashboard');
      else if (role === 'teacher') this.navigate('teacher-lessons');
      else if (role === 'student') this.navigate('student-lessons');
    });

    // Quick Role Switcher Button
    const rolePill = document.getElementById('header-role-pill');
    if (rolePill) {
      rolePill.onclick = () => this.showRoleSwitcherModal();
    }

    // Database Status Pill
    const dbPill = document.getElementById('header-db-pill');
    if (dbPill) {
      dbPill.onclick = () => this.showSupabaseConfigModal();
    }

    // Header Logout Button
    const logoutBtn = document.getElementById('header-logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = () => this.showAuthLoginModal();
    }

    // Modal Close Button
    const modalClose = document.getElementById('modal-close-btn');
    const modalCancel = document.getElementById('modal-cancel-btn');
    const modalOverlay = document.getElementById('main-modal-overlay');

    if (modalClose) modalClose.onclick = () => this.closeModal();
    if (modalCancel) modalCancel.onclick = () => this.closeModal();
    if (modalOverlay) {
      modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) this.closeModal();
      };
    }
  }

  updateHeaderUI() {
    const user = window.auth.getCurrentUser();
    const role = window.auth.getRole();

    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const avatarEl = document.getElementById('header-user-avatar');
    const rolePill = document.getElementById('header-role-pill');
    const dbDot = document.getElementById('header-db-dot');
    const dbText = document.getElementById('header-db-text');

    if (user) {
      if (nameEl) nameEl.textContent = user.fullNameKm || user.email;
      if (roleEl) roleEl.textContent = user.schoolName || (role === 'teacher' ? 'គ្រូបង្រៀន' : 'សិស្ស');
      if (avatarEl) avatarEl.textContent = user.avatar || (role === 'teacher' ? '👨‍🏫' : '👨‍🎓');
    }

    // Role Pill text & class
    if (rolePill) {
      rolePill.className = `role-badge-pill ${role}`;
      let roleLabel = '👑 ម្ចាស់កម្មវិធី (Super Admin)';
      if (role === 'teacher') roleLabel = '👨‍🏫 គ្រូបង្រៀន (Teacher)';
      if (role === 'student') roleLabel = '👨‍🎓 សិស្ស (Student)';
      rolePill.innerHTML = `<i data-lucide="${role === 'owner' ? 'crown' : 'shield-check'}" style="width:14px;height:14px;"></i> ${roleLabel}`;
    }

    // DB Status
    if (dbDot && dbText) {
      if (window.db.isSupabaseConnected) {
        dbDot.className = 'db-status-dot supabase';
        dbText.textContent = 'Supabase PostgreSQL';
      } else {
        dbDot.className = 'db-status-dot local';
        dbText.textContent = 'Local Database Engine';
      }
    }

    // Render Navigation Tab Strip for the active role
    this.renderNavTabs(role);
    if (window.lucide) window.lucide.createIcons();
  }

  renderNavTabs(role) {
    const strip = document.getElementById('nav-tab-strip');
    const mobileInner = document.getElementById('mobile-bottom-inner');

    let tabs = [];
    if (role === 'owner') {
      tabs = [
        { id: 'owner-dashboard', icon: 'shield-check', label: '👑 ផ្ទាំងគ្រប់គ្រង Owner', shortLabel: 'Owner' },
        { id: 'teacher-lessons', icon: 'book-open', label: 'គ្រប់គ្រងថ្នាក់ & មេរៀន', shortLabel: 'មេរៀន' },
        { id: 'teacher-quizzes', icon: 'file-text', label: 'ប្រព័ន្ធតេស្ត & សំណួរ', shortLabel: 'តេស្ត' },
        { id: 'teacher-grading', icon: 'bar-chart-2', label: 'លទ្ធផល & កែពិន្ទុ', shortLabel: 'ពិន្ទុ' },
        { id: 'teacher-ai', icon: 'sparkles', label: 'AI Math Studio', shortLabel: 'AI' },
        { id: 'settings', icon: 'database', label: 'ការកំណត់ & DB', shortLabel: 'កំណត់' }
      ];
    } else if (role === 'teacher') {
      tabs = [
        { id: 'teacher-lessons', icon: 'book-open', label: 'គ្រប់គ្រងថ្នាក់ & មេរៀន', shortLabel: 'មេរៀន' },
        { id: 'teacher-quizzes', icon: 'file-text', label: 'ប្រព័ន្ធតេស្ត & សំណួរ', shortLabel: 'តេស្ត' },
        { id: 'teacher-ai', icon: 'sparkles', label: 'AI Math Studio', shortLabel: 'AI' },
        { id: 'teacher-grading', icon: 'bar-chart-2', label: 'លទ្ធផល & កែពិន្ទុ', shortLabel: 'កែពិន្ទុ' },
        { id: 'settings', icon: 'settings', label: 'ការកំណត់', shortLabel: 'កំណត់' }
      ];
    } else if (role === 'student') {
      tabs = [
        { id: 'student-lessons', icon: 'book-open', label: 'មេរៀន និងឯកសាររៀន', shortLabel: 'មេរៀន' },
        { id: 'student-quizzes', icon: 'edit-3', label: 'តេស្តត្រូវប្រឡង', shortLabel: 'ប្រឡង' },
        { id: 'student-results', icon: 'award', label: 'លទ្ធផលរបស់ខ្ញុំ', shortLabel: 'លទ្ធផល' }
      ];
    }

    // 1. Desktop Nav Tab Strip
    if (strip) {
      strip.innerHTML = tabs.map(t => `
        <button class="nav-tab-btn ${this.currentView === t.id ? 'active' : ''}" data-view="${t.id}">
          <i data-lucide="${t.icon}"></i> ${t.label}
        </button>
      `).join('');

      strip.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.onclick = () => this.navigate(btn.dataset.view);
      });
    }

    // 2. Mobile Bottom Navigation Bar (Phone / Small Screen)
    if (mobileInner) {
      mobileInner.innerHTML = tabs.map(t => `
        <button class="mobile-nav-item ${this.currentView === t.id ? 'active' : ''}" data-view="${t.id}" title="${t.label}">
          <i data-lucide="${t.icon}"></i>
          <span>${t.shortLabel || t.label}</span>
        </button>
      `).join('');

      mobileInner.querySelectorAll('.mobile-nav-item').forEach(btn => {
        btn.onclick = () => this.navigate(btn.dataset.view);
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  navigate(viewId) {
    this.currentView = viewId;

    // Update active tab styling on both desktop and mobile bars
    document.querySelectorAll('.nav-tab-btn, .mobile-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewId);
    });

    this.renderCurrentView();
  }

  async renderCurrentView() {
    const container = document.getElementById('view-container');
    if (!container) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (this.currentView) {
      // Teacher views
      case 'teacher-lessons':
        await window.teacherController.renderClassesAndLessons(container);
        break;
      case 'teacher-quizzes':
        await window.teacherController.renderQuizManager(container);
        break;
      case 'teacher-ai':
        window.aiStudio.renderStudio(container);
        break;
      case 'teacher-grading':
        await window.analyticsController.renderTeacherGrading(container);
        break;

      // Student views
      case 'student-lessons':
        await this.renderStudentLessons(container);
        break;
      case 'student-quizzes':
        await this.renderStudentQuizzes(container);
        break;
      case 'student-results':
        await this.renderStudentResults(container);
        break;

      // Super Admin / Owner Dashboard
      case 'owner-dashboard':
        await window.adminController.renderDashboard(container);
        break;

      // Admin & Settings
      case 'admin-users':
        await window.adminController.renderDashboard(container);
        break;
      case 'settings':
        this.renderSettings(container);
        break;

      default:
        container.innerHTML = `<p>ទំព័រមិនមាន</p>`;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================
  // STUDENT VIEWS
  // ==========================================
  async renderStudentLessons(container) {
    const student = window.auth.getCurrentUser();
    const enrolledCode = student.classCode || 'MTH-12A';
    const activeClass = await window.db.getClassByCode(enrolledCode) || (await window.db.getClasses(12))[0];
    const chapters = activeClass ? await window.db.getChapters(activeClass.id) : [];

    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <!-- Student Hero Banner -->
        <div class="hero-card">
          <div class="hero-inner">
            <div class="hero-text">
              <span class="status-pill status-active" style="margin-bottom: 0.5rem;">កម្រិតសិក្សា ថ្នាក់ទី ${activeClass ? activeClass.grade : 12}</span>
              <h1>សួស្តីប្អូន ${student.fullNameKm || 'សិស្ស'}!</h1>
              <p>សូមស្វាគមន៍មកកាន់ប្រព័ន្ធរៀន និងវាយតម្លៃគណិតវិទ្យា។ អ្នកកំពុងស្ថិតក្នុង៖ <b>${activeClass ? activeClass.name : 'ថ្នាក់ទី១២'}</b></p>
            </div>

            <div style="display: flex; gap: 0.75rem;">
              <button class="btn btn-secondary" id="btn-student-join-class">
                <i data-lucide="key"></i> ចូលថ្នាក់តាមកូដថ្មី
              </button>
              <button class="btn btn-primary" id="btn-student-quick-quiz">
                <i data-lucide="edit-3"></i> ធ្វើតេស្តប្រចាំខែ
              </button>
            </div>
          </div>
        </div>

        <!-- Lessons & Study Materials Content -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="book-open" style="color: var(--accent-cyan);"></i> កម្មវិធីមេរៀន និងឯកសារជំនួយស្មារតី
          </h2>
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            កូដថ្នាក់៖ <b style="color:var(--accent-cyan);">${activeClass ? activeClass.code : ''}</b>
          </span>
        </div>

        <!-- Chapters List -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${chapters.length === 0 ? `
            <div class="card" style="text-align: center; padding: 3rem; color: var(--text-muted);">
              មិនទាន់មានមេរៀនដែលបានផ្សព្វផ្សាយនៅឡើយទេ។
            </div>
          ` : ''}

          ${chapters.map(chap => `
            <div class="chapter-accordion">
              <div class="chapter-header">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <i data-lucide="folder" style="color: var(--primary-light);"></i>
                  <div>
                    <h3 style="font-size: 1.05rem; font-weight: 600; color: #fff;">${chap.title}</h3>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${chap.description || ''}</span>
                  </div>
                </div>
              </div>

              <div class="chapter-lessons-list" id="student-lessons-list-${chap.id}">
                <!-- Populated below -->
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Populate student lessons (Published only!)
    for (const chap of chapters) {
      const lesContainer = document.getElementById(`student-lessons-list-${chap.id}`);
      if (!lesContainer) continue;

      const lessons = await window.db.getLessons(chap.id, 'student'); // Student role only sees published!
      if (lessons.length === 0) {
        lesContainer.innerHTML = `<div style="padding: 1rem 1.5rem; color: var(--text-dim); font-size: 0.85rem;">មិនទាន់មានមេរៀនបើកឱ្យមើលទេ</div>`;
        continue;
      }

      lesContainer.innerHTML = lessons.map(les => `
        <div class="lesson-item-row">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <i data-lucide="book" style="color: var(--accent-cyan); width: 18px; height: 18px;"></i>
            <div>
              <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">${les.title}</div>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.35rem; flex-wrap: wrap;">
                ${(les.files || []).map(f => `
                  <a href="${f.url}" download="${f.name}" target="_blank" class="lesson-badge-tag badge-${f.type}" style="text-decoration:none;">
                    <i data-lucide="download" style="width: 12px; height: 12px;"></i> ${f.name} (${f.size})
                  </a>
                `).join('')}

                ${les.video ? `
                  <span class="lesson-badge-tag badge-video">
                    <i data-lucide="video" style="width: 12px; height: 12px;"></i> វីដេអូបង្រៀន
                  </span>
                ` : ''}
              </div>
            </div>
          </div>

          <button class="btn btn-secondary btn-sm btn-student-read-lesson" data-lesid="${les.id}">
            <i data-lucide="eye"></i> មើលមេរៀន & វីដេអូ
          </button>
        </div>
      `).join('');

      if (window.lucide) window.lucide.createIcons();
    }

    // Join class by code button
    const joinBtn = document.getElementById('btn-student-join-class');
    if (joinBtn) {
      joinBtn.onclick = () => this.showStudentJoinClassModal();
    }

    // Quick quiz button
    const quickQuizBtn = document.getElementById('btn-student-quick-quiz');
    if (quickQuizBtn) {
      quickQuizBtn.onclick = () => this.navigate('student-quizzes');
    }

    // Read lesson modal
    container.querySelectorAll('.btn-student-read-lesson').forEach(btn => {
      btn.onclick = () => window.teacherController.showViewLessonModal(btn.dataset.lesid);
    });
  }

  showStudentJoinClassModal() {
    this.openModal({
      title: 'ចូលថ្នាក់រៀនតាមកូដដែលគ្រូផ្ដល់',
      bodyHtml: `
        <div>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
            សូមបញ្ចូលកូដថ្នាក់ដែលលោកគ្រូ/អ្នកគ្រូបានផ្ដល់ឱ្យ (ឧទាហរណ៍៖ MTH-12A, MTH-11B, MTH-10C) ដើម្បីចូលរៀន និងមើលមេរៀន។
          </p>
          <div class="form-group">
            <label class="form-label">កូដថ្នាក់ (Class Code) *</label>
            <input type="text" class="form-control" id="join-class-code-input" placeholder="MTH-12A" style="font-size: 1.1rem; text-transform: uppercase;" required />
          </div>
        </div>
      `,
      confirmText: 'ចូលថ្នាក់រៀន',
      onConfirm: async () => {
        const code = document.getElementById('join-class-code-input').value.trim();
        if (!code) {
          this.showToast('សូមបញ្ចូលកូដថ្នាក់!', 'error');
          return false;
        }

        const foundClass = await window.db.getClassByCode(code);
        if (!foundClass) {
          this.showToast('រកមិនឃើញថ្នាក់រៀនដែលមានកូដនេះទេ! សូមពិនិត្យឡើងវិញ។', 'error');
          return false;
        }

        // Update student enrolled code
        const student = window.auth.getCurrentUser();
        student.classCode = foundClass.code;
        student.gradeLevel = foundClass.grade;
        localStorage.setItem(window.auth.sessionKey, JSON.stringify(student));

        this.showToast(`បានចូលរួមថ្នាក់ «${foundClass.name}» ដោយជោគជ័យ!`, 'success');
        this.renderCurrentView();
        return true;
      }
    });
  }

  async renderStudentQuizzes(container) {
    const student = window.auth.getCurrentUser();
    const enrolledCode = student.classCode || 'MTH-12A';
    const activeClass = await window.db.getClassByCode(enrolledCode) || (await window.db.getClasses(12))[0];
    const quizzes = activeClass ? await window.db.getQuizzes(activeClass.id, 'student') : [];

    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="edit-3" style="color: var(--primary-light);"></i> តេស្ត និងការវាយតម្លៃសមត្ថភាព
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">ជ្រើសរើសតេស្តដើម្បីប្រឡង វាស់ស្ទង់សមត្ថភាព និងពិនិត្យដំណោះស្រាយលម្អិត</p>
          </div>
        </div>

        <!-- Quizzes Cards Grid -->
        <div class="content-grid-3">
          ${quizzes.length === 0 ? `
            <div class="card" style="text-align: center; padding: 3rem; grid-column: 1 / -1; color: var(--text-muted);">
              មិនទាន់មានកម្រងតេស្តសម្រាប់ថ្នាក់នេះនៅឡើយទេ។
            </div>
          ` : ''}

          ${quizzes.map(q => `
            <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <span class="status-pill status-active">បើកដំណើរការ</span>
                  <span style="font-family: var(--font-math); font-size: 0.82rem; color: var(--accent-cyan); display: flex; align-items: center; gap: 0.3rem;">
                    <i data-lucide="clock" style="width: 14px; height: 14px;"></i> ${q.timeLimitMinutes} នាទី
                  </span>
                </div>

                <h3 style="font-size: 1.15rem; font-weight: 600; color: #fff; margin-bottom: 0.5rem; line-height: 1.4;">
                  ${q.title}
                </h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem; line-height: 1.5;">
                  ${q.description || ''}
                </p>

                <div style="display: flex; gap: 1.25rem; font-size: 0.82rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; margin-bottom: 1.5rem;">
                  <div><i data-lucide="help-circle" style="width: 14px; height: 14px; vertical-align: middle;"></i> <b>${(q.questions || []).length}</b> សំណួរ</div>
                  <div><i data-lucide="award" style="width: 14px; height: 14px; vertical-align: middle;"></i> <b>${q.totalPoints}</b> ពិន្ទុ</div>
                  <div><i data-lucide="refresh-cw" style="width: 14px; height: 14px; vertical-align: middle;"></i> <b>${q.maxAttempts || 1}</b> ដង</div>
                </div>
              </div>

              <!-- Start Test Button -->
              <button class="btn btn-primary btn-start-test-direct" data-qid="${q.id}" style="width: 100%;">
                <i data-lucide="play"></i> ចាប់ផ្ដើមតេស្ត
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Start Test clicks
    container.querySelectorAll('.btn-start-test-direct').forEach(btn => {
      btn.onclick = () => {
        const qid = btn.dataset.qid;
        this.openModal({
          title: 'ការណែនាំមុនចាប់ផ្ដើមតេស្ត',
          bodyHtml: `
            <div>
              <p style="font-size: 0.95rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 1rem;">
                📌 <b>លក្ខខណ្ឌនៃការប្រឡង៖</b><br/>
                ១. ពេលវេលានឹងរាប់ថយក្រោយភ្លាមៗនៅពេលអ្នកចុច «ចាប់ផ្ដើម»។<br/>
                ២. ប្រព័ន្ធគ្រប់គ្រងពេលវេលាលើ Server ដោយសុវត្ថិភាព។ ប្រសិនបើផុតម៉ោង ប្រព័ន្ធនឹងបញ្ជូនចម្លើយដោយស្វ័យប្រវត្តិ។<br/>
                ៣. ចម្លើយរបស់អ្នកត្រូវបានរក្សាទុកជាបណ្ដោះអាសន្នរៀងរាល់ ១០ វិនាទីម្តង។<br/>
                ៤. ត្រៀមក្រដាសព្រាង ប៊ិច និងម៉ាស៊ីនគិតលេខឱ្យរួចរាល់។
              </p>
            </div>
          `,
          confirmText: 'ចាប់ផ្ដើមធ្វើតេស្តឥឡូវនេះ',
          onConfirm: async () => {
            await window.quizService.startTestForStudent(qid);
            return true;
          }
        });
      };
    });
  }

  async renderStudentResults(container) {
    const student = window.auth.getCurrentUser();
    const attempts = await window.db.getStudentAttempts(student.id);

    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="award" style="color: var(--accent-emerald);"></i> ប្រវត្តិ និងលទ្ធផលនៃការប្រឡងផ្ទាល់ខ្លួន
          </h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">ពិនិត្យពិន្ទុ និទ្ទេស មតិកែលម្អពីគ្រូ និងដំណោះស្រាយលម្អិត</p>
        </div>

        <div class="card">
          ${attempts.length === 0 ? `
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
              អ្នកមិនទាន់បានធ្វើតេស្តណាមួយនៅឡើយទេ។
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">
                    <th style="padding: 0.85rem 1rem;">កម្រងតេស្ត</th>
                    <th style="padding: 0.85rem 1rem;">កាលបរិច្ឆេទ</th>
                    <th style="padding: 0.85rem 1rem; text-align: center;">ពិន្ទុ</th>
                    <th style="padding: 0.85rem 1rem; text-align: center;">ភាគរយ</th>
                    <th style="padding: 0.85rem 1rem; text-align: center;">និទ្ទេស</th>
                    <th style="padding: 0.85rem 1rem; text-align: right;">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody>
                  ${attempts.map(att => {
                    const gradeLetter = att.percentage >= 85 ? 'A' : (att.percentage >= 75 ? 'B' : (att.percentage >= 65 ? 'C' : (att.percentage >= 50 ? 'D' : (att.percentage >= 40 ? 'E' : 'F'))));
                    const isPassed = att.percentage >= 50;
                    return `
                      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.04);">
                        <td style="padding: 1rem; font-weight: 600; color: #fff;">
                          ${att.quizId}
                        </td>
                        <td style="padding: 1rem; color: var(--text-muted); font-size: 0.85rem;">
                          ${att.submittedAt ? new Date(att.submittedAt).toLocaleDateString('km-KH') : 'មិនទាន់បញ្ជូន'}
                        </td>
                        <td style="padding: 1rem; text-align: center; font-family: var(--font-math); font-weight: 600; color: #fff;">
                          ${att.totalScore} / ${att.maxScore}
                        </td>
                        <td style="padding: 1rem; text-align: center; font-family: var(--font-math); font-weight: 600; color: ${isPassed ? '#34d399' : '#f87171'};">
                          ${att.percentage}%
                        </td>
                        <td style="padding: 1rem; text-align: center;">
                          <span style="display: inline-block; width: 26px; height: 26px; line-height: 26px; border-radius: 50%; background: ${isPassed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}; color: ${isPassed ? '#34d399' : '#f87171'}; font-weight: 700; font-family: var(--font-math);">
                            ${gradeLetter}
                          </span>
                        </td>
                        <td style="padding: 1rem; text-align: right;">
                          <button class="btn btn-secondary btn-sm btn-student-review" data-attid="${att.id}">
                            <i data-lucide="eye"></i> ពិនិត្យដំណោះស្រាយ
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Review attempt click
    container.querySelectorAll('.btn-student-review').forEach(btn => {
      btn.onclick = () => {
        const att = attempts.find(a => a.id === btn.dataset.attid);
        if (att) {
          window.quizService.renderTestResults(att);
        }
      };
    });
  }

  // ==========================================
  // ADMIN VIEW
  // ==========================================
  async renderAdminUsers(container) {
    const users = await window.db.getUsers();

    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="shield" style="color: var(--accent-amber);"></i> អ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin Dashboard)
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">គ្រប់គ្រងគណនីគ្រូ សិស្ស និងសិទ្ធិចូលប្រើប្រព័ន្ធ</p>
          </div>

          <div style="display: flex; gap: 0.75rem;">
            <button class="btn btn-danger btn-sm" id="btn-admin-reset-data">
              <i data-lucide="rotate-ccw"></i> កំណត់ទិន្នន័យឡើងវិញ (Reset Seed)
            </button>
            <button class="btn btn-primary btn-sm" id="btn-admin-create-user">
              <i data-lucide="user-plus"></i> បន្ថែមគណនីថ្មី
            </button>
          </div>
        </div>

        <!-- Users Table Card -->
        <div class="card">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">
                  <th style="padding: 0.85rem 1rem;">អ្នកប្រើប្រាស់</th>
                  <th style="padding: 0.85rem 1rem;">អ៊ីមែល</th>
                  <th style="padding: 0.85rem 1rem;">សិទ្ធិ (Role)</th>
                  <th style="padding: 0.85rem 1rem;">សាលារៀន</th>
                  <th style="padding: 0.85rem 1rem; text-align: right;">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.04);">
                    <td style="padding: 1rem; font-weight: 600; color: #fff;">
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.1rem;">${u.avatar || '👤'}</span>
                        ${u.fullNameKm || u.email}
                      </div>
                    </td>
                    <td style="padding: 1rem; color: var(--text-secondary);">${u.email}</td>
                    <td style="padding: 1rem;">
                      <span class="role-badge-pill ${u.role}">
                        ${u.role === 'teacher' ? 'គ្រូបង្រៀន' : (u.role === 'student' ? 'សិស្ស' : 'Admin')}
                      </span>
                    </td>
                    <td style="padding: 1rem; color: var(--text-muted);">${u.schoolName || '-'}</td>
                    <td style="padding: 1rem; text-align: right;">
                      <button class="btn btn-secondary btn-sm btn-login-as-user" data-email="${u.email}">
                        ចូលគណនីនេះ
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Reset Seed Data
    const resetBtn = document.getElementById('btn-admin-reset-data');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm('តើអ្នកពិតជាចង់កំណត់ទិន្នន័យត្រឡប់ទៅជាទិន្នន័យគំរូដើមមែនទេ?')) {
          window.db.resetToSeedData();
          this.showToast('បានកំណត់ទិន្នន័យឡើងវិញជោគជ័យ!', 'success');
          this.renderCurrentView();
        }
      };
    }

    // Login as specific user
    container.querySelectorAll('.btn-login-as-user').forEach(btn => {
      btn.onclick = async () => {
        await window.auth.login(btn.dataset.email, 'Password123!');
        this.showToast(`បានចូលគណនី៖ ${btn.dataset.email}`, 'info');
      };
    });

    // Add user button
    const addUserBtn = document.getElementById('btn-admin-create-user');
    if (addUserBtn) {
      addUserBtn.onclick = () => this.showAdminCreateUserModal();
    }
  }

  showAdminCreateUserModal() {
    this.openModal({
      title: 'បង្កើតគណនីអ្នកប្រើប្រាស់ថ្មី',
      bodyHtml: `
        <form id="form-admin-new-user">
          <div class="form-group">
            <label class="form-label">ឈ្មោះពេញ (ភាសាខ្មែរ) *</label>
            <input type="text" class="form-control" id="adm-fullname" placeholder="ឧ. កែវ ចរិយា" required />
          </div>
          <div class="form-group">
            <label class="form-label">អ៊ីមែល (Email) *</label>
            <input type="email" class="form-control" id="adm-email" placeholder="name@khmermath.edu.kh" required />
          </div>
          <div class="form-group">
            <label class="form-label">ពាក្យសម្ងាត់ *</label>
            <input type="password" class="form-control" id="adm-password" value="Password123!" required />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">តួនាទី (Role) *</label>
              <select class="form-select" id="adm-role">
                <option value="student">សិស្ស (Student)</option>
                <option value="teacher">គ្រូបង្រៀន (Teacher)</option>
                <option value="admin">អ្នកគ្រប់គ្រង (Admin)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">សាលារៀន</label>
              <input type="text" class="form-control" id="adm-school" value="វិទ្យាល័យ ព្រះស៊ីសុវត្ថិ" />
            </div>
          </div>
        </form>
      `,
      confirmText: 'បង្កើតគណនី',
      onConfirm: async () => {
        const fullNameKm = document.getElementById('adm-fullname').value.trim();
        const email = document.getElementById('adm-email').value.trim();
        const password = document.getElementById('adm-password').value.trim();
        const role = document.getElementById('adm-role').value;
        const schoolName = document.getElementById('adm-school').value.trim();

        if (!fullNameKm || !email) {
          this.showToast('សូមបំពេញព័ត៌មានចាំបាច់!', 'error');
          return false;
        }

        await window.db.createUser({
          fullNameKm,
          email,
          password,
          role,
          schoolName
        });

        this.showToast('បានបង្កើតគណនីថ្មីដោយជោគជ័យ!', 'success');
        this.renderCurrentView();
        return true;
      }
    });
  }

  // ==========================================
  // SETTINGS & SUPABASE
  // ==========================================
  renderSettings(container) {
    const config = window.db.getSupabaseConfig() || { url: '', key: '' };
    const isConnected = window.db.isSupabaseConnected;
    const currentOwnerEmail = window.db.getOwnerEmail();

    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto 2rem auto;">
        <!-- Header -->
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="shield-check" style="color: #fbbf24;"></i> ការកំណត់ប្រព័ន្ធ & ម្ចាស់កម្មវិធី (Super Admin / Owner)
          </h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">
            កំណត់អាសយដ្ឋាន Gmail ផ្ទាល់ខ្លួនជាម្ចាស់កម្មវិធីអចិន្ត្រៃយ៍ និងភ្ជាប់ទៅកាន់មូលទិន្នន័យ Supabase PostgreSQL
          </p>
        </div>

        <!-- 1. Dedicated Permanent Owner Gmail Configuration Card -->
        <div class="card" style="margin-bottom: 1.5rem; border: 1px solid rgba(245, 158, 11, 0.45); background: linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-size: 1.75rem;">👑</span>
              <div>
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #fbbf24; margin: 0;">ម្ចាស់កម្មវិធីអចិន្ត្រៃយ៍ (Permanent Owner Gmail)</h3>
                <span style="font-size: 0.8rem; color: var(--text-muted);">សិទ្ធិ Super Admin ត្រូវផ្ទៀងផ្ទាត់ដោយ Server និង Database</span>
              </div>
            </div>
            <span class="status-pill ${currentOwnerEmail ? 'status-published' : 'status-active'}">
              ${currentOwnerEmail ? 'បានកំណត់រួចរាល់' : 'រង់ចាំការកំណត់'}
            </span>
          </div>

          <form id="form-owner-gmail-settings">
            <div class="form-group">
              <label class="form-label">អាសយដ្ឋាន Gmail ផ្ទាល់ខ្លួនរបស់ម្ចាស់កម្មវិធី (Owner Gmail) *</label>
              <div style="display: flex; gap: 0.75rem;">
                <input type="email" class="form-control" id="cfg-owner-email" value="${currentOwnerEmail || ''}" placeholder="example@gmail.com" required style="font-family: monospace; font-size: 0.95rem;" />
                <button type="submit" class="btn btn-primary" style="white-space: nowrap;">
                  <i data-lucide="save"></i> រក្សាទុក Owner
                </button>
              </div>
              <div class="form-helper" style="color: #cbd5e1; margin-top: 0.5rem; line-height: 1.6;">
                ${currentOwnerEmail 
                  ? `✅ គណនីម្ចាស់កម្មវិធីបច្ចុប្បន្ន៖ <b style="color:#fbbf24;">${currentOwnerEmail}</b> (មានសិទ្ធិ Super Admin ជាអចិន្ត្រៃយ៍)` 
                  : 'ℹ️ សូមបញ្ចូល Gmail របស់អ្នកដើម្បីកំណត់ជា Super Admin តែម្នាក់គត់។ ពេល Login ដោយ Gmail នេះ ប្រព័ន្ធនឹងផ្តល់សិទ្ធិ Owner ដោយស្វ័យប្រវត្តិ។'}
              </div>
            </div>

            <!-- Server Environment Variable & SQL Info -->
            <div style="background: rgba(0, 0, 0, 0.35); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 1rem; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.7;">
              <div style="font-weight: 600; color: #fff; margin-bottom: 0.35rem;">🛡️ វិធីកំណត់សុវត្ថិភាពកម្រិត Server & Database៖</div>
              <div><b>1. PowerShell Server Env:</b> <code style="color: #38bdf8;">$env:APP_OWNER_GMAIL = "your.email@gmail.com"</code></div>
              <div><b>2. Server Config File:</b> រក្សាទុកក្នុង <code style="color: #38bdf8;">server_config.json</code> (ត្រូវបាន Server ការពារមិនឱ្យ Client ទាញយកបាន)</div>
              <div><b>3. Supabase SQL Migration:</b> ដំណើរការ <code style="color: #a78bfa;">SELECT public.set_owner_gmail('your.email@gmail.com');</code></div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-download-owner-migration-sql">
                <i data-lucide="database"></i> ទាញយក Owner SQL Migration (owner_gmail_setup.sql)
              </button>
            </div>
          </form>
        </div>

        <!-- 2. Supabase Connection Settings Card -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.1rem; font-weight: 600;">ស្ថានភាពតភ្ជាប់ Supabase PostgreSQL</h3>
            <span class="status-pill ${isConnected ? 'status-published' : 'status-active'}">
              ${isConnected ? 'បានតភ្ជាប់ទៅ Supabase រួចរាល់' : 'កំពុងប្រើប្រាស់ Local Database Engine'}
            </span>
          </div>

          <form id="form-supabase-settings">
            <div class="form-group">
              <label class="form-label">Supabase Project URL</label>
              <input type="url" class="form-control" id="cfg-supabase-url" value="${config.url || ''}" placeholder="https://your-project.supabase.co" />
            </div>

            <div class="form-group">
              <label class="form-label">Supabase Anon Public Key</label>
              <input type="password" class="form-control" id="cfg-supabase-key" value="${config.key || ''}" placeholder="eyJhbGciOiJIUzI1NiIsIn..." />
              <div class="form-helper">API keys និង secret keys ត្រូវបានរក្សាទុកដោយសុវត្ថិភាពលើ Browser ដោយមិនបញ្ជូនទៅភាគីទីបី</div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle);">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-download-sql-schema">
                <i data-lucide="file-code"></i> ទាញយក Main SQL Schema (schema.sql)
              </button>

              <div style="display: flex; gap: 0.5rem;">
                <button type="button" class="btn btn-danger btn-sm" id="btn-clear-supabase">
                  កំណត់ប្រើ Local Engine
                </button>
                <button type="submit" class="btn btn-primary btn-sm">
                  រក្សាទុក & ភ្ជាប់ទៅ Supabase
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- System Architecture Documentation Card -->
        <div class="card">
          <h3 style="font-size: 1.05rem; font-weight: 600; margin-bottom: 0.75rem; color: #fff;">
            រចនាសម្ព័ន្ធទិន្នន័យ និងសុវត្ថិភាព
          </h3>
          <ul style="padding-left: 1.25rem; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.8;">
            <li><b>Permanent Owner RBAC:</b> ម្ចាស់កម្មវិធីតែមួយគត់ដែលត្រូវបានកំណត់ ទទួលបានសិទ្ធិ Super Admin អចិន្ត្រៃយ៍។</li>
            <li><b>Server-Enforced Isolation:</b> សិស្ស និងគ្រូមិនអាចតម្លើងសិទ្ធិខ្លួនឯងតាម URL ឬ LocalStorage បានឡើយ។</li>
            <li><b>Safe Migration:</b> មិនផ្លាស់ប្ដូរ Password មិនបង្កើតគណនីស្ទួន និងមិនលុបទិន្នន័យសិស្ស គ្រូ តេស្ត និងឯកសារ។</li>
          </ul>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Owner Gmail settings form submission
    const formOwner = document.getElementById('form-owner-gmail-settings');
    if (formOwner) {
      formOwner.onsubmit = async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('cfg-owner-email');
        const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        if (!email) {
          this.showToast('សូមបញ្ចូលអាសយដ្ឋាន Gmail!', 'error');
          return;
        }

        this.showLoading(true, 'កំពុងកំណត់ Owner Gmail លើ Server & Database...');
        await window.db.setOwnerEmail(email);
        this.showLoading(false);
        this.showToast(`បានកំណត់ Gmail ${email} ជាម្ចាស់កម្មវិធី (Super Admin / Owner) ដោយជោគជ័យ!`, 'success');
        this.updateHeaderUI();
        this.renderSettings(container);
      };
    }

    // Download Owner Migration SQL
    const btnOwnerSql = document.getElementById('btn-download-owner-migration-sql');
    if (btnOwnerSql) {
      btnOwnerSql.onclick = () => {
        window.open('supabase/migrations/20261024_owner_gmail_setup.sql', '_blank');
      };
    }

    // Submit Supabase settings
    const form = document.getElementById('form-supabase-settings');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const url = document.getElementById('cfg-supabase-url').value.trim();
        const key = document.getElementById('cfg-supabase-key').value.trim();

        if (url && key) {
          window.db.setSupabaseConfig(url, key);
          this.showLoading(true, 'កំពុងតភ្ជាប់ទៅ Supabase...');
          await window.db.init();
          this.showLoading(false);
          this.showToast('បានរក្សាទុកការកំណត់ Supabase!', 'success');
        } else {
          window.db.setSupabaseConfig(null, null);
          this.showToast('បានកំណត់ត្រឡប់ទៅប្រើ Local Engine', 'info');
        }
        this.updateHeaderUI();
        this.renderSettings(container);
      };
    }

    // Clear Supabase
    const clearBtn = document.getElementById('btn-clear-supabase');
    if (clearBtn) {
      clearBtn.onclick = () => {
        window.db.setSupabaseConfig(null, null);
        this.showToast('បានកំណត់ត្រឡប់មកប្រើ Local Database Engine', 'info');
        this.updateHeaderUI();
        this.renderSettings(container);
      };
    }

    // Download SQL Schema button
    const sqlBtn = document.getElementById('btn-download-sql-schema');
    if (sqlBtn) {
      sqlBtn.onclick = () => {
        window.open('supabase/schema.sql', '_blank');
      };
    }
  }

  // ==========================================
  // ROLE SWITCHER & AUTH MODALS
  // ==========================================
  showRoleSwitcherModal() {
    this.openModal({
      title: 'ផ្លាស់ប្តូរតួនាទីសាកល្បង (Switch Active Role)',
      bodyHtml: `
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
            ជ្រើសរើសតួនាទីដើម្បីសាកល្បងមើលផ្ទាំងការងារផ្សេងៗភ្លាមៗ៖
          </p>

          <button class="card btn-switch-role-item" data-role="owner" style="cursor: pointer; display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid rgba(245, 158, 11, 0.45); text-align: left; background: rgba(245, 158, 11, 0.12);">
            <span style="font-size: 2rem;">👑</span>
            <div>
              <div style="font-weight: 700; color: #fbbf24;">Super Admin / Owner (ម្ចាស់កម្មវិធី)</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">គ្រប់គ្រងប្រព័ន្ធ គ្រូ សិស្ស ថ្នាក់ តេស្ត និងការកំណត់ទាំងអស់</div>
            </div>
          </button>

          <button class="card btn-switch-role-item" data-role="teacher" style="cursor: pointer; display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid rgba(16, 185, 129, 0.4); text-align: left; background: rgba(16, 185, 129, 0.1);">
            <span style="font-size: 2rem;">👨‍🏫</span>
            <div>
              <div style="font-weight: 600; color: #34d399;">គ្រូបង្រៀន (Teacher)</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">គ្រប់គ្រងថ្នាក់ មេរៀន ឯកសារ បង្កើតតេស្ត និងកែពិន្ទុ</div>
            </div>
          </button>

          <button class="card btn-switch-role-item" data-role="student" style="cursor: pointer; display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid rgba(6, 182, 212, 0.4); text-align: left; background: rgba(6, 182, 212, 0.1);">
            <span style="font-size: 2rem;">👨‍🎓</span>
            <div>
              <div style="font-weight: 600; color: #38bdf8;">សិស្សានុសិស្ស (Student)</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">ចូលរៀន មើលឯកសារ ធ្វើតេស្តអនឡាញ មើលពិន្ទុផ្ទាល់ខ្លួន</div>
            </div>
          </button>
        </div>
      `,
      confirmText: 'បិទ',
      onConfirm: async () => true
    });

    setTimeout(() => {
      document.querySelectorAll('.btn-switch-role-item').forEach(btn => {
        btn.onclick = async () => {
          const role = btn.dataset.role;
          await window.auth.switchRole(role);
          this.closeModal();
          this.showToast(`បានប្តូរទៅកាន់តួនាទី៖ ${role.toUpperCase()}`, 'success');
        };
      });
    }, 50);
  }

  showAuthLoginModal() {
    const configuredOwner = window.db ? window.db.getOwnerEmail() : '';
    const initialEmail = configuredOwner || 'owner@khmermath.edu.kh';

    this.openModal({
      title: 'ចូល ឬចុះឈ្មោះគណនី (Authentication)',
      bodyHtml: `
        <div>
          <!-- Tab switch between Login and Register -->
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
            <button type="button" class="grade-pill active" id="tab-auth-login">ចូលគណនី (Sign In)</button>
            <button type="button" class="grade-pill" id="tab-auth-register">ចុះឈ្មោះថ្មី (Sign Up)</button>
          </div>

          <!-- Sign In Form -->
          <div id="auth-login-box">
            <form id="form-login-modal">
              <div class="form-group">
                <label class="form-label">អ៊ីមែល (Email) *</label>
                <input type="email" class="form-control" id="login-email-input" value="${initialEmail}" required />
              </div>
              <div class="form-group">
                <label class="form-label">ពាក្យសម្ងាត់ *</label>
                <input type="password" class="form-control" id="login-password-input" value="Password123!" required />
              </div>
              <div style="background: rgba(255,255,255,0.03); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.8rem; color: var(--text-muted); line-height: 1.6; border: 1px solid var(--border-subtle);">
                <b style="color:#fbbf24;">គណនីក្នុងប្រព័ន្ធ៖</b><br/>
                👑 <b>Owner (Super Admin):</b> <span style="color:#fbbf24; font-weight:600;">${configuredOwner || 'owner@khmermath.edu.kh'}</span><br/>
                👨‍🏫 <b>Teacher:</b> teacher@khmermath.edu.kh<br/>
                👨‍🎓 <b>Student:</b> student@khmermath.edu.kh
              </div>
            </form>
          </div>

          <!-- Public Registration Form (Strictly limited to Student or pending Teacher) -->
          <div id="auth-register-box" style="display: none;">
            <form id="form-register-modal">
              <div class="form-group">
                <label class="form-label">ឈ្មោះពេញ (ភាសាខ្មែរ) *</label>
                <input type="text" class="form-control" id="reg-name-input" placeholder="ឧ. កែវ ចរិយា" required />
              </div>
              <div class="form-group">
                <label class="form-label">អ៊ីមែល *</label>
                <input type="email" class="form-control" id="reg-email-input" placeholder="user@gmail.com" required />
              </div>
              <div class="form-group">
                <label class="form-label">ពាក្យសម្ងាត់ *</label>
                <input type="password" class="form-control" id="reg-pwd-input" placeholder="បញ្ចូលពាក្យសម្ងាត់..." required />
              </div>
              <div class="form-group">
                <label class="form-label">តួនាទីស្នើសុំ *</label>
                <select class="form-select" id="reg-role-select">
                  <option value="student">សិស្ស (Student) - ចូលរៀនបានភ្លាមៗ</option>
                  <option value="teacher">គ្រូបង្រៀន (Teacher) - រង់ចាំការអនុម័តពី Owner</option>
                </select>
                <div class="form-helper" style="color: #fbbf24;">
                  🚫 សាធារណជនមិនអាចចុះឈ្មោះជា Admin ឬ Owner បានឡើយ។
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">សាលារៀន</label>
                <input type="text" class="form-control" id="reg-school-input" value="វិទ្យាល័យ ព្រះស៊ីសុវត្ថិ" />
              </div>
            </form>
          </div>
        </div>
      `,
      confirmText: 'បញ្ជាក់',
      onConfirm: async () => {
        const isRegistering = document.getElementById('auth-register-box').style.display !== 'none';

        if (isRegistering) {
          const fullNameKm = document.getElementById('reg-name-input').value.trim();
          const email = document.getElementById('reg-email-input').value.trim();
          const password = document.getElementById('reg-pwd-input').value.trim();
          const requestedRole = document.getElementById('reg-role-select').value;
          const schoolName = document.getElementById('reg-school-input').value.trim();

          if (!fullNameKm || !email || !password) {
            this.showToast('សូមបំពេញព័ត៌មានចាំបាច់!', 'error');
            return false;
          }

          try {
            await window.auth.register({
              fullNameKm,
              email,
              password,
              requestedRole,
              schoolName
            });

            if (requestedRole === 'teacher') {
              this.showToast('បានផ្ញើសំណើចុះឈ្មោះគ្រូ! សូមរង់ចាំ Super Admin / Owner អនុម័ត។', 'info');
            } else {
              this.showToast('បានចុះឈ្មោះជាសិស្សដោយជោគជ័យ!', 'success');
            }
            return true;
          } catch (err) {
            this.showToast(err.message, 'error');
            return false;
          }
        } else {
          const email = document.getElementById('login-email-input').value.trim();
          const pwd = document.getElementById('login-password-input').value.trim();
          try {
            await window.auth.login(email, pwd);
            this.showToast('បានចូលគណនីដោយជោគជ័យ!', 'success');
            return true;
          } catch (err) {
            this.showToast(err.message, 'error');
            return false;
          }
        }
      }
    });

    setTimeout(() => {
      const tabLogin = document.getElementById('tab-auth-login');
      const tabReg = document.getElementById('tab-auth-register');
      const boxLogin = document.getElementById('auth-login-box');
      const boxReg = document.getElementById('auth-register-box');

      if (tabLogin && tabReg) {
        tabLogin.onclick = () => {
          tabLogin.classList.add('active');
          tabReg.classList.remove('active');
          boxLogin.style.display = 'block';
          boxReg.style.display = 'none';
        };
        tabReg.onclick = () => {
          tabReg.classList.add('active');
          tabLogin.classList.remove('active');
          boxReg.style.display = 'block';
          boxLogin.style.display = 'none';
        };
      }
    }, 50);
  }


  showSupabaseConfigModal() {
    this.navigate('settings');
  }

  // ==========================================
  // MODAL & TOAST SYSTEM
  // ==========================================
  openModal({ title, bodyHtml, confirmText = 'យល់ព្រម', cancelText = 'បោះបង់', onConfirm = null }) {
    const overlay = document.getElementById('main-modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    if (!overlay) return;

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = bodyHtml;
    if (confirmBtn) confirmBtn.textContent = confirmText;
    if (cancelBtn) cancelBtn.textContent = cancelText;

    if (confirmBtn) {
      confirmBtn.onclick = async () => {
        if (onConfirm) {
          const shouldClose = await onConfirm();
          if (shouldClose !== false) {
            this.closeModal();
          }
        } else {
          this.closeModal();
        }
      };
    }

    overlay.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  closeModal() {
    const overlay = document.getElementById('main-modal-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';

    toast.innerHTML = `
      <i data-lucide="${iconName}" style="color:${type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#6366f1')}; flex-shrink: 0;"></i>
      <span style="font-size: 0.9rem; color: #fff;">${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  showLoading(show, message = 'កំពុងដំណើរការ...') {
    let loader = document.getElementById('global-loader-overlay');
    if (show) {
      if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader-overlay';
        loader.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(4, 6, 15, 0.85); backdrop-filter: blur(8px);
          z-index: 3000; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 1rem;
        `;
        document.body.appendChild(loader);
      }
      loader.innerHTML = `
        <div style="width: 48px; height: 48px; border: 4px solid rgba(99, 102, 241, 0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <div style="color: #fff; font-weight: 500; font-size: 1rem;">${message}</div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      `;
    } else {
      if (loader) loader.remove();
    }
  }
}

// Global App instance
window.app = new App();
window.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
