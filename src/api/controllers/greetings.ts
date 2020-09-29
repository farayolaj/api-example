import * as express from 'express';
import { writeJsonResponse } from '@apie/utils/express';
import GreetingService from '@apie/api/services/greetings';

export function hello(req: express.Request, res: express.Response): void {
  const name = req.query.name || 'stranger';
  writeJsonResponse(res, 200, { 'message': `Hello, ${name}!` });
}


export function goodbye(req: express.Request, res: express.Response): void {
  const userId = res.locals.auth.userId;
  GreetingService.goodbye(userId).then(value =>
    writeJsonResponse(res, 200, value));
}