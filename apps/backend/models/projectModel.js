const { getSession } = require('../config/neo4j');

const createProject = async (userId, id, title, description, imageUrl, demoUrl, skills) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})
      CREATE (pr:Project {
        id: $id,
        title: $title,
        description: $description,
        imageUrl: $imageUrl,
        demoUrl: $demoUrl,
        createdAt: toString(datetime())
      })
      CREATE (u)-[:CREATED_PROJECT]->(pr)
      
      WITH pr, u
      FOREACH (skillName IN $skills |
        MERGE (s:Skill {name: skillName})
        MERGE (pr)-[:USES_SKILL]->(s)
      )
      
      RETURN pr { .*, createdAt: pr.createdAt, skills: $skills } AS project
    `;
    const result = await session.run(query, {
      userId,
      id,
      title,
      description,
      imageUrl: imageUrl || '',
      demoUrl: demoUrl || '',
      skills: skills || []
    });
    return result.records[0]?.get('project');
  } finally {
    await session.close();
  }
};

const getProjects = async () => {
  const session = getSession();
  try {
    const query = `
      MATCH (pr:Project)<-[:CREATED_PROJECT]-(author:User)
      OPTIONAL MATCH (author)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (pr)-[:USES_SKILL]->(s:Skill)
      WITH pr, author, j, collect(s.name) AS skills
      RETURN pr { .*, skills: skills } AS project,
             author { .*, passwordHash: null, jurusan: j.name } AS author
      ORDER BY pr.createdAt DESC
      LIMIT 100
    `;
    const result = await session.run(query);
    return result.records.map(record => ({
      project: record.get('project'),
      author: record.get('author')
    }));
  } finally {
    await session.close();
  }
};

const getUserProjects = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:CREATED_PROJECT]->(pr:Project)
      OPTIONAL MATCH (pr)-[:USES_SKILL]->(s:Skill)
      WITH pr, collect(s.name) AS skills
      RETURN pr { .*, skills: skills } AS project
      ORDER BY pr.createdAt DESC
    `;
    const result = await session.run(query, { userId });
    return result.records.map(record => record.get('project'));
  } finally {
    await session.close();
  }
};

const deleteProject = async (userId, projectId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:CREATED_PROJECT]->(pr:Project {id: $projectId})
      DETACH DELETE pr
      RETURN true AS success
    `;
    const result = await session.run(query, { userId, projectId });
    return result.records.length > 0;
  } finally {
    await session.close();
  }
};

module.exports = { createProject, getProjects, getUserProjects, deleteProject };
