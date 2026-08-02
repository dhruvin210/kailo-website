/**
 * Provider SDKs are peer installs, not dependencies — nothing but the local disk
 * provider ships in `package.json`. Naming a provider without its package present
 * would otherwise fail at boot with a bare module-resolution error, so check up
 * front and say which install is missing.
 */
const UPLOAD_PROVIDER_PACKAGES: Record<string, string> = {
  'aws-s3': '@strapi/provider-upload-aws-s3',
  cloudinary: '@strapi/provider-upload-cloudinary',
};

/**
 * Fails at boot, with the install command, rather than at the first upload.
 *
 * `builtIn` is the value that needs no package at all (`local` for uploads); it
 * never reaches here but is named in the error so the message lists every
 * accepted value.
 */
const assertProviderInstalled = (
  envVar: string,
  provider: string,
  packages: Record<string, string>,
  builtIn?: string
): void => {
  const pkg = packages[provider];
  if (!pkg) {
    const accepted = [builtIn, ...Object.keys(packages)].filter(Boolean).join(', ');
    throw new Error(`${envVar}="${provider}" is not recognised. Use one of: ${accepted}.`);
  }

  try {
    require.resolve(pkg);
  } catch {
    throw new Error(`${envVar}="${provider}" needs its provider package. Run: npm install ${pkg}`);
  }
};

/**
 * The provider-specific half of the upload config.
 *
 * `local` is the default so development needs no credentials: files land in
 * `public/uploads` and are served from `/uploads/...`. The remote providers are an
 * env-only swap — see README "Switching the upload provider".
 */
const providerConfig = (env: any): Record<string, unknown> => {
  const provider = env('UPLOAD_PROVIDER', 'local');

  if (provider === 'local') return {};

  assertProviderInstalled('UPLOAD_PROVIDER', provider, UPLOAD_PROVIDER_PACKAGES, 'local');

  if (provider === 'aws-s3') {
    return {
      provider: 'aws-s3',
      providerOptions: {
        // Set CDN_URL when the bucket sits behind CloudFront, so the payload
        // carries the CDN origin rather than the raw S3 hostname.
        baseUrl: env('CDN_URL'),
        s3Options: {
          credentials: {
            accessKeyId: env('AWS_ACCESS_KEY_ID'),
            secretAccessKey: env('AWS_ACCESS_SECRET'),
          },
          region: env('AWS_REGION'),
          params: { Bucket: env('AWS_BUCKET') },
        },
      },
    };
  }

  return {
    provider: 'cloudinary',
    providerOptions: {
      cloud_name: env('CLOUDINARY_NAME'),
      api_key: env('CLOUDINARY_KEY'),
      api_secret: env('CLOUDINARY_SECRET'),
    },
  };
};

export default ({ env }) => ({
  upload: {
    config: {
      sizeLimit: env.int('UPLOAD_SIZE_LIMIT', 25 * 1024 * 1024),
      // Derivative widths. `mediaUrl`/`mediaSrcSet` in the frontend read these
      // back out of each file's `formats`, so changing a number here changes what
      // the browser can choose between.
      breakpoints: {
        large: 1000,
        medium: 750,
        small: 500,
      },
      ...providerConfig(env),
    },
  },

  'users-permissions': {
    config: {
      jwt: {
        expiresIn: env('JWT_EXPIRES_IN', '7d'),
      },
      // No public self-registration: the frontend has no auth phase yet, and
      // the only public writes are the two form endpoints.
      register: {
        allowedFields: [],
      },
    },
  },
});
