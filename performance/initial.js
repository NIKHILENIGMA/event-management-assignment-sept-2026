import { SharedArray } from 'k6/data';
import http from 'k6/http';
import { check } from 'k6';

const tokens = new SharedArray('users', function () {
  const fileContent = open('./tokens.csv');
  return fileContent.split('\n').slice(1).filter(Boolean);
});

const config = JSON.parse(open('./test-env.json'));

export const options = {
  scenarios: {
    booking: {
      executor: 'shared-iterations',
      vus: 200, 
      iterations: 500, 
      maxDuration: '30s',
    },
  },
};

export default function () {
  // Use iteration number to pick a unique token for every request
  const token = tokens[__ITER];
  const eventId = config.BASELINE_EVENT_ID;
  const url = `${__ENV.API_URL || 'http://localhost:3000'}/api/initial/events/${eventId}/bookings`;

  const payload = JSON.stringify({ quantity: 1 });
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'booking created (201)': (r) => r.status === 201,
    'capacity error (400)': (r) => r.status === 400,
    'conflict error (409)': (r) => r.status === 409,
    'server error (500)': (r) => r.status === 500,
  });
}
