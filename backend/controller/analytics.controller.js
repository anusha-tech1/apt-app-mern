import { AnalyticsDailySummary } from "../models/analyticsDailySummary.model.js";
import { AnalyticsVisitor } from "../models/analyticsVisitor.model.js";
import { AnalyticsCab } from "../models/analyticsCab.model.js";
import { AnalyticsDelivery } from "../models/analyticsDelivery.model.js";

const normalizeDate = (d) => {
  const date = new Date(d);
  date.setHours(0,0,0,0);
  return date;
};

async function incrementSummary(dateISO, field) {
  const date = normalizeDate(dateISO);
  const inc = {};
  inc[field] = 1;
  await AnalyticsDailySummary.findOneAndUpdate(
    { date },
    { $inc: inc, $setOnInsert: { date } },
    { upsert: true }
  );
}

export const getDaily = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);

    const rows = await AnalyticsDailySummary.find({
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 });

    // Map to SQL-like response
    const data = rows.map(r => ({
      date: r.date.toISOString().split('T')[0],
      total_visitors: r.total_visitors,
      total_cabs: r.total_cabs,
      total_deliveries: r.total_deliveries
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDetails = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    const skip = (Number(page) - 1) * Number(limit);

    const map = {
      visitors: AnalyticsVisitor,
      cabs: AnalyticsCab,
      deliveries: AnalyticsDelivery,
    };

    const Model = map[type];
    if (!Model) return res.status(400).json({ error: 'Invalid analytics type' });

    const rows = await Model.find({ date: { $gte: start, $lte: end } })
      .sort({ date: -1, created_at: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOverviewSummary = async (req, res) => {
  try {
    const period = Number(req.query.period || 30);
    const since = new Date();
    since.setDate(since.getDate() - period);
    since.setHours(0,0,0,0);

    const rows = await AnalyticsDailySummary.find({ date: { $gte: since } });

    const totals = rows.reduce((acc, r) => {
      acc.total_days += 1;
      acc.total_visitors += r.total_visitors;
      acc.total_cabs += r.total_cabs;
      acc.total_deliveries += r.total_deliveries;
      return acc;
    }, { total_days: 0, total_visitors: 0, total_cabs: 0, total_deliveries: 0 });

    const avg_visitors_per_day = totals.total_days ? totals.total_visitors / totals.total_days : 0;
    const avg_cabs_per_day = totals.total_days ? totals.total_cabs / totals.total_days : 0;
    const avg_deliveries_per_day = totals.total_days ? totals.total_deliveries / totals.total_days : 0;

    res.json({ ...totals, avg_visitors_per_day, avg_cabs_per_day, avg_deliveries_per_day });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const recordVisitor = async (req, res) => {
  try {
    const payload = req.body;
    payload.date = normalizeDate(payload.date || new Date());
    const doc = await AnalyticsVisitor.create(payload);
    await incrementSummary(payload.date, 'total_visitors');
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const recordCab = async (req, res) => {
  try {
    const payload = req.body;
    payload.date = normalizeDate(payload.date || new Date());
    const doc = await AnalyticsCab.create(payload);
    await incrementSummary(payload.date, 'total_cabs');
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const recordDelivery = async (req, res) => {
  try {
    const payload = req.body;
    payload.date = normalizeDate(payload.date || new Date());
    const doc = await AnalyticsDelivery.create(payload);
    await incrementSummary(payload.date, 'total_deliveries');
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportData = async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);

    const rows = await AnalyticsDailySummary.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 });
    if (format !== 'csv') {
      return res.status(400).json({ error: 'Only CSV export is supported currently' });
    }
    const header = 'date,total_visitors,total_cabs,total_deliveries\n';
    const body = rows.map(r => `${r.date.toISOString().split('T')[0]},${r.total_visitors},${r.total_cabs},${r.total_deliveries}`).join('\n');
    const csv = header + body + '\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${startDate}-to-${endDate}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
