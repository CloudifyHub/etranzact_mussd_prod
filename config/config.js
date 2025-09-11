require('dotenv').config({ path: `${process.cwd()}/.env` });

// module.exports = {
//   "development": {
//     "use_env_variable": "DATABASE_URL",
//     "dialect": "postgres",
//     "dialectOptions": {
//       "ssl": {
//         "require": true,
//         "rejectUnauthorized": false // Set to true with a valid CA certificate for production
//       }
//     },
//     "pool": {
//       "max": 5,         // Maximum number of connections
//       "min": 0,         // Minimum number of connections
//       "acquire": 30000, // Maximum time (ms) to acquire a connection
//       "idle": 10000     // Maximum time (ms) a connection can be idle
//     },
//     "logging": console.log, // Enable logging for debugging
//     "timezone": "+00:00"    // Match GMT for consistency
//   },
//   "test": {
//     "use_env_variable": "DATABASE_URL_TEST", // Separate URL for testing
//     "dialect": "postgres",
//     "dialectOptions": {
//       "ssl": {
//         "require": true,
//         "rejectUnauthorized": false
//       }
//     },
//     "pool": {
//       "max": 5,
//       "min": 0,
//       "acquire": 30000,
//       "idle": 10000
//     },
//     "logging": false, // Disable logging in test to reduce noise
//     "timezone": "+00:00"
//   },
//   "production": {
//     "use_env_variable": "DATABASE_URL_PROD", // Separate URL for production
//     "dialect": "postgres",
//     "dialectOptions": {
//       "ssl": {
//         "require": true,
//         "rejectUnauthorized": true, // Enforce certificate validation
//         "ca": "/path/to/neon-ca-cert.pem" // Optional: Path to Neon CA certificate
//       }
//     },
//     "pool": {
//       "max": 10,       // Increase for production load
//       "min": 0,
//       "acquire": 30000,
//       "idle": 10000
//     },
//     "logging": false, // Disable in production unless needed
//     "timezone": "+00:00",
//     "define": {
//       "timestamps": true, // Enable createdAt/updatedAt
//       "paranoid": false   // Soft deletes (set to true if needed)
//     }
//   }
// };

module.exports = {
  "development": {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "port": process.env.DB_PORT,
    "dialect": process.env.DB_DIALECT,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false // Set to true with a valid CA certificate for production
      } : false
    }
  },
  "test": {
    "username": "root",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "port": process.env.DB_PORT,
    "dialect": process.env.DB_DIALECT
  }
}
