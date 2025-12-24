import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import helmet from 'helmet';

const server = express();

export const createNestServer = async (expressInstance: express.Express) => {
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressInstance),
    );

    app.use(helmet());

    app.enableCors({
        origin: ['http://localhost:5173', 'http://localhost:3001', 'https://stunning-fe.vercel.app'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    });

    await app.init();
    return app;
};

createNestServer(server)
    .then(() => console.log('Nest Ready'))
    .catch((err) => console.error('Nest broken', err));

export default server;
