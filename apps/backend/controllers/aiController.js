const processAIPrompt = async (req, res) => {
  const { prompt, action } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const topic = prompt.trim();
    let responseText = '';

    if (action === 'schema') {
      responseText = `### 📊 Neo4j Cypher Schema Design: "${topic}"
A custom relational property graph schema optimized for query path-traversal.

#### 1. Graph Model Nodes & Labels
\`\`\`cypher
// Node Definitions
(:Project {id: UUID, name: String, description: String, status: String, createdAt: Timestamp})
(:Classmate {id: UUID, name: String, email: String, jurusan: String, angkatan: Integer})
(:Skill {name: String, category: String})
(:Milestone {id: UUID, title: String, isCompleted: Boolean, dueDate: Date})
\`\`\`

#### 2. Relationship Paths & Directionality
* \`(:Classmate)-[:CREATED_PROJECT]->(:Project)\`
* \`(:Classmate)-[:COLLABORATES_ON {role: String}]->(:Project)\`
* \`(:Project)-[:REQUIRES_SKILL]->(:Skill)\`
* \`(:Project)-[:HAS_MILESTONE]->(:Milestone)\`

#### 3. Database Indexes & Constraints
\`\`\`cypher
CREATE CONSTRAINT unique_project_id IF NOT EXISTS
FOR (p:Project) REQUIRE p.id IS UNIQUE;

CREATE INDEX classmate_jurusan_idx IF NOT EXISTS
FOR (c:Classmate) ON (c.jurusan);
\`\`\`

#### 4. Reusable Traversal Queries
\`\`\`cypher
// Query: Find classmate collaborators who share matching skills for "${topic}"
MATCH (p:Project {name: "${topic}"})<-[:COLLABORATES_ON]-(peer:Classmate)
MATCH (peer)-[:KNOWS_SKILL]->(s:Skill)
RETURN peer.name AS Collaborator, collect(s.name) AS MatchingSkills
LIMIT 10;
\`\`\`
`;
    } else if (action === 'brainstorm') {
      responseText = `### 💡 Brainstorming Project Workspace: "${topic}"
An advanced academic ideation brief matching classmate skillsets and research goals.

#### 1. System Architecture Proposal
* **Frontend**: Next.js 16 (App Router) + Tailwind CSS + Glassmorphism UI tokens.
* **Backend**: Express.js REST API + JWT Cookie Sessions.
* **Database**: Neo4j Graph Database for real-time relational analytics and buddy matches.

#### 2. Key Selling Points (KSPs)
1. **Interactive Node Analytics**: Allows teammates to visually analyze their network graph on a 2D canvas.
2. **Context-Aware Major Syncer**: Pairs students in Informatics, Information Systems, and Computer Engineering instantly using Cypher path matching.
3. **Scrum Task Board**: Streamlines milestone progress directly in the team's dashboard panel.

#### 3. Recommended Classmate Roles
* **Database Lead**: Focuses on query performance tuning and Neo4j session pooling.
* **Frontend Engineer**: Builds responsive, SVG-driven canvas components.
* **Product Owner**: Manages sprint goals and milestone approvals.
`;
    } else if (action === 'code') {
      responseText = `### 💻 Starter Code Blocks: "${topic}"
Ready-to-use TypeScript structures and database wrappers.

#### 1. Next.js Fetch API Hook
\`\`\`typescript
import { useState, useEffect } from 'react';

export function useProjectLoader(projectId: string) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(\`http://localhost:3001/api/projects/\${projectId}\`, {
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        setProject(data.project);
        setLoading(false);
      })
      .catch(err => console.error('Error fetching:', err));
  }, [projectId]);

  return { project, loading };
}
\`\`\`

#### 2. Express Neo4j Integration Controller
\`\`\`javascript
const neo4j = require('../config/neo4j');

exports.getProjectDetails = async (req, res) => {
  const { id } = req.params;
  const session = neo4j.getSession();
  try {
    const result = await session.run(
      'MATCH (p:Project {id: $id}) OPTIONAL MATCH (p)<-[:COLLABORATES_ON]-(c:Classmate) RETURN p, collect(c) AS team',
      { id }
    );
    res.json({ project: result.records[0].get('p').properties });
  } finally {
    await session.close();
  }
};
\`\`\`
`;
    } else if (action === 'milestones') {
      responseText = `### ✅ Scrum Milestones Checklist: "${topic}"
A robust 3-stage roadmap designed for student engineering projects.

| Sprint | Goal | Focus Areas | Est. Hours |
|---|---|---|---|
| **Sprint 1** | Schema Design & Seeding | Constraints, Mock Seeding, Auth redirect setups | 16 hrs |
| **Sprint 2** | API Routes & Core Logic | Collaboration requests, graph visualization | 24 hrs |
| **Sprint 3** | Integration & UX Polish | Real-time chat messaging, Pomodoro timers, CSS glow polish | 12 hrs |

#### 📝 Completed checklist item recommendations:
- [x] Register Google/GitHub Redirect parameters in environment keys.
- [ ] Initialize Neo4j session hooks and set up standard index constraints.
- [ ] Construct the SVG node visualization explorer on the feed page.
- [ ] Hook up direct messaging chat listeners withMajor-specific smart replies.
`;
    }

    res.json({ data: { result: responseText } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { processAIPrompt };
