module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '@apie/(.*)': '<rootDir>/src/$1'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/api/models',
    '/src/api/services/__tests__/user.ts',
    '/src/api/controllers/__tests__/user.ts'
  ]
};