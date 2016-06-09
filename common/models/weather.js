var server = require('../../server/server');
var loopback = require('loopback');

module.exports = function(Weather) {
	var weatherDS = server.datasources.weather;

	// Can't actually register the model until after the SOAP connector is connected, so we wait for
	// the connected event and manually register it.
	//
	// See: https://docs.strongloop.com/display/public/LB/SOAP+connector#SOAPconnector-CreatingamodelfromaSOAPdatasource
	// and https://github.com/strongloop/loopback-connector-soap/issues/17 for more information
	weatherDS.once('connected', function weatherConnectorConnectedCallback () {
		Weather.forecast = function (zip, cb) {
			Weather.GetCityForecastByZIP(
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
		    Weather.forecast, {
		       accepts: [
		         {arg: 'zip', type: 'string', required: true, http: {source: 'query'}}
		       ],
		       returns: {arg: 'result', type: 'object', root: true},
		       http: {verb: 'get', path: '/forecast'}
		    }
		);

		// Manually register
		server.model(Weather);
	});
};
