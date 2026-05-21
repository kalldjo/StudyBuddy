const { getSession } = require("../config/neo4j");

// Initialize Constraints
(async () => {
  const session = getSession();
  try {
    await session.run(`CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE`);
    console.log("[neo4j] User email UNIQUE constraint verified.");
  } catch (err) {
    console.error("[neo4j] Error creating constraint:", err.message);
  } finally {
    await session.close();
  }
})();

const createUser = async (id, email, passwordHash, name, bio, profilePicture) => {
  const session = getSession();
  try {
    const query = `
      CREATE (u:User {
        id: $id, 
        email: $email, 
        passwordHash: $passwordHash, 
        name: $name, 
        bio: $bio, 
        profilePicture: $profilePicture
      })
      RETURN u
    `;
    const result = await session.run(query, { id, email, passwordHash, name, bio, profilePicture });
    return result.records[0]?.get("u").properties;
  } finally {
    await session.close();
  }
};

const getUserByEmail = async (email) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {email: $email}) 
      OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
      WITH u, collect(s.name) AS skills
      RETURN u { .*, skills: [x IN skills WHERE x IS NOT NULL] } AS u
    `;
    const result = await session.run(query, { email });
    return result.records.length ? result.records[0].get("u") : null;
  } finally {
    await session.close();
  }
};

module.exports = { createUser, getUserByEmail };
