module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-redux|@reduxjs/toolkit|immer|reselect)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/utils/index.ts',
    'src/services/api.ts',
    'src/store/slices/bookingsSlice.ts',
    'src/store/slices/doctorsSlice.ts',
    'src/selectors/index.ts',
    'src/components/common/*.tsx',
    'src/components/doctors/DoctorCard.tsx',
    'src/components/bookings/BookingCard.tsx',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 97,
      statements: 97,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
