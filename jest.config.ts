import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.ts'],
    testMatch: ['<rootDir>/tests/unit/**/*.test.{ts,tsx}'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^bson$': '<rootDir>/node_modules/bson/lib/bson.cjs',
    },
    coverageDirectory: 'test-results/coverage',
    coverageReporters: ['json', 'lcov', 'text', 'clover'],
    collectCoverageFrom: [
        'src/components/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        'src/actions/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
    ],
};

export default createJestConfig(config);
