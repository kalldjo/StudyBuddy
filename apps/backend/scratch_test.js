require('dotenv').config({ path: __dirname + '/.env' });
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

async function checkData() {
  const session = driver.session();
  try {
    const resUsers = await session.run('MATCH (u:User) RETURN count(u) AS c');
    console.log('Total Users:', resUsers.records[0].get('c').toNumber());

    const resSkills = await session.run('MATCH (s:Skill) RETURN count(s) AS c');
    console.log('Total Skills:', resSkills.records[0].get('c').toNumber());

    const resInterests = await session.run('MATCH (i:Interest) RETURN count(i) AS c');
    console.log('Total Interests:', resInterests.records[0].get('c').toNumber());

    const resHasSkill = await session.run('MATCH (u:User)-[r:HAS_SKILL]->(s:Skill) RETURN count(r) AS c');
    console.log('Total HAS_SKILL relationships:', resHasSkill.records[0].get('c').toNumber());

    const resMutualSkills = await session.run(`
      MATCH (u1:User)-[:HAS_SKILL]->(s:Skill)<-[:HAS_SKILL]-(u2:User)
      WHERE u1.id < u2.id
      RETURN count(*) AS c
    `);
    console.log('Total Mutual Skills pairs:', resMutualSkills.records[0].get('c').toNumber());

    const resHasInterest = await session.run('MATCH (u:User)-[r:INTERESTED_IN]->(i:Interest) RETURN count(r) AS c');
    console.log('Total INTERESTED_IN relationships:', resHasInterest.records[0].get('c').toNumber());
    
    // Check if the relationships are case-sensitive matching
    const sampleSkill = await session.run('MATCH (u:User)-[:HAS_SKILL]->(s:Skill) RETURN u.name AS uName, s.name AS sName LIMIT 5');
    console.log('Sample Skills:', sampleSkill.records.map(r => `${r.get('uName')} -> ${r.get('sName')}`));
  } catch (e) {
    console.error(e);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkData();
