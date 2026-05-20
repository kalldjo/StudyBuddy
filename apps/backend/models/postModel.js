const { getSession } = require('../config/neo4j');

const createPost = async (userId, id, content, imageUrl) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})
      CREATE (p:Post {
        id: $id,
        content: $content,
        imageUrl: $imageUrl,
        createdAt: toString(datetime())
      })
      CREATE (u)-[:POSTED]->(p)
      RETURN p { .*, createdAt: p.createdAt } AS post
    `;
    const result = await session.run(query, { userId, id, content, imageUrl: imageUrl || '' });
    return result.records[0]?.get('post');
  } finally {
    await session.close();
  }
};

const getFeedPosts = async (currentUserId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (p:Post)<-[:POSTED]-(author:User)
      OPTIONAL MATCH (author)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (author)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (author)-[:CLASS_OF]->(a:Angkatan)
      
      // Likes & Comments
      OPTIONAL MATCH (:User)-[allLikes:LIKED]->(p)
      OPTIONAL MATCH (:User)-[allComments:COMMENTED]->(p)
      WITH p, author, j, f, a, count(distinct allLikes) AS likesCount, count(distinct allComments) AS commentsCount
      
      OPTIONAL MATCH (me:User {id: $currentUserId})-[myLike:LIKED]->(p)
      WITH p, author, j, f, a, likesCount, commentsCount, (myLike IS NOT NULL) AS hasLiked
      
      RETURN p { .*, likesCount: likesCount, commentsCount: commentsCount, hasLiked: hasLiked } AS post,
             author { .*, passwordHash: null, jurusan: j.name, fakultas: f.name, angkatan: a.year } AS author
      ORDER BY p.createdAt DESC
      LIMIT 100
    `;
    const result = await session.run(query, { currentUserId });
    return result.records.map(record => ({
      post: record.get('post'),
      author: record.get('author')
    }));
  } finally {
    await session.close();
  }
};

const toggleLikePost = async (userId, postId) => {
  const session = getSession();
  try {
    // Check if like exists
    const checkQuery = `
      MATCH (u:User {id: $userId})-[r:LIKED]->(p:Post {id: $postId})
      RETURN r
    `;
    const checkResult = await session.run(checkQuery, { userId, postId });
    
    if (checkResult.records.length > 0) {
      // Unlike
      const unlikeQuery = `
        MATCH (u:User {id: $userId})-[r:LIKED]->(p:Post {id: $postId})
        DELETE r
        RETURN false AS liked
      `;
      const res = await session.run(unlikeQuery, { userId, postId });
      return res.records[0]?.get('liked');
    } else {
      // Like
      const likeQuery = `
        MATCH (u:User {id: $userId})
        MATCH (p:Post {id: $postId})
        MERGE (u)-[:LIKED]->(p)
        RETURN true AS liked
      `;
      const res = await session.run(likeQuery, { userId, postId });
      return res.records[0]?.get('liked');
    }
  } finally {
    await session.close();
  }
};

const deletePost = async (userId, postId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:POSTED]->(p:Post {id: $postId})
      DETACH DELETE p
      RETURN true AS success
    `;
    const result = await session.run(query, { userId, postId });
    return result.records.length > 0;
  } finally {
    await session.close();
  }
};

const getUserPosts = async (userId, currentUserId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})-[:POSTED]->(p:Post)
      OPTIONAL MATCH (u)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (u)-[:BELONGS_TO_FAKULTAS]->(f:Fakultas)
      OPTIONAL MATCH (u)-[:CLASS_OF]->(a:Angkatan)
      
      // Likes & Comments
      OPTIONAL MATCH (:User)-[allLikes:LIKED]->(p)
      OPTIONAL MATCH (:User)-[allComments:COMMENTED]->(p)
      WITH p, u, j, f, a, count(distinct allLikes) AS likesCount, count(distinct allComments) AS commentsCount
      
      OPTIONAL MATCH (me:User {id: $currentUserId})-[myLike:LIKED]->(p)
      WITH p, u, j, f, a, likesCount, commentsCount, (myLike IS NOT NULL) AS hasLiked
      
      RETURN p { .*, likesCount: likesCount, commentsCount: commentsCount, hasLiked: hasLiked } AS post,
             u { .*, passwordHash: null, jurusan: j.name, fakultas: f.name, angkatan: a.year } AS author
      ORDER BY p.createdAt DESC
    `;
    const result = await session.run(query, { userId, currentUserId });
    return result.records.map(record => ({
      post: record.get('post'),
      author: record.get('author')
    }));
  } finally {
    await session.close();
  }
};

// simpan komentar baru ke db
const addCommentToPost = async (userId, postId, content) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User {id: $userId})
      MATCH (p:Post {id: $postId})
      OPTIONAL MATCH (u)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (u)-[:CLASS_OF]->(a:Angkatan)
      CREATE (u)-[c:COMMENTED {
        id: toString(randomUUID()),
        content: $content,
        createdAt: toString(datetime())
      }]->(p)
      RETURN c {
        .*,
        author: {
          id: u.id,
          name: u.name,
          profilePicture: u.profilePicture,
          jurusan: j.name,
          angkatan: a.year
        }
      } AS comment
    `;
    const result = await session.run(query, { userId, postId, content });
    return result.records[0]?.get('comment');
  } finally {
    await session.close();
  }
};

// ambil list komentar untuk postingan
const getPostComments = async (postId) => {
  const session = getSession();
  try {
    const query = `
      MATCH (u:User)-[c:COMMENTED]->(p:Post {id: $postId})
      OPTIONAL MATCH (u)-[:MAJORS_IN]->(j:Jurusan)
      OPTIONAL MATCH (u)-[:CLASS_OF]->(a:Angkatan)
      RETURN c {
        .*,
        author: {
          id: u.id,
          name: u.name,
          profilePicture: u.profilePicture,
          jurusan: j.name,
          angkatan: a.year
        }
      } AS comment
      ORDER BY c.createdAt ASC
    `;
    const result = await session.run(query, { postId });
    return result.records.map(record => record.get('comment'));
  } finally {
    await session.close();
  }
};

module.exports = { 
  createPost, 
  getFeedPosts, 
  toggleLikePost, 
  deletePost, 
  getUserPosts,
  addCommentToPost,
  getPostComments
};

