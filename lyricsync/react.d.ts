declare module "react" {
  export function useState<T>(init: T): [T, (v: T) => void];
  export function useEffect(effect: any, deps?: any): void;
  export function useRef<T>(init: T): { current: T };
  export type FC<P = {}> = (props: P) => any;
  const React: any;
  export default React;
}

declare module "react-dom/client" {
  export function createRoot(container: any): { render(el: any): void };
}

declare module "react/jsx-runtime" {
  const jsx: any;
  export default jsx;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
