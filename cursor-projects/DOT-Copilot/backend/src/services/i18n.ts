/**
 * Internationalization (i18n) Service
 * Supports multiple languages for the Fleet Driver Training Platform
 * 
 * Primary languages:
 * - en: English (default)
 * - es: Spanish (critical for fleet drivers)
 * - ht: Haitian Creole
 * - pt: Portuguese
 */

export type SupportedLanguage = 'en' | 'es' | 'ht' | 'pt';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  ht: 'Kreyòl Ayisyen',
  pt: 'Português',
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Translation dictionaries
const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Common
    'common.welcome': 'Welcome',
    'common.logout': 'Logout',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.complete': 'Complete',
    'common.start': 'Start',
    'common.continue': 'Continue',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.training': 'Training',
    'nav.assignments': 'Assignments',
    'nav.documents': 'Documents',
    'nav.compliance': 'Compliance',
    'nav.reminders': 'Reminders',
    'nav.settings': 'Settings',
    'nav.help': 'Help',
    'nav.profile': 'Profile',

    // Dashboard
    'dashboard.title': 'Driver Dashboard',
    'dashboard.pending_assignments': 'Pending Assignments',
    'dashboard.completed_training': 'Completed Training',
    'dashboard.fleet_rank': 'Fleet Rank',
    'dashboard.quiz_average': 'Quiz Average',
    'dashboard.current_streak': 'Current Streak',
    'dashboard.days': 'days',

    // Training
    'training.start_training': 'Start Training',
    'training.continue_training': 'Continue Training',
    'training.completed': 'Completed',
    'training.in_progress': 'In Progress',
    'training.not_started': 'Not Started',
    'training.due_date': 'Due Date',
    'training.overdue': 'Overdue',
    'training.lesson': 'Lesson',
    'training.module': 'Module',
    'training.program': 'Training Program',
    'training.quiz': 'Quiz',
    'training.score': 'Score',
    'training.pass': 'Pass',
    'training.fail': 'Fail',
    'training.retry': 'Retry',
    'training.time_remaining': 'Time Remaining',

    // Documents
    'documents.title': 'My Documents',
    'documents.cdl': 'CDL License',
    'documents.medical_card': 'Medical Card',
    'documents.hazmat': 'Hazmat Endorsement',
    'documents.expiring_soon': 'Expiring Soon',
    'documents.expired': 'Expired',
    'documents.valid': 'Valid',
    'documents.upload': 'Upload Document',
    'documents.expiration_date': 'Expiration Date',
    'documents.days_until_expiration': 'Days until expiration',

    // Compliance
    'compliance.title': 'Compliance Status',
    'compliance.compliant': 'Compliant',
    'compliance.at_risk': 'At Risk',
    'compliance.non_compliant': 'Non-Compliant',
    'compliance.required_training': 'Required Training',
    'compliance.hours_completed': 'Hours Completed',
    'compliance.hours_required': 'Hours Required',

    // Notifications
    'notification.new_assignment': 'New Training Assigned',
    'notification.due_soon': 'Training Due Soon',
    'notification.overdue': 'Training Overdue',
    'notification.completed': 'Training Completed',
    'notification.document_expiring': 'Document Expiring',
    'notification.document_expired': 'Document Expired',
    'notification.reminder': 'Reminder',

    // E-Signature
    'esignature.title': 'Electronic Signature',
    'esignature.instruction': 'Please sign below to acknowledge completion',
    'esignature.clear': 'Clear',
    'esignature.confirm': 'I confirm this is my signature',

    // Quick Acknowledge
    'acknowledge.title': 'Acknowledgment Required',
    'acknowledge.instruction': 'Please read and acknowledge the following:',
    'acknowledge.confirm': 'I have read and understand the above',
    'acknowledge.sign': 'Sign & Acknowledge',

    // Behind the Wheel
    'btw.title': 'Behind-the-Wheel Training',
    'btw.session': 'Training Session',
    'btw.hours': 'Hours',
    'btw.trainer': 'Trainer',
    'btw.trainee': 'Trainee',
    'btw.skills': 'Skills Practiced',
    'btw.notes': 'Notes',
    'btw.sign_off': 'Sign Off',

    // Errors
    'error.network': 'Network error. Please check your connection.',
    'error.unauthorized': 'Please log in to continue.',
    'error.forbidden': 'You do not have permission to access this.',
    'error.not_found': 'The requested item was not found.',
    'error.server': 'Server error. Please try again later.',
    'error.validation': 'Please check your input and try again.',
  },

  es: {
    // Common
    'common.welcome': 'Bienvenido',
    'common.logout': 'Cerrar Sesión',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.search': 'Buscar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.confirm': 'Confirmar',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.submit': 'Enviar',
    'common.complete': 'Completar',
    'common.start': 'Comenzar',
    'common.continue': 'Continuar',

    // Navigation
    'nav.dashboard': 'Panel de Control',
    'nav.training': 'Entrenamiento',
    'nav.assignments': 'Asignaciones',
    'nav.documents': 'Documentos',
    'nav.compliance': 'Cumplimiento',
    'nav.reminders': 'Recordatorios',
    'nav.settings': 'Configuración',
    'nav.help': 'Ayuda',
    'nav.profile': 'Perfil',

    // Dashboard
    'dashboard.title': 'Panel del Conductor',
    'dashboard.pending_assignments': 'Asignaciones Pendientes',
    'dashboard.completed_training': 'Entrenamientos Completados',
    'dashboard.fleet_rank': 'Clasificación de Flota',
    'dashboard.quiz_average': 'Promedio de Exámenes',
    'dashboard.current_streak': 'Racha Actual',
    'dashboard.days': 'días',

    // Training
    'training.start_training': 'Comenzar Entrenamiento',
    'training.continue_training': 'Continuar Entrenamiento',
    'training.completed': 'Completado',
    'training.in_progress': 'En Progreso',
    'training.not_started': 'No Iniciado',
    'training.due_date': 'Fecha de Vencimiento',
    'training.overdue': 'Vencido',
    'training.lesson': 'Lección',
    'training.module': 'Módulo',
    'training.program': 'Programa de Entrenamiento',
    'training.quiz': 'Examen',
    'training.score': 'Puntuación',
    'training.pass': 'Aprobado',
    'training.fail': 'Reprobado',
    'training.retry': 'Reintentar',
    'training.time_remaining': 'Tiempo Restante',

    // Documents
    'documents.title': 'Mis Documentos',
    'documents.cdl': 'Licencia CDL',
    'documents.medical_card': 'Tarjeta Médica',
    'documents.hazmat': 'Endoso de Materiales Peligrosos',
    'documents.expiring_soon': 'Vence Pronto',
    'documents.expired': 'Vencido',
    'documents.valid': 'Válido',
    'documents.upload': 'Subir Documento',
    'documents.expiration_date': 'Fecha de Vencimiento',
    'documents.days_until_expiration': 'Días hasta el vencimiento',

    // Compliance
    'compliance.title': 'Estado de Cumplimiento',
    'compliance.compliant': 'En Cumplimiento',
    'compliance.at_risk': 'En Riesgo',
    'compliance.non_compliant': 'No Cumple',
    'compliance.required_training': 'Entrenamiento Requerido',
    'compliance.hours_completed': 'Horas Completadas',
    'compliance.hours_required': 'Horas Requeridas',

    // Notifications
    'notification.new_assignment': 'Nuevo Entrenamiento Asignado',
    'notification.due_soon': 'Entrenamiento Vence Pronto',
    'notification.overdue': 'Entrenamiento Vencido',
    'notification.completed': 'Entrenamiento Completado',
    'notification.document_expiring': 'Documento Por Vencer',
    'notification.document_expired': 'Documento Vencido',
    'notification.reminder': 'Recordatorio',

    // E-Signature
    'esignature.title': 'Firma Electrónica',
    'esignature.instruction': 'Por favor firme abajo para confirmar la finalización',
    'esignature.clear': 'Borrar',
    'esignature.confirm': 'Confirmo que esta es mi firma',

    // Quick Acknowledge
    'acknowledge.title': 'Se Requiere Reconocimiento',
    'acknowledge.instruction': 'Por favor lea y reconozca lo siguiente:',
    'acknowledge.confirm': 'He leído y entiendo lo anterior',
    'acknowledge.sign': 'Firmar y Reconocer',

    // Behind the Wheel
    'btw.title': 'Entrenamiento de Conducción',
    'btw.session': 'Sesión de Entrenamiento',
    'btw.hours': 'Horas',
    'btw.trainer': 'Entrenador',
    'btw.trainee': 'Aprendiz',
    'btw.skills': 'Habilidades Practicadas',
    'btw.notes': 'Notas',
    'btw.sign_off': 'Firmar',

    // Errors
    'error.network': 'Error de red. Por favor verifique su conexión.',
    'error.unauthorized': 'Por favor inicie sesión para continuar.',
    'error.forbidden': 'No tiene permiso para acceder a esto.',
    'error.not_found': 'El elemento solicitado no fue encontrado.',
    'error.server': 'Error del servidor. Por favor intente más tarde.',
    'error.validation': 'Por favor verifique su entrada e intente de nuevo.',
  },

  ht: {
    // Common - Haitian Creole
    'common.welcome': 'Byenveni',
    'common.logout': 'Dekonekte',
    'common.save': 'Sove',
    'common.cancel': 'Anile',
    'common.delete': 'Efase',
    'common.edit': 'Modifye',
    'common.view': 'Gade',
    'common.search': 'Chèche',
    'common.loading': 'Ap chaje...',
    'common.error': 'Erè',
    'common.success': 'Siksè',
    'common.confirm': 'Konfime',
    'common.back': 'Retounen',
    'common.next': 'Pwochen',
    'common.previous': 'Anvan',
    'common.submit': 'Soumèt',
    'common.complete': 'Fini',
    'common.start': 'Kòmanse',
    'common.continue': 'Kontinye',

    // Navigation
    'nav.dashboard': 'Tablo',
    'nav.training': 'Fòmasyon',
    'nav.assignments': 'Asiyasyon',
    'nav.documents': 'Dokiman',
    'nav.compliance': 'Konfòmite',
    'nav.reminders': 'Rapèl',
    'nav.settings': 'Paramèt',
    'nav.help': 'Èd',
    'nav.profile': 'Pwofil',

    // Dashboard
    'dashboard.title': 'Tablo Chofè',
    'dashboard.pending_assignments': 'Asiyasyon Annatant',
    'dashboard.completed_training': 'Fòmasyon Fini',
    'dashboard.fleet_rank': 'Ran Flòt',
    'dashboard.quiz_average': 'Mwayèn Egzamen',
    'dashboard.current_streak': 'Seri Aktyèl',
    'dashboard.days': 'jou',

    // Notifications
    'notification.new_assignment': 'Nouvo Fòmasyon Asiyen',
    'notification.due_soon': 'Fòmasyon Ap Ekspire Byento',
    'notification.overdue': 'Fòmasyon An Reta',
    'notification.completed': 'Fòmasyon Fini',
    'notification.document_expiring': 'Dokiman Ap Ekspire',
    'notification.document_expired': 'Dokiman Ekspire',
    'notification.reminder': 'Rapèl',
  },

  pt: {
    // Common - Portuguese
    'common.welcome': 'Bem-vindo',
    'common.logout': 'Sair',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.search': 'Buscar',
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.confirm': 'Confirmar',
    'common.back': 'Voltar',
    'common.next': 'Próximo',
    'common.previous': 'Anterior',
    'common.submit': 'Enviar',
    'common.complete': 'Completar',
    'common.start': 'Iniciar',
    'common.continue': 'Continuar',

    // Navigation
    'nav.dashboard': 'Painel',
    'nav.training': 'Treinamento',
    'nav.assignments': 'Atribuições',
    'nav.documents': 'Documentos',
    'nav.compliance': 'Conformidade',
    'nav.reminders': 'Lembretes',
    'nav.settings': 'Configurações',
    'nav.help': 'Ajuda',
    'nav.profile': 'Perfil',

    // Dashboard
    'dashboard.title': 'Painel do Motorista',
    'dashboard.pending_assignments': 'Atribuições Pendentes',
    'dashboard.completed_training': 'Treinamentos Concluídos',
    'dashboard.fleet_rank': 'Classificação da Frota',
    'dashboard.quiz_average': 'Média dos Testes',
    'dashboard.current_streak': 'Sequência Atual',
    'dashboard.days': 'dias',

    // Notifications
    'notification.new_assignment': 'Novo Treinamento Atribuído',
    'notification.due_soon': 'Treinamento Vence Em Breve',
    'notification.overdue': 'Treinamento Atrasado',
    'notification.completed': 'Treinamento Concluído',
    'notification.document_expiring': 'Documento Expirando',
    'notification.document_expired': 'Documento Expirado',
    'notification.reminder': 'Lembrete',
  },
};

/**
 * Get translation for a key
 */
export function t(key: string, language: SupportedLanguage = DEFAULT_LANGUAGE): string {
  const langTranslations = translations[language] || translations[DEFAULT_LANGUAGE];
  return langTranslations[key] || translations[DEFAULT_LANGUAGE][key] || key;
}

/**
 * Get translation with variable substitution
 * Example: t('greeting', 'en', { name: 'John' }) for 'Hello, {{name}}!'
 */
export function tWithVars(
  key: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE,
  vars: Record<string, string | number> = {}
): string {
  let text = t(key, language);
  
  Object.entries(vars).forEach(([varKey, value]) => {
    text = text.replace(new RegExp(`{{${varKey}}}`, 'g'), String(value));
  });
  
  return text;
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(lang: string): lang is SupportedLanguage {
  return lang in SUPPORTED_LANGUAGES;
}

/**
 * Get all translations for a language
 */
export function getTranslations(language: SupportedLanguage): Record<string, string> {
  return translations[language] || translations[DEFAULT_LANGUAGE];
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string }> {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    code: code as SupportedLanguage,
    name,
  }));
}

// Notification message templates by language
export const notificationTemplates = {
  assignment_created: {
    en: {
      title: 'New Training Assigned',
      body: 'You have been assigned: {{programName}}. Due: {{dueDate}}',
    },
    es: {
      title: 'Nuevo Entrenamiento Asignado',
      body: 'Se le ha asignado: {{programName}}. Vence: {{dueDate}}',
    },
    ht: {
      title: 'Nouvo Fòmasyon Asiyen',
      body: 'Yo asiyen ou: {{programName}}. Dat limit: {{dueDate}}',
    },
    pt: {
      title: 'Novo Treinamento Atribuído',
      body: 'Você foi atribuído: {{programName}}. Vence: {{dueDate}}',
    },
  },
  assignment_due_soon: {
    en: {
      title: 'Training Due Soon',
      body: '{{programName}} is due in {{days}} days',
    },
    es: {
      title: 'Entrenamiento Vence Pronto',
      body: '{{programName}} vence en {{days}} días',
    },
    ht: {
      title: 'Fòmasyon Ap Ekspire Byento',
      body: '{{programName}} ap ekspire nan {{days}} jou',
    },
    pt: {
      title: 'Treinamento Vence Em Breve',
      body: '{{programName}} vence em {{days}} dias',
    },
  },
  assignment_overdue: {
    en: {
      title: '⚠️ Training Overdue',
      body: '{{programName}} is {{days}} days overdue. Please complete immediately.',
    },
    es: {
      title: '⚠️ Entrenamiento Vencido',
      body: '{{programName}} está {{days}} días vencido. Complete inmediatamente.',
    },
    ht: {
      title: '⚠️ Fòmasyon An Reta',
      body: '{{programName}} an reta {{days}} jou. Tanpri fini li touswit.',
    },
    pt: {
      title: '⚠️ Treinamento Atrasado',
      body: '{{programName}} está {{days}} dias atrasado. Complete imediatamente.',
    },
  },
  training_completed: {
    en: {
      title: '🎉 Training Completed!',
      body: 'Congratulations! You completed {{programName}} with a score of {{score}}%',
    },
    es: {
      title: '🎉 ¡Entrenamiento Completado!',
      body: '¡Felicidades! Completó {{programName}} con una puntuación de {{score}}%',
    },
    ht: {
      title: '🎉 Fòmasyon Fini!',
      body: 'Felisitasyon! Ou fini {{programName}} ak yon nòt de {{score}}%',
    },
    pt: {
      title: '🎉 Treinamento Concluído!',
      body: 'Parabéns! Você concluiu {{programName}} com uma pontuação de {{score}}%',
    },
  },
  document_expiring: {
    en: {
      title: 'Document Expiring Soon',
      body: 'Your {{documentType}} expires in {{days}} days. Please renew.',
    },
    es: {
      title: 'Documento Por Vencer',
      body: 'Su {{documentType}} vence en {{days}} días. Por favor renueve.',
    },
    ht: {
      title: 'Dokiman Ap Ekspire',
      body: '{{documentType}} ou ap ekspire nan {{days}} jou. Tanpri renouvle.',
    },
    pt: {
      title: 'Documento Expirando',
      body: 'Seu {{documentType}} expira em {{days}} dias. Por favor renove.',
    },
  },
  document_expired: {
    en: {
      title: '🚨 Document Expired',
      body: 'Your {{documentType}} has expired. Renew immediately to stay compliant.',
    },
    es: {
      title: '🚨 Documento Vencido',
      body: 'Su {{documentType}} ha vencido. Renueve inmediatamente.',
    },
    ht: {
      title: '🚨 Dokiman Ekspire',
      body: '{{documentType}} ou ekspire. Renouvle li touswit.',
    },
    pt: {
      title: '🚨 Documento Expirado',
      body: 'Seu {{documentType}} expirou. Renove imediatamente.',
    },
  },
};

/**
 * Get notification message in user's preferred language
 */
export function getNotificationMessage(
  templateKey: keyof typeof notificationTemplates,
  language: SupportedLanguage,
  vars: Record<string, string | number>
): { title: string; body: string } {
  const template = notificationTemplates[templateKey];
  const langTemplate = template[language] || template.en;
  
  let title = langTemplate.title;
  let body = langTemplate.body;
  
  Object.entries(vars).forEach(([key, value]) => {
    title = title.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  
  return { title, body };
}

export default {
  t,
  tWithVars,
  isLanguageSupported,
  getTranslations,
  getSupportedLanguages,
  getNotificationMessage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
};
