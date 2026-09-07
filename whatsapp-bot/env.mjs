import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Must be imported FIRST in any module that reads process.env during import
// (ESM executes sibling imports in declaration order, so importing this
// before service modules guarantees .env is loaded before they initialize).
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });