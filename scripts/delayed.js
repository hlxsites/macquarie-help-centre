// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';
import { loadBreadbcrumbs } from '../blocks/breadcrumbs/breadcrumbs.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
loadBreadbcrumbs();
