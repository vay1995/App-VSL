/**
 * Khmer Math Learning & Assessment System (រៀន និងវាយតម្លៃគណិតវិទ្យាខ្មែរ)
 * Super Admin / Owner Dashboard Controller
 */

class AdminController {
  constructor() {
    this.activeTab = 'overview'; // 'overview', 'users', 'audit', 'owner-setup'
    this.userFilterRole = 'all';
    this.auditFilter = 'all';
  }

  async renderDashboard(container) {
    // SECURITY GUARD:
    if (!window.auth.isOwner()) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem; border: 1px solid var(--accent-rose);">
          <i data-lucide="shield-alert" style="width: 48px; height: 48px; color: #f43f5e; margin-bottom: 1rem;"></i>
          <h2 style="font-size: 1.4rem; color: #f43f5e; margin-bottom: 0.5rem;">សិទ្ធិត្រូវបានបដិសេធ (403 Forbidden)</h2>
          <p style="color: var(--text-secondary); max-width: 520px; margin: 0 auto 1.5rem auto;">
            ផ្ទាំងគ្រប់គ្រង Super Admin / Owner នេះត្រូវបានការពារយ៉ាងតឹងរ៉ឹងសម្រាប់តែ <b>ម្ចាស់កម្មវិធីធំតែម្នាក់គត់</b>។
          </p>
          <button class="btn btn-primary" onclick="window.app.showRoleSwitcherModal()">
            ប្តូរទៅកាន់គណនី Owner ដើម្បីចូលមើល
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const users = await window.db.getUsers();
    const classes = await window.db.getClasses();
    const lessons = window.db._get('LESSONS');
    const quizzes = window.db._get('QUIZZES');
    const attempts = window.db._get('ATTEMPTS');
    const auditLogs = await window.db.getAuditLogs();

    const teachers = users.filter(u => u.role === 'teacher' && u.accountStatus === 'active');
    const students = users.filter(u => u.role === 'student' && u.accountStatus === 'active');
    const pending = users.filter(u => u.accountStatus === 'pending_approval');
    const completedAttempts = attempts.filter(a => a.status === 'graded' || a.status === 'submitted');

    // Count all uploaded files & videos
    let totalFiles = 0;
    let totalVideos = 0;
    lessons.forEach(l => {
      totalFiles += (l.files || []).length;
      if (l.video) totalVideos++;
    });

    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <!-- Owner Welcome & Quick Actions -->
        <div class="hero-card" style="border: 1px solid rgba(245, 158, 11, 0.4); background: linear-gradient(135deg, rgba(30, 27, 75, 0.85) 0%, rgba(20, 16, 40, 0.95) 100%);">
          <div class="hero-inner">
            <div class="hero-text">
              <span class="role-badge-pill admin" style="margin-bottom: 0.5rem;">
                👑 SUPER ADMIN & APPLICATION OWNER
              </span>
              <h1 style="color: #fff;">ផ្ទាំងគ្រប់គ្រងម្ចាស់កម្មវិធី (Owner Dashboard)</h1>
              <p>
                អ្នកជាម្ចាស់ និងជាអ្នកគ្រប់គ្រងធំតែម្នាក់គត់ ដែលមានសិទ្ធិគ្រប់គ្រងអ្នកប្រើប្រាស់ ថ្នាក់រៀន តេស្ត ពិន្ទុ និងការកំណត់សុវត្ថិភាពទាំងអស់។
              </p>
            </div>

            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" id="btn-owner-setup-creds">
                <i data-lucide="key"></i> កំណត់ពាក្យសម្ងាត់ Owner ផ្ទាល់ខ្លួន
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-admin-add-user-top">
                <i data-lucide="user-plus"></i> បង្កើតគណនីថ្មី
              </button>
            </div>
          </div>
        </div>

        <!-- 8 Comprehensive Metric Summary Cards -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon-box purple"><i data-lucide="graduation-cap"></i></div>
            <div class="metric-content">
              <span class="metric-value">${teachers.length}</span>
              <span class="metric-label">គ្រូបង្រៀនសកម្ម</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-box cyan"><i data-lucide="users"></i></div>
            <div class="metric-content">
              <span class="metric-value">${students.length}</span>
              <span class="metric-label">សិស្សានុសិស្សសកម្ម</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-box emerald"><i data-lucide="school"></i></div>
            <div class="metric-content">
              <span class="metric-value">${classes.length}</span>
              <span class="metric-label">ថ្នាក់រៀនសរុប</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-box amber"><i data-lucide="book-open"></i></div>
            <div class="metric-content">
              <span class="metric-value">${lessons.length}</span>
              <span class="metric-label">មេរៀនដែលបានបង្កើត</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-box purple"><i data-lucide="file-text"></i></div>
            <div class="metric-content">
              <span class="metric-value">${totalFiles} / ${totalVideos}</span>
              <span class="metric-label">ឯកសារ / វីដេអូបង្រៀន</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-box cyan"><i data-lucide="help-circle"></i></div>
            <div class="metric-content">
              <span class="metric-value">${quizzes.length}</span>
              <span class="metric-label">កម្រងតេស្តបានបង្កើត</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-box emerald"><i data-lucide="award"></i></div>
            <div class="metric-content">
              <span class="metric-value">${completedAttempts.length}</span>
              <span class="metric-label">ការប្រឡងបានបញ្ចប់</span>
            </div>
          </div>

          <div class="metric-card" style="${pending.length > 0 ? 'border-color: rgba(245, 158, 11, 0.6); background: rgba(245, 158, 11, 0.08);' : ''}">
            <div class="metric-icon-box amber"><i data-lucide="clock"></i></div>
            <div class="metric-content">
              <span class="metric-value" style="color: ${pending.length > 0 ? '#fbbf24' : '#fff'};">${pending.length}</span>
              <span class="metric-label">រង់ចាំការអនុម័ត</span>
            </div>
          </div>
        </div>

        <!-- Admin Sub Navigation Tabs -->
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
          <button class="grade-pill ${this.activeTab === 'overview' ? 'active' : ''}" id="tab-adm-users">
            <i data-lucide="users" style="width:14px;height:14px;vertical-align:middle;"></i> គ្រប់គ្រងគណនី (${users.length})
          </button>
          <button class="grade-pill ${this.activeTab === 'audit' ? 'active' : ''}" id="tab-adm-audit">
            <i data-lucide="history" style="width:14px;height:14px;vertical-align:middle;"></i> ប្រវត្តិសកម្មភាព Audit Logs (${auditLogs.length})
          </button>
          <button class="grade-pill ${this.activeTab === 'security' ? 'active' : ''}" id="tab-adm-security">
            <i data-lucide="shield-check" style="width:14px;height:14px;vertical-align:middle;"></i> សុវត្ថិភាព & Supabase RLS
          </button>
        </div>

        <!-- Tab Body Content -->
        <div id="admin-tab-body">
          ${this.activeTab === 'audit' 
            ? this.renderAuditLogsSection(auditLogs) 
            : (this.activeTab === 'security' 
                ? this.renderSecuritySection() 
                : this.renderUsersManagementSection(users, pending))}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.attachAdminDashboardEvents();
  }

  renderUsersManagementSection(users, pending) {
    let filteredUsers = users;
    if (this.userFilterRole !== 'all') {
      if (this.userFilterRole === 'pending') {
        filteredUsers = users.filter(u => u.accountStatus === 'pending_approval');
      } else {
        filteredUsers = users.filter(u => u.role === this.userFilterRole);
      }
    }

    return `
      <div class="card">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div class="card-title">
            <i data-lucide="users"></i> តារាងគ្រប់គ្រងគណនី និងសិទ្ធិ
          </div>

          <!-- Role Filter Dropdown -->
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <select class="form-select form-select-sm" id="admin-user-filter-select" style="max-width: 220px; padding: 0.4rem 0.8rem; font-size: 0.85rem;">
              <option value="all" ${this.userFilterRole === 'all' ? 'selected' : ''}>បង្ហាញទាំងអស់ (${users.length})</option>
              <option value="owner" ${this.userFilterRole === 'owner' ? 'selected' : ''}>👑 ម្ចាស់កម្មវិធី (Owner)</option>
              <option value="teacher" ${this.userFilterRole === 'teacher' ? 'selected' : ''}>👨‍🏫 គ្រូបង្រៀន (Teachers)</option>
              <option value="student" ${this.userFilterRole === 'student' ? 'selected' : ''}>👨‍🎓 សិស្ស (Students)</option>
              <option value="pending" ${this.userFilterRole === 'pending' ? 'selected' : ''}>⏳ រង់ចាំអនុម័ត (${pending.length})</option>
            </select>

            <button class="btn btn-primary btn-sm" id="btn-admin-create-user-modal">
              <i data-lucide="plus"></i> បន្ថែមគណនីថ្មី
            </button>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">
                <th style="padding: 0.85rem 1rem;">អ្នកប្រើប្រាស់</th>
                <th style="padding: 0.85rem 1rem;">អ៊ីមែល</th>
                <th style="padding: 0.85rem 1rem; text-align: center;">តួនាទី</th>
                <th style="padding: 0.85rem 1rem; text-align: center;">ស្ថានភាព</th>
                <th style="padding: 0.85rem 1rem;">សាលារៀន</th>
                <th style="padding: 0.85rem 1rem; text-align: right;">សកម្មភាពគ្រប់គ្រង</th>
              </tr>
            </thead>
            <tbody>
              ${filteredUsers.map(u => {
                const isOwner = u.isOwner === true || u.role === 'owner';
                const isPending = u.accountStatus === 'pending_approval';
                const isSuspended = u.accountStatus === 'suspended';

                return `
                  <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.04); background: ${isOwner ? 'rgba(245, 158, 11, 0.04)' : ''};">
                    <td style="padding: 1rem; font-weight: 600; color: #fff;">
                      <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span style="font-size: 1.25rem;">${u.avatar || (isOwner ? '👑' : (u.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'))}</span>
                        <div>
                          <div>${u.fullNameKm || u.email}</div>
                          ${isOwner ? '<span style="font-size: 0.7rem; color: #fbbf24; font-weight: 700;">★ SUPER ADMIN / OWNER</span>' : ''}
                        </div>
                      </div>
                    </td>

                    <td style="padding: 1rem; color: var(--text-secondary); font-family: var(--font-math);">
                      ${u.email}
                    </td>

                    <td style="padding: 1rem; text-align: center;">
                      <span class="role-badge-pill ${u.role}">
                        ${isOwner ? '👑 Owner' : (u.role === 'teacher' ? '👨‍🏫 គ្រូ' : '👨‍🎓 សិស្ស')}
                      </span>
                    </td>

                    <td style="padding: 1rem; text-align: center;">
                      <span class="status-pill ${isSuspended ? 'status-hidden' : (isPending ? 'status-active' : 'status-published')}">
                        ${isSuspended ? 'ផ្អាកដំណើរការ' : (isPending ? 'រង់ចាំអនុម័ត' : 'សកម្ម')}
                      </span>
                    </td>

                    <td style="padding: 1rem; color: var(--text-muted); font-size: 0.82rem;">
                      ${u.schoolName || '-'}
                    </td>

                    <td style="padding: 1rem; text-align: right;">
                      ${isOwner ? `
                        <span style="font-size: 0.75rem; color: #fbbf24; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: var(--radius-full); background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3);">
                          🛡️ ការពារពេញលេញ
                        </span>
                      ` : `
                        <div style="display: inline-flex; gap: 0.4rem; align-items: center;">
                          ${isPending ? `
                            <button class="btn btn-success btn-sm btn-adm-approve-user" data-uid="${u.id}" title="អនុម័តគណនី">
                              <i data-lucide="check"></i> អនុម័ត
                            </button>
                          ` : ''}

                          <button class="btn btn-secondary btn-sm btn-adm-toggle-status" data-uid="${u.id}" data-status="${isSuspended ? 'active' : 'suspended'}" title="${isSuspended ? 'បើកដំណើរការឡើងវិញ' : 'ផ្អាកដំណើរការ'}">
                            <i data-lucide="${isSuspended ? 'play' : 'pause'}"></i> ${isSuspended ? 'បើកវិញ' : 'ផ្អាក'}
                          </button>

                          <button class="btn btn-secondary btn-sm btn-adm-change-role" data-uid="${u.id}" data-role="${u.role}" title="ប្តូរសិទ្ធិ (គ្រូ <-> សិស្ស)">
                            <i data-lucide="repeat"></i> ប្តូរសិទ្ធិ
                          </button>

                          <button class="btn btn-danger btn-sm btn-adm-delete-user" data-uid="${u.id}" title="លុបគណនី">
                            <i data-lucide="trash-2"></i>
                          </button>
                        </div>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderAuditLogsSection(auditLogs) {
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <i data-lucide="history"></i> ប្រវត្តិសកម្មភាពសំខាន់ៗក្នុងប្រព័ន្ធ (System Audit Trail)
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            កត់ត្រាស្វ័យប្រវត្តិនូវរាល់ការបង្កើត កែប្រែ លុប និងការដាក់ពិន្ទុ
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${auditLogs.length === 0 ? `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">មិនទាន់មានប្រវត្តិសកម្មភាពនៅឡើយទេ</div>
          ` : auditLogs.map(log => {
            let badgeColor = '#6366f1';
            if (log.action.includes('DELETE') || log.action.includes('BAN')) badgeColor = '#f43f5e';
            if (log.action.includes('CREATE') || log.action.includes('SUBMIT')) badgeColor = '#10b981';
            if (log.action.includes('GRADE') || log.action.includes('UPDATE')) badgeColor = '#06b6d4';

            return `
              <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 0.85rem 1rem; border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.03); border-left: 3px solid ${badgeColor}; gap: 1rem;">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                    <span style="font-size: 0.75rem; font-weight: 700; color: ${badgeColor}; font-family: var(--font-math);">${log.action}</span>
                    <span style="font-size: 0.85rem; font-weight: 600; color: #fff;">${log.actorName}</span>
                    <span class="role-badge-pill ${log.actorRole}" style="font-size: 0.68rem; padding: 0.1rem 0.45rem;">${log.actorRole}</span>
                  </div>
                  <div style="font-size: 0.88rem; color: var(--text-secondary);">${log.details}</div>
                </div>

                <div style="font-size: 0.75rem; color: var(--text-dim); white-space: nowrap; font-family: var(--font-math);">
                  ${new Date(log.createdAt).toLocaleString('km-KH')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderSecuritySection() {
    return `
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div class="card-title">
            <i data-lucide="shield-check"></i> ការអនុវត្តសុវត្ថិភាពនៅផ្នែក Server & Database (Security Rules)
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div style="background: rgba(12, 16, 33, 0.6); padding: 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
            <h4 style="color: #fbbf24; font-size: 0.95rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              <i data-lucide="lock"></i> ការពារសិទ្ធិម្ចាស់កម្មវិធី (Owner Protection)
            </h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.7;">
              - គណនី Owner មិនអាចត្រូវបានកែប្រែតួនាទី ឬដកហូតសិទ្ធិដោយអ្នកដទៃជាដាច់ខាត។<br/>
              - គ្មានអ្នកប្រើប្រាស់ណាម្នាក់អាចតម្លើងសិទ្ធិខ្លួនឯង ឬអ្នកដទៃជា Owner បានឡើយ។<br/>
              - គណនីចុះឈ្មោះសាធារណៈត្រូវបានកម្រិតត្រឹម «សិស្ស» ឬ «គ្រូរង់ចាំការអនុម័ត» ប៉ុណ្ណោះ។
            </p>
          </div>

          <div style="background: rgba(12, 16, 33, 0.6); padding: 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--border-subtle);">
            <h4 style="color: #06b6d4; font-size: 0.95rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              <i data-lucide="database"></i> Supabase Row Level Security (RLS)
            </h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.7;">
              - សិស្សមិនអាចមើលចម្លើយត្រឹមត្រូវនៃតេស្ត (Answer Key Scrubbing)។<br/>
              - សិស្សមើលបានតែពិន្ទុ និងការប្រឡងផ្ទាល់ខ្លួន (Strict Data Isolation)។<br/>
              - រាល់ការបង្កើត កែ និងលុបមេរៀន/តេស្ត ត្រូវឆ្លងកាត់ការផ្ទៀងផ្ទាត់សិទ្ធិនៅ Server/Database។
            </p>
          </div>
        </div>
      </div>
    `;
  }

  attachAdminDashboardEvents() {
    // Top setup owner credentials button
    const setupOwnerBtn = document.getElementById('btn-owner-setup-creds');
    if (setupOwnerBtn) {
      setupOwnerBtn.onclick = () => this.showOwnerPersonalSetupModal();
    }

    // Top create user button
    const btnSetupCreds = document.getElementById('btn-owner-setup-creds');
    if (btnSetupCreds) {
      btnSetupCreds.onclick = () => this.showOwnerPersonalSetupModal();
    }

    const addUserTop = document.getElementById('btn-admin-add-user-top');
    const addUserModalBtn = document.getElementById('btn-admin-create-user-modal');
    const handleAddUser = () => this.showAdminCreateUserModal();
    if (addUserTop) addUserTop.onclick = handleAddUser;
    if (addUserModalBtn) addUserModalBtn.onclick = handleAddUser;

    // Sub tabs
    const tabUsers = document.getElementById('tab-adm-users');
    const tabAudit = document.getElementById('tab-adm-audit');
    const tabSec = document.getElementById('tab-adm-security');

    if (tabUsers) tabUsers.onclick = () => { this.activeTab = 'overview'; this.renderDashboard(document.getElementById('view-container')); };
    if (tabAudit) tabAudit.onclick = () => { this.activeTab = 'audit'; this.renderDashboard(document.getElementById('view-container')); };
    if (tabSec) tabSec.onclick = () => { this.activeTab = 'security'; this.renderDashboard(document.getElementById('view-container')); };

    // Role filter select
    const filterSelect = document.getElementById('admin-user-filter-select');
    if (filterSelect) {
      filterSelect.onchange = (e) => {
        this.userFilterRole = e.target.value;
        this.renderDashboard(document.getElementById('view-container'));
      };
    }

    // Approve pending user
    document.querySelectorAll('.btn-adm-approve-user').forEach(btn => {
      btn.onclick = async () => {
        await window.db.toggleAccountStatus(btn.dataset.uid, 'active');
        window.app.showToast('បានអនុម័តគណនីដោយជោគជ័យ!', 'success');
        this.renderDashboard(document.getElementById('view-container'));
      };
    });

    // Toggle suspend/active
    document.querySelectorAll('.btn-adm-toggle-status').forEach(btn => {
      btn.onclick = async () => {
        const uid = btn.dataset.uid;
        const newStatus = btn.dataset.status;
        await window.db.toggleAccountStatus(uid, newStatus);
        window.app.showToast(`បានប្តូរស្ថានភាពគណនីទៅជា៖ ${newStatus.toUpperCase()}`, 'info');
        this.renderDashboard(document.getElementById('view-container'));
      };
    });

    // Change role (Teacher <-> Student)
    document.querySelectorAll('.btn-adm-change-role').forEach(btn => {
      btn.onclick = async () => {
        const uid = btn.dataset.uid;
        const currentRole = btn.dataset.role;
        const targetRole = currentRole === 'teacher' ? 'student' : 'teacher';
        if (confirm(`តើអ្នកពិតជាចង់ប្តូរសិទ្ធិគណនីនេះទៅជា ${targetRole.toUpperCase()} មែនទេ?`)) {
          await window.db.updateUserRole(uid, targetRole);
          window.app.showToast(`បានប្តូរសិទ្ធិទៅជា ${targetRole.toUpperCase()}`, 'success');
          this.renderDashboard(document.getElementById('view-container'));
        }
      };
    });

    // Delete user
    document.querySelectorAll('.btn-adm-delete-user').forEach(btn => {
      btn.onclick = async () => {
        if (confirm('តើអ្នកពិតជាចង់លុបគណនីនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។')) {
          await window.db.deleteUser(btn.dataset.uid);
          window.app.showToast('បានលុបគណនីរួចរាល់', 'info');
          this.renderDashboard(document.getElementById('view-container'));
        }
      };
    });
  }

  showOwnerPersonalSetupModal() {
    const owner = window.auth.getCurrentUser();
    const currentOwnerEmail = window.db.getOwnerEmail() || (owner ? owner.email : '');

    window.app.openModal({
      title: 'កំណត់ព័ត៌មានម្ចាស់កម្មវិធី (Super Admin / Owner Configuration)',
      bodyHtml: `
        <div>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.6;">
            កំណត់អាសយដ្ឋាន Gmail ផ្ទាល់ខ្លួនរបស់អ្នកជាម្ចាស់កម្មវិធីអចិន្ត្រៃយ៍។ ប្រព័ន្ធនឹងរក្សាទុកក្នុង Server Configuration និង Database ដោយស្វ័យប្រវត្តិ។
          </p>
          <form id="form-owner-personal-setup">
            <div class="form-group">
              <label class="form-label">Gmail ផ្ទាល់ខ្លួនរបស់ម្ចាស់កម្មវិធី (Owner Gmail) *</label>
              <input type="email" class="form-control" id="owner-email-input" value="${currentOwnerEmail || ''}" placeholder="example@gmail.com" required />
              <div class="form-helper" style="color: #fbbf24;">
                🔒 គណនី Gmail នេះនឹងទទួលបានសិទ្ធិ Super Admin ជាអចិន្ត្រៃយ៍គ្រប់ពេលដែល Login។
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">ឈ្មោះពេញ (Owner Name) *</label>
              <input type="text" class="form-control" id="owner-name-input" value="${owner ? (owner.fullNameKm || '') : ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label">ពាក្យសម្ងាត់សុវត្ថិភាព (Password) *</label>
              <input type="password" class="form-control" id="owner-pwd-input" placeholder="បញ្ចូលពាក្យសម្ងាត់សុវត្ថិភាព..." value="${owner ? (owner.password || '') : 'Password123!'}" required />
            </div>
            <div class="form-group">
              <label class="form-label">សាលារៀន ឬស្ថាប័ន</label>
              <input type="text" class="form-control" id="owner-school-input" value="${owner ? (owner.schoolName || '') : 'ទីស្តីការក្រសួងអប់រំ យុវជន និងកីឡា'}" />
            </div>
          </form>
        </div>
      `,
      confirmText: 'រក្សាទុក & កំណត់ Owner',
      onConfirm: async () => {
        const email = document.getElementById('owner-email-input').value.trim().toLowerCase();
        const name = document.getElementById('owner-name-input').value.trim();
        const pwd = document.getElementById('owner-pwd-input').value.trim();
        const school = document.getElementById('owner-school-input').value.trim();

        if (!name || !email || !pwd) {
          window.app.showToast('សូមបំពេញព័ត៌មានចាំបាច់!', 'error');
          return false;
        }

        // Set owner email across Server and Database
        await window.db.setOwnerEmail(email);

        const users = await window.db.getUsers();
        let ownerUser = users.find(u => u.email && u.email.toLowerCase().trim() === email);

        if (ownerUser) {
          ownerUser.fullNameKm = name;
          ownerUser.password = pwd;
          ownerUser.schoolName = school;
          ownerUser.isOwner = true;
          ownerUser.role = 'owner';
          ownerUser.accountStatus = 'active';
        } else {
          // If this user was previously under a placeholder email
          const oldOwnerIdx = users.findIndex(u => u.id === (owner ? owner.id : null) || u.isOwner === true);
          if (oldOwnerIdx !== -1) {
            users[oldOwnerIdx].email = email;
            users[oldOwnerIdx].fullNameKm = name;
            users[oldOwnerIdx].password = pwd;
            users[oldOwnerIdx].schoolName = school;
            users[oldOwnerIdx].isOwner = true;
            users[oldOwnerIdx].role = 'owner';
            users[oldOwnerIdx].accountStatus = 'active';
            ownerUser = users[oldOwnerIdx];
          } else {
            ownerUser = await window.db.createUser({
              fullNameKm: name,
              email,
              password: pwd,
              schoolName: school,
              role: 'owner',
              isOwner: true,
              accountStatus: 'active'
            }, true);
          }
        }

        window.db._set('USERS', users);

        if (owner) {
          owner.email = email;
          owner.fullNameKm = name;
          owner.password = pwd;
          owner.schoolName = school;
          owner.role = 'owner';
          owner.isOwner = true;
          localStorage.setItem(window.auth.sessionKey, JSON.stringify(owner));
        }

        await window.db.logActivity('UPDATE_OWNER_PROFILE', 'user', owner ? owner.id : 'owner', `បានកំណត់ Gmail ម្ចាស់កម្មវិធីជាផ្លូវការ៖ ${email}`);
        window.app.showToast(`បានកំណត់ Gmail ${email} ជា Super Admin / Owner អចិន្ត្រៃយ៍!`, 'success');
        window.app.updateHeaderUI();
        this.renderDashboard(document.getElementById('view-container'));
        return true;
      }
    });
  }

  showAdminCreateUserModal() {
    window.app.openModal({
      title: 'បង្កើតគណនីគ្រូ ឬសិស្សថ្មី',
      bodyHtml: `
        <form id="form-adm-create-user">
          <div class="form-group">
            <label class="form-label">ឈ្មោះពេញ (ភាសាខ្មែរ) *</label>
            <input type="text" class="form-control" id="adm-new-name" placeholder="ឧ. ចាន់ ពិសាល" required />
          </div>
          <div class="form-group">
            <label class="form-label">អ៊ីមែល (Email) *</label>
            <input type="email" class="form-control" id="adm-new-email" placeholder="name@khmermath.edu.kh" required />
          </div>
          <div class="form-group">
            <label class="form-label">ពាក្យសម្ងាត់ *</label>
            <input type="password" class="form-control" id="adm-new-pwd" value="Password123!" required />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">តួនាទី (Role) *</label>
              <select class="form-select" id="adm-new-role">
                <option value="student">សិស្ស (Student)</option>
                <option value="teacher">គ្រូបង្រៀន (Teacher)</option>
              </select>
              <div class="form-helper">សិទ្ធិ Owner មិនអាចបង្កើតបន្ថែមបានទេ</div>
            </div>
            <div class="form-group">
              <label class="form-label">សាលារៀន</label>
              <input type="text" class="form-control" id="adm-new-school" value="វិទ្យាល័យ ព្រះស៊ីសុវត្ថិ" />
            </div>
          </div>
        </form>
      `,
      confirmText: 'បង្កើតគណនី',
      onConfirm: async () => {
        const fullNameKm = document.getElementById('adm-new-name').value.trim();
        const email = document.getElementById('adm-new-email').value.trim();
        const password = document.getElementById('adm-new-pwd').value.trim();
        const role = document.getElementById('adm-new-role').value;
        const schoolName = document.getElementById('adm-new-school').value.trim();

        if (!fullNameKm || !email || !password) {
          window.app.showToast('សូមបំពេញព័ត៌មានចាំបាច់!', 'error');
          return false;
        }

        await window.db.createUser({
          fullNameKm,
          email,
          password,
          role,
          schoolName,
          accountStatus: 'active'
        });

        window.app.showToast('បានបង្កើតគណនីថ្មីដោយជោគជ័យ!', 'success');
        this.renderDashboard(document.getElementById('view-container'));
        return true;
      }
    });
  }
}

// Global Admin Controller instance
window.adminController = new AdminController();
