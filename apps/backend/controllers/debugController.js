const { getSession } = require('../config/neo4j');
const sqlite3 = require('sqlite3').verbose();

// Initialize in-memory SQLite DB
const db = new sqlite3.Database(':memory:');

// Setup mock data for relational DB benchmark
let mockDataReady = false;
const setupMockData = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT)");
      db.run("CREATE TABLE friends (user_id_1 TEXT, user_id_2 TEXT)");
      db.run("CREATE INDEX idx_friends_1 ON friends(user_id_1)");
      db.run("CREATE INDEX idx_friends_2 ON friends(user_id_2)");
      
      const stmtUser = db.prepare("INSERT INTO users VALUES (?, ?)");
      const stmtFriend = db.prepare("INSERT INTO friends VALUES (?, ?)");
      
      // Generate 1000 users
      const userIds = [];
      for (let i = 1; i <= 1000; i++) {
        const id = `user_${i}`;
        userIds.push(id);
        stmtUser.run(id, `User ${i}`);
      }
      
      // Generate 5000 random friendships
      for (let i = 0; i < 5000; i++) {
        const u1 = userIds[Math.floor(Math.random() * userIds.length)];
        let u2 = userIds[Math.floor(Math.random() * userIds.length)];
        while(u1 === u2) u2 = userIds[Math.floor(Math.random() * userIds.length)];
        
        stmtFriend.run(u1, u2);
        stmtFriend.run(u2, u1); // bidirection
      }
      
      stmtUser.finalize();
      stmtFriend.finalize();
      
      mockDataReady = true;
      resolve();
    });
  });
};

setupMockData();

const runBenchmark = async (req, res) => {
  try {
    if (!mockDataReady) {
      return res.status(503).json({ error: 'Mock DB is still initializing' });
    }

    const runsCount = parseInt(req.query.runs) || 10;
    const runs = [];

    // Setup Neo4j session
    const session = getSession();

    // 1. Warm up queries to avoid cold start connection bias
    try {
      await session.run("MATCH (u:User {id: 'dummy_1'}) RETURN u LIMIT 1");
    } catch (e) {
      // ignore warm up error
    }
    await new Promise((resolve) => db.get("SELECT 1", resolve));

    const neo4jQuery = `
      MATCH (u:User {id: 'dummy_1'})-[:IS_FRIENDS_WITH*6..6]-(network:User)
      RETURN count(distinct network) AS networkCount
    `;

    const sqliteQuery = `
      SELECT count(DISTINCT f6.user_id_2) as networkCount
      FROM friends f1
      JOIN friends f2 ON f1.user_id_2 = f2.user_id_1
      JOIN friends f3 ON f2.user_id_2 = f3.user_id_1
      JOIN friends f4 ON f3.user_id_2 = f4.user_id_1
      JOIN friends f5 ON f4.user_id_2 = f5.user_id_1
      JOIN friends f6 ON f5.user_id_2 = f6.user_id_1
      WHERE f1.user_id_1 = 'user_1'
    `;

    // 2. Validate if Neo4j dummy user exists to avoid fake 0ms results
    const checkRes = await session.run(`
      MATCH (u:User {id: 'dummy_1'}) RETURN count(u) AS c
    `);
    const dummyExists = checkRes.records[0].get('c').toNumber() > 0;
    if (!dummyExists) {
      await session.close();
      return res.status(400).json({
        success: false,
        error: "Neo4j dummy data not found! Please run 'node apps/backend/seed-neo4j.js' first to seed Neo4j."
      });
    }

    // 3. Loop benchmark execution
    for (let i = 1; i <= runsCount; i++) {
      // Benchmark Neo4j
      const neo4jStart = performance.now();
      const neo4jResult = await session.run(neo4jQuery);
      const neo4jEnd = performance.now();

      const neo4jTotal = neo4jEnd - neo4jStart;
      const neo4jDbOnly = neo4jResult.summary.resultAvailableAfter.toNumber();

      // Benchmark SQLite
      const sqliteStart = performance.now();
      await new Promise((resolve, reject) => {
        db.all(sqliteQuery, [], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      const sqliteEnd = performance.now();
      const sqliteTotal = sqliteEnd - sqliteStart;

      runs.push({
        run: i,
        neo4jTimeMs: Number(neo4jTotal.toFixed(2)),
        neo4jDbOnlyTimeMs: Number(neo4jDbOnly.toFixed(2)),
        sqliteTimeMs: Number(sqliteTotal.toFixed(2))
      });
    }

    await session.close();

    // 4. Calculate stats (Averages, Min, Max)
    const avgNeo4j = runs.reduce((sum, r) => sum + r.neo4jTimeMs, 0) / runsCount;
    const avgNeo4jDb = runs.reduce((sum, r) => sum + r.neo4jDbOnlyTimeMs, 0) / runsCount;
    const avgSqlite = runs.reduce((sum, r) => sum + r.sqliteTimeMs, 0) / runsCount;

    const minNeo4j = Math.min(...runs.map(r => r.neo4jTimeMs));
    const maxNeo4j = Math.max(...runs.map(r => r.neo4jTimeMs));
    const minSqlite = Math.min(...runs.map(r => r.sqliteTimeMs));
    const maxSqlite = Math.max(...runs.map(r => r.sqliteTimeMs));

    const finalNeo4j = Number(avgNeo4j.toFixed(2));
    const finalSqlite = Number(avgSqlite.toFixed(2));

    const conclusion = finalNeo4j < finalSqlite
      ? `Graph DB (Neo4j) terbukti jauh lebih cepat membedah relasi dalam (6-hops) dengan rata-rata ${finalNeo4j}ms vs SQLite ${finalSqlite}ms. Neo4j menembus batasan Cartesian Explosion di Relational DB.`
      : `SQL masih menang (perlu ditambah kompleksitas hops) atau karena latensi cloud tinggi. Rata-rata Neo4j ${finalNeo4j}ms vs SQLite ${finalSqlite}ms.`;

    res.json({
      success: true,
      message: `Benchmark Database Tradisional (SQLite) vs Graph (Neo4j) over ${runsCount} runs`,
      data: {
        neo4jTimeMs: finalNeo4j,
        sqliteTimeMs: finalSqlite,
        conclusion,
        runs,
        stats: {
          neo4j: {
            avg: finalNeo4j,
            avgDbOnly: Number(avgNeo4jDb.toFixed(2)),
            min: Number(minNeo4j.toFixed(2)),
            max: Number(maxNeo4j.toFixed(2))
          },
          sqlite: {
            avg: finalSqlite,
            min: Number(minSqlite.toFixed(2)),
            max: Number(maxSqlite.toFixed(2))
          }
        }
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { runBenchmark };
