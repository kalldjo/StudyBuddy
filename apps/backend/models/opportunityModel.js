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

const getOpportunities = async (currentUserId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (o:Opportunity)
      OPTIONAL MATCH (u:User)-[:POSTED_OPPORTUNITY]->(o)
      OPTIONAL MATCH (me:User {id: $currentUserId})-[r:APPLIED_FOR]->(o)
      RETURN o { 
        .*, 
        posterName: u.name, 
        posterId: u.id, 
        hasApplied: r IS NOT NULL 
      } AS opportunity
      ORDER BY o.createdAt DESC
    `;
    const result = await session.run(query, { currentUserId });
    return result.records.map(record => record.get('opportunity'));
  } finally {
    await session.close();
  }
};

// daftarkan user ke lowongan
const applyForOpportunity = async (userId, opportunityId, studentId, coverLetter) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})
      // merge biar lowongan statis dari asisten app juga terdaftar
      MERGE (o:Opportunity {id: $opportunityId})
      ON CREATE SET o.company = CASE WHEN $opportunityId = "1" THEN "Lab Basis Data Gedung B" ELSE "Pusat Riset Data Terpadu" END,
                    o.role = CASE WHEN $opportunityId = "1" THEN "Asisten Laboratorium SBD" ELSE "Student Assistant - Neo4j" END,
                    o.info = "Pendaftaran Instan • Aktif",
                    o.logoBg = "bg-[#8B5CF6]",
                    o.createdAt = toString(datetime())
      MERGE (u)-[r:APPLIED_FOR]->(o)
      SET r.appliedAt = toString(datetime()),
          r.studentId = $studentId,
          r.coverLetter = $coverLetter
      RETURN r
    `;
    const result = await session.run(query, { 
      userId, 
      opportunityId, 
      studentId: studentId || '', 
      coverLetter: coverLetter || '' 
    });
    return result.records.length > 0;
  } finally {
    await session.close();
  }
};

module.exports = { createOpportunity, getOpportunities, applyForOpportunity };

