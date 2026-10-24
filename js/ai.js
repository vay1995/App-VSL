/**
 * Khmer Math Learning & Assessment System (រៀន និងវាយតម្លៃគណិតវិទ្យាខ្មែរ)
 * AI Math Question Studio & Gemini API Multimodal Integration
 * Supports: PDF/DOCX/Image Upload, Mixed Difficulty Distribution, KaTeX Math
 */

class AIMathStudio {
  constructor() {
    this.apiKeyStorageKey = 'KM_GEMINI_API_KEY';
    this.generatedQuestions = [];
    this.uploadedFiles = [];
    this.activeTab = 'topic'; // 'topic' or 'upload'
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
              <i data-lucide="sparkles" style="color: var(--primary-light);"></i> AI Math Studio (ជំនួយការបង្កើតសំណួរ និងតេស្ត)
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
              បង្កើតសំណួរគណិតវិទ្យាខ្មែរតាមប្រធានបទ ឬអាប់ឡូតឯកសារ/រូបភាព កំណត់កម្រិតលំបាកចម្រុះ និងរក្សាទុកទៅក្នុងតេស្តពិតប្រាកដ
            </p>
          </div>

          <!-- API Key Connection Status -->
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="status-pill ${hasKey ? 'status-published' : 'status-hidden'}" id="api-status-pill">
              <i data-lucide="${hasKey ? 'check-circle' : 'alert-circle'}"></i>
              ${hasKey ? 'បានភ្ជាប់ Gemini API ពិតប្រាកដ' : 'ម៉ាស៊ីនកម្មវិធីសិក្សាជាតិ (Offline Engine)'}
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-config-ai-key">
              <i data-lucide="key"></i> កំណត់ API Key & Model
            </button>
          </div>
        </div>

        <!-- Studio Mode Tabs -->
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
          <button class="grade-pill ${this.activeTab === 'topic' ? 'active' : ''}" id="tab-mode-topic" style="cursor: pointer;">
            <i data-lucide="book-open" style="width: 14px; height: 14px; vertical-align: middle;"></i> បង្កើតតាមប្រធានបទ (Curriculum Topic)
          </button>
          <button class="grade-pill ${this.activeTab === 'upload' ? 'active' : ''}" id="tab-mode-upload" style="cursor: pointer;">
            <i data-lucide="upload-cloud" style="width: 14px; height: 14px; vertical-align: middle;"></i> អាប់ឡូតឯកសារ ឬរូបភាព (PDF, DOCX, Image)
          </button>
        </div>

        <!-- Generation Parameter Form Card -->
        <div class="card" style="margin-bottom: 2rem;">
          <form id="form-generate-ai">
            
            <!-- Target Grade & Question Types -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">កម្រិតថ្នាក់ (Grade Level) *</label>
                <select class="form-select" id="ai-grade-select">
                  <option value="12">ថ្នាក់ទី១២ (បាក់ឌុប / វិទ្យាសាស្ត្រពិត)</option>
                  <option value="11">ថ្នាក់ទី១១ (កម្រិតខ្ពស់)</option>
                  <option value="10">ថ្នាក់ទី១០ (មូលដ្ឋានគ្រឹះ)</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">ទម្រង់សំណួរ (Question Types) *</label>
                <select class="form-select" id="ai-qtype-select">
                  <option value="mixed">ចម្រុះគ្រប់ប្រភេទ (MCQ, ឆ្លើយខ្លី, បំពេញចន្លោះ, គណនាបង្ហាញជំហាន)</option>
                  <option value="mcq">ជ្រើសរើសចម្លើយ (Multiple Choice ៤ ជម្រើស)</option>
                  <option value="short_answer">សំណួរឆ្លើយខ្លី (Short Answer)</option>
                  <option value="fill_blank">សំណួរបំពេញចន្លោះ (Fill in the blanks)</option>
                  <option value="detailed_calculation">លំហាត់គណនាបង្ហាញដំណោះស្រាយ (Step-by-Step Calculation)</option>
                  <option value="true_false">ពិត ឬមិនពិត (True / False)</option>
                </select>
              </div>
            </div>

            <!-- SECTION 2: DIFFICULTY MATRIX (កម្រិតសំណួរចម្រុះ) -->
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                <label class="form-label" style="font-weight: 700; color: #fff; margin-bottom: 0;">
                  <i data-lucide="layers" style="width: 16px; height: 16px; vertical-align: middle; color: var(--primary-light);"></i>
                  កំណត់ចំនួនសំណួរតាមកម្រិតលំបាក (Difficulty Breakdown) *
                </label>
                <span class="status-pill status-active" id="live-total-questions-badge" style="font-size: 0.84rem; font-weight: 700;">
                  ⚡ ចំនួនសំណួរសរុប៖ 20 សំណួរ
                </span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                <!-- Easy -->
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="color: #34d399; font-size: 0.84rem;">
                    <span class="badge-difficulty badge-easy">🟢 ងាយ</span> ចំនួនសំណួរ
                  </label>
                  <input type="number" class="form-control difficulty-input" id="ai-count-easy" value="5" min="0" max="50" />
                </div>

                <!-- Medium -->
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="color: #fbbf24; font-size: 0.84rem;">
                    <span class="badge-difficulty badge-medium">🟡 មធ្យម</span> ចំនួនសំណួរ
                  </label>
                  <input type="number" class="form-control difficulty-input" id="ai-count-medium" value="10" min="0" max="50" />
                </div>

                <!-- Hard -->
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="color: #fb7185; font-size: 0.84rem;">
                    <span class="badge-difficulty badge-hard">🔴 ពិបាក</span> ចំនួនសំណួរ
                  </label>
                  <input type="number" class="form-control difficulty-input" id="ai-count-hard" value="5" min="0" max="50" />
                </div>
              </div>
            </div>

            <!-- TAB 1 CONTENT: BY TOPIC -->
            <div id="tab-content-topic" style="display: ${this.activeTab === 'topic' ? 'block' : 'none'};">
              <div class="form-group">
                <label class="form-label">ប្រធានបទគណិតវិទ្យា (Math Topic) *</label>
                <input type="text" class="form-control" id="ai-topic-input" 
                       placeholder="ឧ. ចំនួនកុំផ្លិច ទម្រង់ត្រីកោណមាត្រ, អាំងតេក្រាលដោយផ្នែក, លីមីតនៃអនុគមន៍ត្រីកោណមាត្រ..." 
                       value="ចំនួនកុំផ្លិច រូបមន្តដឺម័រ និងឫសទី n" />
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
            </div>

            <!-- TAB 2 CONTENT: FILE & IMAGE UPLOAD -->
            <div id="tab-content-upload" style="display: ${this.activeTab === 'upload' ? 'block' : 'none'};">
              <div class="form-group">
                <label class="form-label">អាប់ឡូតឯកសារមេរៀន ឬរូបភាពលំហាត់គណិតវិទ្យា (PDF, DOCX, JPG, PNG, WEBP)</label>
                
                <!-- Dropzone Area -->
                <div class="upload-dropzone" id="ai-upload-dropzone">
                  <div class="upload-dropzone-icon">
                    <i data-lucide="upload-cloud" style="width: 28px; height: 28px;"></i>
                  </div>
                  <div>
                    <div style="font-weight: 600; color: #fff; font-size: 0.95rem; margin-bottom: 0.25rem;">
                      ចុចដើម្បីជ្រើសរើសឯកសារ ឬអូសទម្លាក់ឯកសារមកទីនេះ
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                      គាំទ្រ PDF, Word (DOCX), និងរូបភាពក្រាប/រូបមន្ត (JPG, PNG, WEBP) អតិបរមា 15MB ក្នុងមួយឯកសារ
                    </div>
                  </div>
                  <input type="file" id="ai-file-input" multiple accept=".pdf,.docx,.jpg,.jpeg,.png,.webp" style="display: none;" />
                </div>

                <!-- Uploaded Files Preview List -->
                <div class="uploaded-files-list" id="ai-uploaded-files-list">
                  ${this.renderUploadedFilesHtml()}
                </div>
              </div>

              <!-- Custom Teacher Instructions for Document -->
              <div class="form-group" style="margin-top: 1rem;">
                <label class="form-label">ការណែនាំបន្ថែមដល់ AI ផ្អែកលើឯកសារ (Teacher Instructions) *</label>
                <textarea class="form-textarea" id="ai-doc-instructions" rows="2" 
                          placeholder="ឧ. បង្កើតសំណួរដោយផ្អែកលើទ្រឹស្តីបទ និងលំហាត់ក្នុងឯកសារដែលបានអាប់ឡូតខាងលើ ដោយរក្សារូបមន្ត KaTeX ឱ្យបានសុក្រឹត..."></textarea>
              </div>
            </div>

            <!-- Submit Action Footer -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem; margin-top: 1rem;">
              <div style="font-size: 0.85rem; color: var(--text-secondary);">
                ${hasKey 
                  ? '⚡ ដំណើរការដោយ Google Gemini Multimodal Vision & Text AI' 
                  : '💡 ដំណើរការដោយ ម៉ាស៊ីនកម្មវិធីសិក្សាគណិតវិទ្យាខ្មែរ (Offline Curriculum Engine)'}
              </div>

              <button type="submit" class="btn btn-primary" id="btn-submit-ai-gen">
                <i data-lucide="sparkles"></i> បង្កើតសំណួរតាមកម្រិត
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

  renderUploadedFilesHtml() {
    if (this.uploadedFiles.length === 0) return '';
    return this.uploadedFiles.map((file, idx) => `
      <div class="upload-file-card">
        <div class="upload-file-info">
          <i data-lucide="${file.type && file.type.includes('pdf') ? 'file-text' : (file.type && file.type.includes('image') ? 'image' : 'file')}" style="width: 20px; height: 20px; color: var(--primary-light);"></i>
          <div>
            <div class="upload-file-name">${file.name}</div>
            <div class="upload-file-meta">${(file.size / 1024).toFixed(1)} KB • ${file.parsed ? 'វិភាគរួចរាល់' : 'កំពុងផ្ទុក'}</div>
          </div>
        </div>
        <button type="button" class="btn btn-danger btn-sm btn-remove-upload-file" data-idx="${idx}" style="padding: 0.35rem 0.6rem;">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `).join('');
  }

  attachStudioEvents() {
    // Tab switching
    const tabTopic = document.getElementById('tab-mode-topic');
    const tabUpload = document.getElementById('tab-mode-upload');
    const contentTopic = document.getElementById('tab-content-topic');
    const contentUpload = document.getElementById('tab-content-upload');

    if (tabTopic && tabUpload) {
      tabTopic.onclick = () => {
        this.activeTab = 'topic';
        tabTopic.classList.add('active');
        tabUpload.classList.remove('active');
        contentTopic.style.display = 'block';
        contentUpload.style.display = 'none';
      };
      tabUpload.onclick = () => {
        this.activeTab = 'upload';
        tabUpload.classList.add('active');
        tabTopic.classList.remove('active');
        contentTopic.style.display = 'none';
        contentUpload.style.display = 'block';
      };
    }

    // Live total questions counter
    const easyInput = document.getElementById('ai-count-easy');
    const medInput = document.getElementById('ai-count-medium');
    const hardInput = document.getElementById('ai-count-hard');
    const totalBadge = document.getElementById('live-total-questions-badge');

    const updateTotal = () => {
      const e = parseInt(easyInput.value, 10) || 0;
      const m = parseInt(medInput.value, 10) || 0;
      const h = parseInt(hardInput.value, 10) || 0;
      const total = e + m + h;
      if (totalBadge) {
        totalBadge.innerHTML = `⚡ ចំនួនសំណួរសរុប៖ <b>${total}</b> សំណួរ (ងាយ: ${e}, មធ្យម: ${m}, ពិបាក: ${h})`;
      }
    };

    [easyInput, medInput, hardInput].forEach(inp => {
      if (inp) inp.addEventListener('input', updateTotal);
    });

    // File Dropzone & Picker
    const dropzone = document.getElementById('ai-upload-dropzone');
    const fileInput = document.getElementById('ai-file-input');

    if (dropzone && fileInput) {
      dropzone.onclick = () => fileInput.click();
      dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      };
      dropzone.ondragleave = () => dropzone.classList.remove('dragover');
      dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files) {
          this.handleSelectedFiles(Array.from(e.dataTransfer.files));
        }
      };
      fileInput.onchange = () => {
        if (fileInput.files) {
          this.handleSelectedFiles(Array.from(fileInput.files));
        }
      };
    }

    // Remove uploaded file
    document.querySelectorAll('.btn-remove-upload-file').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        this.uploadedFiles.splice(idx, 1);
        const listContainer = document.getElementById('ai-uploaded-files-list');
        if (listContainer) listContainer.innerHTML = this.renderUploadedFilesHtml();
        if (window.lucide) window.lucide.createIcons();
        this.attachStudioEvents();
      };
    });

    // Config API Key Modal
    const configBtn = document.getElementById('btn-config-ai-key');
    if (configBtn) configBtn.onclick = () => this.showApiKeyConfigModal();

    // Quick Topic Pills
    document.querySelectorAll('.btn-quick-topic').forEach(btn => {
      btn.onclick = () => {
        const input = document.getElementById('ai-topic-input');
        if (input) input.value = btn.dataset.topic;
      };
    });

    // Form Submit (Generation)
    const form = document.getElementById('form-generate-ai');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        await this.handleGenerateSubmission();
      };
    }

    // Approve All to Quiz button
    const approveBtn = document.getElementById('btn-approve-all-to-quiz');
    if (approveBtn) {
      approveBtn.onclick = () => this.showApproveToQuizModal();
    }

    // Edit Question buttons
    document.querySelectorAll('.btn-edit-gen-q').forEach(btn => {
      btn.onclick = () => this.showEditQuestionModal(parseInt(btn.dataset.index, 10));
    });

    // Remove Question buttons
    document.querySelectorAll('.btn-remove-gen-q').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.index, 10);
        this.generatedQuestions.splice(idx, 1);
        document.getElementById('ai-results-area').innerHTML = this.renderGeneratedQuestionsList();
        if (window.lucide) window.lucide.createIcons();
        this.attachStudioEvents();
      };
    });
  }

  async handleSelectedFiles(files) {
    for (const file of files) {
      // Validate file extension
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const allowed = ['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
      if (!allowed.includes(ext)) {
        window.app.showToast(`ប្រភេទឯកសារ ${ext} មិនត្រូវបានគាំទ្រទេ (គាំទ្រតែ PDF, DOCX, JPG, PNG, WEBP)`, 'error');
        continue;
      }

      if (file.size > 15 * 1024 * 1024) {
        window.app.showToast(`ឯកសារ ${file.name} មានទំហំធំជាង ១៥MB!`, 'error');
        continue;
      }

      const fileObj = {
        name: file.name,
        size: file.size,
        type: file.type || ext,
        file: file,
        parsed: false,
        extractedText: '',
        dataUrl: ''
      };

      // Read as DataURL
      fileObj.dataUrl = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(file);
      });

      // Extract text if PDF or DOCX
      if (ext === '.pdf' && window.pdfjsLib) {
        try {
          fileObj.extractedText = await this.extractTextFromPDF(file);
          fileObj.parsed = true;
        } catch (err) {
          console.warn('PDF extract note:', err);
        }
      } else if (ext === '.docx' && window.mammoth) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await window.mammoth.extractRawText({ arrayBuffer });
          fileObj.extractedText = result.value || '';
          fileObj.parsed = true;
        } catch (err) {
          console.warn('DOCX extract note:', err);
        }
      } else {
        fileObj.parsed = true;
      }

      this.uploadedFiles.push(fileObj);
    }

    const listContainer = document.getElementById('ai-uploaded-files-list');
    if (listContainer) listContainer.innerHTML = this.renderUploadedFilesHtml();
    if (window.lucide) window.lucide.createIcons();
    this.attachStudioEvents();
    window.app.showToast(`បានបញ្ចូល ${files.length} ឯកសាររួចរាល់!`, 'success');
  }

  async extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 10);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += `\n--- ទំព័រទី ${i} ---\n` + pageText;
    }
    return fullText;
  }

  async handleGenerateSubmission() {
    const submitBtn = document.getElementById('btn-submit-ai-gen');
    const grade = document.getElementById('ai-grade-select').value;
    const qtype = document.getElementById('ai-qtype-select').value;

    const easyCount = parseInt(document.getElementById('ai-count-easy').value, 10) || 0;
    const medCount = parseInt(document.getElementById('ai-count-medium').value, 10) || 0;
    const hardCount = parseInt(document.getElementById('ai-count-hard').value, 10) || 0;
    const totalQuestions = easyCount + medCount + hardCount;

    if (totalQuestions <= 0) {
      window.app.showToast('សូមកំណត់ចំនួនសំណួរយ៉ាងហោចណាស់ ១ សំណួរ!', 'error');
      return;
    }

    let topic = '';
    let userPrompt = '';
    if (this.activeTab === 'topic') {
      topic = document.getElementById('ai-topic-input').value.trim();
      if (!topic) {
        window.app.showToast('សូមបញ្ចូលប្រធានបទគណិតវិទ្យា!', 'error');
        return;
      }
    } else {
      userPrompt = document.getElementById('ai-doc-instructions').value.trim();
      if (this.uploadedFiles.length === 0 && !userPrompt) {
        window.app.showToast('សូមអាប់ឡូតឯកសារ/រូបភាព ឬសរសេរការណែនាំដល់ AI!', 'error');
        return;
      }
      topic = this.uploadedFiles.map(f => f.name).join(', ') || 'ឯកសារមេរៀនដែលបានអាប់ឡូត';
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="loading-spinner"></span> កំពុងបង្កើត ${totalQuestions} សំណួរ...`;
    }

    try {
      const options = {
        topic,
        grade,
        qtype,
        difficultyCounts: { easy: easyCount, medium: medCount, hard: hardCount },
        totalQuestions,
        uploadedFiles: this.uploadedFiles,
        userPrompt
      };

      const questions = await this.generateQuestions(options);

      this.generatedQuestions = questions;
      document.getElementById('ai-results-area').innerHTML = this.renderGeneratedQuestionsList();

      if (window.lucide) window.lucide.createIcons();
      this.attachStudioEvents();
      setTimeout(() => {
        window.quizService.renderMath(document.getElementById('ai-results-area'));
      }, 50);

      // Check partial generation
      if (questions.length < totalQuestions) {
        window.app.showToast(`AI បានបង្កើតបាន ${questions.length}/${totalQuestions} សំណួរ។ អ្នកអាចចុចបង្កើតបន្ថែម ឬកែសម្រួលដោយផ្ទាល់!`, 'info');
      } else {
        window.app.showToast(`🎉 បានបង្កើត ${questions.length} សំណួរតាមកម្រិតលំបាកដោយជោគជ័យ!`, 'success');
      }
    } catch (err) {
      console.error('Generation error:', err);
      window.app.showToast('កំហុសពេលបង្កើតសំណួរ៖ ' + err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="sparkles"></i> បង្កើតសំណួរតាមកម្រិត`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }

  renderGeneratedQuestionsList() {
    if (this.generatedQuestions.length === 0) {
      return `
        <div class="card" style="text-align: center; padding: 3rem; color: var(--text-muted);">
          <i data-lucide="sparkles" style="width: 40px; height: 40px; color: var(--text-dim); margin-bottom: 0.75rem;"></i>
          <p>សូមកំណត់កម្រិតសំណួរ រួចចុចប៊ូតុង «បង្កើតសំណួរតាមកម្រិត» ខាងលើ។</p>
        </div>
      `;
    }

    const easyCount = this.generatedQuestions.filter(q => q.difficulty === 'easy').length;
    const medCount = this.generatedQuestions.filter(q => q.difficulty === 'medium').length;
    const hardCount = this.generatedQuestions.filter(q => q.difficulty === 'hard').length;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="check-square"></i> សំណួរដែលបានបង្កើត (${this.generatedQuestions.length} សំណួរ)
          </h3>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.35rem;">
            <span class="badge-difficulty badge-easy">🟢 ងាយ: ${easyCount}</span>
            <span class="badge-difficulty badge-medium">🟡 មធ្យម: ${medCount}</span>
            <span class="badge-difficulty badge-hard">🔴 ពិបាក: ${hardCount}</span>
          </div>
        </div>
        <button class="btn btn-success" id="btn-approve-all-to-quiz">
          <i data-lucide="save"></i> អនុម័ត និងរក្សាទុកទៅក្នុងកម្រងតេស្ត
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;" id="ai-questions-container">
        ${this.generatedQuestions.map((q, idx) => `
          <div class="card" style="background: rgba(18, 24, 50, 0.75); border-left: 4px solid ${q.difficulty === 'easy' ? '#10b981' : (q.difficulty === 'hard' ? '#f43f5e' : '#f59e0b')};" data-index="${idx}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="status-pill status-active">សំណួរទី ${idx + 1}</span>
                <span class="badge-difficulty ${q.difficulty === 'easy' ? 'badge-easy' : (q.difficulty === 'hard' ? 'badge-hard' : 'badge-medium')}">
                  ${q.difficulty === 'easy' ? '🟢 ងាយ' : (q.difficulty === 'hard' ? '🔴 ពិបាក' : '🟡 មធ្យម')}
                </span>
                <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">
                  ${q.type || 'MCQ'}
                </span>
                <span style="font-size: 0.82rem; color: var(--primary-light); font-weight: 600;">
                  ${q.points || 5} ពិន្ទុ
                </span>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary btn-sm btn-edit-gen-q" data-index="${idx}">
                  <i data-lucide="edit-3"></i> កែសម្រួល
                </button>
                <button class="btn btn-danger btn-sm btn-remove-gen-q" data-index="${idx}">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>

            <!-- Question Prompt & Image -->
            <div style="font-size: 1rem; color: #fff; margin-bottom: 0.75rem; line-height: 1.6;">
              ${q.promptKm}
            </div>

            ${q.image ? `
              <div style="margin: 0.75rem 0; text-align: center;">
                <img src="${q.image}" style="max-height: 240px; border-radius: 8px; border: 1px solid var(--border-subtle);" alt="Question Image" />
              </div>
            ` : ''}

            <!-- Formula display -->
            ${q.mathFormula ? `
              <div style="background: rgba(12, 16, 33, 0.8); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.75rem 1rem; text-align: center; margin-bottom: 1rem; color: var(--primary-light);">
                $$${q.mathFormula}$$
              </div>
            ` : ''}

            <!-- Options if MCQ -->
            ${(q.options && q.options.length > 0) ? `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                ${q.options.map(opt => `
                  <div style="padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid ${opt.id === q.correctOption ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-subtle)'}; background: ${opt.id === q.correctOption ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.03)'}; display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem;">
                    <span style="font-weight: 700; color: ${opt.id === q.correctOption ? '#34d399' : 'var(--text-muted)'};">${opt.id}.</span>
                    <span>${opt.text || opt.math || ''}</span>
                    ${opt.id === q.correctOption ? `<i data-lucide="check" style="width: 14px; height: 14px; color: #34d399; margin-left: auto;"></i>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : `
              <div style="margin-bottom: 0.75rem; font-size: 0.88rem; color: #34d399; font-weight: 600;">
                ចម្លើយត្រឹមត្រូវ៖ ${q.correctOption}
              </div>
            `}

            <!-- Step by Step Solution -->
            <div style="background: rgba(99, 102, 241, 0.08); border-left: 3px solid var(--primary); padding: 0.75rem 1rem; border-radius: 0 8px 8px 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; white-space: pre-line;">
              <b style="color: var(--primary-light);"><i data-lucide="lightbulb" style="width: 14px; height: 14px; vertical-align: middle;"></i> ដំណោះស្រាយលម្អិត៖</b><br/>
              ${q.explanationKm}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  showEditQuestionModal(idx) {
    const q = this.generatedQuestions[idx];
    if (!q) return;

    window.app.openModal({
      title: `កែសម្រួលសំណួរទី ${idx + 1}`,
      bodyHtml: `
        <form id="form-edit-gen-q">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">កម្រិតលំបាក</label>
              <select class="form-select" id="edit-q-diff">
                <option value="easy" ${q.difficulty === 'easy' ? 'selected' : ''}>🟢 ងាយ</option>
                <option value="medium" ${q.difficulty === 'medium' ? 'selected' : ''}>🟡 មធ្យម</option>
                <option value="hard" ${q.difficulty === 'hard' ? 'selected' : ''}>🔴 ពិបាក</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">ពិន្ទុ</label>
              <input type="number" class="form-control" id="edit-q-points" value="${q.points || 5}" min="1" max="50" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">ប្រធានសំណួរ (Khmer) *</label>
            <textarea class="form-textarea" id="edit-q-prompt" rows="3" required>${q.promptKm || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">រូបមន្ត KaTeX</label>
            <input type="text" class="form-control" id="edit-q-math" value="${q.mathFormula || ''}" />
          </div>

          <div class="form-group">
            <label class="form-label">ចម្លើយត្រឹមត្រូវ *</label>
            <input type="text" class="form-control" id="edit-q-correct" value="${q.correctOption || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label">ការពន្យល់ និងដំណោះស្រាយលម្អិត</label>
            <textarea class="form-textarea" id="edit-q-explanation" rows="4">${q.explanationKm || ''}</textarea>
          </div>
        </form>
      `,
      confirmText: 'រក្សាទុកការកែប្រែ',
      onConfirm: async () => {
        q.difficulty = document.getElementById('edit-q-diff').value;
        q.points = parseFloat(document.getElementById('edit-q-points').value) || 5;
        q.promptKm = document.getElementById('edit-q-prompt').value.trim();
        q.mathFormula = document.getElementById('edit-q-math').value.trim();
        q.correctOption = document.getElementById('edit-q-correct').value.trim();
        q.explanationKm = document.getElementById('edit-q-explanation').value.trim();

        document.getElementById('ai-results-area').innerHTML = this.renderGeneratedQuestionsList();
        if (window.lucide) window.lucide.createIcons();
        this.attachStudioEvents();
        setTimeout(() => {
          window.quizService.renderMath(document.getElementById('ai-results-area'));
        }, 50);
        window.app.showToast('បានកែសម្រួលសំណួររួចរាល់!', 'success');
        return true;
      }
    });
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

  async showApproveToQuizModal() {
    if (this.generatedQuestions.length === 0) {
      window.app.showToast('គ្មានសំណួរដែលត្រូវអនុម័តឡើយ!', 'error');
      return;
    }

    const quizzes = await window.db.getQuizzes(null, 'teacher');
    const topicVal = document.getElementById('ai-topic-input') ? document.getElementById('ai-topic-input').value.trim() : 'គណិតវិទ្យា';

    window.app.openModal({
      title: 'អនុម័ត និងរក្សាទុកទៅក្នុង Database',
      bodyHtml: `
        <form id="form-approve-quiz">
          <div class="form-group">
            <label class="form-label">ជ្រើសរើសទីតាំងរក្សាទុកតេស្ត៖</label>
            <select class="form-select" id="approve-destination-select">
              <option value="new">➕ បង្កើតជាកម្រងតេស្តថ្មី (New Quiz)</option>
              ${quizzes.map(q => `
                <option value="${q.id}">បញ្ចូលបន្ថែមទៅក្នុង «${q.title}»</option>
              `).join('')}
            </select>
          </div>

          <div id="new-quiz-fields">
            <div class="form-group">
              <label class="form-label">ចំណងជើងកម្រងតេស្ត *</label>
              <input type="text" class="form-control" id="approve-quiz-title" value="តេស្តវាស់ស្ទង់សមត្ថភាព៖ ${topicVal}" required />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">ថ្នាក់រៀន</label>
                <select class="form-select" id="approve-class-select">
                  <option value="all">គ្រប់ថ្នាក់ (All Classes)</option>
                  <option value="class-12a">ថ្នាក់ទី១២A (MTH-12A)</option>
                  <option value="class-11b">ថ្នាក់ទី១១B (MTH-11B)</option>
                  <option value="class-10c">ថ្នាក់ទី១០C (MTH-10C)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">រយៈពេលប្រឡង (នាទី)</label>
                <input type="number" class="form-control" id="approve-time-input" value="30" min="5" max="180" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">ស្ថានភាពដំបូង</label>
              <select class="form-select" id="approve-published-select">
                <option value="true">បោះពុម្ពផ្សាយភ្លាមៗ (Published - សិស្សអាចប្រឡងបាន)</option>
                <option value="false">រក្សាទុកជាសេចក្តីព្រាង (Draft - សិស្សមិនទាន់ឃើញ)</option>
              </select>
            </div>
          </div>
        </form>
      `,
      confirmText: 'រក្សាទុកតេស្ត',
      onConfirm: async () => {
        const dest = document.getElementById('approve-destination-select').value;
        const currentUser = window.auth.getCurrentUser();

        try {
          if (dest === 'new') {
            const title = document.getElementById('approve-quiz-title').value.trim();
            const classId = document.getElementById('approve-class-select').value;
            const timeLimit = parseInt(document.getElementById('approve-time-input').value, 10) || 30;
            const isPublished = document.getElementById('approve-published-select').value === 'true';

            if (!title) {
              window.app.showToast('សូមបញ្ចូលចំណងជើងតេស្ត!', 'error');
              return false;
            }

            const easyCount = this.generatedQuestions.filter(q => q.difficulty === 'easy').length;
            const medCount = this.generatedQuestions.filter(q => q.difficulty === 'medium').length;
            const hardCount = this.generatedQuestions.filter(q => q.difficulty === 'hard').length;

            const newQuiz = await window.db.createQuiz({
              classId,
              title,
              timeLimitMinutes: timeLimit,
              maxAttempts: 1,
              isPublished,
              createdBy: currentUser ? currentUser.id : 'user-teacher-1',
              difficultyCounts: { easy: easyCount, medium: medCount, hard: hardCount },
              questions: this.generatedQuestions,
              uploadedFiles: this.uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type, url: f.dataUrl }))
            });

            window.app.showToast(`🎉 បានរក្សាទុកតេស្ត «${newQuiz.title}» ទៅក្នុង Database ដោយជោគជ័យ!`, 'success');
          } else {
            const quiz = await window.db.getQuizById(dest, 'teacher');
            if (quiz) {
              const updatedQuestions = [...(quiz.questions || []), ...this.generatedQuestions];
              await window.db.updateQuiz(quiz.id, {
                questions: updatedQuestions,
                totalPoints: updatedQuestions.reduce((a, b) => a + (parseFloat(b.points) || 1), 0),
                questionCount: updatedQuestions.length
              });
              window.app.showToast(`🎉 បានបញ្ចូល ${this.generatedQuestions.length} សំណួរទៅក្នុង «${quiz.title}» ដោយជោគជ័យ!`, 'success');
            }
          }

          // Clear generated pool
          this.generatedQuestions = [];
          this.uploadedFiles = [];

          // Immediately navigate to Teacher Quizzes
          window.app.navigate('teacher-quizzes');
          return true;
        } catch (err) {
          console.error('Save quiz error:', err);
          window.app.showToast('កំហុសពេលរក្សាទុកតេស្ត៖ ' + err.message, 'error');
          return false;
        }
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

  // ==========================================
  // GENERATOR ENGINE (REAL GEMINI OR CURRICULUM FALLBACK)
  // ==========================================
  async generateQuestions(optionsOrTopic, grade, qtype, difficulty) {
    let opts = {};
    if (typeof optionsOrTopic === 'object' && optionsOrTopic !== null) {
      opts = optionsOrTopic;
    } else {
      opts = {
        topic: optionsOrTopic,
        grade: grade || 12,
        qtype: qtype || 'mcq',
        difficultyCounts: {
          easy: difficulty === 'easy' ? 3 : 0,
          medium: (difficulty === 'medium' || !difficulty) ? 3 : 0,
          hard: difficulty === 'hard' ? 3 : 0
        },
        totalQuestions: 3
      };
    }

    if (this.hasRealApiKey()) {
      return this.callGeminiAPI(opts);
    } else {
      return this.generateFromCurriculumEngine(opts);
    }
  }

  async callGeminiAPI(opts) {
    const apiKey = this.getApiKey();
    const selectedModel = localStorage.getItem('KM_GEMINI_MODEL') || 'gemini-1.5-pro';

    const modelsToTry = [
      selectedModel,
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-2.0-flash'
    ].filter((m, i, arr) => arr.indexOf(m) === i);

    const easyC = (opts.difficultyCounts && opts.difficultyCounts.easy !== undefined) ? opts.difficultyCounts.easy : 5;
    const medC = (opts.difficultyCounts && opts.difficultyCounts.medium !== undefined) ? opts.difficultyCounts.medium : 10;
    const hardC = (opts.difficultyCounts && opts.difficultyCounts.hard !== undefined) ? opts.difficultyCounts.hard : 5;
    const totalQ = easyC + medC + hardC;

    // Build prompt text
    let promptText = `
You are an expert Cambodian High School Mathematics teacher aligned with Ministry of Education, Youth and Sport (MoEYS) curriculum.
Generate exactly ${totalQ} high quality mathematics assessment questions in Khmer language for Grade ${opts.grade || 12} students.
Topic / Material: "${opts.topic || 'Cambodian Mathematics'}".
Question Type preference: ${opts.qtype || 'mixed'}.

MANDATORY DIFFICULTY BREAKDOWN:
- Exactly ${easyC} questions with "difficulty": "easy"
- Exactly ${medC} questions with "difficulty": "medium"
- Exactly ${hardC} questions with "difficulty": "hard"

Requirements:
1. Every math equation or expression MUST use standard KaTeX / LaTeX formatting ($...$ for inline or $$...$$ for display).
2. For multiple choice (mcq), provide 4 options labeled 'A', 'B', 'C', 'D' with balanced math expressions.
3. For short_answer, provide concise expected answer.
4. For detailed_calculation, provide step-by-step mathematical working.
5. Provide the exact correctOption ('A', 'true', formula, etc.).
6. Provide a thorough, step-by-step mathematical explanation in Khmer (explanationKm).
7. Output ONLY a valid JSON array matching this schema:
[
  {
    "id": "q-ai-1",
    "type": "mcq",
    "difficulty": "easy",
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

    if (opts.userPrompt) {
      promptText += `\nTeacher Specific Instructions:\n${opts.userPrompt}\n`;
    }

    // Build contents payload (Multimodal: supports images and documents)
    const parts = [{ text: promptText }];

    // If uploaded files contain images, add inlineData
    if (opts.uploadedFiles && Array.isArray(opts.uploadedFiles)) {
      for (const file of opts.uploadedFiles) {
        if (file.dataUrl && file.dataUrl.startsWith('data:image/')) {
          const match = file.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inline_data: {
                mime_type: match[1],
                data: match[2]
              }
            });
          }
        } else if (file.extractedText) {
          parts.push({
            text: `\n--- ខ្លឹមសារស្រង់ចេញពីឯកសារ ${file.name} ---\n${file.extractedText.substring(0, 8000)}\n`
          });
        }
      }
    }

    let lastError = null;
    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { response_mime_type: 'application/json' }
          })
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          const errMsg = (errJson.error && errJson.error.message) || `Gemini API returned status ${response.status}`;
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
          points: item.points || 5,
          difficulty: item.difficulty || (idx < easyC ? 'easy' : (idx < easyC + medC ? 'medium' : 'hard'))
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

  generateFromCurriculumEngine(optsOrTopic) {
    const now = Date.now();
    let topic = 'គណិតវិទ្យា';
    let grade = 12;
    let easyCount = 5;
    let medCount = 10;
    let hardCount = 5;

    if (typeof optsOrTopic === 'object' && optsOrTopic !== null) {
      topic = optsOrTopic.topic || 'គណិតវិទ្យា';
      grade = parseInt(optsOrTopic.grade, 10) || 12;
      if (optsOrTopic.difficultyCounts) {
        easyCount = optsOrTopic.difficultyCounts.easy !== undefined ? optsOrTopic.difficultyCounts.easy : 5;
        medCount = optsOrTopic.difficultyCounts.medium !== undefined ? optsOrTopic.difficultyCounts.medium : 10;
        hardCount = optsOrTopic.difficultyCounts.hard !== undefined ? optsOrTopic.difficultyCounts.hard : 5;
      }
    } else if (typeof optsOrTopic === 'string') {
      topic = optsOrTopic;
    }

    const generated = [];

    // Helper generator for Easy questions
    for (let i = 0; i < easyCount; i++) {
      generated.push(this.createPedagogicalQuestion(grade, topic, 'easy', i + 1, now));
    }

    // Helper generator for Medium questions
    for (let i = 0; i < medCount; i++) {
      generated.push(this.createPedagogicalQuestion(grade, topic, 'medium', easyCount + i + 1, now));
    }

    // Helper generator for Hard questions
    for (let i = 0; i < hardCount; i++) {
      generated.push(this.createPedagogicalQuestion(grade, topic, 'hard', easyCount + medCount + i + 1, now));
    }

    return generated;
  }

  createPedagogicalQuestion(grade, topic, difficulty, number, seed) {
    const id = `q-gen-${seed}-${number}`;
    const t = (topic || '').toLowerCase();

    if (t.includes('កុំផ្លិច') || t.includes('complex')) {
      if (difficulty === 'easy') {
        return {
          id,
          number,
          type: 'mcq',
          difficulty: 'easy',
          points: 4,
          promptKm: `រកផ្នែកពិត និងផ្នែកនិម្មិតនៃចំនួនកុំផ្លិច $z = ${(number * 2 + 1)} - ${number + 3}i$៖`,
          mathFormula: `z = ${(number * 2 + 1)} - ${number + 3}i`,
          options: [
            { id: 'A', text: `$\\text{Re}(z) = ${number * 2 + 1}, \\, \\text{Im}(z) = -${number + 3}$` },
            { id: 'B', text: `$\\text{Re}(z) = -${number + 3}, \\, \\text{Im}(z) = ${number * 2 + 1}$` },
            { id: 'C', text: `$\\text{Re}(z) = ${number * 2 + 1}, \\, \\text{Im}(z) = ${number + 3}$` },
            { id: 'D', text: `$\\text{Re}(z) = ${number + 3}, \\, \\text{Im}(z) = -${number * 2 + 1}$` }
          ],
          correctOption: 'A',
          explanationKm: `**ដំណោះស្រាយកម្រិតងាយ៖**\nទម្រង់ទូទៅ $z = a + bi$ ដែល $a = \\text{Re}(z)$ និង $b = \\text{Im}(z)$។\nដូច្នេះ $\\text{Re}(z) = ${number * 2 + 1}$ និង $\\text{Im}(z) = -${number + 3}$ (ជម្រើស **A**)។`
        };
      } else if (difficulty === 'medium') {
        return {
          id,
          number,
          type: 'mcq',
          difficulty: 'medium',
          points: 5,
          promptKm: `គណនាម៉ូឌុល និងអាគុយម៉ង់នៃចំនួនកុំផ្លិច $z = -${number} + ${number}i\\sqrt{3}$៖`,
          mathFormula: `|z| = \\sqrt{a^2 + b^2}, \\quad \\theta = \\text{arg}(z)`,
          options: [
            { id: 'A', text: `$r = ${number * 2}, \\, \\theta = \\frac{2\\pi}{3}$` },
            { id: 'B', text: `$r = ${number * 2}, \\, \\theta = \\frac{\\pi}{3}$` },
            { id: 'C', text: `$r = ${number}, \\, \\theta = \\frac{5\\pi}{6}$` },
            { id: 'D', text: `$r = ${number * 4}, \\, \\theta = \\frac{4\\pi}{3}$` }
          ],
          correctOption: 'A',
          explanationKm: `**ដំណោះស្រាយកម្រិតមធ្យម៖**\n១. ម៉ូឌុល៖ $r = \\sqrt{(-${number})^2 + (${number}\\sqrt{3})^2} = \\sqrt{${number * number} + ${number * number * 3}} = ${number * 2}$\n២. អាគុយម៉ង់៖ $\\cos\\theta = -\\frac{1}{2}, \\sin\\theta = \\frac{\\sqrt{3}}{2} \\implies \\theta = \\pi - \\frac{\\pi}{3} = \\frac{2\\pi}{3}$ (ជម្រើស **A**)។`
        };
      } else {
        return {
          id,
          number,
          type: 'detailed_calculation',
          difficulty: 'hard',
          points: 6,
          promptKm: `អនុវត្តរូបមន្តដឺម័រ (Moivre's Formula) ដើម្បីគណនាតម្លៃនៃកន្សោម $Z = \\left(\\sqrt{3} + i\\right)^{${number + 5}}$ ជាទម្រង់ពិជគណិត $a + bi$៖`,
          mathFormula: `Z = [r(\\cos\\theta + i\\sin\\theta)]^n = r^n(\\cos n\\theta + i\\sin n\\theta)`,
          options: [],
          correctOption: `Z = 2^{${number + 5}}(\\cos\\frac{(${number + 5})\\pi}{6} + i\\sin\\frac{(${number + 5})\\pi}{6})`,
          explanationKm: `**ដំណោះស្រាយលម្អិតកម្រិតពិបាក (សិស្សពូកែ/បាក់ឌុបនិទ្ទេស A)៖**\n១. បំប្លែង $\\sqrt{3} + i$ ជាទម្រង់ត្រីកោណមាត្រ៖\n$r = \\sqrt{(\\sqrt{3})^2 + 1^2} = 2$\n$\\cos\\theta = \\frac{\\sqrt{3}}{2}, \\sin\\theta = \\frac{1}{2} \\implies \\theta = \\frac{\\pi}{6}$\n២. អនុវត្តរូបមន្តដឺម័រ៖\n$Z = 2^{${number + 5}}\\left[\\cos\\left(\\frac{${number + 5}\\pi}{6}\\right) + i\\sin\\left(\\frac{${number + 5}\\pi}{6}\\right)\\right]$។`
        };
      }
    } else if (t.includes('អាំងតេក្រាល') || t.includes('integral')) {
      if (difficulty === 'easy') {
        return {
          id,
          number,
          type: 'mcq',
          difficulty: 'easy',
          points: 4,
          promptKm: `គណនាព្រីមីទីវនៃអនុគមន៍ $f(x) = ${number + 2}x^{${number + 1}}$៖`,
          mathFormula: `\\int x^n dx = \\frac{x^{n+1}}{n+1} + C`,
          options: [
            { id: 'A', text: `$F(x) = x^{${number + 2}} + C$` },
            { id: 'B', text: `$F(x) = ${(number + 2) * (number + 1)}x^{${number}} + C$` },
            { id: 'C', text: `$F(x) = \\frac{x^{${number + 2}}}{${number + 2}} + C$` },
            { id: 'D', text: `$F(x) = x^{${number + 1}} + C$` }
          ],
          correctOption: 'A',
          explanationKm: `**ដំណោះស្រាយកម្រិតងាយ៖**\n$\\int ${number + 2}x^{${number + 1}} dx = (${number + 2})\\frac{x^{${number + 2}}}{${number + 2}} + C = x^{${number + 2}} + C$ (ជម្រើស **A**)។`
        };
      } else if (difficulty === 'medium') {
        return {
          id,
          number,
          type: 'mcq',
          difficulty: 'medium',
          points: 5,
          promptKm: `គណនាអាំងតេក្រាលកំណត់ $I = \\int_0^1 (${number + 1}x^${number} + 2x) dx$៖`,
          mathFormula: `I = \\int_0^1 (${number + 1}x^${number} + 2x) dx`,
          options: [
            { id: 'A', text: `$I = 2$` },
            { id: 'B', text: `$I = 1$` },
            { id: 'C', text: `$I = ${number + 1}$` },
            { id: 'D', text: `$I = 0$` }
          ],
          correctOption: 'A',
          explanationKm: `**ដំណោះស្រាយកម្រិតមធ្យម៖**\n$I = \\left[ x^{${number + 1}} + x^2 \\right]_0^1 = (1 + 1) - (0) = 2$ (ជម្រើស **A**)។`
        };
      } else {
        return {
          id,
          number,
          type: 'detailed_calculation',
          difficulty: 'hard',
          points: 6,
          promptKm: `គណនាអាំងតេក្រាលដោយផ្នែក $J = \\int_0^1 x e^{${number}x} dx$៖`,
          mathFormula: `\\int u dv = uv - \\int v du`,
          options: [],
          correctOption: `J = \\frac{(${number}-1)e^{${number}} + 1}{${number * number}}`,
          explanationKm: `**ដំណោះស្រាយកម្រិតពិបាក (អាំងតេក្រាលដោយផ្នែក)៖**\nតាង $u = x \\implies du = dx$\n$dv = e^{${number}x} dx \\implies v = \\frac{1}{${number}}e^{${number}x}$\n$J = \\left[ \\frac{x}{${number}}e^{${number}x} \\right]_0^1 - \\int_0^1 \\frac{1}{${number}}e^{${number}x} dx = \\frac{e^{${number}}}{${number}} - \\frac{e^{${number}}-1}{${number * number}}$។`
        };
      }
    } else {
      // General Mathematics curriculum
      const diffLabel = difficulty === 'easy' ? 'កម្រិតងាយ' : (difficulty === 'hard' ? 'កម្រិតពិបាក' : 'កម្រិតមធ្យម');
      return {
        id,
        number,
        type: 'mcq',
        difficulty,
        points: difficulty === 'easy' ? 4 : (difficulty === 'hard' ? 6 : 5),
        promptKm: `សំណួរទី ${number} (${diffLabel}) លើប្រធានបទ «${topic}»៖ ដោះស្រាយសមីការគណិតវិទ្យា $f(x) = ${number}x^2 - ${(number * 2)}x = 0$`,
        mathFormula: `${number}x^2 - ${(number * 2)}x = 0`,
        options: [
          { id: 'A', text: `$x = 0 \\text{ ឬ } x = 2$` },
          { id: 'B', text: `$x = 1 \\text{ ឬ } x = -2$` },
          { id: 'C', text: `$x = 0 \\text{ ឬ } x = -2$` },
          { id: 'D', text: `$x = 2$` }
        ],
        correctOption: 'A',
        explanationKm: `**ដំណោះស្រាយ (${diffLabel})៖**\nដាក់ជាផលគុណកត្តា៖ $x(${number}x - ${number * 2}) = 0$\n$\\implies x = 0$ ឬ ${number}x = ${number * 2} \\implies x = 2$ (ជម្រើស **A**)។`
      };
    }
  }
}

// Global AI Studio instance
window.aiStudio = new AIMathStudio();
