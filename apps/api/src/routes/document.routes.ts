import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/auth';
import { ragEngine } from '../ai/rag';

const router = Router();
router.use(authenticateJwt);

const createDocSchema = z.object({
  title: z.string().min(1),
  docType: z.enum(['RESUME', 'JOB_DESCRIPTION', 'NOTE', 'INTERVIEW_EXP', 'SYLLABUS']),
  rawText: z.string().min(10),
  metadata: z.record(z.any()).optional()
});

const searchSchema = z.object({
  query: z.string().min(2)
});

// List documents
router.get('/workspaces/:workspaceId/documents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const documents = await prisma.document.findMany({
      where: { workspaceId, userId: req.user!.id },
      include: {
        _count: { select: { chunks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsed = documents.map(d => ({
      id: d.id,
      title: d.title,
      docType: d.docType,
      rawText: d.rawText,
      chunkCount: d._count.chunks,
      metadata: d.metadata ? JSON.parse(d.metadata) : null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Ingest new document
router.post('/workspaces/:workspaceId/documents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const body = createDocSchema.parse(req.body);

    const document = await prisma.document.create({
      data: {
        workspaceId,
        userId: req.user!.id,
        title: body.title,
        docType: body.docType,
        rawText: body.rawText,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null
      }
    });

    // Ingest into RAG Vector Store
    const chunkCount = await ragEngine.ingestDocument(document.id, body.rawText);

    res.status(201).json({
      id: document.id,
      title: document.title,
      docType: document.docType,
      chunkCount,
      createdAt: document.createdAt
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Semantic RAG Search & Grounded QA
router.post('/workspaces/:workspaceId/documents/search', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { query } = searchSchema.parse(req.body);

    const result = await ragEngine.answerGroundedQuery(workspaceId, query);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete document
router.delete('/documents/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.document.delete({
      where: { id, userId: req.user!.id }
    });
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
