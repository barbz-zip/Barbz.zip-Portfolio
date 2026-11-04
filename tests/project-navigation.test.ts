import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { isProjectIndexPath, projectReturnPath } from '../src/lib/paths.ts';

test('project back links return to the current index route, including legacy history entries', () => {
  for (const path of ['/projects/', '/projects', '/index/', '/index']) {
    assert.equal(isProjectIndexPath(path), true);
    assert.equal(projectReturnPath(path), '/projects/');
  }
});

test('projects opened outside the list return home', () => {
  for (const path of ['/', '/about/', '/projects-other/', undefined, 'https://other.test/projects/']) {
    assert.equal(projectReturnPath(path), '/');
  }
});
