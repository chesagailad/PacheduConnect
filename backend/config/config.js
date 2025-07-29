/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: config - configuration file for backend settings
 */

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
  },
  test: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
  },
}; 