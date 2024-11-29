import ky from "ky";
import dayjs from "dayjs";
import { Mutex } from "async-mutex";

function log(message: string) {
  console.log(`[${dayjs().toISOString()}] ${message}`);
}

async function wait(timeout: number) {
  return new Promise<string>((resolve) => {
    setTimeout(resolve, timeout);
  });
}

// Create an initially expired token.
let token = dayjs().subtract(1, "hour").toISOString();

// Calling `await mutex.acquire();` and `mutex.release();` 100 times in a while loop takes ~1 millisecond, so the cost of locking and unlocking the mutex is negligible in a real world scenario.
const mutex = new Mutex();

// Check if the token has expired or is about to expire.
function isExpired(token: string): boolean {
  return dayjs(token).isBefore(dayjs().subtract(1, "minute"));
}

// Simulate a process where the client initiates the refresh token procedure.
async function refreshToken(): Promise<string> {
  await wait(3000);
  return dayjs().add(1, "hour").toISOString();
}

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
