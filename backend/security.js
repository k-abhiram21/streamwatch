const ALLOWED_FIELDS = new Set([
  'temperature',
  'water_level',
  'timestamp',
  'location',
  'power_stats.voltage',
  'power_stats.current',
  'power_stats.wattage'
]);

const POWER_STATS_FIELDS = new Set(['voltage', 'current', 'wattage']);

const ALLOWED_OPERATORS = new Set([
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$eq',
  '$ne',
  '$in',
  '$nin',
  '$and',
  '$or',
  '$not',
  '$regex',
  '$exists',
  '$size',
  '$elemMatch',
  '$sum',
  '$avg',
  '$max',
  '$min',
  '$first',
  '$last',
  '$push',
  '$add',
  '$subtract',
  '$multiply',
  '$divide',
  '$ceil',
  '$floor',
  '$count'
]);

const PROHIBITED_KEYS = new Set([
  '$where',
  '$function',
  '$lookup',
  '$graphLookup',
  '$out',
  '$merge',
  '$accumulator'
]);

const ALLOWED_PIPELINE_STAGES = new Set([
  '$match',
  '$group',
  '$sort',
  '$limit',
  '$project',
  '$unwind',
  '$count'
]);

const MALICIOUS_PATTERNS = [
  /\bdrop\s+(database|collection|table)/i,
  /\bdelete\s+(from|collection)/i,
  /\bshutdown\b/i,
  /\bkill\s+cursor\b/i,
  /\b(?:rm|remove)\s+(?:-rf|\*)/i,
  /\$where/i,
  /\$function/i,
  /function\s*\(/i,
  /\beval\s*\(/i,
  /;.*?--/i
];

export const MAX_QUERY_LIMIT = 500;

export function sanitizePayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item));
  }

  if (payload && typeof payload === 'object') {
    return Object.entries(payload).reduce((acc, [key, value]) => {
      if (typeof key !== 'string') {
        return acc;
      }

      if (key.startsWith('$') || key.includes('\0')) {
        return acc;
      }

      acc[key] = sanitizePayload(value);
      return acc;
    }, {});
  }

  return payload;
}

function assertAllowedField(field) {
  if (field === '_id') {
    return;
  }

  if (field.startsWith('power_stats.')) {
    const [, subField] = field.split('.');
    if (!POWER_STATS_FIELDS.has(subField)) {
      throw new Error(`Field "${field}" is not permitted`);
    }
    return;
  }

  if (!ALLOWED_FIELDS.has(field)) {
    throw new Error(`Field "${field}" is not permitted`);
  }
}

function sanitizeDocument(doc, path = []) {
  if (Array.isArray(doc)) {
    return doc.map((item) => sanitizeDocument(item, path));
  }

  if (doc && typeof doc === 'object') {
    if (doc instanceof Date) {
      return new Date(doc);
    }

    return Object.entries(doc).reduce((acc, [key, value]) => {
      if (PROHIBITED_KEYS.has(key)) {
        throw new Error(`Operator "${key}" is not allowed`);
      }

      if (key.startsWith('$')) {
        if (!ALLOWED_OPERATORS.has(key)) {
          throw new Error(`Operator "${key}" is not permitted`);
        }

        acc[key] = sanitizeDocument(value, path);
        return acc;
      }

      if (key.includes('.')) {
        key.split('.').reduce((segments, segment, index, arr) => {
          if (segments.length === 0) {
            if (segment === 'power_stats') {
              if (arr.length !== 2 || !POWER_STATS_FIELDS.has(arr[1])) {
                throw new Error(`Field "${key}" is not permitted`);
              }
              segments.push(segment);
            } else if (!ALLOWED_FIELDS.has(segment)) {
              throw new Error(`Field "${key}" is not permitted`);
            } else {
              segments.push(segment);
            }
          } else if (segments[0] === 'power_stats' && index === 1) {
            if (!POWER_STATS_FIELDS.has(segment)) {
              throw new Error(`Field "${key}" is not permitted`);
            }
          } else {
            throw new Error(`Field "${key}" is not permitted`);
          }
          return segments;
        }, []);
      } else {
        assertAllowedField(key);
      }

      acc[key] = sanitizeDocument(value, [...path, key]);
      return acc;
    }, {});
  }

  if (typeof doc === 'string') {
    if (/function\s*\(/i.test(doc)) {
      throw new Error('Inline JavaScript is not allowed');
    }
    if (doc.startsWith('$')) {
      const field = doc.slice(1);
      if (field.length) {
        assertAllowedField(field);
      }
    }
    return doc;
  }

  if (typeof doc === 'function') {
    throw new Error('Functions are not permitted inside queries');
  }

  return doc;
}

function sanitizeMatchStage(stageValue) {
  return sanitizeDocument(stageValue);
}

function sanitizeGroupStage(stageValue) {
  if (!stageValue || typeof stageValue !== 'object' || Array.isArray(stageValue)) {
    throw new Error('$group stage must be an object');
  }

  return Object.entries(stageValue).reduce((acc, [key, value]) => {
    if (key === '_id') {
      acc._id = sanitizeDocument(value);
      return acc;
    }

    if (!/^[a-zA-Z0-9_]{1,32}$/.test(key)) {
      throw new Error(`Invalid $group field name "${key}"`);
    }

    acc[key] = sanitizeDocument(value);
    return acc;
  }, {});
}

function sanitizeSortStage(stageValue) {
  if (!stageValue || typeof stageValue !== 'object') {
    throw new Error('$sort stage must be an object');
  }
  return Object.entries(stageValue).reduce((acc, [key, value]) => {
    assertAllowedField(key);
    const direction = Number(value) >= 0 ? 1 : -1;
    acc[key] = direction;
    return acc;
  }, {});
}

function sanitizeLimitStage(value) {
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber) || asNumber <= 0) {
    throw new Error('$limit must be a positive number');
  }
  return Math.min(asNumber, MAX_QUERY_LIMIT);
}

function sanitizeProjectStage(stageValue) {
  if (!stageValue || typeof stageValue !== 'object' || Array.isArray(stageValue)) {
    throw new Error('$project stage must be an object');
  }

  return Object.entries(stageValue).reduce((acc, [key, value]) => {
    if (key.startsWith('$') || key.includes('\0')) {
      throw new Error('Invalid $project field name');
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      if (key !== '_id') {
        assertAllowedField(key);
      }
      acc[key] = value ? 1 : 0;
      return acc;
    }

    acc[key] = sanitizeDocument(value);
    return acc;
  }, {});
}

function sanitizeUnwindStage(stageValue) {
  if (typeof stageValue === 'string') {
    assertAllowedField(stageValue.replace(/^\$/, ''));
    return stageValue;
  }

  if (stageValue && typeof stageValue === 'object') {
    if (stageValue.path) {
      assertAllowedField(stageValue.path.replace(/^\$/, ''));
    }
    if (stageValue.includeArrayIndex) {
      stageValue.includeArrayIndex = escapeHtml(stageValue.includeArrayIndex);
    }
    return stageValue;
  }

  throw new Error('$unwind must be a string or object');
}

function sanitizeCountStage(stageValue) {
  if (typeof stageValue !== 'string') {
    throw new Error('$count must be provided a string label');
  }
  return escapeHtml(stageValue);
}

function sanitizePipeline(pipeline) {
  if (!Array.isArray(pipeline) || pipeline.length === 0) {
    throw new Error('Aggregation pipeline cannot be empty');
  }

  const sanitizedPipeline = pipeline.map((stage) => {
    if (!stage || typeof stage !== 'object' || Array.isArray(stage)) {
      throw new Error('Each pipeline stage must be an object');
    }

    const stageName = Object.keys(stage)[0];
    if (!ALLOWED_PIPELINE_STAGES.has(stageName)) {
      throw new Error(`Stage "${stageName}" is not permitted`);
    }

    const stageValue = stage[stageName];
    switch (stageName) {
      case '$match':
        return { $match: sanitizeMatchStage(stageValue) };
      case '$group':
        return { $group: sanitizeGroupStage(stageValue) };
      case '$sort':
        return { $sort: sanitizeSortStage(stageValue) };
      case '$limit':
        return { $limit: sanitizeLimitStage(stageValue) };
      case '$project':
        return { $project: sanitizeProjectStage(stageValue) };
      case '$unwind':
        return { $unwind: sanitizeUnwindStage(stageValue) };
      case '$count':
        return { $count: sanitizeCountStage(stageValue) };
      default:
        throw new Error(`Unsupported stage "${stageName}"`);
    }
  });

  if (!sanitizedPipeline[0] || !sanitizedPipeline[0].$match) {
    throw new Error('Aggregation pipelines must start with $match to avoid full scans');
  }

  const existingLimitIndex = sanitizedPipeline.findIndex((stage) => stage.$limit !== undefined);
  if (existingLimitIndex === -1) {
    sanitizedPipeline.push({ $limit: MAX_QUERY_LIMIT });
  } else if (sanitizedPipeline[existingLimitIndex].$limit > MAX_QUERY_LIMIT) {
    sanitizedPipeline[existingLimitIndex].$limit = MAX_QUERY_LIMIT;
  }

  return sanitizedPipeline;
}

function sanitizeProjection(doc = {}) {
  return Object.entries(doc || {}).reduce((acc, [key, value]) => {
    assertAllowedField(key);
    const normalizedValue = value ? 1 : 0;
    acc[key] = normalizedValue;
    return acc;
  }, {});
}

function sanitizeSort(doc = {}) {
  return sanitizeSortStage(doc);
}

function sanitizeFindFilter(filter) {
  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
    throw new Error('Find filter must be an object');
  }

  if (Object.keys(filter).length === 0) {
    throw new Error('Full collection scans are not allowed for AI queries');
  }

  return sanitizeDocument(filter);
}

function sanitizeFindQuery(query = {}) {
  const safeFilter = sanitizeFindFilter(query.filter || query);
  const projection = sanitizeProjection(query.projection || {});
  const sort = sanitizeSort(query.sort || {});
  const limit = Math.min(Math.max(1, Number(query.limit) || 100), MAX_QUERY_LIMIT);

  return {
    filter: safeFilter,
    projection,
    sort,
    limit
  };
}

export function validateAIQueryPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object') {
    throw new Error('AI did not return a valid query object');
  }

  const type = rawPayload.type === 'aggregate' ? 'aggregate' : 'find';

  if (type === 'aggregate') {
    const pipeline = Array.isArray(rawPayload.query)
      ? rawPayload.query
      : rawPayload.pipeline;
    return {
      type: 'aggregate',
      pipeline: sanitizePipeline(pipeline)
    };
  }

  return {
    type: 'find',
    find: sanitizeFindQuery(rawPayload.query || rawPayload)
  };
}

export function detectMaliciousQuestion(question = '') {
  if (typeof question !== 'string' || !question.trim()) {
    return 'Question must be a non-empty string';
  }

  if (question.length > 500) {
    return 'Question is too long and was rejected';
  }

  if (MALICIOUS_PATTERNS.some((pattern) => pattern.test(question))) {
    return 'Question triggered security safeguards';
  }

  return null;
}

export function summarizeResult(result, maxItems = 5) {
  if (Array.isArray(result)) {
    return result.slice(0, maxItems);
  }

  if (result && typeof result === 'object') {
    const clone = { ...result };
    Object.keys(clone).forEach((key) => {
      if (Array.isArray(clone[key])) {
        clone[key] = clone[key].slice(0, maxItems);
      }
    });
    return clone;
  }

  return result;
}

export function escapeHtml(value = '') {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


