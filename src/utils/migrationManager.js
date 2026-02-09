// src/utils/migrationManager.js
//@ts-check
class MigrationManager {
  /**
   * @param {import("typeorm").DataSource} dataSource
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }
  
  /**
   * Get migration status
   * @returns {Promise<Object>} Migration status information
   */
  async getMigrationStatus() {
    try {
      let executedMigrations = [];
      let pendingMigrations = false;
      let lastMigration = null;
      
      try {
        // Try to query migrations table
        executedMigrations = await this.dataSource.query(
          "SELECT * FROM migrations ORDER BY id DESC"
        );
        
        // Check for pending migrations
        pendingMigrations = await this.dataSource.showMigrations();
        
        lastMigration = executedMigrations[0] || null;
      } catch (error) {
        // If migrations table doesn't exist yet, all migrations are pending
        // @ts-ignore
        if (error.message.includes('no such table') || 
            // @ts-ignore
            error.message.includes('migrations') ||
            // @ts-ignore
            error.message.includes('no such table: migrations')) {
          pendingMigrations = true;
          console.log('Migrations table does not exist yet');
        } else {
          console.error('Error checking migration status:', error);
          // Assume migration is needed on other errors
          pendingMigrations = true;
        }
      }
      
      return {
        executedMigrations: executedMigrations,
        pendingMigrations: pendingMigrations,
        lastMigration: lastMigration,
        totalExecuted: executedMigrations.length,
        needsMigration: pendingMigrations || executedMigrations.length === 0
      };
    } catch (error) {
      console.error('Failed to get migration status:', error);
      return {
        executedMigrations: [],
        pendingMigrations: false,
        lastMigration: null,
        totalExecuted: 0,
        needsMigration: false,
        // @ts-ignore
        error: error.message
      };
    }
  }
  
  /**
   * Run migrations with backup (temporarily simplified)
   * @returns {Promise<Object>} Migration result
   */
  async runMigrationsWithBackup() {
    try {
      console.log('Running migrations (backup temporarily disabled)...');
      
      // Run migrations directly
      const migrations = await this.dataSource.runMigrations();
      
      return {
        success: true,
        migrationsApplied: migrations.length,
        migrations: migrations.map((/** @type {{ name: any; }} */ m) => m.name),
        backupCreated: false,
        message: 'Migrations applied successfully'
      };
    } catch (error) {
      console.error('Migration failed:', error);
      
      return {
        success: false,
        // @ts-ignore
        error: error.message,
        restoredFromBackup: false,
        message: 'Migration failed'
      };
    }
  }
  
  // Stub methods for compatibility
  async backupDatabase() {
    console.log('Backup functionality temporarily disabled');
    return null;
  }
  
  async restoreFromLatestBackup() {
    console.log('Restore functionality temporarily disabled');
    return false;
  }
  
  /**
   * @param {any} backupName
   */
  // @ts-ignore
  async restoreFromBackup(backupName) {
    console.log('Restore functionality temporarily disabled');
    return false;
  }
  
  async listBackups() {
    return [];
  }
  
  async hasBackups() {
    return false;
  }
  
  // @ts-ignore
  async cleanupOldBackups(keepCount = 5) {
    return {
      success: true,
      kept: 0,
      deleted: 0,
      message: 'Backup cleanup not available'
    };
  }
  
  /**
   * Get database information
   * @returns {Promise<Object>} Database info
   */
  async getDatabaseInfo() {
    try {
      const dbPath = this.dataSource.options.database;
      
      let tables = [];
      
      // Get list of tables
      try {
        const tableResult = await this.dataSource.query(
          "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        );
        tables = tableResult.map((/** @type {{ name: any; }} */ row) => row.name);
      } catch (error) {
        console.warn('Could not get table list:', error);
      }
      
      return {
        path: dbPath,
        tables: tables,
        tableCount: tables.length
      };
    } catch (error) {
      console.error('Failed to get database info:', error);
      return {
        path: this.dataSource.options.database,
        tables: [],
        // @ts-ignore
        error: error.message
      };
    }
  }
}

module.exports = MigrationManager;