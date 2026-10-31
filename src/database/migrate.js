import '../database/connection.js';
import { logger } from '../services/logger.js';

logger.info({ event: 'migration_complete' });
process.exit(0);