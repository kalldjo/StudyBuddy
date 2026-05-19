require('dotenv').config({ path: __dirname + '/.env' });
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function checkData() {
  const session = driver.session();
  try {
    const res = await session.run('MATCH (u:User {email: "joshua@ui.ac.id"}) RETURN u.id AS id');
    if(res.records.length === 0) return;
    const userId = res.records[0].get('id');

    const qSkills = `
      MATCH (me:User {id: $userId})-[:HAS_SKILL]->(mySkill:Skill)
      MATCH (other:User)-[:HAS_SKILL]->(otherSkill:Skill)
      WHERE me.id <> other.id AND toLower(mySkill.name) = toLower(otherSkill.name)
      RETURN other.name AS name, count(otherSkill) as c
    `;
    const recSkills = await session.run(qSkills, { userId });
    console.log('Mutual Skills Users:', recSkills.records.map(r => r.get('name') + ' (' + r.get('c').toNumber() + ')'));
    
    const qInterests = `
      MATCH (me:User {id: $userId})-[:INTERESTED_IN]->(myInt:Interest)
      MATCH (other:User)-[:INTERESTED_IN]->(otherInt:Interest)
      WHERE me.id <> other.id AND toLower(myInt.name) = toLower(otherInt.name)
      RETURN other.name AS name, count(otherInt) as c
    `;
    const recInterests = await session.run(qInterests, { userId });
    console.log('Mutual Interests Users:', recInterests.records.map(r => r.get('name') + ' (' + r.get('c').toNumber() + ')'));
  } catch (e) {
    console.error(e);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkData();
