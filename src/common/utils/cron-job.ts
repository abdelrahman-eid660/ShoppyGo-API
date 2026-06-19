import cron from 'node-cron';

export const storiesExpire = () => {
  cron.schedule('59 59 23 * * *', () => {});
};
