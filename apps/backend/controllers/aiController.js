const processAIPrompt = async (req, res) => {
  const { prompt, action } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    // Elegant fallback guidance if no developer key is supplied in .env
    const fallbackText = `⚠️ **Gemini AI Studio Key Diperlukan**

Untuk dapat berinteraksi dengan **Kecerdasan Buatan (AI) Asli secara real-time**, silakan pasang **Gemini API Key** Anda di file \`apps/backend/.env\`:
\`\`\`env
GEMINI_API_KEY=Kunci_API_Gemini_Anda
\`\`\`

*Anda bisa mendapatkan API key gratis dalam 10 detik dari [Google AI Studio (aistudio.google.com)](https://aistudio.google.com/)*.

---

### 💡 Jawaban Demo Simulasi (Fallback):
Sebagai alternatif sementara, berikut simulasi rancangan untuk topik **"${prompt}"**:
* **Konsep Integrasi**: Sistem SBD merekomendasikan relasi node \`(:User)-[:SKILL]->(:Skill)\` dan \`(:User)-[:INTEREST]->(:Interest)\` menggunakan indeks Cypher.
* **Saran Fitur**: Workspace kolaborasi dengan diagram visual interaktif (2D Canvas) dan notifikasi instan.
* **Perkiraan Waktu**: 12 jam pengerjaan intensif.`;

    return res.json({ data: { result: fallbackText } });
  }

  try {
    let systemInstruction = "You are StudyBuddy AI, a highly specialized academic assistant expert in property graph databases (especially Neo4j AuraDB & Cypher queries), Next.js, Express.js, and CRISP-DM workflows. Respond in clear, professional, and friendly Indonesian or English. Format your answers beautifully using GitHub-style Markdown (use bolding, clean headers, and tables). Keep it highly actionable and detailed.";
    
    if (action === 'schema') {
      systemInstruction += " Design a high-fidelity Neo4j property graph schema (nodes, relationships, constraints, indexes) optimized for this topic. Provide clean, copy-pasteable Cypher query statements.";
    } else if (action === 'brainstorm') {
      systemInstruction += " Brainstorm high-impact academic project ideas, modular features, technical stack suggestions, and coordinate specific teammate roles for this topic.";
    } else if (action === 'code') {
      systemInstruction += " Provide copy-pasteable TypeScript code blocks, Next.js page drafts, or Express API route integration scripts tailored for this topic.";
    } else if (action === 'milestones') {
      systemInstruction += " Outline a realistic Scrum milestone sprint table and progress checklist (Sprint 1 to 3) for executing this topic as an academic project.";
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nUser Input Topic: "${prompt}"` }]
            }
          ]
        })
      }
    );

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const responseText = data.candidates[0].content.parts[0].text;
      return res.json({ data: { result: responseText } });
    } else {
      throw new Error(data.error?.message || 'Failed to fetch reply from Gemini API');
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: `AI Generation Error: ${error.message}` });
  }
};

module.exports = { processAIPrompt };

