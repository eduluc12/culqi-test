module.exports = {
    transform: {
      '^.+\\.ts$': ['@swc/jest'],
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.ts?(x)', '**/tests/**/?(*.)+(spec|test).ts?(x)'],
};