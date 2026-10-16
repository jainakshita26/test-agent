// utils/helpers.js
// Helper functions for the API

/**
 * Simulates network delay for more realistic testing
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Resolves after the delay
 */
const simulateDelay = (ms = 500) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  
  /**
   * Generates a random ID with prefix
   * @param {string} prefix - Prefix for the ID
   * @returns {string} - Generated ID
   */
  const generateId = (prefix = 'id') => {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };
  
  /**
   * Safely parses JSON with error handling
   * @param {string} json - JSON string to parse
   * @param {any} defaultValue - Default value if parsing fails
   * @returns {any} - Parsed object or default value
   */
  const safeJsonParse = (json, defaultValue = {}) => {
    try {
      return JSON.parse(json);
    } catch (error) {
      console.error('JSON parse error:', error);
      return defaultValue;
    }
  };
  
  module.exports = {
    simulateDelay,
    generateId,
    safeJsonParse
  };