import {createHydrogenContext, InMemoryCache} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';

/**
 * The context implementation is separate from server.ts
 * so that type can be extracted for AppLoadContext
 * @param {Request} request
 * @param {Env} env
 * @param {() => Promise<void>} waitUntil
 */
export async function createAppLoadContext(request, env, waitUntil) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const session = await AppSession.init(request, [env.SESSION_SECRET]);

  const hydrogenContext = createHydrogenContext({
    env,
    request,
    cache: new InMemoryCache(),
    waitUntil,
    session,
    i18n: {language: 'EN', country: 'US'},
    cart: {
      queryFragment: CART_QUERY_FRAGMENT,
    },
  });
  console.log(hydrogenContext);

  return {
    ...hydrogenContext,
  };
}
