const { getSession } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');

const createOpportunity = async (userId, company, role, info, link, logoBg) => {
  const session = getSession();
  try {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const query = `
      MATCH (u:User {id: $userId})
      CREATE (u)-[:POSTED_OPPORTUNITY]->(o:Opportunity {
        id: $id,
        company: $company,
        role: $role,
        info: $info,
        link: $link,
        logoBg: $logoBg,
        createdAt: $createdAt
      })
      RETURN o { .* } AS opportunity
    `;
    const result = await session.run(query, { userId, id, company, role, info, link, logoBg, createdAt });
    return result.records.length > 0 ? result.records[0].get('opportunity') : null;
  } finally {
    await session.close();
  }
};

const getOpportunities = async () => {
  const session = getSession();
  try {
    const query = `
      MATCH (o:Opportunity)
      OPTIONAL MATCH (u:User)-[:POSTED_OPPORTUNITY]->(o)
      RETURN o { .*, posterName: u.name, posterId: u.id } AS opportunity
      ORDER BY o.createdAt DESC
    `;
    const result = await session.run(query);
    return result.records.map(record => record.get('opportunity'));
  } finally {
    await session.close();
  }
};

module.exports = { createOpportunity, getOpportunities };
