/**
 * API & WebSocket base URL constants.
 *
 * Development:  API calls go to http://localhost:8000 (Django dev server)
 * Production:   API_BASE is an empty string — Nginx serves everything from
 *               the same origin, so relative URLs like /api/... work directly.
 *
 * To switch environments just change the value here before building:
 *   Development build (ng serve):   API_BASE = 'http://localhost:8000'
 *   Production build (ng build):    API_BASE = ''
 */

const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

/** HTTP base — empty string in prod so all /api/* calls are same-origin */
export const API_BASE = isDev ? 'http://localhost:8000' : '';

/** WebSocket base — wss:// in prod, ws://localhost in dev */
export const WS_BASE = isDev ? 'ws://localhost:8000' : `wss://${window.location.host}`;
