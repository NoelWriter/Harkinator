var app = new Vue({
  el: "#app",
  data: {
    baseUrl: "http://localhost:3001/",
    results: [],
    configs: [],
    currentConfig: "default",
  },
  mounted: function () {
    fetch(this.baseUrl + "config")
      .then((response) => response.json())
      .then((results) => {
        this.results = results.data;
      });

    fetch(this.baseUrl + "configs")
      .then((response) => response.json())
      .then((results) => {
        this.configs = results.data;
      });
  },
  methods: {
    saveData: function (event) {
      event.preventDefault();

      fetch(this.baseUrl + "config", {
        method: "post",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.results),
      })
        .then((results) => results.json())
        .then((results) => (this.results = results.data));
    },
    onConfigChange: function (event) {
      let baseUrl = this.baseUrl + "configs/" + this.currentConfig;

      if (this.currentConfig == "default") {
        baseUrl = this.baseUrl + "config";
      }

      fetch(baseUrl)
        .then((response) => response.json())
        .then((results) => {
          this.results = results.data;
        });
    },
  },
});
