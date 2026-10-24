/**
 * Khmer Math Learning & Assessment System (រៀន និងវាយតម្លៃគណិតវិទ្យាខ្មែរ)
 * Grading Console, Assessment Analytics, and CSV Export Controller
 */

class AnalyticsController {
  constructor() {
    this.selectedQuizId = 'quiz-12-complex';
  }

  async renderTeacherGrading(container) {
    if (!window.auth.canGrade()) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem; border: 1px solid var(--accent-rose);">
          <i data-lucide="shield-alert" style="width: 48px; height: 48px; color: #f43f5e; margin-bottom: 1rem;"></i>
          <h2 style="font-size: 1.4rem; color: #f43f5e; margin-bottom: 0.5rem;">សិទ្ធិត្រូវបានបដិសេធ (403 Forbidden)</h2>
          <p style="color: var(--text-secondary); max-width: 520px; margin: 0 auto 1.5rem auto;">
            មានតែគណនីគ្រូបង្រៀន និង Super Admin ប៉ុណ្ណោះដែលអាចចូលទៅកាន់ផ្ទាំងលទ្ធផល និងការកែពិន្ទុតេស្តនេះបាន។ សិស្សអាចមើលបានតែពិន្ទុផ្ទាល់ខ្លួនប៉ុណ្ណោះ។
          </p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const quizzes = await window.db.getQuizzes(null, 'teacher');
    const activeQuiz = quizzes.find(q => q.id === this.selectedQuizId) || quizzes[0] || null;
    if (activeQuiz) {
      this.selectedQuizId = activeQuiz.id;
    }

    const analytics = activeQuiz ? await window.db.getQuizAnalytics(activeQuiz.id) : null;
    const attempts = activeQuiz ? await window.db.getAttemptsByQuiz(activeQuiz.id) : [];

    container.innerHTML = `
      <!-- Header & Quiz Switcher -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700;">ផ្ទាំងលទ្ធផល និងការកែពិន្ទុតេស្ត</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">តាមដានសមត្ថភាពសិស្ស កែសំណួរឆ្លើយដោយសេរី និងនាំចេញរបាយការណ៍</p>
        </div>

        <div style="display: flex; gap: 0.75rem;">
          <button class="btn btn-secondary btn-sm" id="btn-export-csv" ${attempts.length === 0 ? 'disabled' : ''}>
            <i data-lucide="download"></i> នាំចេញជារបាយការណ៍ CSV
          </button>
        </div>
      </div>

      <!-- Quiz Selector Dropdown -->
      <div class="card" style="padding: 1rem 1.5rem; margin-bottom: 1.5rem; background: rgba(18, 24, 50, 0.4);">
        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <label class="form-label" style="margin: 0; white-space: nowrap;">ជ្រើសរើសកម្រងតេស្ត៖</label>
          <select class="form-select" id="analytics-quiz-select" style="max-width: 480px;">
            ${quizzes.map(q => `
              <option value="${q.id}" ${q.id === this.selectedQuizId ? 'selected' : ''}>
                ${q.title} (${q.totalPoints} ពិន្ទុ)
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      ${activeQuiz && analytics ? `
        <!-- Summary Analytics Metrics -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon-box purple"><i data-lucide="users"></i></div>
            <div class="metric-content">
              <span class="metric-value">${analytics.totalSubmissions}</span>
              <span class="metric-label">សិស្សបានធ្វើតេស្ត</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-box cyan"><i data-lucide="trending-up"></i></div>
            <div class="metric-content">
              <span class="metric-value">${analytics.averageScore} <span style="font-size:1rem;color:var(--text-muted);">/${activeQuiz.totalPoints}</span></span>
              <span class="metric-label">ពិន្ទុមធ្យម (${analytics.averagePercentage}%)</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-box emerald"><i data-lucide="check-circle-2"></i></div>
            <div class="metric-content">
              <span class="metric-value">${analytics.highestScore}</span>
              <span class="metric-label">ពិន្ទុខ្ពស់បំផុត</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon-box amber"><i data-lucide="alert-circle"></i></div>
            <div class="metric-content">
              <span class="metric-value">${analytics.lowestScore}</span>
              <span class="metric-label">ពិន្ទុទាបបំផុត</span>
            </div>
          </div>
        </div>

        <!-- Grade Distribution & Question Success Grid -->
        <div class="content-grid-2" style="margin-bottom: 2rem;">
          
          <!-- Cambodian Grade Distribution (A-F) -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i data-lucide="pie-chart"></i> បំណែងចែកនិទ្ទេស (Grade Distribution)</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${[
                { grade: 'និទ្ទេស A (ល្អប្រសើរ ≥ 85%)', count: analytics.gradeDistribution.A, color: '#10b981' },
                { grade: 'និទ្ទេស B (ល្អណាស់ ≥ 75%)', count: analytics.gradeDistribution.B, color: '#06b6d4' },
                { grade: 'និទ្ទេស C (ល្អ ≥ 65%)', count: analytics.gradeDistribution.C, color: '#6366f1' },
                { grade: 'និទ្ទេស D (មធ្យម ≥ 50%)', count: analytics.gradeDistribution.D, color: '#f59e0b' },
                { grade: 'និទ្ទេស E (ខ្សោយ ≥ 40%)', count: analytics.gradeDistribution.E, color: '#f97316' },
                { grade: 'និទ្ទេស F (ធ្លាក់ < 40%)', count: analytics.gradeDistribution.F, color: '#f43f5e' }
              ].map(item => {
                const total = analytics.totalSubmissions || 1;
                const pct = Math.round((item.count / total) * 100);
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                      <span style="color: #fff; font-weight: 500;">${item.grade}</span>
                      <span style="font-family: var(--font-math); color: var(--text-muted);">${item.count} នាក់ (${pct}%)</span>
                    </div>
                    <div style="height: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.06); overflow: hidden;">
                      <div style="width: ${pct}%; height: 100%; background: ${item.color}; border-radius: 4px; transition: width 0.5s ease;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Question Success Breakdown -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i data-lucide="bar-chart"></i> អត្រាឆ្លើយត្រូវតាមសំណួរ (Question Success Rate)</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${analytics.questionAnalytics.map(qa => `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                    <span style="color: #fff; max-width: 380px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      សំណួរ ${qa.number} (${qa.type.toUpperCase()}): ${qa.promptKm}
                    </span>
                    <span style="font-family: var(--font-math); color: ${qa.successRate >= 60 ? '#34d399' : '#f87171'}; font-weight: 600;">
                      ${qa.successRate}%
                    </span>
                  </div>
                  <div style="height: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.06); overflow: hidden;">
                    <div style="width: ${qa.successRate}%; height: 100%; background: ${qa.successRate >= 60 ? '#10b981' : '#f43f5e'}; border-radius: 4px;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Student Submissions Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i data-lucide="list"></i> បញ្ជីសិស្សដែលបានប្រឡង (${attempts.length} នាក់)</div>
          </div>

          ${attempts.length === 0 ? `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
              មិនទាន់មានសិស្សណាម្នាក់បានធ្វើតេស្តនេះនៅឡើយទេ។
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;">
                    <th style="padding: 0.85rem 1rem;">ឈ្មោះសិស្ស</th>
                    <th style="padding: 0.85rem 1rem;">កាលបរិច្ឆេទ</th>
                    <th style="padding: 0.85rem 1rem; text-align: center;">ពិន្ទុ</th>
                    <th style="padding: 0.85rem 1rem; text-align: center;">ភាគរយ</th>
                    <th style="padding: 0.85rem 1rem; text-align: center;">និទ្ទេស</th>
                    <th style="padding: 0.85rem 1rem; text-align: center;">ស្ថានភាព</th>
                    <th style="padding: 0.85rem 1rem; text-align: right;">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody>
                  ${attempts.map(att => {
                    const gradeLetter = att.percentage >= 85 ? 'A' : (att.percentage >= 75 ? 'B' : (att.percentage >= 65 ? 'C' : (att.percentage >= 50 ? 'D' : (att.percentage >= 40 ? 'E' : 'F'))));
                    const isPassed = att.percentage >= 50;
                    return `
                      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.04); transition: background 0.15s ease;">
                        <td style="padding: 1rem; font-weight: 600; color: #fff;">
                          <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="width: 28px; height: 28px; border-radius: 50%; background: rgba(99, 102, 241, 0.2); display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">👨‍🎓</span>
                            ${att.studentName || 'សិស្ស'}
                          </div>
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
                        <td style="padding: 1rem; text-align: center;">
                          <span class="status-pill ${att.status === 'graded' ? 'status-published' : (att.status === 'submitted' ? 'status-active' : 'status-hidden')}">
                            ${att.status === 'graded' ? 'បានកែរួចរាល់' : (att.status === 'submitted' ? 'រង់ចាំគ្រូពិនិត្យ' : 'កំពុងប្រឡង')}
                          </span>
                        </td>
                        <td style="padding: 1rem; text-align: right;">
                          <button class="btn btn-secondary btn-sm btn-grade-attempt" data-attid="${att.id}">
                            <i data-lucide="edit-2"></i> កែពិន្ទុ/ពិនិត្យ
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
      ` : `
        <div class="card" style="text-align: center; padding: 3rem;">
          <p style="color: var(--text-muted);">សូមជ្រើសរើសកម្រងតេស្តដើម្បីមើលលទ្ធផល</p>
        </div>
      `}
    `;

    if (window.lucide) window.lucide.createIcons();

    // Quiz selector change
    const quizSelect = document.getElementById('analytics-quiz-select');
    if (quizSelect) {
      quizSelect.onchange = (e) => {
        this.selectedQuizId = e.target.value;
        this.renderTeacherGrading(container);
      };
    }

    // Export CSV
    const exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const csvContent = window.db.generateCSV(attempts, activeQuiz.title);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `របាយការណ៍ពិន្ទុ-${activeQuiz.title}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.app.showToast('បានទាញយករបាយការណ៍ CSV រួចរាល់!', 'success');
      };
    }

    // Grade individual attempt button
    container.querySelectorAll('.btn-grade-attempt').forEach(btn => {
      btn.onclick = () => this.showGradeStudentModal(btn.dataset.attid);
    });
  }

  showGradeStudentModal(attemptId) {
    const attempts = window.db._get('ATTEMPTS');
    const att = attempts.find(a => a.id === attemptId);
    if (!att) return;

    window.db.getQuizById(att.quizId, 'teacher').then(quiz => {
      window.app.openModal({
        title: `កែពិន្ទុរបស់សិស្ស៖ ${att.studentName}`,
        bodyHtml: `
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <div style="background: rgba(12, 16, 33, 0.6); padding: 1rem; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">កម្រងតេស្ត</div>
                <div style="font-weight: 600; color: #fff;">${quiz.title}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.8rem; color: var(--text-muted);">ពិន្ទុបច្ចុប្បន្ន</div>
                <div style="font-weight: 700; color: var(--accent-cyan); font-family: var(--font-math); font-size: 1.2rem;">
                  ${att.totalScore} / ${att.maxScore} (${att.percentage}%)
                </div>
              </div>
            </div>

            <!-- Questions to grade -->
            <form id="form-grade-attempt">
              ${(quiz.questions || []).map((q, idx) => {
                const ans = (att.answers && att.answers[q.id]) || { response: '', score: 0, teacherNotes: '' };
                const isOpen = q.type === 'open_response';

                return `
                  <div class="card" style="background: rgba(18, 24, 50, 0.7); margin-bottom: 1rem; border-left: 4px solid ${isOpen ? 'var(--accent-cyan)' : '#6366f1'};">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                      <span class="status-pill ${isOpen ? 'status-active' : 'status-published'}">សំណួរ ${idx + 1} (${q.type})</span>
                      <span style="font-size: 0.85rem; color: var(--text-muted); font-family: var(--font-math);">អតិបរមា: ${q.points} ពិន្ទុ</span>
                    </div>

                    <div style="font-weight: 500; color: #fff; margin-bottom: 0.5rem;">${q.promptKm}</div>
                    ${q.mathFormula ? `<div style="text-align:center; margin: 0.5rem 0;">$$${q.mathFormula}$$</div>` : ''}

                    <div style="background: rgba(0, 0, 0, 0.3); padding: 0.75rem; border-radius: var(--radius-md); margin-bottom: 0.75rem;">
                      <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.2rem;">ចម្លើយរបស់សិស្ស៖</div>
                      <div style="color: #38bdf8; font-weight: 500; white-space: pre-line;">${ans.response || '(មិនបានឆ្លើយ)'}</div>
                    </div>

                    <div style="display: grid; grid-template-columns: 140px 1fr; gap: 1rem; align-items: center;">
                      <div>
                        <label class="form-label" style="font-size: 0.8rem;">ពិន្ទុដែលផ្តល់ (0-${q.points})</label>
                        <input type="number" class="form-control score-input" data-qid="${q.id}" value="${ans.score || 0}" min="0" max="${q.points}" step="0.5" />
                      </div>
                      <div>
                        <label class="form-label" style="font-size: 0.8rem;">ចំណាំរបស់គ្រូ</label>
                        <input type="text" class="form-control note-input" data-qid="${q.id}" value="${ans.teacherNotes || ''}" placeholder="មតិលើចម្លើយនេះ..." />
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}

              <div class="form-group" style="margin-top: 1.5rem;">
                <label class="form-label">មតិកែលម្អជារួមដល់សិស្ស (Overall Teacher Feedback)</label>
                <textarea class="form-textarea" id="overall-teacher-feedback" rows="3" placeholder="សរសេរការលើកទឹកចិត្ត ឬចំណុចដែលសិស្សត្រូវកែលម្អ...">${att.teacherFeedback || ''}</textarea>
              </div>
            </form>
          </div>
        `,
        confirmText: 'រក្សាទុកការកែពិន្ទុ',
        onConfirm: async () => {
          const scoresByQ = {};
          document.querySelectorAll('.score-input').forEach(inp => {
            const qid = inp.dataset.qid;
            const score = parseFloat(inp.value) || 0;
            const notes = (document.querySelector(`.note-input[data-qid="${qid}"]`) || {}).value || '';
            scoresByQ[qid] = { score, notes };
          });

          const feedback = document.getElementById('overall-teacher-feedback').value.trim();

          await window.db.gradeStudentAttempt(att.id, scoresByQ, feedback);
          window.app.showToast('បានរក្សាទុកពិន្ទុ និងមតិកែលម្អដោយជោគជ័យ!', 'success');
          this.renderTeacherGrading(document.getElementById('view-container'));
          return true;
        }
      });

      setTimeout(() => {
        window.quizService.renderMath(document.querySelector('.modal-body'));
      }, 50);
    });
  }
}

// Global Analytics Controller instance
window.analyticsController = new AnalyticsController();
