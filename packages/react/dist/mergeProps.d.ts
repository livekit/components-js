/**
 * Calls all functions in the order they were chained with the same arguments.
 * @internal
 */
export declare function chain(...callbacks: any[]): (...args: any[]) => void;
interface Props {
    [key: string]: any;
}
type TupleTypes<T> = {
    [P in keyof T]: T[P];
} extends {
    [key: number]: infer V;
} ? V : never;
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
/**
 * Merges multiple props objects together. Event handlers are chained,
 * classNames are combined, and ids are deduplicated - different ids
 * will trigger a side-effect and re-render components hooked up with `useId`.
 * For all other props, the last prop object overrides all previous ones.
 * @param args - Multiple sets of props to merge together.
 * @internal
 */
export declare function mergeProps<T extends Props[]>(...args: T): UnionToIntersection<TupleTypes<T>>;
export {};
//# sourceMappingURL=mergeProps.d.ts.map