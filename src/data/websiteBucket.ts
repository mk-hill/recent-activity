import { S3 } from '../aws';
import { createLogger } from '../logger';

const log = createLogger('data/websiteBucket');

const Bucket = process.env.WEBSITE_BUCKET;

const s3 = new S3({
  signatureVersion: 'v4',
  region: process.env.AWS_REGION ?? 'us-east-1',
  params: { Bucket },
});

export function getWebsiteHtml(): Promise<string> {
  try {
    log.info('Retrieving website HTML content');
    return s3
      .getObject({
        Bucket,
        Key: 'index.html',
      })
      .promise()
      .then((result) => result.Body.toString());
  } catch (error) {
    log.error('Unable to retrieve website HTML content', { error });
    throw error;
  }
}

export function saveWebsiteHtml(content: string) {
  try {
    log.info('Saving updated HTML content', { content });
    return s3
      .upload({
        Bucket,
        Key: 'index.html',
        Body: content,
        ContentType: 'text/html',
        CacheControl: 'max-age=900',
      })
      .promise();
  } catch (error) {
    log.error(error);
    throw error;
  }
}
