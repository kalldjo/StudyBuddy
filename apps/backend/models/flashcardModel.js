const { getSession } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');

// simpan kartu flashcard baru milik user
const saveFlashcard = async (userId, question, answer, difficulty) => {
  const session = getSession();
  try {
    const id = uuidv4();
    const query = `
      MATCH (u:User {id: $userId})
      CREATE (u)-[:CREATED_FLASHCARD]->(f:Flashcard {
        id: $id,
        question: $question,
        answer: $answer,
        difficulty: $difficulty,
        createdAt: toString(datetime())
      })
      RETURN f { .* } AS flashcard
    `;
    const result = await session.run(query, {
      userId,
      id,
      question,
      answer,
      difficulty: difficulty || 'medium'
    });
    return result.records[0]?.get('flashcard');
  } finally {
    await session.close();
  }
};

// ambil semua flashcard milik user
const getFlashcards = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:CREATED_FLASHCARD]->(f:Flashcard)
      RETURN f { .* } AS flashcard
      ORDER BY f.createdAt DESC
    `;
    const result = await session.run(query, { userId });
    return result.records.map(r => r.get('flashcard'));
  } finally {
    await session.close();
  }
};

// hapus flashcard berdasarkan id
const deleteFlashcard = async (userId, flashcardId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:CREATED_FLASHCARD]->(f:Flashcard {id: $flashcardId})
      DETACH DELETE f
      RETURN true AS success
    `;
    const result = await session.run(query, { userId, flashcardId });
    return result.records.length > 0;
  } finally {
    await session.close();
  }
};

module.exports = { saveFlashcard, getFlashcards, deleteFlashcard };
