import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  fr: {
    // Navigation
    dashboard: 'Tableau de bord',
    clients: 'Clients',
    fournisseurs: 'Fournisseurs',
    produits: 'Produits',
    commandes: 'Commandes',
    devis: 'Devis',
    achats: 'Achats',
    stock: 'Stock',
    finance: 'Finance',
    utilisateurs: 'Utilisateurs',
    documents: 'Documents',
    archives: 'Archives',
    notifications: 'Notifications',
    parametres: 'Paramètres',
    deconnexion: 'Déconnexion',

    // Sections
    navigation: 'Navigation',
    ventes: 'Ventes',
    achats: 'Achats',
    stock: 'Stock',
    finance: 'Finance',
    administration: 'Administration',

    // Actions
    creer: 'Créer',
    modifier: 'Modifier',
    supprimer: 'Supprimer',
    valider: 'Valider',
    annuler: 'Annuler',
    enregistrer: 'Enregistrer',
    rechercher: 'Rechercher',
    exporter: 'Exporter',
    imprimer: 'Imprimer',
    telecharger: 'Télécharger',
    retour: 'Retour',
    actions: 'Actions',

    // États
    en_attente: 'En attente',
    confirmee: 'Confirmée',
    livree: 'Livrée',
    annulee: 'Annulée',
    actif: 'Actif',
    inactif: 'Inactif',
    brouillon: 'Brouillon',
    envoye: 'Envoyé',
    accepte: 'Accepté',
    refuse: 'Refusé',
    expire: 'Expiré',
    tous: 'Tous',

    // Général
    total: 'Total',
    montant: 'Montant',
    date: 'Date',
    statut: 'Statut',
    nom: 'Nom',
    email: 'Email',
    telephone: 'Téléphone',
    adresse: 'Adresse',
    description: 'Description',
    prix: 'Prix',
    quantite: 'Quantité',

    // Messages
    chargement: 'Chargement...',
    aucune_donnee: 'Aucune donnée',
    erreur_serveur: 'Erreur serveur',
    succes: 'Succès',
    confirmation_suppression: 'Confirmer la suppression ?',

    // Module commercial
    gestion_clients: 'Gestion des clients',
    gerer_clients: 'Gérez tous vos clients',
    nouveau_client: 'Nouveau client',
    modifier_client: 'Modifier le client',
    client_cree: 'Client créé avec succès',
    client_modifie: 'Client modifié avec succès',
    client_supprime: 'Client supprimé',

    // Module financier
    gestion_finance: 'Gestion financière',
    depenses: 'Dépenses',
    recettes: 'Recettes',
    paiements: 'Paiements',
    nouvelle_depense: 'Nouvelle dépense',
    nouvelle_recette: 'Nouvelle recette',

    // Module stock
    gestion_stock: 'Gestion de stock',
    inventaire: 'Inventaire',
    mouvements_stock: 'Mouvements de stock',
    alerte_rupture: 'Alerte de rupture',
    transfert_stock: 'Transfert de stock',
    entrepots: 'Entrepôts',

    // Module Ventes
    gestion_commandes: 'Gestion des commandes',
    nouvelle_commande: 'Nouvelle commande',
    commande_cree: 'Commande créée avec succès',
    promotions: 'Promotions',
    paiement_en_ligne: 'Paiement en ligne',

    // Module Achats
    gestion_achats: 'Gestion des achats',
    nouveau_achat: 'Nouvel achat',
    paiement_fournisseur: 'Paiement fournisseur',

    // Pages
    bienvenue: 'Bienvenue',
    espace_client: 'Espace client',
    profil: 'Profil',
    factures: 'Factures',
    securite_mfa: 'Sécurité MFA',
    calculateur: 'Calculateur',

    // Erreurs
    erreur_connexion: 'Erreur de connexion',
    email_ou_password_incorrect: 'Email ou mot de passe incorrect',
    filtrer_par: 'Filtrer par',
    page: 'Page',

    // Auth
    login: 'Se connecter',
    register: 'S\'inscrire',
    password: 'Mot de passe',
    forgot_password: 'Mot de passe oublié ?',
    create_account: 'Créer un compte entreprise',
    or: 'ou',
    all_rights_reserved: 'Tous droits réservés',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    clients: 'Clients',
    fournisseurs: 'Suppliers',
    produits: 'Products',
    commandes: 'Orders',
    devis: 'Quotes',
    achats: 'Purchases',
    stock: 'Stock',
    finance: 'Finance',
    utilisateurs: 'Users',
    documents: 'Documents',
    archives: 'Archives',
    notifications: 'Notifications',
    parametres: 'Settings',
    deconnexion: 'Logout',

    // Sections
    navigation: 'Navigation',
    ventes: 'Sales',
    achats: 'Purchases',
    stock: 'Stock',
    finance: 'Finance',
    administration: 'Administration',

    // Actions
    creer: 'Create',
    modifier: 'Edit',
    supprimer: 'Delete',
    valider: 'Validate',
    annuler: 'Cancel',
    enregistrer: 'Save',
    rechercher: 'Search',
    exporter: 'Export',
    imprimer: 'Print',
    telecharger: 'Download',
    retour: 'Back',
    actions: 'Actions',

    // États
    en_attente: 'Pending',
    confirmee: 'Confirmed',
    livree: 'Delivered',
    annulee: 'Cancelled',
    actif: 'Active',
    inactif: 'Inactive',
    brouillon: 'Draft',
    envoye: 'Sent',
    accepte: 'Accepted',
    refuse: 'Refused',
    expire: 'Expired',
    tous: 'All',

    // Général
    total: 'Total',
    montant: 'Amount',
    date: 'Date',
    statut: 'Status',
    nom: 'Name',
    email: 'Email',
    telephone: 'Phone',
    adresse: 'Address',
    description: 'Description',
    prix: 'Price',
    quantite: 'Quantity',

    // Messages
    chargement: 'Loading...',
    aucune_donnee: 'No data',
    erreur_serveur: 'Server error',
    succes: 'Success',
    confirmation_suppression: 'Confirm deletion?',

    // Module commercial
    gestion_clients: 'Client management',
    gerer_clients: 'Manage all your clients',
    nouveau_client: 'New client',
    modifier_client: 'Edit client',
    client_cree: 'Client created successfully',
    client_modifie: 'Client updated successfully',
    client_supprime: 'Client deleted',

    // Module financier
    gestion_finance: 'Financial management',
    depenses: 'Expenses',
    recettes: 'Revenue',
    paiements: 'Payments',
    nouvelle_depense: 'New expense',
    nouvelle_recette: 'New revenue',

    // Module stock
    gestion_stock: 'Stock management',
    inventaire: 'Inventory',
    mouvements_stock: 'Stock movements',
    alerte_rupture: 'Stock alert',
    transfert_stock: 'Stock transfer',
    entrepots: 'Warehouses',

    // Module Ventes
    gestion_commandes: 'Order management',
    nouvelle_commande: 'New order',
    commande_cree: 'Order created successfully',
    promotions: 'Promotions',
    paiement_en_ligne: 'Online Payment',

    // Module Achats
    gestion_achats: 'Purchase management',
    nouveau_achat: 'New purchase',
    paiement_fournisseur: 'Supplier Payment',

    // Pages
    bienvenue: 'Welcome',
    espace_client: 'Client space',
    profil: 'Profile',
    factures: 'Invoices',
    securite_mfa: 'MFA Security',
    calculateur: 'Calculator',

    // Erreurs
    erreur_connexion: 'Connection error',
    email_ou_password_incorrect: 'Invalid email or password',
    filtrer_par: 'Filter by',
    page: 'Page',

    // Auth
    login: 'Login',
    register: 'Register',
    password: 'Password',
    forgot_password: 'Forgot password?',
    create_account: 'Create company account',
    or: 'or',
    all_rights_reserved: 'All rights reserved',
  },
  ar: {
    // Navigation
    dashboard: 'لوحة القيادة',
    clients: 'العملاء',
    fournisseurs: 'الموردون',
    produits: 'المنتجات',
    commandes: 'الطلبات',
    devis: 'عروض الأسعار',
    achats: 'المشتريات',
    stock: 'المخزون',
    finance: 'المالية',
    utilisateurs: 'المستخدمون',
    documents: 'المستندات',
    archives: 'الأرشيف',
    notifications: 'الإشعارات',
    parametres: 'الإعدادات',
    deconnexion: 'تسجيل الخروج',

    // Sections
    navigation: 'التنقل',
    ventes: 'المبيعات',
    achats: 'المشتريات',
    stock: 'المخزون',
    finance: 'المالية',
    administration: 'الإدارة',

    // Actions
    creer: 'إنشاء',
    modifier: 'تعديل',
    supprimer: 'حذف',
    valider: 'تأكيد',
    annuler: 'إلغاء',
    enregistrer: 'حفظ',
    rechercher: 'بحث',
    exporter: 'تصدير',
    imprimer: 'طباعة',
    telecharger: 'تحميل',
    retour: 'رجوع',
    actions: 'إجراءات',

    // États
    en_attente: 'قيد الانتظار',
    confirmee: 'مؤكد',
    livree: 'تم التسليم',
    annulee: 'ملغى',
    actif: 'نشط',
    inactif: 'غير نشط',
    brouillon: 'مسودة',
    envoye: 'مرسل',
    accepte: 'مقبول',
    refuse: 'مرفوض',
    expire: 'منتهي الصلاحية',
    tous: 'الكل',

    // Général
    total: 'المجموع',
    montant: 'المبلغ',
    date: 'التاريخ',
    statut: 'الحالة',
    nom: 'الاسم',
    email: 'البريد الإلكتروني',
    telephone: 'الهاتف',
    adresse: 'العنوان',
    description: 'الوصف',
    prix: 'السعر',
    quantite: 'الكمية',

    // Messages
    chargement: 'جاري التحميل...',
    aucune_donnee: 'لا توجد بيانات',
    erreur_serveur: 'خطأ في الخادم',
    succes: 'نجاح',
    confirmation_suppression: 'تأكيد الحذف؟',

    // Module commercial
    gestion_clients: 'إدارة العملاء',
    gerer_clients: 'إدارة جميع عملائك',
    nouveau_client: 'عميل جديد',
    modifier_client: 'تعديل العميل',
    client_cree: 'تم إنشاء العميل بنجاح',
    client_modifie: 'تم تعديل العميل بنجاح',
    client_supprime: 'تم حذف العميل',

    // Module financier
    gestion_finance: 'الإدارة المالية',
    depenses: 'المصروفات',
    recettes: 'الإيرادات',
    paiements: 'المدفوعات',
    nouvelle_depense: 'مصروف جديد',
    nouvelle_recette: 'إيراد جديد',

    // Module stock
    gestion_stock: 'إدارة المخزون',
    inventaire: 'الجرد',
    mouvements_stock: 'حركات المخزون',
    alerte_rupture: 'تنبيه نقص المخزون',
    transfert_stock: 'تحويل المخزون',
    entrepots: 'المستودعات',

    // Module Ventes
    gestion_commandes: 'إدارة الطلبات',
    nouvelle_commande: 'طلب جديد',
    commande_cree: 'تم إنشاء الطلب بنجاح',
    promotions: 'العروض الترويجية',
    paiement_en_ligne: 'الدفع عبر الإنترنت',

    // Module Achats
    gestion_achats: 'إدارة المشتريات',
    nouveau_achat: 'شراء جديد',
    paiement_fournisseur: 'دفع المورد',

    // Pages
    bienvenue: 'مرحباً',
    espace_client: 'مساحة العميل',
    profil: 'الملف الشخصي',
    factures: 'الفواتير',
    securite_mfa: 'أمان MFA',
    calculateur: 'آلة حاسبة',

    // Erreurs
    erreur_connexion: 'خطأ في الاتصال',
    email_ou_password_incorrect: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    filtrer_par: 'تصفية حسب',
    page: 'صفحة',

    // Auth
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    password: 'كلمة المرور',
    forgot_password: 'نسيت كلمة المرور؟',
    create_account: 'إنشاء حساب شركة',
    or: 'أو',
    all_rights_reserved: 'جميع الحقوق محفوظة',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app-language') || 'fr';
  });
  const [dir, setDir] = useState('ltr');

  useEffect(() => {
    localStorage.setItem('app-language', language);
    const newDir = language === 'ar' ? 'rtl' : 'ltr';
    setDir(newDir);
    document.documentElement.dir = newDir;
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, dir, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);