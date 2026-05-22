# Data Modeling: Study Buddy Graph Schema



## Structure & Entities

Our application uses a property graph model. Unlike tables, our data is structured into **Nodes** (entities) and **Relationships** (directed edges connecting entities). 



### Core Nodes

- **`User`**: The central entity representing a student (Properties: `id`, `name`, `email`, `bio`).

- **Academic Demographics**: `Fakultas`, `Jurusan`, `Angkatan` (Properties: `name`, `year`).

- **Learning & Capability**: `Skill`, `Interest`, `MataKuliah` (Properties: `name`, `code`).

- **Collaboration Entities**: `Project`, `Opportunity`, `Post` (Properties: `title`, `content`, `createdAt`).



### Key Relationships

Relationships define the context of the connection:

- **Academic Profile**: `(User)-[:BELONGS_TO_FAKULTAS]->(Fakultas)`

- **Social Context**: `(User)-[:IS_FRIENDS_WITH]->(User)`

- **Skill & Interest Matching**: `(User)-[:HAS_SKILL]->(Skill)` and `(User)-[:INTERESTED_IN]->(Interest)`

- **Project Collab**: `(User)-[:CREATED_PROJECT]->(Project)` and `(Project)-[:USES_SKILL]->(Skill)`



## Detailed Data Model Diagram

[![](https://mermaid.ink/img/pako:eNqlVm1vqkoQ_isbmnOyJthaFCz03pvQii0thUZsmnNjYlZYdSuyZoG0vbX__S4vi8p5izl8kFl2Zp7HeWYHPqSAhlgypAVDmyUYDyYx4NeXL-DvX16128Aa2q7t28D1BhaAV5jNcJxmK-CQeLFCDMUARQi4mPZeWkclf0owgzD_bfHAOtQMUIjXJAADvKYFaxIk5e4QrbIoRQmEwmpVkHcZyxIUQ1gZ4rmZc0zzDWEdYF2jDZqRiKQEJ-ArsOMUM5ykFZy_IlEEYXETCYULhMISOw88-30WEbSEMLdBuTjEo1GEZpShlNDq6SOjLzjg-SrjwP9YjUaWY_IbtAY3lt86Nk1deU5lTiK8kwm02_9sryzHc2_86dibDs37J2ds-ttakobvg3nnjfyp7W6FNA2Ha07Un3rDbS1R6VCTcTBiMW8xLkut0nsjya3pT_1723G2pVaNbdsdWyPLH1uDgogQrOFluSPPcSqfnYgNOj4NCIq4gDzJWwqgj6N5O6J009pL91eB6k-HI9tyB_702R7fboutRrZK6x_1w65CI8vMqT-OvDvrerwVQQ23O892f-olcHLHJ99qVuvYBvHH3xzbvQFn4NF6NkeuabrHpnjmqiIQogQxkBVzpPgn8IqwrCplEKEkGeA5yPiOy6cX4M0YGSfd2YUy1-QkZXSFjRNF1bp4Vi3bryRMl0Z38yYHNKLMOJkXlzzngrVfMVksU2NGo_CyoUTJp2TC5xrhrQzMVXEOVgA-xYvvWKHqlOwxu5ipwR6zftBFODxkpjSZ_YpIIc-Z6NezXVMCeEte0HeUovys7PE578z0i_OaT0fVNU3_Az6ijaDHx_07bsIHRRfv4c9VHXdmNX6o9_sd7ff4NfYDjjEf_Cv-bilAwGtBZoXBGiV8JrTLG4g55B6XspVE11zu74gxJVfTSBZT50DOg5BCBFmIIO-JUJf7wF8UaVeNS0nmr10SSkbKMixLa8zWKF9KH3ngREqXeI0nksHNEM8RZziRJvEnD9ug-F9K1yKS0WyxlIw5ihK-yjYhSvGAIP523LngOMTsmnLFJKPXKVJIxof0JhmK2jnt9fqaonUUVelruiJL75KhXpz29K6udzRF17VeT_mUpf8K0M5pv3eudrtqv88fnxcBOCQpZQ_lx0TxTfH5P4tMksU?type=png)](https://mermaid.live/edit#pako:eNqlVm1vqkoQ_isbmnOyJthaFCz03pvQii0thUZsmnNjYlZYdSuyZoG0vbX__S4vi8p5izl8kFl2Zp7HeWYHPqSAhlgypAVDmyUYDyYx4NeXL-DvX16128Aa2q7t28D1BhaAV5jNcJxmK-CQeLFCDMUARQi4mPZeWkclf0owgzD_bfHAOtQMUIjXJAADvKYFaxIk5e4QrbIoRQmEwmpVkHcZyxIUQ1gZ4rmZc0zzDWEdYF2jDZqRiKQEJ-ArsOMUM5ykFZy_IlEEYXETCYULhMISOw88-30WEbSEMLdBuTjEo1GEZpShlNDq6SOjLzjg-SrjwP9YjUaWY_IbtAY3lt86Nk1deU5lTiK8kwm02_9sryzHc2_86dibDs37J2ds-ttakobvg3nnjfyp7W6FNA2Ha07Un3rDbS1R6VCTcTBiMW8xLkut0nsjya3pT_1723G2pVaNbdsdWyPLH1uDgogQrOFluSPPcSqfnYgNOj4NCIq4gDzJWwqgj6N5O6J009pL91eB6k-HI9tyB_702R7fboutRrZK6x_1w65CI8vMqT-OvDvrerwVQQ23O892f-olcHLHJ99qVuvYBvHH3xzbvQFn4NF6NkeuabrHpnjmqiIQogQxkBVzpPgn8IqwrCplEKEkGeA5yPiOy6cX4M0YGSfd2YUy1-QkZXSFjRNF1bp4Vi3bryRMl0Z38yYHNKLMOJkXlzzngrVfMVksU2NGo_CyoUTJp2TC5xrhrQzMVXEOVgA-xYvvWKHqlOwxu5ipwR6zftBFODxkpjSZ_YpIIc-Z6NezXVMCeEte0HeUovys7PE578z0i_OaT0fVNU3_Az6ijaDHx_07bsIHRRfv4c9VHXdmNX6o9_sd7ff4NfYDjjEf_Cv-bilAwGtBZoXBGiV8JrTLG4g55B6XspVE11zu74gxJVfTSBZT50DOg5BCBFmIIO-JUJf7wF8UaVeNS0nmr10SSkbKMixLa8zWKF9KH3ngREqXeI0nksHNEM8RZziRJvEnD9ug-F9K1yKS0WyxlIw5ihK-yjYhSvGAIP523LngOMTsmnLFJKPXKVJIxof0JhmK2jnt9fqaonUUVelruiJL75KhXpz29K6udzRF17VeT_mUpf8K0M5pv3eudrtqv88fnxcBOCQpZQ_lx0TxTfH5P4tMksU)

 ## Why it Fits the Graph Paradigm?

The Study Buddy recommendation engine relies on finding overlaps. For instance, to recommend a study partner based on shared interests, the system executes a Cypher query to find a path like: (User A)-[:INTERESTED_IN]->(Interest)<-[:INTERESTED_IN]-(User B).

This paradigm fits perfectly because our primary query pattern is traversing relationships rather than aggregating disparate tables. It makes implementing mutual skill matchmaking and academic proximity highly performant.

