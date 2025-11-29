require('dotenv').config({ path: `${process.cwd()}/.env` });


module.exports = {
  "development": {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "port": process.env.DB_PORT,
    "pool_mode": process.env.DB_POOL_MODE,  //for supabase only
    "dialect": process.env.DB_DIALECT,
    "logging": false,
    "pool": {
      "max": 30,        
      "min": 5,
      "acquire": 30000, // allow 30 seconds to obtain a connection
      "idle": 10000,
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
    "pool_mode": process.env.DB_POOL_MODE,  //for supabase only
    "dialect": process.env.DB_DIALECT,
    "logging": false,
    "pool": {
      "max": 30,        
      "min": 5,
      "acquire": 30000, // allow 30 seconds to obtain a connection
      "idle": 10000,
    }
  }
}
