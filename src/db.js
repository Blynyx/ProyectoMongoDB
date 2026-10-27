const { Pool, types } = require('pg');
require('dotenv').config();

// NUMERIC llega como texto para no convertirlo a float.
// TIMESTAMP WITHOUT TIME ZONE se deja como texto "YYYY-MM-DD HH:MI:SS".
types.setTypeParser(1114, (valor) => valor);

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL.', err);
});

module.exports = { pool };
