export const request = async (url = '', data = {}) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

  try {
    xhr.send(JSON.stringify(data));
  } catch (error) {
    console.info('Request error ', error);
  }

  xhr.ontimeout = () => console.info(url, ' timeout');

  return new Promise((resolve, reject) => {
    xhr.onloadend = () => {
      if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status < 300) {
        xhr.responseText == ''
          ? resolve(null)
          : resolve(JSON.parse(xhr.responseText));
      } else {
        reject(xhr.status);
      }
    };
    xhr.timeout = 5000;
  });
};
