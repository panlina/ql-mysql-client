var connection = new URL(process.argv[2]);	// mysql://user:password@hostname:port/database
var schema = process.argv[3];
var data = {
	host: connection.hostname,
	port: connection.port,
	user: connection.username,
	password: connection.password,
	database: connection.pathname.substr(1)
};
var Driver = require('ql-driver-mysql');
var driver = new Driver(data, schema);
console.log('connecting...');
driver.connect(e => {
	if (e)
		console.error(e.message);
	else {
		console.log('connected');
		var repl = require('repl');
		repl.start({
			eval: async function (cmd, context, filename, callback) {
				try {
					var result = await driver.query(cmd);
					callback(undefined, result);
				} catch (e) {
					callback(undefined, e);
				}
			},
			writer: function (output) {
				if (output instanceof Error)
					return output.message;
				else {
					if (output.length) {
						var Table = require('cli-table3');
						var table = new Table({ head: Object.keys(output[0]) });
						for (var row of output)
							table.push(Object.values(row).map(render));
						return table.toString();
					} else
						return "(empty)";
					function render(value) {
						if (value instanceof Date) return value.toString();
						if (value instanceof Buffer) return value.inspect();
						return value;
					}
				}
			}
		}).on('exit', () => {
			console.log('disconnecting...');
			driver.disconnect(e => {
				if (e)
					console.error(e.message);
				else
					console.log('disconnected');
			});
		});
	}
});
