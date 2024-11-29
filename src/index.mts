import ky from "ky";

const client = ky.extend({
  prefixUrl: "https://jsonplaceholder.typicode.com",
  hooks: {
    beforeRequest: [
      (request) => {
        request.headers.set("X-Requested-With", "ky");
      },
    ],
  },
});

const response = await Promise.all([
  client.get("todos/1").json(),
  client.get("todos/2").json(),
]);

console.table(response);
