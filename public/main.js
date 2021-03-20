var app = new Vue({
  el: '#app',
  data: {
    results: []
  },
  mounted: function () {
      fetch('config.json')
      .then(response => response.json())
      .then((json) => {
          this.results = json;
      });
  },
  methods: {
    filterData: function (key) {
      if (key === 'USERNAME' || key === 'PASSWORD') {
        return false;
      }

      return true;
    },
    saveData: function(event) {
      console.log(this.results);
    }
  }
})
