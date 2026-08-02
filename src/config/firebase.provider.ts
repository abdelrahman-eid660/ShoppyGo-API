import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const serviceAccount = JSON.parse(
  readFileSync(
    resolve('./src/config/echo-74188-firebase-adminsdk-fbsvc-5e219b2633.json'),
    'utf8'
  )
);

export const firebaseApp =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
