export class Future<T, E extends Error> {
  promise: Promise<T>;

  resolve?: (arg: T) => void;

  reject?: (e: E) => void;

  onFinally?: () => void;

  get isResolved(): boolean {
    return this._isResolved;
  }

  private _isResolved: boolean = false;

  constructor(
    futureBase?: (resolve: (arg: T) => void, reject: (e: E) => void) => void,
    onFinally?: () => void,
  ) {
    this.onFinally = onFinally;
    this.promise = new Promise<T>(async (resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      if (futureBase) {
        await futureBase(resolve, reject);
      }
    }).finally(() => {
      this._isResolved = true;
      this.onFinally?.();
    });
  }
}
