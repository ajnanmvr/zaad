/**
 * Serialization utilities for converting MongoDB documents to plain objects
 */

/**
 * Check if a value is a MongoDB ObjectId
 */
function isObjectId(value: any): boolean {
  if (!value) return false;
  
  // Check by constructor name
  if (value.constructor?.name === 'ObjectId') return true;
  
  // Check by toString method and buffer property (characteristic of ObjectId)
  if (value.buffer && value.toJSON && value.toString) {
    try {
      const str = value.toString();
      // ObjectIds are 24-character hex strings
      return /^[0-9a-f]{24}$/i.test(str);
    } catch {
      return false;
    }
  }
  
  // Check if it has the typical ObjectId structure
  if (value._id === undefined && value.buffer && typeof value.buffer === 'object') {
    return true;
  }
  
  return false;
}

/**
 * Recursively convert all ObjectId instances to strings
 */
export function serializeObjectIds(value: any): any {
  if (value === null || value === undefined) return value;
  
  // Handle primitives
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  // Handle ObjectId instances - must be checked before other object checks
  if (isObjectId(value)) {
    try {
      return value.toString();
    } catch {
      return String(value);
    }
  }
  
  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item) => serializeObjectIds(item));
  }
  
  // Handle objects
  if (typeof value === 'object') {
    const serialized: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === '_id' && isObjectId(v)) {
        // Handle _id field that is an ObjectId
        try {
          serialized[k] = (v as any).toString();
        } catch {
          serialized[k] = String(v);
        }
      } else {
        // Recursively serialize the value
        serialized[k] = serializeObjectIds(v);
      }
    }
    return serialized;
  }
  
  return value;
}
