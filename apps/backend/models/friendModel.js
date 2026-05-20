const { getSession } = require('../config/neo4j');

const addFriendRequest = async (userId, targetId) => {
  const session = getSession();
  try {
    const query = `
      MERGE (a:User {id: $userId})
      MERGE (b:User {id: $targetId})
      MERGE (a)-[r:HAS_PENDING_REQUEST]->(b)
      RETURN r
    `;
    await session.run(query, { userId, targetId });
    return true;
  } finally {
    await session.close();
  }
};

const acceptFriendRequest = async (userId, targetId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (target:User {id: $targetId})-[req:HAS_PENDING_REQUEST]->(me:User {id: $userId})
      DELETE req
      WITH target, me
      MERGE (me)-[:IS_FRIENDS_WITH]->(target)
      MERGE (target)-[:IS_FRIENDS_WITH]->(me)
      RETURN target
    `;
    const result = await session.run(query, { userId, targetId });
    return result.records.length > 0;
  } finally {
    await session.close();
  }
};

const rejectFriendRequest = async (userId, targetId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (target:User {id: $targetId})-[req:HAS_PENDING_REQUEST]->(me:User {id: $userId})
      DELETE req
    `;
    await session.run(query, { userId, targetId });
    return true;
  } finally {
    await session.close();
  }
};

const getPendingRequests = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (target:User)-[:HAS_PENDING_REQUEST]->(me:User {id: $userId})
      OPTIONAL MATCH (target)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (target)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (target)-[:CLASS_OF]->(a:Angkatan)
      RETURN target { .*, jurusan: j.name, fakultas: f.name, angkatan: a.year } AS user
    `;
    const result = await session.run(query, { userId });
    return result.records.map(record => {
      const u = record.get('user');
      if (u) delete u.passwordHash;
      return u;
    });
  } finally {
    await session.close();
  }
};

const getFriendsList = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (me:User {id: $userId})-[:IS_FRIENDS_WITH]-(target:User)
      OPTIONAL MATCH (target)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (target)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (target)-[:CLASS_OF]->(a:Angkatan)
      RETURN DISTINCT target { .*, jurusan: j.name, fakultas: f.name, angkatan: a.year } AS user
    `;
    const result = await session.run(query, { userId });
    return result.records.map(r => r.get('user'));
  } finally {
    await session.close();
  }
};

const removeFriend = async (userId, targetId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (me:User {id: $userId})-[r:IS_FRIENDS_WITH]-(target:User {id: $targetId})
      DELETE r
    `;
    await session.run(query, { userId, targetId });
    return true;
  } finally {
    await session.close();
  }
};

module.exports = { addFriendRequest, acceptFriendRequest, rejectFriendRequest, getPendingRequests, getFriendsList, removeFriend };
