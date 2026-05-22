\# Real-World Case Study: Graph Databases in Social Matchmaking



\## Company Researched: LinkedIn

For the Study Buddy project, we researched the architecture of \*\*LinkedIn\*\*, the world's largest professional networking platform. LinkedIn's core functionality—connecting professionals, recommending jobs, and suggesting "People You May Know" based on shared skills, mutual connections, and educational background—relies heavily on the \*\*Graph Database\*\* paradigm.



\## Why LinkedIn Uses Graph Technology

In a traditional Relational Database (RDBMS), calculating network proximity (e.g., finding out that User A and User B both major in "Teknik Komputer", share the skill "React", and have mutual friends) requires deep, highly expensive `JOIN` operations across multiple huge tables. As the degrees of separation increase, RDBMS performance degrades exponentially.



\*\*Graph Databases (like Neo4j) solve this efficiently because:\*\*

1\. \*\*Relationships as First-Class Entities:\*\* Connections between users and their attributes (skills, courses) are stored directly as physical pointers (edges).

2\. \*\*Index-Free Adjacency:\*\* Traversing from a user to their skills and then to other users with those skills takes milliseconds, regardless of the overall data size.

3\. \*\*Dynamic Schema:\*\* Adding new academic entities or interaction types does not require costly schema migrations.



\## Relevance to Study Buddy

Study Buddy maps directly to LinkedIn's approach but is tailored for the university academic ecosystem. By structuring our data in \*\*Neo4j AuraDB\*\*, we represent students (`User`), their academic demographics (`Fakultas`, `Jurusan`, `Angkatan`), and capabilities (`Skill`, `MataKuliah`) as a rich social graph. This allows our recommendation engine to use Cypher queries to instantly find and match students for project collaboration and study groups based on real-time graph traversals.

