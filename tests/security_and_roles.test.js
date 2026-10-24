/**
 * Automated Security & Permission Verification Test Suite
 * Tests Owner, Teacher, and Student RBAC constraints, Server-level guards,
 * and Student Privacy protection.
 */

// Mock browser localStorage and window environment for Node.js test execution
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;
global.CustomEvent = class CustomEvent {
  constructor(name, params = {}) {
    this.name = name;
    this.detail = params.detail;
  }
};
global.window = {
  localStorage: localStorageMock,
  dispatchEvent: () => {}
};

// Load scripts
require('d:/App VSL/js/data-seed.js');
require('d:/App VSL/js/db.js');
require('d:/App VSL/js/auth.js');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Security, RBAC & Test System Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Initialize DB and Seed Data
  await window.db.init();
  const users = await window.db.getUsers();
  assert(users.length >= 3, `Database initialized with ${users.length} accounts`);

  // ==========================================
  // TEST SUITE 1: OWNER / SUPER ADMIN
  // ==========================================
  console.log('\n--- 1. Testing Super Admin / Owner Privileges & Immutability ---');
  await window.auth.login('owner@khmermath.edu.kh', 'Password123!');
  assert(window.auth.isOwner() === true, 'Owner successfully logged in and isOwner() is true');
  assert(window.auth.canManageUsers() === true, 'Owner canManageUsers() is true');

  // Owner can view audit logs
  const logs = await window.db.getAuditLogs();
  assert(Array.isArray(logs) && logs.length > 0, `Owner successfully retrieved ${logs.length} audit logs`);

  // Owner Protection: Attempting to demote or change Owner role MUST throw error!
  let ownerDemotionBlocked = false;
  try {
    const ownerUser = users.find(u => u.role === 'owner');
    await window.db.updateUserRole(ownerUser.id, 'student');
  } catch (err) {
    ownerDemotionBlocked = true;
    assert(true, `Owner demotion blocked with message: "${err.message}"`);
  }
  assert(ownerDemotionBlocked, 'Owner role is completely immutable and cannot be demoted');

  // Owner Protection: Attempting to delete Owner MUST throw error!
  let ownerDeleteBlocked = false;
  try {
    const ownerUser = users.find(u => u.role === 'owner');
    await window.db.deleteUser(ownerUser.id);
  } catch (err) {
    ownerDeleteBlocked = true;
    assert(true, `Owner deletion blocked with message: "${err.message}"`);
  }
  assert(ownerDeleteBlocked, 'Owner account cannot be deleted');

  // Owner can create and manage teacher account
  const newTeacher = await window.db.createUser({
    fullNameKm: 'លោកគ្រូ សាកល្បង',
    email: 'test.teacher@khmermath.edu.kh',
    password: 'Password123!',
    role: 'teacher',
    schoolName: 'វិទ្យាល័យបារាយណ៍'
  });
  assert(newTeacher && newTeacher.id, 'Owner successfully created new teacher account');

  // ==========================================
  // TEST SUITE 2: TEACHER PERMISSIONS & BOUNDARIES
  // ==========================================
  console.log('\n--- 2. Testing Teacher Permissions & Boundaries ---');
  await window.auth.login('teacher@khmermath.edu.kh', 'Password123!');
  assert(window.auth.isTeacher() === true, 'Teacher logged in and isTeacher() is true');
  assert(window.auth.isOwner() === false, 'Teacher isOwner() is false');

  // Teacher CANNOT view audit logs (Owner only)
  let teacherAuditBlocked = false;
  try {
    await window.db.getAuditLogs();
  } catch (err) {
    teacherAuditBlocked = true;
    assert(true, `Teacher blocked from audit logs: "${err.message}"`);
  }
  assert(teacherAuditBlocked, 'Teacher restricted from viewing audit logs');

  // Teacher CANNOT change user roles
  let teacherRoleChangeBlocked = false;
  try {
    await window.db.updateUserRole('user-student-1', 'teacher');
  } catch (err) {
    teacherRoleChangeBlocked = true;
    assert(true, `Teacher blocked from updating user roles: "${err.message}"`);
  }
  assert(teacherRoleChangeBlocked, 'Teacher cannot change user roles');

  // Teacher CAN create lesson and quiz
  const testLesson = await window.db.createLesson({
    chapterId: 'chap-12-1',
    title: 'មេរៀនតេស្តសិទ្ធិគ្រូ',
    contentKm: 'ខ្លឹមសារមេរៀនសាកល្បង',
    isPublished: true
  });
  assert(testLesson && testLesson.id, 'Teacher successfully created a lesson');

  // ==========================================
  // TEST SUITE 3: STUDENT RESTRICTIONS & PRIVACY
  // ==========================================
  console.log('\n--- 3. Testing Student Restrictions & Data Privacy ---');
  await window.auth.login('student@khmermath.edu.kh', 'Password123!');
  assert(window.auth.isStudent() === true, 'Student logged in and isStudent() is true');
  assert(window.auth.isTeacher() === false, 'Student isTeacher() is false');
  assert(window.auth.isOwner() === false, 'Student isOwner() is false');

  // Security Gate 1: Student calling createLesson() MUST fail with 403 Forbidden!
  let studentCreateLessonBlocked = false;
  try {
    await window.db.createLesson({ chapterId: 'chap-12-1', title: 'Hacked Lesson' });
  } catch (err) {
    studentCreateLessonBlocked = true;
    assert(true, `Student createLesson() blocked: "${err.message}"`);
  }
  assert(studentCreateLessonBlocked, 'Student blocked from creating lessons');

  // Security Gate 2: Student calling deleteLesson() MUST fail!
  let studentDeleteLessonBlocked = false;
  try {
    await window.db.deleteLesson('les-12-1-1');
  } catch (err) {
    studentDeleteLessonBlocked = true;
    assert(true, `Student deleteLesson() blocked: "${err.message}"`);
  }
  assert(studentDeleteLessonBlocked, 'Student blocked from deleting lessons');

  // Security Gate 3: Student calling createQuiz() MUST fail!
  let studentCreateQuizBlocked = false;
  try {
    await window.db.createQuiz({ title: 'Hacked Quiz', classId: 'class-12a' });
  } catch (err) {
    studentCreateQuizBlocked = true;
    assert(true, `Student createQuiz() blocked: "${err.message}"`);
  }
  assert(studentCreateQuizBlocked, 'Student blocked from creating quizzes');

  // Security Gate 4: Student calling gradeStudentAttempt() MUST fail!
  let studentGradingBlocked = false;
  try {
    await window.db.gradeStudentAttempt('att-1', { 'q-1': { score: 100 } });
  } catch (err) {
    studentGradingBlocked = true;
    assert(true, `Student grading blocked: "${err.message}"`);
  }
  assert(studentGradingBlocked, 'Student blocked from grading submissions');

  // Security Gate 5: Student Privacy - Student cannot view other students\' test results
  let studentPrivacyBlocked = false;
  try {
    // Current student is 'user-student-1'. Attempt to fetch 'user-student-2' results:
    await window.db.getStudentAttempts('user-student-2');
  } catch (err) {
    studentPrivacyBlocked = true;
    assert(true, `Student accessing another student results blocked: "${err.message}"`);
  }
  assert(studentPrivacyBlocked, 'Student cannot view another student test submissions');

  // Security Gate 6: Answer Key Protection - Student requesting quiz does NOT receive master answers!
  const sanitizedQuiz = await window.db.getQuizById('quiz-12-complex', 'student');
  let leakedAnswerKey = false;
  for (const q of sanitizedQuiz.questions) {
    if (q.correctOption !== undefined || q.explanationKm !== undefined) {
      leakedAnswerKey = true;
      break;
    }
  }
  assert(!leakedAnswerKey, 'Sanitized quiz does NOT leak correctOption or explanationKm to student before test completion');

  // ==========================================
  // TEST SUITE 4: SERVER-ENFORCED TEST SUBMISSION
  // ==========================================
  console.log('\n--- 4. Testing Server-Enforced Test Submission & Grading ---');
  // Student starts attempt
  const attempt = await window.db.startQuizAttempt('quiz-12-complex', 'user-student-1', 'សុខ ដារ៉ា', 'MTH-12A');
  assert(attempt && attempt.id, `Student started quiz attempt (${attempt.id})`);
  assert(attempt.expiresAt !== undefined, `Server set expiration timestamp: ${attempt.expiresAt}`);

  // Student submits answers: Question 1 = 'A' (correct, 4pts), Question 2 = 'B' (correct, 4pts), Question 3 = 'true' (correct, 3pts)
  const submitted = await window.db.submitQuizAttempt(attempt.id, {
    'q-1': 'A',
    'q-2': 'B',
    'q-3': 'true',
    'q-4': '-1'
  });

  assert(submitted.status === 'submitted' || submitted.status === 'graded', `Attempt submitted with status: ${submitted.status}`);
  assert(submitted.totalScore === 15, `Server auto-graded objective questions accurately: 15 points awarded (expected 15)`);
  assert(submitted.answers['q-1'].isCorrect === true, 'Question 1 graded as correct');

  // Anti-Tampering: Student cannot re-submit a finished test
  let resubmitBlocked = false;
  try {
    await window.db.submitQuizAttempt(attempt.id, { 'q-1': 'B' });
  } catch (err) {
    resubmitBlocked = true;
    assert(true, `Re-submitting finished test blocked: "${err.message}"`);
  }
  assert(resubmitBlocked, 'Finished test cannot be altered by student after submission');

  // ==========================================
  // TEST SUITE 5: PERMANENT OWNER GMAIL SYSTEM & ANTI-TAMPERING
  // ==========================================
  console.log('\n--- 5. Testing Permanent Owner Gmail & Database Auto-Promotion ---');
  const testOwnerEmail = 'vayseangleng@gmail.com';

  // 1. Set Owner Gmail via database service
  await window.db.setOwnerEmail(testOwnerEmail, false);
  assert(window.db.getOwnerEmail() === testOwnerEmail, `Owner email successfully configured as: ${window.db.getOwnerEmail()}`);

  // 2. Register account with Owner Gmail -> Auto-promoted to Super Admin
  const newOwnerAccount = await window.auth.register({
    fullNameKm: 'ម្ចាស់កម្មវិធីពិតប្រាកដ',
    email: testOwnerEmail,
    password: 'OwnerSecurePassword123!',
    requestedRole: 'student' // Even if requested as student, system recognizes genuine Owner!
  });
  assert(newOwnerAccount.role === 'owner' && newOwnerAccount.isOwner === true, 'Account with configured Owner Gmail is automatically granted Super Admin role');

  // 3. Login as new Owner Gmail
  await window.auth.login(testOwnerEmail, 'OwnerSecurePassword123!');
  assert(window.auth.isOwner() === true, 'Owner successfully logged in with Owner Gmail and isOwner() is true');
  assert(window.auth.canManageUsers() === true, 'Owner has canManageUsers() access');

  // 4. Anti-Tampering: Teacher tries to hack in-memory role to 'owner'
  await window.auth.login('teacher@khmermath.edu.kh', 'Password123!');
  assert(window.auth.isOwner() === false, 'Teacher logged in as teacher');

  // Attempt client-side memory tampering
  window.auth.currentUser.role = 'owner';
  window.auth.currentUser.isOwner = true;
  let tamperCaught = false;
  try {
    await window.db.getAuditLogs(); // Requires true owner
  } catch (err) {
    tamperCaught = true;
    assert(true, `Client-side role tampering detected and blocked: "${err.message}"`);
  }
  assert(tamperCaught, 'Server/DB level RBAC prevents in-memory role tampering from accessing protected resources');

  // 5. Verification that non-owner cannot be promoted to owner
  let unauthorizedOwnerPromotion = false;
  try {
    await window.db.updateUserRole('user-student-1', 'owner');
  } catch (err) {
    unauthorizedOwnerPromotion = true;
    assert(true, `Promoting non-owner to Owner role blocked: "${err.message}"`);
  }
  assert(unauthorizedOwnerPromotion, 'Only genuine configured Owner Gmail can hold Owner role');

  // 6. Verification of data integrity (no students, teachers, classes, or quizzes were lost)
  const allUsers = await window.db.getUsers();
  const allClasses = await window.db.getClasses();
  const allQuizzes = await window.db.getQuizzes();
  assert(allUsers.length >= 4, `All user records preserved (${allUsers.length} total)`);
  assert(allClasses.length >= 1, `All classes preserved (${allClasses.length} total)`);
  assert(allQuizzes.length >= 1, `All quizzes preserved (${allQuizzes.length} total)`);

  console.log('\n====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('🎉 ALL SECURITY & RBAC CONSTRAINTS MET PERFECTLY!');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});
