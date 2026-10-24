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
  // QUIZ AUTHORING INTERFACE
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

    const quizzes = await window.db.getQuizzes(this.selectedClassId, 'teacher');

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700;">ប្រព័ន្ធបង្កើត និងគ្រប់គ្រងតេស្ត</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">បង្កើតសំណួរគណិតវិទ្យា ជ្រើសរើសចម្លើយ ពិត/មិនពិត និងសំណួរឆ្លើយខ្លី</p>
        </div>
        <button class="btn btn-primary" id="btn-create-new-quiz">
          <i data-lucide="plus-circle"></i> បង្កើតកម្រងតេស្តថ្មី
        </button>
      </div>

      <!-- Quizzes Grid -->
      <div class="content-grid-3">
        ${quizzes.map(q => `
          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span class="status-pill ${q.isPublished ? 'status-published' : 'status-hidden'}">
                  ${q.isPublished ? 'បានផ្សព្វផ្សាយ' : 'ព្រាង'}
                </span>
                <span style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-math);">
                  ${q.timeLimitMinutes} នាទី
                </span>
              </div>

              <h3 style="font-size: 1.1rem; font-weight: 600; color: #fff; margin-bottom: 0.5rem; line-height: 1.4;">
                ${q.title}
              </h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5;">
                ${q.description || ''}
              </p>

              <div style="display: flex; gap: 1rem; font-size: 0.82rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; margin-bottom: 1.25rem;">
                <div><i data-lucide="help-circle" style="width: 14px; height: 14px; vertical-align: middle;"></i> <b>${(q.questions || []).length}</b> សំណួរ</div>
                <div><i data-lucide="award" style="width: 14px; height: 14px; vertical-align: middle;"></i> <b>${q.totalPoints || 0}</b> ពិន្ទុ</div>
                <div><i data-lucide="refresh-cw" style="width: 14px; height: 14px; vertical-align: middle;"></i> <b>${q.maxAttempts || 1}</b> ដង</div>
              </div>
            </div>

            <!-- Quiz Actions -->
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-secondary btn-sm btn-preview-quiz" data-qid="${q.id}" style="flex: 1;">
                <i data-lucide="eye"></i> មើលសំណួរ
              </button>
              <button class="btn btn-secondary btn-sm btn-grade-quiz" data-qid="${q.id}" style="flex: 1;" title="កែពិន្ទុ និងមើលស្ថិតិ">
                <i data-lucide="bar-chart-2"></i> លទ្ធផល
              </button>
              <button class="btn btn-danger btn-sm btn-delete-quiz" data-qid="${q.id}">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Create New Quiz button
    const createBtn = document.getElementById('btn-create-new-quiz');
    if (createBtn) {
      createBtn.onclick = () => this.showCreateQuizModal();
    }

    // Preview Quiz button
    container.querySelectorAll('.btn-preview-quiz').forEach(btn => {
      btn.onclick = () => this.showPreviewQuizQuestions(btn.dataset.qid);
    });

    // View Results / Grading
    container.querySelectorAll('.btn-grade-quiz').forEach(btn => {
      btn.onclick = () => {
        window.analyticsController.selectedQuizId = btn.dataset.qid;
        window.app.navigate('teacher-grading');
      };
    });

    // Delete Quiz
    container.querySelectorAll('.btn-delete-quiz').forEach(btn => {
      btn.onclick = async () => {
        if (confirm('តើអ្នកពិតជាចង់លុបកម្រងតេស្តនេះមែនទេ?')) {
          await window.db.deleteQuiz(btn.dataset.qid);
          window.app.showToast('បានលុបកម្រងតេស្តរួចរាល់', 'success');
          window.app.renderCurrentView();
        }
      };
    });
  }

  showCreateQuizModal() {
    window.app.openModal({
      title: 'បង្កើតកម្រងតេស្តគណិតវិទ្យា',
      bodyHtml: `
        <form id="form-create-quiz">
          <div class="form-group">
            <label class="form-label">ចំណងជើងតេស្ត *</label>
            <input type="text" class="form-control" id="quiz-title-input" placeholder="ឧ. តេស្តប្រចាំខែ៖ ចំនួនកុំផ្លិច និងអាំងតេក្រាល" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">រយៈពេលធ្វើតេស្ត (នាទី) *</label>
              <input type="number" class="form-control" id="quiz-time-input" value="30" min="5" max="180" required />
            </div>
            <div class="form-group">
              <label class="form-label">ចំនួនដងអនុញ្ញាត (Attempts) *</label>
              <input type="number" class="form-control" id="quiz-attempts-input" value="1" min="1" max="10" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">សេចក្ដីពិពណ៌នា ឬការណែនាំដល់សិស្ស</label>
            <textarea class="form-textarea" id="quiz-desc-input" placeholder="សេចក្តីណែនាំ និងការដាក់ពិន្ទុ..."></textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: var(--text-secondary); cursor: pointer;">
              <input type="checkbox" id="quiz-shuffle-q" /> ច្របល់លំដាប់សំណួរ (Shuffle Questions)
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: var(--text-secondary); cursor: pointer;">
              <input type="checkbox" id="quiz-show-sol" checked /> បង្ហាញដំណោះស្រាយក្រោយបញ្ជូន
            </label>
          </div>

          <!-- Question Builder Sub-Section -->
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <h4 style="font-size: 1rem; font-weight: 600; color: #fff;">សំណួរគំរូដំបូង</h4>
              <span class="status-pill status-active">សំណួរទី ១</span>
            </div>

            <div class="form-group">
              <label class="form-label">ប្រភេទសំណួរ</label>
              <select class="form-select" id="new-q-type">
                <option value="mcq">ជ្រើសរើសចម្លើយត្រឹមត្រូវ (Multiple Choice)</option>
                <option value="true_false">ពិត ឬមិនពិត (True / False)</option>
                <option value="short_answer">ឆ្លើយខ្លី (Short Answer)</option>
                <option value="open_response">ដោះស្រាយលម្អិត (Open Response / Manual Grade)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">ប្រធានសំណួរ (Khmer) *</label>
              <textarea class="form-textarea" id="new-q-prompt" placeholder="សរសេរសំណួរនៅទីនេះ..." required></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">រូបមន្តគណិតវិទ្យា KaTeX (បើមាន)</label>
              <input type="text" class="form-control" id="new-q-math" placeholder="\\int_0^1 x^2 dx" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">ពិន្ទុសម្រាប់សំណួរនេះ *</label>
                <input type="number" class="form-control" id="new-q-points" value="5" min="1" max="50" />
              </div>
              <div class="form-group">
                <label class="form-label">ចម្លើយត្រឹមត្រូវ *</label>
                <input type="text" class="form-control" id="new-q-correct" placeholder="ឧ. A, true, ឬ 1/3" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">ការពន្យល់ និងដំណោះស្រាយលម្អិត</label>
              <textarea class="form-textarea" id="new-q-explanation" placeholder="ពន្យល់ជំហានដោះស្រាយសម្រាប់សិស្សផ្ទៀងផ្ទាត់..."></textarea>
            </div>
          </div>
        </form>
      `,
      confirmText: 'បង្កើត និងរក្សាទុកតេស្ត',
      onConfirm: async () => {
        const title = document.getElementById('quiz-title-input').value.trim();
        const timeLimit = parseInt(document.getElementById('quiz-time-input').value, 10);
        const attempts = parseInt(document.getElementById('quiz-attempts-input').value, 10);
        const desc = document.getElementById('quiz-desc-input').value.trim();
        const shuffleQ = document.getElementById('quiz-shuffle-q').checked;
        const showSol = document.getElementById('quiz-show-sol').checked;

        const qType = document.getElementById('new-q-type').value;
        const qPrompt = document.getElementById('new-q-prompt').value.trim();
        const qMath = document.getElementById('new-q-math').value.trim();
        const qPoints = parseFloat(document.getElementById('new-q-points').value) || 5;
        const qCorrect = document.getElementById('new-q-correct').value.trim();
        const qExplanation = document.getElementById('new-q-explanation').value.trim();

        if (!title || !qPrompt || !qCorrect) {
          window.app.showToast('សូមបំពេញព័ត៌មានចាំបាច់ និងសំណួរដំបូង!', 'error');
          return false;
        }

        const initialQuestion = {
          id: 'q-' + Date.now(),
          number: 1,
          type: qType,
          points: qPoints,
          promptKm: qPrompt,
          mathFormula: qMath,
          options: qType === 'mcq' ? [
            { id: 'A', text: qCorrect },
            { id: 'B', text: 'ចម្លើយខុសទី ១' },
            { id: 'C', text: 'ចម្លើយខុសទី ២' },
            { id: 'D', text: 'ចម្លើយខុសទី ៣' }
          ] : [],
          correctOption: qCorrect,
          explanationKm: qExplanation || 'ដំណោះស្រាយលម្អិតនឹងត្រូវបានបន្ថែម។'
        };

        await window.db.createQuiz({
          classId: this.selectedClassId,
          title,
          description: desc,
          timeLimitMinutes: timeLimit,
          maxAttempts: attempts,
          shuffleQuestions: shuffleQ,
          showSolutionOnSubmit: showSol,
          isPublished: true,
          createdBy: window.auth.getCurrentUser().id,
          questions: [initialQuestion]
        });

        window.app.showToast('បានបង្កើតកម្រងតេស្តថ្មីដោយជោគជ័យ!', 'success');
        window.app.renderCurrentView();
        return true;
      }
    });
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
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span class="status-pill status-active">សំណួរ ${idx + 1} (${q.type.toUpperCase()})</span>
                  <span style="font-family: var(--font-math); color: var(--primary-light); font-weight: 600;">${q.points} ពិន្ទុ</span>
                </div>
                <div style="font-size: 1rem; color: #fff; margin-bottom: 0.5rem;">${q.promptKm}</div>
                ${q.mathFormula ? `<div style="text-align: center; margin: 0.75rem 0;">$$${q.mathFormula}$$</div>` : ''}
                <div style="font-size: 0.85rem; color: #34d399; font-weight: 600;">
                  ចម្លើយត្រឹមត្រូវ៖ ${q.correctOption}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.4rem; white-space: pre-line;">
                  ${q.explanationKm}
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
}

// Global Teacher Controller instance
window.teacherController = new TeacherController();
