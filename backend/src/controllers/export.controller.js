const listingsRepo = require('../repositories/listings.repo');
const batchRepo = require('../repositories/batch.repo');
const exportService = require('../services/export.service');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const exportListingCsv = asyncHandler(async (req, res) => {
  const { marketplace, ids } = req.query;
  let listings;

  if (ids) {
    const idList = ids.split(',');
    listings = idList.map((id) => listingsRepo.getById(id.trim())).filter(Boolean);
  } else if (marketplace) {
    listings = listingsRepo.getAll({ marketplace, status: 'done', limit: 1000 });
  } else {
    throw new AppError('Provide marketplace or ids query parameter', 400);
  }

  if (listings.length === 0) throw new AppError('No listings found for export', 404);

  const mp = listings[0].marketplace;
  const csv = exportService.exportToCsv(listings, mp);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=listings-${mp}-${Date.now()}.csv`);
  res.send(csv);
});

const exportListingJson = asyncHandler(async (req, res) => {
  const { marketplace, ids } = req.query;
  let listings;

  if (ids) {
    const idList = ids.split(',');
    listings = idList.map((id) => listingsRepo.getById(id.trim())).filter(Boolean);
  } else if (marketplace) {
    listings = listingsRepo.getAll({ marketplace, status: 'done', limit: 1000 });
  } else {
    throw new AppError('Provide marketplace or ids query parameter', 400);
  }

  if (listings.length === 0) throw new AppError('No listings found for export', 404);

  const json = exportService.exportToJson(listings);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=listings-${Date.now()}.json`);
  res.send(json);
});

const exportBatchCsv = asyncHandler(async (req, res) => {
  const job = batchRepo.getJob(req.params.id);
  if (!job) throw new AppError('Batch job not found', 404);

  const listings = listingsRepo.getByBatchJob(job.id);
  const doneListings = listings.filter((l) => l.status === 'done');

  if (doneListings.length === 0) throw new AppError('No completed listings to export', 404);

  const csv = exportService.exportToCsv(doneListings, job.marketplace);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=batch-${job.id}-${job.marketplace}.csv`);
  res.send(csv);
});

const exportBatchJson = asyncHandler(async (req, res) => {
  const job = batchRepo.getJob(req.params.id);
  if (!job) throw new AppError('Batch job not found', 404);

  const listings = listingsRepo.getByBatchJob(job.id);
  const doneListings = listings.filter((l) => l.status === 'done');

  if (doneListings.length === 0) throw new AppError('No completed listings to export', 404);

  const json = exportService.exportToJson(doneListings);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=batch-${job.id}.json`);
  res.send(json);
});

module.exports = { exportListingCsv, exportListingJson, exportBatchCsv, exportBatchJson };
