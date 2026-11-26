import { DiagnosticStatus, Locale, Platform, PostFormat } from '../types/account';

export const PLATFORM_META: Record<
  Platform,
  { nameAr: string; nameEn: string; short: string }
> = {
  x: { nameAr: 'إكس (تويتر)', nameEn: 'X (Twitter)', short: 'X' },
  instagram: { nameAr: 'إنستغرام', nameEn: 'Instagram', short: 'IG' },
  tiktok: { nameAr: 'تيك توك', nameEn: 'TikTok', short: 'TT' },
  youtube: { nameAr: 'يوتيوب', nameEn: 'YouTube', short: 'YT' },
  linkedin: { nameAr: 'لينكدإن', nameEn: 'LinkedIn', short: 'IN' },
};

export const FORMAT_LABELS: Record<PostFormat, { ar: string; en: string }> = {
  video: { ar: 'فيديو قصير / ريلز', en: 'Short Video / Reel' },
  carousel: { ar: 'كاروسيل / شرائح', en: 'Carousel Slides' },
  thread: { ar: 'سلسلة نصية / مقال', en: 'Thread / Deep Post' },
  image: { ar: 'صورة ثابتة', en: 'Single Image' },
};

export const STATUS_LABELS: Record<DiagnosticStatus, { ar: string; en: string }> = {
  optimal: { ar: 'ممتاز', en: 'Optimal' },
  healthy: { ar: 'صحي', en: 'Healthy' },
  attention: { ar: 'يحتاج تحسين', en: 'Needs Focus' },
  warning: { ar: 'تحذير', en: 'Warning' },
};

export const TIER_LABELS: Record<
  'nano' | 'micro' | 'mid' | 'macro' | 'mega',
  { ar: string; en: string }
> = {
  nano: { ar: 'نانو (<10K)', en: 'Nano (<10K)' },
  micro: { ar: 'مايكرو (10K–100K)', en: 'Micro (10K–100K)' },
  mid: { ar: 'متوسط (100K–500K)', en: 'Mid-Tier (100K–500K)' },
  macro: { ar: 'ماكرو (500K–1M)', en: 'Macro (500K–1M)' },
  mega: { ar: 'ميجا (+1M)', en: 'Mega (1M+)' },
};

export const COPY: Record<
  Locale,
  {
    brand: string;
    navOverview: string;
    navPosts: string;
    navCompare: string;
    navSimulator: string;
    savedAccounts: string;
    analyzeNewAccount: string;
    quickSearch: string;
    exportJson: string;
    exportCsv: string;
    formulasOn: string;
    formulasOff: string;
    themeLight: string;
    themeDark: string;
    resetData: string;
    // KPIs
    kpiFollowers: string;
    kpiEngagement: string;
    kpiAvgViews: string;
    kpiEstValue: string;
    kpiAuthenticity: string;
    monthlyGrowth: string;
    vsBenchmark: string;
    ofFollowers: string;
    perPost: string;
    // Sections
    growthTrajectory: string;
    followersSeries: string;
    engagementSeries: string;
    diagnosticAudit: string;
    formatPerformance: string;
    quickEditMetrics: string;
    saveChanges: string;
    cancel: string;
    deleteAccount: string;
    // Posts ledger
    postsLedgerTitle: string;
    logNewPost: string;
    searchPostsPlaceholder: string;
    allFormats: string;
    colTitle: string;
    colDate: string;
    colFormat: string;
    colViews: string;
    colLikes: string;
    colComments: string;
    colSharesSaves: string;
    colEr: string;
    noPostsMatch: string;
    // Compare
    compareTitle: string;
    compareSubtitle: string;
    selectUpToThree: string;
    metricCol: string;
    leader: string;
    // Simulator
    simTitle: string;
    simSubtitle: string;
    simWeeklyPosts: string;
    simErLift: string;
    simCpmRate: string;
    simSponsoredMonthly: string;
    simHorizon: string;
    simProjectedFollowers: string;
    simProjectedReach: string;
    simProjectedRevenue: string;
    simResetDefaults: string;
    // Modals
    modalAddTitle: string;
    tabManual: string;
    tabImport: string;
    loadSampleJson: string;
    loadSampleCsv: string;
    importNow: string;
    createAccount: string;
    commandPlaceholder: string;
    noCommandsFound: string;
  }
> = {
  ar: {
    brand: 'نبض الحساب',
    navOverview: 'التحليل الشامل',
    navPosts: 'سجل المنشورات',
    navCompare: 'مقارنة الحسابات',
    navSimulator: 'محاكي النمو والعائد',
    savedAccounts: 'الحسابات المحللة',
    analyzeNewAccount: 'تحليل حساب جديد',
    quickSearch: 'بحث سريع أو أمر...',
    exportJson: 'تصدير JSON',
    exportCsv: 'تصدير CSV',
    formulasOn: 'إخفاء المعادلات',
    formulasOff: 'عرض المعادلات',
    themeLight: 'المظهر الفاتح',
    themeDark: 'المظهر الداكن',
    resetData: 'استعادة البيانات الافتراضية',
    kpiFollowers: 'إجمالي المتابعين',
    kpiEngagement: 'معدل التفاعل (ER)',
    kpiAvgViews: 'متوسط المشاهدات',
    kpiEstValue: 'قيمة الإعلان التقديرية',
    kpiAuthenticity: 'مؤشر جودة الجمهور',
    monthlyGrowth: 'نمو شهري',
    vsBenchmark: 'عن متوسط المنصة',
    ofFollowers: 'من حجم المتابعين',
    perPost: 'للمنشور الواحد',
    growthTrajectory: 'مسار المتابعين والتفاعل',
    followersSeries: 'المتابعون',
    engagementSeries: 'معدل التفاعل %',
    diagnosticAudit: 'التشخيص التفصيلي والتوصيات',
    formatPerformance: 'أداء أنواع المحتوى',
    quickEditMetrics: 'تعديل أرقام الحساب',
    saveChanges: 'حفظ التعديلات',
    cancel: 'إلغاء',
    deleteAccount: 'حذف الحساب',
    postsLedgerTitle: 'سجل أداء المنشورات',
    logNewPost: 'إضافة منشور',
    searchPostsPlaceholder: 'ابحث في عنوان المنشور...',
    allFormats: 'كل الصيغ',
    colTitle: 'المنشور',
    colDate: 'التاريخ',
    colFormat: 'الصيغة',
    colViews: 'المشاهدات',
    colLikes: 'الإعجابات',
    colComments: 'التعليقات',
    colSharesSaves: 'مشاركة / حفظ',
    colEr: 'التفاعل',
    noPostsMatch: 'لا توجد منشورات مطابقة للفلاتر الحالية.',
    compareTitle: 'مقارنة الحسابات جنباً إلى جنب',
    compareSubtitle: 'اختر حسابين أو ثلاثة لمقارنة الكفاءة، سرعة النمو، والقيمة الإعلانية بدقة.',
    selectUpToThree: 'اختر حتى 3 حسابات للمقارنة',
    metricCol: 'المعيار',
    leader: 'الأعلى',
    simTitle: 'محاكي النمو والعائد الإعلاني',
    simSubtitle: 'اختبر سيناريوهات زيادة وتيرة النشر أو رفع التفاعل وشاهد الأثر التراكمي فوراً.',
    simWeeklyPosts: 'وتيرة النشر الأسبوعية المستهدفة',
    simErLift: 'تحسّن معدل التفاعل المتوقع',
    simCpmRate: 'متوسط سعر الألف مشاهدة (CPM)',
    simSponsoredMonthly: 'عدد الرعايات الشهرية',
    simHorizon: 'الأفق الزمني',
    simProjectedFollowers: 'المتابعون المتوقعون',
    simProjectedReach: 'الوصول الشهري المتوقع',
    simProjectedRevenue: 'الدخل الإعلاني الشهري',
    simResetDefaults: 'إعادة الضبط',
    modalAddTitle: 'إضافة وتحليل حساب جديد',
    tabManual: 'إدخال مباشر',
    tabImport: 'استيراد JSON / CSV',
    loadSampleJson: 'تعبئة نموذج JSON',
    loadSampleCsv: 'تعبئة نموذج CSV',
    importNow: 'استيراد وتحليل',
    createAccount: 'بدء التحليل',
    commandPlaceholder: 'انتقل إلى حساب، قسم، أو نفّذ أمراً...',
    noCommandsFound: 'لا توجد نتائج مطابقة.',
  },
  en: {
    brand: 'Nabdh Studio',
    navOverview: 'Account Audit',
    navPosts: 'Posts Ledger',
    navCompare: 'Compare Accounts',
    navSimulator: 'Growth & Valuation',
    savedAccounts: 'Tracked Accounts',
    analyzeNewAccount: 'Analyze Account',
    quickSearch: 'Jump or run command...',
    exportJson: 'Export JSON',
    exportCsv: 'Export CSV',
    formulasOn: 'Hide Formulas',
    formulasOff: 'Inspect Formulas',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    resetData: 'Reset Defaults',
    kpiFollowers: 'Total Followers',
    kpiEngagement: 'Engagement Rate',
    kpiAvgViews: 'Avg. Views / Post',
    kpiEstValue: 'Est. Post Value',
    kpiAuthenticity: 'Audience Quality',
    monthlyGrowth: 'monthly growth',
    vsBenchmark: 'vs platform median',
    ofFollowers: 'of follower base',
    perPost: 'per sponsored post',
    growthTrajectory: 'Followers & Engagement Trajectory',
    followersSeries: 'Followers',
    engagementSeries: 'Engagement %',
    diagnosticAudit: 'Diagnostic Breakdown & Actions',
    formatPerformance: 'Content Format Performance',
    quickEditMetrics: 'Edit Metrics',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    deleteAccount: 'Delete Account',
    postsLedgerTitle: 'Post Performance Ledger',
    logNewPost: 'Log Post',
    searchPostsPlaceholder: 'Search post title...',
    allFormats: 'All Formats',
    colTitle: 'Post Title',
    colDate: 'Date',
    colFormat: 'Format',
    colViews: 'Views',
    colLikes: 'Likes',
    colComments: 'Comments',
    colSharesSaves: 'Shares / Saves',
    colEr: 'ER %',
    noPostsMatch: 'No posts match your current search or filter.',
    compareTitle: 'Side-by-Side Account Comparison',
    compareSubtitle: 'Select 2 or 3 accounts to benchmark efficiency, reach velocity, and sponsorship value.',
    selectUpToThree: 'Select up to 3 accounts',
    metricCol: 'Metric',
    leader: 'Leader',
    simTitle: 'Growth & Sponsorship Valuation Lab',
    simSubtitle: 'Adjust posting cadence, engagement lift, and CPM to model compounding growth.',
    simWeeklyPosts: 'Target Weekly Cadence',
    simErLift: 'Projected Engagement Lift',
    simCpmRate: 'Effective CPM Rate (USD)',
    simSponsoredMonthly: 'Sponsored Posts / Month',
    simHorizon: 'Time Horizon',
    simProjectedFollowers: 'Projected Followers',
    simProjectedReach: 'Projected Monthly Reach',
    simProjectedRevenue: 'Est. Monthly Revenue',
    simResetDefaults: 'Reset',
    modalAddTitle: 'Analyze New Account',
    tabManual: 'Manual Entry',
    tabImport: 'Import JSON / CSV',
    loadSampleJson: 'Load JSON Sample',
    loadSampleCsv: 'Load CSV Sample',
    importNow: 'Import & Analyze',
    createAccount: 'Run Analysis',
    commandPlaceholder: 'Switch account, jump to view, or run action...',
    noCommandsFound: 'No matching commands.',
  },
};
