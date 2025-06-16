import { ScriptEventSource, system, TicksPerSecond } from "@minecraft/server";
import { generateUUID } from "./util";

const namespace = `placeholder_api`
type Params = Record<string, any>;
type Handler = (params: Params) => string | Promise<string>;

const Handlers: Record<string, Handler> = {};

export class PlaceholderAPI {
  private static debug = false;
  /**
   * Register a placeholder responder.
   * @param id The placeholder ID (e.g. "faction_name")
   * @param handler Function that returns the placeholder value
   */
  static listen(id: string, handler: Handler) {
    Handlers[id] = handler;
  }

  /**
   * Request a placeholder value from other addons.
   * @param id Placeholder ID to resolve
   * @param params Object with parameters to pass to the handler
   * @param timeout Time to wait for a response
   * @returns Promise<string>
   */
  static request(id: string, params: Params = {}, timeout = TicksPerSecond): Promise<string> {
    let resolved = false;
    const sentTime = Date.now()
    const requestId = `${id}:${generateUUID()}`;

    return new Promise((resolve) => {
      const listener = system.afterEvents.scriptEventReceive.subscribe((ev) => {
        if (ev.id !== `${namespace}:response:${requestId}`) return;
        system.afterEvents.scriptEventReceive.unsubscribe(listener);
        resolved = true
        try {
          const data = JSON.parse(ev.message);
          const elapsed = Date.now() - sentTime;
          if (this.debug) console.warn(`§7[PlaceholderAPI] §aRequest <${id}> resolved in §f${elapsed}ms`);
          resolve(data.result);
        } catch {
          resolve("PLACEHOLDER_INVALID");
        }
      });

      system.runTimeout(() => {
        if (!resolved) {
            system.afterEvents.scriptEventReceive.unsubscribe(listener);
            resolve("PLACEHOLDER_TIMEOUT");
        }
      }, timeout)

      const payload = JSON.stringify({ id, params, requestId });
      system.sendScriptEvent(`${namespace}:request`, payload);
    });
  }
}

system.afterEvents.scriptEventReceive.subscribe(async (ev) => {
  if (ev.sourceType !== ScriptEventSource.Server || !ev.id.startsWith(`${namespace}:request`)) return;

  try {
    const { id, params, requestId } = JSON.parse(ev.message);
    const handler = Handlers[id];
    if (!handler) return;

    const result = await handler(params);
    const responsePayload = JSON.stringify({ result });
    system.sendScriptEvent(`${namespace}:response:${requestId}`, responsePayload);
  } catch (e) {
    console.warn(`§7[PlaceHolderAPI Error]: §c${e}\n${e?.stack}`)
  }
}, { namespaces: [namespace]});