# Async Mutex

The repository was created to test how the [async-mutex](https://www.npmjs.com/package/async-mutex) library works.

```ts
// Calling `await mutex.acquire();` and `mutex.release();` 100 times in a while loop takes ~1 millisecond, so the cost of locking and unlocking the mutex is negligible in a real world scenario.
const mutex = new Mutex();

const client = ky.extend({
  prefixUrl: "https://jsonplaceholder.typicode.com",
  hooks: {
    beforeRequest: [
      // If the token has not expired, the middleware does nothing.
      async () => {
        await mutex.acquire();

        // Check if the token has expired. If so, refresh it.
        // If multiple requests are sent at the same time, only 1 refresh token request is sent because mutex is locked.
        if (isExpired(token)) {
          token = await refreshToken();
        }

        mutex.release();
      },
      async (request) => {
        log(`request to ${request.url} sent`);
      },
    ],
    afterResponse: [
      async (request) => {
        log(`request to ${request.url} finished`);
      },
    ],
  },
});

await Promise.all([
  client.get("todos/1").json(),
  client.get("todos/2").json(),
  client.get("todos/3").json(),
]);
```
