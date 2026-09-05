import { llm } from './llm';
import { prisma } from '../prisma';

export interface ChunkMatch {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  similarity: number;
}

export class RAGEngine {
  // Cosine similarity between two float vectors
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Chunks text into overlapping windows
  chunkText(text: string, chunkSize: number = 600, overlap: number = 100): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end).trim());
      if (end === text.length) break;
      start += chunkSize - overlap;
    }
    return chunks.filter(c => c.length > 20);
  }

  // Ingests and chunks a document, generating embeddings
  async ingestDocument(documentId: string, text: string): Promise<number> {
    const rawChunks = this.chunkText(text);
    let index = 0;

    for (const content of rawChunks) {
      const embedding = await llm.generateEmbeddings(content);
      await prisma.documentChunk.create({
        data: {
          documentId,
          content,
          chunkIndex: index++,
          embedding: JSON.stringify(embedding)
        }
      });
    }

    return rawChunks.length;
  }

  // Semantic search over workspace document chunks
  async search(workspaceId: string, query: string, topK: number = 5): Promise<ChunkMatch[]> {
    const queryVector = await llm.generateEmbeddings(query);

    const documents = await prisma.document.findMany({
      where: { workspaceId },
      include: { chunks: true }
    });

    const matches: ChunkMatch[] = [];

    for (const doc of documents) {
      for (const chunk of doc.chunks) {
        if (!chunk.embedding) continue;
        try {
          const chunkVector: number[] = JSON.parse(chunk.embedding);
          const similarity = this.cosineSimilarity(queryVector, chunkVector);
          matches.push({
            chunkId: chunk.id,
            documentId: doc.id,
            documentTitle: doc.title,
            content: chunk.content,
            similarity
          });
        } catch (e) {
          // ignore corrupted embeddings
        }
      }
    }

    // Sort by descending similarity
    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.slice(0, topK);
  }

  // Synthesize answer grounded strictly in retrieved chunks
  async answerGroundedQuery(workspaceId: string, query: string): Promise<{ answer: string; citations: Array<{ documentTitle: string; excerpt: string }> }> {
    const matches = await this.search(workspaceId, query, 3);

    if (matches.length === 0) {
      return {
        answer: "No relevant documents found in this workspace to answer your query. Upload your notes, interview experiences, or job descriptions to build your knowledge base.",
        citations: []
      };
    }

    const contextSnippet = matches
      .map((m, i) => `[Document ${i + 1}: "${m.documentTitle}"]\n${m.content}`)
      .join('\n\n');

    const prompt = `
Question: ${query}

Relevant Workspace Notes & Documents:
${contextSnippet}

Provide a comprehensive, accurate answer based strictly on the provided documents. Highlight key details.
`;

    const response = await llm.complete(prompt, "You are FlowDesk Grounded Knowledge Assistant. Use the provided excerpts accurately.");

    const citations = matches.map(m => ({
      documentTitle: m.documentTitle,
      excerpt: m.content.slice(0, 160) + '...'
    }));

    return {
      answer: response || `Based on your saved notes in "${matches[0].documentTitle}": ${matches[0].content.slice(0, 300)}...`,
      citations
    };
  }
}

export const ragEngine = new RAGEngine();
