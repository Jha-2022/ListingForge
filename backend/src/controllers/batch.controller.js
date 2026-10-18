const batchService = require('../services/batch.service');
const batchRepo = require('../repositories/batch.repo');
const { sseBroadcaster } = require('../services/sse.service');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const createBatchJob = asyncHandler(async (req, res) => {
  const { marketplace, language, voice_profile_id } = req.body;

  const zipFile = req.files?.zip?.[0];
  const csvFile = req.files?.csv?.[0];

  if (!zipFile) {
    throw new AppError('A ZIP file is required', 400);
  }

  const result = await batchService.createBatchJob({
    marketplace,
    language,
    voiceProfileId: voice_profile_id,
    zipPath: zipFile.path,
    csvPath: csvFile?.path || null,
  });

  // Store item count for license guard (used by middleware on future requests)
  res.status(201).json({ success: true, data: result, error: null });
});

const getBatchJobs = asyncHandler(async (req, res) => {
  const jobs = batchRepo.getAllJobs();
  res.json({ success: true, data: jobs, error: null });
});

const getBatchJob = asyncHandler(async (req, res) => {
  const job = batchRepo.getJob(req.params.id);
  if (!job) throw new AppError('Batch job not found', 404);

  const items = batchRepo.getJobItems(job.id);
  res.json({ success: true, data: { ...job, items }, error: null });
});

const retryBatchItem = asyncHandler(async (req, res) => {
  const result = await batchService.retryItem(req.params.id, req.params.itemId);
  res.json({ success: true, data: result, error: null });
});

/**
 * GET /api/batch/:id/events — SSE endpoint
 */
const batchEvents = (req, res) => {
  const jobId = req.params.id;
  const job = batchRepo.getJob(jobId);
  if (!job) {
    return res.status(404).json({ success: false, data: null, error: { message: 'Batch job not found' } });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ jobId })}\n\n`);

  sseBroadcaster.addClient(`batch-${jobId}`, res);
};

module.exports = { createBatchJob, getBatchJobs, getBatchJob, retryBatchItem, batchEvents };
