import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill Web API globals for Next.js middleware/server components
if (typeof global.Request === 'undefined') {
    try {
        const { Request, Response, Headers, ReadableStream } = require('next/dist/compiled/@edge-runtime/primitives');
        Object.assign(global, { Request, Response, Headers, ReadableStream });
    } catch (e) {
        // Fallback for older Next.js or different environments
    }
}

Object.assign(global, { TextEncoder, TextDecoder });

jest.mock('mongoose');
jest.mock('mongodb');
