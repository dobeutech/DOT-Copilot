import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';

const router = Router();

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DOT Copilot API Documentation',
}));

export default router;

