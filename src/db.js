import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const {
  PASSWORD_DATABASE,
  USER_DATABASE,
  HOST_DATABASE,
  DATABASE,
  DB_PORT,
  PASSWORD_DATABASE_DEV,
  USER_DATABASE_DEV,
  HOST_DATABASE_DEV,
  DATABASE_DEV,
  DB_PORT_DEV,
  PASSWORD_DATABASE_TEST,
  USER_DATABASE_TEST,
  HOST_DATABASE_TEST,
  DATABASE_TEST,
  DB_PORT_TEST,
  NODE_ENV
} = process.env;

let pool;


try {
  if (NODE_ENV === 'test') {
    pool = createPool({
      port: DB_PORT_TEST,
      host: HOST_DATABASE_TEST,
      user: USER_DATABASE_TEST,
      password: PASSWORD_DATABASE_TEST,
      database: DATABASE_TEST,
      connectTimeout: 10000,
    });
  } else if (NODE_ENV === 'development') {
    pool = createPool({
      port: DB_PORT_DEV,
      host: HOST_DATABASE_DEV,
      user: USER_DATABASE_DEV,
      password: PASSWORD_DATABASE_DEV,
      database: DATABASE_DEV,
      connectTimeout: 10000,
      timezone: '-06:00'
    });
  } else {
    pool = createPool({
      port: DB_PORT,
      host: HOST_DATABASE,
      user: USER_DATABASE,
      password: PASSWORD_DATABASE,
      database: DATABASE,
      connectTimeout: 10000,
      timezone: '-06:00'
    });
  }
} catch (error) {
  console.error("Failed to create a database connection pool:", error);
  process.exit(1);
}

export { pool };
