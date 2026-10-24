/**
 * Khmer Math Learning & Assessment System (រៀន និងវាយតម្លៃគណិតវិទ្យាខ្មែរ)
 * Authentic Cambodian Mathematics Curriculum Seed Data
 * Roles: 'owner' (Super Admin / Owner), 'teacher', 'student'
 */

const SEED_DATA = {
  users: [
    {
      id: 'user-owner-1',
      email: 'vayseangleng@gmail.com',
      password: 'Password123!',
      role: 'owner',
      isOwner: true,
      accountStatus: 'active',
      fullNameKm: 'លោកគ្រូ ម្ចាស់កម្មវិធី (Super Admin)',
      fullNameEn: 'Chief Application Owner & Admin',
      schoolName: 'ទីស្តីការក្រសួងអប់រំ យុវជន និងកីឡា (MoEYS)',
      phone: '012 999 888',
      avatar: '👑',
      bio: 'ម្ចាស់កម្មវិធី និងជាអ្នកគ្រប់គ្រងធំតែម្នាក់គត់នៃប្រព័ន្ធ Khmer Math Learning & Assessment'
    },
    {
      id: 'user-teacher-1',
      email: 'teacher@khmermath.edu.kh',
      password: 'Password123!',
      role: 'teacher',
      isOwner: false,
      accountStatus: 'active',
      fullNameKm: 'លោកគ្រូ អ៊ឹង សុផាត',
      fullNameEn: 'Sophat Oeng',
      schoolName: 'វិទ្យាល័យ ព្រះស៊ីសុវត្ថិ (ភ្នំពេញ)',
      phone: '012 889 900',
      avatar: '👨‍🏫',
      bio: 'គ្រូបង្រៀនគណិតវិទ្យា ថ្នាក់ទី១១ និងទី១២ បទពិសោធន៍ ១៥ ឆ្នាំ'
    },
    {
      id: 'user-student-1',
      email: 'student@khmermath.edu.kh',
      password: 'Password123!',
      role: 'student',
      isOwner: false,
      accountStatus: 'active',
      fullNameKm: 'សុខ ដារ៉ា',
      fullNameEn: 'Dara Sok',
      schoolName: 'វិទ្យាល័យ ព្រះស៊ីសុវត្ថិ',
      gradeLevel: 12,
      classCode: 'MTH-12A',
      phone: '098 765 432',
      avatar: '👨‍🎓',
      bio: 'សិស្សថ្នាក់ទី១២A ផ្នែកវិទ្យាសាស្ត្រពិត'
    },
    {
      id: 'user-student-2',
      email: 'chann.bopha@student.khmermath.edu.kh',
      password: 'Password123!',
      role: 'student',
      isOwner: false,
      accountStatus: 'active',
      fullNameKm: 'ចាន់ បុប្ផា',
      fullNameEn: 'Bopha Chann',
      schoolName: 'វិទ្យាល័យ ព្រះស៊ីសុវត្ថិ',
      gradeLevel: 12,
      classCode: 'MTH-12A',
      phone: '077 112 233',
      avatar: '👩‍🎓',
      bio: 'សិស្សថ្នាក់ទី១២A បេក្ខជនត្រៀមប្រឡងបាក់ឌុប'
    },
    {
      id: 'user-pending-1',
      email: 'heng.visal@teacher.edu.kh',
      password: 'Password123!',
      role: 'teacher',
      isOwner: false,
      accountStatus: 'pending_approval',
      fullNameKm: 'ហេង វិសាល (រង់ចាំការអនុម័ត)',
      fullNameEn: 'Visal Heng',
      schoolName: 'វិទ្យាល័យ ហ៊ុនសែន តាខ្មៅ',
      phone: '011 334 455',
      avatar: '⏳',
      bio: 'បានស្នើសុំចុះឈ្មោះជាគ្រូបង្រៀនគណិតវិទ្យា (រង់ចាំ Owner អនុម័ត)'
    }
  ],

  auditLogs: [
    {
      id: 'log-1',
      actorName: 'លោកគ្រូ ម្ចាស់កម្មវិធី',
      actorRole: 'owner',
      action: 'SYSTEM_INIT',
      resourceType: 'system',
      resourceId: 'sys-0',
      details: 'បានចាប់ផ្តើមដំណើរការប្រព័ន្ធ Khmer Math Learning & Assessment និងកំណត់ Owner ដំបូង',
      createdAt: '2026-10-24T06:00:00.000Z'
    },
    {
      id: 'log-2',
      actorName: 'លោកគ្រូ ម្ចាស់កម្មវិធី',
      actorRole: 'owner',
      action: 'CREATE_CLASS',
      resourceType: 'class',
      resourceId: 'class-12a',
      details: 'បានបង្កើតថ្នាក់គណិតវិទ្យា ១២A (MTH-12A) និងចាត់តាំងគ្រូបង្រៀន អ៊ឹង សុផាត',
      createdAt: '2026-10-24T06:15:00.000Z'
    },
    {
      id: 'log-3',
      actorName: 'លោកគ្រូ អ៊ឹង សុផាត',
      actorRole: 'teacher',
      action: 'CREATE_QUIZ',
      resourceType: 'quiz',
      resourceId: 'quiz-12-complex',
      details: 'បានបង្កើតកម្រងតេស្ត៖ «តេស្តវាស់ស្ទង់សមត្ថភាពជំពូកទី១៖ ចំនួនកុំផ្លិច» (៥ សំណួរ)',
      createdAt: '2026-10-24T07:10:00.000Z'
    },
    {
      id: 'log-4',
      actorName: 'សុខ ដារ៉ា',
      actorRole: 'student',
      action: 'SUBMIT_QUIZ',
      resourceType: 'submission',
      resourceId: 'att-1',
      details: 'បានបញ្ជូនតេស្តចំនួនកុំផ្លិច ទទួលបានពិន្ទុ ១៨/២០ (៩០% - និទ្ទេស A)',
      createdAt: '2026-10-24T08:22:15.000Z'
    },
    {
      id: 'log-5',
      actorName: 'លោកគ្រូ អ៊ឹង សុផាត',
      actorRole: 'teacher',
      action: 'GRADE_SUBMISSION',
      resourceType: 'submission',
      resourceId: 'att-1',
      details: 'បានពិនិត្យ និងដាក់ពិន្ទុសំណួរដោះស្រាយលម្អិតរបស់សិស្ស សុខ ដារ៉ា',
      createdAt: '2026-10-24T08:45:00.000Z'
    }
  ],

  classes: [
    {
      id: 'class-12a',
      code: 'MTH-12A',
      name: 'ថ្នាក់គណិតវិទ្យា ១២A (វិទ្យាសាស្ត្រពិត)',
      grade: 12,
      academicYear: '2025-2026',
      teacherId: 'user-teacher-1',
      teacherName: 'លោកគ្រូ អ៊ឹង សុផាត',
      description: 'កម្មវិធីសិក្សាគណិតវិទ្យាត្រៀមប្រឡងសញ្ញាបត្រមធ្យមសិក្សាទុតិយភូមិ (បាក់ឌុប)',
      studentCount: 38,
      isActive: true,
      color: '#6366f1'
    },
    {
      id: 'class-11b',
      code: 'MTH-11B',
      name: 'ថ្នាក់គណិតវិទ្យា ១១B (កម្រិតខ្ពស់)',
      grade: 11,
      academicYear: '2025-2026',
      teacherId: 'user-teacher-1',
      teacherName: 'លោកគ្រូ អ៊ឹង សុផាត',
      description: 'ពង្រឹងមូលដ្ឋានគ្រឹះស្វ៊ីតចំនួនពិត លីមីត និងដេរីវេសម្រាប់ថ្នាក់វិទ្យាសាស្ត្រ',
      studentCount: 42,
      isActive: true,
      color: '#06b6d4'
    },
    {
      id: 'class-10c',
      code: 'MTH-10C',
      name: 'ថ្នាក់គណិតវិទ្យា ១០C (មូលដ្ឋានគ្រឹះ)',
      grade: 10,
      academicYear: '2025-2026',
      teacherId: 'user-teacher-1',
      teacherName: 'លោកគ្រូ អ៊ឹង សុផាត',
      description: 'មូលដ្ឋានគ្រឹះសមីការ វិសមីការដឺក្រេទី២ និងអនុគមន៍ត្រីកោណមាត្រ',
      studentCount: 45,
      isActive: true,
      color: '#10b981'
    }
  ],

  chapters: [
    {
      id: 'chap-12-1',
      classId: 'class-12a',
      chapterNumber: 1,
      title: 'ជំពូកទី១៖ ចំនួនកុំផ្លិច (Complex Numbers)',
      description: 'ទម្រង់ពិជគណិត ទម្រង់ត្រីកោណមាត្រ រូបមន្តដឺម័រ និងឫសទី n នៃចំនួនកុំផ្លិច',
      order: 1
    },
    {
      id: 'chap-12-2',
      classId: 'class-12a',
      chapterNumber: 2,
      title: 'ជំពូកទី២៖ អាំងតេក្រាល និងអនុវត្តន៍ (Integrals & Applications)',
      description: 'ព្រីមីទីវ អាំងតេក្រាលមិនកំណត់ និងកំណត់ ការគណនាផ្ទៃក្រឡា និងមាឌសូលីតបដិវត្តន៍',
      order: 2
    },
    {
      id: 'chap-12-3',
      classId: 'class-12a',
      chapterNumber: 3,
      title: 'ជំពូកទី៣៖ សមីការឌីផេរ៉ង់ស្យែល (Differential Equations)',
      description: 'សមីការឌីផេរ៉ង់ស្យែលលីនេអ៊ែរលំដាប់ទី១ និងលំដាប់ទី២ អមដោយលក្ខខណ្ឌដើម',
      order: 3
    },
    {
      id: 'chap-11-1',
      classId: 'class-11b',
      chapterNumber: 1,
      title: 'ជំពូកទី១៖ ស្វ៊ីតចំនួនពិត (Real Sequences)',
      description: 'ស្វ៊ីតនព្វន្ត ស្វ៊ីតធរណីមាត្រ និងផលបូកតួនៃស្វ៊ីត',
      order: 1
    },
    {
      id: 'chap-10-1',
      classId: 'class-10c',
      chapterNumber: 1,
      title: 'ជំពូកទី១៖ សមីការ និងវិសមីការដឺក្រេទី២',
      description: 'ការដោះស្រាយតាមឌីសគ្រីមីណង់ ផលបូក និងផលគុណឫស',
      order: 1
    }
  ],

  lessons: [
    {
      id: 'les-12-1-1',
      chapterId: 'chap-12-1',
      lessonNumber: 1,
      title: 'មេរៀនទី១៖ ទម្រង់ពិជគណិតនៃចំនួនកុំផ្លិច',
      isPublished: true,
      contentKm: `### ១. និយមន័យចំនួនកុំផ្លិច
ចំនួនកុំផ្លិចគឺជាចំនួនដែលមានទម្រង់ $z = a + bi$ ដែល $a, b \\in \\mathbb{R}$ និង $i$ ជាឯកតានិម្មិតដោយ $i^2 = -1$។
- $a = \\text{Re}(z)$ ហៅថា **ផ្នែកពិត**
- $b = \\text{Im}(z)$ ហៅថា **ផ្នែកនិម្មិត**

### ២. ប្រមាណវិធីលើចំនួនកុំផ្លិច
- ប្រមាណវិធីបូក និងដក៖
  $$(a + bi) \\pm (c + di) = (a \\pm c) + (b \\pm d)i$$
- ប្រមាណវិធីគុណ៖
  $$(a + bi)(c + di) = (ac - bd) + (ad + bc)i$$
- កុំផ្លិចឆ្លាស់នៃ $z = a + bi$ គឺ $\\bar{z} = a - bi$
- ម៉ូឌុលនៃ $z$ គឺ $|z| = \\sqrt{a^2 + b^2}$`,
      files: [
        {
          id: 'file-1',
          name: 'សង្ខេបទ្រឹស្តីបទ-ចំនួនកុំផ្លិច-ថ្នាក់ទី១២.pdf',
          type: 'pdf',
          size: '2.4 MB',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        },
        {
          id: 'file-2',
          name: 'កម្រងលំហាត់អនុវត្ត-ទម្រង់ពិជគណិត.docx',
          type: 'docx',
          size: '850 KB',
          url: '#'
        }
      ],
      video: {
        type: 'youtube',
        title: 'វីដេអូបង្រៀន៖ ការដោះស្រាយលំហាត់ចំនួនកុំផ្លិចកម្រិតបាក់ឌុប',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        duration: '24 នាទី'
      }
    },
    {
      id: 'les-12-1-2',
      chapterId: 'chap-12-1',
      lessonNumber: 2,
      title: 'មេរៀនទី២៖ ទម្រង់ត្រីកោណមាត្រ និងរូបមន្តដឺម័រ (Moivre)',
      isPublished: true,
      contentKm: `### ១. ទម្រង់ត្រីកោណមាត្រ
បើ $z = a + bi$ ដែលមានម៉ូឌុល $r = |z| = \\sqrt{a^2 + b^2} > 0$ និងអាគុយម៉ង់ $\\theta = \\text{arg}(z)$ នោះ៖
$$z = r(\\cos\\theta + i\\sin\\theta)$$
ដែល $\\cos\\theta = \\frac{a}{r}$ និង $\\sin\\theta = \\frac{b}{r}$។

### ២. រូបមន្តដឺម័រ (Moivre's Formula)
ចំពោះគ្រប់ចំនួនគត់ $n \\in \\mathbb{Z}$៖
$$[r(\\cos\\theta + i\\sin\\theta)]^n = r^n(\\cos n\\theta + i\\sin n\\theta)$$

### ៣. ឫសទី $n$ នៃចំនួនកុំផ្លិច
$$w_k = \\sqrt[n]{r}\\left[\\cos\\left(\\frac{\\theta + 2k\\pi}{n}\\right) + i\\sin\\left(\\frac{\\theta + 2k\\pi}{n}\\right)\\right], \\quad k = 0, 1, 2, \\dots, n-1$$`,
      files: [
        {
          id: 'file-3',
          name: 'ស្លាយបង្រៀន-រូបមន្តដឺម័រ.pptx',
          type: 'pptx',
          size: '4.8 MB',
          url: '#'
        }
      ],
      video: {
        type: 'youtube',
        title: 'ការពន្យល់រូបមន្តដឺម័រ និងការគណនាឫសទី n',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        duration: '31 នាទី'
      }
    }
  ],

  quizzes: [
    {
      id: 'quiz-12-complex',
      classId: 'class-12a',
      lessonId: 'les-12-1-1',
      title: 'តេស្តវាស់ស្ទង់សមត្ថភាពជំពូកទី១៖ ចំនួនកុំផ្លិច (ថ្នាក់ទី១២)',
      description: 'តេស្តវាយតម្លៃលើទម្រង់ពិជគណិត ម៉ូឌុល អាគុយម៉ង់ និងរូបមន្តដឺម័រ។ សូមត្រៀមក្រដាសព្រាងឱ្យបានរួចរាល់។',
      timeLimitMinutes: 30,
      maxAttempts: 2,
      passPercentage: 60,
      shuffleQuestions: false,
      shuffleOptions: false,
      showSolutionOnSubmit: true,
      isPublished: true,
      createdBy: 'user-teacher-1',
      totalPoints: 20,
      questionCount: 5,
      questions: [
        {
          id: 'q-1',
          number: 1,
          type: 'mcq',
          points: 4,
          promptKm: 'គណនាតម្លៃនៃចំនួនកុំផ្លិច $z = (2 + 3i)(1 - 2i)$ រួចកំណត់ផ្នែកពិត និងផ្នែកនិម្មិត៖',
          mathFormula: 'z = (2 + 3i)(1 - 2i)',
          options: [
            { id: 'A', text: '$z = 8 - i$', math: 'z = 8 - i' },
            { id: 'B', text: '$z = 4 - i$', math: 'z = 4 - i' },
            { id: 'C', text: '$z = 8 + i$', math: 'z = 8 + i' },
            { id: 'D', text: '$z = -4 - 7i$', math: 'z = -4 - 7i' }
          ],
          correctOption: 'A',
          explanationKm: `**ដំណោះស្រាយលម្អិត៖**
យើងមាន $z = (2 + 3i)(1 - 2i)$
ពន្លាតតាមច្បាប់ចែកចាយ៖
$z = 2(1) + 2(-2i) + 3i(1) + 3i(-2i)$
$z = 2 - 4i + 3i - 6i^2$
ដោយសារ $i^2 = -1$ នោះ $-6i^2 = -6(-1) = +6$
$z = 2 - i + 6 = 8 - i$
ដូច្នេះ ចម្លើយត្រឹមត្រូវគឺ **A** ($z = 8 - i$)។`
        },
        {
          id: 'q-2',
          number: 2,
          type: 'mcq',
          points: 4,
          promptKm: 'រកម៉ូឌុលនៃចំនួនកុំផ្លិច $z = 3 - 4i$៖',
          mathFormula: '|z| = \\sqrt{a^2 + b^2}',
          options: [
            { id: 'A', text: '$|z| = 7$', math: '|z| = 7' },
            { id: 'B', text: '$|z| = 5$', math: '|z| = 5' },
            { id: 'C', text: '$|z| = \\sqrt{7}$', math: '|z| = \\sqrt{7}' },
            { id: 'D', text: '$|z| = 25$', math: '|z| = 25' }
          ],
          correctOption: 'B',
          explanationKm: `**ដំណោះស្រាយលម្អិត៖**
រូបមន្តម៉ូឌុល៖ $|z| = \\sqrt{a^2 + b^2}$
ក្នុងករណីនេះ $a = 3$ និង $b = -4$
$|z| = \\sqrt{3^2 + (-4)^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$
ដូច្នេះ ម៉ូឌុលគឺ ៥ (ជម្រើស **B**)។`
        },
        {
          id: 'q-3',
          number: 3,
          type: 'true_false',
          points: 3,
          promptKm: 'តើការអះអាងនេះពិត ឬមិនពិត៖ «ប្រសិនបើ $z = r(\\cos\\theta + i\\sin\\theta)$ នោះ $z^4 = r^4(\\cos 4\\theta + i\\sin 4\\theta)$ តាមរូបមន្តដឺម័រ»?',
          mathFormula: 'z^n = r^n(\\cos n\\theta + i\\sin n\\theta)',
          options: [
            { id: 'true', text: 'ពិត (True)' },
            { id: 'false', text: 'មិនពិត (False)' }
          ],
          correctOption: 'true',
          explanationKm: `**ដំណោះស្រាយលម្អិត៖**
ការអះអាងនេះគឺ **ពិត (True)** ព្រោះតាមទ្រឹស្តីបទដឺម័រ (Moivre) ចំពោះគ្រប់ចំនួនគត់ $n \\in \\mathbb{Z}$៖
$[r(\\cos\\theta + i\\sin\\theta)]^n = r^n(\\cos n\\theta + i\\sin n\\theta)$។`
        },
        {
          id: 'q-4',
          number: 4,
          type: 'short_answer',
          points: 4,
          promptKm: 'គណនាតម្លៃនៃកន្សោម $i^{2026}$ (សរសេរចម្លើយជាលេខ -1, 1, i, ឬ -i)៖',
          mathFormula: 'i^{2026} = ?',
          options: [],
          correctOption: '-1',
          explanationKm: `**ដំណោះស្រាយលម្អិត៖**
$2026 = 4 \\times 506 + 2$
ដូច្នេះ $i^{2026} = (i^4)^{506} \\times i^2 = (1)^{506} \\times (-1) = -1$។`
        },
        {
          id: 'q-5',
          number: 5,
          type: 'open_response',
          points: 5,
          promptKm: 'សរសេរចំនួនកុំផ្លិច $z = 1 + i\\sqrt{3}$ ជាទម្រង់ត្រីកោណមាត្រ ដោយបង្ហាញជំហានគណនាម៉ូឌុល $r$ និងអាគុយម៉ង់ $\\theta$ ឱ្យបានច្បាស់លាស់៖',
          mathFormula: 'z = 1 + i\\sqrt{3} \\implies z = r(\\cos\\theta + i\\sin\\theta)',
          options: [],
          correctOption: 'z = 2(cos(pi/3) + i sin(pi/3))',
          explanationKm: `**ដំណោះស្រាយគំរូ និងការដាក់ពិន្ទុ៖**
១. គណនាម៉ូឌុល (២ ពិន្ទុ)៖
$r = \\sqrt{a^2 + b^2} = \\sqrt{1^2 + (\\sqrt{3})^2} = \\sqrt{4} = 2$
២. រកអាគុយម៉ង់ $\\theta$ (២ ពិន្ទុ)៖
$\\cos\\theta = \\frac{1}{2}$ និង $\\sin\\theta = \\frac{\\sqrt{3}}{2} \\implies \\theta = \\frac{\\pi}{3}$
៣. ទម្រង់ត្រីកោណមាត្រ (១ ពិន្ទុ)៖
$z = 2\\left(\\cos\\frac{\\pi}{3} + i\\sin\\frac{\\pi}{3}\\right)$។`
        }
      ]
    }
  ],

  attempts: [
    {
      id: 'att-1',
      quizId: 'quiz-12-complex',
      studentId: 'user-student-1',
      studentName: 'សុខ ដារ៉ា',
      classId: 'class-12a',
      attemptNumber: 1,
      startedAt: '2026-10-24T08:00:00.000Z',
      submittedAt: '2026-10-24T08:22:15.000Z',
      expiresAt: '2026-10-24T08:30:00.000Z',
      totalScore: 18,
      maxScore: 20,
      percentage: 90,
      status: 'graded',
      teacherFeedback: 'ធ្វើបានល្អប្រសើរណាស់! ចម្លើយសំណួរដោះស្រាយលម្អិតត្រឹមត្រូវ និងច្បាស់លាស់ល្អ។',
      answers: {
        'q-1': { response: 'A', isCorrect: true, score: 4 },
        'q-2': { response: 'B', isCorrect: true, score: 4 },
        'q-3': { response: 'true', isCorrect: true, score: 3 },
        'q-4': { response: '-1', isCorrect: true, score: 4 },
        'q-5': { 
          response: 'r = sqrt(1^2 + (sqrt(3))^2) = 2. cos(theta)=1/2, sin(theta)=sqrt(3)/2 => theta = pi/3. z = 2(cos(pi/3) + i sin(pi/3))', 
          isCorrect: true, 
          score: 3,
          teacherNotes: 'សរសេរជំហានបានត្រឹមត្រូវទាំងអស់។'
        }
      }
    }
  ]
};

window.SEED_DATA = SEED_DATA;
