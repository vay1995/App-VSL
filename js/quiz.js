/**
 * Khmer Math Learning & Assessment System (រៀន និងវាយតម្លៃគណិតវិទ្យាខ្មែរ)
 * Quiz Management, Math Formula Integration (KaTeX), and Student Test Arena
 */

class QuizService {
  constructor() {
    this.activeAttempt = null;
    this.activeQuiz = null;
    this.timerInterval = null;
    this.autoSaveInterval = null;
    this.currentQuestionIndex = 0;
    this.studentAnswers = {};
    this.flaggedQuestions = new Set();
  }

  // --- KaTeX Math Rendering Helpers ---
  renderMath(container) {
    if (!container) return;
    if (window.renderMathInElement) {
      window.renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  }

  // --- Virtual Math Keyboard Insert Helper ---
  insertMathSymbol(inputElement, symbolLatex, previewElement = null) {
    if (!inputElement) return;
    const startPos = inputElement.selectionStart || inputElement.value.length;
    const endPos = inputElement.selectionEnd || inputElement.value.length;
    const val = inputElement.value;

    inputElement.value = val.substring(0, startPos) + symbolLatex + val.substring(endPos);
    inputElement.focus();
    inputElement.selectionStart = inputElement.selectionEnd = startPos + symbolLatex.length;

    if (previewElement) {
      this.updateMathPreview(inputElement.value, previewElement);
    }
  }

  updateMathPreview(text, previewElement) {
    if (!previewElement) return;
    previewElement.innerHTML = text ? text : '<span style="color:#64748b">មើលគំរូប្លង់រូបមន្ត KaTeX នៅទីនេះ...</span>';
    this.renderMath(previewElement);
  }

  // ==========================================
  // STUDENT TEST ARENA
  // ==========================================
  async startTestForStudent(quizId) {
    const student = window.auth.getCurrentUser();
    if (!student || student.role !== 'student') {
      throw new Error('មានតែគណនីសិស្សទេដែលអាចចាប់ផ្ដើមធ្វើតេស្តបាន!');
    }

    // 1. Fetch sanitized quiz for student
    const quiz = await window.db.getQuizById(quizId, 'student');
    if (!quiz) throw new Error('រកមិនឃើញកម្រងតេស្ត');

    // 2. Start attempt in database with server-recorded started_at & expires_at
    const attempt = await window.db.startQuizAttempt(
      quizId,
      student.id,
      student.fullNameKm || student.email,
      student.classCode || 'MTH-12A'
    );

    this.activeQuiz = quiz;
    this.activeAttempt = attempt;
    this.currentQuestionIndex = 0;
    this.studentAnswers = {};
    this.flaggedQuestions.clear();

    // 3. Render Arena View
    this.renderTestArena();

    // 4. Start Live Countdown Timer
    this.startCountdownTimer();

    // 5. Start Auto-Save Draft Loop (every 10 seconds)
    this.startAutoSaveLoop();
  }

  renderTestArena() {
    const mainView = document.getElementById('view-container');
    if (!mainView) return;

    const quiz = this.activeQuiz;
    const questions = quiz.questions || [];
    const currentQ = questions[this.currentQuestionIndex];

    mainView.innerHTML = `
      <div class="test-arena-wrapper">
        <!-- Test Sticky Header -->
        <header class="test-arena-header">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <button class="btn btn-secondary btn-sm" id="btn-exit-test" title="ចាកចេញ">
              <i data-lucide="arrow-left"></i> ចាកចេញ
            </button>
            <div>
              <h2 style="font-size: 1.15rem; font-weight: 600;">${quiz.title}</h2>
              <span style="font-size: 0.8rem; color: var(--text-muted);">
                សំណួរ ${this.currentQuestionIndex + 1} នៃ ${questions.length} | ពិន្ទុសរុប: ${quiz.totalPoints} ពិន្ទុ
              </span>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 1.25rem;">
            <!-- Live Timer Widget -->
            <div class="timer-widget" id="test-timer-widget">
              <i data-lucide="clock" style="color: var(--primary-light);"></i>
              <span class="timer-digits" id="timer-display">--:--</span>
            </div>

            <!-- Auto-save Pill -->
            <div id="autosave-status" style="font-size: 0.78rem; color: #34d399; display: flex; align-items: center; gap: 0.35rem;">
              <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> រក្សាទុករួចរាល់
            </div>

            <!-- Final Submit Button -->
            <button class="btn btn-primary" id="btn-submit-test">
              <i data-lucide="send"></i> បញ្ជូនតេស្ត
            </button>
          </div>
        </header>

        <!-- Arena Main Grid -->
        <div class="app-container" style="padding-top: 1.5rem;">
          <div style="display: grid; grid-template-columns: 1fr 320px; gap: 1.75rem;">
            
            <!-- Question Interactive Card -->
            <div class="card" style="padding: 2rem;" id="active-question-card">
              ${this.renderQuestionContent(currentQ, this.currentQuestionIndex + 1)}

              <!-- Navigation Controls -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--border-subtle);">
                <button class="btn btn-secondary" id="btn-prev-q" ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
                  <i data-lucide="chevron-left"></i> សំណួរមុន
                </button>

                <button class="btn ${this.flaggedQuestions.has(currentQ.id) ? 'btn-danger' : 'btn-secondary'}" id="btn-flag-q">
                  <i data-lucide="flag"></i> ${this.flaggedQuestions.has(currentQ.id) ? 'បានចំណាំសំណួរនេះ' : 'ចំណាំសំណួរនេះ'}
                </button>

                <button class="btn btn-primary" id="btn-next-q">
                  ${this.currentQuestionIndex === questions.length - 1 ? 'ពិនិត្យចម្លើយ' : 'សំណួរបន្ទាប់'} <i data-lucide="chevron-right"></i>
                </button>
              </div>
            </div>

            <!-- Question Palette Sidebar -->
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              <div class="card" style="padding: 1.25rem;">
                <h4 style="font-size: 0.95rem; margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.5rem;">
                  <i data-lucide="grid"></i> តារាងសំណួរ (${questions.length})
                </h4>

                <div class="question-palette" id="question-palette-grid">
                  ${questions.map((q, idx) => {
                    const isAnswered = this.studentAnswers[q.id] && this.studentAnswers[q.id].trim() !== '';
                    const isCurrent = idx === this.currentQuestionIndex;
                    const isFlagged = this.flaggedQuestions.has(q.id);

                    let classNames = 'palette-btn';
                    if (isCurrent) classNames += ' current';
                    else if (isFlagged) classNames += ' flagged';
                    else if (isAnswered) classNames += ' answered';

                    return `<button class="${classNames}" data-index="${idx}">${idx + 1}</button>`;
                  }).join('')}
                </div>

                <!-- Palette Legend -->
                <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 0.45rem; font-size: 0.78rem; color: var(--text-muted);">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="width: 12px; height: 12px; border-radius: 3px; background: rgba(16, 185, 129, 0.4); border: 1px solid #10b981;"></span> បានឆ្លើយរួច
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="width: 12px; height: 12px; border-radius: 3px; background: rgba(245, 158, 11, 0.4); border: 1px solid #f59e0b;"></span> បានចំណាំទុក (Flagged)
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="width: 12px; height: 12px; border-radius: 3px; background: rgba(99, 102, 241, 0.4); border: 1px solid #6366f1;"></span> កំពុងមើល
                  </div>
                </div>
              </div>

              <!-- Quick Math Reference Card -->
              <div class="card" style="padding: 1.25rem; font-size: 0.82rem; color: var(--text-secondary);">
                <div style="font-weight: 600; color: #fff; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
                  <i data-lucide="info" style="color: var(--primary-light);"></i> ព័ត៌មានជំនួយ
                </div>
                ប្រព័ន្ធនឹងរក្សាទុកចម្លើយរបស់អ្នកដោយស្វ័យប្រវត្តិ។ នៅពេលម៉ោងបញ្ចប់ ប្រព័ន្ធនឹងបញ្ជូនចម្លើយដោយស្វ័យប្រវត្តិ។
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.renderMath(document.getElementById('active-question-card'));
    this.attachArenaEventListeners();
  }

  renderQuestionContent(q, num) {
    if (!q) return '<p>មិនមានសំណួរនេះទេ</p>';

    const currentVal = this.studentAnswers[q.id] || '';

    let inputHtml = '';
    if (q.type === 'mcq') {
      inputHtml = `
        <div style="margin-top: 1.5rem;">
          ${(q.options || []).map(opt => `
            <div class="test-option-card ${currentVal === opt.id ? 'selected' : ''}" data-qid="${q.id}" data-val="${opt.id}">
              <div class="option-badge">${opt.id}</div>
              <div style="font-size: 1rem; color: #fff;">${opt.text || ''}</div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (q.type === 'true_false') {
      inputHtml = `
        <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
          <div class="test-option-card ${currentVal === 'true' ? 'selected' : ''}" style="flex: 1;" data-qid="${q.id}" data-val="true">
            <div class="option-badge">✓</div>
            <div style="font-size: 1.05rem; font-weight: 600; color: #34d399;">ពិត (True)</div>
          </div>
          <div class="test-option-card ${currentVal === 'false' ? 'selected' : ''}" style="flex: 1;" data-qid="${q.id}" data-val="false">
            <div class="option-badge">✗</div>
            <div style="font-size: 1.05rem; font-weight: 600; color: #f87171;">មិនពិត (False)</div>
          </div>
        </div>
      `;
    } else if (q.type === 'short_answer') {
      inputHtml = `
        <div style="margin-top: 1.5rem;">
          <label class="form-label">បញ្ចូលចម្លើយខ្លីរបស់អ្នក (លេខ ឬកន្សោម)៖</label>
          <input type="text" class="form-control" id="short-answer-input" data-qid="${q.id}" value="${currentVal}" placeholder="ឧទាហរណ៍៖ -1, 5, ឬ 2pi..." style="max-width: 420px; font-size: 1.1rem; font-family: var(--font-math);" />
        </div>
      `;
    } else if (q.type === 'open_response') {
      inputHtml = `
        <div style="margin-top: 1.5rem;">
          <label class="form-label">សរសេរដំណោះស្រាយលម្អិតរបស់អ្នក (គ្រូនឹងពិនិត្យ និងដាក់ពិន្ទុផ្ទាល់)៖</label>
          <textarea class="form-textarea" id="open-response-input" data-qid="${q.id}" rows="5" placeholder="សរសេរជំហានដោះស្រាយ រូបមន្តដែលប្រើប្រាស់...">${currentVal}</textarea>
        </div>
      `;
    }

    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
        <span class="status-pill status-active">សំណួរទី ${num}</span>
        <span style="font-weight: 600; font-family: var(--font-math); color: var(--primary-light);">${q.points} ពិន្ទុ</span>
      </div>

      <div style="font-size: 1.15rem; font-weight: 500; color: #f8fafc; margin-bottom: 1rem; line-height: 1.6;">
        ${q.promptKm}
      </div>

      ${q.mathFormula ? `
        <div style="background: rgba(12, 16, 33, 0.6); padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid var(--primary); margin-bottom: 1.5rem; font-size: 1.2rem; text-align: center;">
          $$${q.mathFormula}$$
        </div>
      ` : ''}

      ${inputHtml}
    `;
  }

  attachArenaEventListeners() {
    const questions = this.activeQuiz.questions || [];

    // Next button
    const nextBtn = document.getElementById('btn-next-q');
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (this.currentQuestionIndex < questions.length - 1) {
          this.currentQuestionIndex++;
          this.renderTestArena();
        } else {
          this.promptSubmitConfirmation();
        }
      };
    }

    // Prev button
    const prevBtn = document.getElementById('btn-prev-q');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (this.currentQuestionIndex > 0) {
          this.currentQuestionIndex--;
          this.renderTestArena();
        }
      };
    }

    // Flag button
    const flagBtn = document.getElementById('btn-flag-q');
    if (flagBtn) {
      flagBtn.onclick = () => {
        const qId = questions[this.currentQuestionIndex].id;
        if (this.flaggedQuestions.has(qId)) {
          this.flaggedQuestions.delete(qId);
        } else {
          this.flaggedQuestions.add(qId);
        }
        this.renderTestArena();
      };
    }

    // Option cards selection (MCQ & True/False)
    document.querySelectorAll('.test-option-card').forEach(card => {
      card.onclick = () => {
        const qid = card.dataset.qid;
        const val = card.dataset.val;
        this.studentAnswers[qid] = val;
        this.renderTestArena();
        this.triggerDraftSave();
      };
    });

    // Short answer input
    const shortInput = document.getElementById('short-answer-input');
    if (shortInput) {
      shortInput.oninput = (e) => {
        this.studentAnswers[shortInput.dataset.qid] = e.target.value;
        this.updatePaletteButton(this.currentQuestionIndex, !!e.target.value.trim());
      };
      shortInput.onblur = () => this.triggerDraftSave();
    }

    // Open response textarea
    const openInput = document.getElementById('open-response-input');
    if (openInput) {
      openInput.oninput = (e) => {
        this.studentAnswers[openInput.dataset.qid] = e.target.value;
        this.updatePaletteButton(this.currentQuestionIndex, !!e.target.value.trim());
      };
      openInput.onblur = () => this.triggerDraftSave();
    }

    // Palette direct question jump
    document.querySelectorAll('.palette-btn').forEach(btn => {
      btn.onclick = () => {
        this.currentQuestionIndex = parseInt(btn.dataset.index, 10);
        this.renderTestArena();
      };
    });

    // Submit button
    const submitBtn = document.getElementById('btn-submit-test');
    if (submitBtn) {
      submitBtn.onclick = () => this.promptSubmitConfirmation();
    }

    // Exit button
    const exitBtn = document.getElementById('btn-exit-test');
    if (exitBtn) {
      exitBtn.onclick = () => {
        if (confirm('តើអ្នកពិតជាចង់ផ្អាកការធ្វើតេស្តនេះមែនទេ? ចម្លើយរបស់អ្នកត្រូវបានរក្សាទុកជាបណ្ដោះអាសន្ន។')) {
          this.cleanupTimers();
          window.app.navigate('student-quizzes');
        }
      };
    }
  }

  updatePaletteButton(index, hasAnswer) {
    const btn = document.querySelector(`.palette-btn[data-index="${index}"]`);
    if (btn && !btn.classList.contains('current')) {
      if (hasAnswer) btn.classList.add('answered');
      else btn.classList.remove('answered');
    }
  }

  // --- Countdown Timer Logic ---
  startCountdownTimer() {
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.updateTimerDisplay();
    }, 1000);
  }

  updateTimerDisplay() {
    if (!this.activeAttempt) return;

    const now = Date.now();
    const expiresAt = new Date(this.activeAttempt.expiresAt).getTime();
    const diffMs = expiresAt - now;

    const timerWidget = document.getElementById('test-timer-widget');
    const timerDisplay = document.getElementById('timer-display');

    if (diffMs <= 0) {
      // Server-enforced expiry triggered!
      if (timerDisplay) timerDisplay.textContent = '00:00';
      this.cleanupTimers();
      window.app.showToast('ពេលវេលាធ្វើតេស្តបានផុតកំណត់! ប្រព័ន្ធកំពុងបញ្ជូនចម្លើយរបស់អ្នក...', 'info');
      this.executeSubmit(true);
      return;
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (timerDisplay) timerDisplay.textContent = formatted;

    // Visual alerts
    if (timerWidget) {
      if (minutes < 1) {
        timerWidget.className = 'timer-widget danger';
      } else if (minutes < 5) {
        timerWidget.className = 'timer-widget warning';
      } else {
        timerWidget.className = 'timer-widget';
      }
    }
  }

  // --- Auto-Save Drafts ---
  startAutoSaveLoop() {
    this.autoSaveInterval = setInterval(() => {
      this.triggerDraftSave();
    }, 10000); // Every 10 seconds
  }

  async triggerDraftSave() {
    if (!this.activeAttempt) return;
    try {
      await window.db.saveAttemptDraft(this.activeAttempt.id, this.studentAnswers);
      const statusPill = document.getElementById('autosave-status');
      if (statusPill) {
        statusPill.innerHTML = `<i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> បានរក្សាទុក`;
        if (window.lucide) window.lucide.createIcons();
      }
    } catch (e) {
      console.warn('Auto-save error:', e);
    }
  }

  cleanupTimers() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    this.timerInterval = null;
    this.autoSaveInterval = null;
  }

  promptSubmitConfirmation() {
    const questions = this.activeQuiz.questions || [];
    let answeredCount = 0;
    questions.forEach(q => {
      if (this.studentAnswers[q.id] && this.studentAnswers[q.id].trim() !== '') {
        answeredCount++;
      }
    });

    const unansweredCount = questions.length - answeredCount;

    const msg = unansweredCount > 0 
      ? `អ្នកបានឆ្លើយចំនួន ${answeredCount} នៃ ${questions.length} សំណួរ។ នៅសល់ ${unansweredCount} សំណួរមិនទាន់ឆ្លើយ។\n\nតើអ្នកពិតជាចង់បញ្ចប់ និងបញ្ជូនតេស្តនេះមែនទេ?`
      : `អ្នកបានឆ្លើយគ្រប់ទាំង ${questions.length} សំណួររួចរាល់ហើយ!\n\nតើអ្នកពិតជាចង់បញ្ចប់ និងបញ្ជូនតេស្តនេះមែនទេ?`;

    if (confirm(msg)) {
      this.executeSubmit(false);
    }
  }

  async executeSubmit(isExpired = false) {
    this.cleanupTimers();
    try {
      window.app.showLoading(true, 'កំពុងផ្ទៀងផ្ទាត់ និងគណនាពិន្ទុលើ Server...');
      const completedAttempt = await window.db.submitQuizAttempt(this.activeAttempt.id, this.studentAnswers);
      window.app.showLoading(false);

      window.app.showToast('បានបញ្ជូនតេស្តដោយជោគជ័យ!', 'success');
      // Show Results View
      this.renderTestResults(completedAttempt);
    } catch (err) {
      window.app.showLoading(false);
      window.app.showToast('បរាជ័យក្នុងការបញ្ជូនតេស្ត៖ ' + err.message, 'error');
    }
  }

  // --- Render Test Results View ---
  async renderTestResults(attempt) {
    const mainView = document.getElementById('view-container');
    if (!mainView) return;

    // Fetch full quiz with correct answers and explanations for student review
    const fullQuiz = await window.db.getQuizById(attempt.quizId, 'teacher');
    const questions = fullQuiz.questions || [];

    const gradeLetter = attempt.percentage >= 85 ? 'A' : (attempt.percentage >= 75 ? 'B' : (attempt.percentage >= 65 ? 'C' : (attempt.percentage >= 50 ? 'D' : (attempt.percentage >= 40 ? 'E' : 'F'))));
    const gradeColor = attempt.percentage >= 50 ? '#10b981' : '#f43f5e';

    mainView.innerHTML = `
      <div class="app-container">
        <!-- Results Hero Header -->
        <div class="hero-card" style="margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
            <div>
              <span class="status-pill status-active" style="margin-bottom: 0.5rem;">លទ្ធផលនៃការប្រឡង</span>
              <h1 style="font-size: 1.85rem; font-weight: 700; margin-bottom: 0.3rem;">${fullQuiz.title}</h1>
              <p style="color: var(--text-secondary);">បានបញ្ជូននៅ៖ ${new Date(attempt.submittedAt).toLocaleString('km-KH')}</p>
            </div>

            <!-- Score Circular Badge -->
            <div style="display: flex; align-items: center; gap: 1.5rem; background: rgba(12, 16, 33, 0.7); padding: 1.25rem 2rem; border-radius: var(--radius-xl); border: 1px solid var(--border-medium);">
              <div style="text-align: center;">
                <div style="font-size: 2.4rem; font-weight: 800; font-family: var(--font-math); color: ${gradeColor}; line-height: 1;">
                  ${attempt.totalScore}<span style="font-size: 1.2rem; color: var(--text-muted);">/${attempt.maxScore}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">ពិន្ទុសរុប (${attempt.percentage}%)</div>
              </div>

              <div style="width: 1px; height: 50px; background: var(--border-subtle);"></div>

              <div style="text-align: center;">
                <div style="font-size: 2.4rem; font-weight: 800; font-family: var(--font-math); color: ${gradeColor}; line-height: 1;">
                  ${gradeLetter}
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">និទ្ទេស</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Teacher Feedback Note (if any) -->
        ${attempt.teacherFeedback ? `
          <div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid var(--accent-cyan); background: rgba(6, 182, 212, 0.08);">
            <div style="font-weight: 600; color: var(--accent-cyan); margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
              <i data-lucide="message-square"></i> មតិកែលម្អពីលោកគ្រូ/អ្នកគ្រូ៖
            </div>
            <p style="color: #fff; font-size: 0.95rem;">${attempt.teacherFeedback}</p>
          </div>
        ` : ''}

        <!-- Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.2rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="file-check"></i> ពិនិត្យចម្លើយ និងដំណោះស្រាយលម្អិត
          </h3>
          <button class="btn btn-primary" id="btn-back-to-lessons">
            <i data-lucide="arrow-left"></i> ត្រឡប់ទៅផ្ទាំងមេរៀន
          </button>
        </div>

        <!-- Detailed Question Solutions List -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${questions.map((q, idx) => {
            const ans = (attempt.answers && attempt.answers[q.id]) || { response: '', score: 0, isCorrect: false };
            const isCorrect = ans.isCorrect === true;
            const isOpen = q.type === 'open_response';

            return `
              <div class="card" style="border-left: 4px solid ${isOpen ? '#06b6d4' : (isCorrect ? '#10b981' : '#f43f5e')};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                  <span class="status-pill ${isOpen ? 'status-active' : (isCorrect ? 'status-published' : 'status-hidden')}">
                    សំណួរទី ${idx + 1} (${q.points} ពិន្ទុ)
                  </span>
                  <span style="font-family: var(--font-math); font-weight: 600; font-size: 1rem; color: ${isCorrect ? '#34d399' : '#f87171'};">
                    ពិន្ទុទទួលបាន: ${ans.score || 0}/${q.points}
                  </span>
                </div>

                <div style="font-size: 1.05rem; font-weight: 500; color: #fff; margin-bottom: 0.75rem;">
                  ${q.promptKm}
                </div>

                ${q.mathFormula ? `
                  <div style="background: rgba(12, 16, 33, 0.5); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 1rem; text-align: center;">
                    $$${q.mathFormula}$$
                  </div>
                ` : ''}

                <!-- Student Response vs Correct Answer -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; background: rgba(255, 255, 255, 0.02); padding: 1rem; border-radius: var(--radius-md);">
                  <div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem;">ចម្លើយរបស់អ្នក៖</div>
                    <div style="font-weight: 600; color: ${isCorrect ? '#34d399' : '#f87171'};">
                      ${ans.response || '<em style="color:#64748b;">(មិនបានឆ្លើយ)</em>'}
                    </div>
                  </div>

                  <div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem;">ចម្លើយត្រឹមត្រូវ៖</div>
                    <div style="font-weight: 600; color: #34d399;">
                      ${q.correctOption || 'ពិនិត្យដំណោះស្រាយគំរូខាងក្រោម'}
                    </div>
                  </div>
                </div>

                <!-- Step-by-Step Explanation -->
                <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: var(--radius-md); padding: 1rem;">
                  <div style="font-weight: 600; color: var(--primary-light); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                    <i data-lucide="book-open"></i> ដំណោះស្រាយលម្អិត និងការពន្យល់៖
                  </div>
                  <div style="color: var(--text-secondary); line-height: 1.7; white-space: pre-line;">
                    ${q.explanationKm}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.renderMath(mainView);

    const backBtn = document.getElementById('btn-back-to-lessons');
    if (backBtn) {
      backBtn.onclick = () => window.app.navigate('student-lessons');
    }
  }
}

// Global Quiz instance
window.quizService = new QuizService();
