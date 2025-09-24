import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'kn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('civic-eye-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('civic-eye-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Translation data
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.signin': 'Sign In',
    'nav.signup': 'Sign Up',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    'nav.dashboard': 'Dashboard',
    
    // Hero Section
    'hero.title': 'Report Civic Issues in Your Community',
    'hero.subtitle': 'Join thousands of citizens making their neighborhoods better by reporting and tracking civic issues.',
    'hero.cta.citizen': 'Report an Issue',
    'hero.cta.admin': 'Admin Login',
    
    // Features
    'features.title': 'Why Choose CivicEye?',
    'features.report.title': 'Easy Reporting',
    'features.report.desc': 'Report civic issues with photos and location in seconds',
    'features.track.title': 'Real-time Tracking',
    'features.track.desc': 'Track the status of your reported issues in real-time',
    'features.community.title': 'Community Driven',
    'features.community.desc': 'Engage with your community and support important issues',
    
    // Auth Forms
    'auth.signin.title': 'Sign In to Your Account',
    'auth.signup.title': 'Create Your Account',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.fullName': 'Full Name',
    'auth.phoneNumber': 'Phone Number',
    'auth.role': 'Role',
    'auth.citizen': 'Citizen',
    'auth.admin': 'Admin',
    'auth.signin.button': 'Sign In',
    'auth.signup.button': 'Sign Up',
    'auth.signin.link': 'Already have an account? Sign in',
    'auth.signup.link': "Don't have an account? Sign up",
    
    // Issue Management
    'issues.title': 'Community Issues',
    'issues.report.title': 'Report New Issue',
    'issues.type': 'Issue Type',
    'issues.title.label': 'Issue Title',
    'issues.description': 'Description',
    'issues.location': 'Location',
    'issues.photos': 'Upload Photos',
    'issues.submit': 'Submit Issue',
    'issues.status.reported': 'Reported',
    'issues.status.inProgress': 'In Progress',
    'issues.status.resolved': 'Resolved',
    'issues.status.rejected': 'Rejected',
    'issues.status.pending': 'Pending',
    'issues.hype': 'Hype',
    'issues.hyped': 'Hyped!',
    'issues.view': 'View',
    'issues.viewDetails': 'View Details',
    
    // Issue Types
    'issueType.roadInfrastructure': 'Road Infrastructure',
    'issueType.wasteManagement': 'Waste Management',
    'issueType.environmentalIssues': 'Environmental Issues',
    'issueType.utilitiesInfrastructure': 'Utilities & Infrastructure',
    'issueType.publicSafety': 'Public Safety',
    'issueType.other': 'Other',
    
    // Report Issue Form
    'report.title': 'Report a New Issue',
    'report.subtitle': 'Help improve your community by reporting infrastructure problems',
    'report.form.title': 'Issue Title',
    'report.form.titlePlaceholder': 'Brief description of the issue',
    'report.form.description': 'Detailed Description',
    'report.form.descriptionPlaceholder': 'Provide more details about the issue',
    'report.form.type': 'Issue Type',
    'report.form.location': 'Location',
    'report.form.locationPlaceholder': 'Enter or select location',
    'report.form.photos': 'Upload Photos',
    'report.form.photosDesc': 'Add photos to help identify and resolve the issue',
    'report.form.submit': 'Submit Report',
    'report.form.submitting': 'Submitting...',
    'report.success': 'Issue reported successfully!',
    'report.error': 'Failed to submit report. Please try again.',
    
    // Photo Upload
    'photo.title': 'Add Photo',
    'photo.description': 'Upload an authentic photo to help us locate and understand the issue.',
    'photo.takePhoto': 'Take Photo',
    'photo.chooseGallery': 'Choose from Gallery',
    'photo.verificationNote': 'Images are verified for authenticity. GPS data improves accuracy.',
    
    // Profile
    'profile.title': 'Profile Settings',
    'profile.subtitle': 'Manage your account information and preferences',
    'profile.personalInfo': 'Personal Information',
    'profile.accountSettings': 'Account Settings',
    'profile.myIssues': 'My Reported Issues',
    'profile.statistics': 'Statistics',
    'profile.editProfile': 'Edit Profile',
    'profile.saveChanges': 'Save Changes',
    'profile.cancelEdit': 'Cancel',
    
    // Admin Dashboard
    'admin.title': 'Admin Dashboard',
    'admin.subtitle': 'Monitor, manage, and resolve community issues efficiently.',
    'admin.stats.total': 'Total Issues',
    'admin.stats.resolved': 'Resolved',
    'admin.stats.inProgress': 'In Progress',
    'admin.stats.pending': 'Pending',
    'admin.assign': 'Assign',
    'admin.assignPOC': 'Assign POC',
    'admin.delete': 'Delete',
    'admin.department': 'Department',
    'admin.pocName': 'POC Name',
    'admin.phoneNumber': 'Phone Number',
    'admin.email': 'Email',
    
    // Common UI Elements
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.submit': 'Submit',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.current': 'Use Current',
    'common.analyzing': 'AI Analyzing...',
    'common.processing': 'Processing GPS...',
    'common.required': 'Required',
    'common.optional': 'Optional',
    'common.location': 'Location',
    'common.description': 'Description',
    'common.priority': 'Priority',
    'common.priority.low': 'Low',
    'common.priority.medium': 'Medium',
    'common.priority.high': 'High',
    'common.priority.critical': 'Critical',
    
    // Language Selector
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.kannada': 'ಕನ್ನಡ',
    'language.select': 'Select Language',
  },
  
  hi: {
    // Navigation
    'nav.home': 'होम',
    'nav.about': 'के बारे में',
    'nav.contact': 'संपर्क',
    'nav.signin': 'साइन इन',
    'nav.signup': 'साइन अप',
    'nav.profile': 'प्रोफाइल',
    'nav.logout': 'लॉग आउट',
    'nav.dashboard': 'डैशबोर्ड',
    
    // Hero Section
    'hero.title': 'अपने समुदाय में नागरिक समस्याओं की रिपोर्ट करें',
    'hero.subtitle': 'नागरिक समस्याओं की रिपोर्ट और ट्रैकिंग करके अपने पड़ोस को बेहतर बनाने वाले हजारों नागरिकों से जुड़ें।',
    'hero.cta.citizen': 'समस्या की रिपोर्ट करें',
    'hero.cta.admin': 'एडमिन लॉगिन',
    
    // Features
    'features.title': 'CivicEye क्यों चुनें?',
    'features.report.title': 'आसान रिपोर्टिंग',
    'features.report.desc': 'फोटो और स्थान के साथ नागरिक समस्याओं की रिपोर्ट सेकंडों में करें',
    'features.track.title': 'रियल-टाइम ट्रैकिंग',
    'features.track.desc': 'अपनी रिपोर्ट की गई समस्याओं की स्थिति को रियल-टाइम में ट्रैक करें',
    'features.community.title': 'समुदाय संचालित',
    'features.community.desc': 'अपने समुदाय के साथ जुड़ें और महत्वपूर्ण मुद्दों का समर्थन करें',
    
    // Auth Forms
    'auth.signin.title': 'अपने खाते में साइन इन करें',
    'auth.signup.title': 'अपना खाता बनाएं',
    'auth.email': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.confirmPassword': 'पासवर्ड की पुष्टि करें',
    'auth.fullName': 'पूरा नाम',
    'auth.phoneNumber': 'फोन नंबर',
    'auth.role': 'भूमिका',
    'auth.citizen': 'नागरिक',
    'auth.admin': 'व्यवस्थापक',
    'auth.signin.button': 'साइन इन',
    'auth.signup.button': 'साइन अप',
    'auth.signin.link': 'पहले से खाता है? साइन इन करें',
    'auth.signup.link': 'खाता नहीं है? साइन अप करें',
    
    // Issue Management
    'issues.title': 'सामुदायिक समस्याएं',
    'issues.report.title': 'नई समस्या की रिपोर्ट करें',
    'issues.type': 'समस्या का प्रकार',
    'issues.title.label': 'समस्या का शीर्षक',
    'issues.description': 'विवरण',
    'issues.location': 'स्थान',
    'issues.photos': 'फोटो अपलोड करें',
    'issues.submit': 'समस्या सबमिट करें',
    'issues.status.reported': 'रिपोर्ट की गई',
    'issues.status.inProgress': 'प्रगति में',
    'issues.status.resolved': 'हल हो गई',
    'issues.status.rejected': 'अस्वीकृत',
    'issues.status.pending': 'लंबित',
    'issues.hype': 'हाइप',
    'issues.hyped': 'हाइप किया!',
    'issues.view': 'देखें',
    'issues.viewDetails': 'विवरण देखें',
    
    // Issue Types
    'issueType.roadInfrastructure': 'सड़क बुनियादी ढांचा',
    'issueType.wasteManagement': 'अपशिष्ट प्रबंधन',
    'issueType.environmentalIssues': 'पर्यावरणीय समस्याएं',
    'issueType.utilitiesInfrastructure': 'उपयोगिताएं और बुनियादी ढांचा',
    'issueType.publicSafety': 'सार्वजनिक सुरक्षा',
    'issueType.other': 'अन्य',
    
    // Report Issue Form
    'report.title': 'नई समस्या की रिपोर्ट करें',
    'report.subtitle': 'बुनियादी ढांचे की समस्याओं की रिपोर्ट करके अपने समुदाय को बेहतर बनाने में मदद करें',
    'report.form.title': 'समस्या का शीर्षक',
    'report.form.titlePlaceholder': 'समस्या का संक्षिप्त विवरण',
    'report.form.description': 'विस्तृत विवरण',
    'report.form.descriptionPlaceholder': 'समस्या के बारे में अधिक विवरण प्रदान करें',
    'report.form.type': 'समस्या का प्रकार',
    'report.form.location': 'स्थान',
    'report.form.locationPlaceholder': 'स्थान दर्ज करें या चुनें',
    'report.form.photos': 'फोटो अपलोड करें',
    'report.form.photosDesc': 'समस्या की पहचान और समाधान में मदद के लिए फोटो जोड़ें',
    'report.form.submit': 'रिपोर्ट सबमिट करें',
    'report.form.submitting': 'सबमिट हो रहा है...',
    'report.success': 'समस्या सफलतापूर्वक रिपोर्ट की गई!',
    'report.error': 'रिपोर्ट सबमिट करने में विफल। कृपया पुनः प्रयास करें।',
    
    // Photo Upload
    'photo.title': 'फोटो जोड़ें',
    'photo.description': 'समस्या को समझने और पता लगाने में मदद के लिए एक प्रामाणिक फोटो अपलोड करें।',
    'photo.takePhoto': 'फोटो लें',
    'photo.chooseGallery': 'गैलरी से चुनें',
    'photo.verificationNote': 'छवियों की प्रामाणिकता की जांच की जाती है। GPS डेटा सटीकता में सुधार करता है।',
    
    // Profile
    'profile.title': 'प्रोफाइल सेटिंग्स',
    'profile.subtitle': 'अपनी खाता जानकारी और प्राथमिकताओं का प्रबंधन करें',
    'profile.personalInfo': 'व्यक्तिगत जानकारी',
    'profile.accountSettings': 'खाता सेटिंग्स',
    'profile.myIssues': 'मेरी रिपोर्ट की गई समस्याएं',
    'profile.statistics': 'आंकड़े',
    'profile.editProfile': 'प्रोफाइल संपादित करें',
    'profile.saveChanges': 'परिवर्तन सहेजें',
    'profile.cancelEdit': 'रद्द करें',
    
    // Admin Dashboard
    'admin.title': 'व्यवस्थापक डैशबोर्ड',
    'admin.subtitle': 'सामुदायिक समस्याओं की निगरानी, प्रबंधन और समाधान कुशलता से करें।',
    'admin.stats.total': 'कुल समस्याएं',
    'admin.stats.resolved': 'हल हो गई',
    'admin.stats.inProgress': 'प्रगति में',
    'admin.stats.pending': 'लंबित',
    'admin.assign': 'असाइन करें',
    'admin.assignPOC': 'POC असाइन करें',
    'admin.delete': 'हटाएं',
    'admin.department': 'विभाग',
    'admin.pocName': 'POC नाम',
    'admin.phoneNumber': 'फोन नंबर',
    'admin.email': 'ईमेल',
    
    // Common
    'common.search': 'खोजें',
    'common.filter': 'फिल्टर',
    'common.cancel': 'रद्द करें',
    'common.save': 'सेव करें',
    'common.close': 'बंद करें',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.current': 'वर्तमान का उपयोग करें',
    'common.analyzing': 'AI विश्लेषण हो रहा है...',
    'common.processing': 'GPS प्रोसेसिंग...',
    'common.required': 'आवश्यक',
    'common.optional': 'वैकल्पिक',
    'common.location': 'स्थान',
    'common.description': 'विवरण',
    'common.priority': 'प्राथमिकता',
    'common.priority.low': 'कम',
    'common.priority.medium': 'मध्यम',
    'common.priority.high': 'उच्च',
    'common.priority.critical': 'गंभीर',
    
    // Language Selector
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.kannada': 'ಕನ್ನಡ',
    'language.select': 'भाषा चुनें',
  },
  
  kn: {
    // Navigation
    'nav.home': 'ಮುಖ್ಯಪುಟ',
    'nav.about': 'ಬಗ್ಗೆ',
    'nav.contact': 'ಸಂಪರ್ಕ',
    'nav.signin': 'ಸೈನ್ ಇನ್',
    'nav.signup': 'ಸೈನ್ ಅಪ್',
    'nav.profile': 'ಪ್ರೊಫೈಲ್',
    'nav.logout': 'ಲಾಗ್ ಔಟ್',
    'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    
    // Hero Section
    'hero.title': 'ನಿಮ್ಮ ಸಮುದಾಯದಲ್ಲಿ ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿ',
    'hero.subtitle': 'ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡುವ ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡುವ ಮೂಲಕ ತಮ್ಮ ನೆರೆಹೊರೆಯನ್ನು ಉತ್ತಮಗೊಳಿಸುವ ಸಾವಿರಾರು ನಾಗರಿಕರೊಂದಿಗೆ ಸೇರಿಕೊಳ್ಳಿ.',
    'hero.cta.citizen': 'ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
    'hero.cta.admin': 'ಅಡ್ಮಿನ್ ಲಾಗಿನ್',
    
    // Features
    'features.title': 'CivicEye ಅನ್ನು ಏಕೆ ಆಯ್ಕೆ ಮಾಡಬೇಕು?',
    'features.report.title': 'ಸುಲಭ ವರದಿ',
    'features.report.desc': 'ಫೋಟೋಗಳು ಮತ್ತು ಸ್ಥಳದೊಂದಿಗೆ ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳನ್ನು ಸೆಕೆಂಡುಗಳಲ್ಲಿ ವರದಿ ಮಾಡಿ',
    'features.track.title': 'ರಿಯಲ್-ಟೈಮ್ ಟ್ರ್ಯಾಕಿಂಗ್',
    'features.track.desc': 'ನಿಮ್ಮ ವರದಿ ಮಾಡಿದ ಸಮಸ್ಯೆಗಳ ಸ್ಥಿತಿಯನ್ನು ರಿಯಲ್-ಟೈಮ್‌ನಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    'features.community.title': 'ಸಮುದಾಯ ಚಾಲಿತ',
    'features.community.desc': 'ನಿಮ್ಮ ಸಮುದಾಯದೊಂದಿಗೆ ತೊಡಗಿಸಿಕೊಳ್ಳಿ ಮತ್ತು ಪ್ರಮುಖ ಸಮಸ್ಯೆಗಳನ್ನು ಬೆಂಬಲಿಸಿ',
    
    // Auth Forms
    'auth.signin.title': 'ನಿಮ್ಮ ಖಾತೆಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
    'auth.signup.title': 'ನಿಮ್ಮ ಖಾತೆಯನ್ನು ರಚಿಸಿ',
    'auth.email': 'ಇಮೇಲ್ ವಿಳಾಸ',
    'auth.password': 'ಪಾಸ್‌ವರ್ಡ್',
    'auth.confirmPassword': 'ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
    'auth.fullName': 'ಪೂರ್ಣ ಹೆಸರು',
    'auth.phoneNumber': 'ಫೋನ್ ಸಂಖ್ಯೆ',
    'auth.role': 'ಪಾತ್ರ',
    'auth.citizen': 'ನಾಗರಿಕ',
    'auth.admin': 'ನಿರ್ವಾಹಕ',
    'auth.signin.button': 'ಸೈನ್ ಇನ್',
    'auth.signup.button': 'ಸೈನ್ ಅಪ್',
    'auth.signin.link': 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ಸೈನ್ ಇನ್ ಮಾಡಿ',
    'auth.signup.link': 'ಖಾತೆ ಇಲ್ಲವೇ? ಸೈನ್ ಅಪ್ ಮಾಡಿ',
    
    // Issue Management
    'issues.title': 'ಸಮುದಾಯ ಸಮಸ್ಯೆಗಳು',
    'issues.report.title': 'ಹೊಸ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
    'issues.type': 'ಸಮಸ್ಯೆಯ ಪ್ರಕಾರ',
    'issues.title.label': 'ಸಮಸ್ಯೆಯ ಶೀರ್ಷಿಕೆ',
    'issues.description': 'ವಿವರಣೆ',
    'issues.location': 'ಸ್ಥಳ',
    'issues.photos': 'ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    'issues.submit': 'ಸಮಸ್ಯೆಯನ್ನು ಸಲ್ಲಿಸಿ',
    'issues.status.reported': 'ವರದಿ ಮಾಡಲಾಗಿದೆ',
    'issues.status.inProgress': 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    'issues.status.resolved': 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    'issues.status.rejected': 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
    'issues.status.pending': 'ಬಾಕಿ ಇದೆ',
    'issues.hype': 'ಹೈಪ್',
    'issues.hyped': 'ಹೈಪ್ ಮಾಡಲಾಗಿದೆ!',
    'issues.view': 'ವೀಕ್ಷಿಸಿ',
    'issues.viewDetails': 'ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    
    // Issue Types
    'issueType.roadInfrastructure': 'ರಸ್ತೆ ಮೂಲಸೌಕರ್ಯ',
    'issueType.wasteManagement': 'ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣೆ',
    'issueType.environmentalIssues': 'ಪರಿಸರ ಸಮಸ್ಯೆಗಳು',
    'issueType.utilitiesInfrastructure': 'ಉಪಯೋಗಗಳು ಮತ್ತು ಮೂಲಸೌಕರ್ಯ',
    'issueType.publicSafety': 'ಸಾರ್ವಜನಿಕ ಸುರಕ್ಷತೆ',
    'issueType.other': 'ಇತರೆ',
    
    // Report Issue Form
    'report.title': 'ಹೊಸ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
    'report.subtitle': 'ಮೂಲಸೌಕರ್ಯ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡುವ ಮೂಲಕ ನಿಮ್ಮ ಸಮುದಾಯವನ್ನು ಸುಧಾರಿಸಲು ಸಹಾಯ ಮಾಡಿ',
    'report.form.title': 'ಸಮಸ್ಯೆಯ ಶೀರ್ಷಿಕೆ',
    'report.form.titlePlaceholder': 'ಸಮಸ್ಯೆಯ ಸಂಕ್ಷಿಪ್ತ ವಿವರಣೆ',
    'report.form.description': 'ವಿವರವಾದ ವಿವರಣೆ',
    'report.form.descriptionPlaceholder': 'ಸಮಸ್ಯೆಯ ಬಗ್ಗೆ ಹೆಚ್ಚಿನ ವಿವರಗಳನ್ನು ಒದಗಿಸಿ',
    'report.form.type': 'ಸಮಸ್ಯೆಯ ಪ್ರಕಾರ',
    'report.form.location': 'ಸ್ಥಳ',
    'report.form.locationPlaceholder': 'ಸ್ಥಳವನ್ನು ನಮೂದಿಸಿ ಅಥವಾ ಆಯ್ಕೆಮಾಡಿ',
    'report.form.photos': 'ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    'report.form.photosDesc': 'ಸಮಸ್ಯೆಯನ್ನು ಗುರುತಿಸಲು ಮತ್ತು ಪರಿಹರಿಸಲು ಸಹಾಯ ಮಾಡಲು ಫೋಟೋಗಳನ್ನು ಸೇರಿಸಿ',
    'report.form.submit': 'ವರದಿಯನ್ನು ಸಲ್ಲಿಸಿ',
    'report.form.submitting': 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...',
    'report.success': 'ಸಮಸ್ಯೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ವರದಿ ಮಾಡಲಾಗಿದೆ!',
    'report.error': 'ವರದಿಯನ್ನು ಸಲ್ಲಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    
    // Photo Upload
    'photo.title': 'ಫೋಟೋ ಸೇರಿಸಿ',
    'photo.description': 'ಸಮಸ್ಯೆಯನ್ನು ಪತ್ತೆಹಚ್ಚಲು ಮತ್ತು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡಲು ಪ್ರಾಮಾಣಿಕ ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
    'photo.takePhoto': 'ಫೋಟೋ ತೆಗೆಯಿರಿ',
    'photo.chooseGallery': 'ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ',
    'photo.verificationNote': 'ಚಿತ್ರಗಳ ಪ್ರಾಮಾಣಿಕತೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ. GPS ಡೇಟಾ ನಿಖರತೆಯನ್ನು ಸುಧಾರಿಸುತ್ತದೆ.',
    
    // Profile
    'profile.title': 'ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'profile.subtitle': 'ನಿಮ್ಮ ಖಾತೆ ಮಾಹಿತಿ ಮತ್ತು ಆದ್ಯತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    'profile.personalInfo': 'ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ',
    'profile.accountSettings': 'ಖಾತೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'profile.myIssues': 'ನನ್ನ ವರದಿ ಮಾಡಿದ ಸಮಸ್ಯೆಗಳು',
    'profile.statistics': 'ಅಂಕಿಅಂಶಗಳು',
    'profile.editProfile': 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
    'profile.saveChanges': 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    'profile.cancelEdit': 'ರದ್ದುಗೊಳಿಸಿ',
    
    // Admin Dashboard
    'admin.title': 'ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'admin.subtitle': 'ಸಮುದಾಯ ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಣಾಮಕಾರಿಯಾಗಿ ಮೇಲ್ವಿಚಾರಣೆ, ನಿರ್ವಹಣೆ ಮತ್ತು ಪರಿಹರಿಸಿ.',
    'admin.stats.total': 'ಒಟ್ಟು ಸಮಸ್ಯೆಗಳು',
    'admin.stats.resolved': 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    'admin.stats.inProgress': 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    'admin.stats.pending': 'ಬಾಕಿ ಇದೆ',
    'admin.assign': 'ನಿಯೋಜಿಸಿ',
    'admin.assignPOC': 'POC ನಿಯೋಜಿಸಿ',
    'admin.delete': 'ಅಳಿಸಿ',
    'admin.department': 'ವಿಭಾಗ',
    'admin.pocName': 'POC ಹೆಸರು',
    'admin.phoneNumber': 'ಫೋನ್ ಸಂಖ್ಯೆ',
    'admin.email': 'ಇಮೇಲ್',
    
    // Common
    'common.search': 'ಹುಡುಕಿ',
    'common.filter': 'ಫಿಲ್ಟರ್',
    'common.cancel': 'ರದ್ದುಗೊಳಿಸಿ',
    'common.save': 'ಉಳಿಸಿ',
    'common.close': 'ಮುಚ್ಚಿ',
    'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    'common.error': 'ದೋಷ',
    'common.success': 'ಯಶಸ್ಸು',
    'common.current': 'ಪ್ರಸ್ತುತವನ್ನು ಬಳಸಿ',
    'common.analyzing': 'AI ವಿಶ್ಲೇಷಣೆ ನಡೆಯುತ್ತಿದೆ...',
    'common.processing': 'GPS ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...',
    'common.required': 'ಅಗತ್ಯವಿದೆ',
    'common.optional': 'ಐಚ್ಛಿಕ',
    'common.location': 'ಸ್ಥಳ',
    'common.description': 'ವಿವರಣೆ',
    'common.priority': 'ಆದ್ಯತೆ',
    'common.priority.low': 'ಕಡಿಮೆ',
    'common.priority.medium': 'ಮಧ್ಯಮ',
    'common.priority.high': 'ಹೆಚ್ಚು',
    'common.priority.critical': 'ನಿರ್ಣಾಯಕ',
    
    // Language Selector
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.kannada': 'ಕನ್ನಡ',
    'language.select': 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
  },
};
