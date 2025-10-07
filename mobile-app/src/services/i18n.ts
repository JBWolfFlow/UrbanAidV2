import i18n from 'i18next';
import { initReactI18next, useTranslation as useI18nTranslation } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      map: 'Map',
      searchTab: 'Search',
      add: 'Add',
      profile: 'Profile',
      
      // Utility Types
      water_fountain: 'Water Fountain',
      restroom: 'Restroom',
      bench: 'Bench',
      handwashing: 'Handwashing Station',
      shelter: 'Shelter',
      free_food: 'Free Food',
      wifi: 'Public Wi-Fi',
      charging: 'Charging Station',
      transit: 'Transit Stop',
      library: 'Library',
      clinic: 'Clinic',
      
      // Actions
      find_nearby: 'Find Nearby',
      add_utility: 'Add Utility',
      get_directions: 'Get Directions',
      report_issue: 'Report Issue',
      rate: 'Rate',
      share: 'Share',
      
      // Filters
      distance: 'Distance',
      open_now: 'Open Now',
      wheelchair_accessible: 'Wheelchair Accessible',
      verified: 'Verified',
      
      // Messages
      location_permission_required: 'Location Permission Required',
      location_permission_message: 'UrbanAid needs location access to show nearby public utilities.',
      no_utilities_found: 'No utilities found nearby',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      
      // Forms
      name: 'Name',
      description: 'Description',
      category: 'Category',
      address: 'Address',
      phone: 'Phone',
      website: 'Website',
      hours: 'Hours',
      save: 'Save',
      cancel: 'Cancel',
      
      // Settings
      settings: 'Settings',
      dark_mode: 'Dark Mode',
      language: 'Language',
      about: 'About',
      privacy_policy: 'Privacy Policy',
      terms_of_service: 'Terms of Service',
      
      // Search Screen
      search: {
        placeholder: 'Search for utilities...',
        filters: 'Filters',
        noResults: 'No utilities found',
        startSearching: 'Start searching to find utilities',
        filterBy: 'Filter By',
        utilityTypes: 'Utility Types',
        clearFilters: 'Clear Filters',
        applyFilters: 'Apply Filters',
        noDescription: 'No description available',
        accessible: 'Accessible',
        '24hours': '24/7',
      },
      
      // Utility Type Labels
      utilityTypeLabels: {
        waterFountain: 'Water Fountain',
        restroom: 'Restroom',
        chargingStation: 'Charging Station',
        parking: 'Parking',
        wifi: 'WiFi',
        atm: 'ATM',
        phoneBooth: 'Phone Booth',
        bench: 'Bench',
      },
    },
  },
  es: {
    translation: {
      // Navigation
      map: 'Mapa',
      search: 'Buscar',
      add: 'Agregar',
      profile: 'Perfil',
      
      // Utility Types
      water_fountain: 'Fuente de Agua',
      restroom: 'Baño',
      bench: 'Banco',
      handwashing: 'Estación de Lavado de Manos',
      shelter: 'Refugio',
      free_food: 'Comida Gratis',
      wifi: 'Wi-Fi Público',
      charging: 'Estación de Carga',
      transit: 'Parada de Transporte',
      library: 'Biblioteca',
      clinic: 'Clínica',
      
      // Actions
      find_nearby: 'Encontrar Cerca',
      add_utility: 'Agregar Servicio',
      get_directions: 'Obtener Direcciones',
      report_issue: 'Reportar Problema',
      rate: 'Calificar',
      share: 'Compartir',
      
      // Filters
      distance: 'Distancia',
      open_now: 'Abierto Ahora',
      wheelchair_accessible: 'Accesible en Silla de Ruedas',
      verified: 'Verificado',
      
      // Messages
      location_permission_required: 'Permiso de Ubicación Requerido',
      location_permission_message: 'UrbanAid necesita acceso a la ubicación para mostrar servicios públicos cercanos.',
      no_utilities_found: 'No se encontraron servicios cercanos',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      
      // Forms
      name: 'Nombre',
      description: 'Descripción',
      category: 'Categoría',
      address: 'Dirección',
      phone: 'Teléfono',
      website: 'Sitio Web',
      hours: 'Horarios',
      save: 'Guardar',
      cancel: 'Cancelar',
      
      // Settings
      settings: 'Configuración',
      dark_mode: 'Modo Oscuro',
      language: 'Idioma',
      about: 'Acerca de',
      privacy_policy: 'Política de Privacidad',
      terms_of_service: 'Términos de Servicio',
    },
  },
  fr: {
    translation: {
      // Navigation
      map: 'Carte',
      search: 'Rechercher',
      add: 'Ajouter',
      profile: 'Profil',
      
      // Utility Types
      water_fountain: 'Fontaine à Eau',
      restroom: 'Toilettes',
      bench: 'Banc',
      handwashing: 'Station de Lavage des Mains',
      shelter: 'Abri',
      free_food: 'Nourriture Gratuite',
      wifi: 'Wi-Fi Public',
      charging: 'Station de Charge',
      transit: 'Arrêt de Transport',
      library: 'Bibliothèque',
      clinic: 'Clinique',
      
      // Actions
      find_nearby: 'Trouver à Proximité',
      add_utility: 'Ajouter un Service',
      get_directions: 'Obtenir les Directions',
      report_issue: 'Signaler un Problème',
      rate: 'Noter',
      share: 'Partager',
      
      // Filters
      distance: 'Distance',
      open_now: 'Ouvert Maintenant',
      wheelchair_accessible: 'Accessible en Fauteuil Roulant',
      verified: 'Vérifié',
      
      // Messages
      location_permission_required: 'Autorisation de Localisation Requise',
      location_permission_message: 'UrbanAid a besoin d\'accéder à votre localisation pour afficher les services publics à proximité.',
      no_utilities_found: 'Aucun service trouvé à proximité',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      
      // Forms
      name: 'Nom',
      description: 'Description',
      category: 'Catégorie',
      address: 'Adresse',
      phone: 'Téléphone',
      website: 'Site Web',
      hours: 'Heures',
      save: 'Enregistrer',
      cancel: 'Annuler',
      
      // Settings
      settings: 'Paramètres',
      dark_mode: 'Mode Sombre',
      language: 'Langue',
      about: 'À Propos',
      privacy_policy: 'Politique de Confidentialité',
      terms_of_service: 'Conditions de Service',
    },
  },
  hi: {
    translation: {
      // Navigation
      map: 'नक्शा',
      search: 'खोजें',
      add: 'जोड़ें',
      profile: 'प्रोफाइल',
      
      // Utility Types
      water_fountain: 'पानी का फव्वारा',
      restroom: 'शौचालय',
      bench: 'बेंच',
      handwashing: 'हाथ धोने का स्थान',
      shelter: 'आश्रय',
      free_food: 'मुफ्त खाना',
      wifi: 'सार्वजनिक वाई-फाई',
      charging: 'चार्जिंग स्टेशन',
      transit: 'ट्रांजिट स्टॉप',
      library: 'पुस्तकालय',
      clinic: 'क्लिनिक',
      
      // Actions
      find_nearby: 'आस-पास खोजें',
      add_utility: 'सुविधा जोड़ें',
      get_directions: 'दिशा निर्देश प्राप्त करें',
      report_issue: 'समस्या की रिपोर्ट करें',
      rate: 'रेट करें',
      share: 'साझा करें',
      
      // Filters
      distance: 'दूरी',
      open_now: 'अभी खुला',
      wheelchair_accessible: 'व्हीलचेयर सुलभ',
      verified: 'सत्यापित',
      
      // Messages
      location_permission_required: 'स्थान अनुमति आवश्यक',
      location_permission_message: 'UrbanAid को आस-पास की सार्वजनिक सुविधाएं दिखाने के लिए स्थान की पहुंच की आवश्यकता है।',
      no_utilities_found: 'आस-पास कोई सुविधा नहीं मिली',
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफलता',
      
      // Forms
      name: 'नाम',
      description: 'विवरण',
      category: 'श्रेणी',
      address: 'पता',
      phone: 'फोन',
      website: 'वेबसाइट',
      hours: 'समय',
      save: 'सेव करें',
      cancel: 'रद्द करें',
      
      // Settings
      settings: 'सेटिंग्स',
      dark_mode: 'डार्क मोड',
      language: 'भाषा',
      about: 'के बारे में',
      privacy_policy: 'गोपनीयता नीति',
      terms_of_service: 'सेवा की शर्तें',
    },
  },
  ar: {
    translation: {
      // Navigation
      map: 'خريطة',
      search: 'بحث',
      add: 'إضافة',
      profile: 'الملف الشخصي',
      
      // Utility Types
      water_fountain: 'نافورة مياه',
      restroom: 'دورة مياه',
      bench: 'مقعد',
      handwashing: 'محطة غسيل اليدين',
      shelter: 'مأوى',
      free_food: 'طعام مجاني',
      wifi: 'واي فاي عام',
      charging: 'محطة شحن',
      transit: 'محطة نقل',
      library: 'مكتبة',
      clinic: 'عيادة',
      
      // Actions
      find_nearby: 'البحث القريب',
      add_utility: 'إضافة خدمة',
      get_directions: 'الحصول على الاتجاهات',
      report_issue: 'الإبلاغ عن مشكلة',
      rate: 'تقييم',
      share: 'مشاركة',
      
      // Filters
      distance: 'المسافة',
      open_now: 'مفتوح الآن',
      wheelchair_accessible: 'يمكن الوصول إليه بالكرسي المتحرك',
      verified: 'تم التحقق',
      
      // Messages
      location_permission_required: 'إذن الموقع مطلوب',
      location_permission_message: 'يحتاج UrbanAid إلى الوصول إلى موقعك لإظهار المرافق العامة القريبة.',
      no_utilities_found: 'لم يتم العثور على مرافق قريبة',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح',
      
      // Forms
      name: 'اسم',
      description: 'وصف',
      category: 'فئة',
      address: 'عنوان',
      phone: 'هاتف',
      website: 'موقع الكتروني',
      hours: 'ساعات',
      save: 'حفظ',
      cancel: 'إلغاء',
      
      // Settings
      settings: 'إعدادات',
      dark_mode: 'الوضع المظلم',
      language: 'لغة',
      about: 'حول',
      privacy_policy: 'سياسة الخصوصية',
      terms_of_service: 'شروط الخدمة',
    },
  },
};

/**
 * Initialize i18n with user's preferred language
 * Falls back to English if user's language is not supported
 */
export const initializeI18n = async (): Promise<void> => {
  const locales = RNLocalize.getLocales();
  const deviceLanguage = locales[0]?.languageCode || 'en';
  
  // Map device language to supported languages
  const supportedLanguages = ['en', 'es', 'fr', 'hi', 'ar'];
  const fallbackLanguage = supportedLanguages.includes(deviceLanguage) 
    ? deviceLanguage 
    : 'en';

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: fallbackLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
};

// Re-export useTranslation for convenience
export const useTranslation = useI18nTranslation;

export default i18n; 