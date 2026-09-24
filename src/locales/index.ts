/**
 * Comprehensive Multi-language Localization Dictionary for QR SplitPay India v2.0
 * Supported Languages: English (en), Hindi (hi), Odia (or)
 */

import { SupportedLanguage } from '../types';

export interface Translations {
  appName: string;
  tagline: string;
  subtitle: string;
  nav: {
    home: string;
    payments: string;
    customers: string;
    reports: string;
    history: string;
    settings: string;
  };
  metrics: {
    todaysCollection: string;
    pendingAmount: string;
    activeSessions: string;
    completedPayments: string;
    customersCount: string;
    verifiedNote: string;
  };
  actions: {
    newPayment: string;
    createPayment: string;
    markAsReceived: string;
    keepPending: string;
    checkPayment: string;
    shareQr: string;
    saveQr: string;
    copyUpi: string;
    openUpiApp: string;
    printReceipt: string;
    downloadReceipt: string;
    viewDetails: string;
    cancel: string;
    confirmReceived: string;
    tryDemo: string;
    resetDemo: string;
    exportData: string;
    clearData: string;
    getStarted: string;
    next: string;
    back: string;
    skip: string;
    finish: string;
    saveProfile: string;
    searchPlaceholder: string;
    syncNow: string;
    restoreData: string;
    deleteAccount: string;
    openCRM: string;
    viewReports: string;
  };
  splitMethods: {
    equal: string;
    equalDesc: string;
    maxInstallment: string;
    maxInstallmentDesc: string;
    custom: string;
    customDesc: string;
    numInstallments: string;
    maxAmountPerQr: string;
    customAmounts: string;
    addInstallment: string;
    removeInstallment: string;
    allocationRemaining: string;
    allocationExceeded: string;
    allocationExact: string;
  };
  form: {
    upiIdLabel: string;
    upiIdPlaceholder: string;
    upiIdError: string;
    payeeNameLabel: string;
    totalAmountLabel: string;
    totalAmountPlaceholder: string;
    totalAmountError: string;
    customerNameLabel: string;
    customerPhoneLabel: string;
    invoiceLabel: string;
    notesLabel: string;
    splitMethodLabel: string;
    calculationPreview: string;
  };
  states: {
    DRAFT: string;
    QR_READY: string;
    PAYMENT_INITIATED: string;
    PENDING: string;
    SUCCESS: string;
    FAILED: string;
    CANCELLED: string;
    MANUALLY_CONFIRMED: string;
    ACTIVE: string;
    PARTIALLY_PAID: string;
    COMPLETED: string;
    PAYMENT_ISSUE: string;
  };
  customers: {
    title: string;
    addNew: string;
    searchPlaceholder: string;
    emptyTitle: string;
    emptyDesc: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    totalRecorded: string;
    totalPaid: string;
    totalPending: string;
    sessionsCount: string;
    newPaymentForCustomer: string;
    editCustomer: string;
    deleteCustomer: string;
  };
  reports: {
    title: string;
    confirmedRevenue: string;
    pendingPipeline: string;
    completionRate: string;
    averageTicket: string;
    totalCustomers: string;
    honestNotice: string;
    exportCsv: string;
    exportCsvSubtitle: string;
    exportSummaryBtn: string;
    exportDetailedBtn: string;
    exportSuccess: string;
    exportEmptyWarning: string;
    filterAll: string;
    filterActive: string;
    filterCompleted: string;
  };
  cloudSync: {
    synced: string;
    syncing: string;
    offline: string;
    error: string;
    syncNow: string;
    lastSync: string;
  };
  auth: {
    continueWithGoogle: string;
    signIn: string;
    signOut: string;
    welcomeBack: string;
    cloudDataFound: string;
    syncData: string;
    googleDriveNote: string;
  };
  subscription: {
    free: string;
    pro: string;
    business: string;
    upgrade: string;
    currentPlan: string;
  };
  overdue: {
    badge: string;
    overdueParts: string;
    actionRequired: string;
    sessionsAlertTitle: string;
    sessionsAlertDesc: string;
    reviewButton: string;
    filterAll: string;
    filterOverdue: string;
  };
  onboarding: {
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    step4Title: string;
    step4Desc: string;
  };
  verificationModal: {
    title: string;
    amount: string;
    upiId: string;
    warning: string;
    cancelBtn: string;
    confirmBtn: string;
    manualTag: string;
  };
  receipt: {
    title: string;
    subtitle: string;
    customer: string;
    merchant: string;
    merchantUpi: string;
    invoiceNo: string;
    date: string;
    totalAmount: string;
    amountPaid: string;
    amountRemaining: string;
    installmentBreakdown: string;
    disclaimer: string;
    status: string;
  };
  emptyStates: {
    noSessionsTitle: string;
    noSessionsDesc: string;
    noSearchResultsTitle: string;
    noSearchResultsDesc: string;
  };
  disclaimer: {
    title: string;
    content: string;
    nonProviderNotice: string;
  };
  settings: {
    title: string;
    profileSection: string;
    businessName: string;
    defaultUpi: string;
    ownerName: string;
    preferencesSection: string;
    language: string;
    theme: string;
    lightTheme: string;
    darkTheme: string;
    systemTheme: string;
    defaultSplit: string;
    dataSection: string;
    auditSection: string;
    demoBanner: string;
    backupSection: string;
    securitySection: string;
    subscriptionSection: string;
  };
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'QR SplitPay India',
    tagline: 'Split. Scan. Pay. Track.',
    subtitle: 'Split, scan and track UPI installments with cloud sync.',
    nav: {
      home: 'Home',
      payments: 'Payments',
      customers: 'Customers',
      reports: 'Reports',
      history: 'History',
      settings: 'Settings',
    },
    metrics: {
      todaysCollection: "Today's Confirmed Amount",
      pendingAmount: 'Pending Amount',
      activeSessions: 'Active Sessions',
      completedPayments: 'Completed Sessions',
      customersCount: 'Total Customers',
      verifiedNote: 'Only confirmed receipts counted toward revenue',
    },
    actions: {
      newPayment: '+ New Payment',
      createPayment: 'Create Payment Session',
      markAsReceived: 'Mark as Received',
      keepPending: 'Keep Pending',
      checkPayment: 'Check Bank / App',
      shareQr: 'Share QR',
      saveQr: 'Save QR Image',
      copyUpi: 'Copy UPI ID',
      openUpiApp: 'Open UPI App',
      printReceipt: 'Print Receipt',
      downloadReceipt: 'Save Receipt',
      viewDetails: 'View Details',
      cancel: 'Cancel',
      confirmReceived: 'Confirm Received',
      tryDemo: 'Load Demo Data',
      resetDemo: 'Reset Demo',
      exportData: 'Export My Data (JSON/CSV)',
      clearData: 'Clear Local Data',
      getStarted: 'Start Free',
      next: 'Next',
      back: 'Back',
      skip: 'Skip',
      finish: 'Start Using App',
      saveProfile: 'Save Profile',
      searchPlaceholder: 'Search by customer, invoice, phone...',
      syncNow: 'Sync Now',
      restoreData: 'Restore Backup',
      deleteAccount: 'Delete Account',
      openCRM: 'Customers CRM',
      viewReports: 'View Reports',
    },
    splitMethods: {
      equal: 'Equal Split',
      equalDesc: 'Split equally into agreed number of installments',
      maxInstallment: 'Maximum Installment',
      maxInstallmentDesc: 'Cap each installment to a maximum limit',
      custom: 'Custom Split',
      customDesc: 'Manually specify custom installment values',
      numInstallments: 'Number of Installments',
      maxAmountPerQr: 'Maximum Amount per QR',
      customAmounts: 'Installment Breakdown',
      addInstallment: '+ Add Installment',
      removeInstallment: 'Remove',
      allocationRemaining: 'Remaining to allocate',
      allocationExceeded: 'Exceeds total by',
      allocationExact: 'Matches total exactly',
    },
    form: {
      upiIdLabel: 'Merchant UPI ID *',
      upiIdPlaceholder: 'merchant@upi or mobile@okhdfcbank',
      upiIdError: 'Please enter a valid UPI ID (e.g. user@bank)',
      payeeNameLabel: 'Payee / Merchant Name',
      totalAmountLabel: 'Total Payment Amount (₹) *',
      totalAmountPlaceholder: '10000',
      totalAmountError: 'Amount must be greater than zero',
      customerNameLabel: 'Customer Name',
      customerPhoneLabel: 'Customer Phone',
      invoiceLabel: 'Invoice / Order ID (Optional)',
      notesLabel: 'Notes / Agreement Terms (Optional)',
      splitMethodLabel: 'Split Method',
      calculationPreview: 'Installments Breakdown Preview',
    },
    states: {
      DRAFT: 'Draft',
      QR_READY: 'QR Ready',
      PAYMENT_INITIATED: 'Payment Initiated',
      PENDING: 'Pending Verification',
      SUCCESS: 'Success (Verified)',
      FAILED: 'Payment Failed',
      CANCELLED: 'Cancelled',
      MANUALLY_CONFIRMED: 'Manually Confirmed',
      ACTIVE: 'Active',
      PARTIALLY_PAID: 'Partially Paid',
      COMPLETED: 'Completed',
      PAYMENT_ISSUE: 'Payment Issue',
    },
    customers: {
      title: 'Customer Management (CRM)',
      addNew: '+ New Customer',
      searchPlaceholder: 'Search customer by name or phone...',
      emptyTitle: 'No customers recorded yet',
      emptyDesc: 'Customers will appear here when you create payments or add them directly.',
      name: 'Customer Name',
      phone: 'Phone Number',
      email: 'Email (Optional)',
      address: 'Address / Location',
      notes: 'Customer Notes',
      totalRecorded: 'Total Recorded',
      totalPaid: 'Confirmed Paid',
      totalPending: 'Pending',
      sessionsCount: 'Payment Sessions',
      newPaymentForCustomer: 'Create Payment for Customer',
      editCustomer: 'Edit Customer',
      deleteCustomer: 'Delete Customer',
    },
    reports: {
      title: 'Business Reports & Analytics',
      confirmedRevenue: 'Confirmed Revenue',
      pendingPipeline: 'Pending Pipeline',
      completionRate: 'Installment Completion Rate',
      averageTicket: 'Average Session Value',
      totalCustomers: 'Total Customers',
      honestNotice: 'All amounts reflect merchant-confirmed receipts only. Pending QR generations are not treated as revenue.',
      exportCsv: 'Export to CSV',
      exportCsvSubtitle: 'Download your entire payment session history with comprehensive settlement details for accounting or Excel.',
      exportSummaryBtn: 'Export Sessions (CSV)',
      exportDetailedBtn: 'Export Detailed Installments (CSV)',
      exportSuccess: 'Session history exported successfully!',
      exportEmptyWarning: 'No payment sessions available to export.',
      filterAll: 'All Sessions',
      filterActive: 'Active & Pending',
      filterCompleted: 'Completed',
    },
    cloudSync: {
      synced: 'All changes saved',
      syncing: 'Saving changes...',
      offline: 'Offline — changes will sync when online returns',
      error: 'Unable to synchronize',
      syncNow: 'Sync Now',
      lastSync: 'Last cloud sync',
    },
    auth: {
      continueWithGoogle: 'Continue with Google',
      signIn: 'Sign In',
      signOut: 'Log Out',
      welcomeBack: 'Welcome Back',
      cloudDataFound: 'We found your QR SplitPay data in the cloud.',
      syncData: 'Sync My Data',
      googleDriveNote: 'Your account data is securely synchronized to the QR SplitPay cloud and linked to your Google account.',
    },
    subscription: {
      free: 'Free Plan',
      pro: 'Pro Plan (₹499/mo)',
      business: 'Business Plan (₹1,299/mo)',
      upgrade: 'Upgrade Subscription',
      currentPlan: 'Current Plan',
    },
    overdue: {
      badge: 'Overdue',
      overdueParts: 'Overdue Parts',
      actionRequired: 'Action Required',
      sessionsAlertTitle: 'Sessions have Overdue Installments',
      sessionsAlertDesc: 'installments are past due date and awaiting payment confirmation.',
      reviewButton: 'Review Overdue',
      filterAll: 'All Sessions',
      filterOverdue: 'Overdue Only',
    },
    onboarding: {
      step1Title: 'Split UPI Payments Easily',
      step1Desc: 'Break down large amounts into manageable UPI installments with precise paise calculations and zero rounding errors.',
      step2Title: 'Generate Amount-Specific QR Codes',
      step2Desc: 'Instantly produce compliant NPCI standard UPI QR codes for each exact installment payment.',
      step3Title: 'Track Every Installment',
      step3Desc: 'Independently inspect incoming bank credits and manually record each installment without guesswork.',
      step4Title: 'Keep Organized Payment Records',
      step4Desc: 'Generate merchant payment records, share digital receipts, and maintain a full audit trail entirely offline.',
    },
    verificationModal: {
      title: 'Confirm Payment Received?',
      amount: 'Installment Amount',
      upiId: 'Merchant UPI ID',
      warning: 'Only confirm after independently verifying that the payment has arrived in your bank account or merchant UPI app.',
      cancelBtn: 'Not Yet / Cancel',
      confirmBtn: 'Confirm Payment Received',
      manualTag: 'Manual Verification Mode',
    },
    receipt: {
      title: 'QR SplitPay India',
      subtitle: 'Merchant-Generated Payment Record',
      customer: 'Customer',
      merchant: 'Merchant',
      merchantUpi: 'UPI ID',
      invoiceNo: 'Invoice / Ref',
      date: 'Date & Time',
      totalAmount: 'Total Agreed Amount',
      amountPaid: 'Total Received to Date',
      amountRemaining: 'Remaining Balance',
      installmentBreakdown: 'Installment Schedule & Status',
      disclaimer: 'Merchant-generated payment record; not a bank-issued receipt. QR SplitPay India does not process, hold, or settle funds.',
      status: 'Overall Status',
    },
    emptyStates: {
      noSessionsTitle: 'No payment sessions yet',
      noSessionsDesc: 'Create your first installment payment plan or explore sample demo data.',
      noSearchResultsTitle: 'No matching sessions found',
      noSearchResultsDesc: 'Try adjusting your search query or status filter.',
    },
    disclaimer: {
      title: 'Legal & Product Disclaimer',
      content:
        'QR SplitPay India generates UPI payment requests and QR codes. It does not itself process, hold, settle, or guarantee payments. Payment status depends on the participating UPI application, bank/payment provider, and available verification method. Users remain responsible for complying with applicable laws, tax requirements, payment-provider terms, and regulatory requirements.',
      nonProviderNotice:
        'Notice: This application functions under Manual Verification Mode. It never connects directly to your bank account, never reads SMS, and never accesses banking credentials.',
    },
    settings: {
      title: 'Settings',
      profileSection: 'Business Profile',
      businessName: 'Business / Shop Name',
      defaultUpi: 'Default UPI ID',
      ownerName: 'Display / Owner Name',
      preferencesSection: 'Preferences & Regional',
      language: 'Language / भाषा / ଭାଷା',
      theme: 'Theme',
      lightTheme: 'Light',
      darkTheme: 'Dark',
      systemTheme: 'System Default',
      defaultSplit: 'Default Split Strategy',
      dataSection: 'Backup & Data Export',
      auditSection: 'Security & Principles',
      demoBanner: 'Demo Mode Activated',
      backupSection: 'Cloud Backup & Sync',
      securitySection: 'Security & Access',
      subscriptionSection: 'Subscription Plan',
    },
  },

  hi: {
    appName: 'QR SplitPay India',
    tagline: 'विभाजित करें. स्कैन करें. भुगतान करें. ट्रैक करें.',
    subtitle: 'क्लाउड सिंक के साथ यूपीआई किस्तों को विभाजित, स्कैन और ट्रैक करें।',
    nav: {
      home: 'होम',
      payments: 'किस्तें',
      customers: 'ग्राहक',
      reports: 'रिपोर्ट्स',
      history: 'इतिहास',
      settings: 'सेटिंग्स',
    },
    metrics: {
      todaysCollection: 'आज की पुष्ट राशि',
      pendingAmount: 'लंबित राशि',
      activeSessions: 'सक्रिय सत्र',
      completedPayments: 'पूर्ण सत्र',
      customersCount: 'कुल ग्राहक',
      verifiedNote: 'केवल पुष्टि की गई प्राप्तियां ही राजस्व में गिनी जाती हैं',
    },
    actions: {
      newPayment: '+ नया भुगतान',
      createPayment: 'भुगतान सत्र बनाएं',
      markAsReceived: 'प्राप्त के रूप में चिह्नित करें',
      keepPending: 'लंबित रखें',
      checkPayment: 'बैंक / ऐप जांचें',
      shareQr: 'क्यूआर साझा करें',
      saveQr: 'क्यूआर छवि सहेजें',
      copyUpi: 'UPI आईडी कॉपी करें',
      openUpiApp: 'UPI ऐप खोलें',
      printReceipt: 'रसीद प्रिंट करें',
      downloadReceipt: 'रसीद सहेजें',
      viewDetails: 'विवरण देखें',
      cancel: 'रद्द करें',
      confirmReceived: 'प्राप्ति की पुष्टि करें',
      tryDemo: 'डेमो डेटा लोड करें',
      resetDemo: 'डेमो रीसेट करें',
      exportData: 'डेटा निर्यात करें (JSON/CSV)',
      clearData: 'स्थानीय डेटा साफ़ करें',
      getStarted: 'मुफ़्त शुरू करें',
      next: 'आगे',
      back: 'पीछे',
      skip: 'छोड़ें',
      finish: 'ऐप का उपयोग शुरू करें',
      saveProfile: 'प्रोफ़ाइल सहेजें',
      searchPlaceholder: 'ग्राहक, इनवॉइस या फोन से खोजें...',
      syncNow: 'अभी सिंक करें',
      restoreData: 'बैकअप पुनर्स्थापित करें',
      deleteAccount: 'खाता हटाएं',
      openCRM: 'ग्राहक सीआरएम',
      viewReports: 'रिपोर्ट देखें',
    },
    splitMethods: {
      equal: 'समान विभाजन (Equal Split)',
      equalDesc: 'सहमति वाली किस्तों में समान रूप से विभाजित करें',
      maxInstallment: 'अधिकतम किस्त (Max Limit)',
      maxInstallmentDesc: 'प्रत्येक किस्त को अधिकतम सीमा पर रखें',
      custom: 'कस्टम विभाजन (Custom)',
      customDesc: 'प्रत्येक किस्त का मान स्वयं दर्ज करें',
      numInstallments: 'किस्तों की संख्या',
      maxAmountPerQr: 'प्रति क्यूआर अधिकतम राशि',
      customAmounts: 'किस्त विवरण',
      addInstallment: '+ किस्त जोड़ें',
      removeInstallment: 'हटाएं',
      allocationRemaining: 'शेष राशि',
      allocationExceeded: 'कुल से अधिक',
      allocationExact: 'कुल राशि के बिल्कुल बराबर',
    },
    form: {
      upiIdLabel: 'व्यापारी UPI आईडी *',
      upiIdPlaceholder: 'merchant@upi या 9876543210@paytm',
      upiIdError: 'कृपया एक मान्य UPI आईडी दर्ज करें (उदा. user@bank)',
      payeeNameLabel: 'प्राप्तकर्ता / व्यापारी का नाम',
      totalAmountLabel: 'कुल भुगतान राशि (₹) *',
      totalAmountPlaceholder: '10000',
      totalAmountError: 'राशि शून्य से अधिक होनी चाहिए',
      customerNameLabel: 'ग्राहक का नाम',
      customerPhoneLabel: 'ग्राहक का फोन',
      invoiceLabel: 'इनवॉइस / ऑर्डर आईडी (वैकल्पिक)',
      notesLabel: 'नोट्स / शर्तें (वैकल्पिक)',
      splitMethodLabel: 'विभाजन विधि',
      calculationPreview: 'किस्त पूर्वावलोकन',
    },
    states: {
      DRAFT: 'ड्राफ्ट',
      QR_READY: 'क्यूआर तैयार',
      PAYMENT_INITIATED: 'भुगतान शुरू हुआ',
      PENDING: 'सत्यापन लंबित',
      SUCCESS: 'सफल (सत्यापित)',
      FAILED: 'भुगतान विफल',
      CANCELLED: 'रद्द किया गया',
      MANUALLY_CONFIRMED: 'मैन्युअल रूप से पुष्टि की गई',
      ACTIVE: 'सक्रिय',
      PARTIALLY_PAID: 'आंशिक भुगतान',
      COMPLETED: 'पूर्ण',
      PAYMENT_ISSUE: 'भुगतान समस्या',
    },
    customers: {
      title: 'ग्राहक प्रबंधन (CRM)',
      addNew: '+ नया ग्राहक',
      searchPlaceholder: 'नाम या फोन से ग्राहक खोजें...',
      emptyTitle: 'अभी तक कोई ग्राहक दर्ज नहीं',
      emptyDesc: 'जब आप भुगतान बनाएंगे या सीधे जोड़ेंगे तो ग्राहक यहां दिखाई देंगे।',
      name: 'ग्राहक का नाम',
      phone: 'फोन नंबर',
      email: 'ईमेल (वैकल्पिक)',
      address: 'पता / स्थान',
      notes: 'टिप्पणी',
      totalRecorded: 'कुल दर्ज',
      totalPaid: 'प्राप्त राशि',
      totalPending: 'लंबित राशि',
      sessionsCount: 'भुगतान सत्र',
      newPaymentForCustomer: 'ग्राहक के लिए भुगतान बनाएं',
      editCustomer: 'ग्राहक संपादित करें',
      deleteCustomer: 'ग्राहक हटाएं',
    },
    reports: {
      title: 'व्यापार विश्लेषण और रिपोर्ट',
      confirmedRevenue: 'पुष्ट राजस्व',
      pendingPipeline: 'लंबित पाइपलाइन',
      completionRate: 'किस्त पूर्णता दर',
      averageTicket: 'औसत सत्र मूल्य',
      totalCustomers: 'कुल ग्राहक',
      honestNotice: 'सभी राशियां केवल व्यापारी द्वारा पुष्ट प्राप्तियों को दर्शाती हैं। लंबित क्यूआर को राजस्व नहीं माना जाता।',
      exportCsv: 'CSV में निर्यात करें',
      exportCsvSubtitle: 'खाता बही या एक्सेल के लिए पूर्ण भुगतान इतिहास और विवरण डाउनलोड करें।',
      exportSummaryBtn: 'सत्र सारांश निर्यात करें (CSV)',
      exportDetailedBtn: 'विस्तृत किस्तें निर्यात करें (CSV)',
      exportSuccess: 'भुगतान इतिहास सफलतापूर्वक डाउनलोड हो गया!',
      exportEmptyWarning: 'निर्यात के लिए कोई भुगतान सत्र उपलब्ध नहीं है।',
      filterAll: 'सभी सत्र',
      filterActive: 'सक्रिय और लंबित',
      filterCompleted: 'पूर्ण',
    },
    cloudSync: {
      synced: 'सभी परिवर्तन सहेजे गए',
      syncing: 'परिवर्तन सहेजे जा रहे हैं...',
      offline: 'ऑफ़लाइन — ऑनलाइन आने पर सिंक होगा',
      error: 'सिंक्रनाइज़ करने में असमर्थ',
      syncNow: 'अभी सिंक करें',
      lastSync: 'अंतिम क्लाउड सिंक',
    },
    auth: {
      continueWithGoogle: 'Google से जारी रखें',
      signIn: 'साइन इन करें',
      signOut: 'लॉग आउट',
      welcomeBack: 'वापसी पर स्वागत है',
      cloudDataFound: 'क्लाउड में आपका QR SplitPay डेटा मिला।',
      syncData: 'मेरा डेटा सिंक करें',
      googleDriveNote: 'आपका डेटा QR SplitPay क्लाउड पर सुरक्षित रूप से सिंक्रनाइज़ है और आपके Google खाते से जुड़ा है।',
    },
    subscription: {
      free: 'फ्री प्लान',
      pro: 'प्रो प्लान (₹499/माह)',
      business: 'बिजनेस प्लान (₹1,299/माह)',
      upgrade: 'सब्सक्रिप्शन अपग्रेड करें',
      currentPlan: 'वर्तमान प्लान',
    },
    overdue: {
      badge: 'अतिदेय',
      overdueParts: 'अतिदेय किस्तें',
      actionRequired: 'कार्रवाई आवश्यक',
      sessionsAlertTitle: 'सत्रों में अतिदेय किस्तें हैं',
      sessionsAlertDesc: 'किस्तें देय तिथि से आगे निकल चुकी हैं और भुगतान की प्रतीक्षा कर रही हैं।',
      reviewButton: 'समीक्षा करें',
      filterAll: 'सभी सत्र',
      filterOverdue: 'केवल अतिदेय',
    },
    onboarding: {
      step1Title: 'UPI भुगतान आसानी से विभाजित करें',
      step1Desc: 'बड़ी राशि को बिना किसी त्रुटि के सटीक पैसे की गणना के साथ सहमत किस्तों में विभाजित करें।',
      step2Title: 'राशि-विशिष्ट क्यूआर कोड उत्पन्न करें',
      step2Desc: 'प्रत्येक सटीक किस्त के लिए तुरंत एनपीसीआई मानक यूपीआई क्यूआर कोड बनाएं।',
      step3Title: 'प्रत्येक किस्त को ट्रैक करें',
      step3Desc: 'अपने बैंक खाते में राशि की स्वतंत्र रूप से जांच करें और प्रत्येक भुगतान को दर्ज करें।',
      step4Title: 'व्यवस्थित भुगतान रिकॉर्ड रखें',
      step4Desc: 'व्यापारी रसीदें बनाएं, डिजिटल रिकॉर्ड साझा करें और ऑफ़लाइन ऑडिट ट्रेल बनाए रखें।',
    },
    verificationModal: {
      title: 'क्या भुगतान प्राप्त हो गया है?',
      amount: 'किस्त की राशि',
      upiId: 'व्यापारी UPI आईडी',
      warning: 'केवल अपने बैंक खाते या यूपीआई ऐप में राशि स्वतंत्र रूप से प्राप्त होने के बाद ही पुष्टि करें।',
      cancelBtn: 'अभी नहीं / रद्द करें',
      confirmBtn: 'प्राप्ति की पुष्टि करें',
      manualTag: 'मैन्युअल सत्यापन मोड',
    },
    receipt: {
      title: 'QR SplitPay India',
      subtitle: 'व्यापारी द्वारा जनरेट किया गया भुगतान रिकॉर्ड',
      customer: 'ग्राहक',
      merchant: 'व्यापारी',
      merchantUpi: 'UPI आईडी',
      invoiceNo: 'इनवॉइस / संदर्भ संख्या',
      date: 'दिनांक और समय',
      totalAmount: 'कुल सहमत राशि',
      amountPaid: 'अब तक प्राप्त कुल राशि',
      amountRemaining: 'शेष राशि',
      installmentBreakdown: 'किस्त अनुसूची और स्थिति',
      disclaimer: 'व्यापारी द्वारा जनरेट किया गया भुगतान रिकॉर्ड; बैंक-जारी रसीद नहीं। QR SplitPay India धन संसाधित या अपने पास नहीं रखता है।',
      status: 'समग्र स्थिति',
    },
    emptyStates: {
      noSessionsTitle: 'अभी तक कोई भुगतान सत्र नहीं',
      noSessionsDesc: 'अपनी पहली किस्त योजना बनाएं या नमूना डेमो डेटा देखें।',
      noSearchResultsTitle: 'कोई मेल नहीं मिला',
      noSearchResultsDesc: 'कृपया अपनी खोज या फ़िल्टर समायोजित करें।',
    },
    disclaimer: {
      title: 'कानूनी और उत्पाद अस्वीकरण',
      content:
        'QR SplitPay India UPI भुगतान अनुरोध और QR कोड जनरेट करता है। यह स्वयं भुगतान संसाधित, रोक, निपटान या गारंटी नहीं देता है। भुगतान स्थिति संबंधित UPI एप्लिकेशन, बैंक/प्रदाता और उपलब्ध सत्यापन विधि पर निर्भर करती है। उपयोगकर्ता लागू कानूनों और कर नियमों का पालन करने के लिए स्वयं जिम्मेदार हैं।',
      nonProviderNotice:
        'सूचना: यह एप्लिकेशन मैन्युअल सत्यापन मोड में कार्य करता है। यह कभी भी बैंक खाते से सीधे नहीं जुड़ता, एसएमएस नहीं पढ़ता और गोपनीय क्रेडेंशियल नहीं मांगता।',
    },
    settings: {
      title: 'सेटिंग्स',
      profileSection: 'व्यापार प्रोफ़ाइल',
      businessName: 'व्यवसाय / दुकान का नाम',
      defaultUpi: 'डिफ़ॉल्ट UPI आईडी',
      ownerName: 'मालिक / प्रदर्शन नाम',
      preferencesSection: 'प्राथमिकताएं एवं भाषा',
      language: 'भाषा (Language)',
      theme: 'थीम',
      lightTheme: 'लाइट',
      darkTheme: 'डार्क',
      systemTheme: 'सिस्टम डिफ़ॉल्ट',
      defaultSplit: 'डिफ़ॉल्ट विभाजन विधि',
      dataSection: 'डेटा और बैकअप',
      auditSection: 'सुरक्षा और सिद्धांत',
      demoBanner: 'डेमो मोड सक्रिय है',
      backupSection: 'क्लाउड बैकअप और सिंक',
      securitySection: 'सुरक्षा और एक्सेस',
      subscriptionSection: 'सब्सक्रिप्शन योजना',
    },
  },

  or: {
    appName: 'QR SplitPay India',
    tagline: 'ଭାଗ କରନ୍ତୁ. ସ୍କାନ କରନ୍ତୁ. ପେ କରନ୍ତୁ. ଟ୍ରାକ କରନ୍ତୁ.',
    subtitle: 'କ୍ଲାଉଡ୍ ସିଙ୍କ ସହିତ ୟୁପିଆଇ କିସ୍ତିଗୁଡ଼ିକୁ ସହଜରେ ଭାଗ, ସ୍କାନ ଏବଂ ଟ୍ରାକ କରନ୍ତୁ।',
    nav: {
      home: 'ମୂଳପୃଷ୍ଠା',
      payments: 'କିସ୍ତି',
      customers: 'ଗ୍ରାହକ',
      reports: 'ରିପୋର୍ଟ',
      history: 'ଇତିହାସ',
      settings: 'ସେଟିଂସ',
    },
    metrics: {
      todaysCollection: 'ଆଜିର ସଂଗୃହିତ ରାଶି',
      pendingAmount: 'ବାକି ରାଶି',
      activeSessions: 'ସକ୍ରିୟ ସେସନ',
      completedPayments: 'ସମ୍ପୂର୍ଣ୍ଣ ସେସନ',
      customersCount: 'ମୋଟ ଗ୍ରାହକ',
      verifiedNote: 'କେବଳ ନିଶ୍ଚିତ ହୋଇଥିବା ପ୍ରାପ୍ତି ହିସାବରେ ନିଆଯାଏ',
    },
    actions: {
      newPayment: '+ ନୂଆ ପେମେଣ୍ଟ',
      createPayment: 'ପେମେଣ୍ଟ ସେସନ ତିଆରି କରନ୍ତୁ',
      markAsReceived: 'ପାଇଲି ବୋଲି ଚିହ୍ନିତ କରନ୍ତୁ',
      keepPending: 'ବାକି ରଖନ୍ତୁ',
      checkPayment: 'ବ୍ୟାଙ୍କ / ଆପ ଯାଞ୍ଚ କରନ୍ତୁ',
      shareQr: 'କ୍ୟୁଆର ଶେୟାର କରନ୍ତୁ',
      saveQr: 'କ୍ୟୁଆର ଡାଉନଲୋଡ଼ କରନ୍ତୁ',
      copyUpi: 'UPI ଆଇଡି କପି କରନ୍ତୁ',
      openUpiApp: 'UPI ଆପ ଖୋଲନ୍ତୁ',
      printReceipt: 'ରସିଦ ପ୍ରିଣ୍ଟ କରନ୍ତୁ',
      downloadReceipt: 'ରସିଦ ସେଭ କରନ୍ତୁ',
      viewDetails: 'ବିବରଣୀ ଦେଖନ୍ତୁ',
      cancel: 'ବାତିଲ କରନ୍ତୁ',
      confirmReceived: 'ପ୍ରାପ୍ତି ନିଶ୍ଚିତ କରନ୍ତୁ',
      tryDemo: 'ଡେମୋ ଡାଟା ଦେଖନ୍ତୁ',
      resetDemo: 'ଡେମୋ ରିସେଟ କରନ୍ତୁ',
      exportData: 'ଡାଟା ଏକ୍ସପୋର୍ଟ (JSON/CSV)',
      clearData: 'ଡାଟା ଲିଭାନ୍ତୁ',
      getStarted: 'ମାଗଣାରେ ଆରମ୍ଭ କରନ୍ତୁ',
      next: 'ପରବର୍ତ୍ତୀ',
      back: 'ପଛକୁ',
      skip: 'ଏଡ଼ାଇ ଯାଆନ୍ତୁ',
      finish: 'ବ୍ୟବହାର ଆରମ୍ଭ କରନ୍ତୁ',
      saveProfile: 'ପ୍ରୋଫାଇଲ ସେଭ କରନ୍ତୁ',
      searchPlaceholder: 'ଗ୍ରାହକ, ଇନଭଏସ କିମ୍ବା ଫୋନ୍ ଦ୍ୱାରା ଖୋଜନ୍ତୁ...',
      syncNow: 'ଏବେ ସିଙ୍କ କରନ୍ତୁ',
      restoreData: 'ବ୍ୟାକଅପ ପୁନରୁଦ୍ଧାର',
      deleteAccount: 'ଖାତା ଲିଭାନ୍ତୁ',
      openCRM: 'ଗ୍ରାହକ CRM',
      viewReports: 'ରିପୋର୍ଟ ଦେଖନ୍ତୁ',
    },
    splitMethods: {
      equal: 'ସମାନ ଭାଗ (Equal Split)',
      equalDesc: 'ସମସ୍ତ କିସ୍ତିରେ ସମାନ ଭାବରେ ବିଭାଜନ କରନ୍ତୁ',
      maxInstallment: 'ସର୍ବାଧିକ ସୀମା (Max Limit)',
      maxInstallmentDesc: 'ପ୍ରତ୍ୟେକ କିସ୍ତି ପାଇଁ ସର୍ବାଧିକ ସୀମା ନିର୍ଦ୍ଧାରଣ କରନ୍ତୁ',
      custom: 'ନିଜ ଇଚ୍ଛା ଅନୁସାରେ (Custom)',
      customDesc: 'ପ୍ରତ୍ୟେକ କିସ୍ତିର ପରିମାଣ ନିଜେ ଲେଖନ୍ତୁ',
      numInstallments: 'କିସ୍ତି ସଂଖ୍ୟା',
      maxAmountPerQr: 'କ୍ୟୁଆର ପିଛା ସର୍ବାଧିକ ରାଶି',
      customAmounts: 'କିସ୍ତି ତାଲିକା',
      addInstallment: '+ କିସ୍ତି ଯୋଡନ୍ତୁ',
      removeInstallment: 'ହଟାନ୍ତୁ',
      allocationRemaining: 'ବାକି ରାଶି',
      allocationExceeded: 'ମୋଟ ଠାରୁ ଅଧିକ',
      allocationExact: 'ମୋଟ ରାଶି ସହିତ ମିଶିଗଲା',
    },
    form: {
      upiIdLabel: 'ବ୍ୟବସାୟୀ UPI ଆଇଡି *',
      upiIdPlaceholder: 'merchant@upi ବା 9876543210@paytm',
      upiIdError: 'ଦୟାକରି ଏକ ସଠିକ UPI ଆଇଡି ଦିଅନ୍ତୁ (ଯେପରିକି user@bank)',
      payeeNameLabel: 'ପ୍ରାପ୍ତକର୍ତ୍ତା / ବ୍ୟବସାୟୀଙ୍କ ନାମ',
      totalAmountLabel: 'ମୋଟ ରାଶି (₹) *',
      totalAmountPlaceholder: '10000',
      totalAmountError: 'ରାଶି ଶୂନ ଠାରୁ ଅଧିକ ହେବା ଆବଶ୍ୟକ',
      customerNameLabel: 'ଗ୍ରାହକଙ୍କ ନାମ',
      customerPhoneLabel: 'ଗ୍ରାହକଙ୍କ ଫୋନ',
      invoiceLabel: 'ଇନଭଏସ / ଅର୍ଡର ଆଇଡି (ଇଚ୍ଛାଧୀନ)',
      notesLabel: 'ମନ୍ତବ୍ୟ / ସର୍ତ୍ତାବଳୀ (ଇଚ୍ଛାଧୀନ)',
      splitMethodLabel: 'ବିଭାଜନ ପଦ୍ଧତି',
      calculationPreview: 'କିସ୍ତି ପୂର୍ବାବଲୋକନ',
    },
    states: {
      DRAFT: 'ଡ୍ରାଫ୍ଟ',
      QR_READY: 'କ୍ୟୁଆର ପ୍ରସ୍ତୁତ',
      PAYMENT_INITIATED: 'ପେମେଣ୍ଟ ଆରମ୍ଭ ହେଲା',
      PENDING: 'ଯାଞ୍ଚ ବାକି ଅଛି',
      SUCCESS: 'ସଫଳ (ଯାଞ୍ଚ ହୋଇଛି)',
      FAILED: 'ବିଫଳ ହୋଇଛି',
      CANCELLED: 'ବାତିଲ ହୋଇଛି',
      MANUALLY_CONFIRMED: 'ମାନୁଆଲ ନିଶ୍ଚିତ ହୋଇଛି',
      ACTIVE: 'ସକ୍ରିୟ',
      PARTIALLY_PAID: 'ଆଂଶିକ ପୈଠ',
      COMPLETED: 'ସମ୍ପୂର୍ଣ୍ଣ',
      PAYMENT_ISSUE: 'ସମସ୍ୟା ଦେଖାଦେଇଛି',
    },
    customers: {
      title: 'ଗ୍ରାହକ ପରିଚାଳନା (CRM)',
      addNew: '+ ନୂଆ ଗ୍ରାହକ',
      searchPlaceholder: 'ନାମ ବା ଫୋନ ନମ୍ବରରେ ଖୋଜନ୍ତୁ...',
      emptyTitle: 'କୌଣସି ଗ୍ରାହକ ଯୋଡ଼ା ଯାଇନାହିଁ',
      emptyDesc: 'ଆପଣ ପେମେଣ୍ଟ ସୃଷ୍ଟି କଲେ କିମ୍ବା ନୂଆ ଗ୍ରାହକ ଯୋଡ଼ିଲେ ଏଠାରେ ଦେଖାଯିବ।',
      name: 'ଗ୍ରାହକଙ୍କ ନାମ',
      phone: 'ଫୋନ ନମ୍ବର',
      email: 'ଇମେଲ (ଇଚ୍ଛାଧୀନ)',
      address: 'ଠିକଣା',
      notes: 'ମନ୍ତବ୍ୟ',
      totalRecorded: 'ମୋଟ ଲିପିବଦ୍ଧ',
      totalPaid: 'ମିଳିଥିବା ରାଶି',
      totalPending: 'ବାକି ରାଶି',
      sessionsCount: 'ପେମେଣ୍ଟ ସେସନ',
      newPaymentForCustomer: 'ଏହି ଗ୍ରାହକଙ୍କ ପାଇଁ ପେମେଣ୍ଟ କରନ୍ତୁ',
      editCustomer: 'ସମ୍ପାଦନ କରନ୍ତୁ',
      deleteCustomer: 'ଗ୍ରାହକ ଲିଭାନ୍ତୁ',
    },
    reports: {
      title: 'ବ୍ୟବସାୟିକ ରିପୋର୍ଟ ଓ ବିଶ୍ଳେଷଣ',
      confirmedRevenue: 'ନିଶ୍ଚିତ ରାଜସ୍ୱ',
      pendingPipeline: 'ବାକି ପାଇପଲାଇନ୍',
      completionRate: 'କିସ୍ତି ସମ୍ପୂର୍ଣ୍ଣ ହାର',
      averageTicket: 'ହାରାହାରି ସେସନ ମୂଲ୍ୟ',
      totalCustomers: 'ମୋଟ ଗ୍ରାହକ',
      honestNotice: 'ସମସ୍ତ ରାଶି କେବଳ ବ୍ୟବସାୟୀଙ୍କ ଦ୍ୱାରା ନିଶ୍ଚିତ ହୋଇଥିବା ପ୍ରାପ୍ତିକୁ ଦର୍ଶାଏ।',
      exportCsv: 'CSV ଏକ୍ସପୋର୍ଟ କରନ୍ତୁ',
      exportCsvSubtitle: 'ଆକାଉଣ୍ଟିଂ ବା ଏକ୍ସେଲ ପାଇଁ ସମସ୍ତ ପେମେଣ୍ଟ ଇତିହାସ ଡାଉନଲୋଡ୍ କରନ୍ତୁ।',
      exportSummaryBtn: 'ସେସନ ତାଲିକା (CSV)',
      exportDetailedBtn: 'ବିସ୍ତୃତ କିସ୍ତି ତାଲିକା (CSV)',
      exportSuccess: 'ସଫଳତାର ସହିତ CSV ଡାଉନଲୋଡ୍ ହେଲା!',
      exportEmptyWarning: 'ଏକ୍ସପୋର୍ଟ କରିବାକୁ କୌଣସି ତଥ୍ୟ ନାହିଁ।',
      filterAll: 'ସମସ୍ତ ସେସନ',
      filterActive: 'ଚାଲୁ ଥିବା',
      filterCompleted: 'ସମ୍ପୂର୍ଣ୍ଣ',
    },
    cloudSync: {
      synced: 'ସମସ୍ତ ତଥ୍ୟ ସୁରକ୍ଷିତ ରହିଲା',
      syncing: 'ସାଇତା ଚାଲିଛି...',
      offline: 'ଅଫଲାଇନ — ଅନଲାଇନ ଆସିଲେ ସିଙ୍କ ହେବ',
      error: 'ସିଙ୍କ କରିବାରେ ଅସୁବିଧା',
      syncNow: 'ଏବେ ସିଙ୍କ କରନ୍ତୁ',
      lastSync: 'ଶେଷ ସିଙ୍କ ସମୟ',
    },
    auth: {
      continueWithGoogle: 'Google ସହିତ ଆଗକୁ ବଢ଼ନ୍ତୁ',
      signIn: 'ସାଇନ୍ ଇନ୍',
      signOut: 'ଲଗ୍ ଆଉଟ୍',
      welcomeBack: 'ସ୍ୱାଗତମ',
      cloudDataFound: 'କ୍ଲାଉଡ୍ ରେ ଆପଣଙ୍କ QR SplitPay ଡାଟା ମିଳିଲା।',
      syncData: 'ମୋ ଡାଟା ସିଙ୍କ କରନ୍ତୁ',
      googleDriveNote: 'ଆପଣଙ୍କ ଆକାଉଣ୍ଟ ତଥ୍ୟ QR SplitPay କ୍ଲାଉଡ୍ ରେ ସୁରକ୍ଷିତ ରଖାଯାଏ ଏବଂ Google ଆକାଉଣ୍ଟ ସହିତ ସଂଯୋଗ ହୁଏ।',
    },
    subscription: {
      free: 'ମାଗଣା ପ୍ଲାନ',
      pro: 'ପ୍ରୋ ପ୍ଲାନ (₹499/ମାସ)',
      business: 'ବ୍ୟବସାୟ ପ୍ଲାନ (₹1,299/ମାସ)',
      upgrade: 'ପ୍ଲାନ ଅପଗ୍ରେଡ୍ କରନ୍ତୁ',
      currentPlan: 'ଚଳିତ ପ୍ଲାନ',
    },
    overdue: {
      badge: 'ଅବଧି ସରିଯାଇଛି',
      overdueParts: 'ବାକି କିସ୍ତି',
      actionRequired: 'ଧ୍ୟାନ ଦିଅନ୍ତୁ',
      sessionsAlertTitle: 'ଅବଧି ସରିଯାଇଥିବା କିସ୍ତି ରହିଛି',
      sessionsAlertDesc: 'କିସ୍ତିଗୁଡ଼ିକ ଧାର୍ଯ୍ୟ ତାରିଖ ପାର ହୋଇଯାଇଛି ଏବଂ ଆଦାୟ ବାକି ଅଛି।',
      reviewButton: 'ଯାଞ୍ଚ କରନ୍ତୁ',
      filterAll: 'ସମସ୍ତ ସେସନ',
      filterOverdue: 'କେବଳ ବାକି ଥିବା',
    },
    onboarding: {
      step1Title: 'UPI କିସ୍ତି ସହଜରେ ଭାଗ କରନ୍ତୁ',
      step1Desc: 'କୌଣସି ଭୁଲ ବିନା ସଠିକ ପଇସା ଗଣନା ସହିତ ବଡ଼ ରାଶିକୁ ସହଜରେ କିସ୍ତିରେ ବିଭାଜନ କରନ୍ତୁ।',
      step2Title: 'ସଠିକ ରାଶିର କ୍ୟୁଆର କୋଡ୍ ପ୍ରସ୍ତୁତ କରନ୍ତୁ',
      step2Desc: 'ପ୍ରତ୍ୟେକ କିସ୍ତି ପାଇଁ ସଠିକ NPCI ମାନକ UPI କ୍ୟୁଆର କୋଡ୍ ତୁରନ୍ତ ତିଆରି କରନ୍ତୁ।',
      step3Title: 'ପ୍ରତ୍ୟେକ କିସ୍ତିକୁ ଟ୍ରାକ କରନ୍ତୁ',
      step3Desc: 'ଆପଣଙ୍କ ବ୍ୟାଙ୍କ ଖାତାକୁ ଟଙ୍କା ଆସିଛି କି ନାହିଁ ନିଜେ ଯାଞ୍ଚ କରି ପେମେଣ୍ଟ ରେକର୍ଡ କରନ୍ତୁ।',
      step4Title: 'ସଂଗଠିତ ପେମେଣ୍ଟ ରେକର୍ଡ ରଖନ୍ତୁ',
      step4Desc: 'ବ୍ୟବସାୟୀ ରସିଦ ତିଆରି କରନ୍ତୁ, ଡିଜିଟାଲ୍ ରେକର୍ଡ ଶେୟାର କରନ୍ତୁ ଏବଂ ଅଫଲାଇନ ଅଡିଟ୍ ଇତିହାସ ରଖନ୍ତୁ।',
    },
    verificationModal: {
      title: 'ପେମେଣ୍ଟ ମିଳିଲା ବୋଲି ନିଶ୍ଚିତ କରୁଛନ୍ତି?',
      amount: 'କିସ୍ତି ରାଶି',
      upiId: 'ବ୍ୟବସାୟୀ UPI ଆଇଡି',
      warning: 'ଆପଣଙ୍କ ବ୍ୟାଙ୍କ ଆକାଉଣ୍ଟ କିମ୍ବା UPI ଆପ୍ ରେ ଟଙ୍କା ଜମା ହୋଇଥିବା ନିଜେ ଯାଞ୍ଚ କରିବା ପରେ ହିଁ ନିଶ୍ଚିତ କରନ୍ତୁ।',
      cancelBtn: 'ଏବେ ନୁହେଁ / ବାତିଲ',
      confirmBtn: 'ପାଇଲି ବୋଲି ନିଶ୍ଚିତ କରନ୍ତୁ',
      manualTag: 'ମାନୁଆଲ ଯାଞ୍ଚ ମୋଡ୍',
    },
    receipt: {
      title: 'QR SplitPay India',
      subtitle: 'ବ୍ୟବସାୟୀ ଦ୍ୱାରା ପ୍ରସ୍ତୁତ ପେମେଣ୍ଟ ରେକର୍ଡ',
      customer: 'ଗ୍ରାହକ',
      merchant: 'ବ୍ୟବସାୟୀ',
      merchantUpi: 'UPI ଆଇଡି',
      invoiceNo: 'ଇନଭଏସ / ରେଫରାନ୍ସ ନଂ',
      date: 'ତାରିଖ ଓ ସମୟ',
      totalAmount: 'ମୋଟ ସ୍ଥିରୀକୃତ ରାଶି',
      amountPaid: 'ଏପର୍ଯ୍ୟନ୍ତ ମିଳିଥିବା ମୋଟ ରାଶି',
      amountRemaining: 'ବାକି ରାଶି',
      installmentBreakdown: 'କିସ୍ତି ବିବରଣୀ ଓ ସ୍ଥିତି',
      disclaimer: 'ଏହା ବ୍ୟବସାୟୀଙ୍କ ଦ୍ୱାରା ପ୍ରସ୍ତୁତ ଏକ ପେମେଣ୍ଟ ରେକର୍ଡ; କୌଣସି ବ୍ୟାଙ୍କ ରସିଦ ନୁହେଁ। QR SplitPay India ନିଜେ ଟଙ୍କା କାରବାର କରେନାହିଁ।',
      status: 'ସର୍ବମୋଟ ସ୍ଥିତି',
    },
    emptyStates: {
      noSessionsTitle: 'କୌଣସି ପେମେଣ୍ଟ ସେସନ ନାହିଁ',
      noSessionsDesc: 'ଆପଣଙ୍କର ପ୍ରଥମ କିସ୍ତି ଯୋଜନା ଆରମ୍ଭ କରନ୍ତୁ କିମ୍ବା ଡେମୋ ଡାଟା ଦେଖନ୍ତୁ।',
      noSearchResultsTitle: 'କିଛି ମିଳିଲା ନାହିଁ',
      noSearchResultsDesc: 'ଦୟାକରି ଆପଣଙ୍କ ଖୋଜିବା ଶବ୍ଦ କିମ୍ବା ଫିଲ୍ଟର ବଦଳାନ୍ତୁ।',
    },
    disclaimer: {
      title: 'ଆଇନଗତ ଓ ଉତ୍ପାଦ ଅସ୍ୱୀକାରନାମା',
      content:
        'QR SplitPay India କେବଳ UPI ପେମେଣ୍ଟ ଅନୁରୋଧ ଓ QR କୋଡ୍ ତିଆରି କରେ। ଏହା ନିଜେ କୌଣସି ଟଙ୍କା ଲେଣଦେଣ, ସାଇତି ରଖିବା କିମ୍ବା ଗ୍ୟାରେଣ୍ଟି ଦିଏ ନାହିଁ। ପେମେଣ୍ଟ ସ୍ଥିତି ସମ୍ପୃକ୍ତ UPI ଆପ୍ ଏବଂ ବ୍ୟାଙ୍କ ଉପରେ ନିର୍ଭର କରେ।',
      nonProviderNotice:
        'ସୂଚନା: ଏହି ଆପ୍ ମାନୁଆଲ ଯାଞ୍ଚ ମୋଡ୍ ରେ କାମ କରେ। ଏହା କେବେହେଲେ ଆପଣଙ୍କ ବ୍ୟାଙ୍କ ସହ ସିଧାସଳଖ ସଂଯୋଗ କରେନାହିଁ କିମ୍ବା ପାସୱାର୍ଡ/ପିନ୍ ମାଗେନାହିଁ।',
    },
    settings: {
      title: 'ସେଟିଂସ',
      profileSection: 'ବ୍ୟବସାୟୀ ପ୍ରୋଫାଇଲ',
      businessName: 'ଦୋକାନ / ବ୍ୟବସାୟ ନାମ',
      defaultUpi: 'ମୁଖ୍ୟ UPI ଆଇଡି',
      ownerName: 'ମାଲିକଙ୍କ ନାମ',
      preferencesSection: 'ପସନ୍ଦ ଓ ଭାଷା',
      language: 'ଭାଷା (Language)',
      theme: 'ଥିମ',
      lightTheme: 'ଲାଇଟ୍',
      darkTheme: 'ଡାର୍କ',
      systemTheme: 'ସିଷ୍ଟମ ଡିଫଲ୍ଟ',
      defaultSplit: 'ମୁଖ୍ୟ ଭାଗ ପଦ୍ଧତି',
      dataSection: 'ଡାଟା ଓ ବ୍ୟାକଅପ',
      auditSection: 'ସୁରକ୍ଷା ଓ ନିୟମାବଳୀ',
      demoBanner: 'ଡେମୋ ମୋଡ୍ ସକ୍ରିୟ ଅଛି',
      backupSection: 'କ୍ଲାଉଡ୍ ବ୍ୟାକଅପ ଓ ସିଙ୍କ',
      securitySection: 'ସୁରକ୍ଷା ଓ ପ୍ରବେଶ',
      subscriptionSection: 'ସଦସ୍ୟତା ଯୋଜନା',
    },
  },
};
