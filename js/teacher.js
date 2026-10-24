/**
 * Khmer Math Learning & Assessment System (រៀន និងវាយតម្លៃគណិតវិទ្យាខ្មែរ)
 * Teacher Dashboard & Class/Lesson/Quiz Authoring Controller
 */

class TeacherController {
  constructor() {
    this.selectedGrade = 12; // default
    this.selectedClassId = 'class-12a';
  }

  // --- Render Teacher Dashboard Views ---
  async renderClassesAndLessons(container) {
    if (!window.auth.canEditLesson()) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem; border: 1px solid var(--accent-rose);">
          <i data-lucide="shield-alert" style="width: 48px; height: 48px; color: #f43f5e; margin-bottom: 1rem;"></i>
          <h2 style="font-size: 1.4rem; color: #f43f5e; margin-bottom: 0.5rem;">សិទ្ធិត្រូវបានបដិសេធ (403 Forbidden)</h2>
          <p style="color: var(--text-secondary); max-width: 520px; margin: 0 auto 1.5rem auto;">
            ផ្ទាំងគ្រប់គ្រងថ្នាក់ និងមេរៀននេះ សម្រាប់តែគ្រូបង្រៀន និង Super Admin ប៉ុណ្ណោះ។
          </p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const classes = await window.db.getClasses(this.selectedGrade);
    const selectedClass = (await window.db.getClassById(this.selectedClassId)) || classes[0] || null;
    if (selectedClass) {
      this.selectedClassId = selectedClass.id;
    }

    const chapters = selectedClass ? await window.db.getChapters(selectedClass.id) : [];

    container.innerHTML = `
      <!-- Grade Filter Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <div class="grade-filters">
          <button class="grade-pill ${this.selectedGrade === 12 ? 'active' : ''}" data-grade="12">ថ្នាក់ទី១២ (Grade 12)</button>
          <button class="grade-pill ${this.selectedGrade === 11 ? 'active' : ''}" data-grade="11">ថ្នាក់ទី១១ (Grade 11)</button>
          <button class="grade-pill ${this.selectedGrade === 10 ? 'active' : ''}" data-grade="10">ថ្នាក់ទី១០ (Grade 10)</button>
        </div>

        <div style="display: flex; gap: 0.75rem;">
          <button class="btn btn-secondary btn-sm" id="btn-create-class">
            <i data-lucide="plus-circle"></i> បង្កើតថ្នាក់ថ្មី
          </button>
          <button class="btn btn-primary btn-sm" id="btn-create-chapter">
            <i data-lucide="folder-plus"></i> បន្ថែមជំពូកថ្មី
          </button>
        </div>
      </div>

      <!-- Class Selector Pills -->
      <div style="display: flex; gap: 0.75rem; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 0.5rem;">
        ${classes.map(c => `
          <button class="card class-selector-card ${c.id === this.selectedClassId ? 'active-class' : ''}" 
                  data-classid="${c.id}" 
                  style="padding: 0.85rem 1.25rem; min-width: 220px; cursor: pointer; border-color: ${c.id === this.selectedClassId ? 'var(--primary)' : 'var(--border-subtle)'}; background: ${c.id === this.selectedClassId ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)'};">
            <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">${c.name}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem; font-size: 0.78rem; color: var(--text-muted);">
              <span>កូដ: <b style="color:var(--accent-cyan);">${c.code}</b></span>
              <span>${c.studentCount} សិស្ស</span>
            </div>
          </button>
        `).join('')}
      </div>

      <!-- Class Details & Chapters Content -->
      ${selectedClass ? `
        <div style="margin-bottom: 2rem;">
          <div class="card" style="margin-bottom: 1.5rem; background: rgba(18, 24, 50, 0.4);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <h2 style="font-size: 1.35rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem;">
                  ${selectedClass.name}
                </h2>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">${selectedClass.description || ''}</p>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span class="status-pill status-active">កូដចូលរៀន៖ <b>${selectedClass.code}</b></span>
                <button class="btn btn-primary btn-sm" id="btn-add-lesson-direct" data-classid="${selectedClass.id}">
                  <i data-lucide="file-plus"></i> បន្ថែមមេរៀន
                </button>
              </div>
            </div>
          </div>

          <!-- Chapters & Lessons Accordion List -->
          <div id="chapters-list-container">
            ${chapters.length === 0 ? `
              <div class="card" style="text-align: center; padding: 3rem;">
                <p style="color: var(--text-muted); margin-bottom: 1rem;">មិនទាន់មានជំពូកនៅឡើយទេក្នុងថ្នាក់នេះ។</p>
                <button class="btn btn-primary btn-sm" id="btn-create-first-chapter">
                  <i data-lucide="plus"></i> បង្កើតជំពូកដំបូង
                </button>
              </div>
            ` : ''}

            ${chapters.map(chap => `
              <div class="chapter-accordion" data-chapid="${chap.id}">
                <div class="chapter-header">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <i data-lucide="folder" style="color: var(--primary-light);"></i>
                    <div>
                      <h3 style="font-size: 1.05rem; font-weight: 600; color: #fff;">${chap.title}</h3>
                      <span style="font-size: 0.8rem; color: var(--text-muted);">${chap.description || ''}</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <button class="btn btn-secondary btn-sm btn-add-lesson" data-chapid="${chap.id}" title="បន្ថែមមេរៀន">
                      <i data-lucide="plus"></i> បន្ថែមមេរៀន
                    </button>
                  </div>
                </div>

                <!-- Lessons inside chapter -->
                <div class="chapter-lessons-list" id="lessons-list-${chap.id}">
                  <!-- Loaded asynchronously or rendered here -->
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="card" style="text-align: center; padding: 3rem;">
          <p style="color: var(--text-muted);">មិនទាន់មានថ្នាក់រៀនសម្រាប់កម្រិតនេះទេ។ សូមបង្កើតថ្នាក់ថ្មី។</p>
        </div>
      `}
    `;

    if (window.lucide) window.lucide.createIcons();

    // Load lessons for each chapter
    for (const chap of chapters) {
      await this.loadLessonsForChapter(chap.id);
    }

    this.attachClassesAndLessonsEvents();
  }

  async loadLessonsForChapter(chapterId) {
    const listContainer = document.getElementById(`lessons-list-${chapterId}`);
    if (!listContainer) return;

    // Teacher can view all lessons (published and hidden)
    const lessons = await window.db.getLessons(chapterId, 'teacher');

    if (lessons.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 1rem 1.5rem; color: var(--text-dim); font-size: 0.85rem; font-style: italic;">
          មិនទាន់មានមេរៀនក្នុងជំពូកនេះនៅឡើយទេ
        </div>
      `;
      return;
    }

    listContainer.innerHTML = lessons.map(les => `
      <div class="lesson-item-row" data-lesid="${les.id}">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <i data-lucide="book" style="color: var(--accent-cyan); width: 18px; height: 18px;"></i>
          <div>
            <div style="font-weight: 600; font-size: 0.95rem; color: #fff; display: flex; align-items: center; gap: 0.5rem;">
              ${les.title}
              <span class="status-pill ${les.isPublished ? 'status-published' : 'status-hidden'}" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;">
                ${les.isPublished ? 'សាធារណៈ (Published)' : 'លាក់ទុក (Hidden)'}
              </span>
            </div>

            <!-- Attached Files Preview Badges -->
            <div style="display: flex; gap: 0.5rem; margin-top: 0.35rem; flex-wrap: wrap;">
              ${(les.files || []).map(f => `
                <a href="${f.url}" target="_blank" download="${f.name}" class="lesson-badge-tag badge-${f.type}" style="text-decoration:none;" title="ទាញយក ${f.name} (${f.size})">
                  <i data-lucide="file-text" style="width: 12px; height: 12px;"></i> ${f.name} (${f.size})
                </a>
              `).join('')}

              ${les.video ? `
                <span class="lesson-badge-tag badge-video" title="${les.video.title}">
                  <i data-lucide="video" style="width: 12px; height: 12px;"></i> វីដេអូ (${les.video.duration || 'មាន'})
                </span>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Lesson Row Actions -->
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm btn-view-lesson" data-lesid="${les.id}" title="មើលមេរៀន">
            <i data-lucide="eye"></i> មើល
          </button>
          <button class="btn btn-secondary btn-sm btn-edit-lesson" data-lesid="${les.id}" title="កែសម្រួល">
            <i data-lucide="edit-3"></i> កែ
          </button>
          <button class="btn btn-danger btn-sm btn-delete-lesson" data-lesid="${les.id}" title="លុប">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
    this.attachLessonItemEvents(listContainer);
  }

  attachClassesAndLessonsEvents() {
    // Grade pill clicks
    document.querySelectorAll('.grade-pill').forEach(pill => {
      pill.onclick = () => {
        this.selectedGrade = parseInt(pill.dataset.grade, 10);
        window.app.renderCurrentView();
      };
    });

    // Class card clicks
    document.querySelectorAll('.class-selector-card').forEach(card => {
      card.onclick = () => {
        this.selectedClassId = card.dataset.classid;
        window.app.renderCurrentView();
      };
    });

    // Create Class Button
    const btnCreateClass = document.getElementById('btn-create-class');
    if (btnCreateClass) {
      btnCreateClass.onclick = () => this.showCreateClassModal();
    }

    // Create Chapter Button
    const btnCreateChap = document.getElementById('btn-create-chapter');
    const btnCreateFirstChap = document.getElementById('btn-create-first-chapter');
    const handleChapCreate = () => this.showCreateChapterModal(this.selectedClassId);
    if (btnCreateChap) btnCreateChap.onclick = handleChapCreate;
    if (btnCreateFirstChap) btnCreateFirstChap.onclick = handleChapCreate;

    // Add Lesson button in chapter
    document.querySelectorAll('.btn-add-lesson').forEach(btn => {
      btn.onclick = () => this.showCreateLessonModal(btn.dataset.chapid);
    });

    // Direct Add Lesson button
    const directAdd = document.getElementById('btn-add-lesson-direct');
    if (directAdd) {
      directAdd.onclick = async () => {
        const chapters = await window.db.getChapters(this.selectedClassId);
        if (chapters.length === 0) {
          window.app.showToast('សូមបង្កើតជំពូកជាមុនសិន មុននឹងបន្ថែមមេរៀន!', 'info');
          this.showCreateChapterModal(this.selectedClassId);
        } else {
          this.showCreateLessonModal(chapters[0].id);
        }
      };
    }
  }

  attachLessonItemEvents(container) {
    // View lesson modal
    container.querySelectorAll('.btn-view-lesson').forEach(btn => {
      btn.onclick = () => this.showViewLessonModal(btn.dataset.lesid);
    });

    // Edit lesson modal
    container.querySelectorAll('.btn-edit-lesson').forEach(btn => {
      btn.onclick = () => this.showEditLessonModal(btn.dataset.lesid);
    });

    // Delete lesson
    container.querySelectorAll('.btn-delete-lesson').forEach(btn => {
      btn.onclick = async () => {
        if (confirm('តើអ្នកពិតជាចង់លុបមេរៀននេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។')) {
          await window.db.deleteLesson(btn.dataset.lesid);
          window.app.showToast('បានលុបមេរៀនដោយជោគជ័យ!', 'success');
          window.app.renderCurrentView();
        }
      };
    });
  }

  // ==========================================
  // MODALS: CLASS, CHAPTER, LESSON
  // ==========================================
  showCreateClassModal() {
    window.app.openModal({
      title: 'បង្កើតថ្នាក់គណិតវិទ្យាថ្មី',
      bodyHtml: `
        <form id="form-create-class">
          <div class="form-group">
            <label class="form-label">ឈ្មោះថ្នាក់រៀន *</label>
            <input type="text" class="form-control" id="class-name-input" placeholder="ឧ. ថ្នាក់គណិតវិទ្យា ១២B (វិទ្យាសាស្ត្រពិត)" required />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">កម្រិតថ្នាក់ *</label>
              <select class="form-select" id="class-grade-select">
                <option value="12" ${this.selectedGrade === 12 ? 'selected' : ''}>ថ្នាក់ទី១២</option>
                <option value="11" ${this.selectedGrade === 11 ? 'selected' : ''}>ថ្នាក់ទី១១</option>
                <option value="10" ${this.selectedGrade === 10 ? 'selected' : ''}>ថ្នាក់ទី១០</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">កូដថ្នាក់ (Class Code) *</label>
              <input type="text" class="form-control" id="class-code-input" value="MTH-${Math.floor(100 + Math.random() * 900)}" required />
              <div class="form-helper">សិស្សនឹងប្រើកូដនេះដើម្បីចុះឈ្មោះចូលរៀន</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">សេចក្ដីពិពណ៌នា</label>
            <textarea class="form-textarea" id="class-desc-input" placeholder="ព័ត៌មានលម្អិតអំពីថ្នាក់រៀន..."></textarea>
          </div>
        </form>
      `,
      confirmText: 'បង្កើតថ្នាក់',
      onConfirm: async () => {
        const name = document.getElementById('class-name-input').value.trim();
        const grade = parseInt(document.getElementById('class-grade-select').value, 10);
        const code = document.getElementById('class-code-input').value.trim();
        const desc = document.getElementById('class-desc-input').value.trim();

        if (!name || !code) {
          window.app.showToast('សូមបំពេញឈ្មោះថ្នាក់ និងកូដថ្នាក់!', 'error');
          return false;
        }

        const newClass = await window.db.createClass({
          name,
          grade,
          code,
          description: desc,
          teacherId: window.auth.getCurrentUser().id,
          teacherName: window.auth.getCurrentUser().fullNameKm
        });

        this.selectedGrade = grade;
        this.selectedClassId = newClass.id;
        window.app.showToast('បានបង្កើតថ្នាក់ថ្មីដោយជោគជ័យ!', 'success');
        window.app.renderCurrentView();
        return true;
      }
    });
  }

  showCreateChapterModal(classId) {
    window.app.openModal({
      title: 'បន្ថែមជំពូកថ្មី',
      bodyHtml: `
        <form id="form-create-chapter">
          <div class="form-group">
            <label class="form-label">ចំណងជើងជំពូក *</label>
            <input type="text" class="form-control" id="chap-title-input" placeholder="ឧ. ជំពូកទី៤៖ ធរណីមាត្រក្នុងលំហ" required />
          </div>
          <div class="form-group">
            <label class="form-label">សេចក្ដីពិពណ៌នា</label>
            <textarea class="form-textarea" id="chap-desc-input" placeholder="ប្រធានបទសំខាន់ៗដែលត្រូវរៀនក្នុងជំពូកនេះ..."></textarea>
          </div>
        </form>
      `,
      confirmText: 'រក្សាទុកជំពូក',
      onConfirm: async () => {
        const title = document.getElementById('chap-title-input').value.trim();
        const desc = document.getElementById('chap-desc-input').value.trim();
        if (!title) {
          window.app.showToast('សូមបញ្ចូលចំណងជើងជំពូក!', 'error');
          return false;
        }

        await window.db.createChapter({
          classId,
          title,
          description: desc
        });

        window.app.showToast('បានបន្ថែមជំពូកដោយជោគជ័យ!', 'success');
        window.app.renderCurrentView();
        return true;
      }
    });
  }

  showCreateLessonModal(chapterId) {
    window.app.openModal({
      title: 'បន្ថែមមេរៀនថ្មី',
      bodyHtml: `
        <form id="form-create-lesson">
          <div class="form-group">
            <label class="form-label">ចំណងជើងមេរៀន *</label>
            <input type="text" class="form-control" id="lesson-title-input" placeholder="ឧ. មេរៀនទី១៖ សមីការប្លង់ក្នុងលំហ" required />
          </div>

          <div class="form-group">
            <label class="form-label">ស្ថានភាពបង្ហាញដល់សិស្ស</label>
            <select class="form-select" id="lesson-published-select">
              <option value="true" selected>សាធារណៈ (សិស្សអាចមើលឃើញ)</option>
              <option value="false">លាក់បណ្ដោះអាសន្ន (រក្សាទុកជាព្រាង)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">ខ្លឹមសារមេរៀន (គាំទ្ររូបមន្តគណិតវិទ្យា KaTeX ដូចជា $z = a+bi$ ឬ $$...$$)</label>
            
            <!-- Quick Math Tool Buttons -->
            <div class="math-toolbar" id="lesson-math-toolbar">
              <button type="button" class="math-btn-tool" data-latex="\\frac{a}{b}">\\frac{a}{b}</button>
              <button type="button" class="math-btn-tool" data-latex="\\sqrt{x}">\\sqrt{x}</button>
              <button type="button" class="math-btn-tool" data-latex="x^2">x^2</button>
              <button type="button" class="math-btn-tool" data-latex="\\int_a^b f(x)dx">\\int</button>
              <button type="button" class="math-btn-tool" data-latex="\\lim_{x\\to 0}">\\lim</button>
              <button type="button" class="math-btn-tool" data-latex="\\sum_{i=1}^n">\\sum</button>
              <button type="button" class="math-btn-tool" data-latex="\\pi">\\pi</button>
              <button type="button" class="math-btn-tool" data-latex="\\theta">\\theta</button>
              <button type="button" class="math-btn-tool" data-latex="z = a + bi">z = a+bi</button>
            </div>

            <textarea class="form-textarea" id="lesson-content-input" rows="6" placeholder="សរសេរទ្រឹស្តីបទ រូបមន្ត ឬការពន្យល់..."></textarea>
            <div class="math-preview-box" id="lesson-content-preview">
              <span style="color:#64748b;">មើលគំរូប្លង់ KaTeX...</span>
            </div>
          </div>

          <!-- Video Link Field -->
          <div class="form-group">
            <label class="form-label">តំណភ្ជាប់វីដេអូបង្រៀន (YouTube Embed URL / MP4 URL)</label>
            <input type="url" class="form-control" id="lesson-video-input" placeholder="https://www.youtube.com/embed/..." />
            <div class="form-helper">ផ្ដល់ជម្រើសប្រើ Video Hosting ជំនួសការផ្ទុកផ្ទាល់ ដើម្បីសន្សំសំចៃទំហំម៉ាស៊ីនមេ</div>
          </div>
        </form>
      `,
      confirmText: 'រក្សាទុកមេរៀន',
      onConfirm: async () => {
        const title = document.getElementById('lesson-title-input').value.trim();
        const content = document.getElementById('lesson-content-input').value.trim();
        const isPublished = document.getElementById('lesson-published-select').value === 'true';
        const videoUrl = document.getElementById('lesson-video-input').value.trim();

        if (!title) {
          window.app.showToast('សូមបញ្ចូលចំណងជើងមេរៀន!', 'error');
          return false;
        }

        const videoData = videoUrl ? {
          type: 'youtube',
          title: 'វីដេអូបង្រៀន៖ ' + title,
          url: videoUrl,
          duration: 'មេរៀនអនឡាញ'
        } : null;

        await window.db.createLesson({
          chapterId,
          title,
          contentKm: content,
          isPublished,
          video: videoData
        });

        window.app.showToast('បានបង្កើតមេរៀនថ្មីដោយជោគជ័យ!', 'success');
        window.app.renderCurrentView();
        return true;
      }
    });

    // Wire up KaTeX math preview in modal
    setTimeout(() => {
      const textarea = document.getElementById('lesson-content-input');
      const preview = document.getElementById('lesson-content-preview');
      if (textarea && preview) {
        textarea.oninput = () => window.quizService.updateMathPreview(textarea.value, preview);
        document.querySelectorAll('#lesson-math-toolbar .math-btn-tool').forEach(btn => {
          btn.onclick = () => window.quizService.insertMathSymbol(textarea, btn.dataset.latex, preview);
        });
      }
    }, 100);
  }

  showViewLessonModal(lessonId) {
    window.db.getLessonById(lessonId).then(les => {
      if (!les) return;
      window.app.openModal({
        title: les.title,
        bodyHtml: `
          <div>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
              <span class="status-pill ${les.isPublished ? 'status-published' : 'status-hidden'}">
                ${les.isPublished ? 'សាធារណៈ (Published)' : 'លាក់បណ្ដោះអាសន្ន'}
              </span>
            </div>

            <!-- Content Area -->
            <div class="card" style="background: rgba(12, 16, 33, 0.6); padding: 1.5rem; margin-bottom: 1.5rem; line-height: 1.8; color: #f8fafc;" id="view-lesson-math-box">
              ${les.contentKm ? les.contentKm.replace(/\n/g, '<br/>') : '<em>មិនមានខ្លឹមសារសរសេរឡើយ</em>'}
            </div>

            <!-- Attached Files & Upload Dropzone -->
            <div style="margin-bottom: 1.5rem;">
              <h4 style="font-size: 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                <i data-lucide="paperclip"></i> ឯកសារភ្ជាប់ (${(les.files || []).length})
              </h4>

              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;" id="modal-lesson-files-list">
                ${(les.files || []).map(f => `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.04); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                      <span class="lesson-badge-tag badge-${f.type}">${f.type.toUpperCase()}</span>
                      <span style="font-weight: 500;">${f.name}</span>
                      <span style="font-size: 0.78rem; color: var(--text-muted);">(${f.size})</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                      <a href="${f.url}" download="${f.name}" class="btn btn-secondary btn-sm" style="text-decoration:none;">
                        <i data-lucide="download"></i> ទាញយក
                      </a>
                      <button class="btn btn-danger btn-sm btn-delete-file" data-fid="${f.id}" data-lesid="${les.id}">
                        <i data-lucide="trash-2"></i>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Upload Dropzone -->
              <div class="file-dropzone" id="modal-file-dropzone">
                <div class="dropzone-icon"><i data-lucide="upload-cloud"></i></div>
                <div style="font-weight: 600; color: #fff;">ចុចទីនេះ ឬទម្លាក់ឯកសារដើម្បី Upload</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
                  គាំទ្រ PDF, Word (DOCX), PowerPoint (PPTX), និង MP4 (អតិបរមា 50MB)
                </div>
                <input type="file" id="modal-file-input" style="display: none;" accept=".pdf,.docx,.pptx,.mp4,.png,.jpg" />
              </div>
            </div>

            <!-- Video Player (if any) -->
            ${les.video && les.video.url ? `
              <div>
                <h4 style="font-size: 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                  <i data-lucide="video"></i> វីដេអូបង្រៀន
                </h4>
                <div class="video-responsive-wrapper">
                  <iframe src="${les.video.url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
              </div>
            ` : ''}
          </div>
        `,
        confirmText: 'បិទ',
        onConfirm: async () => true
      });

      if (window.lucide) window.lucide.createIcons();
      window.quizService.renderMath(document.getElementById('view-lesson-math-box'));

      // Wire file upload
      const dropzone = document.getElementById('modal-file-dropzone');
      const fileInput = document.getElementById('modal-file-input');
      if (dropzone && fileInput) {
        dropzone.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
          if (e.target.files && e.target.files[0]) {
            try {
              window.app.showLoading(true, 'កំពុង Upload និងត្រួតពិនិត្យឯកសារ...');
              await window.db.uploadLessonFile(e.target.files[0], les.id);
              window.app.showLoading(false);
              window.app.showToast('បាន Upload ឯកសារដោយជោគជ័យ!', 'success');
              window.app.closeModal();
              this.showViewLessonModal(les.id);
            } catch (err) {
              window.app.showLoading(false);
              window.app.showToast(err.message, 'error');
            }
          }
        };
      }

      // Wire delete file
      document.querySelectorAll('.btn-delete-file').forEach(btn => {
        btn.onclick = async () => {
          if (confirm('តើអ្នកពិតជាចង់លុបឯកសារភ្ជាប់នេះមែនទេ?')) {
            await window.db.deleteLessonFile(btn.dataset.lesid, btn.dataset.fid);
            window.app.showToast('បានលុបឯកសាររួចរាល់', 'info');
            window.app.closeModal();
            this.showViewLessonModal(les.id);
          }
        };
      });
    });
  }

  showEditLessonModal(lessonId) {
    window.db.getLessonById(lessonId).then(les => {
      if (!les) return;
      window.app.openModal({
        title: 'កែសម្រួលមេរៀន',
        bodyHtml: `
          <form id="form-edit-lesson">
            <div class="form-group">
              <label class="form-label">ចំណងជើងមេរៀន *</label>
              <input type="text" class="form-control" id="edit-lesson-title" value="${les.title}" required />
            </div>

            <div class="form-group">
              <label class="form-label">ស្ថានភាពបង្ហាញដល់សិស្ស</label>
              <select class="form-select" id="edit-lesson-published">
                <option value="true" ${les.isPublished ? 'selected' : ''}>សាធារណៈ (សិស្សអាចមើលឃើញ)</option>
                <option value="false" ${!les.isPublished ? 'selected' : ''}>លាក់បណ្ដោះអាសន្ន</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">ខ្លឹមសារមេរៀន (KaTeX)</label>
              <textarea class="form-textarea" id="edit-lesson-content" rows="6">${les.contentKm || ''}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">តំណភ្ជាប់វីដេអូបង្រៀន (URL)</label>
              <input type="url" class="form-control" id="edit-lesson-video" value="${les.video ? les.video.url : ''}" />
            </div>
          </form>
        `,
        confirmText: 'រក្សាទុកការកែប្រែ',
        onConfirm: async () => {
          const title = document.getElementById('edit-lesson-title').value.trim();
          const content = document.getElementById('edit-lesson-content').value.trim();
          const isPublished = document.getElementById('edit-lesson-published').value === 'true';
          const videoUrl = document.getElementById('edit-lesson-video').value.trim();

          if (!title) {
            window.app.showToast('សូមបញ្ចូលចំណងជើងមេរៀន', 'error');
            return false;
          }

          const videoData = videoUrl ? {
            type: 'youtube',
            title: 'វីដេអូបង្រៀន៖ ' + title,
            url: videoUrl,
            duration: 'មេរៀនអនឡាញ'
          } : null;

          await window.db.updateLesson(les.id, {
            title,
            contentKm: content,
            isPublished,
            video: videoData
          });

          window.app.showToast('បានកែប្រែមេរៀនដោយជោគជ័យ!', 'success');
          window.app.renderCurrentView();
          return true;
        }
      });
    });
  }

  // ==========================================
  // QUIZ AUTHORING INTERFACE («តេស្តរបស់ខ្ញុំ» & QUIZ MANAGEMENT)
  // ==========================================
  async renderQuizManager(container) {
    if (!window.auth.canEditLesson()) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem; border: 1px solid var(--accent-rose);">
          <i data-lucide="shield-alert" style="width: 48px; height: 48px; color: #f43f5e; margin-bottom: 1rem;"></i>
          <h2 style="font-size: 1.4rem; color: #f43f5e; margin-bottom: 0.5rem;">សិទ្ធិត្រូវបានបដិសេធ (403 Forbidden)</h2>
          <p style="color: var(--text-secondary); max-width: 520px; margin: 0 auto 1.5rem auto;">
            មានតែគ្រូបង្រៀន និង Super Admin ប៉ុណ្ណោះដែលអាចបង្កើត និងកែសម្រួលកម្រងតេស្តបាន។
          </p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Default filters if not set
    if (this.quizSearchQuery === undefined) this.quizSearchQuery = '';
    if (this.quizFilterGrade === undefined) this.quizFilterGrade = 'all';
    if (this.quizFilterClass === undefined) this.quizFilterClass = 'all';
    if (this.quizFilterStatus === undefined) this.quizFilterStatus = 'all';
    if (this.quizSortBy === undefined) this.quizSortBy = 'newest';

    // Fetch all quizzes for teachers
    const allQuizzes = await window.db.getQuizzes(null, 'teacher');

    // Apply filtering
    let filteredQuizzes = allQuizzes.filter(q => {
      // 1. Search Query
      if (this.quizSearchQuery) {
        const query = this.quizSearchQuery.toLowerCase();
        const matchTitle = (q.title || '').toLowerCase().includes(query);
        const matchDesc = (q.description || '').toLowerCase().includes(query);
        const matchTopic = (q.subject || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchTopic) return false;
      }

      // 2. Grade Filter
      if (this.quizFilterGrade !== 'all') {
        const g = parseInt(this.quizFilterGrade, 10);
        if (q.grade && q.grade !== g) return false;
      }

      // 3. Class Filter
      if (this.quizFilterClass !== 'all') {
        if (q.classId && q.classId !== this.quizFilterClass && q.classId !== 'all') return false;
      }

      // 4. Status Filter
      if (this.quizFilterStatus === 'published' && !q.isPublished) return false;
      if (this.quizFilterStatus === 'draft' && q.isPublished) return false;

      return true;
    });

    // Apply sorting
    filteredQuizzes.sort((a, b) => {
      if (this.quizSortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (this.quizSortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (this.quizSortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (this.quizSortBy === 'points') return (b.totalPoints || 0) - (a.totalPoints || 0);
      return 0;
    });

    // Counts
    const totalCount = allQuizzes.length;
    const publishedCount = allQuizzes.filter(q => q.isPublished).length;
    const draftCount = totalCount - publishedCount;
    const totalQuestionsAll = allQuizzes.reduce((sum, q) => sum + ((q.questions || []).length), 0);

    container.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <!-- Header & Action Buttons -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.35rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="file-text" style="color: var(--primary-light);"></i> តេស្តរបស់ខ្ញុំ & បន្ទប់តេស្តគណិតវិទ្យា
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
              គ្រប់គ្រងកម្រងតេស្តទាំងអស់ បង្កើតសំណួរតាមកម្រិតលំបាក កែសម្រួល ចម្លងតេស្ត និងបោះពុម្ពវិញ្ញាសា
            </p>
          </div>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button class="btn btn-secondary" id="btn-open-ai-studio">
              <i data-lucide="sparkles"></i> បង្កើតតាម AI & ឯកសារ
            </button>
            <button class="btn btn-primary" id="btn-create-new-quiz">
              <i data-lucide="plus-circle"></i> បង្កើតកម្រងតេស្តថ្មី
            </button>
          </div>
        </div>

        <!-- Metrics Overview Cards -->
        <div class="metrics-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="card metric-card" style="padding: 1rem 1.25rem;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">កម្រងតេស្តសរុប</div>
            <div style="font-size: 1.7rem; font-weight: 700; color: #fff; margin-top: 0.25rem;">${totalCount}</div>
          </div>
          <div class="card metric-card" style="padding: 1rem 1.25rem;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">បានផ្សព្វផ្សាយ (Published)</div>
            <div style="font-size: 1.7rem; font-weight: 700; color: #34d399; margin-top: 0.25rem;">${publishedCount}</div>
          </div>
          <div class="card metric-card" style="padding: 1rem 1.25rem;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">សេចក្តីព្រាង (Draft)</div>
            <div style="font-size: 1.7rem; font-weight: 700; color: #fbbf24; margin-top: 0.25rem;">${draftCount}</div>
          </div>
          <div class="card metric-card" style="padding: 1rem 1.25rem;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">សំណួរសរុបក្នុងប្រព័ន្ធ</div>
            <div style="font-size: 1.7rem; font-weight: 700; color: #818cf8; margin-top: 0.25rem;">${totalQuestionsAll}</div>
          </div>
        </div>

        <!-- Search, Filter & Sort Toolbar -->
        <div class="card" style="padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 0.75rem; align-items: center;">
            <!-- Search -->
            <div style="position: relative;">
              <input type="text" class="form-control" id="quiz-search-input" 
                     placeholder="🔍 ស្វែងរកតាមឈ្មោះតេស្ត ឬប្រធានបទ..." 
                     value="${this.quizSearchQuery}" style="padding-left: 1rem;" />
            </div>

            <!-- Grade Filter -->
            <div>
              <select class="form-select" id="quiz-filter-grade">
                <option value="all" ${this.quizFilterGrade === 'all' ? 'selected' : ''}>គ្រប់កម្រិតថ្នាក់</option>
                <option value="12" ${this.quizFilterGrade === '12' ? 'selected' : ''}>ថ្នាក់ទី១២ (Grade 12)</option>
                <option value="11" ${this.quizFilterGrade === '11' ? 'selected' : ''}>ថ្នាក់ទី១១ (Grade 11)</option>
                <option value="10" ${this.quizFilterGrade === '10' ? 'selected' : ''}>ថ្នាក់ទី១០ (Grade 10)</option>
              </select>
            </div>

            <!-- Class Filter -->
            <div>
              <select class="form-select" id="quiz-filter-class">
                <option value="all" ${this.quizFilterClass === 'all' ? 'selected' : ''}>គ្រប់ថ្នាក់រៀន</option>
                <option value="class-12a" ${this.quizFilterClass === 'class-12a' ? 'selected' : ''}>ថ្នាក់ទី១២A</option>
                <option value="class-11b" ${this.quizFilterClass === 'class-11b' ? 'selected' : ''}>ថ្នាក់ទី១១B</option>
                <option value="class-10c" ${this.quizFilterClass === 'class-10c' ? 'selected' : ''}>ថ្នាក់ទី១០C</option>
              </select>
            </div>

            <!-- Status Filter -->
            <div>
              <select class="form-select" id="quiz-filter-status">
                <option value="all" ${this.quizFilterStatus === 'all' ? 'selected' : ''}>គ្រប់ស្ថានភាព</option>
                <option value="published" ${this.quizFilterStatus === 'published' ? 'selected' : ''}>បានផ្សព្វផ្សាយ</option>
                <option value="draft" ${this.quizFilterStatus === 'draft' ? 'selected' : ''}>សេចក្តីព្រាង</option>
              </select>
            </div>

            <!-- Sort By -->
            <div>
              <select class="form-select" id="quiz-sort-by">
                <option value="newest" ${this.quizSortBy === 'newest' ? 'selected' : ''}>ថ្មីបំផុត (Newest)</option>
                <option value="oldest" ${this.quizSortBy === 'oldest' ? 'selected' : ''}>ចាស់បំផុត (Oldest)</option>
                <option value="title" ${this.quizSortBy === 'title' ? 'selected' : ''}>ចំណងជើង A-Z</option>
                <option value="points" ${this.quizSortBy === 'points' ? 'selected' : ''}>ពិន្ទុច្រើន-តិច</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Quizzes Grid -->
        ${filteredQuizzes.length === 0 ? `
          <div class="card" style="text-align: center; padding: 3.5rem; color: var(--text-muted);">
            <i data-lucide="inbox" style="width: 48px; height: 48px; color: var(--text-dim); margin-bottom: 1rem;"></i>
            <h3 style="font-size: 1.15rem; color: var(--text-secondary); margin-bottom: 0.5rem;">រកមិនឃើញកម្រងតេស្តឡើយ</h3>
            <p style="font-size: 0.9rem; max-width: 450px; margin: 0 auto 1.5rem auto;">
              មិនទាន់មានតេស្តដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកនេះទេ។ លោកអ្នកអាចបង្កើតតេស្តថ្មី ឬបង្កើតតាម AI។
            </p>
            <button class="btn btn-primary" id="btn-create-empty-state">
              <i data-lucide="plus-circle"></i> បង្កើតកម្រងតេស្តថ្មី
            </button>
          </div>
        ` : `
          <div class="content-grid-3">
            ${filteredQuizzes.map(q => {
              const diffCounts = q.difficultyCounts || {
                easy: (q.questions || []).filter(item => item.difficulty === 'easy').length,
                medium: (q.questions || []).filter(item => item.difficulty === 'medium' || !item.difficulty).length,
                hard: (q.questions || []).filter(item => item.difficulty === 'hard').length
              };

              const qCount = (q.questions || []).length;
              const pts = q.totalPoints || (q.questions || []).reduce((acc, item) => acc + (parseFloat(item.points) || 1), 0);

              return `
                <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; position: relative;">
                  <div>
                    <!-- Status & Grade Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                      <span class="status-pill ${q.isPublished ? 'status-published' : 'status-draft'}">
                        ${q.isPublished ? '● បានផ្សព្វផ្សាយ' : '○ សេចក្តីព្រាង'}
                      </span>
                      <div style="display: flex; gap: 0.4rem; align-items: center;">
                        <span style="font-size: 0.75rem; background: rgba(99,102,241,0.15); color: var(--primary-light); padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 600;">
                          ${q.grade ? 'ថ្នាក់ទី ' + q.grade : (q.classId === 'class-12a' ? 'ថ្នាក់ទី១២' : 'ថ្នាក់ទី១១')}
                        </span>
                        <span style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-math);">
                          ⏱️ ${q.timeLimitMinutes || 30} នាទី
                        </span>
                      </div>
                    </div>

                    <!-- Title & Description -->
                    <h3 style="font-size: 1.05rem; font-weight: 600; color: #fff; margin-bottom: 0.5rem; line-height: 1.4;">
                      ${q.title}
                    </h3>
                    <p style="font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      ${q.description || 'គ្មានសេចក្តីពិពណ៌នា'}
                    </p>

                    <!-- Difficulty Breakdown Badges -->
                    <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.85rem;">
                      <span class="badge-difficulty badge-easy">🟢 ងាយ: ${diffCounts.easy}</span>
                      <span class="badge-difficulty badge-medium">🟡 មធ្យម: ${diffCounts.medium}</span>
                      <span class="badge-difficulty badge-hard">🔴 ពិបាក: ${diffCounts.hard}</span>
                    </div>

                    <!-- Question Metrics -->
                    <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; margin-bottom: 1rem;">
                      <div><i data-lucide="help-circle" style="width: 14px; height: 14px; vertical-align: middle;"></i> <b>${qCount}</b> សំណួរ</div>
                      <div><i data-lucide="award" style="width: 14px; height: 14px; vertical-align: middle;"></i> <b>${pts}</b> ពិន្ទុ</div>
                      <div><i data-lucide="refresh-cw" style="width: 14px; height: 14px; vertical-align: middle;"></i> <b>${q.maxAttempts || 1}</b> ដង</div>
                    </div>
                  </div>

                  <!-- Action Controls -->
                  <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                    <!-- Row 1: Preview, Edit, Print -->
                    <div style="display: flex; gap: 0.4rem; margin-bottom: 0.4rem;">
                      <button class="btn btn-secondary btn-sm btn-preview-quiz" data-qid="${q.id}" style="flex: 1;" title="មើលសំណួរ និងរូបមន្ត KaTeX">
                        <i data-lucide="eye"></i> មើល
                      </button>
                      <button class="btn btn-secondary btn-sm btn-edit-quiz" data-qid="${q.id}" style="flex: 1;" title="កែសម្រួលតេស្ត">
                        <i data-lucide="edit-3"></i> កែប្រែ
                      </button>
                      <button class="btn btn-secondary btn-sm btn-print-quiz" data-qid="${q.id}" style="flex: 1;" title="បោះពុម្ព ឬនាំចេញជាក្រដាសប្រឡង">
                        <i data-lucide="printer"></i> បោះពុម្ព
                      </button>
                    </div>

                    <!-- Row 2: Duplicate, Toggle Publish, Grade, Delete -->
                    <div style="display: flex; gap: 0.4rem;">
                      <button class="btn btn-secondary btn-sm btn-toggle-publish" data-qid="${q.id}" style="flex: 1; font-size: 0.78rem;" title="${q.isPublished ? 'ប្តូរទៅជាសេចក្តីព្រាង' : 'បោះពុម្ពផ្សាយដល់សិស្ស'}">
                        <i data-lucide="${q.isPublished ? 'eye-off' : 'globe'}"></i> ${q.isPublished ? 'លាក់' : 'ផ្សាយ'}
                      </button>
                      <button class="btn btn-secondary btn-sm btn-duplicate-quiz" data-qid="${q.id}" title="ចម្លងតេស្តនេះទៅជាថ្មី">
                        <i data-lucide="copy"></i>
                      </button>
                      <button class="btn btn-secondary btn-sm btn-grade-quiz" data-qid="${q.id}" title="លទ្ធផល និងកែពិន្ទុ">
                        <i data-lucide="bar-chart-2"></i>
                      </button>
                      <button class="btn btn-danger btn-sm btn-delete-quiz" data-qid="${q.id}" title="លុបតេស្ត">
                        <i data-lucide="trash-2"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.attachQuizManagerEvents(container);
  }

  attachQuizManagerEvents(container) {
    // Toolbar search and filters
    const searchInput = document.getElementById('quiz-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.quizSearchQuery = e.target.value.trim();
        this.renderQuizManager(container);
      };
    }

    const gradeSelect = document.getElementById('quiz-filter-grade');
    if (gradeSelect) {
      gradeSelect.onchange = (e) => {
        this.quizFilterGrade = e.target.value;
        this.renderQuizManager(container);
      };
    }

    const classSelect = document.getElementById('quiz-filter-class');
    if (classSelect) {
      classSelect.onchange = (e) => {
        this.quizFilterClass = e.target.value;
        this.renderQuizManager(container);
      };
    }

    const statusSelect = document.getElementById('quiz-filter-status');
    if (statusSelect) {
      statusSelect.onchange = (e) => {
        this.quizFilterStatus = e.target.value;
        this.renderQuizManager(container);
      };
    }

    const sortSelect = document.getElementById('quiz-sort-by');
    if (sortSelect) {
      sortSelect.onchange = (e) => {
        this.quizSortBy = e.target.value;
        this.renderQuizManager(container);
      };
    }

    // Action buttons
    const createBtn = document.getElementById('btn-create-new-quiz');
    if (createBtn) createBtn.onclick = () => this.showCreateQuizModal();

    const emptyCreateBtn = document.getElementById('btn-create-empty-state');
    if (emptyCreateBtn) emptyCreateBtn.onclick = () => this.showCreateQuizModal();

    const aiBtn = document.getElementById('btn-open-ai-studio');
    if (aiBtn) aiBtn.onclick = () => window.app.navigate('ai-studio');

    // Preview Quiz
    container.querySelectorAll('.btn-preview-quiz').forEach(btn => {
      btn.onclick = () => this.showPreviewQuizQuestions(btn.dataset.qid);
    });

    // Edit Quiz
    container.querySelectorAll('.btn-edit-quiz').forEach(btn => {
      btn.onclick = () => this.showEditQuizModal(btn.dataset.qid);
    });

    // Print / Export Quiz
    container.querySelectorAll('.btn-print-quiz').forEach(btn => {
      btn.onclick = () => this.showPrintableExamModal(btn.dataset.qid);
    });

    // Toggle Publish Status
    container.querySelectorAll('.btn-toggle-publish').forEach(btn => {
      btn.onclick = async () => {
        try {
          const updated = await window.db.togglePublishQuiz(btn.dataset.qid);
          window.app.showToast(updated.isPublished ? 'បានបោះពុម្ពផ្សាយតេស្តសម្រាប់សិស្ស!' : 'បានកំណត់តេស្តជាសេចក្តីព្រាង!', 'success');
          this.renderQuizManager(container);
        } catch (err) {
          window.app.showToast('កំហុស៖ ' + err.message, 'error');
        }
      };
    });

    // Duplicate Quiz
    container.querySelectorAll('.btn-duplicate-quiz').forEach(btn => {
      btn.onclick = async () => {
        try {
          const cloned = await window.db.duplicateQuiz(btn.dataset.qid);
          window.app.showToast(`🎉 បានចម្លងតេស្ត «${cloned.title}» ដោយជោគជ័យ!`, 'success');
          this.renderQuizManager(container);
        } catch (err) {
          window.app.showToast('កំហុសពេលចម្លងតេស្ត៖ ' + err.message, 'error');
        }
      };
    });

    // Grade / Results
    container.querySelectorAll('.btn-grade-quiz').forEach(btn => {
      btn.onclick = () => {
        window.analyticsController.selectedQuizId = btn.dataset.qid;
        window.app.navigate('teacher-grading');
      };
    });

    // Delete Quiz
    container.querySelectorAll('.btn-delete-quiz').forEach(btn => {
      btn.onclick = async () => {
        if (confirm('តើលោកអ្នកពិតជាចង់លុបកម្រងតេស្តនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានឡើយ។')) {
          try {
            await window.db.deleteQuiz(btn.dataset.qid);
            window.app.showToast('បានលុបកម្រងតេស្តចេញពី Database រួចរាល់!', 'success');
            this.renderQuizManager(container);
          } catch (err) {
            window.app.showToast('កំហុសពេលលុបតេស្ត៖ ' + err.message, 'error');
          }
        }
      };
    });
  }

  showCreateQuizModal(initialData = null) {
    const isEdit = !!initialData;
    const quiz = initialData || {
      title: '',
      description: '',
      grade: 12,
      classId: 'class-12a',
      timeLimitMinutes: 30,
      maxAttempts: 1,
      passPercentage: 60,
      shuffleQuestions: false,
      showSolutionOnSubmit: true,
      isPublished: true,
      questions: [
        {
          id: 'q-' + Date.now(),
          number: 1,
          type: 'mcq',
          difficulty: 'medium',
          points: 5,
          promptKm: 'គណនាតម្លៃនៃចំនួនកុំផ្លិច $z = (2 + 3i)(1 - 2i)$៖',
          mathFormula: 'z = (2 + 3i)(1 - 2i)',
          options: [
            { id: 'A', text: '$z = 8 - i$' },
            { id: 'B', text: '$z = 4 - i$' },
            { id: 'C', text: '$z = 8 + i$' },
            { id: 'D', text: '$z = -4 - 7i$' }
          ],
          correctOption: 'A',
          explanationKm: 'ពន្លាតតាមច្បាប់ចែកចាយ៖ $z = 2 - 4i + 3i - 6i^2 = 8 - i$។'
        }
      ]
    };

    window.app.openModal({
      title: isEdit ? `កែសម្រួលកម្រងតេស្ត៖ ${quiz.title}` : 'បង្កើតកម្រងតេស្តគណិតវិទ្យាថ្មី',
      bodyHtml: `
        <form id="form-manage-quiz">
          <!-- Title -->
          <div class="form-group">
            <label class="form-label">ចំណងជើងកម្រងតេស្ត *</label>
            <input type="text" class="form-control" id="mq-title" value="${quiz.title}" placeholder="ឧ. តេស្តប្រចាំខែ៖ ចំនួនកុំផ្លិច និងអាំងតេក្រាល" required />
          </div>

          <!-- Grade, Class, Time, Attempts -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">កម្រិតថ្នាក់</label>
              <select class="form-select" id="mq-grade">
                <option value="12" ${quiz.grade == 12 ? 'selected' : ''}>ថ្នាក់ទី១២</option>
                <option value="11" ${quiz.grade == 11 ? 'selected' : ''}>ថ្នាក់ទី១១</option>
                <option value="10" ${quiz.grade == 10 ? 'selected' : ''}>ថ្នាក់ទី១០</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">ថ្នាក់រៀន</label>
              <select class="form-select" id="mq-class">
                <option value="all" ${quiz.classId === 'all' ? 'selected' : ''}>គ្រប់ថ្នាក់</option>
                <option value="class-12a" ${quiz.classId === 'class-12a' ? 'selected' : ''}>ថ្នាក់ទី១២A</option>
                <option value="class-11b" ${quiz.classId === 'class-11b' ? 'selected' : ''}>ថ្នាក់ទី១១B</option>
                <option value="class-10c" ${quiz.classId === 'class-10c' ? 'selected' : ''}>ថ្នាក់ទី១០C</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">រយៈពេល (នាទី)</label>
              <input type="number" class="form-control" id="mq-time" value="${quiz.timeLimitMinutes || 30}" min="5" max="180" required />
            </div>
            <div class="form-group">
              <label class="form-label">ចំនួនដងអនុញ្ញាត</label>
              <input type="number" class="form-control" id="mq-attempts" value="${quiz.maxAttempts || 1}" min="1" max="10" required />
            </div>
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label">សេចក្ដីពិពណ៌នា ឬការណែនាំ</label>
            <textarea class="form-textarea" id="mq-desc" rows="2" placeholder="សេចក្តីណែនាំដល់សិស្ស...">${quiz.description || ''}</textarea>
          </div>

          <!-- Options Checkboxes -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: var(--text-secondary); cursor: pointer;">
              <input type="checkbox" id="mq-published" ${quiz.isPublished ? 'checked' : ''} /> បោះពុម្ពផ្សាយភ្លាមៗ
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: var(--text-secondary); cursor: pointer;">
              <input type="checkbox" id="mq-shuffle" ${quiz.shuffleQuestions ? 'checked' : ''} /> ច្របល់សំណួរ
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: var(--text-secondary); cursor: pointer;">
              <input type="checkbox" id="mq-show-sol" ${quiz.showSolutionOnSubmit !== false ? 'checked' : ''} /> បង្ហាញដំណោះស្រាយ
            </label>
          </div>

          <!-- SECTION: DIFFICULTY MATRIX (កំណត់ចំនួនសំណួរតាមកម្រិត) -->
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">
                <i data-lucide="layers" style="width: 16px; height: 16px; vertical-align: middle; color: var(--primary-light);"></i> កម្រិតសំណួរចម្រុះ
              </span>
              <span class="status-pill status-active" id="mq-total-q-badge">
                សំណួរសរុប៖ ${(quiz.questions || []).length} សំណួរ
              </span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
              <div>
                <label class="form-label" style="color: #34d399; font-size: 0.82rem;">🟢 ងាយ</label>
                <input type="number" class="form-control" id="mq-diff-easy" value="${(quiz.difficultyCounts && quiz.difficultyCounts.easy !== undefined) ? quiz.difficultyCounts.easy : (quiz.questions || []).filter(q => q.difficulty === 'easy').length}" min="0" />
              </div>
              <div>
                <label class="form-label" style="color: #fbbf24; font-size: 0.82rem;">🟡 មធ្យម</label>
                <input type="number" class="form-control" id="mq-diff-medium" value="${(quiz.difficultyCounts && quiz.difficultyCounts.medium !== undefined) ? quiz.difficultyCounts.medium : (quiz.questions || []).filter(q => q.difficulty === 'medium' || !q.difficulty).length}" min="0" />
              </div>
              <div>
                <label class="form-label" style="color: #fb7185; font-size: 0.82rem;">🔴 ពិបាក</label>
                <input type="number" class="form-control" id="mq-diff-hard" value="${(quiz.difficultyCounts && quiz.difficultyCounts.hard !== undefined) ? quiz.difficultyCounts.hard : (quiz.questions || []).filter(q => q.difficulty === 'hard').length}" min="0" />
              </div>
            </div>
          </div>

          <!-- Questions List Section -->
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <h4 style="font-size: 1rem; font-weight: 600; color: #fff;">បញ្ជីសំណួរ (${(quiz.questions || []).length} សំណួរ)</h4>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-add-modal-q">
                <i data-lucide="plus"></i> បន្ថែមសំណួរ
              </button>
            </div>
            
            <div id="modal-questions-builder" style="display: flex; flex-direction: column; gap: 1rem; max-height: 400px; overflow-y: auto; padding-right: 0.5rem;">
              <!-- Questions injected here -->
            </div>
          </div>
        </form>
      `,
      confirmText: isEdit ? 'រក្សាទុកការកែប្រែ' : 'បង្កើត និងរក្សាទុកតេស្ត',
      onConfirm: async () => {
        const title = document.getElementById('mq-title').value.trim();
        const grade = parseInt(document.getElementById('mq-grade').value, 10) || 12;
        const classId = document.getElementById('mq-class').value;
        const timeLimit = parseInt(document.getElementById('mq-time').value, 10) || 30;
        const attempts = parseInt(document.getElementById('mq-attempts').value, 10) || 1;
        const desc = document.getElementById('mq-desc').value.trim();
        const isPublished = document.getElementById('mq-published').checked;
        const shuffle = document.getElementById('mq-shuffle').checked;
        const showSol = document.getElementById('mq-show-sol').checked;

        const easyCount = parseInt(document.getElementById('mq-diff-easy').value, 10) || 0;
        const medCount = parseInt(document.getElementById('mq-diff-medium').value, 10) || 0;
        const hardCount = parseInt(document.getElementById('mq-diff-hard').value, 10) || 0;

        if (!title) {
          window.app.showToast('សូមបញ្ចូលចំណងជើងតេស្ត!', 'error');
          return false;
        }

        if (this._workingModalQuestions.length === 0) {
          window.app.showToast('សូមបញ្ចូលយ៉ាងហោចណាស់ ១ សំណួរ!', 'error');
          return false;
        }

        const quizPayload = {
          title,
          description: desc,
          grade,
          classId,
          timeLimitMinutes: timeLimit,
          maxAttempts: attempts,
          shuffleQuestions: shuffle,
          showSolutionOnSubmit: showSol,
          isPublished,
          difficultyCounts: { easy: easyCount, medium: medCount, hard: hardCount },
          questions: this._workingModalQuestions
        };

        try {
          if (isEdit) {
            // Update existing quiz without duplicating
            await window.db.updateQuiz(quiz.id, quizPayload);
            window.app.showToast('🎉 បានកែសម្រួលកម្រងតេស្តរួចរាល់ដោយជោគជ័យ!', 'success');
          } else {
            // Create new quiz
            await window.db.createQuiz(quizPayload);
            window.app.showToast('🎉 បានបង្កើត និងរក្សាទុកកម្រងតេស្តថ្មីដោយជោគជ័យ!', 'success');
          }

          this.renderQuizManager(document.getElementById('view-container'));
          return true;
        } catch (err) {
          console.error('Quiz save error:', err);
          window.app.showToast('កំហុសពេលរក្សាទុក៖ ' + err.message, 'error');
          return false;
        }
      }
    });

    // Populate working questions
    this._workingModalQuestions = JSON.parse(JSON.stringify(quiz.questions || []));
    this.renderModalQuestionsBuilder();

    // Attach Add Question event
    const addQBtn = document.getElementById('btn-add-modal-q');
    if (addQBtn) {
      addQBtn.onclick = () => {
        const num = this._workingModalQuestions.length + 1;
        this._workingModalQuestions.push({
          id: 'q-' + Date.now() + '-' + num,
          number: num,
          type: 'mcq',
          difficulty: 'medium',
          points: 5,
          promptKm: `សំណួរទី ${num}៖ ...`,
          mathFormula: '',
          options: [
            { id: 'A', text: 'ចម្លើយត្រឹមត្រូវ' },
            { id: 'B', text: 'ចម្លើយខុសទី ១' },
            { id: 'C', text: 'ចម្លើយខុសទី ២' },
            { id: 'D', text: 'ចម្លើយខុសទី ៣' }
          ],
          correctOption: 'A',
          explanationKm: 'ដំណោះស្រាយលម្អិត...'
        });
        this.renderModalQuestionsBuilder();
      };
    }

    if (window.lucide) window.lucide.createIcons();
  }

  renderModalQuestionsBuilder() {
    const container = document.getElementById('modal-questions-builder');
    if (!container) return;

    container.innerHTML = this._workingModalQuestions.map((q, idx) => `
      <div class="card" style="background: rgba(12, 16, 33, 0.7); padding: 1rem; border: 1px solid var(--border-subtle);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="status-pill status-active">សំណួរទី ${idx + 1}</span>
            <select class="form-select form-select-sm mq-q-diff" data-idx="${idx}" style="width: auto; padding: 0.2rem 0.5rem; font-size: 0.78rem;">
              <option value="easy" ${q.difficulty === 'easy' ? 'selected' : ''}>🟢 ងាយ</option>
              <option value="medium" ${q.difficulty === 'medium' || !q.difficulty ? 'selected' : ''}>🟡 មធ្យម</option>
              <option value="hard" ${q.difficulty === 'hard' ? 'selected' : ''}>🔴 ពិបាក</option>
            </select>
            <input type="number" class="form-control form-control-sm mq-q-points" data-idx="${idx}" value="${q.points || 5}" min="1" max="50" style="width: 70px; padding: 0.2rem 0.5rem;" title="ពិន្ទុ" />
          </div>
          <button type="button" class="btn btn-danger btn-sm btn-delete-modal-q" data-idx="${idx}" style="padding: 0.2rem 0.5rem;">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>

        <div class="form-group" style="margin-bottom: 0.5rem;">
          <input type="text" class="form-control mq-q-prompt" data-idx="${idx}" value="${q.promptKm || ''}" placeholder="ប្រធានសំណួរ (Khmer)..." />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
          <input type="text" class="form-control mq-q-math" data-idx="${idx}" value="${q.mathFormula || ''}" placeholder="រូបមន្ត KaTeX (ឧ. \\int_0^1 x^2 dx)" />
          <input type="text" class="form-control mq-q-correct" data-idx="${idx}" value="${q.correctOption || ''}" placeholder="ចម្លើយត្រឹមត្រូវ (A, B, តម្លៃ...)" />
        </div>

        <textarea class="form-textarea mq-q-explanation" data-idx="${idx}" rows="2" placeholder="ដំណោះស្រាយលម្អិត...">${q.explanationKm || ''}</textarea>
      </div>
    `).join('');

    // Update live total badge
    const badge = document.getElementById('mq-total-q-badge');
    if (badge) badge.innerText = `សំណួរសរុប៖ ${this._workingModalQuestions.length} សំណួរ`;

    // Attach listeners
    container.querySelectorAll('.mq-q-diff').forEach(el => {
      el.onchange = () => { this._workingModalQuestions[el.dataset.idx].difficulty = el.value; };
    });
    container.querySelectorAll('.mq-q-points').forEach(el => {
      el.onchange = () => { this._workingModalQuestions[el.dataset.idx].points = parseFloat(el.value) || 5; };
    });
    container.querySelectorAll('.mq-q-prompt').forEach(el => {
      el.oninput = () => { this._workingModalQuestions[el.dataset.idx].promptKm = el.value; };
    });
    container.querySelectorAll('.mq-q-math').forEach(el => {
      el.oninput = () => { this._workingModalQuestions[el.dataset.idx].mathFormula = el.value; };
    });
    container.querySelectorAll('.mq-q-correct').forEach(el => {
      el.oninput = () => { this._workingModalQuestions[el.dataset.idx].correctOption = el.value; };
    });
    container.querySelectorAll('.mq-q-explanation').forEach(el => {
      el.oninput = () => { this._workingModalQuestions[el.dataset.idx].explanationKm = el.value; };
    });
    container.querySelectorAll('.btn-delete-modal-q').forEach(btn => {
      btn.onclick = () => {
        this._workingModalQuestions.splice(parseInt(btn.dataset.idx, 10), 1);
        this.renderModalQuestionsBuilder();
      };
    });

    if (window.lucide) window.lucide.createIcons();
  }

  async showEditQuizModal(quizId) {
    const quiz = await window.db.getQuizById(quizId, 'teacher');
    if (!quiz) {
      window.app.showToast('រកមិនឃើញកម្រងតេស្តទេ', 'error');
      return;
    }
    this.showCreateQuizModal(quiz);
  }

  showPreviewQuizQuestions(quizId) {
    window.db.getQuizById(quizId, 'teacher').then(quiz => {
      if (!quiz) return;
      window.app.openModal({
        title: quiz.title + ' (មើលសំណួរទាំងអស់)',
        bodyHtml: `
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${(quiz.questions || []).map((q, idx) => `
              <div class="card" style="background: rgba(12, 16, 33, 0.7); padding: 1.25rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="status-pill status-active">សំណួរទី ${idx + 1}</span>
                    <span class="badge-difficulty ${q.difficulty === 'easy' ? 'badge-easy' : (q.difficulty === 'hard' ? 'badge-hard' : 'badge-medium')}">
                      ${q.difficulty === 'easy' ? '🟢 ងាយ' : (q.difficulty === 'hard' ? '🔴 ពិបាក' : '🟡 មធ្យម')}
                    </span>
                    <span style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase;">${q.type || 'MCQ'}</span>
                  </div>
                  <span style="font-family: var(--font-math); color: var(--primary-light); font-weight: 600;">${q.points || 5} ពិន្ទុ</span>
                </div>

                <div style="font-size: 1rem; color: #fff; margin-bottom: 0.5rem; line-height: 1.6;">${q.promptKm}</div>

                ${q.image ? `
                  <div style="margin: 0.75rem 0; text-align: center;">
                    <img src="${q.image}" style="max-height: 220px; border-radius: 8px; border: 1px solid var(--border-subtle);" alt="Question Diagram" />
                  </div>
                ` : ''}

                ${q.mathFormula ? `<div style="text-align: center; margin: 0.75rem 0; color: var(--primary-light);">$$${q.mathFormula}$$</div>` : ''}

                ${(q.options && q.options.length > 0) ? `
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.75rem;">
                    ${q.options.map(opt => `
                      <div style="padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid ${opt.id === q.correctOption ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-subtle)'}; background: ${opt.id === q.correctOption ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.02)'}; font-size: 0.85rem;">
                        <b>${opt.id}.</b> ${opt.text || opt.math || ''}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <div style="font-size: 0.85rem; color: #34d399; font-weight: 600; margin-bottom: 0.4rem;">
                  ចម្លើយត្រឹមត្រូវ៖ ${q.correctOption}
                </div>
                <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.6; white-space: pre-line; background: rgba(99, 102, 241, 0.05); padding: 0.6rem; border-radius: 6px;">
                  <b>ដំណោះស្រាយ៖</b><br/>${q.explanationKm}
                </div>
              </div>
            `).join('')}
          </div>
        `,
        confirmText: 'បិទ',
        onConfirm: async () => true
      });

      setTimeout(() => {
        window.quizService.renderMath(document.querySelector('.modal-body'));
      }, 50);
    });
  }

  showPrintableExamModal(quizId) {
    window.db.getQuizById(quizId, 'teacher').then(quiz => {
      if (!quiz) return;
      const pts = quiz.totalPoints || (quiz.questions || []).reduce((acc, q) => acc + (parseFloat(q.points) || 1), 0);

      window.app.openModal({
        title: 'នាំចេញ និងបោះពុម្ពវិញ្ញាសាគណិតវិទ្យា',
        bodyHtml: `
          <div style="margin-bottom: 1rem; text-align: right;">
            <button class="btn btn-primary" id="btn-trigger-print">
              <i data-lucide="printer"></i> បោះពុម្ពលើក្រដាស (Print / Save PDF)
            </button>
          </div>

          <!-- Official Printable Sheet -->
          <div class="printable-exam-paper">
            <div class="printable-exam-header">
              <div style="font-size: 1.15rem; font-weight: 700; letter-spacing: 0.05em;">ព្រះរាជាណាចក្រកម្ពុជា</div>
              <div style="font-size: 1.05rem; font-weight: 600;">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
              <div style="margin-top: 0.75rem; font-size: 0.95rem; font-weight: 600; color: #475569;">
                វិទ្យាល័យព្រះស៊ីសុវត្ថិ • ក្រសួងអប់រំ យុវជន និងកីឡា
              </div>
              <div class="printable-exam-title">
                វិញ្ញាសាតេស្ត៖ ${quiz.title}
              </div>
              <div class="printable-exam-meta">
                <span>ថ្នាក់ទី៖ ${quiz.grade || 12}</span>
                <span>មុខវិជ្ជា៖ ${quiz.subject || 'គណិតវិទ្យា'}</span>
                <span>រយៈពេល៖ ${quiz.timeLimitMinutes || 30} នាទី</span>
                <span>ពិន្ទុសរុប៖ ${pts} ពិន្ទុ</span>
              </div>
            </div>

            <!-- Student Name Box -->
            <div class="printable-student-box">
              <div>
                <div>ឈ្មោះសិស្ស៖ ..........................................................................</div>
                <div style="margin-top: 0.5rem;">ថ្ងៃខែឆ្នាំកំណើត៖ .................................... ថ្នាក់៖ .................</div>
              </div>
              <div style="border-left: 1px solid #cbd5e1; padding-left: 1rem; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="font-weight: 700; color: #64748b; font-size: 0.8rem;">ពិន្ទុទទួលបាន</div>
                <div style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin-top: 0.25rem;">....../${pts}</div>
              </div>
            </div>

            <!-- Questions -->
            <div class="printable-questions-list">
              ${(quiz.questions || []).map((q, idx) => `
                <div class="printable-question-item">
                  <div class="printable-question-num">
                    សំណួរទី ${idx + 1} (${q.points || 5} ពិន្ទុ) [${q.difficulty === 'easy' ? 'ងាយ' : (q.difficulty === 'hard' ? 'ពិបាក' : 'មធ្យម')}]៖
                  </div>
                  <div style="font-size: 1rem; color: #1e293b; margin-bottom: 0.5rem;">
                    ${q.promptKm}
                  </div>

                  ${q.image ? `
                    <div style="text-align: center; margin: 0.75rem 0;">
                      <img src="${q.image}" style="max-height: 200px;" alt="Question Diagram" />
                    </div>
                  ` : ''}

                  ${q.mathFormula ? `
                    <div style="text-align: center; margin: 0.75rem 0; font-size: 1.1rem;">
                      $$${q.mathFormula}$$
                    </div>
                  ` : ''}

                  ${(q.options && q.options.length > 0) ? `
                    <div class="printable-options-grid">
                      ${q.options.map(opt => `
                        <div><b>${opt.id}.</b> ${opt.text || opt.math || ''}</div>
                      `).join('')}
                    </div>
                  ` : `
                    <div style="height: 60px; border-bottom: 1px dotted #94a3b8; margin-top: 1rem;">
                      <span style="font-size: 0.85rem; color: #64748b;">ចម្លើយ៖</span>
                    </div>
                  `}
                </div>
              `).join('')}
            </div>
          </div>
        `,
        confirmText: 'បិទ',
        onConfirm: async () => true
      });

      setTimeout(() => {
        window.quizService.renderMath(document.querySelector('.printable-exam-paper'));
        const printBtn = document.getElementById('btn-trigger-print');
        if (printBtn) {
          printBtn.onclick = () => window.print();
        }
      }, 50);
    });
  }
}

// Global Teacher Controller instance
window.teacherController = new TeacherController();

