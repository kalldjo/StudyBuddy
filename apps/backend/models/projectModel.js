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
        status: 'ongoing',
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

const requestJoinProject = async (userId, projectId, role, message) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})
      MATCH (p:Project {id: $projectId})
      MERGE (u)-[r:HAS_PENDING_JOIN_REQUEST]->(p)
      SET r.role = $role, r.message = $message, r.createdAt = toString(datetime())
      RETURN r
    `;
    await session.run(query, { userId, projectId, role: role || '', message: message || '' });
    return true;
  } finally {
    await session.close();
  }
};

const acceptJoinProject = async (userId, projectId, requesterId) => {
  const session = getSession();
  try {
    // Only the author can accept
    const query = `
      MATCH (author:User {id: $userId})-[:CREATED_PROJECT]->(p:Project {id: $projectId})
      MATCH (requester:User {id: $requesterId})-[req:HAS_PENDING_JOIN_REQUEST]->(p)
      DELETE req
      WITH requester, p
      MERGE (requester)-[:JOINED_PROJECT]->(p)
      RETURN requester
    `;
    const result = await session.run(query, { userId, projectId, requesterId });
    return result.records.length > 0;
  } finally {
    await session.close();
  }
};

const rejectJoinProject = async (userId, projectId, requesterId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (author:User {id: $userId})-[:CREATED_PROJECT]->(p:Project {id: $projectId})
      MATCH (requester:User {id: $requesterId})-[req:HAS_PENDING_JOIN_REQUEST]->(p)
      DELETE req
    `;
    await session.run(query, { userId, projectId, requesterId });
    return true;
  } finally {
    await session.close();
  }
};

const getProjectRequests = async (userId) => {
  const session = getSession();
  try {
    // Get all pending requests for projects created by this user
    const query = `
      MATCH (author:User {id: $userId})-[:CREATED_PROJECT]->(p:Project)
      MATCH (requester:User)-[req:HAS_PENDING_JOIN_REQUEST]->(p)
      RETURN req { .*, projectId: p.id, projectTitle: p.title, requesterId: requester.id, requesterName: requester.name } AS request
    `;
    const result = await session.run(query, { userId });
    return result.records.map(r => r.get('request'));
  } finally {
    await session.close();
  }
};

module.exports = { createProject, getProjects, getUserProjects, deleteProject, requestJoinProject, acceptJoinProject, rejectJoinProject, getProjectRequests };
