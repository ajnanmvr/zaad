/**
 * Base Service Class
 * Provides common CRUD operations and utility methods for all services
 */

export class BaseService<T> {
  protected repository: any;

  constructor(repository: any) {
    this.repository = repository;
  }

  /**
   * Create a new record
   */
  async create(data: T) {
    return this.repository.create(data);
  }

  /**
   * Get record by ID
   */
  async getById(id: string) {
    return this.repository.findById(id);
  }

  /**
   * Update record by ID
   */
  async updateById(id: string, data: Partial<T>) {
    return this.repository.updateById(id, data);
  }

  /**
   * Soft delete record
   */
  async softDelete(id: string) {
    return this.repository.softDelete(id);
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<boolean> {
    const record = await this.repository.findById(id);
    return !!record;
  }

  /**
   * Format error messages consistently
   */
  protected formatError(message: string): never {
    throw new Error(message);
  }

  /**
   * Validate required fields
   */
  protected validateRequired(data: Record<string, any>, fields: string[]): void {
    const missing = fields.filter((field) => !data[field]);
    if (missing.length > 0) {
      this.formatError(`${missing.join(", ")} are required`);
    }
  }

  /**
   * Check if record not found
   */
  protected checkNotFound(record: any, message: string = "Record not found"): void {
    if (!record) {
      this.formatError(message);
    }
  }
}
