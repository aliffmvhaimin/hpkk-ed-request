import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);

export function loadSource(file, mocks = {}, globals = {}, cache = new Map()) {
  if (cache.has(file)) return cache.get(file);
  const source = readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }, fileName: file,
  });
  const exports = {};
  const imports = name => {
    if (name in mocks) return mocks[name];
    if (name === "server-only") return {};
    if (name.startsWith("@/")) {
      const path = name.slice(2);
      const extension = existsSync(new URL(`../../${path}.tsx`, import.meta.url)) ? "tsx" : "ts";
      return loadSource(`${path}.${extension}`, mocks, globals, cache);
    }
    return require(name);
  };
  new Function("require", "exports", ...Object.keys(globals), outputText)(imports, exports, ...Object.values(globals));
  cache.set(file, exports);
  return exports;
}

// Exercise event handlers and successive renders without a browser or live database.
export function createHookHarness() {
  const slots = [], effects = [], transitions = [];
  let cursor = 0, changed = false, pending = false;
  const effect = (callback, dependencies) => {
    const index = cursor++;
    const previous = slots[index];
    if (!previous || !dependencies || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
      effects.push(() => {
        previous?.cleanup?.();
        slots[index] = { dependencies, cleanup: callback() };
      });
    }
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], next => {
        const value = typeof next === "function" ? next(slots[index]) : next;
        if (!Object.is(value, slots[index])) { slots[index] = value; changed = true; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useMemo: callback => callback(),
    useEffect: effect,
    useLayoutEffect: effect,
    useTransition: () => [pending, callback => { transitions.push(Promise.resolve(callback())); }],
  };
  return {
    react,
    setPending(value) { pending = value; },
    render(component, props) {
      for (let attempt = 0; attempt < 20; attempt++) {
        cursor = 0; changed = false; effects.length = 0;
        const tree = component(props);
        if (!changed) return tree;
      }
      throw new Error("Component did not settle after a state update");
    },
    flushEffects() { for (const callback of effects.splice(0)) callback(); },
    async settle() { await Promise.all(transitions.splice(0)); },
  };
}

export function findAll(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap(child => findAll(child, predicate));
  if (!tree || typeof tree !== "object" || !tree.props) return [];
  return [...(predicate(tree) ? [tree] : []), ...findAll(tree.props.children, predicate)];
}

export function find(tree, predicate) {
  const result = findAll(tree, predicate)[0];
  if (!result) throw new Error("Expected control was not rendered");
  return result;
}
