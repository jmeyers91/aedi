export class DbService {
  async query<T>(value: T): Promise<T> {
    return value;
  }
}
