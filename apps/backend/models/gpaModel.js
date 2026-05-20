const { getSession } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');

// simpan/update nilai matkul ke database
const saveGrade = async (userId, name, credits, grade) => {
  const session = getSession();
  try {
    const id = uuidv4();
    const query = `
      MATCH (u:User {id: $userId})
      CREATE (u)-[:TRACKS_GRADE]->(g:CourseGrade {
        id: $id,
        courseName: $name,
        credits: $credits,
        grade: $grade,
        createdAt: toString(datetime())
      })
      RETURN g { .* } AS grade
    `;
    const result = await session.run(query, {
      userId,
      id,
      name,
      credits: parseInt(credits) || 3,
      grade
    });
    return result.records[0]?.get('grade');
  } finally {
    await session.close();
  }
};

// ambil semua nilai IPK user
const getGrades = async (userId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:TRACKS_GRADE]->(g:CourseGrade)
      RETURN g { .* } AS grade
      ORDER BY g.createdAt DESC
    `;
    const result = await session.run(query, { userId });
    return result.records.map(r => r.get('grade'));
  } finally {
    await session.close();
  }
};

// hapus nilai matkul berdasarkan id
const deleteGrade = async (userId, gradeId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:TRACKS_GRADE]->(g:CourseGrade {id: $gradeId})
      DETACH DELETE g
      RETURN true AS success
    `;
    const result = await session.run(query, { userId, gradeId });
    return result.records.length > 0;
  } finally {
    await session.close();
  }
};

module.exports = { saveGrade, getGrades, deleteGrade };
