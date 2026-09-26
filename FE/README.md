# UITJobs Frontend

Next.js (App Router) frontend for UITJobs. Setup, configuration and architecture are documented in the [root README](../README.md).

## Run without Docker

Set `NEXT_PUBLIC_API_URL=http://localhost:4001` in `FE/.env` (the default `/api` only works behind the nginx proxy), then:

```bash
yarn install
yarn dev   # http://localhost:3069
```

Before committing, run `yarn lint && yarn build`. All scripts are in [package.json](package.json).
