// @ts-ignore
// Virtual entry point for the app
import * as remixBuild from 'virtual:remix/server-build';
import {storefrontRedirect} from '@shopify/hydrogen';
import {broadcastDevReady} from '@netlify/remix-runtime';
import {createRequestHandler} from '@netlify/remix-edge-adapter';
import {createAppLoadContext} from '~/lib/context';

const waitUntilNotImplemented = async () => {
  console.log('waitUntil not implemented');
};

console.log('INIT server.js');
export default async function handler(request, context) {
  console.log('CALL HANDLER server.js', context);
  try {
    const env = {
      PUBLIC_STORE_DOMAIN: 'mock.shop',
      // eslint-disable-next-line no-undef -- global provided by Netlify
      ...Netlify.env.toObject(),
    };
    const waitUntil = globalThis.waitUntil || waitUntilNotImplemented;
    const appLoadContext = await createAppLoadContext(request, env, waitUntil);

    if (
      !env.SESSION_SECRET &&
      env.PUBLIC_STORE_DOMAIN &&
      env.PUBLIC_STORE_DOMAIN !== 'mock.shop'
    ) {
      throw new Error('SESSION_SECRET environment variable is not set');
    }

    /**
     * Create a Remix request handler and pass
     * Hydrogen's Storefront client to the loader context.
     */
    const handleRequest = createRequestHandler({
      build: remixBuild,
      mode: process.env.NODE_ENV,
      getLoadContext: () => appLoadContext,
    });

    const response = await handleRequest(request, appLoadContext);

    if (!response) {
      return;
    }

    if (response.status === 404) {
      /**
       * Check for redirects only when there's a 404 from the app.
       * If the redirect doesn't exist, then `storefrontRedirect`
       * will pass through the 404 response.
       */
      return storefrontRedirect({
        request,
        response,
        storefront: appLoadContext.storefront,
      });
    }

    return response;
  } catch (error) {
    console.error(error);
    return new Response('An unexpected error occurred', {status: 500});
  }
}

if (process.env.NODE_ENV === 'development') {
  // Tell remix dev that the server is ready
  broadcastDevReady(remixBuild);
}
