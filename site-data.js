// site-data.js — Firestore-backed data layer.
//
// Every visitor's browser reads the SAME data from Firebase (unlike the
// old localStorage version, which was per-browser only). Only a signed-in
// admin (see admin.html) can write, enforced by the Firestore security
// rules — not by anything in this file.
//
// Requires firebase-config.js to be loaded first on every page that
// uses this file.

const CATEGORIES = [
  "latest-jobs",
  "admit-card",
  "results",
  "syllabus",
  "admission",
  "miscellaneous",
  "blog"
];

const CATEGORY_LABELS = {
  "latest-jobs": "Latest Jobs",
  "admit-card": "Admit Card",
  "results": "Results",
  "syllabus": "Syllabus",
  "admission": "Admission",
  "miscellaneous": "Miscellaneous",
  "blog": "Blog"
};

function docId(cat, id) {
  return cat + "__" + id;
}

function emptyPost() {
  return {
    id: "", title: "", meta: "", metaClass: "",
    organization: "", postDate: "", lastDate: "",
    quickFacts: [], intro: "",
    importantDates: [], fee: [], ageLimit: [], vacancy: [],
    howToApply: [], selectionProcess: [],
    applyLink: "", notificationLink: "", officialWebsite: "", admitCardLink: "",
    // Blog-only fields (harmless/unused on job-style categories):
    author: "",
    content: "" // HTML string produced by the rich-text editor
  };
}

// Returns all posts in a category, most-recently-updated first.
// Sorting happens in the browser (not via Firestore orderBy) so this
// never requires creating a composite index in the Firebase console.
async function getCategoryPosts(cat) {
  const snap = await db.collection("postings")
    .where("cat", "==", cat)
    .get();
  const posts = snap.docs.map(function (d) { return d.data(); });
  posts.sort(function (a, b) {
    const aTime = (a.updatedAt && a.updatedAt.toMillis) ? a.updatedAt.toMillis() : 0;
    const bTime = (b.updatedAt && b.updatedAt.toMillis) ? b.updatedAt.toMillis() : 0;
    return bTime - aTime; // descending: newest first
  });
  return posts;
}

async function getPost(cat, id) {
  const doc = await db.collection("postings").doc(docId(cat, id)).get();
  return doc.exists ? doc.data() : null;
}

// Requires the caller to be signed in (enforced by Firestore rules).
async function upsertPost(cat, post) {
  const data = Object.assign({}, post, {
    cat: cat,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  await db.collection("postings").doc(docId(cat, post.id)).set(data);
}

async function deletePost(cat, id) {
  await db.collection("postings").doc(docId(cat, id)).delete();
}

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// One-time convenience: fills Firestore with your original site content
// if (and only if) the "postings" collection is completely empty. Safe
// to call repeatedly — it's a no-op once any data exists. Called from
// admin.html after you log in for the first time.
async function seedIfEmpty() {
  const snap = await db.collection("postings").limit(1).get();
  if (!snap.empty) return false;

  const data = defaultData();
  const batch = db.batch();
  Object.keys(data).forEach(function (cat) {
    data[cat].forEach(function (post) {
      const ref = db.collection("postings").doc(docId(cat, post.id));
      batch.set(ref, Object.assign({}, post, {
        cat: cat,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
    });
  });
  await batch.commit();
  return true;
}

function defaultData() {
  return {
    "latest-jobs": [
      {
        id: "sbi-po",
        title: "SBI PO 2026 Recruitment — 1500 Posts",
        meta: "Last date: 08 Jul 2026",
        metaClass: "",
        organization: "State Bank of India",
        postDate: "02 Jul 2026",
        lastDate: "08 Jul 2026",
        quickFacts: [
          { label: "Organization", value: "State Bank of India" },
          { label: "Total Posts", value: "1500" },
          { label: "Application Start", value: "18 June 2026" },
          { label: "Last Date to Apply", value: "08 July 2026" },
          { label: "Fee Last Date", value: "08 July 2026" },
          { label: "Exam Date", value: "Expected in August 2026" }
        ],
        intro: "The State Bank of India has released a notification inviting online applications for various Probationary Officer posts across public sector banks. Candidates meeting the eligibility criteria can apply through the official website before the last date.",
        importantDates: [
          { label: "Application Begin", value: "18 June 2026" },
          { label: "Last Date for Apply Online", value: "08 July 2026" },
          { label: "Last Date for Fee Payment", value: "08 July 2026" },
          { label: "Correction Window", value: "22 – 08 July 2026" },
          { label: "Exam Date", value: "Expected in August 2026" },
          { label: "Admit Card Available", value: "Before exam" }
        ],
        fee: [
          { label: "General / OBC / EWS", value: "₹750/-" },
          { label: "SC / ST / PwD / Ex-Servicemen / Women", value: "Exempted" },
          { label: "Payment Mode", value: "Online (Debit Card / Credit Card / Net Banking / UPI)" }
        ],
        ageLimit: [
          { label: "Minimum Age", value: "21 Years" },
          { label: "Maximum Age", value: "30 Years" },
          { label: "Age Relaxation", value: "As per government rules for reserved categories" }
        ],
        vacancy: [
          { label: "Post Name", value: "Probationary Officer" },
          { label: "Total Posts", value: "1500" },
          { label: "Eligibility", value: "Bachelor's Degree from a recognised university" }
        ],
        howToApply: [
          "Read the official notification carefully before applying.",
          "Click the \"Apply Online\" link below and complete registration.",
          "Fill in the application form and upload photo / signature.",
          "Pay the application fee (if applicable).",
          "Submit the form and keep a printout for future reference."
        ],
        selectionProcess: [
          "Phase-1 (Computer Based Exam)",
          "Phase-2 (Computer Based Exam)",
          "Psychometric Test",
          "Interview & Group Exercises",
          "Document Verification",
          "Medical Examination (if applicable)"
        ],
        applyLink: "https://ibpsreg.ibps.in/sbipojun26/",
        notificationLink: "https://sbi.bank.in/csfile/18062026_1_Detailed_Adv.2026.pdf?t=1781759726353",
        officialWebsite: "https://sbi.bank.in/web/careers/current-openings"
      },
      {
        id: "ssc-jobs",
        title: "SSC CGL 2026 Recruitment — 8,411 Posts",
        meta: "Last date: 20 Jul 2026",
        metaClass: "new",
        organization: "Staff Selection Commission",
        postDate: "02 Jul 2026",
        lastDate: "20 Jul 2026",
        quickFacts: [
          { label: "Organization", value: "Staff Selection Commission" },
          { label: "Total Posts", value: "8,411" },
          { label: "Application Start", value: "02 Jul 2026" },
          { label: "Last Date to Apply", value: "20 Jul 2026" },
          { label: "Fee Last Date", value: "21 Jul 2026" },
          { label: "Exam Date", value: "To be announced" }
        ],
        intro: "The Staff Selection Commission has released a notification inviting online applications for various Group B and Group C posts across central government departments. Candidates meeting the eligibility criteria can apply through the official website before the last date.",
        importantDates: [
          { label: "Application Begin", value: "02 Jul 2026" },
          { label: "Last Date for Apply Online", value: "20 Jul 2026" },
          { label: "Last Date for Fee Payment", value: "21 Jul 2026" },
          { label: "Correction Window", value: "22 – 24 Jul 2026" },
          { label: "Exam Date", value: "To be announced" },
          { label: "Admit Card Available", value: "Before exam" }
        ],
        fee: [
          { label: "General / OBC / EWS", value: "₹100/-" },
          { label: "SC / ST / PwD / Ex-Servicemen / Women", value: "Exempted" },
          { label: "Payment Mode", value: "Online (Debit Card / Credit Card / Net Banking / UPI)" }
        ],
        ageLimit: [
          { label: "Minimum Age", value: "18 Years" },
          { label: "Maximum Age", value: "32 Years" },
          { label: "Age Relaxation", value: "As per government rules for reserved categories" }
        ],
        vacancy: [
          { label: "Post Name", value: "Assistant / Inspector / Auditor" },
          { label: "Total Posts", value: "8,411" },
          { label: "Eligibility", value: "Bachelor's Degree from a recognised university" }
        ],
        howToApply: [
          "Read the official notification carefully before applying.",
          "Click the \"Apply Online\" link below and complete registration.",
          "Fill in the application form and upload photo / signature.",
          "Pay the application fee (if applicable).",
          "Submit the form and keep a printout for future reference."
        ],
        selectionProcess: [
          "Tier-1 (Computer Based Exam)",
          "Tier-2 (Computer Based Exam)",
          "Document Verification",
          "Medical Examination (if applicable)"
        ],
        applyLink: "",
        notificationLink: "",
        officialWebsite: ""
      },
      {
        id: "ibps-clerk-2026", title: "IBPS Clerk Online Form 2026", meta: "Last date: 15 Jul 2026", metaClass: "",
        organization: "IBPS", postDate: "02 Jul 2026", lastDate: "15 Jul 2026",
        quickFacts: [], intro: "IBPS has invited applications for the Clerk cadre recruitment for the year 2026.",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: ""
      },
      {
        id: "rrb-ntpc-2026", title: "Indian Railways RRB NTPC Notification", meta: "Closing in 2 days", metaClass: "urgent",
        organization: "Railway Recruitment Board", postDate: "02 Jul 2026", lastDate: "",
        quickFacts: [], intro: "", importantDates: [], fee: [], ageLimit: [], vacancy: [],
        howToApply: [], selectionProcess: [], applyLink: "", notificationLink: "", officialWebsite: ""
      }
    ],
    "admit-card": [
      { id: "upsc-prelims-admit-2026", title: "UPSC Civil Services Prelims Admit Card", meta: "Download open", metaClass: "",
        organization: "UPSC", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "sbi-po-mains-admit-2026", title: "SBI PO Mains Admit Card 2026", meta: "Released today", metaClass: "new",
        organization: "State Bank of India", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "ctet-2026-hall-ticket", title: "CTET July 2026 Hall Ticket", meta: "Download open", metaClass: "",
        organization: "CBSE", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "nda-na-2026-admit", title: "NDA & NA (I) 2026 Admit Card", meta: "Download open", metaClass: "",
        organization: "UPSC", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "ssc-mts-admit", title: "SSC MTS Tier-1 Admit Card", meta: "Download closes soon", metaClass: "urgent",
        organization: "Staff Selection Commission", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "state-police-hall-ticket", title: "State Police Constable Hall Ticket", meta: "Download open", metaClass: "",
        organization: "", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" }
    ],
    "results": [
      { id: "neet-ug-2026-result", title: "NEET UG 2026 Result Declared", meta: "Announced today", metaClass: "new",
        organization: "NTA", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "rrb-group-d-result", title: "RRB Group D Final Result", meta: "Merit list out", metaClass: "",
        organization: "Railway Recruitment Board", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "state-psc-cutoff", title: "State PSC Prelims Cut-off Marks", meta: "Merit list out", metaClass: "",
        organization: "State PSC", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "ssc-chsl-tier2-result", title: "SSC CHSL Tier-2 Result", meta: "Merit list out", metaClass: "",
        organization: "Staff Selection Commission", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "ibps-rrb-officer-result", title: "IBPS RRB Officer Scale-1 Result", meta: "Merit list out", metaClass: "",
        organization: "IBPS", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "ssc-cgl-tier1-answerkey", title: "Answer Key: SSC CGL Tier-1 (Objections open)", meta: "Objections open", metaClass: "new",
        organization: "Staff Selection Commission", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" }
    ],
    "syllabus": [
      { id: "ssc-cgl-syllabus", title: "SSC CGL Tier-1 Detailed Syllabus & Pattern", meta: "PDF available", metaClass: "",
        organization: "Staff Selection Commission", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "bank-po-syllabus", title: "Bank PO Prelims + Mains Syllabus", meta: "PDF available", metaClass: "",
        organization: "", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "upsc-syllabus", title: "UPSC Prelims & Mains Full Syllabus", meta: "PDF available", metaClass: "",
        organization: "UPSC", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "rrb-ntpc-syllabus", title: "Railway NTPC CBT-1 & CBT-2 Syllabus", meta: "PDF available", metaClass: "",
        organization: "Railway Recruitment Board", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "state-psc-syllabus", title: "State PSC Combined Exam Syllabus", meta: "PDF available", metaClass: "",
        organization: "State PSC", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "police-constable-syllabus", title: "Police Constable Physical & Written Syllabus", meta: "PDF available", metaClass: "",
        organization: "", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" }
    ],
    "admission": [
      { id: "university-admission-2026", title: "University Admission Notices 2026-27", meta: "Guide", metaClass: "",
        organization: "", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "college-admission-merit-list", title: "College Admission Merit List 2026", meta: "Released", metaClass: "new",
        organization: "", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "online-counselling-schedule", title: "Online Counselling Schedule 2026", meta: "Guide", metaClass: "",
        organization: "", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" }
    ],
    "miscellaneous": [
      { id: "dob-correction-guide", title: "How to Correct DOB in SSC Application Form", meta: "Guide", metaClass: "",
        organization: "", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "age-relaxation-rules", title: "Age Relaxation Rules for Reserved Categories", meta: "Guide", metaClass: "",
        organization: "", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "govt-exams-july-2026", title: "List of Govt Exams in July 2026", meta: "Guide", metaClass: "",
        organization: "", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "exam-day-checklist", title: "Document Checklist for Exam Day", meta: "Guide", metaClass: "",
        organization: "", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" },
      { id: "answer-key-objection-guide", title: "How to Raise an Objection on Answer Key", meta: "Guide", metaClass: "",
        organization: "", postDate: "", lastDate: "", quickFacts: [], intro: "",
        importantDates: [], fee: [], ageLimit: [], vacancy: [], howToApply: [], selectionProcess: [],
        applyLink: "", notificationLink: "", officialWebsite: "" }
    ],
    "blog": [
      {
        id: "how-to-prepare-ssc-cgl",
        title: "How to Prepare for SSC CGL in 3 Months",
        meta: "Guide",
        metaClass: "new",
        author: "Editorial Team",
        postDate: "01 Jul 2026",
        content: "<p>Preparing for SSC CGL in a short timeframe is challenging but achievable with a focused, disciplined study plan. The exam tests quantitative aptitude, reasoning, English, and general awareness — spreading your time evenly across all four sections early on pays off later.</p><p>Start by taking a full-length mock test to identify your weak areas before building a study schedule. Spend the first month on building fundamentals in math and reasoning, since these sections improve most with practice. Use the second month for topic-wise practice sets and start attempting timed mocks twice a week.</p><p>In the final month, shift almost entirely to full-length mock tests under exam conditions, followed by careful review of every mistake. General awareness should be revised daily in short bursts rather than crammed at the end — short daily revision beats long infrequent sessions for retention.</p><p>Finally, don't neglect accuracy for speed. SSC CGL has negative marking, so a slower, more accurate approach in the final weeks often scores better than rushing through questions.</p>"
      },
      {
        id: "common-mistakes-bank-exams",
        title: "5 Common Mistakes Candidates Make in Bank Exams",
        meta: "Guide",
        metaClass: "",
        author: "Editorial Team",
        postDate: "28 Jun 2026",
        content: "<p>Bank exams like IBPS and SBI PO are highly competitive, and small avoidable mistakes often separate selected candidates from the rest. Here are five of the most common ones.</p><ol><li>Ignoring sectional timing. Many candidates spend too long on one section and rush through others, hurting their overall score even when their individual section knowledge is strong.</li><li>Skipping the official notification's fine print — details like age relaxation, correction windows, and document requirements are frequently missed.</li><li>Neglecting reading comprehension practice, which typically carries significant weight in the English section.</li><li>Not simulating exam-day conditions during practice — practicing without a timer doesn't prepare you for the real exam's pressure.</li><li>Poor time management in the final 10 minutes — many candidates leave easy, guaranteed-score questions unanswered because they run out of time on harder ones earlier.</li></ol>"
      }
    ]
  };
}
