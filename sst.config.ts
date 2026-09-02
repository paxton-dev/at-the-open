/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./.sst/platform/config.d.ts" />

const productionDomain = "open.jamespaxton.io";

export default $config({
  app(input) {
    return {
      name: "at-the-open",
      home: "aws",
      protect: input.stage === "production",
      removal: input.stage === "production" ? "retain" : "remove",
      providers: {
        aws: {
          region: "us-east-1",
          defaultTags: {
            tags: {
              application: "at-the-open",
              environment: input.stage,
              managedBy: "sst",
            },
          },
        },
      },
    };
  },

  async run() {
    const isProduction = $app.stage === "production";
    const certificateArn = process.env.SST_CERTIFICATE_ARN;

    if (isProduction && !certificateArn) {
      throw new Error(
        "SST_CERTIFICATE_ARN is required for the production custom domain",
      );
    }

    const databaseUrl = new sst.Secret("DatabaseUrl");
    const authSecret = new sst.Secret("AuthSecret");
    const finnhubApiKey = new sst.Secret("FinnhubApiKey");

    const web = new sst.aws.Nextjs("Web", {
      link: [databaseUrl, authSecret, finnhubApiKey],
      environment: {
        BETTER_AUTH_URL: isProduction
          ? `https://${productionDomain}`
          : "http://localhost:3000",
      },
      domain: isProduction
        ? {
            name: productionDomain,
            dns: false,
            cert: certificateArn!,
          }
        : undefined,
      invalidation: {
        paths: "versioned",
        wait: isProduction,
      },
    });

    return {
      url: web.url,
      distributionUrl: web.nodes.cdn!.url,
    };
  },
});
