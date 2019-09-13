const fetchGetRequest = (url, token) => {
  if (url && token) {
    return fetch(url, {
      headers: new Headers({
        Authorization: 'Bearer ' + token
      })
    })
      .then(response => {
        return response.json();
      })
      .catch(error => {
        console.log('fetchGetRequest failed', error);
      });
  } else {
    console.log('fetchGetRequest error', url, token);
  }
};

export { fetchGetRequest };
