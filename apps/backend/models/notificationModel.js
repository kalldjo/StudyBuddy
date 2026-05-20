const { getSession } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');

// buat notif baru buat user tertentu
const createNotification = async (targetUserId, text, type) => {
  const session = getSession();
  try {
    const id = uuidv4();
    const query = `
      MATCH (u:User {id: $targetUserId})
      CREATE (n:Notification {
        id: $id,
        text: $text,
        type: $type,
        read: false,
        createdAt: toString(datetime())
      })
      CREATE (u)-[:HAS_NOTIFICATION]->(n)
      RETURN n { .* } AS notification
    `;
    const result = await session.run(query, { targetUserId, id, text, type });
    return result.records[0]?.get('notification');
  } finally {
    await session.close();
  }
};

// ambil semua notif user, urutkan terbaru dulu
const getUserNotifications = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:HAS_NOTIFICATION]->(n:Notification)
      RETURN n { .* } AS notification
      ORDER BY n.createdAt DESC
      LIMIT 30
    `;
    const result = await session.run(query, { userId });
    return result.records.map(r => r.get('notification'));
  } finally {
    await session.close();
  }
};

// tandai semua notif user sebagai sudah dibaca
const markAllRead = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:HAS_NOTIFICATION]->(n:Notification)
      WHERE n.read = false
      SET n.read = true
      RETURN count(n) AS updated
    `;
    const result = await session.run(query, { userId });
    return result.records[0]?.get('updated')?.low ?? 0;
  } finally {
    await session.close();
  }
};

// hitung berapa yang belum dibaca (buat badge)
const getUnreadCount = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:HAS_NOTIFICATION]->(n:Notification {read: false})
      RETURN count(n) AS unread
    `;
    const result = await session.run(query, { userId });
    return result.records[0]?.get('unread')?.low ?? 0;
  } finally {
    await session.close();
  }
};

module.exports = { createNotification, getUserNotifications, markAllRead, getUnreadCount };
