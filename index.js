var twilio = require('twilio');
var app = require('express')();
var http = require('request-promise-json');
app.use(require('body-parser').urlencoded({extended: true}));

const myUrl = 'http://84132685.ngrok.io/';
const dataUrl = 'http://f1b8272f.ngrok.io/';
const logFileName = '../log.json';

var persisted = {};

var fs = require('fs');

fs.readFile(logFileName, (err, data) => {
	persisted = JSON.parse(data);
});
var logMessage = msg => {
	persisted.log.push(msg);
	fs.writeFile(logFileName, JSON.stringify(persisted));
};


var when = (action, callback, reset) => {
	app.post('/' + action, (req, res) => {

		var input = req.body.Digits;
		var person = persisted.people[req.body.From] = reset ? {} : persisted.people[req.body.From] || {};
		person[action] = input;
		person.phoneNumber = req.body.From;

		console.log(person, action, input);

		Promise.resolve(callback(input, person)).then(result => {
			var [msg, action] = result.split(/\s*->\s*/);
			logMessage(req.body);
			if (action){
				var r = new twilio.TwimlResponse();
				r.gather({
					action: myUrl + action,
					numDigits: 1
				}, function(){
					this.say(msg);
				});
				r.redirect(myUrl + action);
				res.type('text/xml');
				res.send(r.toString());
			} else {
				res.type('text/plain');
				res.send(msg);
			}
		}).catch(err => console.error(err));
	});
};

app.get('', (req, res) => {
	res.send('<div style="font-size:72px">' + '\u{1F4A9}'.repeat(1000) + '</div>');
});

app.get('/log', (req, res) => {
	res.send(persisted);
});

when('call', () => {
	return 'You have reached the shelter finder hotline. To request a shelter for victims of domestic abuse press 1, for family shelter press 2, for individual shelter press 3. -> shelterType';
}, true);

when('shelterType', input => {
	if (input == 1){
		return 'Enter the number of women and children in need. Please note that adult males are not allowed. -> numAbused';
	} else if (input == 2){
		return 'Enter number of children less than 15 years of age. -> numChildren';
	} else if (input == 3){
		return 'If you are male press 1. If you are female press 2. -> gender';
	} else {
		return 'For domestic abuse shelter press 1, for family shelter press 2, for individual shelter press 3. -> shelterType';
	}
});

when('numAbused', () => {
	return 'If you are in Saint Louis City press 1, for Saint Louis County press 2, for Saint Charles press 3. -> location';
});


when('numChildren', () => {
	return 'Enter the number of adult males in your family. -> adultMales';
});
when('adultMales', () => {
	return 'Enter the number of adult females in your family. -> adultFemales';
});
when('adultFemales', () => {
	return 'If you are in Saint Louis City press 1, for Saint Louis County press 2, for Saint Charles press 3. -> location';
});

when('gender', (input, person) => {
	if (input == 1) person.adultMales = 1;
	else person.adultFemales = 1;
	return 'If you are in Saint Louis City press 1, for Saint Louis County press 2, for Saint Charles press 3. -> location';
});

when('location', (input, person) => {

	person.location = {
		1: 'Saint Louis City',
		2: 'Saint Louis County',
		3: 'Saint Charles'
	}[person.location];

	var SQL = `SELECT agency_name, address FROM availability
		WHERE county = '${person.location}'
		AND abused_rmng_cap >= ${person.numAbused || 0}
		AND adult_fmale_rmng_cap >= ${person.adultFemales || 0}
		AND adult_male_rmng_cap >= ${person.adultMales || 0}
		AND children_rmng_cap >= ${person.numChildren || 0}
		ORDER BY (abused_rmng_cap + adult_fmale_rmng_cap + adult_male_rmng_cap + children_rmng_cap) DESC
		`;

	console.log(SQL);

	return http.post(dataUrl + 'select', {SQL}).then(data => {
		var options = person.options = data.data;
		console.log('options', options);
		if (options.length){
			return `There are ${options.length} options available. To make a reservation ${options.map((o, i) => `for ${o.agency_name} at ${o.address}, press ${i+1}`).join(', ')} -> reservation`;
		} else {
			return 'We are very sorry, but there are no shelters available that match your needs.';
		}
	});
});

when('reservation', (input, person) => {
	var options = person.options;
	var option = options[input - 1];
	if (option){
		var SQL = `INSERT INTO reservation (phone_number, chosen_shelter, adult_male_nbr, adult_fmale_nbr, children_nbr, abused_nbr) VALUES ('${person.phoneNumber}','${option.agency_name}',${person.adultMales || 0},${person.adultFemales || 0},${person.numChildren || 0},${person.numAbused || 0})`;
		console.log(SQL);
		return http.post(dataUrl + 'dml', {SQL: `DELETE FROM reservation WHERE phone_number='${person.phoneNumber}'`}).then(() => {
			return http.post(dataUrl + 'dml', {SQL}).then(() => {
				return `You are now reserved at ${option.agency_name} at ${option.address}. Please arrive promptly when the doors open. Again, the address is ${option.address}`;
			});
		});

	} else {
		return `To make a reservation ${options.map((o, i) => `for ${o}, press ${i+1}`).join(', ')} -> reservation`;
	}


});

app.listen(3000, () => console.log('Running...'));

//
//
// http.post('http://f364295e.ngrok.io/select', {
// 	SQL: `SELECT agency_name, address FROM availability
// 		WHERE county = 'Saint Louis City'
// 		AND abused_rmng_cap >= 0
// 		AND adult_fmale_rmng_cap >= 0
// 		AND adult_male_rmng_cap >= 1
// 		AND children_rmng_cap >= 0
// 		ORDER BY (abused_rmng_cap + adult_fmale_rmng_cap + adult_male_rmng_cap + children_rmng_cap) DESC
// 		`
// }).then(data => {
// 	console.log('received data', data);
// });
