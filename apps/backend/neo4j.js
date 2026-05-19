const neo4j = require('neo4j-driver');

// init db connection
const uri = process.env.NEO4J_URI || 'neo4j+s://demo.databases.neo4j.io';
const user = process.env.NEO4J_USERNAME || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

module.exports = { driver };
