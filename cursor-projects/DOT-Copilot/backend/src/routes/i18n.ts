import { Router, Response } from 'express';
import { Request } from 'express';
import {
  getSupportedLanguages,
  getTranslations,
  isLanguageSupported,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  SupportedLanguage,
} from '../services/i18n';

const router = Router();

/**
 * @swagger
 * /api/i18n/languages:
 *   get:
 *     summary: Get list of supported languages
 *     tags: [Internationalization]
 *     responses:
 *       200:
 *         description: List of supported languages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                 defaultLanguage:
 *                   type: string
 */
router.get('/languages', (req: Request, res: Response) => {
  res.json({
    data: getSupportedLanguages(),
    defaultLanguage: DEFAULT_LANGUAGE,
  });
});

/**
 * @swagger
 * /api/i18n/translations/{language}:
 *   get:
 *     summary: Get all translations for a specific language
 *     tags: [Internationalization]
 *     parameters:
 *       - in: path
 *         name: language
 *         required: true
 *         schema:
 *           type: string
 *           enum: [en, es, ht, pt]
 *     responses:
 *       200:
 *         description: Translation dictionary
 *       400:
 *         description: Unsupported language
 */
router.get('/translations/:language', (req: Request, res: Response) => {
  const { language } = req.params;

  if (!isLanguageSupported(language)) {
    return res.status(400).json({
      error: 'Unsupported language',
      supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
    });
  }

  const translations = getTranslations(language as SupportedLanguage);

  res.json({
    language,
    languageName: SUPPORTED_LANGUAGES[language as SupportedLanguage],
    translations,
  });
});

/**
 * @swagger
 * /api/i18n/translations:
 *   get:
 *     summary: Get translations for all languages (for offline caching)
 *     tags: [Internationalization]
 *     responses:
 *       200:
 *         description: All translations keyed by language
 */
router.get('/translations', (req: Request, res: Response) => {
  const allTranslations: Record<string, Record<string, string>> = {};

  for (const lang of Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]) {
    allTranslations[lang] = getTranslations(lang);
  }

  res.json({
    languages: getSupportedLanguages(),
    defaultLanguage: DEFAULT_LANGUAGE,
    translations: allTranslations,
  });
});

export default router;
