'use strict';

const { parse } = require('pg-connection-string');

const options = parse(process.env.DATABASE_URL || '');

module.exports = options;