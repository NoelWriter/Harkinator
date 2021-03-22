var baseUrl = "http://localhost:3001/";

var app = new Vue({
  el: "#app",
  data: {
    results: [],
  },
  mounted: function () {
    fetch(baseUrl + "config")
      .then((response) => response.json())
      .then((results) => {
        this.results = results.data;
      });
  },
  methods: {
    saveData: function (event) {
      event.preventDefault();

      fetch(baseUrl + "config", {
        method: "post",
        headers: {
          Accept: "application/json, text/plain, */*", "Content-Type": "application/json",
        },
        body: JSON.stringify(this.results),
      })
      .then((results) => results.json())
      .then((results) => this.results = results.data);
    },
  },
});
