const { getSession } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');

const earnCertificate = async (userId, courseTitle, titleAwarded) => {
  const session = getSession();
  try {
    const id = uuidv4();
    const certificateId = 'SB-CERT-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + new Date().getFullYear();
    const earnedAt = new Date().toISOString();
    
    const query = `
      MATCH (u:User {id: $userId})
      MERGE (u)-[:EARNED_CERTIFICATE]->(c:Certificate {
        id: $id,
        courseTitle: $courseTitle,
        earnedAt: $earnedAt,
        certificateId: $certificateId,
        titleAwarded: $titleAwarded
      })
      RETURN c { .* } AS certificate
    `;
    const result = await session.run(query, { userId, id, courseTitle, earnedAt, certificateId, titleAwarded });
    return result.records.length > 0 ? result.records[0].get('certificate') : null;
  } finally {
    await session.close();
  }
};

const getCertificates = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:EARNED_CERTIFICATE]->(c:Certificate)
      RETURN c { .* } AS certificate
      ORDER BY c.earnedAt DESC
    `;
    const result = await session.run(query, { userId });
    return result.records.map(record => record.get('certificate'));
  } finally {
    await session.close();
  }
};

module.exports = { earnCertificate, getCertificates };
