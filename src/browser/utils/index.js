export const request = async (url = '', data = {}, responseType = 'json') => {
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
        switch (responseType) {
          case 'json':
            xhr.responseText == ''
              ? resolve(null)
              : resolve(JSON.parse(xhr.responseText));
            break;
          case 'text':
            resolve(xhr.responseText);
            break;
          default:
            throw new Error('wrong responseType');
        }
      } else {
        reject({ status: xhr.status, error: JSON.parse(xhr.responseText) });
      }
    };
    xhr.timeout = 5000;
  });
};

const TOKEN_KEY = 'token';

export const writeTokenInCookie = (token) => {
  const cookie = document.cookie === '' ? {} : JSON.parse(document.cookie);
  cookie[TOKEN_KEY] = token;
  document.cookie = JSON.stringify(cookie);
};
