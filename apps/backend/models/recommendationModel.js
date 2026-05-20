const { getSession } = require("../config/neo4j");

const searchByFilters = async (currentUserId, name, fakultas, jurusan, angkatan) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User)
      WHERE u.id <> $currentUserId
      OPTIONAL MATCH (u)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (u)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (u)-[:CLASS_OF]->(a:Angkatan)
      
      WITH u, j, f, a
      WHERE 
        ($name = '' OR $name IS NULL OR toLower(u.name) CONTAINS toLower($name))
        AND ($jurusan = 'Semua' OR $jurusan = '' OR $jurusan IS NULL OR toLower(j.name) CONTAINS toLower($jurusan))
        AND ($fakultas = 'Semua' OR $fakultas = '' OR $fakultas IS NULL OR toLower(f.name) CONTAINS toLower($fakultas))
        AND ($angkatan = 'Semua' OR $angkatan = '' OR $angkatan IS NULL OR toLower(toString(a.year)) CONTAINS toLower(toString($angkatan)))
      
      MATCH (me:User {id: $currentUserId})
      
      OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
      OPTIONAL MATCH (u)-[:INTERESTED_IN]->(int:Interest)
      
      WITH u, j, f, a, me,
           collect(distinct s.name) AS skills,
           collect(distinct int.name) AS interests,
           exists((me)-[:IS_FRIENDS_WITH]-(u)) AS isFriend,
           exists((me)-[:HAS_PENDING_REQUEST]->(u)) AS sentRequest,
           exists((u)-[:HAS_PENDING_REQUEST]->(me)) AS receivedRequest
           
      RETURN u {
        .*, 
        jurusan: j.name, 
        fakultas: f.name, 
        angkatan: a.year,
        skills: skills,
        interests: interests
      } AS user,
      CASE
        WHEN isFriend THEN 'friends'
        WHEN sentRequest THEN 'pending'
        WHEN receivedRequest THEN 'pending_received'
        ELSE 'none'
      END AS connectionStatus
    `;

    const params = {
      currentUserId: currentUserId || "",
      name: name || null,
      fakultas: fakultas || null,
      jurusan: jurusan || null,
      angkatan: angkatan || null,
    };

    const result = await session.run(query, params);
    return result.records.map((record) => {
      const user = record.get("user");
      const connectionStatus = record.get("connectionStatus");
      if (user) delete user.passwordHash;
      return {
        user,
        connectionStatus,
      };
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
      WHERE me.id <> other.id
        AND toLower(myInt.name) = toLower(otherInt.name)
        AND NOT (me)-[:IS_FRIENDS_WITH]-(other)
        AND NOT (me)-[:HAS_PENDING_REQUEST]-(other)
      WITH me, other, count(distinct otherInt) AS mutualInterests
      OPTIONAL MATCH (other)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (other)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (other)-[:CLASS_OF]->(a:Angkatan)
      RETURN other { .*, jurusan: j.name, fakultas: f.name, angkatan: a.year } AS other,
             mutualInterests
      ORDER BY mutualInterests DESC
      LIMIT 20
    `;
    const result = await session.run(query, { userId });
    return result.records.map((record) => {
      const user = record.get("other");
      if (user) delete user.passwordHash;
      return {
        user,
        connectionStatus: "none",
        mutualInterests: record.get("mutualInterests").toNumber(),
        matchReason: `${record.get("mutualInterests").toNumber()} shared interest(s)`,
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
      WHERE me.id <> other.id
        AND toLower(mySkill.name) = toLower(otherSkill.name)
        AND NOT (me)-[:IS_FRIENDS_WITH]-(other)
        AND NOT (me)-[:HAS_PENDING_REQUEST]-(other)
      WITH me, other, count(distinct otherSkill) AS mutualSkillsCount
      OPTIONAL MATCH (other)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (other)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (other)-[:CLASS_OF]->(a:Angkatan)
      RETURN other { 
        .*, 
        jurusan: j.name, 
        fakultas: f.name, 
        angkatan: a.year 
      } AS other, mutualSkillsCount
      ORDER BY mutualSkillsCount DESC
      LIMIT 20
    `;
    const result = await session.run(query, { userId });
    return result.records.map((record) => {
      const user = record.get("other");
      if (user) delete user.passwordHash;
      return {
        user,
        connectionStatus: "none",
        mutualSkillsCount: record.get("mutualSkillsCount").toNumber(),
        matchReason: `${record.get("mutualSkillsCount").toNumber()} shared skill(s)`,
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

      // Calculate final score — more diverse weights so non-major signals still surface
      WITH other, 
           (mutualFriendsCount * 10 + sameJurusan * 4 + sameFakultas * 3 + sameAngkatan * 3 + mutualSkillsCount * 5 + mutualInterestsCount * 4) AS score,
           mutualFriendsCount, sameJurusan, sameFakultas, sameAngkatan, mutualSkillsCount, mutualInterestsCount

      // Allow anyone with at least ONE signal (including just same faculty/angkatan)
      WHERE (mutualFriendsCount + sameJurusan + sameFakultas + sameAngkatan + mutualSkillsCount + mutualInterestsCount) > 0

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
      LIMIT 15
    `;
    const result = await session.run(query, { userId });
    return result.records.map((record) => {
      const user = record.get("other");
      if (user) delete user.passwordHash;

      const mutualFriends = record.get("mutualFriendsCount").toNumber();
      const mutualSkills = record.get("mutualSkillsCount").toNumber();
      const mutualInterests = record.get("mutualInterestsCount").toNumber();
      const isSameJurusan = record.get("sameJurusan").toNumber() > 0;
      const isSameFakultas = record.get("sameFakultas").toNumber() > 0;
      const isSameAngkatan = record.get("sameAngkatan").toNumber() > 0;

      let reasons = [];
      if (mutualFriends > 0) reasons.push(`${mutualFriends} mutual friend${mutualFriends > 1 ? "s" : ""}`);
      if (mutualSkills > 0) reasons.push(`${mutualSkills} shared skill${mutualSkills > 1 ? "s" : ""}`);
      if (mutualInterests > 0) reasons.push(`${mutualInterests} shared interest${mutualInterests > 1 ? "s" : ""}`);
      if (isSameJurusan) reasons.push("Same major");
      else if (isSameFakultas) reasons.push("Same faculty");
      if (isSameAngkatan) reasons.push("Same year");

      return {
        user,
        weight: record.get("score").toNumber(),
        matchReason: reasons.join(" · ") || "From your campus",
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
      WHERE toLower(mySkill.name) = toLower(projSkill.name)
        AND NOT (me)-[:CREATED_PROJECT|JOINED_PROJECT]->(p)
      MATCH (author:User)-[:CREATED_PROJECT]->(p)
      WITH p, author, count(distinct projSkill) AS matchingSkills
      RETURN p { .*, authorId: author.id, authorName: author.name } AS project,
             author { .id, .name, .profilePicture, .jurusan } AS author,
             matchingSkills
      ORDER BY matchingSkills DESC
      LIMIT 10
    `;
    const result = await session.run(query, { userId });
    return result.records.map((record) => ({
      project: record.get("project"),
      author: record.get("author"),
      matchingSkills: record.get("matchingSkills").toNumber(),
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
  recommendProjectsBySkills,
};
