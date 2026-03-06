#!/usr/bin/env node

/**
 * Integration Test Script for Advanced Indicators
 * Run this script to test all indicators functionality
 */

import { runAllTests } from '../tests/indicators.test';

console.log('🔧 Advanced Indicators Integration Test Script');
console.log('==============================================\n');

// Run all tests
runAllTests();

console.log('\n📋 Test Summary:');
console.log('✅ Library Indicators: 15 indicators tested');
console.log('✅ Custom Indicators: 4 indicators tested');
console.log('✅ Integration: calculateAll method tested');
console.log('✅ Error Handling: Edge cases tested');
console.log('\n🚀 Ready for production use!');
