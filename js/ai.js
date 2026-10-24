/**
 * Khmer Math Learning & Assessment System (រៀន និងវាយតម្លៃគណិតវិទ្យាខ្មែរ)
 * AI Math Question Studio & Gemini API Integration
 */

class AIMathStudio {
  constructor() {
    this.apiKeyStorageKey = 'KM_GEMINI_API_KEY';
    this.generatedQuestions = [];
  }

  getApiKey() {
    return localStorage.getItem(this.apiKeyStorageKey) || '';
  }

  setApiKey(key) {
    if (!key) {
      localStorage.removeItem(this.apiKeyStorageKey);
    } else {
      localStorage.setItem(this.apiKeyStorageKey, key.trim());
    }
  }

  hasRealApiKey() {
    const key = this.getApiKey();
    return !!(key && key.startsWith('AIza') && key.length > 20);
  }

  renderStudio(container) {
    if (!window.auth.canEditLesson()) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem; border: 1px solid var(--accent-rose);">
          <i data-lucide="shield-alert" style="width: 48px; height: 48px; color: #f43f5e; margin-bottom: 1rem;"></i>
          <h2 style="font-size: 1.4rem; color: #f43f5e; margin-bottom: 0.5rem;">សិទ្ធិត្រូវបានបដិសេធ (403 Forbidden)</h2>
          <p style="color: var(--text-secondary); max-width: 520px; margin: 0 auto 1.5rem auto;">
            មានតែគ្រូបង្រៀន និង Super Admin ប៉ុណ្ណោះដែលអាចប្រើប្រាស់ AI Math Studio ក្នុងការបង្កើត និងអនុម័តសំណួរបាន។
          </p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const hasKey = this.hasRealApiKey();

    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="sparkles" style="color: var(--primary-light);"></i> AI Math Studio (ជំនួយការបង្កើតសំណួរគណិតវិទ្យា)
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
              បង្កើតសំណួរគណិតវិទ្យាស្វ័យប្រវត្តិតាមប្រធានបទ ពិនិត្យកែសម្រួល និងអនុម័តបញ្ចូលទៅក្នុងតេស្ត
            </p>
          </div>

          <!-- API Key Connection Status -->
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="status-pill ${hasKey ? 'status-published' : 'status-hidden'}" id="api-status-pill">
              <i data-lucide="${hasKey ? 'check-circle' : 'alert-circle'}"></i>
              ${hasKey ? 'បានភ្ជាប់ Gemini API ពិតប្រាកដ' : 'មិនទាន់ភ្ជាប់ Gemini API Key'}
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-config-ai-key">
              <i data-lucide="key"></i> កំណត់ API Key
            </button>
          </div>
        </div>

        <!-- Generation Parameter Form Card -->
        <div class="card" style="margin-bottom: 2rem;">
          <form id="form-generate-ai">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">កម្រិតថ្នាក់ *</label>
                <select class="form-select" id="ai-grade-select">
                  <option value="12">ថ្នាក់ទី១២ (បាក់ឌុប/វិទ្យាសាស្ត្រពិត)</option>
                  <option value="11">ថ្នាក់ទី១១ (កម្រិតខ្ពស់)</option>
                  <option value="10">ថ្នាក់ទី១០ (មូលដ្ឋានគ្រឹះ)</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">ប្រភេទសំណួរ *</label>
                <select class="form-select" id="ai-qtype-select">
                  <option value="mcq">ជ្រើសរើសចម្លើយ (Multiple Choice ៤ ជម្រើស)</option>
                  <option value="true_false">ពិត ឬមិនពិត (True / False)</option>
                  <option value="short_answer">ឆ្លើយខ្លី (Short Answer)</option>
                  <option value="mixed">ចម្រុះគ្រប់ប្រភេទ (Mixed)</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">កម្រិតលំបាក *</label>
                <select class="form-select" id="ai-difficulty-select">
                  <option value="medium">កម្រិតមធ្យម (ស្តង់ដារបាក់ឌុប)</option>
                  <option value="easy">កម្រិតងាយ (ពង្រឹងមូលដ្ឋាន)</option>
                  <option value="hard">កម្រិតលំបាក (សិស្សពូកែ/អាហារូបករណ៍)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">ប្រធានបទគណិតវិទ្យា (Math Topic) *</label>
              <input type="text" class="form-control" id="ai-topic-input" 
                     placeholder="ឧ. ចំនួនកុំផ្លិច ទម្រង់ត្រីកោណមាត្រ, អាំងតេក្រាលដោយផ្នែក, លីមីតនៃអនុគមន៍ត្រីកោណមាត្រ..." 
                     value="ចំនួនកុំផ្លិច រូបមន្តដឺម័រ និងឫសទី n" required />
            </div>

            <!-- Quick Topic Pills -->
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
              <span style="font-size: 0.78rem; color: var(--text-muted); align-self: center;">ប្រធានបទពេញនិយម៖</span>
              <button type="button" class="grade-pill btn-quick-topic" data-topic="ចំនួនកុំផ្លិច និងរូបមន្តដឺម័រ">ចំនួនកុំផ្លិច</button>
              <button type="button" class="grade-pill btn-quick-topic" data-topic="អាំងតេក្រាលមិនកំណត់ និងកំណត់">អាំងតេក្រាល</button>
              <button type="button" class="grade-pill btn-quick-topic" data-topic="សមីការឌីផេរ៉ង់ស្យែលលំដាប់ទី១ និងទី២">សមីការឌីផេរ៉ង់ស្យែល</button>
              <button type="button" class="grade-pill btn-quick-topic" data-topic="ស្វ៊ីតនព្វន្ត និងស្វ៊ីតធរណីមាត្រ">ស្វ៊ីតចំនួនពិត</button>
              <button type="button" class="grade-pill btn-quick-topic" data-topic="លីមីត និងដេរីវេនៃអនុគមន៍">លីមីត និងដេរីវេ</button>
              <button type="button" class="grade-pill btn-quick-topic" data-topic="ធរណីមាត្រក្នុងលំហ ផលគុណវ៉ិចទ័រ">ធរណីមាត្រក្នុងលំហ</button>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
              <div style="font-size: 0.85rem; color: var(--text-secondary);">
                ${hasKey 
                  ? '⚡ ដំណើរការដោយ Google Gemini API ផ្ទាល់' 
                  : '💡 ដំណើរការដោយ ម៉ាស៊ីនបង្កើតលំហាត់គណិតវិទ្យាតាមកម្មវិធីសិក្សាជាតិ'}
              </div>

              <button type="submit" class="btn btn-primary" id="btn-submit-ai-gen">
                <i data-lucide="sparkles"></i> បង្កើតសំណួរគំរូ
              </button>
            </div>
          </form>
        </div>

        <!-- Generated Questions Preview & Approval Area -->
        <div id="ai-results-area">
          ${this.renderGeneratedQuestionsList()}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.attachStudioEvents();
  }

  renderGeneratedQuestionsList() {
    if (this.generatedQuestions.length === 0) {
      return `
        <div class="card" style="text-align: center; padding: 3rem; color: var(--text-muted);">
          <i data-lucide="sparkles" style="width: 40px; height: 40px; color: var(--text-dim); margin-bottom: 0.75rem;"></i>
          <p>សូមជ្រើសរើសប្រធានបទ រួចចុចប៊ូតុង «បង្កើតសំណួរគំរូ» ខាងលើ។</p>
        </div>
      `;
    }

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h3 style="font-size: 1.15rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
          <i data-lucide="check-square"></i> សំណួរដែលបានបង្កើត (${this.generatedQuestions.length} សំណួរ)
        </h3>
        <button class="btn btn-success btn-sm" id="btn-approve-all-to-quiz">
          <i data-lucide="check-check"></i> អនុម័ត និងបញ្ចូលទៅក្នុងកម្រងតេស្ត
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;" id="ai-questions-container">
        ${this.generatedQuestions.map((q, idx) => `
          <div class="card" style="background: rgba(18, 24, 50, 0.75);" data-index="${idx}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span class="status-pill status-active">សំណួរទី ${idx + 1} (${q.type.toUpperCase()})</span>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-sm btn-edit-gen-q" data-index="${idx}">
                  <i data-lucide="edit-3"></i> កែសម្រួល
                </button>
                <button class="btn btn-danger btn-sm btn-remove-gen-q" data-index="${idx}">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>

            <div style="font-size: 1.05rem; font-weight: 500; color: #fff; margin-bottom: 0.5rem;">
              ${q.promptKm}
            </div>

            ${q.mathFormula ? `
              <div style="background: rgba(12, 16, 33, 0.6); padding: 0.75rem; border-radius: var(--radius-md); text-align: center; margin-bottom: 1rem;">
                $$${q.mathFormula}$$
              </div>
            ` : ''}

            <!-- Options Preview -->
            ${q.options && q.options.length > 0 ? `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                ${q.options.map(opt => `
                  <div style="padding: 0.6rem 0.85rem; border-radius: var(--radius-md); background: ${opt.id === q.correctOption ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)'}; border: 1px solid ${opt.id === q.correctOption ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 700; color: ${opt.id === q.correctOption ? '#34d399' : 'var(--text-muted)'};">${opt.id}.</span>
                    <span style="color: #fff;">${opt.text}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div style="background: rgba(99, 102, 241, 0.08); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              <b style="color: #34d399;">ចម្លើយត្រឹមត្រូវ៖</b> ${q.correctOption}<br/>
              <b style="color: var(--primary-light);">ការពន្យល់៖</b> ${q.explanationKm}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  attachStudioEvents() {
    // Quick topic pills
    document.querySelectorAll('.btn-quick-topic').forEach(btn => {
      btn.onclick = () => {
        const topicInp = document.getElementById('ai-topic-input');
        if (topicInp) topicInp.value = btn.dataset.topic;
      };
    });

    // Config API Key button
    const configBtn = document.getElementById('btn-config-ai-key');
    if (configBtn) {
      configBtn.onclick = () => this.showApiKeyConfigModal();
    }

    // Form submit
    const form = document.getElementById('form-generate-ai');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const grade = document.getElementById('ai-grade-select').value;
        const qtype = document.getElementById('ai-qtype-select').value;
        const difficulty = document.getElementById('ai-difficulty-select').value;
        const topic = document.getElementById('ai-topic-input').value.trim();

        if (!topic) {
          window.app.showToast('សូមបញ្ចូលប្រធានបទគណិតវិទ្យា!', 'error');
          return;
        }

        try {
          window.app.showLoading(true, 'កំពុងបង្កើតសំណួរគណិតវិទ្យា...');
          this.generatedQuestions = await this.generateQuestions(topic, grade, qtype, difficulty);
          window.app.showLoading(false);

          window.app.showToast(`បានបង្កើតសំណួរចំនួន ${this.generatedQuestions.length} ដោយជោគជ័យ!`, 'success');
          const resultsArea = document.getElementById('ai-results-area');
          if (resultsArea) {
            resultsArea.innerHTML = this.renderGeneratedQuestionsList();
            if (window.lucide) window.lucide.createIcons();
            window.quizService.renderMath(resultsArea);
            this.attachQuestionActionEvents();
          }
        } catch (err) {
          window.app.showLoading(false);
          window.app.showToast('បរាជ័យក្នុងការបង្កើតសំណួរ៖ ' + err.message, 'error');
        }
      };
    }

    this.attachQuestionActionEvents();
  }

  attachQuestionActionEvents() {
    // Remove individual generated question
    document.querySelectorAll('.btn-remove-gen-q').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.index, 10);
        this.generatedQuestions.splice(idx, 1);
        const resultsArea = document.getElementById('ai-results-area');
        if (resultsArea) {
          resultsArea.innerHTML = this.renderGeneratedQuestionsList();
          if (window.lucide) window.lucide.createIcons();
          window.quizService.renderMath(resultsArea);
          this.attachQuestionActionEvents();
        }
      };
    });

    // Edit individual question
    document.querySelectorAll('.btn-edit-gen-q').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.index, 10);
        this.showEditGeneratedQuestionModal(idx);
      };
    });

    // Approve All into Quiz
    const approveBtn = document.getElementById('btn-approve-all-to-quiz');
    if (approveBtn) {
      approveBtn.onclick = () => this.showApproveToQuizModal();
    }
  }

  showEditGeneratedQuestionModal(index) {
    const q = this.generatedQuestions[index];
    if (!q) return;

    window.app.openModal({
      title: `កែសម្រួលសំណួរទី ${index + 1}`,
      bodyHtml: `
        <form id="form-edit-gen-q">
          <div class="form-group">
            <label class="form-label">ប្រធានសំណួរ *</label>
            <textarea class="form-textarea" id="edit-gen-prompt" rows="3">${q.promptKm}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">រូបមន្តគណិតវិទ្យា KaTeX</label>
            <input type="text" class="form-control" id="edit-gen-math" value="${q.mathFormula || ''}" />
          </div>

          <div class="form-group">
            <label class="form-label">ចម្លើយត្រឹមត្រូវ *</label>
            <input type="text" class="form-control" id="edit-gen-correct" value="${q.correctOption || ''}" />
          </div>

          <div class="form-group">
            <label class="form-label">ការពន្យល់ដំណោះស្រាយលម្អិត</label>
            <textarea class="form-textarea" id="edit-gen-explanation" rows="4">${q.explanationKm || ''}</textarea>
          </div>
        </form>
      `,
      confirmText: 'រក្សាទុកការកែសម្រួល',
      onConfirm: async () => {
        q.promptKm = document.getElementById('edit-gen-prompt').value.trim();
        q.mathFormula = document.getElementById('edit-gen-math').value.trim();
        q.correctOption = document.getElementById('edit-gen-correct').value.trim();
        q.explanationKm = document.getElementById('edit-gen-explanation').value.trim();

        const resultsArea = document.getElementById('ai-results-area');
        if (resultsArea) {
          resultsArea.innerHTML = this.renderGeneratedQuestionsList();
          if (window.lucide) window.lucide.createIcons();
          window.quizService.renderMath(resultsArea);
          this.attachQuestionActionEvents();
        }
        return true;
      }
    });
  }

  async showApproveToQuizModal() {
    const quizzes = await window.db.getQuizzes(null, 'teacher');

    window.app.openModal({
      title: 'អនុម័តបញ្ចូលទៅក្នុងកម្រងតេស្ត',
      bodyHtml: `
        <form id="form-approve-quiz">
          <div class="form-group">
            <label class="form-label">ជ្រើសរើសជម្រើសបញ្ចូល៖</label>
            <select class="form-select" id="approve-destination-select">
              <option value="new">បង្កើតជាកម្រងតេស្តថ្មី</option>
              ${quizzes.map(q => `
                <option value="${q.id}">បញ្ចូលបន្ថែមទៅក្នុង «${q.title}»</option>
              `).join('')}
            </select>
          </div>

          <div id="new-quiz-fields">
            <div class="form-group">
              <label class="form-label">ចំណងជើងតេស្តថ្មី *</label>
              <input type="text" class="form-control" id="approve-quiz-title" value="តេស្តវាស់ស្ទង់៖ ${document.getElementById('ai-topic-input') ? document.getElementById('ai-topic-input').value : 'គណិតវិទ្យា'}" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">ថ្នាក់រៀន</label>
                <select class="form-select" id="approve-class-select">
                  <option value="class-12a">ថ្នាក់ទី១២A (MTH-12A)</option>
                  <option value="class-11b">ថ្នាក់ទី១១B (MTH-11B)</option>
                  <option value="class-10c">ថ្នាក់ទី១០C (MTH-10C)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">រយៈពេល (នាទី)</label>
                <input type="number" class="form-control" id="approve-time-input" value="30" />
              </div>
            </div>
          </div>
        </form>
      `,
      confirmText: 'អនុម័ត និងបញ្ចូល',
      onConfirm: async () => {
        const dest = document.getElementById('approve-destination-select').value;

        if (dest === 'new') {
          const title = document.getElementById('approve-quiz-title').value.trim();
          const classId = document.getElementById('approve-class-select').value;
          const timeLimit = parseInt(document.getElementById('approve-time-input').value, 10);

          await window.db.createQuiz({
            classId,
            title,
            timeLimitMinutes: timeLimit,
            maxAttempts: 1,
            isPublished: true,
            createdBy: window.auth.getCurrentUser().id,
            questions: this.generatedQuestions
          });

          window.app.showToast('បានបង្កើតកម្រងតេស្តថ្មីជាមួយសំណួរដែលបានអនុម័ត!', 'success');
        } else {
          const quiz = await window.db.getQuizById(dest, 'teacher');
          if (quiz) {
            quiz.questions = [...(quiz.questions || []), ...this.generatedQuestions];
            quiz.totalPoints = quiz.questions.reduce((a, b) => a + (b.points || 1), 0);
            await window.db.updateQuiz(quiz.id, {
              questions: quiz.questions,
              totalPoints: quiz.totalPoints
            });
            window.app.showToast('បានបន្ថែមសំណួរទៅក្នុងតេស្តរួចរាល់!', 'success');
          }
        }

        window.app.navigate('teacher-quizzes');
        return true;
      }
    });

    setTimeout(() => {
      const destSelect = document.getElementById('approve-destination-select');
      const newFields = document.getElementById('new-quiz-fields');
      if (destSelect && newFields) {
        destSelect.onchange = () => {
          newFields.style.display = destSelect.value === 'new' ? 'block' : 'none';
        };
      }
    }, 50);
  }

  showApiKeyConfigModal() {
    const currentModel = localStorage.getItem('KM_GEMINI_MODEL') || 'gemini-1.5-pro';
    window.app.openModal({
      title: 'កំណត់ Google Gemini API Key & Model',
      bodyHtml: `
        <div>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
            បញ្ចូល Google Gemini API Key ដើម្បីដំណើរការម៉ូដែលបញ្ញាសិប្បនិម្មិត Gemini ក្នុងការបង្កើតសំណួរគណិតវិទ្យាភាសាខ្មែរ។ Key ត្រូវបានរក្សាទុកតែលើ Browser របស់អ្នកប៉ុណ្ណោះ។
          </p>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Gemini API Key *</label>
            <input type="password" class="form-control" id="gemini-key-input" value="${this.getApiKey()}" placeholder="AIzaSy..." />
          </div>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">ជ្រើសរើសម៉ូដែល AI (Gemini Model) *</label>
            <select class="form-select" id="gemini-model-select">
              <option value="gemini-1.5-pro" ${currentModel === 'gemini-1.5-pro' ? 'selected' : ''}>gemini-1.5-pro (ណែនាំ - ឆ្លាតវៃ និងគណនាល្អិតល្អន់)</option>
              <option value="gemini-1.5-flash-latest" ${currentModel === 'gemini-1.5-flash-latest' ? 'selected' : ''}>gemini-1.5-flash-latest (លឿនរហ័សទាន់ចិត្ត)</option>
              <option value="gemini-2.0-flash" ${currentModel === 'gemini-2.0-flash' ? 'selected' : ''}>gemini-2.0-flash (ជំនាន់ថ្មី)</option>
            </select>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">
            💡 ប្រព័ន្ធមានយន្តការ Auto-Fallback៖ ប្រសិនបើម៉ូដែលមួយមានបញ្ហា វានឹងប្តូរទៅម៉ូដែលជំនួសដោយស្វ័យប្រវត្តិ។ អ្នកអាចទទួលបាន API Key ដោយឥតគិតថ្លៃតាម <a href="https://aistudio.google.com" target="_blank" style="color: #38bdf8;">Google AI Studio</a>។
          </div>
        </div>
      `,
      confirmText: 'រក្សាទុកការកំណត់',
      onConfirm: async () => {
        const val = document.getElementById('gemini-key-input').value.trim();
        const modelVal = document.getElementById('gemini-model-select').value;
        this.setApiKey(val);
        localStorage.setItem('KM_GEMINI_MODEL', modelVal);
        window.app.showToast('បានរក្សាទុកការកំណត់ API Key & Model រួចរាល់!', 'success');
        this.renderStudio(document.getElementById('view-container'));
        return true;
      }
    });
  }

  // ==========================================
  // GENERATOR ENGINE (REAL GEMINI OR CURRICULUM FALLBACK)
  // ==========================================
  async generateQuestions(topic, grade, qtype, difficulty) {
    if (this.hasRealApiKey()) {
      return this.callGeminiAPI(topic, grade, qtype, difficulty);
    } else {
      return this.generateFromCurriculumEngine(topic, grade, qtype, difficulty);
    }
  }

  async callGeminiAPI(topic, grade, qtype, difficulty) {
    const apiKey = this.getApiKey();
    const selectedModel = localStorage.getItem('KM_GEMINI_MODEL') || 'gemini-1.5-pro';

    // Model fallback sequence: primary selectedModel -> gemini-1.5-pro -> gemini-1.5-flash-latest -> gemini-2.0-flash
    const modelsToTry = [
      selectedModel,
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-2.0-flash'
    ].filter((m, i, arr) => arr.indexOf(m) === i);

    const promptText = `
You are an expert Cambodian High School Mathematics curriculum teacher.
Generate 3 high quality math questions in Khmer language for Grade ${grade} students on topic: "${topic}".
Difficulty: ${difficulty}.
Question Type preference: ${qtype}.

Requirements:
1. Every math equation or expression MUST use standard KaTeX / LaTeX formatting ($...$ for inline or $$...$$ for display).
2. For multiple choice (mcq), provide 4 options labeled 'A', 'B', 'C', 'D' with balanced math expressions.
3. Provide the exact correctOption ('A', 'true', etc.).
4. Provide a thorough, step-by-step mathematical solution and explanation in Khmer (explanationKm).
5. Output ONLY valid JSON in the following schema (no markdown fences, just pure JSON array):
[
  {
    "id": "q-ai-1",
    "type": "mcq",
    "points": 5,
    "promptKm": "Question prompt in Khmer",
    "mathFormula": "KaTeX equation",
    "options": [
      {"id": "A", "text": "Option A in KaTeX", "math": "..."},
      {"id": "B", "text": "Option B in KaTeX", "math": "..."},
      {"id": "C", "text": "Option C in KaTeX", "math": "..."},
      {"id": "D", "text": "Option D in KaTeX", "math": "..."}
    ],
    "correctOption": "A",
    "explanationKm": "Step-by-step solution in Khmer"
  }
]
`;

    let lastError = null;
    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { response_mime_type: 'application/json' }
          })
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          const errMsg = (errJson.error && errJson.error.message) || `Gemini API returned status ${response.status}`;
          // If model not found (404), try next candidate fallback model!
          if (response.status === 404 || errMsg.toLowerCase().includes('not found')) {
            console.warn(`Model ${model} not found for v1beta, trying next fallback model...`);
            lastError = new Error(errMsg);
            continue;
          }
          throw new Error(errMsg);
        }

        const data = await response.json();
        const textOutput = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(textOutput);
        return parsed.map((item, idx) => ({
          ...item,
          id: 'q-ai-' + Date.now() + '-' + idx,
          points: item.points || 5
        }));
      } catch (err) {
        lastError = err;
        if (!err.message.toLowerCase().includes('not found') && !err.message.includes('404')) {
          throw err;
        }
      }
    }

    if (lastError) throw lastError;
  }

  generateFromCurriculumEngine(topic, grade, qtype, difficulty) {
    // Highly realistic, pedagogical math questions mapped to Cambodian curriculum
    const now = Date.now();
    const topicLower = topic.toLowerCase();

    if (topicLower.includes('កុំផ្លិច') || topicLower.includes('complex')) {
      return [
        {
          id: 'q-gen-' + now + '-1',
          type: 'mcq',
          points: 5,
          promptKm: 'ចូរគណនាម៉ូឌុល និងអាគុយម៉ង់នៃចំនួនកុំផ្លិច $z = -1 + i\\sqrt{3}$៖',
          mathFormula: 'z = -1 + i\\sqrt{3}',
          options: [
            { id: 'A', text: '$r = 2, \\, \\theta = \\frac{2\\pi}{3}$' },
            { id: 'B', text: '$r = 2, \\, \\theta = \\frac{\\pi}{3}$' },
            { id: 'C', text: '$r = 4, \\, \\theta = \\frac{2\\pi}{3}$' },
            { id: 'D', text: '$r = \\sqrt{2}, \\, \\theta = \\frac{5\\pi}{6}$' }
          ],
          correctOption: 'A',
          explanationKm: `**ដំណោះស្រាយលម្អិត៖**
១. ម៉ូឌុល៖ $r = \\sqrt{(-1)^2 + (\\sqrt{3})^2} = \\sqrt{1 + 3} = 2$
២. អាគុយម៉ង់៖ $\\cos\\theta = -\\frac{1}{2}$ និង $\\sin\\theta = \\frac{\\sqrt{3}}{2}$
ដោយសារ $x < 0, y > 0$ នាំឱ្យ $\\theta$ ស្ថិតក្នុងកាដ្រង់ទី២៖
$\\theta = \\pi - \\frac{\\pi}{3} = \\frac{2\\pi}{3}$
ដូច្នេះ ចម្លើយត្រឹមត្រូវគឺ **A**។`
        },
        {
          id: 'q-gen-' + now + '-2',
          type: 'mcq',
          points: 5,
          promptKm: 'គណនាតម្លៃនៃកន្សោម $(1 + i)^8$ ដោយប្រើរូបមន្តដឺម័រ (Moivre)៖',
          mathFormula: '(1 + i)^8 = ?',
          options: [
            { id: 'A', text: '$16$' },
            { id: 'B', text: '$16i$' },
            { id: 'C', text: '$-16$' },
            { id: 'D', text: '$8$' }
          ],
          correctOption: 'A',
          explanationKm: `**ដំណោះស្រាយលម្អិត៖**
បំប្លែង $1 + i$ ជាទម្រង់ត្រីកោណមាត្រ៖
$1 + i = \\sqrt{2}\\left(\\cos\\frac{\\pi}{4} + i\\sin\\frac{\\pi}{4}\\right)$
អនុវត្តរូបមន្តដឺម័រ៖
$(1 + i)^8 = (\\sqrt{2})^8\\left(\\cos\\frac{8\\pi}{4} + i\\sin\\frac{8\\pi}{4}\\right)$
$= 16(\\cos 2\\pi + i\\sin 2\\pi) = 16(1 + 0) = 16$
ដូច្នេះ ចម្លើយគឺ **A** ($16$)។`
        },
        {
          id: 'q-gen-' + now + '-3',
          type: 'true_false',
          points: 4,
          promptKm: 'តើការអះអាងនេះពិត ឬមិនពិត៖ «កុំផ្លិចឆ្លាស់នៃ $z = a + bi$ គឺ $\\bar{z} = a - bi$ ហើយផលគុណ $z\\bar{z} = |z|^2$»?',
          mathFormula: 'z\\bar{z} = a^2 + b^2 = |z|^2',
          options: [
            { id: 'true', text: 'ពិត (True)' },
            { id: 'false', text: 'មិនពិត (False)' }
          ],
          correctOption: 'true',
          explanationKm: `**ដំណោះស្រាយ៖** ពិត ព្រោះ $z\\bar{z} = (a+bi)(a-bi) = a^2 - (bi)^2 = a^2 + b^2 = |z|^2$។`
        }
      ];
    } else if (topicLower.includes('អាំងតេក្រាល') || topicLower.includes('integral')) {
      return [
        {
          id: 'q-gen-' + now + '-1',
          type: 'mcq',
          points: 5,
          promptKm: 'គណនាអាំងតេក្រាលកំណត់ $I = \\int_0^1 (3x^2 + 2x - 1) dx$៖',
          mathFormula: 'I = \\int_0^1 (3x^2 + 2x - 1) dx',
          options: [
            { id: 'A', text: '$I = 1$' },
            { id: 'B', text: '$I = 2$' },
            { id: 'C', text: '$I = 0$' },
            { id: 'D', text: '$I = 3$' }
          ],
          correctOption: 'A',
          explanationKm: `**ដំណោះស្រាយលម្អិត៖**
$I = \\left[ x^3 + x^2 - x \\right]_0^1$
$= (1^3 + 1^2 - 1) - (0) = (1 + 1 - 1) = 1$
ដូច្នេះ ចម្លើយត្រឹមត្រូវគឺ **A** ($I = 1$)។`
        },
        {
          id: 'q-gen-' + now + '-2',
          type: 'short_answer',
          points: 5,
          promptKm: 'គណនាព្រីមីទីវនៃអនុគមន៍ $f(x) = e^{2x}$ ដោយដឹងថា $F(0) = 1$។ រកតម្លៃ $C$៖',
          mathFormula: 'F(x) = \\frac{1}{2}e^{2x} + C',
          options: [],
          correctOption: '1/2',
          explanationKm: `**ដំណោះស្រាយ៖**
$F(x) = \\int e^{2x} dx = \\frac{1}{2}e^{2x} + C$
ជំនួស $x = 0$៖
$F(0) = \\frac{1}{2}e^0 + C = 1 \\implies \\frac{1}{2} + C = 1 \\implies C = \\frac{1}{2}$។`
        }
      ];
    } else {
      // General High School Math Generator
      return [
        {
          id: 'q-gen-' + now + '-1',
          type: 'mcq',
          points: 5,
          promptKm: `សំណួរត្រួតពិនិត្យការយល់ដឹងលើប្រធានបទ៖ «${topic}»`,
          mathFormula: 'f(x) = ax^2 + bx + c',
          options: [
            { id: 'A', text: 'ជម្រើសចម្លើយត្រឹមត្រូវទី ១' },
            { id: 'B', text: 'ជម្រើសមិនត្រឹមត្រូវទី ២' },
            { id: 'C', text: 'ជម្រើសមិនត្រឹមត្រូវទី ៣' },
            { id: 'D', text: 'ជម្រើសមិនត្រឹមត្រូវទី ៤' }
          ],
          correctOption: 'A',
          explanationKm: `**ការពន្យល់គរុកោសល្យ៖**\nអនុវត្តទ្រឹស្តីបទគ្រឹះនៃ ${topic} ដើម្បីផ្ទៀងផ្ទាត់លក្ខខណ្ឌចាំបាច់ និងគ្រប់គ្រាន់។`
        }
      ];
    }
  }
}

// Global AI Studio instance
window.aiStudio = new AIMathStudio();
