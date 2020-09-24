module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    "@apie/(.*)": "<rootDir>/src/$1"
  }
};