const { getSession } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');

const sendMessage = async (senderId, receiverId, content) => {
  const session = getSession();
  try {
    const msgId = uuidv4();
    const createdAt = new Date().toISOString();
    const query = `
      MATCH (sender:User {id: $senderId})
      MATCH (receiver:User {id: $receiverId})
      CREATE (sender)-[:SENT_MESSAGE]->(m:Message {
        id: $msgId,
        content: $content,
        createdAt: $createdAt,
        senderId: $senderId,
        receiverId: $receiverId
      })-[:DELIVERED_TO]->(receiver)
      RETURN m { .* } AS message
    `;
    const result = await session.run(query, { senderId, receiverId, content, msgId, createdAt });
    return result.records.length > 0 ? result.records[0].get('message') : null;
  } finally {
    await session.close();
  }
};

const getMessages = async (userId, buddyId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (me:User {id: $userId})
      MATCH (buddy:User {id: $buddyId})
      MATCH (me)-[:SENT_MESSAGE|DELIVERED_TO]-(m:Message)-[:SENT_MESSAGE|DELIVERED_TO]-(buddy)
      RETURN m { .* } AS message
      ORDER BY m.createdAt ASC
    `;
    const result = await session.run(query, { userId, buddyId });
    return result.records.map(record => record.get('message'));
  } finally {
    await session.close();
  }
};

module.exports = { sendMessage, getMessages };
