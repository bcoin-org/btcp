'use strict';

const assert = require('assert');
const tcp = require('../lib/btcp');

const PORT = 12000;

/**
 * @param {tcp.Socket} socket
 */

function echoHandler(socket) {
  socket.on('data', (...args) => {
    socket.write(...args);
  });
};

describe('TCP', function() {
  let server;

  beforeEach(async () => {
    server = tcp.createServer(echoHandler);

    server.listen(PORT);
    await forEvent(server, 'listening');
  });

  afterEach(async () => {
    await server.close();
  });

  it('should connect', async () => {
    const client = tcp.connect(PORT);
    await forEvent(client, 'connect');
    client.destroy();
    await forEvent(client, 'close');
  });

  it('should receive the same data', async () => {
    const client = tcp.connect(PORT);
    await forEvent(client, 'connect');

    const data = Buffer.from('hello world');
    client.write(data);
    // Half close and wait for the server to echo back.
    client.end();

    let once = true;

    for await (const chunk of client) {
      assert(once);
      assert.deepStrictEqual(chunk, data);
      once = false;
    }

    client.destroy();
    await forEvent(client, 'close');
  });
});

/**
 * @param {tcp.Server|tcp.Socket} ee
 */

function forEvent(ee, eventName, timeout = 1000) {
  return new Promise((resolve, reject) => {
    let timer = null;

    const listener = () => {
      clearTimeout(timer);
      resolve();
    };

    ee.once(eventName, listener);

    timer = setTimeout(() => {
      ee.removeListener(eventName, listener);
      reject('Timed out.');
    }, timeout);
  });
}
