export class NextResponse extends Response {
  static json(data: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(data), init);
  }
}
