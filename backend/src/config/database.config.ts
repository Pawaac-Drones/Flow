import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Single source of truth for the TypeORM/Postgres connection.
 * Consumed by AppModule via ConfigService — do not duplicate this object
 * elsewhere (see app.module.ts).
 */
export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const sslEnabled = process.env.DB_SSL === 'true';

    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'pawaacflow',
      password: process.env.DB_PASSWORD || 'pawaacflow_secret',
      database: process.env.DB_DATABASE || 'pawaacflow',
      entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
      // Never auto-sync schema in production; rely on database/migrations/*.sql.
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      // Required for managed Postgres providers (Supabase, RDS, Azure, etc.)
      // that terminate TLS. `rejectUnauthorized: false` is only used when
      // explicitly opted into via DB_SSL_REJECT_UNAUTHORIZED=false, e.g. for
      // providers presenting certs not in Node's default CA store.
      ssl: sslEnabled
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : false,
      extra: {
        max: parseInt(process.env.DB_POOL_SIZE || '10', 10),
      },
    };
  },
);
