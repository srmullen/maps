import axios from 'axios';
import pako from 'pako';

export function radiansToDegrees(n) {
  return (n * 180) / Math.PI;
}

export function degreesToRadians(n) {
  return n * Math.PI / 180;
}

export function timer(fn) {
  const now = Date.now();
  const ret = fn();
  if (ret instanceof Promise) {
    ret.then(() => {
      const dur = Date.now() - now;
      console.log(dur);
    });
  } else {
    const dur = Date.now() - now;
    console.log(dur);
  }
  return ret;
}

export function saveAsSVG(project, name = 'default') {
  console.log('Saving');
  const content = timer(() => {
    return project.exportSVG({ asString: true });
  });
  const body = {
    name,
    content: pako.deflate(content, { to: 'string' })
  }

  axios.put('/api/svg', body, { headers: { 'content-type': 'application/json' } }).then(res => {
    console.log(res);
  }).catch(err => {
    console.error(err);
  });
}