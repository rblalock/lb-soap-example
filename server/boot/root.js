var loopback = require('loopback');

module.exports = function (server) {
	// Install a `/` route that returns server status
	var router = server.loopback.Router();
	router.get('/', server.loopback.status());
	server.use(router);

	// Example of creating the weather model and exposing it
	var weatherDS = server.datasources.weather;

	weatherDS.once('connected', function weatherConnectorConnectedCallback () {
		var WeatherService = weatherDS.createModel('WeatherService', {}, { base: 'Model' });

		WeatherService.forecast = function (zip, cb) {
			WeatherService.GetCityForecastByZIP(
				{ ZIP: zip || '94555'},
				function (err, response) {
					console.log('Forecast: %j', response);

					var result;
					if (!err && response.GetCityForecastByZIPResult.Success) {
						result = response.GetCityForecastByZIPResult.ForecastResult.Forecast;
					} else {
						result = [];
					}

					cb(err, result);
				}
			);
		};

		loopback.remoteMethod(
		    WeatherService.forecast, {
		       accepts: [
		         {arg: 'zip', type: 'string', required: true, http: {source: 'query'}}
		       ],
		       returns: {arg: 'result', type: 'object', root: true},
		       http: {verb: 'get', path: '/forecast'}
		    }
		);

		server.model(WeatherService);
	});
};
