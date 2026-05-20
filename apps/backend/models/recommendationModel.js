const { getSession } = require('../config/neo4j');

const searchByFilters = async (fakultas, jurusan, angkatan) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (u)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (u)-[:CLASS_OF]->(a:Angkatan)
      WHERE 
        ($jurusan = 'Semua' OR $jurusan = '' OR $jurusan IS NULL OR toLower(j.name) CONTAINS toLower($jurusan))
        AND ($fakultas = 'Semua' OR $fakultas = '' OR $fakultas IS NULL OR toLower(f.name) CONTAINS toLower($fakultas))
        AND ($angkatan = 'Semua' OR $angkatan = '' OR $angkatan IS NULL OR toLower(toString(a.year)) CONTAINS toLower(toString($angkatan)))
      RETURN u {
        .*, 
        jurusan: j.name, 
        fakultas: f.name, 
        angkatan: a.year
      } AS u
    `;
    
    const params = {
      fakultas: fakultas || null,
      jurusan: jurusan || null,
      angkatan: angkatan || null
    };
    
    const result = await session.run(query, params);
    return result.records.map(record => {
      const u = record.get('u');
      if (u) delete u.passwordHash;
      return u;
    });
  } finally {
    await session.close();
  }
};

const recommendByInterest = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (me:User {id: $userId})-[:INTERESTED_IN]->(myInt:Interest)
      MATCH (other:User)-[:INTERESTED_IN]->(otherInt:Interest)
      WHERE me.id <> other.id AND toLower(myInt.name) = toLower(otherInt.name)
      OPTIONAL MATCH (other)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (other)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (other)-[:CLASS_OF]->(a:Angkatan)
      RETURN other { .*, jurusan: j.name, fakultas: f.name, angkatan: a.year } AS other, count(otherInt) AS mutualInterests
      ORDER BY mutualInterests DESC
    `;
    const result = await session.run(query, { userId });
    return result.records.map(record => {
      const user = record.get('other');
      if (user) delete user.passwordHash;
      return {
        user,
        mutualInterests: record.get('mutualInterests').toNumber()
      };
    });
  } finally {
    await session.close();
  }
};

const recommendBySkills = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (me:User {id: $userId})-[:HAS_SKILL]->(mySkill:Skill)
      MATCH (other:User)-[:HAS_SKILL]->(otherSkill:Skill)
      WHERE me.id <> other.id AND toLower(mySkill.name) = toLower(otherSkill.name)
      OPTIONAL MATCH (other)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (other)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (other)-[:CLASS_OF]->(a:Angkatan)
      RETURN other { 
        .*, 
        jurusan: j.name, 
        fakultas: f.name, 
        angkatan: a.year 
      } AS other, count(otherSkill) AS mutualSkillsCount
      ORDER BY mutualSkillsCount DESC
    `;
    const result = await session.run(query, { userId });
    return result.records.map(record => {
      const user = record.get('other');
      if (user) delete user.passwordHash;
      return {
        user,
        mutualSkillsCount: record.get('mutualSkillsCount').toNumber()
      };
    });
  } finally {
    await session.close();
  }
};

const recommendBySocialProximity = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (me:User {id: $userId})
      MATCH (other:User)
      WHERE other.id <> $userId 
        AND NOT (me)-[:IS_FRIENDS_WITH]-(other) 
        AND NOT (me)-[:HAS_PENDING_REQUEST]-(other)
        AND NOT (other)-[:HAS_PENDING_REQUEST]->(me)

      // 1. Social proximity: count mutual friends
      OPTIONAL MATCH (me)-[:IS_FRIENDS_WITH]-(friend:User)-[:IS_FRIENDS_WITH]-(other)
      WITH me, other, count(distinct friend) AS mutualFriendsCount

      // 2. Academic proximity
      OPTIONAL MATCH (me)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (other)-[:MAJORS_IN]->(oj:Jurusan)
      OPTIONAL MATCH (me)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (other)-[:BELONGS_TO_FAKULTAS]->(of:Fakultas)
      OPTIONAL MATCH (me)-[:CLASS_OF]->(a:Angkatan)
      OPTIONAL MATCH (other)-[:CLASS_OF]->(oa:Angkatan)
      WITH me, other, mutualFriendsCount,
           (CASE WHEN j IS NOT NULL AND oj IS NOT NULL AND toLower(j.name) = toLower(oj.name) THEN 1 ELSE 0 END) AS sameJurusan,
           (CASE WHEN f IS NOT NULL AND of IS NOT NULL AND toLower(f.name) = toLower(of.name) THEN 1 ELSE 0 END) AS sameFakultas,
           (CASE WHEN a IS NOT NULL AND oa IS NOT NULL AND a.year = oa.year THEN 1 ELSE 0 END) AS sameAngkatan

      // 3. Shared Skills and Interests
      OPTIONAL MATCH (me)-[:HAS_SKILL]->(s:Skill)<-[:HAS_SKILL]-(other)
      OPTIONAL MATCH (me)-[:INTERESTED_IN]->(i:Interest)<-[:INTERESTED_IN]-(other)
      WITH me, other, mutualFriendsCount, sameJurusan, sameFakultas, sameAngkatan,
           count(distinct s) AS mutualSkillsCount,
           count(distinct i) AS mutualInterestsCount

      // Calculate final score
      WITH other, 
           (mutualFriendsCount * 10 + sameJurusan * 5 + sameFakultas * 3 + sameAngkatan * 2 + mutualSkillsCount * 4 + mutualInterestsCount * 3) AS score,
           mutualFriendsCount, sameJurusan, sameFakultas, sameAngkatan, mutualSkillsCount, mutualInterestsCount
      WHERE score > 0

      // Fetch other user's display properties
      OPTIONAL MATCH (other)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (other)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (other)-[:CLASS_OF]->(a:Angkatan)

      RETURN other { 
               .*, 
               jurusan: j.name, 
               fakultas: f.name, 
               angkatan: a.year 
             } AS other, 
             score, 
             mutualFriendsCount, 
             mutualSkillsCount, 
             mutualInterestsCount,
             sameJurusan,
             sameFakultas,
             sameAngkatan
      ORDER BY score DESC
      LIMIT 12
    `;
    const result = await session.run(query, { userId });
    return result.records.map(record => {
      const user = record.get('other');
      if (user) delete user.passwordHash;
      
      const mutualFriends = record.get('mutualFriendsCount').toNumber();
      const mutualSkills = record.get('mutualSkillsCount').toNumber();
      const mutualInterests = record.get('mutualInterestsCount').toNumber();
      const isSameJurusan = record.get('sameJurusan').toNumber() > 0;
      const isSameFakultas = record.get('sameFakultas').toNumber() > 0;
      
      let reasons = [];
      if (mutualFriends > 0) reasons.push(`${mutualFriends} mutual friends`);
      if (mutualSkills > 0) reasons.push(`${mutualSkills} shared skills`);
      if (mutualInterests > 0) reasons.push(`${mutualInterests} shared interests`);
      if (isSameJurusan) reasons.push(`Same Major`);
      else if (isSameFakultas) reasons.push(`Same Faculty`);
      
      return {
        user,
        weight: record.get('score').toNumber(),
        matchReason: reasons.join(' • ') || 'Academic similarity'
      };
    });
  } finally {
    await session.close();
  }
};

const recommendProjectsBySkills = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (me:User {id: $userId})-[:HAS_SKILL]->(mySkill:Skill)
      MATCH (p:Project)-[:USES_SKILL]->(projSkill:Skill)
      WHERE p.status = 'ongoing' AND toLower(mySkill.name) = toLower(projSkill.name)
      // Ensure I'm not the creator and haven't joined yet
      AND NOT (me)-[:CREATED_PROJECT|JOINED_PROJECT]->(p)
      MATCH (author:User)-[:CREATED_PROJECT]->(p)
      RETURN p { .*, authorId: author.id, authorName: author.name } AS project, count(projSkill) AS matchingSkills
      ORDER BY matchingSkills DESC
    `;
    const result = await session.run(query, { userId });
    return result.records.map(record => ({
      project: record.get('project'),
      matchingSkills: record.get('matchingSkills').toNumber()
    }));
  } finally {
    await session.close();
  }
};

module.exports = {
  searchByFilters,
  recommendByInterest,
  recommendBySkills,
  recommendBySocialProximity,
  recommendProjectsBySkills
};
